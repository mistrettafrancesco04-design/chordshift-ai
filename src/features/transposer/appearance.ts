import type { ChordRegion } from '@/features/engine/types';

import type { ChordAnnotation } from './types';

/**
 * Applies a measured region: colours for rendering and the tight ink box, which becomes
 * the chord's box so the mask covers exactly the printed label and nothing else.
 */
export function applyRegion(chord: ChordAnnotation, region: ChordRegion | undefined): ChordAnnotation {
  if (!region) return chord;
  const { tight, ...appearance } = region;
  const box = tight && tight.width * tight.height >= chord.box.width * chord.box.height * 0.05 ? tight : chord.box;
  return { ...chord, box, appearance };
}
