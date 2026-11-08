import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconButton, PressableScale, SegmentedControl } from '@/components/ui';
import { useLibraryStore } from '@/features/library/library-store';
import { ChordEditSheet } from '@/features/transposer/components/chord-edit-sheet';
import { SheetPageView } from '@/features/transposer/components/sheet-page-view';
import { Zoomable } from '@/features/transposer/components/zoomable';
import { renderPages } from '@/features/transposer/services/export-sheet';
import { useStudioStore } from '@/features/transposer/studio-store';
import type { NormalizedRect, TransposedChord } from '@/features/transposer/types';
import { useExport } from '@/features/transposer/use-export';
import { useTransposedPages } from '@/features/transposer/use-transposed-pages';
import { notify } from '@/lib/dialog';
import { haptics } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

type PreviewMode = 'transposed' | 'original' | 'final' | 'edit';

const NO_CHORDS: TransposedChord[] = [];

interface Draft {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const source = useStudioStore((s) => s.source);
  const pageIndex = useStudioStore((s) => s.pageIndex);
  const setPage = useStudioStore((s) => s.setPage);
  const semitones = useStudioStore((s) => s.semitones);
  const updateChord = useStudioStore((s) => s.updateChord);
  const removeChord = useStudioStore((s) => s.removeChord);
  const addChord = useStudioStore((s) => s.addChord);
  const pages = useTransposedPages();
  const projectId = useStudioStore((s) => s.projectId);
  const title = useLibraryStore((s) => s.projects.find((p) => p.id === projectId)?.title);
  const { exportSheet, exporting } = useExport();

