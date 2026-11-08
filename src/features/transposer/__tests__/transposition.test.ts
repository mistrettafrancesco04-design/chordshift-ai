import { getKey } from '@/features/music';

import { normalizeSemitones, resolveOriginalKey, transposeAnalysis, wrapSemitones } from '../transposition';
import type { SheetAnalysis } from '../types';

const box = { x: 0.1, y: 0.1, width: 0.05, height: 0.02 };
const analysis: SheetAnalysis = {
  analyzer: 'test',
  durationMs: 0,
  chords: [
    { id: '1', text: 'G', box, confidence: 1 },
    { id: '2', text: 'D/F#', box, confidence: 1 },
    { id: '3', text: 'Em7', box, confidence: 1 },
    { id: '4', text: 'C', box, confidence: 1 },
    { id: '5', text: 'G', box, confidence: 1 },
  ],
};

describe('transposeAnalysis', () => {
  it('transposes every chord and keeps positions', () => {
    const result = transposeAnalysis(analysis, {
      semitones: -2,
      originalKey: getKey('G')!,
      inputNotation: 'international',
      outputNotation: 'international',
      accidentals: 'auto',
    });
    expect(result.map((c) => c.transposed)).toEqual(['F', 'C/E', 'Dm7', 'Bb', 'F']);
    expect(result.every((c) => c.box === box)).toBe(true);
  });

  it('spells chords according to the target key', () => {
    const result = transposeAnalysis(analysis, {
      semitones: 1,
      originalKey: getKey('G')!,
      inputNotation: 'international',
      outputNotation: 'international',
      accidentals: 'auto',
    });
    // G → Ab major: flats everywhere
    expect(result.map((c) => c.transposed)).toEqual(['Ab', 'Eb/G', 'Fm7', 'Db', 'Ab']);
  });
});

describe('resolveOriginalKey', () => {
  it('prefers the analyzer key and falls back to local detection', () => {
    expect(resolveOriginalKey({ ...analysis, detectedKey: 'D' }, 'international')?.id).toBe('D');
    expect(resolveOriginalKey(analysis, 'international')?.id).toBe('G');
  });
});

describe('semitone helpers', () => {
  it('clamps and wraps', () => {
    expect(normalizeSemitones(15)).toBe(11);
    expect(normalizeSemitones(-15)).toBe(-11);
    expect(wrapSemitones(12)).toBe(0);
    expect(wrapSemitones(-12)).toBe(0);
    expect(wrapSemitones(5)).toBe(5);
  });
});
