import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  orderCorners, quadArea, isConvex, outputSize, pageSizeMm, smoothQuad,
  quadDistance, createStabilityTracker, scaleQuad, fullFrameQuad, defaultFileName,
} from '../../scanner/js/geometry.js';

const P = (x, y) => ({ x, y });

test('orderCorners sorts mixed points into TL, TR, BR, BL', () => {
  const r = orderCorners([P(100, 90), P(0, 0), P(0, 100), P(110, 5)]);
  assert.deepEqual(r, [P(0, 0), P(110, 5), P(100, 90), P(0, 100)]);
});

test('orderCorners fixes crossed (bow-tie) input', () => {
  const r = orderCorners([P(0, 0), P(100, 90), P(110, 5), P(0, 100)]);
  assert.deepEqual(r, [P(0, 0), P(110, 5), P(100, 90), P(0, 100)]);
});

test('quadArea of 100x50 rectangle', () => {
  assert.equal(quadArea([P(0, 0), P(100, 0), P(100, 50), P(0, 50)]), 5000);
});

test('isConvex true for rectangle, false for bow-tie', () => {
  assert.equal(isConvex([P(0, 0), P(100, 0), P(100, 50), P(0, 50)]), true);
  assert.equal(isConvex([P(0, 0), P(100, 50), P(100, 0), P(0, 50)]), false);
});

test('outputSize scales so long side is 2480', () => {
  const s = outputSize([P(0, 0), P(2000, 0), P(2000, 2828), P(0, 2828)]);
  assert.ok(Math.abs(s.width - 1754) <= 1, `width ${s.width}`);
  assert.equal(s.height, 2480);
});

test('outputSize does not upscale small quads', () => {
  assert.deepEqual(outputSize([P(0, 0), P(500, 0), P(500, 700), P(0, 700)]), { width: 500, height: 700 });
});

test('outputSize uses the longer of opposite edges', () => {
  const s = outputSize([P(10, 0), P(90, 0), P(100, 200), P(0, 200)]);
  assert.deepEqual(s, { width: 100, height: 200 });
});

test('pageSizeMm: A4 portrait, A4 landscape, receipt, square', () => {
  assert.deepEqual(pageSizeMm(1754, 2480), { w: 210, h: 297 });
  assert.deepEqual(pageSizeMm(2480, 1754), { w: 297, h: 210 });
  assert.deepEqual(pageSizeMm(600, 2400), { w: 210, h: 840 });
  assert.deepEqual(pageSizeMm(1000, 1000), { w: 210, h: 210 });
});

test('pageSizeMm: wide non-A4 keeps height 210', () => {
  assert.deepEqual(pageSizeMm(2000, 1000), { w: 420, h: 210 });
});

test('smoothQuad blends towards next; null prev returns next', () => {
  const a = [P(0, 0), P(10, 0), P(10, 10), P(0, 10)];
  const b = [P(10, 10), P(20, 10), P(20, 20), P(10, 20)];
  assert.deepEqual(smoothQuad(null, b), b);
  assert.deepEqual(smoothQuad(a, b, 0.5), [P(5, 5), P(15, 5), P(15, 15), P(5, 15)]);
});

test('quadDistance is max corner distance', () => {
  const a = [P(0, 0), P(10, 0), P(10, 10), P(0, 10)];
  const b = [P(3, 4), P(10, 0), P(10, 10), P(0, 10)];
  assert.equal(quadDistance(a, b), 5);
});

test('stability tracker reaches 1 after duration, resets on jump and null', () => {
  const q = [P(0, 0), P(100, 0), P(100, 100), P(0, 100)];
  const t = createStabilityTracker({ tolerance: 20, durationMs: 1000 });
  assert.equal(t.update(q, 0), 0);
  assert.equal(t.update(q, 500), 0.5);
  assert.equal(t.update(q, 1000), 1);
  const jumped = q.map((p) => P(p.x + 50, p.y));
  assert.equal(t.update(jumped, 1100), 0);
  assert.equal(t.update(null, 1200), 0);
  t.update(q, 2000);
  t.reset();
  assert.equal(t.update(q, 2500), 0);
});

test('stability tracker tolerates small jitter', () => {
  const q = [P(0, 0), P(100, 0), P(100, 100), P(0, 100)];
  const t = createStabilityTracker({ tolerance: 20, durationMs: 1000 });
  t.update(q, 0);
  assert.equal(t.update(q.map((p) => P(p.x + 5, p.y)), 1000), 1);
});

test('scaleQuad and fullFrameQuad', () => {
  assert.deepEqual(scaleQuad([P(1, 2), P(3, 2), P(3, 4), P(1, 4)], 2, 3), [P(2, 6), P(6, 6), P(6, 12), P(2, 12)]);
  assert.deepEqual(fullFrameQuad(640, 480), [P(0, 0), P(640, 0), P(640, 480), P(0, 480)]);
});

test('defaultFileName formats date', () => {
  assert.equal(defaultFileName(new Date(2026, 10, 23, 14, 5)), 'Scan_2026-11-23_14-05.pdf');
});
