// Finds the document (largest convex quadrilateral) in an image using OpenCV.
import { orderCorners, isConvex, quadArea } from './geometry.js';

const BORDER_MARGIN = 2;

function median(cv, gray) {
  const hist = new cv.Mat();
  const mask = new cv.Mat();
  const srcVec = new cv.MatVector();
  srcVec.push_back(gray);
  cv.calcHist(srcVec, [0], mask, hist, [256], [0, 256]);
  const half = (gray.rows * gray.cols) / 2;
  let acc = 0;
  let m = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist.data32F[i];
    if (acc >= half) {
      m = i;
      break;
    }
  }
  hist.delete();
  mask.delete();
  srcVec.delete();
  return m;
}

/** Picks the best quad among contours of a binary edge/threshold image. */
function bestQuad(cv, binary, width, height, minArea) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let best = null;
  let bestArea = 0;
  try {
    cv.findContours(binary, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const area = Math.abs(cv.contourArea(c));
      if (area < minArea) {
        c.delete();
        continue;
      }
      const hull = new cv.Mat();
      cv.convexHull(c, hull, false, true);
      const approx = new cv.Mat();
      const peri = cv.arcLength(hull, true);
      for (const eps of [0.02, 0.03, 0.04, 0.05]) {
        cv.approxPolyDP(hull, approx, eps * peri, true);
        if (approx.rows <= 4) break;
      }
      if (approx.rows === 4) {
        const pts = [];
        for (let k = 0; k < 4; k++) pts.push({ x: approx.data32S[k * 2], y: approx.data32S[k * 2 + 1] });
        const q = orderCorners(pts);
        const qa = quadArea(q);
        const touchesBorder = q.some(
          (p) => p.x <= BORDER_MARGIN || p.y <= BORDER_MARGIN || p.x >= width - 1 - BORDER_MARGIN || p.y >= height - 1 - BORDER_MARGIN,
        );
        if (!touchesBorder && isConvex(q) && qa >= minArea && qa > bestArea) {
          best = q;
          bestArea = qa;
        }
      }
      hull.delete();
      approx.delete();
      c.delete();
    }
  } finally {
    contours.delete();
    hierarchy.delete();
  }
  return best;
}

/**
 * @param cv OpenCV
 * @param {ImageData} imageData  (should already be downscaled, long side ~500px)
 * @returns {Array<{x:number,y:number}>|null} quad in imageData pixel coordinates
 */
export function detectQuad(cv, imageData, { minAreaRatio = 0.15 } = {}) {
  const { width, height } = imageData;
  const minArea = width * height * minAreaRatio;
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

    // Pass 1: Canny edges, from strict to sensitive thresholds (low-contrast paper on light tables).
    const m = median(cv, blur);
    let quad = null;
    for (const [lo, hi] of [[Math.max(10, 0.66 * m), Math.min(255, Math.max(30, 1.33 * m))], [40, 120], [20, 60], [10, 30]]) {
      cv.Canny(blur, edges, lo, hi);
      cv.dilate(edges, edges, kernel);
      quad = bestQuad(cv, edges, width, height, minArea);
      if (quad) return quad;
    }

    // Pass 2: Otsu threshold + morphological close (bright paper vs. darker surroundings).
    const big = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(7, 7));
    cv.threshold(blur, edges, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, big);
    big.delete();
    quad = bestQuad(cv, edges, width, height, minArea);
    return quad;
  } finally {
    src.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    kernel.delete();
  }
}
