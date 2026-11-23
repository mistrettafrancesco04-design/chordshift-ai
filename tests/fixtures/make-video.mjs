// Renders the 'wood' fixture and writes it as a looping Y4M clip for Chromium's fake camera.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { openSync, writeSync, closeSync, existsSync } from 'node:fs';

export async function makeVideo(out = 'tests/fixtures/paper.y4m', scene = 'wood', frames = 15) {
  const { chromium } = createRequire(import.meta.url)('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<!doctype html><body></body>');
  await page.addScriptTag({ path: resolve('tests/fixtures/fixtures.browser.js') });
  const { w, h, data } = await page.evaluate((s) => {
    const f = window.makeFixture(s);
    return { w: f.width, h: f.height, data: Array.from(f.imageData.data) };
  }, scene);
  await browser.close();

  const Y = Buffer.alloc(w * h);
  const U = Buffer.alloc((w / 2) * (h / 2));
  const V = Buffer.alloc((w / 2) * (h / 2));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      Y[y * w + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      if (y % 2 === 0 && x % 2 === 0) {
        const j = (y / 2) * (w / 2) + x / 2;
        U[j] = Math.max(0, Math.min(255, Math.round(-0.169 * r - 0.331 * g + 0.5 * b + 128)));
        V[j] = Math.max(0, Math.min(255, Math.round(0.5 * r - 0.419 * g - 0.081 * b + 128)));
      }
    }
  }
  const fd = openSync(out, 'w');
  writeSync(fd, `YUV4MPEG2 W${w} H${h} F30:1 Ip A1:1 C420jpeg\n`);
  for (let i = 0; i < frames; i++) {
    writeSync(fd, 'FRAME\n');
    writeSync(fd, Y);
    writeSync(fd, U);
    writeSync(fd, V);
  }
  closeSync(fd);
  return out;
}

export async function ensureVideo(out = 'tests/fixtures/paper.y4m') {
  if (!existsSync(out)) await makeVideo(out);
  return out;
}
