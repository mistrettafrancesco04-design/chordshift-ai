import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';

import { haptics } from '@/lib/haptics';

import {
  captureSheetWithCamera,
  PermissionDeniedError,
  pickSheetFromFiles,
  pickSheetFromLibrary,
} from './services/image-import';
import { useStudioStore } from './studio-store';
import type { SheetOrigin, SheetSource } from './types';

const importers: Record<SheetOrigin, () => Promise<SheetSource | null>> = {
  camera: captureSheetWithCamera,
  library: pickSheetFromLibrary,
  file: pickSheetFromFiles,
};

/**
 * Shared import flow for Home and Studio: pick → load into the studio → open the studio.
 * Handles cancellation, permission denial and unexpected errors.
 */
export function useSheetImport() {
  const [busy, setBusy] = useState<SheetOrigin | null>(null);
  const loadSource = useStudioStore((s) => s.loadSource);

  async function importSheet(origin: SheetOrigin) {
    if (busy) return;
    setBusy(origin);
    try {
      const source = await importers[origin]();
      if (!source) return;
      loadSource(source);
      haptics.success();
      router.navigate('/studio');
    } catch (error) {
      haptics.error();
      if (error instanceof PermissionDeniedError) {
        Alert.alert(
          error.message,
          'Du kannst den Zugriff in den Systemeinstellungen erlauben.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() },
          ],
        );
      } else {
        Alert.alert('Import fehlgeschlagen', error instanceof Error ? error.message : String(error));
      }
    } finally {
      setBusy(null);
    }
  }

  return { importSheet, busy };
}
