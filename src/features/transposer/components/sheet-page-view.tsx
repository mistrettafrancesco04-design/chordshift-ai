import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

import type { SheetPage, TransposedChord } from '../types';
import { ChordOverlay, type OverlayMode } from './chord-overlay';

interface SheetPageViewProps {
  page: SheetPage;
  chords: TransposedChord[];
  mode: OverlayMode;
  highlight?: boolean;
  onChordPress?: (chord: TransposedChord) => void;
  style?: StyleProp<ViewStyle>;
}

/** A page at its natural aspect ratio with the chord overlay on top. */
export function SheetPageView({ page, chords, mode, highlight, onChordPress, style }: SheetPageViewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const aspectRatio = page.width > 0 && page.height > 0 ? page.width / page.height : 0.707;

  return (
    <View
      style={[styles.page, { aspectRatio }, style]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      <Image
        source={{ uri: page.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        transition={120}
        accessibilityIgnoresInvertColors
      />
      <ChordOverlay
        chords={chords}
        width={size.width}
        height={size.height}
        mode={mode}
        highlight={highlight}
        onChordPress={onChordPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    backgroundColor: colors.sheetPaper,
    overflow: 'hidden',
  },
});
