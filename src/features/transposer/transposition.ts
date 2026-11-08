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

/**
 * Key of a sheet: analyzer result first, otherwise estimated from all chords of all
 * pages (in reading order).
 */
export function resolveOriginalKey(
  analyses: (SheetAnalysis | null)[],
  notation: Notation,
): MusicalKey | null {
  for (const analysis of analyses) {
    const fromAnalyzer = analysis?.detectedKey ? getKey(analysis.detectedKey) : undefined;
    if (fromAnalyzer) return fromAnalyzer;
  }
  const chords = analyses.flatMap((a) => a?.chords.map((c) => c.text) ?? []);
  return detectKey(chords, notation)?.key ?? null;
}

/** Unique chord changes in order of first appearance, e.g. G → A (×4). */
export interface ChordChange {
  original: string;
  transposed: string;
  count: number;
}

export function summarizeChanges(chords: TransposedChord[]): ChordChange[] {
  const map = new Map<string, ChordChange>();
  for (const chord of chords) {
    const existing = map.get(chord.original);
    if (existing) existing.count += 1;
    else map.set(chord.original, { original: chord.original, transposed: chord.transposed, count: 1 });
  }
  return [...map.values()];
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
      appearance: annotation.appearance,
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
