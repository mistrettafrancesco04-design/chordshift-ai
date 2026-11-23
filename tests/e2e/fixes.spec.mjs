// Regression tests for the final review findings.
async function openFresh(page, baseUrl) {
  await page.goto(`${baseUrl}/`);
  await page.evaluate(async () => {
    const s = await import('./js/store.js');
    await s.clearPages();
    await s.setMeta('fileName', null);
  });
  await page.reload();
  await page.locator('#loading.done').waitFor({ state: 'attached', timeout: 20000 });
  await page.getByRole('button', { name: 'Automatisch auslösen' }).click();
  await page.locator('#quad.visible').waitFor({ timeout: 15000 });
}

const waitCount = (page, n) => page.waitForFunction(
  (want) => document.querySelector('#pageCount').textContent.trim() === String(want), n, { timeout: 15000 },
);

async function shoot(page, n) {
  await page.getByRole('button', { name: 'Foto aufnehmen' }).click();
  await waitCount(page, n);
}

export const tests = {
  'abandoned retake does not overwrite the page later': async ({ page, baseUrl, assert }) => {
    await openFresh(page, baseUrl);
    await shoot(page, 1);
    await page.locator('#doneBtn').click();
    await page.locator('.page-thumb').first().click();
    await page.locator('#review.active').waitFor();
    await page.getByRole('button', { name: 'Neu', exact: true }).click();
    await page.locator('#camera.active').waitFor();
    await page.locator('#doneBtn').click(); // changed mind
    await page.locator('#pages.active').waitFor();
    await page.locator('#pagesBack').click();
    await page.locator('#quad.visible').waitFor({ timeout: 15000 });
    await shoot(page, 2);
  },
  'camera stops while on other screens': async ({ page, baseUrl, assert }) => {
    await openFresh(page, baseUrl);
    await shoot(page, 1);
    await page.locator('#doneBtn').click();
    await page.locator('#pages.active').waitFor();
    const live = await page.evaluate(() => {
      const s = document.getElementById('video').srcObject;
      return Boolean(s && s.getVideoTracks().some((t) => t.readyState === 'live'));
    });
    assert.equal(live, false);
    await page.locator('#pagesBack').click();
    await page.locator('#quad.visible').waitFor({ timeout: 15000 });
  },
  'rapid shutter taps do not pile up unlimited captures': async ({ page, baseUrl, assert }) => {
    await openFresh(page, baseUrl);
    // Eight taps faster than any page can be processed.
    await page.evaluate(() => { for (let i = 0; i < 8; i++) document.getElementById('shutterBtn').click(); });
    await page.waitForFunction(() => document.getElementById('busy').hidden, null, { timeout: 30000 });
    const n = Number((await page.locator('#pageCount').textContent()).trim());
    assert.ok(n >= 1 && n <= 2, `captured ${n} pages from 8 rapid taps`);
  },
  'long-press drag blocks page scrolling on touch': async ({ page, baseUrl, assert }) => {
    await openFresh(page, baseUrl);
    await shoot(page, 1);
    await shoot(page, 2);
    await page.locator('#doneBtn').click();
    await page.locator('.page-item').nth(1).waitFor();
    const prevented = await page.evaluate(async () => {
      const thumb = document.querySelector('.page-thumb');
      const r = thumb.getBoundingClientRect();
      const opts = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', clientX: r.x + 20, clientY: r.y + 20 };
      thumb.dispatchEvent(new PointerEvent('pointerdown', opts));
      await new Promise((ok) => setTimeout(ok, 450));
      const touch = new Touch({ identifier: 7, target: thumb, clientX: r.x + 20, clientY: r.y + 120 });
      const ev = new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] });
      thumb.dispatchEvent(ev);
      thumb.dispatchEvent(new PointerEvent('pointercancel', opts));
      return ev.defaultPrevented;
    });
    assert.equal(prevented, true);
  },
  'share after renaming uses the pre-built PDF (no build inside the tap)': async ({ page, baseUrl, assert }) => {
    await page.addInitScript(() => {
      window.__shared = [];
      Navigator.prototype.canShare = () => true;
      Navigator.prototype.share = async (data) => { window.__shared.push(data.files[0].name); };
    });
    await openFresh(page, baseUrl);
    await shoot(page, 1);
    await page.locator('#doneBtn').click();
    await page.locator('#pages.active').waitFor();
    await page.locator('#fileName').fill('Mathe Blatt 3');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      window.__building = false;
      const b = document.getElementById('shareBtn');
      new MutationObserver(() => { if (b.textContent.includes('erstellt')) window.__building = true; })
        .observe(b, { childList: true, characterData: true, subtree: true });
    });
    await page.getByRole('button', { name: 'PDF teilen' }).click();
    await page.waitForFunction(() => window.__shared.length === 1);
    const r = await page.evaluate(() => ({ building: window.__building, name: window.__shared[0] }));
    assert.deepEqual(r, { building: false, name: 'Mathe Blatt 3.pdf' });
  },
};
