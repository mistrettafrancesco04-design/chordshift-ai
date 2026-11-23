// IndexedDB storage for scanned pages, so nothing is lost when iOS suspends the app.

const DB_NAME = 'scanner';
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('pages', { keyPath: 'id' });
      db.createObjectStore('meta');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => (result = r));
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const reqP = (req) => new Promise((ok, fail) => {
  req.onsuccess = () => ok(req.result);
  req.onerror = () => fail(req.error);
});

export async function listPages() {
  const all = await tx('pages', 'readonly', (s) => reqP(s.getAll()));
  return all.sort((a, b) => a.order - b.order);
}

/** Insert or update a page. New pages are appended at the end. */
export async function putPage(page) {
  const pages = await listPages();
  const existing = pages.find((p) => p.id === page.id);
  const order = existing ? existing.order : pages.reduce((m, p) => Math.max(m, p.order), -1) + 1;
  await tx('pages', 'readwrite', (s) => {
    s.put({ ...page, order });
  });
}

export async function deletePage(id) {
  await tx('pages', 'readwrite', (s) => {
    s.delete(id);
  });
}

/** Set the page order to match the given id list. */
export async function reorder(ids) {
  const pages = await listPages();
  await tx('pages', 'readwrite', (s) => {
    for (const p of pages) {
      const i = ids.indexOf(p.id);
      s.put({ ...p, order: i === -1 ? ids.length + p.order : i });
    }
  });
}

export async function clearPages() {
  await tx('pages', 'readwrite', (s) => {
    s.clear();
  });
}

export async function getMeta(key) {
  return tx('meta', 'readonly', (s) => reqP(s.get(key)));
}

export async function setMeta(key, value) {
  await tx('meta', 'readwrite', (s) => {
    s.put(value, key);
  });
}
