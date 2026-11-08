import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, maxContentWidth, screenPadding, spacing, tabBarHeight } from '@/theme';

import { BackgroundGlow } from './background-glow';

interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default) or a fixed layout. */
  scroll?: boolean;
  /** Reserve space for the floating tab bar. */
  withTabBar?: boolean;
  contentStyle?: ViewStyle;
}

/** Base layout of every screen: background, safe area, max width and tab-bar spacing. */
export function Screen({ children, scroll = true, withTabBar = true, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: (withTabBar ? tabBarHeight + spacing.xxl : spacing.xxl) + insets.bottom,
  };

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, padding, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, padding, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: screenPadding,
    gap: spacing.xxl,
  },
});
