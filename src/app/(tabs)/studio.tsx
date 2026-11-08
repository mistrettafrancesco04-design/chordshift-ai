import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, GlassCard, IconButton, NeonButton, Screen, SectionHeader } from '@/components/ui';
import { saveStudioSession } from '@/features/library/project-actions';
import { useSettingsStore } from '@/features/settings/settings-store';
import { AnalysisPanel } from '@/features/transposer/components/analysis-panel';
import { SheetPreview } from '@/features/transposer/components/sheet-preview';
import { SourcePicker } from '@/features/transposer/components/source-picker';
import { TranspositionPanel } from '@/features/transposer/components/transposition-panel';
import { selectOriginalKey, useStudioStore } from '@/features/transposer/studio-store';
import { transposeAnalysis } from '@/features/transposer/transposition';
import { haptics } from '@/lib/haptics';
import { spacing } from '@/theme';

export default function StudioScreen() {
  const source = useStudioStore((s) => s.source);
  const analysis = useStudioStore((s) => s.analysis);
  const semitones = useStudioStore((s) => s.semitones);
  const projectId = useStudioStore((s) => s.projectId);
  const originalKey = useStudioStore(selectOriginalKey);
  const clear = useStudioStore((s) => s.clear);

  const inputNotation = useSettingsStore((s) => s.inputNotation);
  const outputNotation = useSettingsStore((s) => s.outputNotation);
  const accidentals = useSettingsStore((s) => s.accidentals);

  const chords = useMemo(
    () =>
      analysis
        ? transposeAnalysis(analysis, { semitones, originalKey, inputNotation, outputNotation, accidentals })
        : [],
    [analysis, semitones, originalKey, inputNotation, outputNotation, accidentals],
  );

  function handleSave() {
    const project = saveStudioSession();
    if (!project) return;
    haptics.success();
    Alert.alert(projectId ? 'Projekt aktualisiert' : 'In Bibliothek gespeichert', project.title);
  }

  function handleClear() {
    Alert.alert('Notenblatt schließen?', 'Nicht gespeicherte Änderungen gehen verloren.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Schließen', style: 'destructive', onPress: clear },
    ]);
  }

  if (!source) {
    return (
      <Screen>
        <SectionHeader overline="Transposer Studio" title="Notenblatt laden" />
        <GlassCard active>
          <View style={styles.empty}>
            <AppText variant="body" color="textSecondary">
              Wähle eine Quelle. Für beste Ergebnisse: Blatt flach hinlegen, gleichmäßiges Licht, ganze Seite im Bild.
            </AppText>
            <SourcePicker />
          </View>
        </GlassCard>
        <GlassCard>
          <View style={styles.guarantee}>
            <AppText variant="overline" color="success">
              Garantie
            </AppText>
            <AppText variant="bodyStrong">Nur Akkordsymbole werden verändert.</AppText>
            <AppText variant="caption" color="textMuted">
              Noten, Liedtexte, Titel und alle anderen Elemente des Blatts bleiben pixelgenau erhalten – die neuen
              Akkorde werden ausschließlich an den erkannten Akkordpositionen eingesetzt.
            </AppText>
          </View>
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <SectionHeader overline="Transposer Studio" title={source.fileName ?? 'Notenblatt'} />
        <View style={styles.headerActions}>
          <IconButton icon="close" accessibilityLabel="Notenblatt schließen" onPress={handleClear} />
        </View>
      </View>

      <SheetPreview source={source} chords={chords} />
      <AnalysisPanel chords={chords} />
      <TranspositionPanel />

      <View style={styles.actions}>
        <NeonButton
          label={projectId ? 'Projekt aktualisieren' : 'In Bibliothek speichern'}
          icon="bookmark"
          size="lg"
          onPress={handleSave}
          fullWidth
        />
        <NeonButton label="Exportieren (bald verfügbar)" icon="share-outline" variant="secondary" disabled fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: spacing.lg,
  },
  guarantee: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
});
