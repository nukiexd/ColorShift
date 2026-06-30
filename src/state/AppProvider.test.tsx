import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';
import { AppProvider, useApp } from './AppProvider';
import { createDefaultState } from '../storage/schema';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AppProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getItem.mockResolvedValue(JSON.stringify(createDefaultState()));
    storage.setItem.mockResolvedValue(undefined);
  });

  test('hydrates, guards replacement, validates updates and finishes atomically', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(() => { result.current.startGame(); });
    const original = result.current.activeSession;
    expect(original).not.toBeNull();
    await act(() => { result.current.startGame(); });
    expect(result.current.activeSession).toBe(original);
    await act(() => { expect(result.current.updateNickname('x')).toBe(false); });
    expect(result.current.profile.nickname).toBe('Игрок');

    await act(() => { result.current.settleSession({ ...original!, score: 1000, bestCascade: 2, clearedTiles: 9 }); });
    let finish!: ReturnType<typeof result.current.finishGame>;
    await act(() => { finish = result.current.finishGame(); });
    expect(finish).toMatchObject({ xpEarned: 10, result: { score: 1000, bestCascade: 2, clearedTiles: 9, isNewBest: true } });
    expect(result.current.activeSession).toBeNull();
    expect(result.current.profile).toMatchObject({ xp: 10, bestScore: 1000 });
    await waitFor(() => {
      const saved = JSON.parse(storage.setItem.mock.calls.at(-1)![1]);
      expect(saved).toMatchObject({ profile: { xp: 10, bestScore: 1000 }, activeSession: null });
    });
  });

  test('serializes two synchronous starts into one session and one seed', async () => {
    const seedFactory = jest.fn().mockReturnValueOnce(7).mockReturnValueOnce(8);
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={seedFactory}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    let first;
    let second;
    await act(() => {
      first = result.current.startGame();
      second = result.current.startGame();
    });
    expect(second).toBe(first);
    expect(seedFactory).toHaveBeenCalledTimes(1);
    expect(result.current.activeSession).toBe(first);
  });

  test('supports continuation, replacement, pause/resume and rejects unstable settlement', async () => {
    const seedFactory = jest.fn().mockReturnValueOnce(7).mockReturnValueOnce(8);
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={seedFactory}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    jest.clearAllMocks();
    let saveCount = 0;
    const expectPersistedPhase = async (phase: 'idle' | 'paused') => {
      await waitFor(() => expect(storage.setItem.mock.calls.length).toBeGreaterThan(saveCount));
      saveCount = storage.setItem.mock.calls.length;
      expect(JSON.parse(storage.setItem.mock.calls.at(-1)![1]).activeSession.phase).toBe(phase);
    };
    await act(() => { result.current.startGame(); });
    await expectPersistedPhase('idle');
    const first = result.current.activeSession!;
    await act(() => { result.current.pauseGame(); });
    expect(result.current.activeSession?.phase).toBe('paused');
    await expectPersistedPhase('paused');
    await act(() => { expect(result.current.continueGame()?.phase).toBe('idle'); });
    expect(result.current.activeSession?.phase).toBe('idle');
    await expectPersistedPhase('idle');
    await act(() => { result.current.pauseGame(); });
    await expectPersistedPhase('paused');
    await act(() => { result.current.resumeGame(); });
    expect(result.current.activeSession?.phase).toBe('idle');
    await expectPersistedPhase('idle');
    await act(() => { expect(result.current.settleSession({ ...first, phase: 'clearing' })).toBe(false); });
    expect(result.current.activeSession?.phase).toBe('idle');
    let replacement;
    await act(() => { replacement = result.current.discardAndStart(); });
    expect(replacement).not.toEqual(first);
    expect(result.current.activeSession).toBe(replacement);
    await expectPersistedPhase('idle');
  });

  test('normalizes profile/settings updates and persists action results', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    jest.clearAllMocks();
    storage.setItem.mockResolvedValue(undefined);
    await act(() => { expect(result.current.updateNickname('  Лисёнок  ')).toBe(true); });
    expect(result.current.profile.nickname).toBe('Лисёнок');
    await act(() => { expect(result.current.updateNickname('x')).toBe(false); });
    expect(result.current.profile.nickname).toBe('Лисёнок');
    await act(() => { expect(result.current.updateNickname('1234567890123456')).toBe(true); });
    await act(() => { expect(result.current.updateNickname('12345678901234567')).toBe(false); });
    expect(result.current.profile.nickname).toBe('1234567890123456');
    await act(() => { result.current.updateSettings({ effectsVolume: 4, haptics: false, reducedMotion: true }); });
    expect(result.current.settings).toEqual({ effectsVolume: 1, haptics: false, reducedMotion: true });
    await act(() => { result.current.updateSettings({ effectsVolume: -2 }); });
    expect(result.current.settings.effectsVolume).toBe(0);
    await waitFor(() => expect(storage.setItem).toHaveBeenCalled());
    const lastSaved = JSON.parse(storage.setItem.mock.calls.at(-1)![1]);
    expect(lastSaved.profile.nickname).toBe('1234567890123456');
    expect(lastSaved.settings).toEqual({ effectsVolume: 0, haptics: false, reducedMotion: true });
  });
});
