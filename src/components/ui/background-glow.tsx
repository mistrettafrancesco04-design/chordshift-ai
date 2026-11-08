import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { gradients, palette } from '@/theme';

/** Deep-space backdrop with two soft neon nebulae. Purely decorative. */
export function BackgroundGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.16,
  },
  orbTop: {
    top: -180,
    right: -120,
    backgroundColor: palette.violet,
  },
  orbBottom: {
    bottom: -200,
    left: -160,
    backgroundColor: palette.cyan,
    opacity: 0.08,
  },
});
