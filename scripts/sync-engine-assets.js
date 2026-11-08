#!/usr/bin/env node
/**
 * Copies the vendored image-processing libraries into assets/engine as `.bin` assets.
 * Run after upgrading pdfjs-dist / tesseract.js / tesseract.js-core / @tesseract.js-data/eng:
 *   npm run engine:sync
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'assets', 'engine');
const files = {
  'pdf.bin': 'node_modules/pdfjs-dist/legacy/build/pdf.min.js',
  'pdf-worker.bin': 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js',
  'tesseract.bin': 'node_modules/tesseract.js/dist/tesseract.min.js',
  'tesseract-worker.bin': 'node_modules/tesseract.js/dist/worker.min.js',
  'tesseract-core.bin': 'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js',
  'eng-traineddata.bin': 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
};

fs.mkdirSync(out, { recursive: true });
for (const [target, source] of Object.entries(files)) {
  fs.copyFileSync(path.join(root, source), path.join(out, target));
  console.log(`✓ ${target} ← ${source}`);
}
