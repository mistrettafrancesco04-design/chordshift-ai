import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { SheetPage } from '../types';

const SHEETS_DIR = 'sheets';

/**
 * Copies page images from temporary caches (picker, PDF renderer) into the app's
 * document directory so saved songs survive cache cleanup.
 * Returns persistent URIs (original URIs on web / on failure).
 */
export async function persistPages(pages: SheetPage[], id: string): Promise<SheetPage[]> {
  if (Platform.OS === 'web') return Promise.all(pages.map(webPersist));
  return pages.map((page, index) => ({ ...page, uri: persistFile(page.uri, `${id}-p${index + 1}`) }));
}

function persistFile(sourceUri: string, name: string): string {
  try {
    const dir = new Directory(Paths.document, SHEETS_DIR);
    if (!dir.exists) dir.create({ intermediates: true });
    if (sourceUri.startsWith(dir.uri)) return sourceUri;

    const extension = sourceUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const target = new File(dir, `${name}.${extension.length <= 4 ? extension : 'jpg'}`);
    if (target.exists) target.delete();
    new File(sourceUri).copy(target);
    return target.uri;
  } catch (error) {
    console.warn('[sheet-storage] Could not persist image, using original URI', error);
    return sourceUri;
  }
}

/** Web: blob URLs die with the tab – convert them to data URLs so saved songs keep their pages. */
async function webPersist(page: SheetPage): Promise<SheetPage> {
  if (!page.uri.startsWith('blob:')) return page;
  const blob = await (await fetch(page.uri)).blob();
  const uri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { ...page, uri };
}

/** Deletes persisted page images. Ignores files outside the sheets directory. */
export function deletePages(pages: SheetPage[]): void {
  if (Platform.OS === 'web') return;
  for (const page of pages) {
    if (!page.uri.includes(`/${SHEETS_DIR}/`)) continue;
    try {
      const file = new File(page.uri);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('[sheet-storage] Could not delete image', error);
    }
  }
}
