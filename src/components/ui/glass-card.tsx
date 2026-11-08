import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import { colors, glow, gradients, radii, spacing } from '@/theme';

interface GlassCardProps {
  children: ReactNode;
  /** Highlights the card with a neon border and glow. */
  active?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Frosted glass surface used for all cards and panels. */
export function GlassCard({ children, active = false, padded = true, style }: GlassCardProps) {
  return (
    <View style={[styles.card, active && styles.active, active && glow(colors.primary, 16, 0.25), style]}>
      <LinearGradient
        colors={active ? gradients.glassActive : gradients.glass}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={padded && styles.padding}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    overflow: 'hidden',
  },
  active: {
    borderColor: colors.borderGlow,
  },
  padding: {
    padding: spacing.xl,
  },
});
