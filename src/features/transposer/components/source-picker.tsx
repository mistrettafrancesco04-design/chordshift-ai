import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { SheetOrigin } from '../types';
import { useSheetImport } from '../use-sheet-import';

const SOURCES: { origin: SheetOrigin; label: string; hint: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { origin: 'camera', label: 'Scannen', hint: 'Kamera', icon: 'scan' },
  { origin: 'library', label: 'Galerie', hint: 'Fotos', icon: 'images' },
  { origin: 'file', label: 'Dateien', hint: 'Bild-Datei', icon: 'document-attach' },
];

/** Three import tiles: camera, photo library, files. */
export function SourcePicker() {
  const { importSheet, busy } = useSheetImport();

  return (
    <View style={styles.row}>
      {SOURCES.map((s) => (
        <Pressable
          key={s.origin}
          accessibilityRole="button"
          accessibilityLabel={`${s.label} – ${s.hint}`}
          disabled={busy !== null}
          onPress={() => importSheet(s.origin)}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
          <View style={styles.icon}>
            {busy === s.origin ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name={s.icon} size={22} color={colors.primary} />
            )}
          </View>
          <AppText variant="bodyStrong">{s.label}</AppText>
          <AppText variant="caption" color="textMuted">
            {s.hint}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
    borderColor: colors.borderGlow,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,228,255,0.1)',
    marginBottom: spacing.xs,
  },
});
