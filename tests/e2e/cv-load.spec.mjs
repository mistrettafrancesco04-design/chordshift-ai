export const tests = {
  'loadCv resolves to a usable OpenCV': async ({ page, baseUrl, assert }) => {
    await page.goto(`${baseUrl}/test.html`);
    const result = await page.evaluate(async () => {
      const { loadCv } = await import('./js/cv.js');
      const cv = await loadCv();
      const again = await loadCv();
      const m = new cv.Mat(4, 4, cv.CV_8UC1);
      const rows = m.rows;
      m.delete();
      return { mat: typeof cv.Mat, rows, same: cv === again };
    });
    assert.deepEqual(result, { mat: 'function', rows: 4, same: true });
  },
};
