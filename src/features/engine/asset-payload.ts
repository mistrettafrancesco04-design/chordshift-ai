import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import { ENGINE_ASSETS } from './engine-assets';
import type { EngineLibName } from './types';

/** Native: the WebView has no file access, so libraries are sent as base64. */
export async function libPayload(name: EngineLibName): Promise<{ name: string; base64?: string; url?: string }> {
  const asset = Asset.fromModule(ENGINE_ASSETS[name]);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  return { name, base64: await new File(uri).base64() };
}

/** Native: images are passed to the WebView as data URLs. */
export async function imageSrc(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${await new File(uri).base64()}`;
}

export async function fileBase64(uri: string): Promise<string> {
  return new File(uri).base64();
}
