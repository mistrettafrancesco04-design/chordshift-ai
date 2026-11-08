import { create } from 'zustand';

import { engine } from '@/features/engine';
import { findKey, getKey, type MusicalKey, semitonesBetween, transposeKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { createId } from '@/lib/id';

import { applyRegion } from './appearance';
import { getSheetAnalyzer } from './services/analysis';
import { normalizeSemitones, resolveOriginalKey, wrapSemitones } from './transposition';
import type {
  AnalysisProgress,
  ChordAnnotation,
  NormalizedRect,
  SheetAnalysis,
  SheetSource,
  StudioStatus,
} from './types';

export interface RestorableState {
  analyses: (SheetAnalysis | null)[];
  semitones: number;
  originalKeyId: string | null;
  projectId: string | null;
}

interface StudioState {
  source: SheetSource | null;
  /** One analysis per page (null = not analysed yet). */
  analyses: (SheetAnalysis | null)[];
  pageIndex: number;
  status: StudioStatus;
  progress: AnalysisProgress | null;
  error: string | null;
  semitones: number;
  originalKeyId: string | null;
  /** Library song this session belongs to (set after saving / opening). */
  projectId: string | null;
  /** True when chords changed since the last save. */
  dirty: boolean;

  loadSource: (source: SheetSource, restore?: Partial<RestorableState>) => void;
  clear: () => void;
  setPage: (index: number) => void;
  analyze: () => Promise<void>;
  cancelAnalysis: () => void;
  setSemitones: (value: number) => void;
  shiftSemitones: (delta: number) => void;
  setOriginalKey: (keyId: string | null) => void;
  setTargetKey: (keyId: string) => void;
  updateChord: (pageIndex: number, chordId: string, text: string) => void;
  removeChord: (pageIndex: number, chordId: string) => void;
  addChord: (pageIndex: number, text: string, box: NormalizedRect) => Promise<void>;
  markSaved: (projectId: string, source: SheetSource) => void;
}

const initial = {
  source: null,
  analyses: [],
  pageIndex: 0,
  status: 'empty' as StudioStatus,
  progress: null,
  error: null,
  semitones: 0,
  originalKeyId: null,
  projectId: null,
  dirty: false,
};

let abortController: AbortController | null = null;

/** Measures paper/ink colours around each chord so overlay and export match the sheet. */
async function withAppearance(uri: string, chords: ChordAnnotation[], grow = false): Promise<ChordAnnotation[]> {
  try {
    const regions = await engine.measureRegions(
      uri,
      chords.map((c) => c.box),
      { grow },
    );
    return chords.map((c, i) => applyRegion(c, regions[i]));
  } catch (error) {
    console.warn('[studio] Appearance measurement failed', error);
    return chords;
  }
}

/** Session state of the Transposer Studio (intentionally not persisted). */
export const useStudioStore = create<StudioState>()((set, get) => ({
  ...initial,

  loadSource: (source, restore) => {
    abortController?.abort();
    const analyses = source.pages.map((_, i) => restore?.analyses?.[i] ?? null);
    set({
      ...initial,
      source,
      analyses,
      status: analyses.some(Boolean) ? 'analyzed' : 'ready',
      semitones: restore?.semitones ?? 0,
      originalKeyId: restore?.originalKeyId ?? null,
      projectId: restore?.projectId ?? null,
    });
  },

  clear: () => {
    abortController?.abort();
    set(initial);
  },

  setPage: (index) => {
    const { source } = get();
    if (!source) return;
    set({ pageIndex: Math.max(0, Math.min(source.pages.length - 1, index)) });
  },

  analyze: async () => {
    const { source } = get();
    if (!source) return;

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    const { inputNotation } = useSettingsStore.getState();
    const analyzer = getSheetAnalyzer(inputNotation);
    const pageCount = source.pages.length;
    set({ status: 'analyzing', error: null, progress: { value: 0, label: 'Vorbereitung' } });

    try {
      const analyses: (SheetAnalysis | null)[] = [...get().analyses];
      for (let i = 0; i < pageCount; i++) {
        const page = source.pages[i];
        const prefix = pageCount > 1 ? `Seite ${i + 1}/${pageCount} · ` : '';
        const analysis = await analyzer.analyze(page, {
          signal: controller.signal,
          onProgress: (p) => {
            if (controller.signal.aborted) return;
            set({ progress: { value: (i + Math.min(1, p.value)) / pageCount, label: prefix + p.label } });
          },
        });
        if (controller.signal.aborted) return;
        set({ progress: { value: (i + 1) / pageCount, label: `${prefix}Farben und Freiräume messen` } });
        analyses[i] = { ...analysis, chords: await withAppearance(page.uri, analysis.chords) };
        if (controller.signal.aborted) return;
        set({ analyses: [...analyses] });
      }

      const detected = resolveOriginalKey(analyses, inputNotation);
      set({
        analyses,
        status: 'analyzed',
        progress: null,
        dirty: true,
        originalKeyId: get().originalKeyId ?? detected?.id ?? null,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      set({
        status: 'error',
        progress: null,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      if (abortController === controller) abortController = null;
    }
  },

  cancelAnalysis: () => {
    abortController?.abort();
    abortController = null;
    set((s) => ({ status: s.analyses.some(Boolean) ? 'analyzed' : 'ready', progress: null }));
  },

  setSemitones: (value) => set({ semitones: normalizeSemitones(value), dirty: true }),
  shiftSemitones: (delta) =>
    set({ semitones: normalizeSemitones(wrapSemitones(get().semitones + delta)), dirty: true }),

  setOriginalKey: (originalKeyId) => set({ originalKeyId, dirty: true }),

  setTargetKey: (keyId) => {
    const target = getKey(keyId);
    if (!target) return;
    const original = selectOriginalKey(get());
    if (!original) {
      // Without a known original key, the chosen key becomes the reference.
      set({ originalKeyId: target.id, semitones: 0, dirty: true });
      return;
    }
    // Target keys are offered in the original's mode, so only the tonic matters.
    set({ semitones: semitonesBetween(original, findKey(target.tonic, original.mode)), dirty: true });
  },

  updateChord: (pageIndex, chordId, text) =>
    set((state) => ({
      dirty: true,
      analyses: state.analyses.map((a, i) =>
        i !== pageIndex || !a
          ? a
          : { ...a, chords: a.chords.map((c) => (c.id === chordId ? { ...c, text, edited: true, confidence: 1 } : c)) },
      ),
    })),

  removeChord: (pageIndex, chordId) =>
    set((state) => ({
      dirty: true,
      analyses: state.analyses.map((a, i) =>
        i !== pageIndex || !a ? a : { ...a, chords: a.chords.filter((c) => c.id !== chordId) },
      ),
    })),

  addChord: async (pageIndex, text, box) => {
    const { source } = get();
    if (!source) return;
    const [chord] = await withAppearance(source.pages[pageIndex].uri, [
      { id: createId('manual_'), text, box, confidence: 1, edited: true },
    ], true);
    set((state) => {
      const analyses = [...state.analyses];
      const current = analyses[pageIndex] ?? { chords: [], analyzer: 'manual', durationMs: 0 };
      analyses[pageIndex] = {
        ...current,
        chords: [...current.chords, chord].sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x),
      };
      return { analyses, dirty: true, status: 'analyzed' };
    });
  },

  markSaved: (projectId, source) => set({ projectId, source, dirty: false }),
}));

export function selectOriginalKey(state: Pick<StudioState, 'originalKeyId'>): MusicalKey | null {
  return state.originalKeyId ? (getKey(state.originalKeyId) ?? null) : null;
}

export function selectTargetKey(state: Pick<StudioState, 'originalKeyId' | 'semitones'>): MusicalKey | null {
  const original = selectOriginalKey(state);
  return original ? transposeKey(original, state.semitones) : null;
}

export function selectCurrentPage(state: Pick<StudioState, 'source' | 'pageIndex'>) {
  return state.source?.pages[state.pageIndex] ?? null;
}

export function selectCurrentAnalysis(state: Pick<StudioState, 'analyses' | 'pageIndex'>) {
  return state.analyses[state.pageIndex] ?? null;
}

export function selectChordCount(state: Pick<StudioState, 'analyses'>) {
  return state.analyses.reduce((sum, a) => sum + (a?.chords.length ?? 0), 0);
}
