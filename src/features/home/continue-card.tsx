import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, GlassCard, PressableScale } from '@/components/ui';
import { useLibraryStore } from '@/features/library/library-store';
import { formatKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { selectChordCount, selectOriginalKey, selectTargetKey, useStudioStore } from '@/features/transposer/studio-store';
import { formatSemitones } from '@/lib/format';
import { colors, radii, spacing } from '@/theme';

/** Shows the open studio session so the user can jump right back in. */
export function ContinueCard() {
  const source = useStudioStore((s) => s.source);
  const semitones = useStudioStore((s) => s.semitones);
  const dirty = useStudioStore((s) => s.dirty);
  const chordCount = useStudioStore(selectChordCount);
  const original = useStudioStore(selectOriginalKey);
  const target = useStudioStore(selectTargetKey);
  const notation = useSettingsStore((s) => s.outputNotation);
  const projectId = useStudioStore((s) => s.projectId);
  const title = useLibraryStore((s) => s.projects.find((p) => p.id === projectId)?.title);
  if (!source) return null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Aktuelle Session im Studio fortsetzen"
      onPress={() => router.navigate('/studio')}
      pressedScale={0.98}>
      <GlassCard active padded={false}>
        <View style={styles.row}>
          <Image source={{ uri: source.pages[0].uri }} style={styles.thumb} contentFit="cover" />
          <View style={styles.body}>
            <AppText variant="overline" color="primary">
              Im Studio geöffnet{dirty ? ' · ungespeichert' : ''}
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {title ?? source.fileName ?? 'Notenblatt'}
            </AppText>
            <AppText variant="mono" color="textSecondary">
              {original && target ? `${formatKey(original, notation)} → ${formatKey(target, notation)}` : formatSemitones(semitones)}
              {chordCount > 0 ? ` · ${chordCount} Akkorde` : ''}
            </AppText>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color={colors.primary} />
        </View>
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumb: {
    width: 52,
    height: 68,
    borderRadius: radii.sm,
    backgroundColor: colors.sheetPaper,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
});
