// "Seite prüfen": drag corners (with loupe), rotate, choose filter, retake or delete a page.
import { loadCv } from './cv.js';
import { orderCorners, fullFrameQuad } from './geometry.js';
import { blobToCanvas, warpQuad, applyFilter, renderFromCanvas, canvasToBlob } from './enhance.js';
import { listPages, putPage, deletePage } from './store.js';
import { $, showScreen, confirmDialog, toast, session } from './ui.js';

const DISPLAY_LONG_SIDE = 1600;
const PREVIEW_LONG_SIDE = 260;
const LOUPE_ZOOM = 2.5;
const SVG_NS = 'http://www.w3.org/2000/svg';

const ed = {
  page: null,
  full: null, // decoded original (full resolution)
  view: null, // downscaled canvas for display/loupe
  viewScale: 1, // view px per original px
  quad: null, // in original px
  rotation: 0,
  filter: 'auto',
  fit: { scale: 1, x: 0, y: 0 }, // view px -> stage px
  dragging: -1,
  previewUrls: [],
  previewTimer: 0,
};

/* ---------- coordinates ---------- */

const toStage = (p) => ({
  x: ed.fit.x + p.x * ed.viewScale * ed.fit.scale,
  y: ed.fit.y + p.y * ed.viewScale * ed.fit.scale,
});
const toOriginal = (sx, sy) => ({
  x: Math.min(ed.full.width, Math.max(0, (sx - ed.fit.x) / (ed.viewScale * ed.fit.scale))),
  y: Math.min(ed.full.height, Math.max(0, (sy - ed.fit.y) / (ed.viewScale * ed.fit.scale))),
});

function layout() {
  const stage = $('editorStage');
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const v = ed.view;
  const scale = Math.min(sw / v.width, sh / v.height);
  ed.fit = { scale, x: (sw - v.width * scale) / 2, y: (sh - v.height * scale) / 2 };
  const c = $('editorCanvas');
  c.style.width = `${v.width * scale}px`;
  c.style.height = `${v.height * scale}px`;
  c.style.left = `${ed.fit.x}px`;
  c.style.top = `${ed.fit.y}px`;
  drawQuad();
}

/* ---------- drawing ---------- */

function buildHandles() {
  const svg = $('editorSvg');
  svg.querySelectorAll('.handle, .handle-hit').forEach((n) => n.remove());
  for (let i = 0; i < 4; i++) {
    const hit = document.createElementNS(SVG_NS, 'circle');
    hit.setAttribute('class', 'handle-hit');
    hit.setAttribute('r', '26');
    hit.dataset.index = String(i);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'handle');
    dot.setAttribute('r', '11');
    dot.style.pointerEvents = 'none';
    svg.append(dot, hit);
    hit.addEventListener('pointerdown', startDrag);
  }
}

function drawQuad() {
  if (!ed.quad) return;
  const pts = ed.quad.map(toStage);
  $('editorQuad').setAttribute('points', pts.map((p) => `${p.x},${p.y}`).join(' '));
  const dots = $('editorSvg').querySelectorAll('.handle');
  const hits = $('editorSvg').querySelectorAll('.handle-hit');
  pts.forEach((p, i) => {
    for (const el of [dots[i], hits[i]]) {
      el.setAttribute('cx', p.x);
      el.setAttribute('cy', p.y);
    }
  });
}

function drawLoupe(sx, sy) {
  const loupe = $('loupe');
  const lc = $('loupeCanvas');
  const ctx = lc.getContext('2d');
  const size = lc.width;
  const o = toOriginal(sx, sy);
  const vx = o.x * ed.viewScale;
  const vy = o.y * ed.viewScale;
  const src = size / (LOUPE_ZOOM * ed.fit.scale);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(ed.view, vx - src / 2, vy - src / 2, src, src, 0, 0, size, size);
  ctx.strokeStyle = '#2f7bff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2, size / 2 - 14);
  ctx.lineTo(size / 2, size / 2 + 14);
  ctx.moveTo(size / 2 - 14, size / 2);
  ctx.lineTo(size / 2 + 14, size / 2);
  ctx.stroke();
  // Keep the loupe above the finger, flip below when near the top.
  const top = sy - 150 < 0 ? sy + 40 : sy - 150;
  loupe.style.left = `${Math.min(Math.max(sx - size / 2, 0), $('editorStage').clientWidth - size)}px`;
  loupe.style.top = `${top}px`;
  loupe.hidden = false;
}

/* ---------- dragging ---------- */

