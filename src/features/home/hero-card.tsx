import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { ImportFromFilesLink, SourcePicker } from '@/features/transposer/components/source-picker';
import { colors, fonts, glow, gradients, palette, radii, spacing, textGlow } from '@/theme';

/** Animated hero: rotating neon halo, pulsing ♯ core and the import actions. */
export function HeroCard() {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.set(withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false));
    pulse.set(
      withRepeat(
      withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1600 })),
        -1,
        false,
      ),
    );
  }, [pulse, spin]);

  const haloStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get()}deg` }] }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.get() * 0.06 }],
    shadowOpacity: 0.45 + pulse.get() * 0.4,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.haloClip} pointerEvents="none">
        <Animated.View style={[styles.halo, haloStyle]}>
          <LinearGradient
            colors={[palette.cyan, 'transparent', palette.violet, 'transparent', palette.magenta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <View style={styles.card}>
        <LinearGradient
          colors={['rgba(17,20,42,0.96)', 'rgba(10,12,27,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.top}>
          <View style={styles.copy}>
            <AppText variant="overline" color="primary">
              Neues Notenblatt
            </AppText>
            <AppText variant="title">
              Akkorde{'\n'}
              <AppText variant="title" style={styles.accent}>
                verschieben.
              </AppText>
            </AppText>
            <AppText variant="label" color="textSecondary">
              Noten, Text & Layout bleiben pixelgenau.
            </AppText>
          </View>
          <Animated.View style={[styles.core, glow(colors.primary, 26, 0.6), coreStyle]}>
            <LinearGradient colors={gradients.neon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <AppText style={styles.coreGlyph}>♯</AppText>
          </Animated.View>
        </View>
        <SourcePicker />
        <ImportFromFilesLink />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl + 2,
    padding: 1.5,
    overflow: 'hidden',
  },
  haloClip: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    width: 900,
    height: 900,
    opacity: 0.9,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  accent: {
    color: colors.primary,
    ...textGlow(colors.primary),
  },
  core: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coreGlyph: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
    color: colors.textOnAccent,
  },
});
