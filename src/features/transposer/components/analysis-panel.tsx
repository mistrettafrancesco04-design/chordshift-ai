import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText, GlassCard, NeonButton, ProgressBar } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { selectChordCount, useStudioStore } from '../studio-store';

/** Chord recognition: start, progress, result summary and errors. */
export function AnalysisPanel() {
  const status = useStudioStore((s) => s.status);
  const progress = useStudioStore((s) => s.progress);
  const error = useStudioStore((s) => s.error);
  const pageCount = useStudioStore((s) => s.source?.pages.length ?? 0);
  const chordCount = useStudioStore(selectChordCount);
  const analyze = useStudioStore((s) => s.analyze);
  const cancel = useStudioStore((s) => s.cancelAnalysis);

  return (
    <GlassCard active={status === 'analyzing'}>
      <View style={styles.stack}>
        <View style={styles.header}>
          <View style={[styles.icon, status === 'analyzed' && styles.iconDone]}>
            <Ionicons
              name={status === 'analyzed' ? 'checkmark' : status === 'error' ? 'alert' : 'scan'}
              size={18}
              color={status === 'analyzed' ? colors.success : status === 'error' ? colors.danger : colors.primary}
            />
          </View>
          <View style={styles.headerText}>
            <AppText variant="bodyStrong">
              {status === 'analyzing'
                ? 'Akkorde werden erkannt …'
                : status === 'analyzed'
                  ? `${chordCount} Akkorde erkannt`
                  : status === 'error'
                    ? 'Erkennung fehlgeschlagen'
                    : 'Akkorde erkennen'}
            </AppText>
            <AppText variant="caption" color="textMuted">
              {status === 'analyzed'
                ? 'Tippe in der Vollbild-Vorschau auf einen Akkord, um ihn zu korrigieren.'
                : status === 'error'
                  ? error
                  : `On-Device-Erkennung · ${pageCount} ${pageCount === 1 ? 'Seite' : 'Seiten'} · offline`}
            </AppText>
          </View>
        </View>

        {status === 'analyzing' && progress && (
          <Animated.View entering={FadeIn} style={styles.progress}>
            <ProgressBar value={progress.value} />
            <AppText variant="caption" color="textSecondary">
              {progress.label}
            </AppText>
          </Animated.View>
        )}

        {status === 'analyzing' ? (
          <NeonButton label="Abbrechen" variant="secondary" icon="close" onPress={cancel} fullWidth />
        ) : (
          <NeonButton
            label={status === 'analyzed' ? 'Erneut erkennen' : 'Akkorde erkennen'}
            icon="sparkles"
            variant={status === 'analyzed' ? 'secondary' : 'primary'}
            onPress={analyze}
            fullWidth
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,228,255,0.1)',
  },
  iconDone: {
    backgroundColor: 'rgba(61,255,168,0.1)',
  },
  progress: {
    gap: spacing.sm,
  },
});
