import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

import { AppText } from './app-text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={[styles.segment, selected && styles.selected]}>
            <AppText variant="label" color={selected ? 'text' : 'textMuted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.surfacePressed,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
