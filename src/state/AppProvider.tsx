import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { applyXp, createSession, GameSession, xpForScore } from '../game/session';
import { loadState, saveState } from '../storage/repository';
import { clampVolume, createDefaultState, normalizeNickname, PersistedState, Profile, Settings } from '../storage/schema';

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
  settleSession(session: GameSession): boolean;
  finishGame(): FinishOutcome | null;
  discardAndStart(): GameSession;
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
  const [hydrated, setHydrated] = useState(false);
  const nextSeed = useRef(1);

  useEffect(() => {
    let mounted = true;
    void loadState().then((loaded) => {
      if (!mounted) return;
      setState(loaded);
      setHydrated(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (hydrated) void saveState(state);
  }, [hydrated, state]);

  const makeSession = useCallback(() => createSession(seedFactory ? seedFactory() : nextSeed.current++), [seedFactory]);

  const startGame = useCallback(() => {
    if (state.activeSession) return state.activeSession;
    const session = makeSession();
    setState((current) => ({ ...current, activeSession: current.activeSession ?? session }));
    return session;
  }, [makeSession, state.activeSession]);

  const discardAndStart = useCallback(() => {
    const session = makeSession();
    setState((current) => ({ ...current, activeSession: session }));
    return session;
  }, [makeSession]);

  const continueGame = useCallback(() => {
    const session = state.activeSession;
    if (!session) return null;
    if (session.phase === 'paused') setState((current) => current.activeSession ? { ...current, activeSession: { ...current.activeSession, phase: 'idle' } } : current);
    return session.phase === 'paused' ? { ...session, phase: 'idle' as const } : session;
  }, [state.activeSession]);

  const settleSession = useCallback((session: GameSession) => {
    if (session.phase !== 'idle' && session.phase !== 'paused') return false;
    setState((current) => ({ ...current, activeSession: session }));
    return true;
  }, []);

  const finishGame = useCallback((): FinishOutcome | null => {
    const session = state.activeSession;
    if (!session || (session.phase !== 'idle' && session.phase !== 'paused')) return null;
    const xpEarned = xpForScore(session.score);
    const result: GameResult = {
      score: session.score,
      bestCascade: session.bestCascade,
      clearedTiles: session.clearedTiles,
      isNewBest: session.score > state.profile.bestScore,
    };
    const progress = applyXp(state.profile, xpEarned);
    setState((current) => ({
      ...current,
      profile: { ...current.profile, ...progress, bestScore: Math.max(current.profile.bestScore, session.score) },
      activeSession: null,
    }));
    return { xpEarned, result };
  }, [state.activeSession, state.profile]);

  const updateNickname = useCallback((nickname: string) => {
    const normalized = normalizeNickname(nickname);
    if (!normalized) return false;
    setState((current) => ({ ...current, profile: { ...current.profile, nickname: normalized } }));
    return true;
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setState((current) => ({
      ...current,
      settings: {
        effectsVolume: updates.effectsVolume === undefined ? current.settings.effectsVolume : clampVolume(updates.effectsVolume),
        haptics: typeof updates.haptics === 'boolean' ? updates.haptics : current.settings.haptics,
        reducedMotion: typeof updates.reducedMotion === 'boolean' ? updates.reducedMotion : current.settings.reducedMotion,
      },
    }));
  }, []);

  const pauseGame = useCallback(() => setState((current) => current.activeSession?.phase === 'idle'
    ? { ...current, activeSession: { ...current.activeSession, phase: 'paused' } } : current), []);
  const resumeGame = useCallback(() => setState((current) => current.activeSession?.phase === 'paused'
    ? { ...current, activeSession: { ...current.activeSession, phase: 'idle' } } : current), []);

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
