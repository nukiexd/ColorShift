import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDefaultState, parsePersistedState, PersistedState } from './schema';

export const STORAGE_KEY = 'color-shift/state/v1';

let saveQueue = Promise.resolve();

export async function loadState(): Promise<PersistedState> {
  try {
    const serialized = await AsyncStorage.getItem(STORAGE_KEY);
    if (serialized === null) return createDefaultState();
    return parsePersistedState(JSON.parse(serialized));
  } catch {
    return createDefaultState();
  }
}

export async function saveState(state: unknown): Promise<boolean> {
  const write = saveQueue.then(async () => {
    try {
      const safe = parsePersistedState(state);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      return true;
    } catch {
      return false;
    }
  });
  saveQueue = write.then(() => undefined, () => undefined);
  return write;
}
