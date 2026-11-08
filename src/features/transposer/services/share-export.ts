import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SheetPage } from '../types';

/** Shares rendered pages: one page as PNG, several pages as a PDF document. */
export async function shareRenderedPages(pages: SheetPage[], title: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');

  if (pages.length === 1) {
    await Sharing.shareAsync(pages[0].uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
    return;
  }

  const images = await Promise.all(pages.map(async (p) => `data:image/png;base64,${await new File(p.uri).base64()}`));
  const html = `<html><head><meta name="viewport" content="width=device-width"><style>
    @page { margin: 0; } body { margin: 0; }
    img { width: 100%; display: block; page-break-after: always; }
  </style></head><body>${images.map((src) => `<img src="${src}"/>`).join('')}</body></html>`;
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}