  const [mode, setMode] = useState<PreviewMode>('transposed');
  const [highlight, setHighlight] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingBox, setPendingBox] = useState<NormalizedRect | null>(null);
  const [editing, setEditing] = useState<TransposedChord | null>(null);
  const [finalResult, setFinalResult] = useState<{ chords: TransposedChord[]; uri: string } | null>(null);

  const page = source?.pages[pageIndex];
  const chords = pages[pageIndex] ?? NO_CHORDS;
  // The rendered result is only valid for the exact chord list it was rendered from.
  const finalUri = finalResult?.chords === chords ? finalResult.uri : null;

  useEffect(() => {
    if (mode !== 'final' || !page) return;
    let cancelled = false;
    renderPages([{ page, chords }])
      .then(([rendered]) => {
        if (!cancelled) setFinalResult({ chords, uri: rendered.uri });
      })
      .catch((error) => {
        if (!cancelled) notify('Rendern fehlgeschlagen', String(error?.message ?? error));
      });
    return () => {
      cancelled = true;
    };
  }, [mode, page, chords]);

  if (!source || !page) {
    return (
      <View style={[styles.root, styles.center]}>
        <AppText color="textSecondary">Kein Notenblatt geöffnet.</AppText>
        <IconButton icon="close" accessibilityLabel="Schließen" onPress={() => router.back()} />
      </View>
    );
  }

  const topBar = 112 + insets.top;
  const bottomBar = 84 + insets.bottom;
  const availH = screenH - topBar - bottomBar;
  const aspect = page.width / page.height;
  const pageW = Math.min(screenW - spacing.lg * 2, availH * aspect);
  const pageH = pageW / aspect;

  const draw = Gesture.Pan()
    .enabled(drawing)
    .runOnJS(true)
    .minDistance(4)
    .onBegin((e) => setDraft({ x0: e.x, y0: e.y, x1: e.x, y1: e.y }))
    .onUpdate((e) => setDraft((d) => (d ? { ...d, x1: e.x, y1: e.y } : d)))
    .onEnd((e) => {
      // Use the final pointer position – intermediate updates may be coalesced.
      setDraft((current) => {
        const d = current ? { ...current, x1: e.x, y1: e.y } : null;
        if (d) {
          const x = Math.max(0, Math.min(d.x0, d.x1)) / pageW;
          const y = Math.max(0, Math.min(d.y0, d.y1)) / pageH;
          const w = Math.abs(d.x1 - d.x0) / pageW;
          const h = Math.abs(d.y1 - d.y0) / pageH;
          if (w > 0.005 && h > 0.004) {
            setPendingBox({ x, y, width: Math.min(w, 1 - x), height: Math.min(h, 1 - y) });
            haptics.light();
          }
        }
        return null;
      });
    });

  const overlayMode = mode === 'edit' ? 'edit' : mode === 'original' ? 'original' : 'transposed';

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topRow}>
          <IconButton icon="chevron-down" accessibilityLabel="Vorschau schließen" onPress={() => router.back()} />
          <View style={styles.titleBlock}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {title ?? source.fileName ?? 'Notenblatt'}
            </AppText>
            <AppText variant="caption" color="textMuted">
              Seite {pageIndex + 1} von {source.pages.length} · {chords.length} Akkorde
            </AppText>
          </View>
          <IconButton
            icon="share-outline"
            accessibilityLabel="Exportieren"
            onPress={exportSheet}
            disabled={exporting}
          />
        </View>
        <SegmentedControl
          accessibilityLabel="Vorschau-Modus"
          value={mode}
          onChange={(next) => {
            setMode(next);
            setDrawing(false);
          }}
          options={[
            { value: 'transposed', label: 'Live' },
            { value: 'final', label: 'Ergebnis' },
            { value: 'original', label: 'Original' },
            { value: 'edit', label: 'Bearbeiten' },
          ]}
        />
      </View>

      <View style={styles.stage}>
        <View style={{ width: pageW, height: pageH }}>
          <Zoomable enabled={!drawing}>
            <GestureDetector gesture={draw}>
              <View style={{ width: pageW, height: pageH }}>
                {mode === 'final' ? (
                  finalUri ? (
                    <Image source={{ uri: finalUri }} style={{ width: pageW, height: pageH }} contentFit="fill" />
                  ) : (
                    <View style={[styles.rendering, { width: pageW, height: pageH }]}>
                      <SheetPageView page={page} chords={chords} mode="original" />
                      <View style={styles.renderingBadge}>
                        <ActivityIndicator color={colors.primary} />
                        <AppText variant="label">Endergebnis wird gerendert …</AppText>
                      </View>
                    </View>
                  )
                ) : (
                  <SheetPageView
                    page={page}
                    chords={chords}
                    mode={overlayMode}
                    highlight={highlight}
                    onChordPress={(chord) => setEditing(chord)}
                  />
                )}
                {draft && (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.draft,
                      {
                        left: Math.min(draft.x0, draft.x1),
                        top: Math.min(draft.y0, draft.y1),
                        width: Math.abs(draft.x1 - draft.x0),
                        height: Math.abs(draft.y1 - draft.y0),
                      },
                    ]}
                  />
                )}
              </View>
            </GestureDetector>
          </Zoomable>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Vorherige Seite"
          disabled={pageIndex === 0}
          onPress={() => setPage(pageIndex - 1)}
        />
        {mode === 'edit' ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityState={{ selected: drawing }}
            onPress={() => setDrawing((d) => !d)}
            style={[styles.pill, drawing && styles.pillActive]}>
            <Ionicons name={drawing ? 'close' : 'add'} size={18} color={drawing ? colors.textOnAccent : colors.primary} />
            <AppText variant="label" color={drawing ? 'textOnAccent' : 'primary'}>
              {drawing ? 'Markieren beenden' : 'Fehlenden Akkord markieren'}
            </AppText>
          </PressableScale>
        ) : mode === 'transposed' ? (
          <PressableScale
            accessibilityRole="switch"
            accessibilityState={{ checked: highlight }}
            onPress={() => setHighlight((h) => !h)}
            style={[styles.pill, highlight && styles.pillActive]}>
            <Ionicons name="color-wand" size={18} color={highlight ? colors.textOnAccent : colors.primary} />
            <AppText variant="label" color={highlight ? 'textOnAccent' : 'primary'}>
              Änderungen hervorheben
            </AppText>
          </PressableScale>
        ) : (
          <AppText variant="caption" color="textMuted" style={styles.hint}>
            {mode === 'final'
              ? 'So wird exportiert: nur Akkordfelder neu gezeichnet.'
              : 'Unverändertes Original'}
          </AppText>
        )}
        <IconButton
          icon="chevron-forward"
          accessibilityLabel="Nächste Seite"
          disabled={pageIndex >= source.pages.length - 1}
          onPress={() => setPage(pageIndex + 1)}
        />
      </View>

      <ChordEditSheet
        key={`edit-${editing?.id ?? 'none'}`}
        visible={editing !== null}
        initialText={editing?.original ?? ''}
        semitones={semitones}
        onClose={() => setEditing(null)}
        onSave={(text) => {
          if (editing) updateChord(pageIndex, editing.id, text);
          setEditing(null);
          haptics.success();
        }}
        onDelete={() => {
          if (editing) removeChord(pageIndex, editing.id);
          setEditing(null);
          haptics.light();
        }}
      />
      <ChordEditSheet
        key={`add-${pendingBox ? `${pendingBox.x}-${pendingBox.y}` : 'none'}`}
        visible={pendingBox !== null}
        initialText=""
        semitones={semitones}
        onClose={() => setPendingBox(null)}
        onSave={async (text) => {
          const box = pendingBox;
          setPendingBox(null);
          if (box) await addChord(pageIndex, text, box);
          haptics.success();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    zIndex: 2,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rendering: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  renderingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(5,6,15,0.85)',
  },
  draft: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,61,203,0.15)',
    borderRadius: 3,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    zIndex: 2,
    backgroundColor: colors.background,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: 'rgba(34,228,255,0.08)',
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  hint: {
    flex: 1,
    textAlign: 'center',
  },
});
