import { Pressable, StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

import { AppText } from './app-text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  mono?: boolean;
  accessibilityLabel?: string;
}

export function Chip({ label, selected = false, onPress, mono = false, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed]}>
      <AppText variant={mono ? 'mono' : 'label'} color={selected ? 'primary' : 'textSecondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: colors.borderGlow,
    backgroundColor: 'rgba(34,228,255,0.12)',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
