// Builds a multi-page PDF from rendered JPEG pages using the vendored jsPDF.
import { pageSizeMm } from './geometry.js';

let loading = null;

function loadJsPdf() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/jspdf.umd.min.js', import.meta.url).href;
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = () => {
      loading = null;
      reject(new Error('PDF-Modul konnte nicht geladen werden.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * @param {{blob: Blob, width: number, height: number}[]} pages
 * @param {string} title
 * @returns {Promise<Blob>}
 */
export async function buildPdf(pages, title) {
  if (!pages.length) throw new Error('Keine Seiten vorhanden.');
  const JsPDF = await loadJsPdf();
  let doc = null;
  for (const p of pages) {
    const { w, h } = pageSizeMm(p.width, p.height);
    const orientation = w > h ? 'l' : 'p';
    if (!doc) doc = new JsPDF({ unit: 'mm', format: [w, h], orientation, compress: true });
    else doc.addPage([w, h], orientation);
    const bytes = new Uint8Array(await p.blob.arrayBuffer());
    doc.addImage(bytes, 'JPEG', 0, 0, w, h, undefined, 'NONE');
  }
  doc.setProperties({ title, creator: 'Scanner' });
  return doc.output('blob');
}
