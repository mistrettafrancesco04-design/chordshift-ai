// Draws the app icon (blue tile, white sheet with scan corners) and writes PNGs.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
mkdirSync('scanner/icons', { recursive: true });
for (const size of [180, 512]) {
  const data = await page.evaluate((S) => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    const u = S / 100;
    const g = x.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#3d8bff');
    g.addColorStop(1, '#1550d6');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    // Sheet
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.25)';
    x.shadowBlur = 4 * u;
    x.shadowOffsetY = 1.5 * u;
    x.fillStyle = '#fff';
    x.beginPath();
    x.moveTo(30 * u, 22 * u);
    x.lineTo(60 * u, 22 * u);
    x.lineTo(70 * u, 32 * u);
    x.lineTo(70 * u, 78 * u);
    x.lineTo(30 * u, 78 * u);
    x.closePath();
    x.fill();
    x.restore();
    x.fillStyle = '#cfe0ff';
    x.beginPath();
    x.moveTo(60 * u, 22 * u);
    x.lineTo(60 * u, 32 * u);
    x.lineTo(70 * u, 32 * u);
    x.closePath();
    x.fill();
    // Text lines
    x.fillStyle = '#9db4d8';
    [40, 48, 56, 64].forEach((y, i) => x.fillRect(37 * u, y * u, (i % 2 ? 18 : 26) * u, 3 * u));
    // Scan corner brackets
    x.strokeStyle = '#fff';
    x.lineWidth = 4 * u;
    x.lineCap = 'round';
    const k = 9 * u;
    [[18, 14, 1, 1], [82, 14, -1, 1], [82, 86, -1, -1], [18, 86, 1, -1]].forEach(([cx, cy, dx, dy]) => {
      x.beginPath();
      x.moveTo(cx * u, cy * u + dy * k);
      x.lineTo(cx * u, cy * u);
      x.lineTo(cx * u + dx * k, cy * u);
      x.stroke();
    });
    return c.toDataURL('image/png').split(',')[1];
  }, size);
  writeFileSync(`scanner/icons/icon-${size}.png`, Buffer.from(data, 'base64'));
  console.log(`scanner/icons/icon-${size}.png`);
}
await browser.close();
