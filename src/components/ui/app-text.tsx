import { Text, type TextProps } from 'react-native';

import { type ColorToken, colors, typography, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

/** The only text primitive of the app – enforces the type scale and colour tokens. */
export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[typography[variant], { color: colors[color] }, align && { textAlign: align }, style]}
    />
  );
}
