import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { useImportStore } from '../import-store';
import type { SheetOrigin } from '../types';

const SOURCES: { origin: SheetOrigin; label: string; hint: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { origin: 'camera', label: 'Kamera', hint: 'Aufnehmen', icon: 'camera' },
  { origin: 'library', label: 'Fotos', hint: 'Mediathek', icon: 'images' },
  { origin: 'pdf', label: 'PDF', hint: 'Dokument', icon: 'document-text' },
];

/** Import tiles: camera, photo library and PDF. */
export function SourcePicker() {
  const busy = useImportStore((s) => s.busy);
  const importSheet = useImportStore((s) => s.importSheet);

  return (
    <View style={styles.row}>
      {SOURCES.map((s) => (
        <PressableScale
          key={s.origin}
          accessibilityRole="button"
          accessibilityLabel={`${s.label} – ${s.hint}`}
          disabled={busy !== null}
          onPress={() => importSheet(s.origin)}
          style={styles.tile}>
          <View style={styles.icon}>
            <LinearGradient
              colors={['rgba(34,228,255,0.22)', 'rgba(139,92,246,0.18)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {busy === s.origin ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name={s.icon} size={22} color={colors.primary} />
            )}
          </View>
          <AppText variant="bodyStrong">{s.label}</AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {s.hint}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

/** Secondary link for images stored in Files (not in the photo library). */
export function ImportFromFilesLink() {
  const busy = useImportStore((s) => s.busy);
  const importSheet = useImportStore((s) => s.importSheet);
  return (
    <PressableScale
      accessibilityRole="button"
      disabled={busy !== null}
      onPress={() => importSheet('file')}
      style={styles.link}>
      <Ionicons name="folder-open-outline" size={16} color={colors.textSecondary} />
      <AppText variant="label" color="textSecondary">
        Bild oder PDF aus „Dateien“ wählen
      </AppText>
    </PressableScale>
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
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34,228,255,0.35)',
    marginBottom: spacing.xs,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});

