import { type AccidentalStyle, type Notation, type PitchClass, mod12, spellPitchClass } from './notes';

export type KeyMode = 'major' | 'minor';
export type KeySpelling = AccidentalStyle | 'conventional';

export interface MusicalKey {
  /** Stable identifier, e.g. `C`, `F#m`, `Bb`. Always international spelling. */
  id: string;
  tonic: PitchClass;
  mode: KeyMode;
  /**
   * Accidental style used by this key's signature. Keys without accidentals
   * (C major / A minor) use the conventional lead-sheet spelling for chromatic chords.
   */
  style: KeySpelling;
}

/**
 * Major keys and the accidental style of their signature.
 * F# is listed instead of Gb (6 sharps vs. 6 flats – both are valid, F# is more common
 * on lead sheets).
 */
const MAJOR_KEYS: { name: string; tonic: PitchClass; style: KeySpelling }[] = [
  { name: 'C', tonic: 0, style: 'conventional' },
  { name: 'Db', tonic: 1, style: 'flat' },
  { name: 'D', tonic: 2, style: 'sharp' },
  { name: 'Eb', tonic: 3, style: 'flat' },
  { name: 'E', tonic: 4, style: 'sharp' },
  { name: 'F', tonic: 5, style: 'flat' },
  { name: 'F#', tonic: 6, style: 'sharp' },
  { name: 'G', tonic: 7, style: 'sharp' },
  { name: 'Ab', tonic: 8, style: 'flat' },
  { name: 'A', tonic: 9, style: 'sharp' },
  { name: 'Bb', tonic: 10, style: 'flat' },
  { name: 'B', tonic: 11, style: 'sharp' },
];

/** Minor keys share the signature of their relative major (tonic + 3 semitones). */
const MINOR_KEYS: { name: string; tonic: PitchClass; style: KeySpelling }[] = [
  { name: 'Cm', tonic: 0, style: 'flat' },
  { name: 'C#m', tonic: 1, style: 'sharp' },
  { name: 'Dm', tonic: 2, style: 'flat' },
  { name: 'Ebm', tonic: 3, style: 'flat' },
  { name: 'Em', tonic: 4, style: 'sharp' },
  { name: 'Fm', tonic: 5, style: 'flat' },
  { name: 'F#m', tonic: 6, style: 'sharp' },
  { name: 'Gm', tonic: 7, style: 'flat' },
  { name: 'G#m', tonic: 8, style: 'sharp' },
  { name: 'Am', tonic: 9, style: 'conventional' },
  { name: 'Bbm', tonic: 10, style: 'flat' },
  { name: 'Bm', tonic: 11, style: 'sharp' },
];

export const ALL_KEYS: MusicalKey[] = [
  ...MAJOR_KEYS.map((k) => ({ id: k.name, tonic: k.tonic, mode: 'major' as const, style: k.style })),
  ...MINOR_KEYS.map((k) => ({ id: k.name, tonic: k.tonic, mode: 'minor' as const, style: k.style })),
];

export const MAJOR_KEY_LIST = ALL_KEYS.filter((k) => k.mode === 'major');
export const MINOR_KEY_LIST = ALL_KEYS.filter((k) => k.mode === 'minor');

export function getKey(id: string): MusicalKey | undefined {
  return ALL_KEYS.find((k) => k.id === id);
}

export function findKey(tonic: PitchClass, mode: KeyMode): MusicalKey {
  const key = ALL_KEYS.find((k) => k.tonic === mod12(tonic) && k.mode === mode);
  // ALL_KEYS covers every tonic/mode combination, so this cannot fail.
  return key!;
}

/** Returns the key reached by transposing `key` by `semitones`. */
export function transposeKey(key: MusicalKey, semitones: number): MusicalKey {
  return findKey(key.tonic + semitones, key.mode);
}

/**
 * Smallest signed interval (−6 … +5 semitones) that moves `from` to `to`.
 * Picking the smallest interval keeps transposed chords in a familiar register
 * for players who think in "up 2" / "down 3".
 */
export function semitonesBetween(from: MusicalKey, to: MusicalKey): number {
  const diff = mod12(to.tonic - from.tonic);
  return diff > 5 ? diff - 12 : diff;
}

/** Human readable key label, e.g. `F# Dur` / `H-Moll` for German UI. */
export function formatKey(key: MusicalKey, notation: Notation = 'international'): string {
  const tonic = spellPitchClass(key.tonic, key.style, notation);
  if (notation === 'german') {
    return key.mode === 'major' ? `${tonic}-Dur` : `${tonic}-Moll`;
  }
  return key.mode === 'major' ? tonic : `${tonic}m`;
}
