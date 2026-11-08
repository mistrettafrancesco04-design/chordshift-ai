import {
  type AccidentalStyle,
  type Notation,
  type PitchClass,
  NOTE_PATTERN,
  parseNote,
} from './notes';

/**
 * A parsed chord symbol.
 *
 * Only `root` and `bass` are ever changed by transposition. The `suffix`
 * (quality, extensions, alterations) is kept byte-for-byte so that the
 * transposed symbol reads exactly like the original, e.g. `F#m7(b5)/C` → `Gm7(b5)/C#`.
 */
export interface Chord {
  /** Original text as found on the sheet. */
  source: string;
  root: PitchClass;
  rootStyle: AccidentalStyle | null;
  suffix: string;
  bass: PitchClass | null;
  bassStyle: AccidentalStyle | null;
  isMinor: boolean;
}

// --- Suffix grammar ---------------------------------------------------------
// A deliberately strict grammar: it accepts real-world chord suffixes but rejects
// ordinary words. This matters because OCR output contains lyrics, and a word like
// "Bob" or "Ehre" must never be mistaken for a chord.

const QUALITY = '(?:maj|Maj|MAJ|ma|M|Δ|min|mi|m|-|dim|°|o(?=\\d)|aug|\\+|ø)?';
const MODIFIER =
  '(?:sus[24]?|add[#b♯♭]?\\d{1,2}|alt|no\\d|6\\/9|[#b♯♭+\\-]\\d{1,2}|maj\\d{1,2}|M\\d{1,2}|Δ\\d{0,2}|\\d{1,2})';
const PAREN_GROUP = `\\((?:${MODIFIER})(?:[,\\s]*${MODIFIER})*\\)`;
const SUFFIX = `${QUALITY}(?:${MODIFIER}|${PAREN_GROUP})*`;

const CHORD_REGEX = new RegExp(`^(${NOTE_PATTERN})(${SUFFIX})(?:\\/(${NOTE_PATTERN}))?$`);

const MINOR_QUALITY = /^(?:m(?!aj|a)|min|mi|-)/;

/** Tokens that appear in chord lines but are not chords and must stay untouched. */
export const NON_CHORD_TOKENS = new Set(['N.C.', 'NC', 'N.C', '%', '|', '||', ':|', '|:', '/', '-']);

/**
 * Parses a chord symbol. Returns `null` if the text is not a chord symbol.
 * Leading/trailing whitespace is not allowed – tokenise first.
 */
export function parseChord(text: string, notation: Notation = 'international'): Chord | null {
  const normalized = text.replace(/♯/g, '#').replace(/♭/g, 'b');
  const match = CHORD_REGEX.exec(normalized);
  if (!match) return null;

  const [, rootName, suffix, bassName] = match;
  const root = parseNote(rootName, notation);
  if (!root) return null;

  let bass: ReturnType<typeof parseNote> = null;
  if (bassName) {
    bass = parseNote(bassName, notation);
    if (!bass) return null;
  }

  return {
    source: text,
    root: root.pitchClass,
    rootStyle: root.style,
    // Keep the suffix exactly as written in the source (including ♯/♭ glyphs).
    suffix: extractOriginalSuffix(text, rootName.length, bassName ? bassName.length + 1 : 0),
    bass: bass ? bass.pitchClass : null,
    bassStyle: bass ? bass.style : null,
    isMinor: MINOR_QUALITY.test(suffix),
  };
}

function extractOriginalSuffix(text: string, rootLength: number, bassLength: number): string {
  return text.slice(rootLength, bassLength > 0 ? text.length - bassLength : text.length);
}

export function isChordSymbol(text: string, notation: Notation = 'international'): boolean {
  return parseChord(text, notation) !== null;
}
