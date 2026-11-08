import type { Notation } from '@/features/music';

import type { SheetAnalysis, SheetPage } from '../../types';
import { parseAnalysisResponse } from './parse-response';
import { type AnalyzeOptions, AnalyzerResponseError, type SheetAnalyzer } from './sheet-analyzer';

/**
 * Sends the sheet image to an HTTP analysis service (`POST {baseUrl}/v1/analyze`,
 * multipart field `image`) and validates the JSON response.
 * The service URL is configured via `EXPO_PUBLIC_ANALYZER_URL`.
 */
export class RemoteSheetAnalyzer implements SheetAnalyzer {
  readonly id = 'remote';
  readonly available = true;

  constructor(
    private readonly baseUrl: string,
    private readonly notation: Notation = 'international',
  ) {}

  async analyze(page: SheetPage, options?: AnalyzeOptions): Promise<SheetAnalysis> {
    const started = Date.now();
    const body = new FormData();
    // React Native's FormData accepts file descriptors of this shape.
    const isPng = page.uri.toLowerCase().split('?')[0].endsWith('.png');
    body.append('image', {
      uri: page.uri,
      name: isPng ? 'sheet.png' : 'sheet.jpg',
      type: isPng ? 'image/png' : 'image/jpeg',
    } as unknown as Blob);
    body.append('width', String(page.width));
    body.append('height', String(page.height));
    options?.onProgress?.({ value: 0.3, label: 'Wird an Analyse-Dienst gesendet' });

    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/v1/analyze`, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new AnalyzerResponseError(`Analyse fehlgeschlagen (HTTP ${response.status})`);
    }

    const result = parseAnalysisResponse(await response.json(), this.id, this.notation);
    return { ...result, durationMs: result.durationMs || Date.now() - started };
  }
}
