import {
  type AccidentalPreference,
  detectKey,
  getKey,
  type MusicalKey,
  type Notation,
  parseChord,
  transposeKey,
  transposeParsedChord,
} from '@/features/music';

import type { SheetAnalysis, TransposedChord } from './types';

export interface TranspositionSettings {
  semitones: number;
  originalKey: MusicalKey | null;
  inputNotation: Notation;
  outputNotation: Notation;
  accidentals: AccidentalPreference;
}

/** Key detected on a sheet: analyzer result first, local estimate as fallback. */
export function resolveOriginalKey(analysis: SheetAnalysis, notation: Notation): MusicalKey | null {
  const fromAnalyzer = analysis.detectedKey ? getKey(analysis.detectedKey) : undefined;
  if (fromAnalyzer) return fromAnalyzer;
  return detectKey(
    analysis.chords.map((c) => c.text),
    notation,
  )?.key ?? null;
}

/**
 * Produces the render model for the overlay: every detected chord with its new text.
 * Chords the parser cannot read are passed through unchanged.
 */
export function transposeAnalysis(analysis: SheetAnalysis, settings: TranspositionSettings): TransposedChord[] {
  const targetKey = settings.originalKey ? transposeKey(settings.originalKey, settings.semitones) : null;

  return analysis.chords.map((annotation) => {
    const parsed = parseChord(annotation.text, settings.inputNotation);
    const transposed = parsed
      ? transposeParsedChord(parsed, settings.semitones, {
          notation: settings.inputNotation,
          outputNotation: settings.outputNotation,
          accidentals: settings.accidentals,
          targetKey,
        })
      : annotation.text;
    return {
      id: annotation.id,
      original: annotation.text,
      transposed,
      box: annotation.box,
      confidence: annotation.confidence,
    };
  });
}

/** Clamp to one octave in either direction. */
export function normalizeSemitones(value: number): number {
  return Math.max(-11, Math.min(11, Math.round(value)));
}

/** Shift within one octave, wrapping around (+12 → 0, −12 → 0). */
export function wrapSemitones(value: number): number {
  if (value > 11) return value - 12;
  if (value < -11) return value + 12;
  return value;
}
