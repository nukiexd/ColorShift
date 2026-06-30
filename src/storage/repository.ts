import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDefaultState, parsePersistedState, PersistedState } from './schema';

export const STORAGE_KEY = 'color-shift/state/v1';
let writeQueue: Promise<void> = Promise.resolve();

export async function loadState(): Promise<PersistedState> {
  try {
    await writeQueue;
    const serialized = await AsyncStorage.getItem(STORAGE_KEY);
    if (serialized === null) return createDefaultState();
    return parsePersistedState(JSON.parse(serialized));
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: unknown): Promise<boolean> {
  let serialized: string | null = null;
  try {
    serialized = JSON.stringify(parsePersistedState(state));
  } catch {
    // The queued false result keeps ordering intact without exposing a synchronous throw.
  }
  const write = writeQueue.then(async () => {
    if (serialized === null) return false;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch {
      return false;
    }
  });
  writeQueue = write.then(() => undefined, () => undefined);
  return write;
}
