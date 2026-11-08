import { router } from 'expo-router';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';

import { EmptyState, NeonButton, Screen, SectionHeader } from '@/components/ui';
import { type SheetProject, useLibraryStore } from '@/features/library/library-store';
import { deleteProject, openProject } from '@/features/library/project-actions';
import { ProjectCard } from '@/features/library/project-card';
import { spacing } from '@/theme';

function confirmDelete(project: SheetProject) {
  Alert.alert('Projekt löschen?', `„${project.title}“ wird dauerhaft entfernt.`, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Löschen', style: 'destructive', onPress: () => deleteProject(project) },
  ]);
}

function showActions(project: SheetProject) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: project.title, options: ['Abbrechen', 'Öffnen', 'Löschen'], cancelButtonIndex: 0, destructiveButtonIndex: 2 },
      (index) => {
        if (index === 1) openProject(project);
        if (index === 2) confirmDelete(project);
      },
    );
    return;
  }
  Alert.alert(project.title, undefined, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Öffnen', onPress: () => openProject(project) },
    { text: 'Löschen', style: 'destructive', onPress: () => confirmDelete(project) },
  ]);
}

export default function LibraryScreen() {
  const projects = useLibraryStore((s) => s.projects);

  return (
    <Screen>
      <SectionHeader
        overline="Bibliothek"
        title={projects.length === 1 ? '1 Projekt' : `${projects.length} Projekte`}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="Deine Bibliothek ist leer"
          message="Speichere ein Notenblatt im Transposer Studio, um es hier wiederzufinden."
          action={<NeonButton label="Zum Studio" icon="pulse" onPress={() => router.navigate('/studio')} />}
        />
      ) : (
        <View style={styles.list}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() => openProject(project)}
              onLongPress={() => showActions(project)}
            />
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
