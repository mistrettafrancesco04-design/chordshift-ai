import type { TextStyle } from 'react-native';

/** Font family names – must match the keys loaded in `src/app/_layout.tsx`. */
export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chord: { fontFamily: fonts.monoBold, fontSize: 20, lineHeight: 26 },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
