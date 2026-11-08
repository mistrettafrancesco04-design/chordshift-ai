import { Directory, File, Paths } from 'expo-file-system';

import { createId } from '@/lib/id';

/** Native: write engine output (base64 PNG) to a file and return its URI. */
export async function writeImage(base64: string, folder: 'pages' | 'exports', name?: string): Promise<string> {
  const dir = new Directory(Paths.cache, folder);
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, `${name ?? createId('img_')}.png`);
  if (file.exists) file.delete();
  file.create();
  await file.write(base64, { encoding: 'base64' });
  return file.uri;
}
