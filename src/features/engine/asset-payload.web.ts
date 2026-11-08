import { Asset } from 'expo-asset';

import { ENGINE_ASSETS } from './engine-assets';
import type { EngineLibName } from './types';

/** Web: the engine iframe shares our origin and can fetch assets by URL. */
export async function libPayload(name: EngineLibName): Promise<{ name: string; base64?: string; url?: string }> {
  return { name, url: Asset.fromModule(ENGINE_ASSETS[name]).uri };
}

export async function imageSrc(uri: string): Promise<string> {
  return uri;
}

export async function fileBase64(uri: string): Promise<string> {
  const buffer = await (await fetch(uri)).arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
