import { Tabs } from 'expo-router/js-tabs';

import { NeonTabBar } from '@/components/navigation/neon-tab-bar';
import { colors } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <NeonTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="songs" options={{ title: 'Meine Songs' }} />
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoriten' }} />
      <Tabs.Screen name="settings" options={{ title: 'Einstellungen' }} />
    </Tabs>
  );
}
