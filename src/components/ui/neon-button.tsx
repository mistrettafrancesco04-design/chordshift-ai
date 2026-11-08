import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, glow, gradients, radii, spacing } from '@/theme';

import { AppText } from './app-text';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface NeonButtonProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

export function NeonButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityHint,
}: NeonButtonProps) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const foreground = isPrimary ? colors.textOnAccent : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.large,
        fullWidth && styles.fullWidth,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isPrimary && !inactive && glow(colors.primary, 20, 0.45),
        pressed && styles.pressed,
        inactive && styles.disabled,
      ]}>
      {isPrimary && (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : (
          icon && <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={foreground} />
        )}
        <AppText variant="bodyStrong" style={{ color: foreground }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  large: {
    minHeight: 56,
    borderRadius: radii.xl,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  secondary: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
