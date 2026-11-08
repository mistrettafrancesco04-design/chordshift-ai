import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, GlassCard, SegmentedControl } from '@/components/ui';
import { type AccidentalPreference, findKey, formatKey, type KeyMode } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { formatSemitones } from '@/lib/format';
import { spacing } from '@/theme';

import { selectOriginalKey, selectTargetKey, useStudioStore } from '../studio-store';
import { KeyWheel } from './key-wheel';
import { SemitoneStepper } from './semitone-stepper';

const ACCIDENTAL_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'sharps', label: 'Kreuz (#)' },
  { value: 'flats', label: 'Be (b)' },
] as const satisfies readonly { value: AccidentalPreference; label: string }[];

type WheelTarget = 'target' | 'original';

/** Semitone stepper, circle-of-fifths key wheel (original & target) and accidentals. */
export function TranspositionPanel() {
  const semitones = useStudioStore((s) => s.semitones);
  const shiftSemitones = useStudioStore((s) => s.shiftSemitones);
  const setOriginalKey = useStudioStore((s) => s.setOriginalKey);
  const setTargetKey = useStudioStore((s) => s.setTargetKey);
  const originalKey = useStudioStore(selectOriginalKey);
  const targetKey = useStudioStore(selectTargetKey);

  const notation = useSettingsStore((s) => s.outputNotation);
  const accidentals = useSettingsStore((s) => s.accidentals);
  const setAccidentals = useSettingsStore((s) => s.setAccidentals);

  // null = automatic: edit the original key until one is known, then the target key.
  const [editing, setEditing] = useState<WheelTarget | null>(null);
  const [modeChoice, setOriginalMode] = useState<KeyMode | null>(null);
  const originalMode: KeyMode = modeChoice ?? originalKey?.mode ?? 'major';
  const wheelTarget: WheelTarget = originalKey ? (editing ?? 'target') : 'original';
  const mode = wheelTarget === 'original' ? originalMode : (originalKey?.mode ?? 'major');

  return (
    <GlassCard active={semitones !== 0}>
      <View style={styles.stack}>
        <AppText variant="overline" color="primary">
          Transposition
        </AppText>
        <SemitoneStepper value={semitones} onShift={shiftSemitones} />

        <SegmentedControl
          accessibilityLabel="Welche Tonart wählst du im Kreis?"
          value={wheelTarget}
          onChange={setEditing}
          options={[
            { value: 'target', label: 'Zieltonart' },
            { value: 'original', label: 'Originaltonart' },
          ]}
        />

        {wheelTarget === 'original' && (
          <SegmentedControl
            accessibilityLabel="Tongeschlecht der Originaltonart"
            value={originalMode}
            onChange={(next) => {
              setOriginalMode(next);
              if (originalKey && originalKey.mode !== next) {
                // Switch to the relative key (same signature): C ↔ Am.
                setOriginalKey(findKey(originalKey.tonic + (next === 'minor' ? 9 : 3), next).id);
              }
            }}
            options={[
              { value: 'major', label: 'Dur' },
              { value: 'minor', label: 'Moll' },
            ]}
          />
        )}

        <KeyWheel
          mode={mode}
          notation={notation}
          original={originalKey}
          selected={wheelTarget === 'original' ? originalKey : targetKey}
          onSelect={(key) => {
            if (wheelTarget === 'original') {
              setOriginalKey(key.id);
              setEditing('target');
            } else {
              setTargetKey(key.id);
            }
          }}
          centerTitle={
            wheelTarget === 'original'
              ? (originalKey ? formatKey(originalKey, notation) : '?')
              : (targetKey ? formatKey(targetKey, notation) : '?')
          }
          centerSubtitle={
            !originalKey
              ? 'Originaltonart wählen'
              : wheelTarget === 'original'
                ? 'Originaltonart'
                : `aus ${formatKey(originalKey, notation)} · ${formatSemitones(semitones)}`
          }
        />

        {!originalKey && (
          <AppText variant="caption" color="textMuted" align="center">
            Die Tonart wird nach der Akkorderkennung automatisch bestimmt. Du kannst sie hier auch selbst festlegen.
          </AppText>
        )}

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
    gap: spacing.lg,
  },
  accidentals: {
    gap: spacing.sm,
  },
});
