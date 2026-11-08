import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './app-text';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <AppText variant="bodyStrong" align="center">
        {title}
      </AppText>
      <AppText variant="label" color="textMuted" align="center">
        {message}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,228,255,0.08)',
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: spacing.sm,
  },
});
