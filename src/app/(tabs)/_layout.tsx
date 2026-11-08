import { Tabs } from 'expo-router/js-tabs';

import { NeonTabBar } from '@/components/navigation/neon-tab-bar';
import { colors } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <NeonTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Bibliothek' }} />
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="lab" options={{ title: 'Chord Lab' }} />
      <Tabs.Screen name="settings" options={{ title: 'Optionen' }} />
    </Tabs>
  );
}
