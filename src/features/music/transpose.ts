import { type Chord, NON_CHORD_TOKENS, parseChord } from './chord';
import { type KeySpelling, type MusicalKey, findKey } from './keys';
import { type AccidentalStyle, type Notation, spellPitchClass } from './notes';

/**
 * User preference for accidentals in the transposed output.
 * - `auto`: derived from the target key, falling back to the original chord's style.
 * - `sharps` / `flats`: forced.
 */
export type AccidentalPreference = 'auto' | 'sharps' | 'flats';

export interface TransposeOptions {
  /** Notation used to read the source chords. */
  notation?: Notation;
  /** Notation used to write the output. Defaults to `notation`. */
  outputNotation?: Notation;
  accidentals?: AccidentalPreference;
  /** Target key – drives enharmonic spelling when `accidentals` is `auto`. */
  targetKey?: MusicalKey | null;
}

function resolveSpelling(
  original: AccidentalStyle | null,
  options: TransposeOptions,
): KeySpelling {
  const pref = options.accidentals ?? 'auto';
  if (pref === 'sharps') return 'sharp';
  if (pref === 'flats') return 'flat';
  if (options.targetKey) return options.targetKey.style;
  return original ?? 'conventional';
}

/** Transposes an already parsed chord and returns its new text. */
export function transposeParsedChord(
  chord: Chord,
  semitones: number,
  options: TransposeOptions = {},
): string {
  const notation = options.outputNotation ?? options.notation ?? 'international';
  const rootStyle = resolveSpelling(chord.rootStyle, options);
  const newRoot = chord.root + semitones;
  let result = spellPitchClass(newRoot, rootStyle, notation) + chord.suffix;

  if (chord.bass !== null) {
    let bassStyle = resolveSpelling(chord.bassStyle ?? chord.rootStyle, options);
    if (bassStyle === 'conventional') {
      // Without other context, spell the bass within the chord's own key: A/C#, not A/Db.
      bassStyle = findKey(newRoot, chord.isMinor ? 'minor' : 'major').style;
    }
    result += '/' + spellPitchClass(chord.bass + semitones, bassStyle, notation);
  }
  return result;
}

/**
 * Transposes a single chord symbol. Text that is not a chord symbol is returned
 * unchanged – this is the core guarantee of the app: only chords change.
 */
export function transposeChord(
  text: string,
  semitones: number,
  options: TransposeOptions = {},
): string {
  const chord = parseChord(text, options.notation);
  if (!chord) return text;
  return transposeParsedChord(chord, semitones, options);
}

export interface LineToken {
  text: string;
  kind: 'chord' | 'marker' | 'space' | 'text';
}

/** Splits a line into whitespace, chord, marker and plain text tokens (lossless). */
export function tokenizeLine(line: string, notation: Notation = 'international'): LineToken[] {
  const parts = line.match(/\s+|[^\s]+/g) ?? [];
  return parts.map((part) => {
    if (/^\s+$/.test(part)) return { text: part, kind: 'space' };
    if (NON_CHORD_TOKENS.has(part)) return { text: part, kind: 'marker' };
    if (parseChord(part, notation)) return { text: part, kind: 'chord' };
    return { text: part, kind: 'text' };
  });
}

/**
 * A line counts as a chord line when every non-space token is a chord or
 * a structural marker. Lyric lines are left completely untouched, even when they
 * contain words that look like chords ("A", "Am").
 */
export function isChordLine(line: string, notation: Notation = 'international'): boolean {
  const tokens = tokenizeLine(line, notation).filter((t) => t.kind !== 'space');
  return tokens.length > 0 && tokens.every((t) => t.kind !== 'text') && tokens.some((t) => t.kind === 'chord');
}

/**
 * Transposes chord lines inside a multi-line text (chords-over-lyrics format).
 * Lyric lines are returned byte-for-byte unchanged. Column alignment of chord lines
 * is preserved by padding/trimming the whitespace after a chord whose length changed.
 */
export function transposeText(text: string, semitones: number, options: TransposeOptions = {}): string {
  return text
    .split('\n')
    .map((line) => (isChordLine(line, options.notation) ? transposeChordLine(line, semitones, options) : line))
    .join('\n');
}

function transposeChordLine(line: string, semitones: number, options: TransposeOptions): string {
  const tokens = tokenizeLine(line, options.notation);
  let drift = 0; // characters gained (+) or lost (−) so far
  let out = '';

  for (const token of tokens) {
    if (token.kind === 'chord') {
      const next = transposeChord(token.text, semitones, options);
      drift += next.length - token.text.length;
      out += next;
    } else if (token.kind === 'space' && drift !== 0) {
      // Re-align following chords with the lyrics below; always keep one space.
      const width = Math.max(1, token.text.length - drift);
      drift -= token.text.length - width;
      out += ' '.repeat(width);
    } else {
      out += token.text;
    }
  }
  return out;
}
