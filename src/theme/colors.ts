/**
 * CHORDSHIFT AI colour tokens – futuristic dark mode.
 * Deep-space background, glass surfaces and neon accents (cyan → violet → magenta).
 * Components must reference these tokens, never raw hex values.
 */
export const palette = {
  void: '#05060F',
  abyss: '#0A0C1B',
  night: '#11142A',
  steel: '#1A1E3A',

  cyan: '#22E4FF',
  violet: '#8B5CF6',
  magenta: '#FF3DCB',
  mint: '#3DFFA8',
  amber: '#FFB547',
  rose: '#FF4D6D',

  white: '#FFFFFF',
  paper: '#FBFBF7',
  ink: '#121212',
} as const;

export const colors = {
  background: palette.void,
  backgroundElevated: palette.abyss,
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.08)',
  surfacePressed: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  borderGlow: 'rgba(34,228,255,0.45)',

  text: '#F2F5FF',
  textSecondary: '#A9B1D6',
  textMuted: '#6B7399',
  textOnAccent: palette.void,

  primary: palette.cyan,
  secondary: palette.violet,
  accent: palette.magenta,
  success: palette.mint,
  warning: palette.amber,
  danger: palette.rose,

  /** Colour of the chord overlay mask – matches typical sheet-music paper. */
  sheetPaper: palette.paper,
  sheetInk: palette.ink,
  /** Highlight used for transposed chords in the preview. */
  chordHighlight: '#7C3AED',
} as const;

/** Gradients as tuples so they can be passed straight to <LinearGradient colors>. */
export const gradients = {
  neon: [palette.cyan, palette.violet, palette.magenta] as const,
  primary: [palette.cyan, palette.violet] as const,
  accent: [palette.violet, palette.magenta] as const,
  success: [palette.mint, palette.cyan] as const,
  background: [palette.void, '#080A1C', palette.void] as const,
  glass: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)'] as const,
  glassActive: ['rgba(34,228,255,0.18)', 'rgba(139,92,246,0.08)'] as const,
};

export type ColorToken = keyof typeof colors;
