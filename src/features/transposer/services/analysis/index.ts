import type { Notation } from '@/features/music';

import { RemoteSheetAnalyzer } from './remote-analyzer';
import { AnalyzerUnavailableError, type SheetAnalyzer } from './sheet-analyzer';

export * from './parse-response';
export * from './sheet-analyzer';

/** Placeholder used until an engine is configured – fails with a clear message. */
const unconfiguredAnalyzer: SheetAnalyzer = {
  id: 'none',
  available: false,
  analyze: () => Promise.reject(new AnalyzerUnavailableError()),
};

/**
 * Resolves the analyzer for the current build.
 * Add new engines (e.g. on-device ML Kit / Vision) here – the rest of the app
 * only depends on the `SheetAnalyzer` interface.
 */
export function getSheetAnalyzer(notation: Notation = 'international'): SheetAnalyzer {
  const url = process.env.EXPO_PUBLIC_ANALYZER_URL;
  if (url) return new RemoteSheetAnalyzer(url, notation);
  return unconfiguredAnalyzer;
}
