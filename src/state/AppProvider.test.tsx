import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';
import { AppProvider, useApp } from './AppProvider';
import { createDefaultState } from '../storage/schema';
import { commitMove, createSession, tileIdNamespaceFor, xpForScore } from '../game/session';
import { MAX_SCORE, MAX_SESSION_EPOCH, MAX_TILE_ID_COUNTER } from '../game/balance';
import { findLegalMoves } from '../game/board';

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
    expect(original!.tileIdNamespace).toBe(`cs2-${original!.sessionId}-g0`);
    await act(() => { result.current.startGame(); });
    expect(result.current.activeSession).toBe(original);
    await act(() => { expect(result.current.updateNickname('x')).toBe(false); });
    expect(result.current.profile.nickname).toBe('Игрок');

    const [from, to] = findLegalMoves(original!.board)[0];
    const advanced = commitMove(original!, from, to);
    await act(() => { expect(result.current.settleSession(advanced, from, to)).toBe(true); });
    let finish!: ReturnType<typeof result.current.finishGame>;
    await act(() => { finish = result.current.finishGame(); });
    expect(finish).toMatchObject({
      xpEarned: xpForScore(advanced.score),
      result: {
        score: advanced.score,
        bestCascade: advanced.bestCascade,
        clearedTiles: advanced.clearedTiles,
        isNewBest: true,
      },
    });
    expect(result.current.activeSession).toBeNull();
    expect(result.current.profile).toMatchObject({ xp: xpForScore(advanced.score), bestScore: advanced.score });
    await waitFor(() => {
      const saved = JSON.parse(storage.setItem.mock.calls.at(-1)![1]);
      expect(saved).toMatchObject({
        profile: { xp: xpForScore(advanced.score), bestScore: advanced.score },
        activeSession: null,
      });
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
    const [firstFrom, firstTo] = findLegalMoves(first.board)[0];
    await act(() => {
      expect(result.current.settleSession({ ...first, phase: 'clearing' }, firstFrom, firstTo)).toBe(false);
    });
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

  test('linearizes settlement and finish in the same event-loop turn', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const current = result.current.activeSession!;
    const [from, to] = findLegalMoves(current.board)[0];
    const settled = commitMove(current, from, to);
    let outcome!: ReturnType<typeof result.current.finishGame>;
    await act(() => {
      expect(result.current.settleSession(settled, from, to)).toBe(true);
      outcome = result.current.finishGame();
    });
    expect(outcome).toMatchObject({
      result: {
        score: settled.score,
        bestCascade: settled.bestCascade,
        clearedTiles: settled.clearedTiles,
      },
    });
    expect(result.current.activeSession).toBeNull();
    expect(result.current.profile.bestScore).toBe(settled.score);
  });

  test('linearizes pause and continue in the same event-loop turn', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    let continued!: ReturnType<typeof result.current.continueGame>;
    await act(() => {
      result.current.pauseGame();
      continued = result.current.continueGame();
    });
    expect(continued?.phase).toBe('idle');
    expect(result.current.activeSession?.phase).toBe('idle');
  });

  test('rejects a stale settlement after the session has been replaced', async () => {
    const seedFactory = jest.fn().mockReturnValue(7);
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={seedFactory}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const stale = result.current.activeSession!;
    await act(() => { result.current.discardAndStart(); });
    const replacement = result.current.activeSession!;
    expect(replacement.sessionId).not.toBe(stale.sessionId);
    const [from, to] = findLegalMoves(stale.board)[0];
    const staleResult = commitMove(stale, from, to);
    await act(() => { expect(result.current.settleSession(staleResult, from, to)).toBe(false); });
    expect(result.current.activeSession).toBe(replacement);
  });

  test('rejects malformed same-session settlements without damaging profile or persistence', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const original = result.current.activeSession!;
    await act(() => { expect(result.current.updateNickname('Лиса')).toBe(true); });
    const [from, to] = findLegalMoves(original.board)[0];
    const exact = commitMove(original, from, to);
    const matchedBoard = original.board.map((row) => row.map((tile) => ({ ...tile! })));
    matchedBoard[0][0].color = 'coral';
    matchedBoard[0][1].color = 'coral';
    matchedBoard[0][2].color = 'coral';
    const candidates = [
      { ...original, score: Number.NaN },
      { ...original, score: MAX_SCORE + 1 },
      { ...original, board: matchedBoard },
      { ...original, tileIdNamespace: `${original.tileIdNamespace}-wrong` },
    ];
    for (const candidate of candidates) {
      await act(() => { expect(result.current.settleSession(candidate, from, to)).toBe(false); });
      expect(result.current.activeSession).toBe(original);
    }
    const hostile = { ...original };
    Object.defineProperty(hostile, 'score', { get: () => { throw new Error('hostile'); } });
    await act(() => { expect(result.current.settleSession(hostile, from, to)).toBe(false); });
    expect(result.current.activeSession).toBe(original);
    await act(() => { expect(result.current.settleSession(exact, from, to)).toBe(true); });
    await act(() => { result.current.finishGame(); });
    expect(result.current.profile).toMatchObject({ nickname: 'Лиса', bestScore: exact.score });
    await waitFor(() => {
      const saved = JSON.parse(storage.setItem.mock.calls.at(-1)![1]);
      expect(saved.profile).toMatchObject({ nickname: 'Лиса', bestScore: exact.score });
    });
  });

  test('accepts only the exact deterministic transition for supplied coordinates', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 0}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const base = result.current.activeSession!;
    const moves = findLegalMoves(base.board);
    const [from, to] = moves[0];
    const exact = commitMove(base, from, to);
    const [otherFrom, otherTo] = moves[1];
    const sibling = commitMove(base, otherFrom, otherTo);
    const forgedGeneration = exact.tileIdGeneration + 1;
    const forgedSessionId = `${exact.sessionId}-forged`;
    const forgeries = [
      { ...exact, score: exact.score + 100 },
      { ...exact, bestCascade: exact.bestCascade + 1 },
      { ...exact, clearedTiles: exact.clearedTiles + 1 },
      { ...exact, board: sibling.board },
      { ...exact, randomState: (exact.randomState + 1) >>> 0 },
      { ...exact, tileIdCounter: exact.tileIdCounter + 1 },
      {
        ...exact,
        tileIdGeneration: forgedGeneration,
        tileIdCounter: 0,
        tileIdNamespace: tileIdNamespaceFor(exact.sessionId, forgedGeneration),
      },
      {
        ...exact,
        sessionId: forgedSessionId,
        tileIdNamespace: tileIdNamespaceFor(forgedSessionId, exact.tileIdGeneration),
      },
      { ...exact, phase: 'paused' as const },
    ];
    for (const forged of forgeries) {
      await act(() => { expect(result.current.settleSession(forged, from, to)).toBe(false); });
      expect(result.current.activeSession).toEqual(base);
    }
    await act(() => { expect(result.current.settleSession(exact, from, to)).toBe(true); });
    expect(result.current.activeSession).toEqual(exact);
  });

  test('invalidates settlements computed before pause even after resume', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const base = result.current.activeSession!;
    const [from, to] = findLegalMoves(base.board)[0];
    const late = commitMove(base, from, to);
    await act(() => { result.current.pauseGame(); });
    await act(() => { expect(result.current.settleSession(late, from, to)).toBe(false); });
    await act(() => { result.current.resumeGame(); });
    await act(() => { expect(result.current.settleSession(late, from, to)).toBe(false); });
    const resumed = result.current.activeSession!;
    const [resumedFrom, resumedTo] = findLegalMoves(resumed.board)[0];
    const current = commitMove(resumed, resumedFrom, resumedTo);
    await act(() => { expect(result.current.settleSession(current, resumedFrom, resumedTo)).toBe(true); });
  });

  test('does not overflow the causal epoch at its terminal bound', async () => {
    expect(MAX_SESSION_EPOCH).toBeDefined();
    const terminal = { ...createSession(2), sessionEpoch: MAX_SESSION_EPOCH };
    storage.getItem.mockResolvedValueOnce(JSON.stringify({ ...createDefaultState(), activeSession: terminal }));
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.pauseGame(); });
    expect(result.current.activeSession).toMatchObject({ phase: 'idle', sessionEpoch: MAX_SESSION_EPOCH });
  });

  test('accepts only the first of two competing sibling settlements', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 0}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const base = result.current.activeSession!;
    const siblings = findLegalMoves(base.board).map(([from, to]) => ({ from, to, session: commitMove(base, from, to) }));
    const lower = siblings.find((candidate) => siblings.some((other) =>
      other.session.tileIdCounter > candidate.session.tileIdCounter));
    const higher = lower && siblings.find((candidate) =>
      candidate.session.tileIdCounter > lower.session.tileIdCounter);
    expect(lower).toBeDefined();
    expect(higher).toBeDefined();
    let lowerAccepted!: boolean;
    let higherAccepted!: boolean;
    await act(() => {
      lowerAccepted = result.current.settleSession(lower!.session, lower!.from, lower!.to);
      higherAccepted = result.current.settleSession(higher!.session, higher!.from, higher!.to);
    });
    expect(lowerAccepted).toBe(true);
    expect(higherAccepted).toBe(false);
    expect(result.current.activeSession).toEqual(lower!.session);
  });

  test('requires sequential revisions to be delivered without gaps', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const base = result.current.activeSession!;
    const [firstFrom, firstTo] = findLegalMoves(base.board)[0];
    const revisionOne = commitMove(base, firstFrom, firstTo);
    const [secondFrom, secondTo] = findLegalMoves(revisionOne.board)[0];
    const revisionTwo = commitMove(revisionOne, secondFrom, secondTo);
    await act(() => { expect(result.current.settleSession(revisionTwo, secondFrom, secondTo)).toBe(false); });
    expect(result.current.activeSession).toEqual(base);
    await act(() => { expect(result.current.settleSession(revisionOne, firstFrom, firstTo)).toBe(true); });
    await act(() => { expect(result.current.settleSession(revisionTwo, secondFrom, secondTo)).toBe(true); });
    expect(result.current.activeSession).toEqual(revisionTwo);
  });

  test('rejects a stale pre-rollover snapshot after rollover settles', async () => {
    const base = { ...createSession(2), tileIdCounter: MAX_TILE_ID_COUNTER - 1 };
    storage.getItem.mockResolvedValueOnce(JSON.stringify({ ...createDefaultState(), activeSession: base }));
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    const [from, to] = findLegalMoves(base.board)[0];
    const rolled = commitMove(base, from, to);
    await act(() => { expect(result.current.settleSession(rolled, from, to)).toBe(true); });
    await act(() => { expect(result.current.settleSession(base, from, to)).toBe(false); });
    expect(result.current.activeSession).toEqual(rolled);
  });

  test('rejects older, equal-modified, and legacy-reset snapshots of the active session', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={() => 7}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(() => { result.current.startGame(); });
    const original = result.current.activeSession!;
    const [from, to] = findLegalMoves(original.board)[0];
    const newer = commitMove(original, from, to);
    await act(() => { expect(result.current.settleSession(newer, from, to)).toBe(true); });
    expect(result.current.activeSession).toEqual(newer);

    const equalModified = { ...newer, score: newer.score + 100 };
    const equalModifiedBoard = { ...newer, board: original.board };
    const {
      tileIdGeneration: _generation,
      sessionEpoch: _epoch,
      sessionRevision: _revision,
      ...legacyReset
    } = {
      ...newer,
      tileIdNamespace: 'session-7',
    };
    for (const stale of [original, equalModified, equalModifiedBoard, legacyReset]) {
      await act(() => { expect(result.current.settleSession(stale as typeof newer, from, to)).toBe(false); });
      expect(result.current.activeSession).toEqual(newer);
    }
    expect(result.current.activeSession).toMatchObject({
      sessionRevision: newer.sessionRevision,
      randomState: newer.randomState,
      tileIdGeneration: newer.tileIdGeneration,
      tileIdCounter: newer.tileIdCounter,
    });
    await waitFor(() => {
      const saved = JSON.parse(storage.setItem.mock.calls.at(-1)![1]).activeSession;
      expect(saved).toMatchObject({
        sessionRevision: newer.sessionRevision,
        randomState: newer.randomState,
        tileIdGeneration: newer.tileIdGeneration,
        tileIdCounter: newer.tileIdCounter,
      });
    });
  });

  test('blocks every mutation until hydration has completed', async () => {
    let resolveLoad!: (value: string) => void;
    storage.getItem.mockImplementationOnce(() => new Promise<string>((resolve) => { resolveLoad = resolve; }));
    const seedFactory = jest.fn().mockReturnValue(7);
    const wrapper = ({ children }: PropsWithChildren) => <AppProvider seedFactory={seedFactory}>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    expect(result.current.hydrated).toBe(false);
    const candidate = createSession(99);
    await act(() => {
      expect(result.current.startGame()).toBeNull();
      expect(result.current.continueGame()).toBeNull();
      expect(result.current.discardAndStart()).toBeNull();
      expect(result.current.settleSession(candidate, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
      expect(result.current.finishGame()).toBeNull();
      expect(result.current.updateNickname('Лиса')).toBe(false);
      result.current.updateSettings({ effectsVolume: 1, haptics: false });
      result.current.pauseGame();
      result.current.resumeGame();
    });
    expect(seedFactory).not.toHaveBeenCalled();
    expect(result.current.activeSession).toBeNull();
    expect(result.current.profile).toEqual(createDefaultState().profile);
    expect(result.current.settings).toEqual(createDefaultState().settings);

    const loaded = { ...createDefaultState(), profile: { ...createDefaultState().profile, nickname: 'Лиса' } };
    await act(async () => { resolveLoad(JSON.stringify(loaded)); });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.profile.nickname).toBe('Лиса');
  });
});
