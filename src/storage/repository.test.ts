import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSession } from '../game/session';
import { loadState, saveState, STORAGE_KEY } from './repository';
import { createDefaultState } from './schema';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('state repository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('loads safe defaults for read and JSON failures', async () => {
    storage.getItem.mockRejectedValueOnce(new Error('offline'));
    await expect(loadState()).resolves.toEqual(createDefaultState());
    storage.getItem.mockResolvedValueOnce('{nope');
    await expect(loadState()).resolves.toEqual(createDefaultState());
  });

  test('uses one key and contains write failures', async () => {
    storage.setItem.mockRejectedValueOnce(new Error('full'));
    await expect(saveState(createDefaultState())).resolves.toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    expect(STORAGE_KEY).toBe('color-shift/state/v1');
  });

  test('persists only idle or paused sessions', async () => {
    storage.setItem.mockResolvedValue(undefined);
    const state = { ...createDefaultState(), activeSession: { ...createSession(9), phase: 'clearing' as const } };
    expect(await saveState(state)).toBe(true);
    const saved = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(saved.activeSession).toBeNull();
  });
});
