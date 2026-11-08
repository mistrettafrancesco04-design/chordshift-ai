import { create } from 'zustand';

import { getKey, type MusicalKey, semitonesBetween, transposeKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';

import { AnalyzerUnavailableError, getSheetAnalyzer } from './services/analysis';
import { normalizeSemitones, resolveOriginalKey, wrapSemitones } from './transposition';
import type { SheetAnalysis, SheetSource, StudioStatus } from './types';

interface StudioState {
  source: SheetSource | null;
  analysis: SheetAnalysis | null;
  status: StudioStatus;
  error: string | null;
  /** True when the error is "no analyzer configured" (not a failure of the sheet). */
  analyzerMissing: boolean;
  semitones: number;
  originalKeyId: string | null;
  /** Library project this session belongs to (set after saving / opening). */
  projectId: string | null;

  loadSource: (source: SheetSource, restore?: Partial<RestorableState>) => void;
  clear: () => void;
  analyze: () => Promise<void>;
  cancelAnalysis: () => void;
  setSemitones: (value: number) => void;
  shiftSemitones: (delta: number) => void;
  setOriginalKey: (keyId: string | null) => void;
  setTargetKey: (keyId: string) => void;
  setProjectId: (id: string | null) => void;
}

export interface RestorableState {
  analysis: SheetAnalysis | null;
  semitones: number;
  originalKeyId: string | null;
  projectId: string | null;
}

const initial = {
  source: null,
  analysis: null,
  status: 'empty' as StudioStatus,
  error: null,
  analyzerMissing: false,
  semitones: 0,
  originalKeyId: null,
  projectId: null,
};

let abortController: AbortController | null = null;

/** Session state of the Transposer Studio (intentionally not persisted). */
export const useStudioStore = create<StudioState>()((set, get) => ({
  ...initial,

  loadSource: (source, restore) => {
    abortController?.abort();
    set({
      ...initial,
      source,
      status: restore?.analysis ? 'analyzed' : 'ready',
      analysis: restore?.analysis ?? null,
      semitones: restore?.semitones ?? 0,
      originalKeyId: restore?.originalKeyId ?? null,
      projectId: restore?.projectId ?? null,
    });
  },

  clear: () => {
    abortController?.abort();
    set(initial);
  },

  analyze: async () => {
    const { source } = get();
    if (!source) return;

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    const { inputNotation } = useSettingsStore.getState();
    set({ status: 'analyzing', error: null, analyzerMissing: false });

    try {
      const analysis = await getSheetAnalyzer(inputNotation).analyze(source, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const detected = resolveOriginalKey(analysis, inputNotation);
      set({
        analysis,
        status: 'analyzed',
        originalKeyId: get().originalKeyId ?? detected?.id ?? null,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      set({
        status: 'error',
        analyzerMissing: error instanceof AnalyzerUnavailableError,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      if (abortController === controller) abortController = null;
    }
  },

  cancelAnalysis: () => {
    abortController?.abort();
    abortController = null;
    set((s) => ({ status: s.analysis ? 'analyzed' : 'ready' }));
  },

  setSemitones: (value) => set({ semitones: normalizeSemitones(value) }),
  shiftSemitones: (delta) => {
    set({ semitones: normalizeSemitones(wrapSemitones(get().semitones + delta)) });
  },

  setOriginalKey: (originalKeyId) => set({ originalKeyId }),

  setTargetKey: (keyId) => {
    const target = getKey(keyId);
    const original = selectOriginalKey(get());
    if (!target) return;
    if (!original) {
      // Without a known original key, the chosen key becomes the reference.
      set({ originalKeyId: target.id, semitones: 0 });
      return;
    }
    set({ semitones: semitonesBetween(original, target) });
  },

  setProjectId: (projectId) => set({ projectId }),
}));

export function selectOriginalKey(state: Pick<StudioState, 'originalKeyId'>): MusicalKey | null {
  return state.originalKeyId ? (getKey(state.originalKeyId) ?? null) : null;
}

export function selectTargetKey(state: Pick<StudioState, 'originalKeyId' | 'semitones'>): MusicalKey | null {
  const original = selectOriginalKey(state);
  return original ? transposeKey(original, state.semitones) : null;
}
