import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts, glow, gradients, radii, spacing, textGlow } from '@/theme';

interface LogoProps {
  size?: 'sm' | 'md';
}

/** CHORDSHIFT AI wordmark with the "shift" glyph (♯ inside a neon tile). */
export function Logo({ size = 'md' }: LogoProps) {
  const tile = size === 'md' ? 40 : 32;
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="CHORDSHIFT AI">
      <View style={[styles.tile, { width: tile, height: tile }, glow(colors.primary, 14, 0.6)]}>
        <LinearGradient colors={gradients.neon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <AppText style={[styles.glyph, { fontSize: tile * 0.55, lineHeight: tile * 0.7 }]}>♯</AppText>
      </View>
      <View>
        <AppText style={[styles.word, size === 'sm' && styles.wordSmall]}>
          CHORD<AppText style={[styles.word, size === 'sm' && styles.wordSmall, styles.shift]}>SHIFT</AppText>
        </AppText>
        <AppText variant="overline" color="textMuted" style={styles.ai}>
          AI Transposer
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    fontFamily: fonts.bold,
    color: colors.textOnAccent,
  },
  word: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 3,
    color: colors.text,
  },
  wordSmall: {
    fontSize: 16,
    lineHeight: 20,
  },
  shift: {
    color: colors.primary,
    ...textGlow(colors.primary),
  },
  ai: {
    fontSize: 9,
    letterSpacing: 3,
  },
});
