import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import type { SheetProject } from '@/features/library/library-store';
import { openProject } from '@/features/library/project-actions';
import { showSongActions } from '@/features/library/song-actions';
import { formatKey, getKey, transposeKey } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { formatSemitones } from '@/lib/format';
import { colors, radii, spacing } from '@/theme';

/** Horizontal cards with sheet thumbnails. */
export function SongCarousel({ songs }: { songs: SheetProject[] }) {
  const notation = useSettingsStore((s) => s.outputNotation);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {songs.map((song) => {
        const original = song.originalKeyId ? getKey(song.originalKeyId) : undefined;
        const target = original ? transposeKey(original, song.semitones) : undefined;
        return (
          <PressableScale
            key={song.id}
            accessibilityRole="button"
            accessibilityLabel={`${song.title} öffnen`}
            onPress={() => openProject(song)}
            onLongPress={() => showSongActions(song)}
            style={styles.card}>
            <Image source={{ uri: song.source.pages[0]?.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(5,6,15,0.92)']}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {song.favorite && (
              <View style={styles.star}>
                <Ionicons name="star" size={14} color={colors.warning} />
              </View>
            )}
            <View style={styles.meta}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {song.title}
              </AppText>
              <AppText variant="mono" color="primary" numberOfLines={1}>
                {original && target
                  ? `${formatKey(original, notation)} → ${formatKey(target, notation)}`
                  : formatSemitones(song.semitones)}
              </AppText>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  card: {
    width: 150,
    height: 196,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.sheetPaper,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'flex-end',
  },
  star: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,6,15,0.8)',
  },
  meta: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
});
