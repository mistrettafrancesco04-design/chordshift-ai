import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { SheetSource, TransposedChord } from '../types';
import { ChordOverlay } from './chord-overlay';

interface SheetPreviewProps {
  source: SheetSource;
  chords: TransposedChord[];
}

/**
 * Shows the sheet at its natural aspect ratio with the chord overlay on top.
 * Press and hold to compare with the untouched original.
 */
export function SheetPreview({ source, chords }: SheetPreviewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [showOriginal, setShowOriginal] = useState(false);
  const aspectRatio = source.width > 0 && source.height > 0 ? source.width / source.height : 0.707;
  const changed = chords.some((c) => c.transposed !== c.original);

  return (
    <View style={styles.frame}>
      <Pressable
        accessibilityRole="image"
        accessibilityLabel="Notenblatt-Vorschau. Gedrückt halten, um das Original zu sehen."
        onPressIn={() => setShowOriginal(true)}
        onPressOut={() => setShowOriginal(false)}
        style={[styles.sheet, { aspectRatio }]}
        onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        <Image source={{ uri: source.uri }} style={StyleSheet.absoluteFill} contentFit="fill" transition={150} />
        <ChordOverlay chords={chords} width={size.width} height={size.height} showOriginal={showOriginal} />
      </Pressable>

      {changed && (
        <View style={styles.caption} pointerEvents="none">
          <View style={[styles.dot, { backgroundColor: showOriginal ? colors.warning : colors.success }]} />
          <AppText variant="caption" color={showOriginal ? 'warning' : 'success'}>
            {showOriginal ? 'Original' : 'Transponiert · gedrückt halten zum Vergleichen'}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radii.xl,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheet: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.sheetPaper,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
