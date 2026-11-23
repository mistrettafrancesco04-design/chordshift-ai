// Copies third-party browser bundles into scanner/vendor (served as-is, cached offline).
import { copyFileSync, mkdirSync } from 'node:fs';

const files = [
  ['node_modules/@techstark/opencv-js/dist/opencv.js', 'scanner/vendor/opencv.js'],
  ['node_modules/jspdf/dist/jspdf.umd.min.js', 'scanner/vendor/jspdf.umd.min.js'],
];
mkdirSync('scanner/vendor', { recursive: true });
for (const [from, to] of files) {
  copyFileSync(from, to);
  console.log(`${from} -> ${to}`);
}
