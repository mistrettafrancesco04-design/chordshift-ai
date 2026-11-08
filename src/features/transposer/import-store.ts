import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';
import { create } from 'zustand';

import { notify } from '@/lib/dialog';
import { haptics } from '@/lib/haptics';

import {
  captureSheetWithCamera,
  PermissionDeniedError,
  pickSheetFromFiles,
  pickSheetFromLibrary,
  pickSheetPdf,
} from './services/image-import';
import { useStudioStore } from './studio-store';
import type { AnalysisProgress, SheetOrigin, SheetSource } from './types';

interface ImportState {
  busy: SheetOrigin | null;
  progress: AnalysisProgress | null;
  importSheet: (origin: SheetOrigin) => Promise<void>;
}

type Importer = (onProgress: (p: { value: number; label?: string }) => void) => Promise<SheetSource | null>;

const importers: Record<SheetOrigin, Importer> = {
  camera: () => captureSheetWithCamera(),
  library: () => pickSheetFromLibrary(),
  pdf: (onProgress) => pickSheetPdf(onProgress),
  file: (onProgress) => pickSheetFromFiles(onProgress),
};

/**
 * Global import flow (used by Home and Studio): pick → render (PDF) → load into the
 * studio → open the studio. Progress is shown by <ImportOverlay/>.
 */
export const useImportStore = create<ImportState>()((set, get) => ({
  busy: null,
  progress: null,

  importSheet: async (origin) => {
    if (get().busy) return;
    set({ busy: origin, progress: null });
    try {
      const source = await importers[origin]((p) =>
        set({ progress: { value: p.value, label: p.label ?? 'PDF wird gerendert' } }),
      );
      if (!source) return;
      useStudioStore.getState().loadSource(source);
      haptics.success();
      router.navigate('/studio');
    } catch (error) {
      haptics.error();
      if (error instanceof PermissionDeniedError) {
        Alert.alert(error.message, 'Du kannst den Zugriff in den Systemeinstellungen erlauben.', [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() },
        ]);
      } else {
        notify('Import fehlgeschlagen', error instanceof Error ? error.message : String(error));
      }
    } finally {
      set({ busy: null, progress: null });
    }
  },
}));
