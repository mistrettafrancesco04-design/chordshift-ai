import { type Chord, parseChord } from './chord';
import { ALL_KEYS, type MusicalKey } from './keys';
import { type Notation, mod12 } from './notes';

/** Diatonic triads per scale degree: [interval from tonic, isMinor]. */
const MAJOR_DEGREES: [number, boolean][] = [
  [0, false],
  [2, true],
  [4, true],
  [5, false],
  [7, false],
  [9, true],
];
const MINOR_DEGREES: [number, boolean][] = [
  [0, true],
  [3, false],
  [5, true],
  [7, true],
  [7, false], // harmonic minor dominant (E in A minor)
  [8, false],
  [10, false],
];

export interface KeyEstimate {
  key: MusicalKey;
  /** 0–1, share of chords that fit the key (weighted). */
  confidence: number;
}

/**
 * Estimates the key of a chord progression with a lightweight diatonic-fit score.
 * First and last chords are weighted more heavily because songs usually start and
 * end on the tonic. Returns `null` when no chords are given.
 */
export function detectKey(chordTexts: string[], notation: Notation = 'international'): KeyEstimate | null {
  const chords = chordTexts.map((c) => parseChord(c, notation)).filter((c): c is Chord => c !== null);
  if (chords.length === 0) return null;

  let totalWeight = 0;
  chords.forEach((_, i) => (totalWeight += weightAt(i, chords.length)));

  let bestKey: MusicalKey | null = null;
  let bestScore = -1;

  for (const key of ALL_KEYS) {
    const degrees = key.mode === 'major' ? MAJOR_DEGREES : MINOR_DEGREES;
    let score = 0;

    chords.forEach((chord, i) => {
      const interval = mod12(chord.root - key.tonic);
      const fits = degrees.some(([deg, minor]) => deg === interval && minor === chord.isMinor);
      if (!fits) return;
      score += weightAt(i, chords.length);
      // A tonic chord at the start or end is the strongest signal for the key.
      if (interval === 0 && (i === 0 || i === chords.length - 1)) score += 1;
    });

    // Strictly greater: on a tie the earlier key in ALL_KEYS (majors first) wins.
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey ? { key: bestKey, confidence: Math.min(1, bestScore / totalWeight) } : null;
}

function weightAt(index: number, length: number): number {
  return index === 0 || index === length - 1 ? 1.5 : 1;
}
