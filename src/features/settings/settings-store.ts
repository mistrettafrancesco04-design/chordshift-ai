import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AccidentalPreference, Notation } from '@/features/music';
import { persistStorage, storageKeys } from '@/lib/storage';

export interface SettingsState {
  /** Notation used to read chords on imported sheets. */
  inputNotation: Notation;
  /** Notation used to write transposed chords. */
  outputNotation: Notation;
  accidentals: AccidentalPreference;
  hapticsEnabled: boolean;
  /** Show original chord next to the transposed one in the preview. */
  showOriginalChords: boolean;

  setInputNotation: (value: Notation) => void;
  setOutputNotation: (value: Notation) => void;
  setAccidentals: (value: AccidentalPreference) => void;
  setHapticsEnabled: (value: boolean) => void;
  setShowOriginalChords: (value: boolean) => void;
  reset: () => void;
}

const defaults = {
  inputNotation: 'international' as Notation,
  outputNotation: 'international' as Notation,
  accidentals: 'auto' as AccidentalPreference,
  hapticsEnabled: true,
  showOriginalChords: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setInputNotation: (inputNotation) => set({ inputNotation }),
      setOutputNotation: (outputNotation) => set({ outputNotation }),
      setAccidentals: (accidentals) => set({ accidentals }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setShowOriginalChords: (showOriginalChords) => set({ showOriginalChords }),
      reset: () => set(defaults),
    }),
    { name: storageKeys.settings, storage: persistStorage, version: 1 },
  ),
);
