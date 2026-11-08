import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { formatKey, getKey, transposeKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { formatRelativeTime, formatSemitones } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

import { countChords, type SheetProject, useLibraryStore } from './library-store';

interface ProjectCardProps {
  project: SheetProject;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ProjectCard({ project, onPress, onLongPress }: ProjectCardProps) {
  const notation = useSettingsStore((s) => s.outputNotation);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const original = project.originalKeyId ? getKey(project.originalKeyId) : undefined;
  const target = original ? transposeKey(original, project.semitones) : undefined;
  const pages = project.source.pages.length;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Song ${project.title} öffnen`}
      accessibilityHint={onLongPress ? 'Lange drücken für weitere Aktionen' : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      pressedScale={0.98}
      style={styles.card}>
      <Image source={{ uri: project.source.pages[0]?.uri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {project.title}
        </AppText>
        <AppText variant="mono" color="primary">
          {original && target
            ? `${formatKey(original, notation)} → ${formatKey(target, notation)}`
            : formatSemitones(project.semitones)}
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {countChords(project)} Akkorde · {pages} {pages === 1 ? 'Seite' : 'Seiten'} ·{' '}
          {formatRelativeTime(project.updatedAt)}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={project.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        accessibilityState={{ selected: project.favorite }}
        hitSlop={10}
        onPress={() => {
          haptics.light();
          toggleFavorite(project.id);
        }}
        style={styles.star}>
        <Ionicons
          name={project.favorite ? 'star' : 'star-outline'}
          size={22}
          color={project.favorite ? colors.warning : colors.textMuted}
        />
      </Pressable>
    </PressableScale>
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
  star: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
