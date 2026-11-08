import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  BottomSheet,
  FadeIn,
  GlassCard,
  IconButton,
  NeonButton,
  Screen,
  SectionHeader,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { useLibraryStore } from '@/features/library/library-store';
import { saveStudioSession } from '@/features/library/project-actions';
import { AnalysisPanel } from '@/features/transposer/components/analysis-panel';
import { ChordChanges } from '@/features/transposer/components/chord-changes';
import { PageStrip } from '@/features/transposer/components/page-strip';
import { SheetPageView } from '@/features/transposer/components/sheet-page-view';
import { ImportFromFilesLink, SourcePicker } from '@/features/transposer/components/source-picker';
import { TranspositionPanel } from '@/features/transposer/components/transposition-panel';
import { useStudioStore } from '@/features/transposer/studio-store';
import { useExport } from '@/features/transposer/use-export';
import { useTransposedPages } from '@/features/transposer/use-transposed-pages';
import { confirm, notify } from '@/lib/dialog';
import { haptics } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

type View_ = 'transposed' | 'original';

export default function StudioScreen() {
  const source = useStudioStore((s) => s.source);
  const pageIndex = useStudioStore((s) => s.pageIndex);
  const setPage = useStudioStore((s) => s.setPage);
  const analyses = useStudioStore((s) => s.analyses);
  const projectId = useStudioStore((s) => s.projectId);
  const dirty = useStudioStore((s) => s.dirty);
  const clear = useStudioStore((s) => s.clear);
  const projectTitle = useLibraryStore((s) => s.projects.find((p) => p.id === projectId)?.title);

  const pages = useTransposedPages();
  const { exportSheet, exporting, progress } = useExport();
  const [view, setView] = useState<View_>('transposed');
  const [holding, setHolding] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(name?: string) {
    setSaving(true);
    try {
      const project = await saveStudioSession(name);
      if (!project) return;
      haptics.success();
      setSaveOpen(false);
      notify(projectId ? 'Song aktualisiert' : 'In „Meine Songs“ gespeichert', project.title);
    } catch (error) {
      notify('Speichern fehlgeschlagen', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (dirty) {
      const ok = await confirm({
        title: 'Notenblatt schließen?',
        message: 'Nicht gespeicherte Änderungen gehen verloren.',
        confirmLabel: 'Schließen',
        destructive: true,
      });
      if (!ok) return;
    }
    clear();
  }

  if (!source) {
    return (
      <Screen>
        <FadeIn index={0}>
          <SectionHeader overline="Transposer Studio" title="Notenblatt laden" />
        </FadeIn>
        <FadeIn index={1}>
          <GlassCard active>
            <View style={styles.empty}>
              <AppText variant="body" color="textSecondary">
                Für beste Erkennung: Blatt flach hinlegen, gleichmäßiges Licht, ganze Seite im Bild. PDFs werden in voller
                Auflösung gerendert.
              </AppText>
              <SourcePicker />
              <ImportFromFilesLink />
            </View>
          </GlassCard>
        </FadeIn>
        <FadeIn index={2}>
          <GlassCard>
            <View style={styles.guarantee}>
              <AppText variant="overline" color="success">
                Garantie
              </AppText>
              <AppText variant="bodyStrong">Nur Akkordsymbole werden verändert.</AppText>
              <AppText variant="caption" color="textMuted">
                Die Engine ersetzt ausschließlich die Pixel innerhalb der erkannten Akkordfelder. Noten, Liedtexte, Titel
                und alle anderen Elemente bleiben exakt wie im Original.
              </AppText>
            </View>
          </GlassCard>
        </FadeIn>
      </Screen>
    );
  }

  const page = source.pages[pageIndex];
  const chords = pages[pageIndex] ?? [];
  const allChords = pages.flat();
  const mode = view === 'original' || holding ? 'original' : 'transposed';

  return (
    <Screen>
      <FadeIn index={0} style={styles.header}>
        <View style={styles.headerText}>
          <SectionHeader overline="Transposer Studio" title={projectTitle ?? source.fileName ?? 'Notenblatt'} />
        </View>
        <IconButton icon="close" accessibilityLabel="Notenblatt schließen" onPress={handleClose} />
      </FadeIn>

      <FadeIn index={1} style={styles.previewBlock}>
        <SegmentedControl
          accessibilityLabel="Ansicht"
          value={view}
          onChange={setView}
          options={[
            { value: 'transposed', label: 'Transponiert' },
            { value: 'original', label: 'Original' },
          ]}
        />
        <View style={styles.frame}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vollbild-Vorschau öffnen. Gedrückt halten zeigt das Original."
            onPress={() => router.push('/preview')}
            onLongPress={() => setHolding(true)}
            onPressOut={() => setHolding(false)}
            delayLongPress={180}>
            <SheetPageView page={page} chords={chords} mode={mode} />
          </Pressable>
          <View style={styles.frameBar}>
            <View style={[styles.dot, { backgroundColor: mode === 'original' ? colors.warning : colors.success }]} />
            <AppText variant="caption" color="textSecondary" style={styles.flex}>
              {mode === 'original' ? 'Original' : 'Transponiert'} · Seite {pageIndex + 1}/{source.pages.length}
              {source.pageCount > source.pages.length ? ` (von ${source.pageCount})` : ''}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => router.push('/preview')} hitSlop={8} style={styles.fullscreen}>
              <Ionicons name="expand" size={16} color={colors.primary} />
              <AppText variant="label" color="primary">
                Vollbild & Bearbeiten
              </AppText>
            </Pressable>
          </View>
        </View>
        <PageStrip
          pages={source.pages}
          index={pageIndex}
          onSelect={setPage}
          chordCounts={analyses.map((a) => a?.chords.length ?? 0)}
        />
      </FadeIn>

      <FadeIn index={2}>
        <AnalysisPanel />
      </FadeIn>

      <FadeIn index={3}>
        <ChordChanges chords={allChords} />
      </FadeIn>

      <FadeIn index={4}>
        <TranspositionPanel />
      </FadeIn>

      <FadeIn index={5} style={styles.actions}>
        <NeonButton
          label={projectId ? (dirty ? 'Song aktualisieren' : 'Gespeichert') : 'In „Meine Songs“ speichern'}
          icon={projectId && !dirty ? 'checkmark-done' : 'bookmark'}
          size="lg"
          loading={saving}
          disabled={projectId !== null && !dirty}
          onPress={() => {
            if (projectId) save();
            else {
              setTitle((source.fileName ?? '').replace(/\.[a-z0-9]+$/i, ''));
              setSaveOpen(true);
            }
          }}
          fullWidth
        />
        <NeonButton
          label={progress ?? (source.pages.length > 1 ? 'Als PDF exportieren' : 'Als Bild exportieren')}
          icon="share-outline"
          variant="secondary"
          loading={exporting}
          onPress={exportSheet}
          fullWidth
        />
      </FadeIn>

      <BottomSheet visible={saveOpen} title="Song speichern" onClose={() => setSaveOpen(false)}>
        <TextField
          autoFocus
          value={title}
          onChangeText={setTitle}
          placeholder="Titel des Songs"
          accessibilityLabel="Titel des Songs"
          returnKeyType="done"
          onSubmitEditing={() => save(title)}
        />
        <NeonButton label="Speichern" icon="bookmark" loading={saving} onPress={() => save(title)} fullWidth />
      </BottomSheet>
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
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  previewBlock: {
    gap: spacing.md,
  },
  frame: {
    borderRadius: radii.xl,
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  frameBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flex: {
    flex: 1,
  },
  fullscreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
});
