import { Platform, type ViewStyle } from 'react-native';

import { palette } from './colors';

/** Neon glow. iOS renders a coloured shadow; Android falls back to elevation. */
export function glow(color: string = palette.cyan, radius = 18, opacity = 0.55): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: { shadowColor: color, shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: 0 } },
    android: { elevation: Math.round(radius / 2), shadowColor: color },
    default: { boxShadow: `0 0 ${radius}px ${color}` } as ViewStyle,
  })!;
}

export const textGlow = (color: string = palette.cyan) => ({
  textShadowColor: color,
  textShadowRadius: 14,
  textShadowOffset: { width: 0, height: 0 },
});
