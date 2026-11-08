import type { SheetAnalysis, SheetSource } from '../../types';

/**
 * Contract for every chord-recognition engine (cloud OCR, on-device ML, …).
 *
 * An analyzer only *locates and reads* chord symbols. It never modifies the image:
 * transposition happens afterwards in the app and is rendered as an overlay on
 * exactly the detected chord boxes – notes, lyrics and all other elements stay untouched.
 */
export interface SheetAnalyzer {
  readonly id: string;
  /** Whether the analyzer is configured and can be used. */
  readonly available: boolean;
  analyze(source: SheetSource, options?: { signal?: AbortSignal }): Promise<SheetAnalysis>;
}

export class AnalyzerUnavailableError extends Error {
  constructor(message = 'Keine Analyse-Engine konfiguriert') {
    super(message);
    this.name = 'AnalyzerUnavailableError';
  }
}

export class AnalyzerResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyzerResponseError';
  }
}
