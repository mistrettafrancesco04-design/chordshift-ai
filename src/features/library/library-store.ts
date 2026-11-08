import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { SheetAnalysis, SheetSource } from '@/features/transposer/types';
import { persistStorage, storageKeys } from '@/lib/storage';

/** A saved transposition project. */
export interface SheetProject {
  id: string;
  title: string;
  source: SheetSource;
  analysis: SheetAnalysis | null;
  originalKeyId: string | null;
  semitones: number;
  createdAt: number;
  updatedAt: number;
}

interface LibraryState {
  projects: SheetProject[];
  upsert: (project: SheetProject) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
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
    }),
    { name: storageKeys.library, storage: persistStorage, version: 1 },
  ),
);

export interface LibraryStats {
  projects: number;
  transposed: number;
  chords: number;
}

export function computeLibraryStats(projects: SheetProject[]): LibraryStats {
  return {
    projects: projects.length,
    transposed: projects.filter((p) => p.semitones !== 0).length,
    chords: projects.reduce((sum, p) => sum + (p.analysis?.chords.length ?? 0), 0),
  };
}
