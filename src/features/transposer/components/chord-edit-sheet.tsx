import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomSheet, NeonButton, TextField } from '@/components/ui';
import { isChordSymbol, transposeChord } from '@/features/music';
import { useSettingsStore } from '@/features/settings/settings-store';

interface ChordEditSheetProps {
  visible: boolean;
  /** Text to edit; empty for a new chord. */
  initialText: string;
  semitones: number;
  onSave: (text: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/**
 * Correct a recognised chord, delete a false detection or name a newly marked chord.
 * Mount with a `key` per chord so the input starts from that chord's text.
 */
export function ChordEditSheet({ visible, initialText, semitones, onSave, onDelete, onClose }: ChordEditSheetProps) {
  const [text, setText] = useState(initialText);
  const notation = useSettingsStore((s) => s.inputNotation);
  const outputNotation = useSettingsStore((s) => s.outputNotation);
  const accidentals = useSettingsStore((s) => s.accidentals);

  const trimmed = text.trim();
  const valid = isChordSymbol(trimmed, notation);
  const preview = valid ? transposeChord(trimmed, semitones, { notation, outputNotation, accidentals }) : null;

  return (
    <BottomSheet visible={visible} title={onDelete ? 'Akkord bearbeiten' : 'Akkord hinzufügen'} onClose={onClose}>
      <TextField
        mono
        autoFocus
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="z. B. F#m7 oder D/F#"
        accessibilityLabel="Akkordsymbol"
        returnKeyType="done"
        onSubmitEditing={() => valid && onSave(trimmed)}
      />
      <View style={styles.preview}>
        {trimmed.length === 0 ? (
          <AppText variant="caption" color="textMuted">
            Akkord so eingeben, wie er auf dem Blatt steht.
          </AppText>
        ) : valid ? (
          <AppText variant="mono" color="primary">
            Wird zu {preview}
          </AppText>
        ) : (
          <AppText variant="caption" color="danger">
            Kein gültiges Akkordsymbol
          </AppText>
        )}
      </View>
      <NeonButton label="Übernehmen" icon="checkmark" onPress={() => onSave(trimmed)} disabled={!valid} fullWidth />
      {onDelete && (
        <NeonButton label="Kein Akkord – entfernen" icon="trash-outline" variant="secondary" onPress={onDelete} fullWidth />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: {
    minHeight: 20,
  },
});
