import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

import { engine, type EngineProgress } from '@/features/engine';

import type { SheetOrigin, SheetSource } from '../types';

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: 'camera' | 'library') {
    super(permission === 'camera' ? 'Kamerazugriff verweigert' : 'Fotozugriff verweigert');
    this.name = 'PermissionDeniedError';
  }
}

/** Maximum number of PDF pages rendered per import (keeps memory in check on phones). */
export const MAX_PDF_PAGES = 12;

/**
 * Picker settings tuned for OCR: full quality (no recompression artefacts on thin
 * chord glyphs) and no forced crop – cropping would cut away chords at the page edge.
 */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1,
  exif: false,
};

function fromAsset(asset: ImagePicker.ImagePickerAsset, origin: SheetOrigin): SheetSource {
  return {
    pages: [{ uri: asset.uri, width: asset.width, height: asset.height }],
    origin,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
    pageCount: 1,
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

/** Opens the photo library (iOS Fotomediathek / Android Galerie). */
export async function pickSheetFromLibrary(): Promise<SheetSource | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PermissionDeniedError('library');

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]) return null;
  return fromAsset(result.assets[0], 'library');
}

function isPdf(asset: DocumentPicker.DocumentPickerAsset) {
  return asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');
}

/** Picks a PDF from Files/iCloud/Drive and renders its pages to images. */
export async function pickSheetPdf(onProgress?: (p: EngineProgress) => void): Promise<SheetSource | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  return importPdf(result.assets[0].uri, result.assets[0].name, onProgress);
}

/** Picks an image or PDF file. */
export async function pickSheetFromFiles(onProgress?: (p: EngineProgress) => void): Promise<SheetSource | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (isPdf(asset)) return importPdf(asset.uri, asset.name, onProgress);

  const size = await getImageSize(asset.uri);
  return {
    pages: [{ uri: asset.uri, width: size.width, height: size.height }],
    origin: 'file',
    fileName: asset.name,
    mimeType: asset.mimeType ?? null,
    pageCount: 1,
    importedAt: Date.now(),
  };
}

export async function importPdf(
  uri: string,
  fileName: string,
  onProgress?: (p: EngineProgress) => void,
): Promise<SheetSource> {
  onProgress?.({ value: 0, label: 'PDF wird geöffnet' });
  const rendered = await engine.renderPdf(uri, { maxPages: MAX_PDF_PAGES, targetWidth: 1800 }, onProgress);
  if (rendered.pages.length === 0) throw new Error('Das PDF enthält keine Seiten.');
  return {
    pages: rendered.pages,
    origin: 'pdf',
    fileName,
    mimeType: 'application/pdf',
    pageCount: rendered.pageCount,
    importedAt: Date.now(),
  };
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}
