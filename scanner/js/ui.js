// Small shared UI helpers.

export const $ = (id) => document.getElementById(id);

const listeners = new Set();
let current = 'camera';

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === name));
  current = name;
  listeners.forEach((fn) => fn(name));
}

export const currentScreen = () => current;
export const onScreenChange = (fn) => listeners.add(fn);

let toastTimer = 0;
export function toast(text, ms = 2600) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), ms);
}

/** Native-looking confirm; resolves true when confirmed. */
export function confirmDialog(text, okLabel = 'OK') {
  const dlg = $('confirmDialog');
  $('confirmText').textContent = text;
  $('confirmOk').textContent = okLabel;
  if (typeof dlg.showModal !== 'function') return Promise.resolve(window.confirm(text));
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise((ok) => dlg.addEventListener('close', () => ok(dlg.returnValue === 'ok'), { once: true }));
}

export function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Runs async jobs one after another (image processing is memory heavy on iPhone). */
export function createQueue(onBusyChange = () => {}) {
  let chain = Promise.resolve();
  let pending = 0;
  return (job) => {
    pending++;
    onBusyChange(true);
    const run = chain.then(job).finally(() => {
      pending--;
      if (!pending) onBusyChange(false);
    });
    chain = run.catch(() => {});
    return run;
  };
}
