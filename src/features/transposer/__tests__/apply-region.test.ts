import { applyRegion } from '../appearance';

const chord = { id: 'a', text: 'C', box: { x: 0.1, y: 0.1, width: 0.04, height: 0.02 }, confidence: 0.9 };

describe('applyRegion', () => {
  it('shrinks the box to the measured ink and stores colours', () => {
    const tight = { x: 0.105, y: 0.104, width: 0.02, height: 0.014 };
    const result = applyRegion(chord, { paper: '#ffffff', ink: '#111111', maxWidth: 0.06, tight });
    expect(result.box).toEqual(tight);
    expect(result.appearance).toEqual({ paper: '#ffffff', ink: '#111111', maxWidth: 0.06 });
  });

  it('keeps the detected box when no ink was found', () => {
    expect(applyRegion(chord, { paper: '#fff', ink: '#000', maxWidth: 0.04, tight: null }).box).toBe(chord.box);
  });
});
