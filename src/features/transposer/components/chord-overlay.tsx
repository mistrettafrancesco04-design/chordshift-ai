import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, palette } from '@/theme';

import type { TransposedChord } from '../types';

export type OverlayMode = 'transposed' | 'original' | 'edit';

interface ChordOverlayProps {
  chords: TransposedChord[];
  /** Size of the rendered page in layout points. */
  width: number;
  height: number;
  mode: OverlayMode;
  /** Draw new chords in the neon accent instead of the sheet's ink colour. */
  highlight?: boolean;
  onChordPress?: (chord: TransposedChord) => void;
}

const CHORD_FONT = Platform.select({ ios: 'HelveticaNeue-Bold', android: 'sans-serif', default: 'Helvetica, Arial, sans-serif' });

/**
 * Live preview of the transposition, mirroring the export renderer:
 * each chord box is masked with the measured paper colour and the new label is drawn at
 * cap-height scale on the original baseline. Nothing outside the boxes is covered.
 */
export function ChordOverlay({ chords, width, height, mode, highlight = false, onChordPress }: ChordOverlayProps) {
  if (width === 0 || mode === 'original') return null;

  return (
    <View pointerEvents={mode === 'edit' ? 'box-none' : 'none'} style={StyleSheet.absoluteFill}>
      {chords.map((chord) => {
        const bx = chord.box.x * width;
        const by = chord.box.y * height;
        const bw = chord.box.width * width;
        const bh = chord.box.height * height;

        if (mode === 'edit') {
          return (
            <Pressable
              key={chord.id}
              accessibilityRole="button"
              accessibilityLabel={`Akkord ${chord.original} bearbeiten`}
              hitSlop={8}
              onPress={() => onChordPress?.(chord)}
              style={[styles.editBox, { left: bx - 3, top: by - 3, width: bw + 6, height: bh + 6 }]}
            />
          );
        }

        if (chord.transposed === chord.original) return null;
        const fontSize = bh / 0.72;
        const maxWidth = Math.max(bw, (chord.appearance?.maxWidth ?? chord.box.width) * width);
        const estimated = Math.min(maxWidth, fontSize * 0.64 * chord.transposed.length);
        return (
          <View
            key={chord.id}
            style={{
              position: 'absolute',
              left: bx - 1,
              top: by - 1,
              width: Math.max(bw, estimated) + 2,
              height: bh + 2,
              backgroundColor: chord.appearance?.paper ?? colors.sheetPaper,
            }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              allowFontScaling={false}
              style={[
                styles.text,
                {
                  fontSize,
                  lineHeight: fontSize,
                  bottom: 1 - fontSize * 0.2,
                  maxWidth: maxWidth + 2,
                  color: highlight ? palette.violet : (chord.appearance?.ink ?? colors.sheetInk),
                },
              ]}>
              {chord.transposed}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    left: 1,
    fontFamily: CHORD_FONT,
    fontWeight: '700',
    includeFontPadding: false,
  },
  editBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: palette.cyan,
    borderRadius: 4,
    backgroundColor: 'rgba(34,228,255,0.15)',
  },
});
