import Constants from 'expo-constants';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText, FadeIn, GlassCard, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import type { AccidentalPreference, Notation } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';
import { getSheetAnalyzer } from '@/features/transposer/services/analysis';
import { confirm } from '@/lib/dialog';
import { colors, spacing } from '@/theme';

const NOTATION_OPTIONS = [
  { value: 'international', label: 'International (B)' },
  { value: 'german', label: 'Deutsch (H)' },
] as const satisfies readonly { value: Notation; label: string }[];

const ACCIDENTAL_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'sharps', label: 'Kreuz (#)' },
  { value: 'flats', label: 'Be (b)' },
] as const satisfies readonly { value: AccidentalPreference; label: string }[];

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const analyzer = getSheetAnalyzer();

  return (
    <Screen>
      <FadeIn index={0}>
        <SectionHeader overline="Optionen" title="Einstellungen" />
      </FadeIn>

      <GlassCard>
        <View style={styles.group}>
          <AppText variant="overline" color="primary">
            Notation
          </AppText>
          <View style={styles.field}>
            <AppText variant="label" color="textSecondary">
              Akkorde auf dem Notenblatt lesen als
            </AppText>
            <SegmentedControl options={NOTATION_OPTIONS} value={settings.inputNotation} onChange={settings.setInputNotation} />
          </View>
          <View style={styles.field}>
            <AppText variant="label" color="textSecondary">
              Transponierte Akkorde schreiben als
            </AppText>
            <SegmentedControl options={NOTATION_OPTIONS} value={settings.outputNotation} onChange={settings.setOutputNotation} />
          </View>
          <View style={styles.field}>
            <AppText variant="label" color="textSecondary">
              Vorzeichen
            </AppText>
            <SegmentedControl options={ACCIDENTAL_OPTIONS} value={settings.accidentals} onChange={settings.setAccidentals} />
          </View>
        </View>
      </GlassCard>

      <GlassCard>
        <View style={styles.group}>
          <AppText variant="overline" color="primary">
            Bedienung
          </AppText>
          <ListRow
            icon="phone-portrait-outline"
            title="Haptisches Feedback"
            subtitle="Vibration bei Interaktionen"
            trailing={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={settings.setHapticsEnabled}
                trackColor={{ true: colors.primary, false: colors.surfaceStrong }}
                thumbColor={colors.text}
              />
            }
          />
        </View>
      </GlassCard>

      <GlassCard>
        <View style={styles.group}>
          <AppText variant="overline" color="primary">
            System
          </AppText>
          <ListRow
            icon="hardware-chip-outline"
            title="Akkorderkennung"
            subtitle={analyzer.id === 'remote' ? 'Analyse-Dienst (Server)' : 'On-Device · offline · keine Uploads'}
          />
          <ListRow icon="information-circle-outline" title="Version" subtitle={Constants.expoConfig?.version ?? '–'} />
          <ListRow
            icon="refresh-outline"
            title="Einstellungen zurücksetzen"
            subtitle="Notation, Vorzeichen und Haptik auf Standard"
            onPress={async () => {
              const ok = await confirm({ title: 'Einstellungen zurücksetzen?', confirmLabel: 'Zurücksetzen' });
              if (ok) settings.reset();
            }}
          />
        </View>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
});
