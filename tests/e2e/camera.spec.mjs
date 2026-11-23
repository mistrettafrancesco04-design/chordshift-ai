const count = (page) => page.locator('[data-testid=page-count]').textContent();

async function waitForCount(page, n, timeout) {
  await page.waitForFunction(
    (want) => document.querySelector('[data-testid=page-count]')?.textContent.trim() === String(want),
    n,
    { timeout },
  );
}

async function openFresh(page, baseUrl) {
  await page.goto(`${baseUrl}/`);
  await page.evaluate(async () => (await import('./js/store.js')).clearPages());
  await page.reload();
}

export const tests = {
  'live camera outlines the paper and auto-captures once': async ({ page, baseUrl, assert }) => {
    await openFresh(page, baseUrl);
    await page.locator('[data-testid=quad]').waitFor({ state: 'visible', timeout: 15000 });
    await waitForCount(page, 1, 8000);
    // Same sheet still in view: no second automatic capture.
    await page.waitForTimeout(4000);
    assert.equal((await count(page)).trim(), '1');
  },
  'manual shutter captures another page': async ({ page, baseUrl, assert }) => {
    await openFresh(page, baseUrl);
    await page.getByRole('button', { name: 'Automatisch auslösen' }).click();
    assert.equal(await page.getByRole('button', { name: 'Automatisch auslösen' }).getAttribute('aria-pressed'), 'false');
    await page.locator('[data-testid=quad]').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: 'Foto aufnehmen' }).click();
    await waitForCount(page, 1, 8000);
    await page.getByRole('button', { name: 'Foto aufnehmen' }).click();
    await waitForCount(page, 2, 8000);
    const pages = await page.evaluate(async () => (await import('./js/store.js')).listPages());
    assert.equal(pages.length, 2);
    assert.ok(pages[0].width < pages[0].height, 'page should be portrait like the sheet');
  },
  'shows a German hint when camera access is denied': async ({ page, baseUrl, assert }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
    });
    await page.goto(`${baseUrl}/`);
    await page.getByText('Kein Kamerazugriff').waitFor({ timeout: 15000 });
    assert.equal(await page.getByRole('button', { name: 'Aus Fotos importieren' }).isEnabled(), true);
  },
};
