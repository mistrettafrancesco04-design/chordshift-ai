import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './app-text';

interface StatTileProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  value: string | number;
  label: string;
  tint?: string;
}

export function StatTile({ icon, value, label, tint = colors.primary }: StatTileProps) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" color="textMuted" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
