// Perspective correction and scanner-style image enhancement.
import { outputSize } from './geometry.js';

export function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Decode an image blob into a canvas (EXIF orientation applied by the browser). */
export async function blobToCanvas(blob, maxLong = Infinity) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, maxLong / Math.max(bmp.width, bmp.height));
  const c = newCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.85) {
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('toBlob failed'))), type, quality));
}

const ROTATE = { 90: 'ROTATE_90_CLOCKWISE', 180: 'ROTATE_180', 270: 'ROTATE_90_COUNTERCLOCKWISE' };

/** Cut out the quad from source and flatten it to a rectangle, then rotate (0/90/180/270). */
export function warpQuad(cv, source, quad, rotation = 0) {
  const src = cv.imread(source);
  const { width, height } = outputSize(quad);
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, quad.flatMap((p) => [p.x, p.y]));
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height]);
  const M = cv.getPerspectiveTransform(from, to);
  const dst = new cv.Mat();
  try {
    cv.warpPerspective(src, dst, M, new cv.Size(width, height), cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    if (ROTATE[rotation]) cv.rotate(dst, dst, cv[ROTATE[rotation]]);
    const out = newCanvas(dst.cols, dst.rows);
    cv.imshow(out, dst);
    return out;
  } finally {
    [src, from, to, M, dst].forEach((m) => m.delete());
  }
}

/** Percentile of an 8-bit single-channel Mat. */
function percentiles(mat, ps) {
  const hist = new Uint32Array(256);
  const d = mat.data;
  for (let i = 0; i < d.length; i++) hist[d[i]]++;
  return ps.map((p) => {
    const target = d.length * p;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= target) return v;
    }
    return 255;
  });
}

/**
 * Normalised lightness: divides out uneven lighting so the paper becomes white,
 * stretches contrast and sharpens. Returns a new 8-bit Mat (caller deletes).
 */
function normalisedLightness(cv, L) {
  const long = Math.max(L.cols, L.rows);
  const s = Math.min(1, 512 / long);
  const small = new cv.Mat();
  const bg = new cv.Mat();
  const out = new cv.Mat();
  const blur = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(15, 15));
  try {
    // Estimate the paper's illumination: remove ink with a max filter, smooth with a median.
    cv.resize(L, small, new cv.Size(Math.round(L.cols * s), Math.round(L.rows * s)), 0, 0, cv.INTER_AREA);
    cv.dilate(small, small, kernel);
    cv.medianBlur(small, small, 15);
    cv.resize(small, bg, new cv.Size(L.cols, L.rows), 0, 0, cv.INTER_LINEAR);
    cv.divide(L, bg, out, 255);

    // Contrast stretch: paper -> white, ink -> black, slightly darker midtones.
    const [p1, p90] = percentiles(out, [0.01, 0.9]);
    const hi = Math.max(150, 0.94 * p90);
    const lo = Math.min(p1, hi - 100);
    const lut = new Uint8Array(256);
    for (let v = 0; v < 256; v++) {
      const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
      lut[v] = Math.round(255 * Math.pow(t, 1.2));
    }
    const d = out.data;
    for (let i = 0; i < d.length; i++) d[i] = lut[d[i]];

    // Unsharp mask.
    cv.GaussianBlur(out, blur, new cv.Size(0, 0), 1.0);
    cv.addWeighted(out, 1.5, blur, -0.5, 0, out);
    return out.clone();
  } finally {
    [small, bg, out, blur, kernel].forEach((m) => m.delete());
  }
}

/** Apply 'auto' | 'bw' | 'gray' | 'original' and return a new canvas. */
export function applyFilter(cv, canvas, filter) {
  if (filter === 'original') {
    const c = newCanvas(canvas.width, canvas.height);
    c.getContext('2d').drawImage(canvas, 0, 0);
    return c;
  }
  const rgba = cv.imread(canvas);
  const rgb = new cv.Mat();
  const lab = new cv.Mat();
  const ch = new cv.MatVector();
  let result = new cv.Mat();
  let Ln = null;
  try {
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
    cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);
    cv.split(lab, ch);
    const L = ch.get(0);
    Ln = normalisedLightness(cv, L);
    L.delete();

    if (filter === 'gray') {
      cv.cvtColor(Ln, result, cv.COLOR_GRAY2RGBA);
    } else if (filter === 'bw') {
      // Lighting is already normalised, so a global cut keeps thin strokes solid and
      // turns light colours (highlighter, stamps) white instead of black bars.
      const bin = new cv.Mat();
      cv.threshold(Ln, bin, 100, 255, cv.THRESH_BINARY);
      if (Math.max(Ln.cols, Ln.rows) > 1200) cv.medianBlur(bin, bin, 3);
      cv.cvtColor(bin, result, cv.COLOR_GRAY2RGBA);
      bin.delete();
    } else {
      // auto: keep colour, boost saturation slightly.
      const a = ch.get(1);
      const b = ch.get(2);
      a.convertTo(a, -1, 1.15, -128 * 0.15);
      b.convertTo(b, -1, 1.15, -128 * 0.15);
      const merged = new cv.MatVector();
      merged.push_back(Ln);
      merged.push_back(a);
      merged.push_back(b);
      cv.merge(merged, lab);
      cv.cvtColor(lab, rgb, cv.COLOR_Lab2RGB);
      cv.cvtColor(rgb, result, cv.COLOR_RGB2RGBA);
      [a, b, merged].forEach((m) => m.delete());
    }
    const out = newCanvas(result.cols, result.rows);
    cv.imshow(out, result);
    return out;
  } finally {
    [rgba, rgb, lab, ch, result].forEach((m) => m.delete());
    Ln?.delete();
  }
}

/** Full pipeline for one page: decode, flatten, rotate, filter, encode JPEG. */
export async function renderPage(cv, sourceBlob, quad, rotation, filter) {
  const src = await blobToCanvas(sourceBlob);
  const flat = warpQuad(cv, src, quad, rotation);
  const out = applyFilter(cv, flat, filter);
  const blob = await canvasToBlob(out, 'image/jpeg', 0.85);
  return { blob, width: out.width, height: out.height };
}
