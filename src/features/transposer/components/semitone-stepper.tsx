import { StyleSheet, View } from 'react-native';

import { AppText, IconButton } from '@/components/ui';
import { formatSemitones } from '@/lib/format';
import { colors, textGlow, typography } from '@/theme';

interface SemitoneStepperProps {
  value: number;
  onShift: (delta: number) => void;
}

/** Large −/+ stepper with a glowing semitone readout. */
export function SemitoneStepper({ value, onShift }: SemitoneStepperProps) {
  return (
    <View style={styles.stepper}>
      <IconButton icon="remove" size={52} accessibilityLabel="Einen Halbton tiefer" onPress={() => onShift(-1)} />
      <View style={styles.readout} accessible accessibilityLabel={`${value} Halbtöne`}>
        <AppText style={[styles.value, value !== 0 && textGlow(colors.primary)]}>{formatSemitones(value)}</AppText>
        <AppText variant="overline" color="textMuted">
          Halbtöne
        </AppText>
      </View>
      <IconButton icon="add" size={52} accessibilityLabel="Einen Halbton höher" onPress={() => onShift(1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readout: {
    alignItems: 'center',
  },
  value: {
    ...typography.display,
    fontSize: 44,
    lineHeight: 52,
    color: colors.text,
  },
});
