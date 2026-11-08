import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/brand/logo';
import {
  AppText,
  EmptyState,
  FadeIn,
  GlassCard,
  IconButton,
  PressableScale,
  Screen,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { ContinueCard } from '@/features/home/continue-card';
import { HeroCard } from '@/features/home/hero-card';
import { SongCarousel } from '@/features/home/song-carousel';
import { computeLibraryStats, useLibraryStore } from '@/features/library/library-store';
import { colors, radii, spacing } from '@/theme';

const PIPELINE = [
  { icon: 'camera-outline', title: 'Erfassen', text: 'Foto, Mediathek oder PDF' },
  { icon: 'scan-outline', title: 'Erkennen', text: 'On-Device-KI findet nur Akkordsymbole' },
  { icon: 'color-wand-outline', title: 'Ersetzen', text: 'Nur die Akkordflächen werden neu gezeichnet' },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Hallo';
  return 'Guten Abend';
}

export default function HomeScreen() {
  const projects = useLibraryStore((s) => s.projects);
  const stats = useMemo(() => computeLibraryStats(projects), [projects]);
  const favorites = useMemo(() => projects.filter((p) => p.favorite), [projects]);

  return (
    <Screen>
      <FadeIn index={0} style={styles.header}>
        <Logo />
        <IconButton icon="settings-outline" accessibilityLabel="Einstellungen" onPress={() => router.navigate('/settings')} />
      </FadeIn>

      <FadeIn index={1}>
        <AppText variant="display">{greeting()}</AppText>
        <AppText variant="body" color="textSecondary">
          In welche Tonart soll es heute gehen?
        </AppText>
      </FadeIn>

      <FadeIn index={2}>
        <HeroCard />
      </FadeIn>

      <FadeIn index={3}>
        <ContinueCard />
      </FadeIn>

      <FadeIn index={4} style={styles.stats}>
        <StatTile icon="albums" value={stats.songs} label="Songs" />
        <StatTile icon="star" value={stats.favorites} label="Favoriten" tint={colors.warning} />
        <StatTile icon="musical-notes" value={stats.chords} label="Akkorde" tint={colors.accent} />
      </FadeIn>

      <FadeIn index={5} style={styles.section}>
        <SectionHeader
          overline="Meine Songs"
          title="Zuletzt bearbeitet"
          actionLabel={projects.length > 0 ? 'Alle' : undefined}
          onAction={() => router.navigate('/songs')}
        />
        {projects.length === 0 ? (
          <EmptyState
            icon="musical-notes-outline"
            title="Noch keine Songs"
            message="Importiere ein Notenblatt und speichere es im Studio – es erscheint dann hier."
          />
        ) : (
          <SongCarousel songs={projects.slice(0, 8)} />
        )}
      </FadeIn>

      {favorites.length > 0 && (
        <FadeIn index={6} style={styles.section}>
          <SectionHeader overline="Favoriten" title="Schnellzugriff" actionLabel="Alle" onAction={() => router.navigate('/favorites')} />
          <SongCarousel songs={favorites.slice(0, 8)} />
        </FadeIn>
      )}

      <FadeIn index={7}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Chord Lab öffnen" onPress={() => router.push('/lab')}>
          <GlassCard>
            <View style={styles.tool}>
              <View style={styles.toolIcon}>
                <Ionicons name="flask" size={22} color={colors.secondary} />
              </View>
              <View style={styles.toolText}>
                <AppText variant="bodyStrong">Chord Lab</AppText>
                <AppText variant="caption" color="textMuted">
                  Akkordtexte einfügen und sofort transponieren – ohne Notenblatt.
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </GlassCard>
        </PressableScale>
      </FadeIn>

      <FadeIn index={8} style={styles.section}>
        <SectionHeader overline="Technologie" title="So arbeitet CHORDSHIFT" />
        <View style={styles.pipeline}>
          {PIPELINE.map((step, index) => (
            <View key={step.title} style={styles.pipelineItem}>
              <View style={styles.pipelineIcon}>
                <Ionicons name={step.icon} size={20} color={colors.primary} />
              </View>
              <AppText variant="label" align="center">
                {index + 1}. {step.title}
              </AppText>
              <AppText variant="caption" color="textMuted" align="center">
                {step.text}
              </AppText>
            </View>
          ))}
        </View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
  toolText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pipeline: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pipelineItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pipelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,228,255,0.08)',
    marginBottom: spacing.xs,
  },
});
