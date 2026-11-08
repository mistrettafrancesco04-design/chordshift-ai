import { isChordSymbol, parseChord } from '../chord';

describe('parseChord', () => {
  it.each([
    'C', 'Cm', 'C7', 'Cmaj7', 'CM7', 'CΔ7', 'Cm7b5', 'Cø', 'C°7', 'Co7', 'Cdim', 'Caug', 'C+',
    'Csus4', 'Csus2', 'Csus', 'Cadd9', 'C6', 'C6/9', 'C9', 'C11', 'C13', 'C7#9', 'C7b9', 'C7(#11)',
    'C7(b9,#11)', 'C7alt', 'C5', 'Cmmaj7', 'Cmin7', 'C-7', 'F#m7', 'Bbmaj7', 'Ebm', 'G/B', 'D/F#',
    'Am7/G', 'E♭maj7', 'F♯m', 'C#m7(b5)/G#',
  ])('accepts %s', (symbol) => {
    expect(isChordSymbol(symbol)).toBe(true);
  });

  it.each([
    'Bob', 'Do', 'Ehre', 'And', 'Bad', 'Gott', 'Echo', 'Amen', 'C/', 'H2O', 'Cx', '', 'c', 'am', 'Dear',
  ])('rejects %s', (word) => {
    expect(isChordSymbol(word)).toBe(false);
  });

  it('separates root, suffix and bass', () => {
    const chord = parseChord('F#m7(b5)/C');
    expect(chord).toMatchObject({ root: 6, rootStyle: 'sharp', suffix: 'm7(b5)', bass: 0, isMinor: true });
  });

  it('keeps unicode accidentals in the suffix', () => {
    expect(parseChord('C7♭9')?.suffix).toBe('7♭9');
  });

  it('detects minor qualities but not major-seventh', () => {
    expect(parseChord('Am')?.isMinor).toBe(true);
    expect(parseChord('Amin7')?.isMinor).toBe(true);
    expect(parseChord('A-7')?.isMinor).toBe(true);
    expect(parseChord('Amaj7')?.isMinor).toBe(false);
    expect(parseChord('Ama7')?.isMinor).toBe(false);
    expect(parseChord('A7')?.isMinor).toBe(false);
  });

  it('reads German notation', () => {
    expect(parseChord('H7', 'german')?.root).toBe(11);
    expect(parseChord('B', 'german')?.root).toBe(10);
    expect(parseChord('B', 'international')?.root).toBe(11);
  });
});
