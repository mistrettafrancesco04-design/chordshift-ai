import type { Notation } from '@/features/music';

import { OnDeviceSheetAnalyzer } from './on-device-analyzer';
import { RemoteSheetAnalyzer } from './remote-analyzer';
import type { SheetAnalyzer } from './sheet-analyzer';

export * from './ocr-chords';
export * from './parse-response';
export * from './sheet-analyzer';

/**
 * Resolves the analyzer for the current build.
 * - `EXPO_PUBLIC_ANALYZER_URL` set → remote service (see docs/ANALYZER_API.md)
 * - otherwise → on-device OCR (works offline, no account, no upload)
 */
export function getSheetAnalyzer(notation: Notation = 'international'): SheetAnalyzer {
  const url = process.env.EXPO_PUBLIC_ANALYZER_URL;
  if (url) return new RemoteSheetAnalyzer(url, notation);
  return new OnDeviceSheetAnalyzer(notation);
}