function stagePoint(e) {
  const r = $('editorStage').getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function startDrag(e) {
  e.preventDefault();
  ed.dragging = Number(e.currentTarget.dataset.index);
  e.currentTarget.setPointerCapture?.(e.pointerId);
  const p = stagePoint(e);
  drawLoupe(p.x, p.y);
}

function moveDrag(e) {
  if (ed.dragging < 0) return;
  e.preventDefault();
  const p = stagePoint(e);
  ed.quad[ed.dragging] = toOriginal(p.x, p.y);
  drawQuad();
  drawLoupe(p.x, p.y);
}

function endDrag() {
  if (ed.dragging < 0) return;
  ed.dragging = -1;
  $('loupe').hidden = true;
  ed.quad = orderCorners(ed.quad);
  drawQuad();
  schedulePreviews();
}

/* ---------- filter previews ---------- */

function setFilterUi() {
  document.querySelectorAll('#filterBar .filter').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.filter === ed.filter));
  });
}

function schedulePreviews() {
  clearTimeout(ed.previewTimer);
  ed.previewTimer = setTimeout(updatePreviews, 60);
}

async function updatePreviews() {
  const cv = await loadCv();
  const s = Math.min(1, PREVIEW_LONG_SIDE / Math.max(ed.view.width, ed.view.height));
  const scale = ed.viewScale * s;
  const small = document.createElement('canvas');
  small.width = Math.round(ed.view.width * s);
  small.height = Math.round(ed.view.height * s);
  small.getContext('2d').drawImage(ed.view, 0, 0, small.width, small.height);
  const q = ed.quad.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  const flat = warpQuad(cv, small, q, ed.rotation);
  ed.previewUrls.forEach((u) => URL.revokeObjectURL(u));
  ed.previewUrls = [];
  for (const btn of document.querySelectorAll('#filterBar .filter')) {
    const out = applyFilter(cv, flat, btn.dataset.filter);
    const url = URL.createObjectURL(await canvasToBlob(out, 'image/jpeg', 0.8));
    ed.previewUrls.push(url);
    btn.querySelector('img').src = url;
  }
}

/* ---------- open / save ---------- */

export async function openReview(id) {
  const page = (await listPages()).find((p) => p.id === id);
  if (!page) return;
  ed.page = page;
  ed.quad = page.quad.map((p) => ({ ...p }));
  ed.rotation = page.rotation || 0;
  ed.filter = page.filter || 'auto';
  ed.full = await blobToCanvas(page.original);
  const s = Math.min(1, DISPLAY_LONG_SIDE / Math.max(ed.full.width, ed.full.height));
  ed.viewScale = s;
  const c = $('editorCanvas');
  c.width = Math.round(ed.full.width * s);
  c.height = Math.round(ed.full.height * s);
  c.getContext('2d').drawImage(ed.full, 0, 0, c.width, c.height);
  ed.view = c;
  const all = await listPages();
  $('reviewTitle').textContent = `Seite ${all.findIndex((p) => p.id === id) + 1} von ${all.length}`;
  setFilterUi();
  showScreen('review');
  buildHandles();
  layout();
  schedulePreviews();
}

function busy(on) {
  const btn = $('reviewDone');
  btn.disabled = on;
  btn.textContent = on ? 'Speichert…' : 'Fertig';
}

async function save() {
  busy(true);
  try {
    const cv = await loadCv();
    const r = await renderFromCanvas(cv, ed.full, ed.quad, ed.rotation, ed.filter);
    await putPage({
      ...ed.page, quad: ed.quad, rotation: ed.rotation, filter: ed.filter,
      processed: r.blob, width: r.width, height: r.height,
    });
    document.dispatchEvent(new CustomEvent('pages-dirty'));
    close();
  } catch (e) {
    console.error(e);
    toast('Die Seite konnte nicht gespeichert werden.');
  } finally {
    busy(false);
  }
}

function close() {
  ed.full = null;
  showScreen('pages');
}

/* ---------- bindings ---------- */

export function initReview() {
  const stage = $('editorStage');
  stage.addEventListener('pointermove', moveDrag);
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', () => ed.view && document.getElementById('review').classList.contains('active') && layout());

  $('reviewBack').addEventListener('click', close);
  $('reviewDone').addEventListener('click', save);
  $('filterBar').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    ed.filter = btn.dataset.filter;
    setFilterUi();
  });
  $('rotateBtn').addEventListener('click', () => {
    ed.rotation = (ed.rotation + 90) % 360;
    schedulePreviews();
    toast(`Gedreht: ${ed.rotation}°`, 1000);
  });
  $('resetCornersBtn').addEventListener('click', () => {
    ed.quad = fullFrameQuad(ed.full.width, ed.full.height);
    drawQuad();
    schedulePreviews();
  });
  $('retakeBtn').addEventListener('click', () => {
    session.retakeId = ed.page.id;
    toast('Nimm die Seite neu auf.');
    showScreen('camera');
  });
  $('deleteBtn').addEventListener('click', async () => {
    if (!(await confirmDialog('Diese Seite löschen?', 'Löschen'))) return;
    await deletePage(ed.page.id);
    document.dispatchEvent(new CustomEvent('pages-dirty'));
    close();
  });
  document.addEventListener('open-review', (e) => openReview(e.detail));
}
