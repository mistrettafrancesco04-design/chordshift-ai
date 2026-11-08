import { isChordSymbol, type Notation } from '@/features/music';

import type { ChordAnnotation, SheetAnalysis } from '../../types';
import { AnalyzerResponseError } from './sheet-analyzer';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Validates and normalises the JSON returned by an analysis backend.
 *
 * Expected shape:
 * ```json
 * { "chords": [{ "id": "c1", "text": "Am7", "box": { "x": 0.1, "y": 0.2, "width": 0.05, "height": 0.02 }, "confidence": 0.97 }],
 *   "detectedKey": "C", "durationMs": 840 }
 * ```
 * Entries whose text is not a valid chord symbol are dropped – the backend may
 * return OCR noise, but the app must never touch anything that is not a chord.
 */
export function parseAnalysisResponse(
  json: unknown,
  analyzerId: string,
  notation: Notation = 'international',
): SheetAnalysis {
  if (typeof json !== 'object' || json === null || !Array.isArray((json as { chords?: unknown }).chords)) {
    throw new AnalyzerResponseError('Ungültige Antwort der Analyse-Engine');
  }
  const raw = json as { chords: unknown[]; detectedKey?: unknown; durationMs?: unknown };

  const chords: ChordAnnotation[] = [];
  raw.chords.forEach((entry, index) => {
    if (typeof entry !== 'object' || entry === null) return;
    const e = entry as Record<string, unknown>;
    const box = e.box as Record<string, unknown> | undefined;
    const text = typeof e.text === 'string' ? e.text.trim() : '';
    if (!text || !isChordSymbol(text, notation) || !box) return;
    if (![box.x, box.y, box.width, box.height].every(isNumber)) return;

    const x = clamp01(box.x as number);
    const y = clamp01(box.y as number);
    chords.push({
      id: typeof e.id === 'string' && e.id ? e.id : `chord-${index}`,
      text,
      box: {
        x,
        y,
        width: Math.min(clamp01(box.width as number), 1 - x),
        height: Math.min(clamp01(box.height as number), 1 - y),
      },
      confidence: isNumber(e.confidence) ? clamp01(e.confidence) : 1,
    });
  });

  return {
    chords,
    analyzer: analyzerId,
    detectedKey: typeof raw.detectedKey === 'string' ? raw.detectedKey : null,
    durationMs: isNumber(raw.durationMs) ? raw.durationMs : 0,
  };
}
