// "Seiten": page grid (reorder, open), file name and PDF export/share.
import { defaultFileName } from './geometry.js';
import { listPages, reorder, clearPages, getMeta, setMeta } from './store.js';
import { buildPdf } from './pdf.js';
import { $, showScreen, onScreenChange, confirmDialog, toast } from './ui.js';
import { openReview } from './review.js';

const LONG_PRESS_MS = 350;

let pages = [];
let thumbUrls = [];
let pdfCache = { key: '', promise: null };

/* ---------- file name ---------- */

function cleanName(raw) {
  let name = (raw || '').replace(/[\\/:*?"<>|]+/g, '-').trim();
  if (!name) name = defaultFileName(new Date());
  if (!/\.pdf$/i.test(name)) name += '.pdf';
  return name;
}

async function loadFileName() {
  const saved = await getMeta('fileName');
  $('fileName').value = saved || defaultFileName(new Date());
}

/* ---------- PDF (pre-built so iOS share runs inside the tap) ---------- */

function pdfKey() {
  return pages.map((p) => `${p.id}:${p.processed.size}:${p.width}x${p.height}`).join('|') + `#${cleanName($('fileName').value)}`;
}

function prepPdf() {
  const key = pdfKey();
  if (!pages.length) return null;
  if (pdfCache.key !== key) {
    const title = cleanName($('fileName').value).replace(/\.pdf$/i, '');
    const promise = buildPdf(pages.map((p) => ({ blob: p.processed, width: p.width, height: p.height })), title);
    promise.catch(() => {});
    pdfCache = { key, promise, value: null };
    promise.then((v) => {
      if (pdfCache.promise === promise) pdfCache.value = v;
    });
  }
  return pdfCache;
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function share() {
  if (!pages.length) return;
  const name = cleanName($('fileName').value);
  $('fileName').value = name;
  await setMeta('fileName', name);
  const cache = prepPdf();
  const btn = $('shareBtn');
  btn.disabled = true;
  btn.textContent = 'PDF wird erstellt…';
  let blob;
  try {
    blob = cache.value || (await cache.promise);
  } catch (e) {
    console.error(e);
    toast('Das PDF konnte nicht erstellt werden.');
    return;
  } finally {
    btn.disabled = false;
    btn.textContent = 'PDF teilen';
  }
  const file = new File([blob], name, { type: 'application/pdf' });
  let done = false;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name.replace(/\.pdf$/i, '') });
      done = true;
    } catch (e) {
      if (e?.name === 'AbortError') return;
      if (e?.name === 'NotAllowedError') {
        toast('Das PDF ist bereit – tippe nochmal auf „PDF teilen“.');
        return;
      }
      download(file);
      done = true;
    }
  } else {
    download(file);
    done = true;
  }
  if (done && (await confirmDialog('PDF erstellt. Seiten für einen neuen Scan löschen?', 'Löschen'))) {
    await resetSession();
  }
}

async function resetSession() {
  await clearPages();
  await setMeta('fileName', null);
  document.dispatchEvent(new CustomEvent('pages-dirty'));
  showScreen('camera');
}

/* ---------- list ---------- */

async function move(index, delta) {
  const ids = pages.map((p) => p.id);
  const j = index + delta;
  if (j < 0 || j >= ids.length) return;
  [ids[index], ids[j]] = [ids[j], ids[index]];
  await reorder(ids);
  document.dispatchEvent(new CustomEvent('pages-dirty'));
}

function render() {
  const list = $('pageList');
  thumbUrls.forEach((u) => URL.revokeObjectURL(u));
  thumbUrls = [];
  list.textContent = '';
  if (!pages.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Noch keine Seiten. Tippe auf „＋ Seite“, um zu scannen.';
    list.append(li);
  }
  pages.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'page-item';
    li.dataset.index = String(i);
    const url = URL.createObjectURL(p.processed);
    thumbUrls.push(url);
    li.innerHTML = `
      <button class="page-thumb" aria-label="Seite ${i + 1} bearbeiten"><img alt="" src="${url}"></button>
      <div class="page-meta">
        <span>Seite ${i + 1}</span>
        <span class="move-btns">
          <button aria-label="Seite ${i + 1} nach vorne" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button aria-label="Seite ${i + 1} nach hinten" ${i === pages.length - 1 ? 'disabled' : ''}>↓</button>
        </span>
      </div>`;
    const [up, down] = li.querySelectorAll('.move-btns button');
    up.addEventListener('click', () => move(i, -1));
    down.addEventListener('click', () => move(i, 1));
    bindThumb(li.querySelector('.page-thumb'), i, p.id);
    list.append(li);
  });
  $('shareBtn').disabled = pages.length === 0;
  $('clearBtn').disabled = pages.length === 0;
}

/** Tap opens the page; long-press then drag reorders. */
function bindThumb(thumb, index, id) {
  let timer = 0;
  let dragging = false;
  let start = null;
  let target = -1;
  const items = () => [...document.querySelectorAll('.page-item')];
  const clearMarks = () => items().forEach((el) => el.classList.remove('drop-target', 'dragging'));

  thumb.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY };
    dragging = false;
    target = -1;
    timer = setTimeout(() => {
      dragging = true;
      thumb.setPointerCapture?.(e.pointerId);
      thumb.closest('.page-item').classList.add('dragging');
      navigator.vibrate?.(20);
    }, LONG_PRESS_MS);
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!start) return;
    if (!dragging) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
        clearTimeout(timer);
        start = null;
      }
      return;
    }
    e.preventDefault();
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.page-item');
    items().forEach((el) => el.classList.toggle('drop-target', el === over && Number(el.dataset.index) !== index));
    target = over ? Number(over.dataset.index) : -1;
  });
  const finish = async () => {
    clearTimeout(timer);
    const wasDragging = dragging;
    const startedHere = start;
    dragging = false;
    start = null;
    clearMarks();
    if (wasDragging) {
      if (target >= 0 && target !== index) {
        const ids = pages.map((p) => p.id);
        const [moved] = ids.splice(index, 1);
        ids.splice(target, 0, moved);
        await reorder(ids);
        document.dispatchEvent(new CustomEvent('pages-dirty'));
      }
    } else if (startedHere) {
      openReview(id);
    }
  };
  thumb.addEventListener('pointerup', finish);
  thumb.addEventListener('pointercancel', () => {
    clearTimeout(timer);
    dragging = false;
    start = null;
    clearMarks();
  });
  thumb.addEventListener('contextmenu', (e) => e.preventDefault());
}

/* ---------- bindings ---------- */

export function initPages() {
  document.addEventListener('pages-changed', (e) => {
    pages = e.detail;
    render();
    if (document.getElementById('pages').classList.contains('active')) prepPdf();
  });
  onScreenChange(async (name) => {
    if (name !== 'pages') return;
    pages = await listPages();
    render();
    if (!pages.length) return;
    await loadFileName();
    prepPdf();
  });
  $('pagesBack').addEventListener('click', () => showScreen('camera'));
  $('clearBtn').addEventListener('click', async () => {
    if (await confirmDialog('Alle Seiten löschen?', 'Alle löschen')) await resetSession();
  });
  $('shareBtn').addEventListener('click', share);
  $('fileName').addEventListener('change', () => {
    const name = cleanName($('fileName').value);
    $('fileName').value = name;
    setMeta('fileName', name);
    prepPdf();
  });
}
