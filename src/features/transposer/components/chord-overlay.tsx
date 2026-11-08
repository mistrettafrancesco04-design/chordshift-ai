import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts } from '@/theme';

import type { TransposedChord } from '../types';

interface ChordOverlayProps {
  chords: TransposedChord[];
  /** Size of the rendered image in layout points. */
  width: number;
  height: number;
  showOriginal: boolean;
}

/**
 * Renders transposed chords exactly on top of the detected chord boxes.
 *
 * Each box is masked with the paper colour and the new chord is drawn in its place.
 * Nothing outside the boxes is touched, so notes, lyrics and all other sheet
 * elements remain pixel-identical to the original image.
 */
export function ChordOverlay({ chords, width, height, showOriginal }: ChordOverlayProps) {
  if (showOriginal || width === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {chords.map((chord) => {
        if (chord.transposed === chord.original) return null;
        const boxHeight = chord.box.height * height;
        // Widen the mask slightly when the new chord text is longer than the original.
        const growth = Math.max(1, chord.transposed.length / Math.max(chord.original.length, 1));
        return (
          <View
            key={chord.id}
            style={[
              styles.box,
              {
                left: chord.box.x * width - 1,
                top: chord.box.y * height - 1,
                minWidth: chord.box.width * width + 2,
                width: chord.box.width * width * growth + 2,
                height: boxHeight + 2,
              },
            ]}>
            <AppText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.text, { fontSize: Math.max(8, boxHeight * 0.82), lineHeight: boxHeight + 2 }]}>
              {chord.transposed}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    backgroundColor: colors.sheetPaper,
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.bold,
    color: colors.chordHighlight,
  },
});
