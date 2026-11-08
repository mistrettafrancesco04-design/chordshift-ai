import { extractChordsFromWords, normalizeOcrToken, type RecognizedWord } from '../services/analysis/ocr-chords';
import fixture from './fixtures/ocr-amazing-grace.json';

const box = (x: number, y: number, w = 0.03, h = 0.02) => ({ x, y, width: w, height: h });
const word = (text: string, x: number, y: number, confidence = 0.95): RecognizedWord => ({
  text,
  confidence,
  box: box(x, y),
});

describe('normalizeOcrToken', () => {
  it.each([
    ['F♯m', 'F#m'],
    ['B♭', 'Bb'],
    ['Cc', 'C'],
    ['Gg', 'G'],
    ['|Am', 'Am'],
    ['D7,', 'D7'],
    ['(Em)', 'Em'],
    ['C7(b9', 'C7(b9)'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeOcrToken(input)).toBe(expected);
  });

  it('does not turn real words into chords', () => {
    expect(normalizeOcrToken('Ab')).toBe('Ab');
    expect(normalizeOcrToken('Go')).toBe('Go');
  });
});

describe('extractChordsFromWords', () => {
  it('keeps chord lines and rejects lyric lines', () => {
    const words = [
      word('G', 0.1, 0.1),
      word('D/F#', 0.3, 0.1),
      word('Em', 0.5, 0.1),
      word('A', 0.1, 0.2),
      word('-', 0.15, 0.2),
      word('ma', 0.2, 0.2),
      word('zing', 0.3, 0.2),
      word('grace', 0.4, 0.2),
    ];
    expect(extractChordsFromWords(words).map((c) => c.text)).toEqual(['G', 'D/F#', 'Em']);
  });

  it('merges duplicates from two OCR passes, preferring the chord reading', () => {
    const words = [word('Cc', 0.1, 0.1, 0.6), word('C', 0.101, 0.1, 0.9), word('G7', 0.3, 0.1)];
    const result = extractChordsFromWords(words);
    expect(result.map((c) => c.text)).toEqual(['C', 'G7']);
  });

  it('drops low-confidence chords', () => {
    expect(extractChordsFromWords([word('Am', 0.1, 0.1, 0.2)])).toEqual([]);
  });

  it('ignores bar lines when judging a chord line', () => {
    const words = [word('|', 0.05, 0.1), word('C', 0.1, 0.1), word('|', 0.2, 0.1), word('Am', 0.25, 0.1)];
    expect(extractChordsFromWords(words).map((c) => c.text)).toEqual(['C', 'Am']);
  });

  it('extracts every chord from a real Tesseract result (Amazing Grace test sheet)', () => {
    const result = extractChordsFromWords((fixture as { words: RecognizedWord[] }).words);
    expect(result.map((c) => c.text)).toEqual(['G', 'G7', 'C', 'G', 'C', 'G', 'Em', 'D7', 'Em', 'D7']);
    // No lyric or title word may ever be returned.
    expect(result.some((c) => ['A', 'Amazing', 'Grace'].includes(c.text))).toBe(false);
  });
});

describe('context-aware confidence', () => {
  it('accepts a weak reading inside a clearly confirmed chord line', () => {
    const words = [word('Cc', 0.1, 0.1, 0.44), word('G', 0.3, 0.1, 0.9), word('Em', 0.5, 0.1, 0.95)];
    expect(extractChordsFromWords(words).map((c) => c.text)).toEqual(['C', 'G', 'Em']);
  });

  it('still rejects weak readings without line support', () => {
    expect(extractChordsFromWords([word('Cc', 0.1, 0.1, 0.44)])).toEqual([]);
  });
});
