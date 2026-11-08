import { StyleSheet, View } from 'react-native';

import { AppText, GlassCard, SegmentedControl } from '@/components/ui';
import { type AccidentalPreference, formatKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { spacing } from '@/theme';

import { selectOriginalKey, selectTargetKey, useStudioStore } from '../studio-store';
import { KeySelector } from './key-selector';
import { SemitoneStepper } from './semitone-stepper';

const ACCIDENTAL_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'sharps', label: 'Kreuz (#)' },
  { value: 'flats', label: 'Be (b)' },
] as const satisfies readonly { value: AccidentalPreference; label: string }[];

/** Semitone stepper, original/target key and accidental preference. */
export function TranspositionPanel() {
  const semitones = useStudioStore((s) => s.semitones);
  const shiftSemitones = useStudioStore((s) => s.shiftSemitones);
  const setSemitones = useStudioStore((s) => s.setSemitones);
  const setOriginalKey = useStudioStore((s) => s.setOriginalKey);
  const setTargetKey = useStudioStore((s) => s.setTargetKey);
  const originalKey = useStudioStore(selectOriginalKey);
  const targetKey = useStudioStore(selectTargetKey);

  const notation = useSettingsStore((s) => s.outputNotation);
  const accidentals = useSettingsStore((s) => s.accidentals);
  const setAccidentals = useSettingsStore((s) => s.setAccidentals);

  return (
    <GlassCard active={semitones !== 0}>
      <View style={styles.stack}>
        <SemitoneStepper value={semitones} onShift={shiftSemitones} />

        {originalKey && targetKey && (
          <View style={styles.keyFlow}>
            <AppText variant="mono" color="textSecondary">
              {formatKey(originalKey, notation)}
            </AppText>
            <AppText variant="label" color="textMuted">
              →
            </AppText>
            <AppText variant="mono" color="primary">
              {formatKey(targetKey, notation)}
            </AppText>
            {semitones !== 0 && (
              <AppText variant="label" color="primary" onPress={() => setSemitones(0)} accessibilityRole="button">
                Zurücksetzen
              </AppText>
            )}
          </View>
        )}

        <KeySelector label="Originaltonart" value={originalKey} onChange={setOriginalKey} notation={notation} />
        <KeySelector label="Zieltonart" value={targetKey} onChange={setTargetKey} notation={notation} />

        <View style={styles.accidentals}>
          <AppText variant="label" color="textSecondary">
            Vorzeichen
          </AppText>
          <SegmentedControl
            accessibilityLabel="Vorzeichen-Schreibweise"
            options={ACCIDENTAL_OPTIONS}
            value={accidentals}
            onChange={setAccidentals}
          />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl,
  },
  keyFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  accidentals: {
    gap: spacing.sm,
  },
});
