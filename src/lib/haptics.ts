import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/features/settings/settings-store';

/**
 * Thin wrapper so every component triggers haptics the same way and respects
 * the user's setting. Never throws – haptics are a nice-to-have.
 */
function enabled() {
  return Platform.OS !== 'web' && useSettingsStore.getState().hapticsEnabled;
}

export const haptics = {
  selection() {
    if (enabled()) Haptics.selectionAsync().catch(() => {});
  },
  light() {
    if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium() {
    if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  success() {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error() {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
