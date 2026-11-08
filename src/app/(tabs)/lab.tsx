import { useState } from 'react';

import { Screen, SectionHeader } from '@/components/ui';
import { ChordLab } from '@/features/transposer/components/chord-lab';
import { SemitoneStepper } from '@/features/transposer/components/semitone-stepper';
import { wrapSemitones } from '@/features/transposer/transposition';

export default function LabScreen() {
  const [semitones, setSemitones] = useState(2);

  return (
    <Screen>
      <SectionHeader overline="Chord Lab" title="Text-Transposer" />
      <SemitoneStepper value={semitones} onShift={(d) => setSemitones((s) => wrapSemitones(s + d))} />
      <ChordLab semitones={semitones} />
    </Screen>
  );
}
