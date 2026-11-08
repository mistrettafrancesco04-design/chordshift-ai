import { detectKey } from '../detect-key';
import { formatKey, getKey, semitonesBetween, transposeKey } from '../keys';

describe('keys', () => {
  it('computes the smallest interval between keys', () => {
    expect(semitonesBetween(getKey('C')!, getKey('D')!)).toBe(2);
    expect(semitonesBetween(getKey('C')!, getKey('A')!)).toBe(-3);
    expect(semitonesBetween(getKey('G')!, getKey('C')!)).toBe(5);
    expect(semitonesBetween(getKey('C')!, getKey('F#')!)).toBe(-6);
  });

  it('transposes keys and keeps the mode', () => {
    expect(transposeKey(getKey('Am')!, 2).id).toBe('Bm');
    expect(transposeKey(getKey('F')!, -1).id).toBe('E');
  });

  it('formats keys for both notations', () => {
    expect(formatKey(getKey('Bb')!)).toBe('Bb');
    expect(formatKey(getKey('Bb')!, 'german')).toBe('B-Dur');
    expect(formatKey(getKey('Bm')!, 'german')).toBe('H-Moll');
  });
});

describe('detectKey', () => {
  it('detects common major progressions', () => {
    expect(detectKey(['G', 'D', 'Em', 'C', 'G'])?.key.id).toBe('G');
    expect(detectKey(['C', 'Am', 'F', 'G7', 'C'])?.key.id).toBe('C');
    expect(detectKey(['Bb', 'F', 'Gm', 'Eb', 'Bb'])?.key.id).toBe('Bb');
  });

  it('detects minor progressions', () => {
    expect(detectKey(['Am', 'Dm', 'E7', 'Am'])?.key.id).toBe('Am');
    expect(detectKey(['Em', 'C', 'G', 'D', 'Em'])?.key.id).toBe('Em');
  });

  it('returns null without chords', () => {
    expect(detectKey([])).toBeNull();
    expect(detectKey(['Hallo', 'Welt'])).toBeNull();
  });
});
