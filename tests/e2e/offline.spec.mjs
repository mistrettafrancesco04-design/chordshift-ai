export const tests = {
  'app starts and loads OpenCV while offline': async ({ page, context, baseUrl, assert }) => {
    await page.goto(`${baseUrl}/`);
    const active = await page.evaluate(() => Promise.race([
      navigator.serviceWorker.ready.then((r) => Boolean(r.active)),
      new Promise((ok) => setTimeout(() => ok(false), 10000)),
    ]));
    assert.equal(active, true, 'service worker not active');
    await page.locator('#loading.done').waitFor({ state: 'attached', timeout: 20000 });
    await context.setOffline(true);
    await page.reload();
    await page.locator('#loading.done').waitFor({ state: 'attached', timeout: 20000 });
    const ok = await page.evaluate(() => typeof window.cv?.Mat === 'function');
    assert.equal(ok, true);
  },
  'manifest and icons are served': async ({ page, baseUrl, assert }) => {
    for (const path of ['manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-512.png']) {
      const r = await page.request.get(`${baseUrl}/${path}`);
      assert.equal(r.status(), 200, path);
    }
    const m = await (await page.request.get(`${baseUrl}/manifest.webmanifest`)).json();
    assert.equal(m.display, 'standalone');
    assert.equal(m.name, 'Scanner');
  },
};
