import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, FadeIn, NeonButton, Screen, SectionHeader } from '@/components/ui';
import { useLibraryStore } from '@/features/library/library-store';
import { openProject } from '@/features/library/project-actions';
import { ProjectCard } from '@/features/library/project-card';
import { showSongActions } from '@/features/library/song-actions';
import { spacing } from '@/theme';

export default function FavoritesScreen() {
  const projects = useLibraryStore((s) => s.projects);
  const favorites = useMemo(() => projects.filter((p) => p.favorite), [projects]);

  return (
    <Screen>
      <SectionHeader overline="Favoriten" title={favorites.length === 1 ? '1 Favorit' : `${favorites.length} Favoriten`} />
      {favorites.length === 0 ? (
        <EmptyState
          icon="star-outline"
          title="Noch keine Favoriten"
          message="Tippe in „Meine Songs“ auf den Stern, um einen Song hier anzuheften."
          action={
            projects.length > 0 ? (
              <NeonButton label="Zu Meine Songs" icon="albums" onPress={() => router.navigate('/songs')} />
            ) : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          {favorites.map((project, index) => (
            <FadeIn key={project.id} index={Math.min(index, 8)}>
              <ProjectCard project={project} onPress={() => openProject(project)} onLongPress={() => showSongActions(project)} />
            </FadeIn>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
