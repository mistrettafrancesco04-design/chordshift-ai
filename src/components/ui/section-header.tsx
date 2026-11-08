import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './app-text';

interface SectionHeaderProps {
  title: string;
  overline?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, overline, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        {overline && (
          <AppText variant="overline" color="primary">
            {overline}
          </AppText>
        )}
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {actionLabel && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText variant="label" color="primary">
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: {
    gap: spacing.xxs,
    flexShrink: 1,
  },
});
