import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { colors, glow, gradients, radii, spacing, tabBarHeight } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Icon set per route name. Routes not listed here are hidden from the tab bar. */
const TAB_ICONS: Record<string, { idle: IconName; active: IconName; featured?: boolean }> = {
  index: { idle: 'planet-outline', active: 'planet' },
  library: { idle: 'albums-outline', active: 'albums' },
  studio: { idle: 'pulse-outline', active: 'pulse', featured: true },
  lab: { idle: 'flask-outline', active: 'flask' },
  settings: { idle: 'options-outline', active: 'options' },
};

/** Floating glass tab bar with a raised neon "Studio" action in the centre. */
export function NeonTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bar}>
        {/* Background is clipped separately so the raised Studio button can overflow the bar. */}
        <View style={styles.background}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.solidFill]} />
          )}
        </View>
        <View style={styles.row} role="tablist">
          {state.routes.map((route, index) => {
            const config = TAB_ICONS[route.name];
            if (!config) return null;
            const focused = index === state.index;
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;

            const onPress = () => {
              haptics.selection();
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            };

            if (config.featured) {
              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  style={styles.featuredSlot}>
                  <View style={[styles.featured, glow(colors.primary, focused ? 22 : 14, focused ? 0.8 : 0.5)]}>
                    <LinearGradient
                      colors={gradients.neon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name={config.active} size={26} color={colors.textOnAccent} />
                  </View>
                  <AppText variant="caption" color={focused ? 'primary' : 'textMuted'} style={styles.label}>
                    {label}
                  </AppText>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={styles.tab}>
                <Ionicons
                  name={focused ? config.active : config.idle}
                  size={22}
                  color={focused ? colors.primary : colors.textMuted}
                />
                <AppText variant="caption" color={focused ? 'text' : 'textMuted'} style={styles.label}>
                  {label}
                </AppText>
                {focused && <View style={[styles.indicator, glow(colors.primary, 8, 0.9)]} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
  },
  bar: {
    height: tabBarHeight,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  background: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,12,27,0.55)',
  },
  solidFill: {
    backgroundColor: 'rgba(12,14,32,0.96)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  label: {
    fontSize: 11,
  },
  indicator: {
    position: 'absolute',
    bottom: 6,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  featuredSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  featured: {
    width: 52,
    height: 52,
    marginTop: -26,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
