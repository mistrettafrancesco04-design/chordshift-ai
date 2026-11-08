import { router } from 'expo-router';

import { EmptyState, NeonButton, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen withTabBar={false} scroll={false} contentStyle={{ justifyContent: 'center' }}>
      <EmptyState
        icon="compass-outline"
        title="Seite nicht gefunden"
        message="Diese Ansicht existiert nicht (mehr)."
        action={<NeonButton label="Zum Dashboard" icon="planet" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
