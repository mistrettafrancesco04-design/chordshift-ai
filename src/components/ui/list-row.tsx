import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './app-text';

interface ListRowProps {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
}

export function ListRow({ icon, title, subtitle, trailing, onPress }: ListRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {icon && (
        <View style={styles.icon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      )}
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,228,255,0.08)',
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
