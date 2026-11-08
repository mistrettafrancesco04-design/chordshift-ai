import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, GlassCard } from '@/components/ui';
import { detectKey, formatKey, transposeKey, transposeText } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { colors, fonts, radii, spacing } from '@/theme';

const SAMPLE = `G        D/F#     Em       C
Dein Liedtext bleibt, wie er ist
Am7      D        G
Nur die Akkorde werden verschoben`;

/**
 * Live playground for the transposition engine: chords-over-lyrics text in,
 * transposed text out. Lyric lines are never modified.
 */
export function ChordLab({ semitones }: { semitones: number }) {
  const [input, setInput] = useState(SAMPLE);
  const inputNotation = useSettingsStore((s) => s.inputNotation);
  const outputNotation = useSettingsStore((s) => s.outputNotation);
  const accidentals = useSettingsStore((s) => s.accidentals);

  const { output, keyLabel } = useMemo(() => {
    const chords = input.split(/\s+/).filter(Boolean);
    const estimate = detectKey(chords, inputNotation);
    const targetKey = estimate ? transposeKey(estimate.key, semitones) : null;
    return {
      output: transposeText(input, semitones, { notation: inputNotation, outputNotation, accidentals, targetKey }),
      keyLabel:
        estimate && targetKey
          ? `${formatKey(estimate.key, outputNotation)} → ${formatKey(targetKey, outputNotation)}`
          : null,
    };
  }, [input, semitones, inputNotation, outputNotation, accidentals]);

  return (
    <GlassCard>
      <View style={styles.stack}>
        <View style={styles.header}>
          <AppText variant="overline" color="primary">
            Chord Lab
          </AppText>
          {keyLabel && (
            <AppText variant="mono" color="textSecondary">
              {keyLabel}
            </AppText>
          )}
        </View>
        <AppText variant="caption" color="textMuted">
          Akkorde über Liedtext eingeben oder einfügen – Akkordzeilen werden live transponiert, Textzeilen bleiben unverändert.
        </AppText>
        <TextInput
          accessibilityLabel="Akkordtext eingeben"
          multiline
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholder="z. B. C  Am  F  G"
          placeholderTextColor={colors.textMuted}
          style={[styles.code, styles.input]}
        />
        <View style={[styles.code, styles.output]} accessible accessibilityLabel={`Ergebnis: ${output}`}>
          <AppText style={styles.codeText} selectable>
            {output}
          </AppText>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  input: {
    minHeight: 110,
    textAlignVertical: 'top',
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  output: {
    backgroundColor: 'rgba(34,228,255,0.06)',
    borderColor: colors.borderGlow,
  },
  codeText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
});
