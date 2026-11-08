import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FadeInProps {
  children: ReactNode;
  /** Position in a staggered list – each step adds 70 ms delay. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Staggered entrance: fade + slide up with a soft spring. */
export function FadeIn({ children, index = 0, style }: FadeInProps) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 70).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}
