import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AppText, GlassCard } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { summarizeChanges } from '../transposition';
import type { TransposedChord } from '../types';

/** Preview of every chord change ("G → A ×4"), animated when the transposition changes. */
export function ChordChanges({ chords }: { chords: TransposedChord[] }) {
  const changes = summarizeChanges(chords);
  if (changes.length === 0) return null;
  const changedCount = chords.filter((c) => c.transposed !== c.original).length;

  return (
    <GlassCard>
      <View style={styles.stack}>
        <View style={styles.header}>
          <AppText variant="overline" color="primary">
            Akkordänderungen
          </AppText>
          <AppText variant="caption" color="textMuted">
            {changedCount} von {chords.length} Akkorden ändern sich
          </AppText>
        </View>
        <View style={styles.grid}>
          {changes.map((change) => {
            const same = change.original === change.transposed;
            return (
              <Animated.View
                key={change.original}
                layout={LinearTransition.springify().damping(18)}
                style={[styles.item, !same && styles.itemChanged]}
                accessible
                accessibilityLabel={`${change.original} wird zu ${change.transposed}, ${change.count} mal`}>
                <AppText variant="mono" color="textMuted">
                  {change.original}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  →
                </AppText>
                <Animated.View key={change.transposed} entering={FadeIn.duration(220)}>
                  <AppText variant="mono" color={same ? 'textSecondary' : 'primary'} style={styles.bold}>
                    {change.transposed}
                  </AppText>
                </Animated.View>
                {change.count > 1 && (
                  <AppText variant="caption" color="textMuted">
                    ×{change.count}
                  </AppText>
                )}
              </Animated.View>
            );
          })}
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
    gap: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemChanged: {
    borderColor: 'rgba(34,228,255,0.3)',
    backgroundColor: 'rgba(34,228,255,0.06)',
  },
  bold: {
    fontWeight: '700',
  },
});
