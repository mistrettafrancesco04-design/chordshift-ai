import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText, PressableScale } from '@/components/ui';
import { findKey, formatKey, type KeyMode, type MusicalKey, type Notation } from '@/features/music';
import { colors, fonts, glow, gradients, palette } from '@/theme';

/** Circle-of-fifths order of tonics (pitch classes), starting at C on top. */
const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
/** Relative minor tonics in the same positions (Am at the top). */
const FIFTHS_MINOR = FIFTHS.map((pc) => (pc + 9) % 12);

interface KeyWheelProps {
  mode: KeyMode;
  /** Highlighted with an outline ring. */
  original: MusicalKey | null;
  /** Filled neon selection; the pointer points here. */
  selected: MusicalKey | null;
  onSelect: (key: MusicalKey) => void;
  notation: Notation;
  centerTitle: string;
  centerSubtitle?: string;
}

/**
 * All twelve keys arranged on the circle of fifths – neighbouring keys are musically
 * related, which makes choosing a singable target key intuitive.
 */
export function KeyWheel({ mode, original, selected, onSelect, notation, centerTitle, centerSubtitle }: KeyWheelProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 72, 320);
  const button = Math.max(42, Math.round(size * 0.15));
  const radius = size / 2 - button / 2 - 4;
  const tonics = mode === 'major' ? FIFTHS : FIFTHS_MINOR;

  const selectedIndex = selected ? tonics.indexOf(selected.tonic) : -1;
  const rotation = useSharedValue(selectedIndex >= 0 ? selectedIndex * 30 : 0);
  useEffect(() => {
    if (selectedIndex < 0) return;
    const target = selectedIndex * 30;
    // Rotate along the shortest path around the circle.
    const current = rotation.get();
    const delta = ((((target - current) % 360) + 540) % 360) - 180;
    rotation.set(withSpring(current + delta, { damping: 16, stiffness: 140 }));
  }, [rotation, selectedIndex]);
  const pointerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  return (
    <View style={[styles.wheel, { width: size, height: size }]} accessibilityRole="radiogroup">
      <View style={[styles.ring, { width: size - button, height: size - button, borderRadius: size }]} />
      {selectedIndex >= 0 && (
        <Animated.View pointerEvents="none" style={[styles.pointerWrap, { width: size, height: size }, pointerStyle]}>
          <LinearGradient
            colors={[palette.cyan, 'rgba(139,92,246,0)']}
            style={[styles.pointer, { height: radius - button / 2, top: button + 4 }]}
          />
        </Animated.View>
      )}

      <View style={[styles.center, { width: size * 0.42, height: size * 0.42, borderRadius: size }]}>
        <AppText style={styles.centerTitle} numberOfLines={1} adjustsFontSizeToFit>
          {centerTitle}
        </AppText>
        {centerSubtitle && (
          <AppText variant="caption" color="textMuted" align="center" numberOfLines={2}>
            {centerSubtitle}
          </AppText>
        )}
      </View>

      {tonics.map((tonic, index) => {
        const key = findKey(tonic, mode);
        const angle = ((index * 30 - 90) * Math.PI) / 180;
        const left = size / 2 + radius * Math.cos(angle) - button / 2;
        const top = size / 2 + radius * Math.sin(angle) - button / 2;
        const isSelected = selected?.id === key.id;
        const isOriginal = original?.id === key.id;
        const label = formatKey(key, notation);
        return (
          <PressableScale
            key={key.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${formatKey(key, 'german')}${isOriginal ? ', Originaltonart' : ''}`}
            onPress={() => onSelect(key)}
            pressedScale={0.88}
            style={[
              styles.key,
              { left, top, width: button, height: button, borderRadius: button / 2 },
              isOriginal && styles.keyOriginal,
              isSelected && glow(colors.primary, 14, 0.7),
            ]}>
            {isSelected && (
              <LinearGradient colors={gradients.primary} style={[StyleSheet.absoluteFill, { borderRadius: button / 2 }]} />
            )}
            <AppText
              style={[styles.keyLabel, { fontSize: label.length > 3 ? 12 : 15 }, isSelected && styles.keyLabelSelected]}
              numberOfLines={1}>
              {label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  pointerWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pointer: {
    position: 'absolute',
    width: 3,
    borderRadius: 2,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  centerTitle: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  key: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  keyOriginal: {
    borderColor: palette.magenta,
    borderWidth: 2,
  },
  keyLabel: {
    fontFamily: fonts.monoBold,
    color: colors.textSecondary,
  },
  keyLabelSelected: {
    color: colors.textOnAccent,
  },
});
