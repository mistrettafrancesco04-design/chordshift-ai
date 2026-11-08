import { engine } from '@/features/engine';
import { createId } from '@/lib/id';

import type { SheetPage, TransposedChord } from '../types';

export interface ExportPage {
  page: SheetPage;
  chords: TransposedChord[];
}

/**
 * Renders the final pages. Only chords whose text actually changes are painted;
 * pages without changes are exported as the untouched original image.
 */
export async function renderPages(
  pages: ExportPage[],
  onProgress?: (done: number, total: number) => void,
): Promise<SheetPage[]> {
  const result: SheetPage[] = [];
  for (let i = 0; i < pages.length; i++) {
    const { page, chords } = pages[i];
    const changed = chords.filter((c) => c.transposed !== c.original);
    if (changed.length === 0) {
      result.push(page);
    } else {
      const missing = changed.filter((c) => !c.appearance);
      const measured = missing.length > 0 ? await engine.measureRegions(page.uri, missing.map((c) => c.box)) : [];
      const composeChords = changed.map((c) => {
        const region = measured[missing.indexOf(c)];
        const appearance = c.appearance ?? (region ? { paper: region.paper, ink: region.ink, maxWidth: region.maxWidth } : undefined);
        return {
          box: c.box,
          text: c.transposed,
          paper: appearance?.paper ?? '#ffffff',
          ink: appearance?.ink ?? '#000000',
          maxWidth: appearance?.maxWidth ?? c.box.width,
        };
      });
      result.push(await engine.composeSheet(page.uri, composeChords, createId(`page${i + 1}_`)));
    }
    onProgress?.(i + 1, pages.length);
  }
  return result;
}
