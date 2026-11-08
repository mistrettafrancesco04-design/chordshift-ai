import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radii } from '@/theme';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 44,
  tone = 'default',
  disabled = false,
}: IconButtonProps) {
  const color = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size >= 48 ? radii.lg : radii.md },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Ionicons name={icon} size={Math.round(size * 0.45)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  disabled: {
    opacity: 0.4,
  },
});
