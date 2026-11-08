import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const SHEETS_DIR = 'sheets';

/**
 * Copies an imported image from the picker's temporary cache into the app's
 * document directory so library projects survive cache cleanup.
 * Returns the persistent URI (or the original URI on web / on failure).
 */
export function persistSheetImage(sourceUri: string, id: string): string {
  if (Platform.OS === 'web') return sourceUri;
  try {
    const dir = new Directory(Paths.document, SHEETS_DIR);
    if (!dir.exists) dir.create({ intermediates: true });

    const extension = sourceUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const target = new File(dir, `${id}.${extension.length <= 4 ? extension : 'jpg'}`);
    if (target.uri === sourceUri) return sourceUri;
    if (target.exists) target.delete();

    new File(sourceUri).copy(target);
    return target.uri;
  } catch (error) {
    console.warn('[sheet-storage] Could not persist image, using original URI', error);
    return sourceUri;
  }
}

/** Deletes a persisted sheet image. Ignores files outside the sheets directory. */
export function deleteSheetImage(uri: string): void {
  if (Platform.OS === 'web' || !uri.includes(`/${SHEETS_DIR}/`)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[sheet-storage] Could not delete image', error);
  }
}
