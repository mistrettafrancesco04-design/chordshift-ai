import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Chip, SegmentedControl } from '@/components/ui';
import { formatKey, type KeyMode, MAJOR_KEY_LIST, MINOR_KEY_LIST, type MusicalKey, type Notation } from '@/features/music';
import { spacing } from '@/theme';

interface KeySelectorProps {
  label: string;
  value: MusicalKey | null;
  onChange: (keyId: string) => void;
  notation: Notation;
}

/** Horizontal key picker with a major/minor switch. */
export function KeySelector({ label, value, onChange, notation }: KeySelectorProps) {
  const [mode, setMode] = useState<KeyMode>(value?.mode ?? 'major');
  const keys = mode === 'major' ? MAJOR_KEY_LIST : MINOR_KEY_LIST;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
        <View style={styles.mode}>
          <SegmentedControl
            accessibilityLabel={`${label} Tongeschlecht`}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'major', label: 'Dur' },
              { value: 'minor', label: 'Moll' },
            ]}
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {keys.map((key) => (
          <Chip
            key={key.id}
            mono
            label={formatKey(key, notation)}
            accessibilityLabel={`${label}: ${formatKey(key, 'german')}`}
            selected={value?.id === key.id}
            onPress={() => onChange(key.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mode: {
    width: 140,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
});
