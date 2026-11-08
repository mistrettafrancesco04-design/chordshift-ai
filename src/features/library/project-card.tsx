import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { formatKey, getKey, transposeKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { formatRelativeTime, formatSemitones } from '@/lib/format';
import { colors, radii, spacing } from '@/theme';

import type { SheetProject } from './library-store';

interface ProjectCardProps {
  project: SheetProject;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ProjectCard({ project, onPress, onLongPress }: ProjectCardProps) {
  const notation = useSettingsStore((s) => s.outputNotation);
  const original = project.originalKeyId ? getKey(project.originalKeyId) : undefined;
  const target = original ? transposeKey(original, project.semitones) : undefined;
  const chordCount = project.analysis?.chords.length ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Projekt ${project.title} öffnen`}
      accessibilityHint={onLongPress ? 'Lange drücken für weitere Aktionen' : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={{ uri: project.source.uri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {project.title}
        </AppText>
        <View style={styles.meta}>
          {original && target ? (
            <AppText variant="mono" color="primary">
              {formatKey(original, notation)} → {formatKey(target, notation)}
            </AppText>
          ) : (
            <AppText variant="mono" color="primary">
              {formatSemitones(project.semitones)}
            </AppText>
          )}
          <AppText variant="caption" color="textMuted">
            · {chordCount} Akkorde
          </AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          {formatRelativeTime(project.updatedAt)}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.sheetPaper,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
