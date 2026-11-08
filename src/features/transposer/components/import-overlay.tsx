import { BlurView } from 'expo-blur';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AppText, ProgressBar } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { useImportStore } from '../import-store';

/** Blocking progress card while a PDF is rendered into pages. */
export function ImportOverlay() {
  const progress = useImportStore((s) => s.progress);
  const visible = progress !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View entering={ZoomIn.springify().damping(16)} style={styles.card}>
          <AppText variant="overline" color="primary">
            Import
          </AppText>
          <AppText variant="heading">{progress?.label ?? 'PDF wird verarbeitet'}</AppText>
          <ProgressBar value={progress?.value ?? 0} />
          <AppText variant="caption" color="textMuted">
            Seiten werden in voller Auflösung gerendert – das Original bleibt unverändert.
          </AppText>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: 'rgba(5,6,15,0.5)',
  },
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
});
