import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FadeIn, IconButton, Screen, SectionHeader } from '@/components/ui';
import { ChordLab } from '@/features/transposer/components/chord-lab';
import { SemitoneStepper } from '@/features/transposer/components/semitone-stepper';
import { wrapSemitones } from '@/features/transposer/transposition';
import { spacing } from '@/theme';

export default function LabScreen() {
  const [semitones, setSemitones] = useState(2);

  return (
    <Screen withTabBar={false}>
      <FadeIn index={0} style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Zurück" onPress={() => router.back()} />
        <View style={styles.flex}>
          <SectionHeader overline="Chord Lab" title="Text-Transposer" />
        </View>
      </FadeIn>
      <FadeIn index={1}>
        <SemitoneStepper value={semitones} onShift={(d) => setSemitones((s) => wrapSemitones(s + d))} />
      </FadeIn>
      <FadeIn index={2}>
        <ChordLab semitones={semitones} />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
