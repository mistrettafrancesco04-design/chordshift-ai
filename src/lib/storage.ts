import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Shared persistent storage adapter for all zustand stores. */
export const persistStorage = createJSONStorage(() => AsyncStorage);

/** Namespaced storage keys – bump the version suffix on breaking schema changes. */
export const storageKeys = {
  settings: 'chordshift.settings.v1',
  library: 'chordshift.library.v1',
} as const;
