import { colors, gradients } from './colors';
import { radii, spacing } from './spacing';
import { fonts, typography } from './typography';

export * from './colors';
export * from './effects';
export * from './spacing';
export * from './typography';

export const theme = { colors, gradients, spacing, radii, fonts, typography } as const;
export type Theme = typeof theme;
