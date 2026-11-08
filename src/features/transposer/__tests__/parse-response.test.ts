import { AnalyzerResponseError, parseAnalysisResponse } from '../services/analysis';

describe('parseAnalysisResponse', () => {
  it('accepts valid chords and normalises boxes', () => {
    const result = parseAnalysisResponse(
      {
        chords: [
          { id: 'a', text: 'Am7', box: { x: 0.1, y: 0.2, width: 0.05, height: 0.02 }, confidence: 0.9 },
          { text: ' G/B ', box: { x: 0.98, y: 0.5, width: 0.1, height: 0.02 } },
        ],
        detectedKey: 'C',
        durationMs: 420,
      },
      'test',
    );
    expect(result.chords).toHaveLength(2);
    expect(result.chords[0]).toMatchObject({ id: 'a', text: 'Am7', confidence: 0.9 });
    expect(result.chords[1].text).toBe('G/B');
    expect(result.chords[1].id).toBe('chord-1');
    expect(result.chords[1].box.width).toBeCloseTo(0.02);
    expect(result.detectedKey).toBe('C');
    expect(result.durationMs).toBe(420);
  });

  it('drops OCR noise that is not a chord symbol', () => {
    const box = { x: 0, y: 0, width: 0.1, height: 0.1 };
    const result = parseAnalysisResponse(
      { chords: [{ text: 'Hallelujah', box }, { text: 'F#m', box }, { text: 'C', box: { x: 'a' } }, null] },
      'test',
    );
    expect(result.chords.map((c) => c.text)).toEqual(['F#m']);
  });

  it('rejects malformed payloads', () => {
    expect(() => parseAnalysisResponse({ foo: 1 }, 'test')).toThrow(AnalyzerResponseError);
    expect(() => parseAnalysisResponse(null, 'test')).toThrow(AnalyzerResponseError);
  });
});
