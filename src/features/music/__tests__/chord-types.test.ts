import { findKey, formatKey, getKey, transposeKey } from '../keys';
import { transposeChord } from '../transpose';

/**
 * A progression covering major, minor, seventh chords and slash chords, transposed from
 * C major into all twelve keys with key-aware spelling.
 */
const PROGRESSION = ['C', 'Am', 'Dm7', 'G7', 'Cmaj7', 'Em7b5', 'A7', 'F/A', 'G/B', 'Bdim7'];

const EXPECTED: Record<string, string[]> = {
  C: ['C', 'Am', 'Dm7', 'G7', 'Cmaj7', 'Em7b5', 'A7', 'F/A', 'G/B', 'Bdim7'],
  Db: ['Db', 'Bbm', 'Ebm7', 'Ab7', 'Dbmaj7', 'Fm7b5', 'Bb7', 'Gb/Bb', 'Ab/C', 'Cdim7'],
  D: ['D', 'Bm', 'Em7', 'A7', 'Dmaj7', 'F#m7b5', 'B7', 'G/B', 'A/C#', 'C#dim7'],
  Eb: ['Eb', 'Cm', 'Fm7', 'Bb7', 'Ebmaj7', 'Gm7b5', 'C7', 'Ab/C', 'Bb/D', 'Ddim7'],
  E: ['E', 'C#m', 'F#m7', 'B7', 'Emaj7', 'G#m7b5', 'C#7', 'A/C#', 'B/D#', 'D#dim7'],
  F: ['F', 'Dm', 'Gm7', 'C7', 'Fmaj7', 'Am7b5', 'D7', 'Bb/D', 'C/E', 'Edim7'],
  'F#': ['F#', 'D#m', 'G#m7', 'C#7', 'F#maj7', 'A#m7b5', 'D#7', 'B/D#', 'C#/F', 'Fdim7'],
  G: ['G', 'Em', 'Am7', 'D7', 'Gmaj7', 'Bm7b5', 'E7', 'C/E', 'D/F#', 'F#dim7'],
  Ab: ['Ab', 'Fm', 'Bbm7', 'Eb7', 'Abmaj7', 'Cm7b5', 'F7', 'Db/F', 'Eb/G', 'Gdim7'],
  A: ['A', 'F#m', 'Bm7', 'E7', 'Amaj7', 'C#m7b5', 'F#7', 'D/F#', 'E/G#', 'G#dim7'],
  Bb: ['Bb', 'Gm', 'Cm7', 'F7', 'Bbmaj7', 'Dm7b5', 'G7', 'Eb/G', 'F/A', 'Adim7'],
  B: ['B', 'G#m', 'C#m7', 'F#7', 'Bmaj7', 'D#m7b5', 'G#7', 'E/G#', 'F#/A#', 'A#dim7'],
};

describe('transposition across all twelve keys', () => {
  it.each(Object.keys(EXPECTED))('C major → %s major', (keyId) => {
    const target = getKey(keyId)!;
    const semitones = target.tonic;
    expect(PROGRESSION.map((c) => transposeChord(c, semitones, { targetKey: target }))).toEqual(EXPECTED[keyId]);
  });

  it('round-trips every chord through all 12 semitone shifts', () => {
    for (let s = -11; s <= 11; s++) {
      for (const chord of PROGRESSION) {
        const there = transposeChord(chord, s, { accidentals: 'sharps' });
        const back = transposeChord(there, -s, { accidentals: 'flats' });
        expect(transposeChord(back, 0, { accidentals: 'sharps' })).toBe(transposeChord(chord, 0, { accidentals: 'sharps' }));
      }
    }
  });

  it('keeps minor keys minor and spells them by their signature', () => {
    const am = getKey('Am')!;
    expect(formatKey(transposeKey(am, 1))).toBe('Bbm');
    expect(formatKey(transposeKey(am, 3))).toBe('Cm');
    expect(transposeChord('E7', 3, { targetKey: findKey(0, 'minor') })).toBe('G7');
    expect(transposeChord('Am', 1, { targetKey: getKey('Bbm') })).toBe('Bbm');
  });
});
