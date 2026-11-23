import { resolve } from 'node:path';

const FIXTURES = resolve('tests/fixtures/fixtures.browser.js');

async function setup(page, baseUrl) {
  await page.goto(`${baseUrl}/test.html`);
  await page.addScriptTag({ path: FIXTURES });
  await page.addScriptTag({
    content: `
      window.stats = function (canvas) {
        const ctx = canvas.getContext('2d');
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const halfMedian = (y0, y1) => {
          const v = [];
          for (let y = y0; y < y1; y++) for (let x = 0; x < width; x++) v.push(lum((y * width + x) * 4));
          v.sort((a, b) => a - b);
          return v[v.length >> 1];
        };
        let red = 0, dark = 0, binary = 0, grayEq = 0;
        const n = width * height;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] - data[i + 1] > 60) red++;
          if (lum(i) < 128) dark++;
          if (data[i] <= 10 || data[i] >= 245) binary++;
          if (data[i] === data[i + 1] && data[i + 1] === data[i + 2]) grayEq++;
        }
        const corner = (x, y) => lum((y * width + x) * 4);
        return {
          width, height, red, darkFrac: dark / n, binaryFrac: binary / n, grayFrac: grayEq / n,
          topMedian: halfMedian(0, height >> 1), bottomMedian: halfMedian(height >> 1, height),
          corners: [corner(3, 3), corner(width - 4, 3), corner(width - 4, height - 4), corner(3, height - 4)],
        };
      };
    `,
  });
}

const run = (page, fn, arg) => page.evaluate(fn, arg);

