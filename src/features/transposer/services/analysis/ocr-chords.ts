import { NON_CHORD_TOKENS, type Notation, parseChord } from '@/features/music';

import type { ChordAnnotation, NormalizedRect } from '../../types';

export interface RecognizedWord {
  text: string;
  confidence: number;
  box: NormalizedRect;
}

/** Tokens that are layout noise rather than lyrics (bar lines, dashes, OCR crumbs). */
const NOISE = /^[|/\\\-–—_=~:;.,'"`*•·()[\]{}]+$/;

/**
 * Repairs typical OCR confusions on chord labels without ever inventing chords:
 * unicode accidentals, stray punctuation, and a doubled root letter ("Cc" → "C").
 */
export function normalizeOcrToken(raw: string): string {
  let text = raw
    .trim()
    .replace(/[♯＃]/g, '#')
    .replace(/♭/g, 'b')
    .replace(/[‘’`´]/g, "'")
    .replace(/^[|(\[{'".,:;]+/, '')
    .replace(/[|)\]}'".,:;]+$/, '');
  // Re-add a closing parenthesis that belonged to the chord, e.g. "C7(b9" after trimming.
  if (text.includes('(') && !text.includes(')')) text += ')';
  const doubled = /^([A-H])([a-h])$/.exec(text);
  // "Bb" is a real chord (B flat), so a doubled b is never collapsed.
  if (doubled && doubled[2] !== 'b' && doubled[1].toLowerCase() === doubled[2]) text = doubled[1];
  return text;
}

function iou(a: NormalizedRect, b: NormalizedRect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

interface Candidate extends RecognizedWord {
  normalized: string;
  isChord: boolean;
  isNoise: boolean;
}

/**
 * Turns raw OCR words into chord annotations.
 *
 * 1. normalise tokens and parse them with the strict chord grammar
 * 2. merge duplicates from the two OCR passes (overlapping boxes)
 * 3. group words into text lines by vertical position
 * 4. keep only *chord lines* (≥ 60 % of the non-noise tokens are chords) – lyric lines
 *    such as "A - ma - zing grace" are rejected even though "A" is a valid chord
 */
export function extractChordsFromWords(
  words: RecognizedWord[],
  notation: Notation = 'international',
  minConfidence = 0.45,
): ChordAnnotation[] {
  const candidates: Candidate[] = words
    .filter((w) => w.box.width > 0 && w.box.height > 0)
    .map((w) => {
      const normalized = normalizeOcrToken(w.text);
      return {
        ...w,
        normalized,
        isNoise: normalized.length === 0 || NOISE.test(normalized) || NON_CHORD_TOKENS.has(normalized),
        isChord: parseChord(normalized, notation) !== null,
      };
    });

  // Merge duplicates: prefer chord readings, then higher confidence.
  const ranked = [...candidates].sort(
    (a, b) => Number(b.isChord) - Number(a.isChord) || b.confidence - a.confidence,
  );
  const unique: Candidate[] = [];
  for (const c of ranked) {
    if (!unique.some((u) => iou(u.box, c.box) > 0.35)) unique.push(c);
  }

  // Group into lines.
  const sorted = unique.sort((a, b) => a.box.y + a.box.height / 2 - (b.box.y + b.box.height / 2));
  const lines: Candidate[][] = [];
  for (const word of sorted) {
    const cy = word.box.y + word.box.height / 2;
    const line = lines.find((l) => {
      const ref = l[0];
      const refCy = ref.box.y + ref.box.height / 2;
      return Math.abs(refCy - cy) < Math.max(ref.box.height, word.box.height) * 0.5;
    });
    if (line) line.push(word);
    else lines.push([word]);
  }

  const chords: ChordAnnotation[] = [];
  for (const line of lines) {
    const meaningful = line.filter((w) => !w.isNoise);
    // A line with at least two confidently read chords is clearly a chord line; there,
    // weaker readings of short labels (e.g. a lone "C") are accepted too.
    const confirmed = meaningful.filter((w) => w.isChord && w.confidence >= 0.7).length >= 2;
    const threshold = confirmed ? Math.min(minConfidence, 0.25) : minConfidence;
    const lineChords = meaningful.filter((w) => w.isChord && w.confidence >= threshold);
    if (lineChords.length === 0) continue;
    if (lineChords.length / meaningful.length < 0.6) continue;

    for (const w of lineChords.sort((a, b) => a.box.x - b.box.x)) {
      chords.push({
        id: `ocr-${chords.length}`,
        text: w.normalized,
        box: w.box,
        confidence: w.confidence,
      });
    }
  }
  return chords.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
}
