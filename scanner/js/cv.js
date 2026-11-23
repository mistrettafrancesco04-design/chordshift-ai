// Loads the vendored OpenCV.js once and resolves with the ready `cv` object.

let loading = null;

function whenReady(mod) {
  if (mod && typeof mod.Mat === 'function') return Promise.resolve(mod);
  if (mod instanceof Promise) return mod.then(whenReady);
  return new Promise((resolve) => {
    if (mod && typeof mod.then === 'function') {
      // Emscripten module "thenable": strip .then after resolve to avoid infinite await loops.
      mod.then((m) => {
        delete m.then;
        resolve(m);
      });
    } else {
      mod.onRuntimeInitialized = () => resolve(mod);
    }
  });
}

export function loadCv(src = new URL('../vendor/opencv.js', import.meta.url).href) {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => whenReady(window.cv).then((cv) => {
      window.cv = cv;
      resolve(cv);
    }, reject);
    script.onerror = () => {
      loading = null;
      reject(new Error('OpenCV konnte nicht geladen werden.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
