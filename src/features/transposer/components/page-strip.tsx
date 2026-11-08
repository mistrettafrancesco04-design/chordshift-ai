import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { SheetPage } from '../types';

interface PageStripProps {
  pages: SheetPage[];
  index: number;
  onSelect: (index: number) => void;
  chordCounts?: number[];
}

/** Horizontal page thumbnails for multi-page PDFs. */
export function PageStrip({ pages, index, onSelect, chordCounts }: PageStripProps) {
  if (pages.length <= 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {pages.map((page, i) => (
        <PressableScale
          key={page.uri}
          accessibilityRole="button"
          accessibilityState={{ selected: i === index }}
          accessibilityLabel={`Seite ${i + 1}`}
          onPress={() => onSelect(i)}
          style={[styles.thumb, i === index && styles.active]}>
          <Image source={{ uri: page.uri }} style={styles.image} contentFit="cover" />
          <View style={styles.label}>
            <AppText variant="caption" color={i === index ? 'primary' : 'textSecondary'}>
              {i + 1}
              {chordCounts?.[i] ? ` · ${chordCounts[i]}` : ''}
            </AppText>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumb: {
    width: 64,
    height: 86,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.sheetPaper,
  },
  active: {
    borderColor: colors.primary,
  },
  image: {
    flex: 1,
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(5,6,15,0.78)',
  },
});
