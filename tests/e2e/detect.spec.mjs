import { resolve } from 'node:path';

const FIXTURES = resolve('tests/fixtures/fixtures.browser.js');

async function detect(page, baseUrl, name) {
  await page.goto(`${baseUrl}/test.html`);
  await page.addScriptTag({ path: FIXTURES });
  return page.evaluate(async (n) => {
    const { loadCv } = await import('./js/cv.js');
    const { detectQuad } = await import('./js/detect.js');
    const cv = await loadCv();
    const f = window.makeFixture(n);
    return { found: detectQuad(cv, f.imageData), expected: f.corners, width: f.width };
  }, name);
}

function assertNear(assert, found, expected, width) {
  assert.ok(found, 'expected a quad, got null');
  const tol = 0.03 * width;
  found.forEach((p, i) => {
    const d = Math.hypot(p.x - expected[i].x, p.y - expected[i].y);
    assert.ok(d <= tol, `corner ${i} off by ${d.toFixed(1)}px (tol ${tol}): ${JSON.stringify(found)}`);
  });
}

export const tests = {
  'finds paper on wood': async ({ page, baseUrl, assert }) => {
    const r = await detect(page, baseUrl, 'wood');
    assertNear(assert, r.found, r.expected, r.width);
  },
  'finds white paper on light table with shadow': async ({ page, baseUrl, assert }) => {
    const r = await detect(page, baseUrl, 'lightShadow');
    assertNear(assert, r.found, r.expected, r.width);
  },
  'finds narrow receipt': async ({ page, baseUrl, assert }) => {
    const r = await detect(page, baseUrl, 'receipt');
    assertNear(assert, r.found, r.expected, r.width);
  },
  'returns null without paper': async ({ page, baseUrl, assert }) => {
    const r = await detect(page, baseUrl, 'empty');
    assert.equal(r.found, null);
  },
  'returns null when paper is cut off by the frame': async ({ page, baseUrl, assert }) => {
    const r = await detect(page, baseUrl, 'cutOff');
    assert.equal(r.found, null);
  },
};
