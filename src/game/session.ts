import { createBoard } from './board';
import { Board, Coord, TileColor } from './model';
import { createSeededRandom, createTileIdSource } from './random';
import { resolveMove } from './resolve';
import { MAX_LEVEL, MAX_SCORE, MAX_XP } from './balance';

export type SessionPhase = 'idle' | 'preview' | 'swapping' | 'clearing' | 'falling' | 'shuffling' | 'paused';

export interface GameSession {
  readonly sessionId: string;
  readonly board: Board;
  readonly score: number;
  readonly bestCascade: number;
  readonly clearedTiles: number;
  readonly backgroundColor: TileColor | null;
  readonly phase: SessionPhase;
  readonly randomState: number;
  readonly tileIdCounter: number;
  readonly tileIdNamespace: string;
}

export interface LevelProgress {
  readonly level: number;
  readonly xp: number;
}

export function createSession(seed = 0): GameSession {
  const random = createSeededRandom(seed);
  const board = createBoard(random);
  return {
    sessionId: `session-${seed >>> 0}`,
    board,
    score: 0,
    bestCascade: 0,
    clearedTiles: 0,
    backgroundColor: null,
    phase: 'idle',
    randomState: random.getState(),
    tileIdCounter: 0,
    tileIdNamespace: `session-${seed >>> 0}`,
  };
}

export function commitMove(session: GameSession, from: Coord, to: Coord): GameSession {
  if (session.phase !== 'idle') return session;
  const random = createSeededRandom(session.randomState);
  const tileIds = createTileIdSource(session.tileIdCounter, session.tileIdNamespace);
  const resolution = resolveMove(session.board, from, to, random, tileIds);
  if (!resolution.accepted) return session;
  const lastPhase = resolution.phases.at(-1);
  return {
    ...session,
    board: resolution.board,
    score: session.score + resolution.scoreDelta,
    bestCascade: Math.max(session.bestCascade, ...resolution.phases.map((phase) => phase.cascade)),
    clearedTiles: session.clearedTiles + resolution.phases.reduce((sum, phase) => sum + new Set(phase.cleared.map(({ row, col }) => `${row},${col}`)).size, 0),
    backgroundColor: lastPhase?.backgroundColor ?? session.backgroundColor,
    phase: 'idle',
    randomState: random.getState(),
    tileIdCounter: tileIds.getCounter(),
  };
}

export function xpForScore(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.floor(10 * Math.sqrt(Math.min(MAX_SCORE, score) / 1000));
}

export function xpRequiredForLevel(level: number): number {
  const boundedLevel = Number.isFinite(level) ? Math.min(MAX_LEVEL, Math.max(1, Math.trunc(level))) : 1;
  return 100 + 20 * (boundedLevel - 1);
}

export function applyXp(progress: LevelProgress, earned: number): LevelProgress {
  const level = normalizeInteger(progress.level, 1, MAX_LEVEL, 1);
  const xp = normalizeInteger(progress.xp, 0, Number.MAX_SAFE_INTEGER, 0);
  const earnedXp = normalizeInteger(earned, 0, Number.MAX_SAFE_INTEGER, 0);
  const maximumTotal = cumulativeXpBefore(MAX_LEVEL) + MAX_XP;
  const total = Math.min(maximumTotal, cumulativeXpBefore(level) + xp + earnedXp);
  const solvedLevel = Math.min(MAX_LEVEL, Math.floor((-9 + Math.sqrt(81 + total / 2.5)) / 2) + 1);
  return {
    level: solvedLevel,
    xp: Math.min(MAX_XP, total - cumulativeXpBefore(solvedLevel)),
  };
}

function cumulativeXpBefore(level: number): number {
  const completedLevels = level - 1;
  return 10 * completedLevels * (completedLevels + 9);
}

function normalizeInteger(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}
