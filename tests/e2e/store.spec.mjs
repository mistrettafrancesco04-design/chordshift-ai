const mkPage = (id) => `({ id: '${id}', original: new Blob(['orig-${id}'], { type: 'image/png' }), quad: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}], rotation: 0, filter: 'auto', processed: new Blob(['proc-${id}'], { type: 'image/jpeg' }), width: 10, height: 20, createdAt: Date.now() })`;

export const tests = {
  'pages survive a reload, can be reordered, deleted and cleared': async ({ page, baseUrl, assert }) => {
    await page.goto(`${baseUrl}/test.html`);
    await page.evaluate(`(async () => {
      const s = await import('./js/store.js');
      await s.clearPages();
      await s.putPage(${mkPage('a')});
      await s.putPage(${mkPage('b')});
      await s.setMeta('fileName', 'Mathe.pdf');
    })()`);
    await page.reload();
    const after = await page.evaluate(async () => {
      const s = await import('./js/store.js');
      const pages = await s.listPages();
      return { ids: pages.map((p) => p.id), text: await pages[0].processed.text(), name: await s.getMeta('fileName') };
    });
    assert.deepEqual(after, { ids: ['a', 'b'], text: 'proc-a', name: 'Mathe.pdf' });

    const steps = await page.evaluate(async () => {
      const s = await import('./js/store.js');
      await s.reorder(['b', 'a']);
      const reordered = (await s.listPages()).map((p) => p.id);
      const a = (await s.listPages()).find((p) => p.id === 'a');
      a.filter = 'bw';
      await s.putPage(a);
      const updated = (await s.listPages()).map((p) => p.id + ':' + p.filter);
      await s.deletePage('b');
      const deleted = (await s.listPages()).map((p) => p.id);
      await s.clearPages();
      return { reordered, updated, deleted, cleared: (await s.listPages()).length };
    });
    assert.deepEqual(steps, { reordered: ['b', 'a'], updated: ['b:auto', 'a:bw'], deleted: ['a'], cleared: 0 });
  },
};
