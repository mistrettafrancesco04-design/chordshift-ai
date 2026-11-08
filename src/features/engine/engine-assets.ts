/* eslint-disable @typescript-eslint/no-require-imports -- Metro resolves binary assets via require() */
import type { EngineLibName } from './types';

/** Vendored libraries, shipped as binary assets (see scripts/sync-engine-assets.js). */
export const ENGINE_ASSETS: Record<EngineLibName, number> = {
  pdf: require('@/assets/engine/pdf.bin'),
  'pdf-worker': require('@/assets/engine/pdf-worker.bin'),
  tesseract: require('@/assets/engine/tesseract.bin'),
  'tesseract-worker': require('@/assets/engine/tesseract-worker.bin'),
  'tesseract-core': require('@/assets/engine/tesseract-core.bin'),
  'eng-traineddata': require('@/assets/engine/eng-traineddata.bin'),
};
