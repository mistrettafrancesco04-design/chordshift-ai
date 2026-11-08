import { router } from 'expo-router';

import { deletePages, persistPages } from '@/features/transposer/services/sheet-storage';
import { useStudioStore } from '@/features/transposer/studio-store';
import { createId } from '@/lib/id';

import { type SheetProject, useLibraryStore } from './library-store';

/** Saves the current studio session as a song (create or update). */
export async function saveStudioSession(title?: string): Promise<SheetProject | null> {
  const studio = useStudioStore.getState();
  if (!studio.source) return null;

  const library = useLibraryStore.getState();
  const existing = studio.projectId ? library.projects.find((p) => p.id === studio.projectId) : undefined;
  const id = existing?.id ?? createId('song_');
  const now = Date.now();
  const pages = await persistPages(studio.source.pages, id);
  const source = { ...studio.source, pages };

  const project: SheetProject = {
    id,
    title: title?.trim() || existing?.title || defaultTitle(studio.source.fileName, now),
    source,
    analyses: studio.analyses,
    originalKeyId: studio.originalKeyId,
    semitones: studio.semitones,
    favorite: existing?.favorite ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  library.upsert(project);
  studio.markSaved(id, source);
  return project;
}

/** Opens a saved song in the Transposer Studio. */
export function openProject(project: SheetProject) {
  useStudioStore.getState().loadSource(project.source, {
    analyses: project.analyses,
    semitones: project.semitones,
    originalKeyId: project.originalKeyId,
    projectId: project.id,
  });
  router.navigate('/studio');
}

export function deleteProject(project: SheetProject) {
  useLibraryStore.getState().remove(project.id);
  deletePages(project.source.pages);
  const studio = useStudioStore.getState();
  if (studio.projectId === project.id) useStudioStore.setState({ projectId: null, dirty: true });
}

function defaultTitle(fileName: string | null | undefined, timestamp: number) {
  if (fileName) return fileName.replace(/\.[a-z0-9]+$/i, '');
  return `Song vom ${new Date(timestamp).toLocaleDateString('de-DE')}`;
}
