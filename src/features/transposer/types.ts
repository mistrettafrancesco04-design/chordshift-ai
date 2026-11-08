/** Where an imported sheet came from. */
export type SheetOrigin = 'camera' | 'library' | 'file';

/** An imported sheet-music image. */
export interface SheetSource {
  uri: string;
  width: number;
  height: number;
  origin: SheetOrigin;
  fileName?: string | null;
  mimeType?: string | null;
  importedAt: number;
}

/** Rectangle in normalised image coordinates (0–1, origin top-left). */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A chord symbol located on the sheet by the analyzer. */
export interface ChordAnnotation {
  id: string;
  /** Chord text exactly as printed on the sheet. */
  text: string;
  box: NormalizedRect;
  /** Recognition confidence 0–1. */
  confidence: number;
}

/** Result of analysing one sheet image. */
export interface SheetAnalysis {
  chords: ChordAnnotation[];
  /** Identifier of the analyzer that produced the result (for diagnostics). */
  analyzer: string;
  /** Optional key detected by the analyzer; the app also detects it locally. */
  detectedKey?: string | null;
  durationMs: number;
}

export type StudioStatus = 'empty' | 'ready' | 'analyzing' | 'analyzed' | 'error';

/** A chord ready for rendering: original + transposed text at its position. */
export interface TransposedChord {
  id: string;
  original: string;
  transposed: string;
  box: NormalizedRect;
  confidence: number;
}
