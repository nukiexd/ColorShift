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
  });
});
