import { createId } from '@/lib/id';

import { fileBase64, imageSrc, libPayload } from './asset-payload';
import { writeImage } from './output-files';
import type {
  ChordRegion,
  ComposeChord,
  EngineLibName,
  EngineProgress,
  OcrResult,
  RenderPdfResult,
} from './types';
import type { NormalizedRect } from '@/features/transposer/types';

type Sender = (message: string) => void;
type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: (p: EngineProgress) => void;
};

const READY_TIMEOUT_MS = 20000;

/**
 * Promise-based client for the hidden image-processing page.
 * The <EngineHost/> component (mounted once at the app root) connects the transport.
 */
class EngineClient {
  private sender: Sender | null = null;
  private ready = false;
  private readyWaiters: { resolve: () => void; reject: (e: Error) => void }[] = [];
  private pending = new Map<string, Pending>();
  private loadedLibs = new Map<EngineLibName, Promise<void>>();

  /** Called by the host when the page (re)loads. */
  connect(sender: Sender) {
    this.sender = sender;
    this.flushWaiters();
  }

  private flushWaiters() {
    if (this.ready && this.sender) this.readyWaiters.splice(0).forEach((w) => w.resolve());
  }

  disconnect(reason = 'Bildverarbeitung wurde beendet') {
    this.ready = false;
    this.sender = null;
    this.loadedLibs.clear();
    for (const p of this.pending.values()) p.reject(new Error(reason));
    this.pending.clear();
  }

  /** Called by the host for every message coming from the page. */
  receive(raw: string) {
    let msg: { type?: string; id?: string; ok?: boolean; result?: unknown; error?: string; value?: number; label?: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      this.ready = true;
      this.loadedLibs.clear();
      this.flushWaiters();
      return;
    }
    if (!msg.id) return;
    const pending = this.pending.get(msg.id);
    if (!pending) return;
    if (msg.type === 'progress') {
      pending.onProgress?.({ value: msg.value ?? 0, label: msg.label });
      return;
    }
    this.pending.delete(msg.id);
    if (msg.ok) pending.resolve(msg.result);
    else pending.reject(new Error(msg.error ?? 'Unbekannter Engine-Fehler'));
  }

  private waitUntilReady(): Promise<void> {
    if (this.ready && this.sender) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject };
      this.readyWaiters.push(waiter);
      setTimeout(() => {
        const index = this.readyWaiters.indexOf(waiter);
        if (index >= 0) {
          this.readyWaiters.splice(index, 1);
          reject(new Error('Bildverarbeitung nicht verfügbar'));
        }
      }, READY_TIMEOUT_MS);
    });
  }

  private async request<T>(type: string, payload: unknown, onProgress?: (p: EngineProgress) => void): Promise<T> {
    await this.waitUntilReady();
    const id = createId('job_');
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
      this.sender!(JSON.stringify({ id, type, payload }));
    });
  }

  private ensureLibs(names: EngineLibName[]): Promise<void> {
    return Promise.all(
      names.map((name) => {
        let promise = this.loadedLibs.get(name);
        if (!promise) {
          promise = libPayload(name).then((payload) => this.request<void>('lib', payload));
          promise.catch(() => this.loadedLibs.delete(name));
          this.loadedLibs.set(name, promise);
        }
        return promise;
      }),
    ).then(() => undefined);
  }

  /** Rasterises a PDF into page images (PNG files). */
  async renderPdf(
    uri: string,
    options: { maxPages?: number; targetWidth?: number } = {},
    onProgress?: (p: EngineProgress) => void,
  ) {
    await this.ensureLibs(['pdf', 'pdf-worker']);
    const data = await fileBase64(uri);
    const result = await this.request<RenderPdfResult>(
      'renderPdf',
      { data, maxPages: options.maxPages ?? 20, targetWidth: options.targetWidth ?? 1800 },
      onProgress,
    );
    const pages = [];
    for (const page of result.pages) {
      pages.push({ uri: await writeImage(page.base64, 'pages'), width: page.width, height: page.height });
    }
    return { pageCount: result.pageCount, pages };
  }

  /** On-device OCR: every word with its normalised bounding box. */
  async recognizeText(uri: string, onProgress?: (p: EngineProgress) => void) {
    await this.ensureLibs(['tesseract', 'tesseract-worker', 'tesseract-core', 'eng-traineddata']);
    return this.request<OcrResult>('ocr', { src: await imageSrc(uri) }, onProgress);
  }

  /**
   * Samples paper/ink colours and free space for each chord box and returns the tight ink box.
   * `grow` expands roughly drawn (manual) boxes until they enclose the whole label.
   */
  async measureRegions(uri: string, boxes: NormalizedRect[], options: { grow?: boolean } = {}) {
    if (boxes.length === 0) return [];
    const result = await this.request<{ regions: ChordRegion[] }>('measure', {
      src: await imageSrc(uri),
      boxes,
      grow: options.grow ?? false,
    });
    return result.regions;
  }

  /** Renders the final sheet: original pixels with only the chord labels replaced. */
  async composeSheet(uri: string, chords: ComposeChord[], name?: string) {
    const result = await this.request<{ base64: string; width: number; height: number }>('compose', {
      src: await imageSrc(uri),
      chords,
    });
    return { uri: await writeImage(result.base64, 'exports', name), width: result.width, height: result.height };
  }
}

export const engine = new EngineClient();
