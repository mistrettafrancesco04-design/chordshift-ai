import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

import type { SheetSource } from '../types';

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: 'camera' | 'library') {
    super(permission === 'camera' ? 'Kamerazugriff verweigert' : 'Fotozugriff verweigert');
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Picker settings tuned for OCR: full quality (no recompression artefacts on thin
 * chord glyphs), no forced aspect ratio, optional crop so users can trim the page.
 */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 1,
  exif: false,
};

function fromAsset(asset: ImagePicker.ImagePickerAsset, origin: SheetSource['origin']): SheetSource {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    origin,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
    importedAt: Date.now(),
  };
}

/** Opens the camera to photograph a sheet. Resolves `null` if the user cancels. */
export async function captureSheetWithCamera(): Promise<SheetSource | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new PermissionDeniedError('camera');

  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]) return null;
  return fromAsset(result.assets[0], 'camera');
}

/** Opens the photo library. Resolves `null` if the user cancels. */
export async function pickSheetFromLibrary(): Promise<SheetSource | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PermissionDeniedError('library');

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]) return null;
  return fromAsset(result.assets[0], 'library');
}

/**
 * Picks an image file from the file system / cloud drives.
 * PDF support follows together with the rendering pipeline.
 */
export async function pickSheetFromFiles(): Promise<SheetSource | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const size = await getImageSize(asset.uri);
  return {
    uri: asset.uri,
    width: size.width,
    height: size.height,
    origin: 'file',
    fileName: asset.name,
    mimeType: asset.mimeType ?? null,
    importedAt: Date.now(),
  };
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}
