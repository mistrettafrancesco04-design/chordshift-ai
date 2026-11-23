// Entry point: camera screen with live document detection and auto capture.
import { loadCv } from './cv.js';
import { detectQuad } from './detect.js';
import {
  smoothQuad, createStabilityTracker, scaleQuad, fullFrameQuad, quadDistance,
} from './geometry.js';
import { startCamera, stopCamera, grabFrame, torchSupported, setTorch, CameraError } from './camera.js';
import { blobToCanvas, canvasToBlob, renderFromCanvas } from './enhance.js';
import { listPages, putPage } from './store.js';
import { $, showScreen, currentScreen, onScreenChange, toast, newId, createQueue, session } from './ui.js';
import { initReview, openReview } from './review.js';
import { initPages } from './pages.js';

const DETECT_INTERVAL_MS = 120;
const DETECT_LONG_SIDE = 480;
const STABLE_MS = 1000;
const RING_LENGTH = 226.2;

const video = $('video');
const state = {
  cv: null,
  track: null,
  quad: null,
  misses: 0,
  auto: true,
  armed: true,
  lastShotQuad: null,
  lastDetect: 0,
  tracker: null,
  pages: [],
  thumbUrl: null,
};

const enqueue = createQueue((busy) => ($('busy').hidden = !busy));
const small = document.createElement('canvas');
const smallCtx = small.getContext('2d', { willReadFrequently: true });

/* ---------- pages badge ---------- */

export async function refreshPages() {
  state.pages = await listPages();
  $('pageCount').textContent = String(state.pages.length);
  $('doneBtn').disabled = state.pages.length === 0;
  const last = state.pages[state.pages.length - 1];
  if (state.thumbUrl) URL.revokeObjectURL(state.thumbUrl);
  state.thumbUrl = last ? URL.createObjectURL(last.processed) : null;
  if (state.thumbUrl) $('lastThumb').src = state.thumbUrl;
  else $('lastThumb').removeAttribute('src');
  document.dispatchEvent(new CustomEvent('pages-changed', { detail: state.pages }));
  return state.pages;
}

/* ---------- detection ---------- */

function detectOn(canvasOrVideo, w, h, longSide = DETECT_LONG_SIDE) {
  const s = Math.min(1, longSide / Math.max(w, h));
  small.width = Math.round(w * s);
  small.height = Math.round(h * s);
  smallCtx.drawImage(canvasOrVideo, 0, 0, small.width, small.height);
  const q = detectQuad(state.cv, smallCtx.getImageData(0, 0, small.width, small.height));
  return q ? scaleQuad(q, w / small.width, h / small.height) : null;
}

function setHint(text) {
  const el = $('hint');
  if (el.textContent !== text) el.textContent = text;
}

