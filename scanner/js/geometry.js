// Pure geometry and page helpers (no DOM, no OpenCV).
// Point = {x, y}; Quad = [TL, TR, BR, BL].

const A4_RATIO = Math.SQRT2;
const A4_TOLERANCE = 0.1;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Order 4 arbitrary points as top-left, top-right, bottom-right, bottom-left. */
export function orderCorners(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / 4;
  const cy = points.reduce((s, p) => s + p.y, 0) / 4;
  const sorted = points
    .map((p) => ({ x: p.x, y: p.y }))
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  let start = 0;
  for (let i = 1; i < 4; i++) {
    if (sorted[i].x + sorted[i].y < sorted[start].x + sorted[start].y) start = i;
  }
  return [0, 1, 2, 3].map((i) => sorted[(start + i) % 4]);
}

/** Polygon area (shoelace), always positive. */
export function quadArea(q) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** True if the quad (in the given order) is strictly convex. */
export function isConvex(q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const c = q[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross === 0) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** Output pixel size of the flattened page; never upscales. */
export function outputSize(q, maxLong = 2480) {
  const [tl, tr, br, bl] = q;
  const w = Math.max(dist(tl, tr), dist(bl, br));
  const h = Math.max(dist(tl, bl), dist(tr, br));
  const scale = Math.min(1, maxLong / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** PDF page size in mm: A4 if close to A4 ratio, else short side 210 mm with true ratio. */
export function pageSizeMm(width, height) {
  const portrait = height >= width;
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const ratio = long / short;
  if (Math.abs(ratio / A4_RATIO - 1) <= A4_TOLERANCE) {
    return portrait ? { w: 210, h: 297 } : { w: 297, h: 210 };
  }
  const longMm = Math.round(210 * ratio);
  return portrait ? { w: 210, h: longMm } : { w: longMm, h: 210 };
}

/** Exponential smoothing of quad corners. */
export function smoothQuad(prev, next, alpha = 0.5) {
  if (!prev) return next.map((p) => ({ x: p.x, y: p.y }));
  return next.map((p, i) => ({
    x: prev[i].x + (p.x - prev[i].x) * alpha,
    y: prev[i].y + (p.y - prev[i].y) * alpha,
  }));
}

/** Largest distance between corresponding corners. */
export function quadDistance(a, b) {
  return Math.max(...a.map((p, i) => dist(p, b[i])));
}

/** Tracks how long the detected quad has stayed still; update() returns progress 0..1. */
export function createStabilityTracker({ tolerance, durationMs }) {
  let anchor = null;
  let since = 0;
  return {
    update(q, now) {
      if (!q) {
        anchor = null;
        return 0;
      }
      if (!anchor || quadDistance(anchor, q) > tolerance) {
        anchor = q;
        since = now;
        return 0;
      }
      return Math.min(1, (now - since) / durationMs);
    },
    reset() {
      anchor = null;
    },
  };
}

export function scaleQuad(q, sx, sy) {
  return q.map((p) => ({ x: p.x * sx, y: p.y * sy }));
}

export function fullFrameQuad(w, h) {
  return [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
}

export function defaultFileName(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `Scan_${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}-${p(date.getMinutes())}.pdf`;
}
