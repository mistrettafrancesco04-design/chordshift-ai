import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, fonts, radii, spacing } from '@/theme';

/** Single-line glass text input. */
export function TextField({ style, mono, ...rest }: TextInputProps & { mono?: boolean }) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      {...rest}
      style={[styles.input, mono && styles.mono, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  mono: {
    fontFamily: fonts.monoBold,
    fontSize: 20,
  },
});
