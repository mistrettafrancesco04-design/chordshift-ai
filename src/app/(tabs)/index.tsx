import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/brand/logo';
import { AppText, EmptyState, GlassCard, IconButton, Screen, SectionHeader, StatTile } from '@/components/ui';
import { computeLibraryStats, useLibraryStore } from '@/features/library/library-store';
import { ProjectCard } from '@/features/library/project-card';
import { openProject } from '@/features/library/project-actions';
import { SourcePicker } from '@/features/transposer/components/source-picker';
import { colors, radii, spacing } from '@/theme';

const PIPELINE = [
  { icon: 'camera-outline', title: 'Erfassen', text: 'Foto oder Upload des Notenblatts' },
  { icon: 'scan-outline', title: 'Erkennen', text: 'KI findet ausschließlich Akkordsymbole' },
  { icon: 'swap-vertical-outline', title: 'Transponieren', text: 'Nur Akkorde ändern sich – Noten & Text bleiben' },
] as const;

export default function HomeScreen() {
  const projects = useLibraryStore((s) => s.projects);
  const stats = useMemo(() => computeLibraryStats(projects), [projects]);
  const recent = projects.slice(0, 3);

  return (
    <Screen>
      <View style={styles.header}>
        <Logo />
        <IconButton icon="options-outline" accessibilityLabel="Optionen" onPress={() => router.navigate('/settings')} />
      </View>

      <GlassCard active>
        <View style={styles.hero}>
          <AppText variant="overline" color="primary">
            Neues Notenblatt
          </AppText>
          <AppText variant="title">Akkorde transponieren.{'\n'}Alles andere bleibt.</AppText>
          <AppText variant="body" color="textSecondary">
            Fotografiere oder lade ein Notenblatt hoch – CHORDSHIFT AI verschiebt nur die Akkordsymbole in deine
            Wunschtonart.
          </AppText>
          <SourcePicker />
        </View>
      </GlassCard>

      <View style={styles.stats}>
        <StatTile icon="albums" value={stats.projects} label="Projekte" />
        <StatTile icon="swap-vertical" value={stats.transposed} label="Transponiert" tint={colors.secondary} />
        <StatTile icon="musical-notes" value={stats.chords} label="Akkorde" tint={colors.accent} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          overline="Bibliothek"
          title="Zuletzt bearbeitet"
          actionLabel={projects.length > 0 ? 'Alle' : undefined}
          onAction={() => router.navigate('/library')}
        />
        {recent.length === 0 ? (
          <EmptyState
            icon="musical-notes-outline"
            title="Noch keine Projekte"
            message="Importiere dein erstes Notenblatt – gespeicherte Transpositionen erscheinen hier."
          />
        ) : (
          recent.map((project) => <ProjectCard key={project.id} project={project} onPress={() => openProject(project)} />)
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader overline="Pipeline" title="So funktioniert's" />
        <GlassCard>
          <View style={styles.pipeline}>
            {PIPELINE.map((step, index) => (
              <View key={step.title} style={styles.pipelineRow}>
                <View style={styles.pipelineIcon}>
                  <Ionicons name={step.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.pipelineText}>
                  <AppText variant="bodyStrong">
                    {index + 1}. {step.title}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {step.text}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>
      </View>

      <GlassCard>
        <View style={styles.labTeaser}>
          <View style={styles.pipelineText}>
            <AppText variant="bodyStrong">Chord Lab</AppText>
            <AppText variant="caption" color="textMuted">
              Akkordtexte direkt eintippen oder einfügen und sofort transponieren.
            </AppText>
          </View>
          <IconButton icon="flask" tone="primary" accessibilityLabel="Chord Lab öffnen" onPress={() => router.navigate('/lab')} />
        </View>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: {
    gap: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  pipeline: {
    gap: spacing.lg,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pipelineIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,228,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pipelineText: {
    flex: 1,
    gap: spacing.xxs,
  },
  labTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
