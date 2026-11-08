import { getKey } from '../keys';
import { isChordLine, transposeChord, transposeText } from '../transpose';

describe('transposeChord', () => {
  it('transposes roots and keeps the suffix verbatim', () => {
    expect(transposeChord('C', 2)).toBe('D');
    expect(transposeChord('Am7', 3)).toBe('Cm7');
    expect(transposeChord('Cmaj7(#11)', 1)).toBe('Dbmaj7(#11)');
    expect(transposeChord('Dm7b5', -2)).toBe('Cm7b5');
  });

  it('transposes slash-chord bass notes', () => {
    expect(transposeChord('G/B', 2)).toBe('A/C#');
    expect(transposeChord('D/F#', -2)).toBe('C/E');
  });

  it('keeps the original accidental style when no key is given', () => {
    expect(transposeChord('Bb', 1)).toBe('B');
    expect(transposeChord('Bb', 2)).toBe('C');
    expect(transposeChord('Eb', 2)).toBe('F');
    expect(transposeChord('Eb', -1)).toBe('D');
    expect(transposeChord('Ab', 2)).toBe('Bb');
    expect(transposeChord('F#', 1)).toBe('G');
    expect(transposeChord('C#', 2)).toBe('D#');
  });

  it('uses conventional spelling for natural roots', () => {
    expect(transposeChord('C', 1)).toBe('Db');
    expect(transposeChord('C', 3)).toBe('Eb');
    expect(transposeChord('C', 6)).toBe('F#');
    expect(transposeChord('C', 10)).toBe('Bb');
  });

  it('follows the target key signature in auto mode', () => {
    const targetKey = getKey('E');
    expect(transposeChord('Ab', 0, { targetKey })).toBe('G#');
    expect(transposeChord('C/E', 4, { targetKey })).toBe('E/G#');
    expect(transposeChord('G', 3, { targetKey: getKey('Bb') })).toBe('Bb');
  });

  it('honours forced accidentals', () => {
    expect(transposeChord('C', 1, { accidentals: 'sharps' })).toBe('C#');
    expect(transposeChord('C', 1, { accidentals: 'flats' })).toBe('Db');
  });

  it('handles full octave and negative wrap-around', () => {
    expect(transposeChord('E', 12)).toBe('E');
    expect(transposeChord('C', -1)).toBe('B');
    expect(transposeChord('C', -13)).toBe('B');
  });

  it('writes German notation', () => {
    expect(transposeChord('A', 2, { outputNotation: 'german' })).toBe('H');
    expect(transposeChord('A', 1, { outputNotation: 'german', accidentals: 'flats' })).toBe('B');
    expect(transposeChord('H7', 2, { notation: 'german' })).toBe('Db7');
  });

  it('returns non-chord text unchanged', () => {
    expect(transposeChord('Hallelujah', 5)).toBe('Hallelujah');
    expect(transposeChord('N.C.', 5)).toBe('N.C.');
  });
});

describe('transposeText', () => {
  const sheet = ['G       D/F#    Em', 'Amazing grace, how sweet', 'A Am the sound'].join('\n');

  it('changes only chord lines', () => {
    const lines = transposeText(sheet, 2).split('\n');
    expect(lines[0]).toBe('A       E/G#    F#m');
    expect(lines[1]).toBe('Amazing grace, how sweet');
    expect(lines[2]).toBe('A Am the sound');
  });

  it('keeps chord columns aligned when chord length changes', () => {
    const out = transposeText('C       F       G', 1);
    expect(out).toBe('Db      F#      Ab');
    expect(out.indexOf('F#')).toBe(8);
    expect(out.indexOf('Ab')).toBe(16);
  });

  it('recognises chord lines with bar markers', () => {
    expect(isChordLine('| C  | Am | F  G |')).toBe(true);
    expect(isChordLine('Let it be')).toBe(false);
  });
});
