import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, GlassCard, NeonButton } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { useStudioStore } from '../studio-store';
import type { TransposedChord } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STEPS: { label: string; icon: IconName }[] = [
  { label: 'Bild', icon: 'image' },
  { label: 'Akkorde finden', icon: 'scan' },
  { label: 'Transponieren', icon: 'swap-vertical' },
];

/** Pipeline status + analysis trigger + list of detected chords. */
export function AnalysisPanel({ chords }: { chords: TransposedChord[] }) {
  const status = useStudioStore((s) => s.status);
  const error = useStudioStore((s) => s.error);
  const analyzerMissing = useStudioStore((s) => s.analyzerMissing);
  const analyze = useStudioStore((s) => s.analyze);
  const cancel = useStudioStore((s) => s.cancelAnalysis);

  const activeStep = status === 'analyzed' ? 2 : status === 'analyzing' ? 1 : 0;

  return (
    <GlassCard>
      <View style={styles.stack}>
        <View style={styles.steps}>
          {STEPS.map((step, index) => {
            const done = index < activeStep || (status === 'analyzed' && index <= activeStep);
            const current = index === activeStep && status === 'analyzing';
            const tint = done ? colors.success : current ? colors.primary : colors.textMuted;
            return (
              <View key={step.label} style={styles.step}>
                <View style={[styles.stepIcon, { borderColor: tint }]}>
                  {current ? (
                    <ActivityIndicator size="small" color={tint} />
                  ) : (
                    <Ionicons name={done ? 'checkmark' : step.icon} size={16} color={tint} />
                  )}
                </View>
                <AppText variant="caption" color={done ? 'success' : current ? 'primary' : 'textMuted'} align="center">
                  {step.label}
                </AppText>
              </View>
            );
          })}
        </View>

        {status === 'error' && (
          <View style={[styles.notice, analyzerMissing ? styles.noticeInfo : styles.noticeError]}>
            <Ionicons
              name={analyzerMissing ? 'construct-outline' : 'alert-circle-outline'}
              size={18}
              color={analyzerMissing ? colors.warning : colors.danger}
            />
            <View style={styles.noticeText}>
              <AppText variant="bodyStrong">{analyzerMissing ? 'Analyse-Engine nicht verbunden' : error}</AppText>
              <AppText variant="caption" color="textSecondary">
                {analyzerMissing
                  ? 'Die Akkorderkennung wird im nächsten Entwicklungsschritt angebunden (EXPO_PUBLIC_ANALYZER_URL). Bis dahin kannst du Tonart und Transposition bereits einstellen und Akkorde im Chord Lab testen.'
                  : 'Bitte versuche es erneut oder verwende ein schärferes Foto mit gutem Licht.'}
              </AppText>
            </View>
          </View>
        )}

        {status === 'analyzed' && (
          <View style={styles.chordList}>
            <AppText variant="label" color="textSecondary">
              {chords.length} Akkorde erkannt
            </AppText>
            <View style={styles.chordWrap}>
              {chords.slice(0, 40).map((c) => (
                <View key={c.id} style={styles.chordPill}>
                  <AppText variant="mono" color="textMuted">
                    {c.original}
                  </AppText>
                  {c.transposed !== c.original && (
                    <AppText variant="mono" color="primary">
                      {' → '}
                      {c.transposed}
                    </AppText>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {status === 'analyzing' ? (
          <NeonButton label="Abbrechen" variant="secondary" icon="close" onPress={cancel} fullWidth />
        ) : (
          <NeonButton
            label={status === 'analyzed' ? 'Erneut analysieren' : 'Akkorde erkennen'}
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
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  noticeInfo: {
    backgroundColor: 'rgba(255,181,71,0.08)',
    borderColor: 'rgba(255,181,71,0.3)',
  },
  noticeError: {
    backgroundColor: 'rgba(255,77,109,0.08)',
    borderColor: 'rgba(255,77,109,0.3)',
  },
  noticeText: {
    flex: 1,
    gap: spacing.xxs,
  },
  chordList: {
    gap: spacing.sm,
  },
  chordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chordPill: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
});
