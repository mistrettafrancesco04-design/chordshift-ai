// Tiny browser test runner: each tests/e2e/*.spec.mjs exports `tests` = { name: async (ctx) => {} }.
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startServer } from './server.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const only = process.argv[2];
const dir = resolve('tests/e2e');
const specs = readdirSync(dir).filter((f) => f.endsWith('.spec.mjs') && (!only || f.includes(only))).sort();

const server = await startServer('scanner');
const args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
if (process.env.FAKE_VIDEO) args.push(`--use-file-for-fake-video-capture=${resolve(process.env.FAKE_VIDEO)}`);
const browser = await chromium.launch({ args });

let failed = 0;
let passed = 0;
for (const file of specs) {
  const mod = await import(resolve(dir, file));
  for (const [name, fn] of Object.entries(mod.tests)) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await fn({ browser, context, page, baseUrl: server.url, assert, errors });
      console.log(`PASS ${file} › ${name}`);
      passed++;
    } catch (e) {
      console.log(`FAIL ${file} › ${name}\n  ${String(e && e.stack || e).split('\n').slice(0, 6).join('\n  ')}`);
      if (errors.length) console.log(`  page errors: ${errors.join(' | ')}`);
      failed++;
    } finally {
      await context.close();
    }
  }
}
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
