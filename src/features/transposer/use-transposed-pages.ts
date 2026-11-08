import { useMemo } from 'react';

import { useSettingsStore } from '@/features/settings/settings-store';

import { selectOriginalKey, useStudioStore } from './studio-store';
import { transposeAnalysis } from './transposition';
import type { TransposedChord } from './types';

/** Transposed chords for every page of the current studio session. */
export function useTransposedPages(): TransposedChord[][] {
  const analyses = useStudioStore((s) => s.analyses);
  const semitones = useStudioStore((s) => s.semitones);
  const originalKey = useStudioStore(selectOriginalKey);
  const inputNotation = useSettingsStore((s) => s.inputNotation);
  const outputNotation = useSettingsStore((s) => s.outputNotation);
  const accidentals = useSettingsStore((s) => s.accidentals);

  return useMemo(
    () =>
      analyses.map((analysis) =>
        analysis
          ? transposeAnalysis(analysis, { semitones, originalKey, inputNotation, outputNotation, accidentals })
          : [],
      ),
    [analyses, semitones, originalKey, inputNotation, outputNotation, accidentals],
  );
}
