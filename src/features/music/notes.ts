/**
 * Pitch-class primitives.
 *
 * A pitch class is an integer 0–11 (C = 0 … B = 11). All transposition math
 * happens on pitch classes; spelling (sharp vs. flat, international vs. German
 * notation) is applied only when converting back to text.
 */

export type PitchClass = number;

/** How accidentals are written when a pitch class is turned back into text. */
export type AccidentalStyle = 'sharp' | 'flat';

/**
 * Note naming convention.
 * - `international`: C D E F G A B (B = pitch class 11, Bb = 10)
 * - `german`:        C D E F G A H (H = pitch class 11, B = 10)
 */
export type Notation = 'international' | 'german';

const NATURALS: Record<string, PitchClass> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/**
 * Spelling most common on lead sheets when no key context is known:
 * flats for Db, Eb, Ab, Bb and a sharp for F#.
 */
const CONVENTIONAL_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** Matches a note name at the start of a string: letter + up to two accidentals. */
export const NOTE_PATTERN = '[A-H](?:##|bb|[#b♯♭])?';

export function mod12(value: number): PitchClass {
  return ((value % 12) + 12) % 12;
}

export function accidentalOffset(accidental: string): number {
  let offset = 0;
  for (const char of accidental) {
    if (char === '#' || char === '♯') offset += 1;
    else if (char === 'b' || char === '♭') offset -= 1;
  }
  return offset;
}

/**
 * Parses a note name such as `C`, `F#`, `Bb`, `E♭` or (German) `H`.
 * Returns `null` if the string is not a note name.
 */
export function parseNote(
  name: string,
  notation: Notation = 'international',
): { pitchClass: PitchClass; style: AccidentalStyle | null } | null {
  const match = /^([A-H])((?:##|bb|[#b♯♭])?)$/.exec(name);
  if (!match) return null;
  const [, letter, accidental] = match;

  let base: number;
  if (letter === 'H') {
    // H only exists in German notation; tolerate it everywhere because it is unambiguous.
    base = 11;
  } else if (letter === 'B' && notation === 'german') {
    // German "B" is the international "Bb"; "Bb" in German sheets is uncommon but means Bbb.
    base = 10;
  } else {
    base = NATURALS[letter];
  }

  const offset = accidentalOffset(accidental);
  let style: AccidentalStyle | null = null;
  if (offset > 0) style = 'sharp';
  else if (offset < 0) style = 'flat';
  else if (letter === 'B' && notation === 'german') style = 'flat';

  return { pitchClass: mod12(base + offset), style };
}

/** Converts a pitch class back to a note name. */
export function spellPitchClass(
  pitchClass: PitchClass,
  style: AccidentalStyle | 'conventional',
  notation: Notation = 'international',
): string {
  const pc = mod12(pitchClass);
  const table =
    style === 'sharp' ? SHARP_NAMES : style === 'flat' ? FLAT_NAMES : CONVENTIONAL_NAMES;
  const name: string = table[pc];

  if (notation === 'german') {
    if (name === 'B') return 'H';
    if (name === 'Bb') return 'B';
  }
  return name;
}