function renderOverlay(progress) {
  const poly = $('quad');
  if (state.quad) {
    poly.setAttribute('points', state.quad.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    poly.classList.add('visible');
  } else {
    poly.classList.remove('visible');
  }
  poly.classList.toggle('locked', progress > 0.5);
  $('ringProgress').style.strokeDashoffset = String(RING_LENGTH * (1 - progress));

  if (!state.quad) setHint('Halte die Kamera über das Dokument');
  else if (!state.auto) setHint('Dokument erkannt');
  else if (!state.armed) setHint('Aufgenommen – nächste Seite hinlegen');
  else setHint('Ruhig halten…');
}

function tick(now) {
  requestAnimationFrame(tick);
  if (currentScreen() !== 'camera' || !state.cv || !video.videoWidth || video.readyState < 2) return;
  if (now - state.lastDetect < DETECT_INTERVAL_MS) return;
  state.lastDetect = now;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const overlay = $('overlay');
  const vb = `0 0 ${vw} ${vh}`;
  if (overlay.getAttribute('viewBox') !== vb) {
    overlay.setAttribute('viewBox', vb);
    state.tracker = createStabilityTracker({ tolerance: 0.02 * Math.max(vw, vh), durationMs: STABLE_MS });
  }

  const found = detectOn(video, vw, vh);
  if (found) {
    state.quad = smoothQuad(state.quad, found, 0.5);
    state.misses = 0;
  } else if (++state.misses > 3) {
    state.quad = null;
  }

  let progress = 0;
  if (state.auto) {
    if (!state.armed) {
      // Re-arm only once a new sheet is in view (previous one removed or moved clearly).
      const moved = state.quad && state.lastShotQuad
        && quadDistance(state.quad, state.lastShotQuad) > 0.12 * Math.max(vw, vh);
      if (!state.quad || moved) {
        state.armed = true;
        state.tracker.reset();
      }
    } else {
      progress = state.tracker.update(found ? state.quad : null, now);
      if (progress >= 1) {
        capture(true);
        progress = 0;
      }
    }
  }
  renderOverlay(progress);
}

/* ---------- capture ---------- */

function flash() {
  const f = $('flash');
  f.classList.remove('on');
  void f.offsetWidth;
  f.classList.add('on');
}

async function addPageFromCanvas(canvas, quadHint) {
  const refined = detectOn(canvas, canvas.width, canvas.height, 640);
  const quad = refined || quadHint || fullFrameQuad(canvas.width, canvas.height);
  const original = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  const r = await renderFromCanvas(state.cv, canvas, quad, 0, 'auto');
  const replaceId = session.retakeId;
  session.retakeId = null;
  const page = {
    id: replaceId || newId(), original, quad, rotation: 0, filter: 'auto',
    processed: r.blob, width: r.width, height: r.height, createdAt: Date.now(),
  };
  await putPage(page);
  await refreshPages();
  if (replaceId) openReview(page.id);
  return page;
}

function capture(isAuto = false) {
  if (!state.cv || !video.videoWidth) return;
  flash();
  navigator.vibrate?.(30);
  const frame = grabFrame(video);
  const quadAtShot = state.quad;
  if (isAuto) {
    state.armed = false;
    state.lastShotQuad = state.quad;
    state.tracker?.reset();
  }
  enqueue(() => addPageFromCanvas(frame, quadAtShot)).catch((e) => {
    console.error(e);
    toast('Die Seite konnte nicht verarbeitet werden.');
  });
}

/* ---------- gallery import ---------- */

async function importFiles(files) {
  const added = [];
  for (const file of files) {
    try {
      const canvas = await blobToCanvas(file, 4096);
      added.push(await enqueue(() => addPageFromCanvas(canvas, null)));
    } catch (e) {
      console.error(e);
      toast('Ein Bild konnte nicht geladen werden.');
    }
  }
  if (added.length) document.dispatchEvent(new CustomEvent('open-review', { detail: added[0].id }));
}

/* ---------- camera lifecycle ---------- */

const ERRORS = {
  insecure: 'Die Kamera funktioniert nur über eine sichere Verbindung (https).',
  denied: 'Kein Kamerazugriff. Erlaube die Kamera in den Safari-Einstellungen oder nutze die Galerie.',
  unavailable: 'Keine Kamera gefunden. Du kannst Fotos aus der Galerie importieren.',
};

async function startLive() {
  $('cameraError').hidden = true;
  try {
    const { track } = await startCamera(video);
    state.track = track;
    $('torchBtn').hidden = !torchSupported(track);
    $('shutterBtn').disabled = false;
    setHint('Halte die Kamera über das Dokument');
  } catch (e) {
    const code = e instanceof CameraError ? e.code : 'unavailable';
    $('cameraErrorText').textContent = ERRORS[code];
    $('cameraError').hidden = false;
    $('shutterBtn').disabled = true;
    setHint('');
  }
}

function bindCamera() {
  $('shutterBtn').addEventListener('click', () => capture(false));
  $('autoBtn').addEventListener('click', () => {
    state.auto = !state.auto;
    state.armed = true;
    state.tracker?.reset();
    $('autoBtn').setAttribute('aria-pressed', String(state.auto));
    toast(state.auto ? 'Automatisches Auslösen an' : 'Automatisches Auslösen aus', 1400);
  });
  $('torchBtn').addEventListener('click', async () => {
    const on = $('torchBtn').getAttribute('aria-pressed') !== 'true';
    if (await setTorch(state.track, on)) $('torchBtn').setAttribute('aria-pressed', String(on));
  });
  $('galleryBtn').addEventListener('click', () => $('galleryInput').click());
  $('galleryInput').addEventListener('change', (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length) importFiles(files);
  });
  $('doneBtn').addEventListener('click', () => showScreen('pages'));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCamera();
      $('torchBtn').setAttribute('aria-pressed', 'false');
    } else if (currentScreen() === 'camera') startLive();
  });
  onScreenChange((name) => {
    if (name === 'camera') {
      state.quad = null;
      state.armed = true;
      state.tracker?.reset();
      if (!video.srcObject || !video.srcObject.active) startLive();
    }
  });
}

/* ---------- boot ---------- */

async function boot() {
  bindCamera();
  initReview();
  initPages();
  document.addEventListener('pages-dirty', () => refreshPages());
  const camera = startLive();
  await refreshPages();
  try {
    state.cv = await loadCv();
  } catch (e) {
    $('loading').querySelector('p').textContent = 'Der Scanner konnte nicht geladen werden. Bitte Seite neu laden.';
    return;
  }
  $('loading').classList.add('done');
  await camera;
  requestAnimationFrame(tick);
  window.dispatchEvent(new CustomEvent('scanner-ready', { detail: { cv: state.cv } }));
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e));
}

boot();
