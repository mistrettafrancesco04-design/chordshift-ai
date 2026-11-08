import { router } from 'expo-router';

import { persistSheetImage, deleteSheetImage } from '@/features/transposer/services/sheet-storage';
import { useStudioStore } from '@/features/transposer/studio-store';
import { createId } from '@/lib/id';

import { type SheetProject, useLibraryStore } from './library-store';

/** Saves the current studio session as a library project (create or update). */
export function saveStudioSession(title?: string): SheetProject | null {
  const studio = useStudioStore.getState();
  if (!studio.source) return null;

  const library = useLibraryStore.getState();
  const existing = studio.projectId ? library.projects.find((p) => p.id === studio.projectId) : undefined;
  const id = existing?.id ?? createId('sheet_');
  const now = Date.now();

  const project: SheetProject = {
    id,
    title: title ?? existing?.title ?? defaultTitle(studio.source.fileName, now),
    source: { ...studio.source, uri: persistSheetImage(studio.source.uri, id) },
    analysis: studio.analysis,
    originalKeyId: studio.originalKeyId,
    semitones: studio.semitones,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  library.upsert(project);
  studio.setProjectId(id);
  if (project.source.uri !== studio.source.uri) {
    useStudioStore.setState({ source: project.source });
  }
  return project;
}

/** Opens a saved project in the Transposer Studio. */
export function openProject(project: SheetProject) {
  useStudioStore.getState().loadSource(project.source, {
    analysis: project.analysis,
    semitones: project.semitones,
    originalKeyId: project.originalKeyId,
    projectId: project.id,
  });
  router.navigate('/studio');
}

export function deleteProject(project: SheetProject) {
  useLibraryStore.getState().remove(project.id);
  deleteSheetImage(project.source.uri);
  const studio = useStudioStore.getState();
  if (studio.projectId === project.id) studio.setProjectId(null);
}

function defaultTitle(fileName: string | null | undefined, timestamp: number) {
  if (fileName) return fileName.replace(/\.[a-z0-9]+$/i, '');
  return `Notenblatt ${new Date(timestamp).toLocaleDateString('de-DE')}`;
}
