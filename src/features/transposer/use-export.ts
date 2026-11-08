import { useState } from 'react';
import { useLibraryStore } from '@/features/library/library-store';
import { notify } from '@/lib/dialog';
import { haptics } from '@/lib/haptics';

import { renderPages } from './services/export-sheet';
import { shareRenderedPages } from './services/share-export';
import { useStudioStore } from './studio-store';
import { useTransposedPages } from './use-transposed-pages';

/** Renders all pages with the engine and opens the share sheet. */
export function useExport() {
  const source = useStudioStore((s) => s.source);
  const projectId = useStudioStore((s) => s.projectId);
  const projectTitle = useLibraryStore((s) => s.projects.find((p) => p.id === projectId)?.title);
  const pages = useTransposedPages();
  const [progress, setProgress] = useState<string | null>(null);

  async function exportSheet() {
    if (!source || progress) return;
    setProgress('Wird gerendert …');
    try {
      const rendered = await renderPages(
        source.pages.map((page, i) => ({ page, chords: pages[i] ?? [] })),
        (done, total) => setProgress(`Seite ${done} von ${total} gerendert`),
      );
      setProgress('Teilen wird geöffnet …');
      const title = projectTitle ?? (source.fileName ?? 'CHORDSHIFT').replace(/\.[a-z0-9]+$/i, '');
      await shareRenderedPages(rendered, `${title} (transponiert)`);
      haptics.success();
    } catch (error) {
      haptics.error();
      notify('Export fehlgeschlagen', error instanceof Error ? error.message : String(error));
    } finally {
      setProgress(null);
    }
  }

  return { exportSheet, exporting: progress !== null, progress };
}
