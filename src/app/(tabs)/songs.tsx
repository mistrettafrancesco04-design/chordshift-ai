import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, FadeIn, NeonButton, Screen, SectionHeader, SegmentedControl, TextField } from '@/components/ui';
import { useLibraryStore } from '@/features/library/library-store';
import { openProject } from '@/features/library/project-actions';
import { ProjectCard } from '@/features/library/project-card';
import { showSongActions } from '@/features/library/song-actions';
import { spacing } from '@/theme';

type Sort = 'recent' | 'title';

export default function SongsScreen() {
  const projects = useLibraryStore((s) => s.projects);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? projects.filter((p) => p.title.toLowerCase().includes(q)) : projects;
    return sort === 'title'
      ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'de'))
      : [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [projects, query, sort]);

  return (
    <Screen>
      <SectionHeader
        overline="Meine Songs"
        title={projects.length === 1 ? '1 Song' : `${projects.length} Songs`}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="Noch keine Songs"
          message="Speichere ein Notenblatt im Transposer Studio, um es hier wiederzufinden."
          action={<NeonButton label="Zum Studio" icon="pulse" onPress={() => router.navigate('/studio')} />}
        />
      ) : (
        <>
          <View style={styles.controls}>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Songs durchsuchen"
              accessibilityLabel="Songs durchsuchen"
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
            <SegmentedControl
              accessibilityLabel="Sortierung"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'recent', label: 'Zuletzt bearbeitet' },
                { value: 'title', label: 'Titel A–Z' },
              ]}
            />
          </View>
          {visible.length === 0 ? (
            <EmptyState icon="search-outline" title="Keine Treffer" message={`Kein Song enthält „${query}“.`} />
          ) : (
            <View style={styles.list}>
              {visible.map((project, index) => (
                <FadeIn key={project.id} index={Math.min(index, 8)}>
                  <ProjectCard
                    project={project}
                    onPress={() => openProject(project)}
                    onLongPress={() => showSongActions(project)}
                  />
                </FadeIn>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