export const tests = {
  'warpQuad flattens the paper to its true aspect ratio': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const r = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad } = await import('./js/enhance.js');
      const { outputSize } = await import('./js/geometry.js');
      const f = window.makeFixture('wood');
      const out = warpQuad(cv, f.canvas, f.corners, 0);
      return { s: window.stats(out), expected: outputSize(f.corners) };
    });
    const ratio = r.s.width / r.s.height;
    const want = r.expected.width / r.expected.height;
    assert.ok(Math.abs(ratio / want - 1) < 0.02, `ratio ${ratio} vs ${want}`);
    r.s.corners.forEach((c, i) => assert.ok(c > 180, `corner ${i} is dark (${c}) - background leaked in`));
  },
  'warpQuad rotation 90 swaps width and height': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const r = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad } = await import('./js/enhance.js');
      const f = window.makeFixture('wood');
      const a = warpQuad(cv, f.canvas, f.corners, 0);
      const b = warpQuad(cv, f.canvas, f.corners, 90);
      return [a.width, a.height, b.width, b.height];
    });
    assert.deepEqual([r[2], r[3]], [r[1], r[0]]);
  },
  'auto filter removes shadow and keeps marker colour': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const r = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad, applyFilter } = await import('./js/enhance.js');
      const f = window.makeFixture('lightShadow');
      const warped = warpQuad(cv, f.canvas, f.corners, 0);
      return { before: window.stats(warped), after: window.stats(applyFilter(cv, warped, 'auto')) };
    });
    assert.ok(r.before.bottomMedian < 220, `fixture should have a shadow (${r.before.bottomMedian})`);
    assert.ok(r.after.topMedian >= 235, `top paper ${r.after.topMedian}`);
    assert.ok(r.after.bottomMedian >= 235, `bottom paper ${r.after.bottomMedian}`);
    assert.ok(r.after.red > 300, `marker pixels ${r.after.red}`);
  },
  'bw filter is pure black and white with text kept': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const s = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad, applyFilter } = await import('./js/enhance.js');
      const f = window.makeFixture('lightShadow');
      return window.stats(applyFilter(cv, warpQuad(cv, f.canvas, f.corners, 0), 'bw'));
    });
    assert.ok(s.binaryFrac > 0.995, `binary fraction ${s.binaryFrac}`);
    assert.ok(s.darkFrac > 0.01 && s.darkFrac < 0.4, `dark fraction ${s.darkFrac}`);
  },
  'bw filter keeps thin lines solid and does not black out highlighter': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const r = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad, applyFilter } = await import('./js/enhance.js');
      const f = window.makeFixture('lightShadow');
      const w = warpQuad(cv, f.canvas, f.corners, 0);
      const px = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const auto = px(applyFilter(cv, w, 'auto'));
      const bw = px(applyFilter(cv, w, 'bw'));
      const gray = px(applyFilter(cv, w, 'gray'));
      let marker = 0, markerWhite = 0, grayDark = 0, bwDark = 0;
      for (let i = 0; i < auto.length; i += 4) {
        const isMarker = auto[i] - auto[i + 1] > 60;
        if (isMarker) { marker++; if (bw[i] > 200) markerWhite++; }
        else { if (gray[i] < 80) grayDark++; if (bw[i] < 128) bwDark++; }
      }
      return { markerWhiteFrac: markerWhite / marker, inkRatio: bwDark / grayDark };
    });
    assert.ok(r.markerWhiteFrac > 0.6, `highlighter blacked out: only ${r.markerWhiteFrac} white`);
    assert.ok(r.inkRatio > 0.85, `thin lines broken: bw keeps ${r.inkRatio} of the ink`);
  },
  'gray filter has equal channels': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const s = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad, applyFilter } = await import('./js/enhance.js');
      const f = window.makeFixture('lightShadow');
      return window.stats(applyFilter(cv, warpQuad(cv, f.canvas, f.corners, 0), 'gray'));
    });
    assert.equal(s.grayFrac, 1);
    assert.ok(s.bottomMedian >= 235, `bottom paper ${s.bottomMedian}`);
  },
  'original filter leaves pixels unchanged': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const same = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { warpQuad, applyFilter } = await import('./js/enhance.js');
      const f = window.makeFixture('wood');
      const w = warpQuad(cv, f.canvas, f.corners, 0);
      const o = applyFilter(cv, w, 'original');
      const a = w.getContext('2d').getImageData(0, 0, w.width, w.height).data;
      const b = o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
      return o !== w && a.length === b.length && a.every((v, i) => v === b[i]);
    });
    assert.equal(same, true);
  },
  'renderPage returns a JPEG with output size': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const r = await run(page, async () => {
      const cv = await (await import('./js/cv.js')).loadCv();
      const { renderPage } = await import('./js/enhance.js');
      const f = window.makeFixture('wood');
      const blob = await new Promise((ok) => f.canvas.toBlob(ok, 'image/png'));
      const p = await renderPage(cv, blob, f.corners, 90, 'auto');
      return { type: p.blob.type, w: p.width, h: p.height };
    });
    assert.equal(r.type, 'image/jpeg');
    assert.ok(r.w > r.h, 'rotated page should be landscape');
  },
  'buildPdf writes A4 and receipt pages': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    const text = await run(page, async () => {
      const { buildPdf } = await import('./js/pdf.js');
      const mk = async (w, h) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        return { blob: await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85)), width: w, height: h };
      };
      const pdf = await buildPdf([await mk(1754, 2480), await mk(300, 1200)], 'Test');
      return { type: pdf.type, body: new TextDecoder('latin1').decode(await pdf.arrayBuffer()) };
    });
    assert.equal(text.type, 'application/pdf');
    assert.ok(text.body.startsWith('%PDF'));
    assert.match(text.body, /\/Count 2/);
    const boxes = [...text.body.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map((m) => [+m[1], +m[2]]);
    assert.ok(boxes.some(([w, h]) => Math.abs(w - 595.28) < 1 && Math.abs(h - 841.89) < 1), `A4 box missing: ${JSON.stringify(boxes)}`);
    assert.ok(boxes.some(([w, h]) => Math.abs(h / w - 4) < 0.05), `receipt box missing: ${JSON.stringify(boxes)}`);
  },
};
