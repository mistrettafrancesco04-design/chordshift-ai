import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const FIXTURES = resolve('tests/fixtures/fixtures.browser.js');

async function setup(page, baseUrl) {
  // No camera here, so nothing is auto-captured during the test; no Web Share -> download fallback.
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
    delete Navigator.prototype.share;
    delete Navigator.prototype.canShare;
  });
  await page.goto(`${baseUrl}/`);
  await page.evaluate(async () => {
    const s = await import('./js/store.js');
    await s.clearPages();
    await s.setMeta('fileName', null);
  });
  await page.reload();
  await page.locator('#loading.done').waitFor({ state: 'attached', timeout: 20000 });
  await page.addScriptTag({ path: FIXTURES });
  const files = await page.evaluate(async () => Promise.all(['wood', 'receipt'].map(async (n) => {
    const url = window.makeFixture(n).canvas.toDataURL('image/png');
    return { name: `${n}.png`, mimeType: 'image/png', b64: url.split(',')[1] };
  })));
  await page.setInputFiles('#galleryInput', files.map((f) => ({ name: f.name, mimeType: f.mimeType, buffer: Buffer.from(f.b64, 'base64') })));
  await page.locator('#review.active').waitFor({ timeout: 20000 });
}

const pages = (page) => page.evaluate(async () => (await import('./js/store.js')).listPages()
  .then((ps) => ps.map((p) => ({ id: p.id, w: p.width, h: p.height, filter: p.filter, rotation: p.rotation }))));

async function finishReview(page) {
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.locator('#pages.active').waitFor({ timeout: 20000 });
}

async function openFirst(page) {
  await page.locator('.page-item .page-thumb').first().click();
  await page.locator('#review.active').waitFor();
}

export const tests = {
  'dragging a corner changes the cropped page': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    assert.equal(await page.locator('#editorSvg .handle').count(), 4);
    const before = (await pages(page))[0];
    const box = await page.locator('#editorSvg .handle-hit').nth(1).boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 60, y + 40, { steps: 6 });
    assert.equal(await page.locator('#loupe').isVisible(), true, 'loupe should show while dragging');
    await page.mouse.up();
    await finishReview(page);
    const after = (await pages(page))[0];
    assert.notEqual((after.w / after.h).toFixed(3), (before.w / before.h).toFixed(3));
  },
  'filter and rotation are saved': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    await page.getByRole('radio', { name: 'S/W' }).click();
    await finishReview(page);
    const p1 = (await pages(page))[0];
    assert.equal(p1.filter, 'bw');
    await openFirst(page);
    assert.equal(await page.getByRole('radio', { name: 'S/W' }).getAttribute('aria-checked'), 'true');
    await page.getByRole('button', { name: 'Drehen' }).click();
    await finishReview(page);
    const p2 = (await pages(page))[0];
    assert.deepEqual([p2.w, p2.h, p2.rotation], [p1.h, p1.w, 90]);
  },
  'pages can be reordered, deleted and survive reload': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    await finishReview(page);
    const [a, b] = await pages(page);
    await page.getByRole('button', { name: 'Seite 1 nach hinten' }).click();
    await page.waitForFunction(async (bid) => (await (await import('./js/store.js')).listPages())[0].id === bid, b.id);
    await openFirst(page);
    await page.getByRole('button', { name: 'Löschen' }).click();
    await page.locator('#confirmOk').click();
    await page.locator('#pages.active').waitFor();
    assert.deepEqual((await pages(page)).map((p) => p.id), [a.id]);
    await page.reload();
    await page.locator('#loading.done').waitFor({ state: 'attached', timeout: 20000 });
    assert.equal((await page.locator('#pageCount').textContent()).trim(), '1');
    await page.locator('#doneBtn').click();
    assert.equal(await page.locator('.page-item').count(), 1);
  },
  'share falls back to downloading the PDF': async ({ page, baseUrl, assert }) => {
    await setup(page, baseUrl);
    await finishReview(page);
    assert.match(await page.locator('#fileName').inputValue(), /^Scan_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/);
    await page.locator('#fileName').fill('Rechnung Mai');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 20000 }),
      page.getByRole('button', { name: 'PDF teilen' }).click(),
    ]);
    assert.equal(download.suggestedFilename(), 'Rechnung Mai.pdf');
    const body = readFileSync(await download.path(), 'latin1');
    assert.ok(body.startsWith('%PDF'));
    assert.match(body, /\/Count 2/);
    await page.locator('#confirmDialog[open]').waitFor();
    await page.locator('#confirmOk').click();
    await page.locator('#camera.active').waitFor();
    assert.equal((await pages(page)).length, 0);
  },
};
