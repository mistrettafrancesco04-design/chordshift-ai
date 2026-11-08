import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { SheetAnalysis, SheetSource } from '@/features/transposer/types';
import { persistStorage, storageKeys } from '@/lib/storage';

/** A saved song (transposition project). */
export interface SheetProject {
  id: string;
  title: string;
  source: SheetSource;
  /** One analysis per page. */
  analyses: (SheetAnalysis | null)[];
  originalKeyId: string | null;
  semitones: number;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

interface LibraryState {
  projects: SheetProject[];
  upsert: (project: SheetProject) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;
}

/** v1 stored a single image + single analysis per project. */
interface ProjectV1 {
  id: string;
  title: string;
  source: { uri: string; width: number; height: number; origin: SheetSource['origin']; fileName?: string | null; mimeType?: string | null; importedAt: number };
  analysis: SheetAnalysis | null;
  originalKeyId: string | null;
  semitones: number;
  createdAt: number;
  updatedAt: number;
}

export function migrateLibrary(persisted: unknown, version: number): { projects: SheetProject[] } {
  const state = (persisted ?? { projects: [] }) as { projects: unknown[] };
  if (version < 2) {
    return {
      projects: (state.projects as ProjectV1[]).map((p) => ({
        id: p.id,
        title: p.title,
        source: {
          pages: [{ uri: p.source.uri, width: p.source.width, height: p.source.height }],
          origin: p.source.origin,
          fileName: p.source.fileName ?? null,
          mimeType: p.source.mimeType ?? null,
          pageCount: 1,
          importedAt: p.source.importedAt,
        },
        analyses: [p.analysis],
        originalKeyId: p.originalKeyId,
        semitones: p.semitones,
        favorite: false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }
  return state as { projects: SheetProject[] };
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      projects: [],
      upsert: (project) =>
        set((state) => {
          const others = state.projects.filter((p) => p.id !== project.id);
          return { projects: [project, ...others].sort((a, b) => b.updatedAt - a.updatedAt) };
        }),
      remove: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
      rename: (id, title) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, title, updatedAt: Date.now() } : p)),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
        })),
    }),
    {
      name: storageKeys.library,
      storage: persistStorage,
      version: 2,
      migrate: (persisted, version) => migrateLibrary(persisted, version) as LibraryState,
    },
  ),
);

export interface LibraryStats {
  songs: number;
  favorites: number;
  transposed: number;
  chords: number;
}

export function computeLibraryStats(projects: SheetProject[]): LibraryStats {
  return {
    songs: projects.length,
    favorites: projects.filter((p) => p.favorite).length,
    transposed: projects.filter((p) => p.semitones !== 0).length,
    chords: projects.reduce((sum, p) => sum + p.analyses.reduce((s, a) => s + (a?.chords.length ?? 0), 0), 0),
  };
}

export function countChords(project: SheetProject): number {
  return project.analyses.reduce((s, a) => s + (a?.chords.length ?? 0), 0);
}
