/** Where an imported sheet came from. */
export type SheetOrigin = 'camera' | 'library' | 'file' | 'pdf';

/** One rasterised page of a sheet (photo, image file or rendered PDF page). */
export interface SheetPage {
  uri: string;
  width: number;
  height: number;
}

/** An imported sheet-music document with one or more pages. */
export interface SheetSource {
  pages: SheetPage[];
  origin: SheetOrigin;
  fileName?: string | null;
  mimeType?: string | null;
  /** Total pages of the original document (PDFs may have more than were rendered). */
  pageCount: number;
  importedAt: number;
}

/** Rectangle in normalised image coordinates (0–1, origin top-left). */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Appearance of the area around a chord label, measured on the original image. */
export interface ChordAppearance {
  paper: string;
  ink: string;
  /** Normalised width available for the new label (box + verified blank paper). */
  maxWidth: number;
}

/** A chord symbol located on the sheet. */
export interface ChordAnnotation {
  id: string;
  /** Chord text exactly as printed on the sheet (or as corrected by the user). */
  text: string;
  /** Tight bounding box of the printed label. */
  box: NormalizedRect;
  /** Recognition confidence 0–1 (1 for user-edited chords). */
  confidence: number;
  appearance?: ChordAppearance;
  /** True when the user corrected or added this chord. */
  edited?: boolean;
}

/** Result of analysing one page. */
export interface SheetAnalysis {
  chords: ChordAnnotation[];
  /** Identifier of the analyzer that produced the result (for diagnostics). */
  analyzer: string;
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
  appearance?: ChordAppearance;
}

export interface AnalysisProgress {
  value: number;
  label: string;
}
