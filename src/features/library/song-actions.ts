import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { confirm } from '@/lib/dialog';

import type { SheetProject } from './library-store';
import { useLibraryStore } from './library-store';
import { deleteProject, openProject } from './project-actions';

export async function confirmDelete(project: SheetProject) {
  const ok = await confirm({
    title: 'Song löschen?',
    message: `„${project.title}“ wird dauerhaft entfernt.`,
    confirmLabel: 'Löschen',
    destructive: true,
  });
  if (ok) deleteProject(project);
}

/** Long-press actions for a song (open, favourite, delete). */
export function showSongActions(project: SheetProject) {
  const favoriteLabel = project.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten';
  const toggle = () => useLibraryStore.getState().toggleFavorite(project.id);

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: project.title,
        options: ['Abbrechen', 'Öffnen', favoriteLabel, 'Löschen'],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 3,
      },
      (index) => {
        if (index === 1) openProject(project);
        if (index === 2) toggle();
        if (index === 3) confirmDelete(project);
      },
    );
    return;
  }
  if (Platform.OS === 'web') {
    confirmDelete(project);
    return;
  }
  Alert.alert(project.title, undefined, [
    { text: 'Öffnen', onPress: () => openProject(project) },
    { text: favoriteLabel, onPress: toggle },
    { text: 'Löschen', style: 'destructive', onPress: () => confirmDelete(project) },
  ]);
}
