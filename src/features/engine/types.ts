import type { NormalizedRect } from '@/features/transposer/types';

export type EngineLibName =
  | 'pdf'
  | 'pdf-worker'
  | 'tesseract'
  | 'tesseract-worker'
  | 'tesseract-core'
  | 'eng-traineddata';

export interface EnginePageImage {
  base64: string;
  width: number;
  height: number;
}

export interface RenderPdfResult {
  pageCount: number;
  pages: EnginePageImage[];
}

export interface OcrWord {
  text: string;
  confidence: number;
  box: NormalizedRect;
}

export interface OcrResult {
  words: OcrWord[];
  width: number;
  height: number;
}

/** Colour/space analysis of the area around one chord label. */
export interface ChordRegion {
  /** Paper colour sampled right outside the box (used to mask the old label). */
  paper: string;
  /** Average colour of the original label's ink (used for the new label). */
  ink: string;
  /** Width (normalised) available for the new label: box + verified blank paper to the right. */
  maxWidth: number;
  /** Bounding box of the label's ink pixels inside the detected box (null if empty). */
  tight: NormalizedRect | null;
}

export interface ComposeChord {
  box: NormalizedRect;
  text: string;
  paper: string;
  ink: string;
  maxWidth: number;
}

export interface EngineProgress {
  value: number;
  label?: string;
}
