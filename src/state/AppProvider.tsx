import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { advanceSessionEpoch, applyXp, areGameSessionsEqual, commitMove, createSession, GameSession, xpForScore } from '../game/session';
import { Coord } from '../game/model';
import { loadState, saveState } from '../storage/repository';
import {
  clampVolume,
  createDefaultState,
  normalizeNickname,
  parseGameSession,
  PersistedState,
  Profile,
  Settings,
} from '../storage/schema';

export interface GameResult {
  readonly score: number;
  readonly bestCascade: number;
  readonly clearedTiles: number;
  readonly isNewBest: boolean;
}

export interface FinishOutcome {
  readonly xpEarned: number;
  readonly result: GameResult;
}

export interface AppContextValue {
  readonly loading: boolean;
  readonly hydrated: boolean;
  readonly profile: Profile;
  readonly settings: Settings;
  readonly activeSession: GameSession | null;
  startGame(): GameSession | null;
  continueGame(): GameSession | null;
  settleSession(session: GameSession, from: Coord, to: Coord): boolean;
  finishGame(): FinishOutcome | null;
  discardAndStart(): GameSession | null;
  updateNickname(nickname: string): boolean;
  updateSettings(settings: Partial<Settings>): void;
  pauseGame(): void;
  resumeGame(): void;
}

interface AppProviderProps extends PropsWithChildren {
  readonly seedFactory?: () => number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, seedFactory }: AppProviderProps) {
  const [state, setState] = useState<PersistedState>(createDefaultState);
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const nextSeed = useRef(1);
  const providerToken = useId();
  const nextSessionIdentity = useRef(1);
  const commitState = useCallback((next: PersistedState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadState().then((loaded) => {
      if (!mounted) return;
      commitState(loaded);
      hydratedRef.current = true;
      setHydrated(true);
    });
    return () => { mounted = false; };
  }, [commitState]);

  useEffect(() => {
    if (hydrated) void saveState(state);
  }, [hydrated, state]);

  const makeSession = useCallback(() => {
    const seed = seedFactory ? seedFactory() : nextSeed.current++;
    const sessionId = `session-${seed >>> 0}-${providerToken}-${nextSessionIdentity.current}`;
    nextSessionIdentity.current += 1;
    return createSession(seed, sessionId);
  }, [providerToken, seedFactory]);

  const startGame = useCallback(() => {
    if (!hydratedRef.current) return null;
    if (stateRef.current.activeSession) return stateRef.current.activeSession;
    const session = makeSession();
    const next = { ...stateRef.current, activeSession: session };
    commitState(next);
    return session;
  }, [commitState, makeSession]);

  const discardAndStart = useCallback(() => {
    if (!hydratedRef.current) return null;
    const session = makeSession();
    const next = { ...stateRef.current, activeSession: session };
    commitState(next);
    return session;
  }, [commitState, makeSession]);

  const continueGame = useCallback(() => {
    if (!hydratedRef.current) return null;
    const session = stateRef.current.activeSession;
    if (!session) return null;
    if (session.phase !== 'paused') return session;
    const resumed = advanceSessionEpoch(session, 'idle');
    if (resumed === session) return session;
    commitState({ ...stateRef.current, activeSession: resumed });
    return resumed;
  }, [commitState]);

  const settleSession = useCallback((session: GameSession, from: Coord, to: Coord) => {
    if (!hydratedRef.current) return false;
    let safeSession: GameSession | null;
    try {
      safeSession = parseGameSession(session);
    } catch {
      return false;
    }
    const currentSession = stateRef.current.activeSession;
    if (!safeSession || currentSession?.phase !== 'idle') return false;
    const expected = commitMove(currentSession, from, to);
    if (expected === currentSession || !areGameSessionsEqual(safeSession, expected)) return false;
    commitState({ ...stateRef.current, activeSession: expected });
    return true;
  }, [commitState]);

  const finishGame = useCallback((): FinishOutcome | null => {
    if (!hydratedRef.current) return null;
    const current = stateRef.current;
    const session = current.activeSession;
    if (!session || (session.phase !== 'idle' && session.phase !== 'paused')) return null;
    const xpEarned = xpForScore(session.score);
    const result: GameResult = {
      score: session.score,
      bestCascade: session.bestCascade,
      clearedTiles: session.clearedTiles,
      isNewBest: session.score > current.profile.bestScore,
    };
    const progress = applyXp(current.profile, xpEarned);
    commitState({
      ...current,
      profile: { ...current.profile, ...progress, bestScore: Math.max(current.profile.bestScore, session.score) },
      activeSession: null,
    });
    return { xpEarned, result };
  }, [commitState]);

  const updateNickname = useCallback((nickname: string) => {
    if (!hydratedRef.current) return false;
    const normalized = normalizeNickname(nickname);
    if (!normalized) return false;
    const current = stateRef.current;
    commitState({ ...current, profile: { ...current.profile, nickname: normalized } });
    return true;
  }, [commitState]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    if (!hydratedRef.current) return;
    const current = stateRef.current;
    commitState({
      ...current,
      settings: {
        effectsVolume: updates.effectsVolume === undefined ? current.settings.effectsVolume : clampVolume(updates.effectsVolume),
        haptics: typeof updates.haptics === 'boolean' ? updates.haptics : current.settings.haptics,
        reducedMotion: typeof updates.reducedMotion === 'boolean' ? updates.reducedMotion : current.settings.reducedMotion,
      },
    });
  }, [commitState]);

  const pauseGame = useCallback(() => {
    if (!hydratedRef.current || stateRef.current.activeSession?.phase !== 'idle') return;
    const paused = advanceSessionEpoch(stateRef.current.activeSession, 'paused');
    if (paused !== stateRef.current.activeSession) commitState({ ...stateRef.current, activeSession: paused });
  }, [commitState]);
  const resumeGame = useCallback(() => {
    if (!hydratedRef.current || stateRef.current.activeSession?.phase !== 'paused') return;
    const resumed = advanceSessionEpoch(stateRef.current.activeSession, 'idle');
    if (resumed !== stateRef.current.activeSession) commitState({ ...stateRef.current, activeSession: resumed });
  }, [commitState]);

  const value = useMemo<AppContextValue>(() => ({
    loading: !hydrated,
    hydrated,
    profile: state.profile,
    settings: state.settings,
    activeSession: state.activeSession,
    startGame,
    continueGame,
    settleSession,
    finishGame,
    discardAndStart,
    updateNickname,
    updateSettings,
    pauseGame,
    resumeGame,
  }), [hydrated, state, startGame, continueGame, settleSession, finishGame, discardAndStart, updateNickname, updateSettings, pauseGame, resumeGame]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
