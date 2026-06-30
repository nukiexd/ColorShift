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

  test('canonicalizes hostile extras and contains synchronous parse or serialization failures', async () => {
    storage.setItem.mockResolvedValue(undefined);
    const session = {
      ...createSession(2),
      unknownBigInt: BigInt(1),
      toJSON: () => { throw new Error('hostile'); },
    };
    let saved!: Promise<boolean>;
    expect(() => { saved = saveState({ ...createDefaultState(), activeSession: session }); }).not.toThrow();
    await expect(saved).resolves.toBe(true);
    const serialized = storage.setItem.mock.calls.at(-1)![1];
    expect(serialized).not.toContain('unknownBigInt');
    expect(JSON.parse(serialized).activeSession).toEqual(createSession(2));

    const hostile: Record<string, unknown> = {};
    Object.defineProperty(hostile, 'version', { get: () => { throw new Error('getter'); } });
    let failed!: Promise<boolean>;
    expect(() => { failed = saveState(hostile); }).not.toThrow();
    await expect(failed).resolves.toBe(false);
    await expect(saveState(createDefaultState())).resolves.toBe(true);
  });

  test('loads after pending writes so a remount cannot hydrate stale state', async () => {
    let stored = JSON.stringify(createDefaultState());
    let releaseWrite!: () => void;
    storage.setItem.mockImplementationOnce((_key, value) => new Promise<void>((resolve) => {
      releaseWrite = () => { stored = value; resolve(); };
    }));
    storage.getItem.mockImplementation(async () => stored);
    const latest = { ...createDefaultState(), profile: { ...createDefaultState().profile, nickname: 'Лиса' } };
    const pendingSave = saveState(latest);
    const concurrentLoad = loadState();
    for (let turn = 0; turn < 4 && !releaseWrite; turn += 1) await Promise.resolve();
    expect(releaseWrite).toBeDefined();
    expect(storage.getItem).not.toHaveBeenCalled();
    releaseWrite();
    await expect(pendingSave).resolves.toBe(true);
    await expect(concurrentLoad).resolves.toMatchObject({ profile: { nickname: 'Лиса' } });
    expect(JSON.parse(stored)).toMatchObject({ profile: { nickname: 'Лиса' } });
  });

  test('serializes writes so a delayed older state cannot overwrite the latest state', async () => {
    let releaseFirst!: () => void;
    storage.setItem
      .mockImplementationOnce(() => new Promise<void>((resolve) => { releaseFirst = resolve; }))
      .mockResolvedValueOnce(undefined);
    const first = saveState({ ...createDefaultState(), profile: { ...createDefaultState().profile, nickname: 'Первый' } });
    const second = saveState({ ...createDefaultState(), profile: { ...createDefaultState().profile, nickname: 'Второй' } });
    await Promise.resolve();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    releaseFirst();
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(storage.setItem.mock.calls.map((call) => JSON.parse(call[1]).profile.nickname)).toEqual(['Первый', 'Второй']);
  });
});
