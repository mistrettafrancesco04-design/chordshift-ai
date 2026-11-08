import { engine } from '@/features/engine';
import type { Notation } from '@/features/music';

import type { SheetAnalysis, SheetPage } from '../../types';
import { extractChordsFromWords } from './ocr-chords';
import type { AnalyzeOptions, SheetAnalyzer } from './sheet-analyzer';

/**
 * Fully on-device chord recognition: Tesseract OCR (bundled, runs offline in the
 * image-processing engine) followed by the strict chord-line filter.
 */
export class OnDeviceSheetAnalyzer implements SheetAnalyzer {
  readonly id = 'on-device';
  readonly available = true;

  constructor(private readonly notation: Notation = 'international') {}

  async analyze(page: SheetPage, options?: AnalyzeOptions): Promise<SheetAnalysis> {
    const started = Date.now();
    options?.onProgress?.({ value: 0, label: 'Texterkennung wird gestartet' });
    const ocr = await engine.recognizeText(page.uri, (p) =>
      options?.onProgress?.({ value: p.value, label: translateStatus(p.label) }),
    );
    if (options?.signal?.aborted) throw new Error('Analyse abgebrochen');
    const chords = extractChordsFromWords(ocr.words, this.notation);
    return { chords, analyzer: this.id, detectedKey: null, durationMs: Date.now() - started };
  }
}

function translateStatus(label?: string): string {
  if (!label) return 'Analysiere';
  if (label.startsWith('Zeile')) return `Akkordzeilen prüfen · ${label}`;
  if (label.includes('recogniz')) return 'Text wird erkannt';
  if (label.includes('load') || label.includes('initializ')) return 'Erkennungsmodell wird geladen';
  return label;
}
