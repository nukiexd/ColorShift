import { createBoard } from './board';
import { MAX_LEVEL, MAX_SCORE, MAX_XP } from './balance';
import { Board, Coord, TileColor } from './model';
import { createSeededRandom, createTileIdSource } from './random';
import { resolveMove } from './resolve';

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

export function createSession(seed = 0, ordinal = 0): GameSession {
  const random = createSeededRandom(seed);
  const board = createBoard(random);
  const seedId = seed >>> 0;
  const ordinalId = Math.max(0, Math.trunc(ordinal)) >>> 0;
  return {
    sessionId: `session-${seedId}-${ordinalId}`,
    board,
    score: 0,
    bestCascade: 0,
    clearedTiles: 0,
    backgroundColor: null,
    phase: 'idle',
    randomState: random.getState(),
    tileIdCounter: 0,
    tileIdNamespace: `session-${seedId}-${ordinalId}`,
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
  return Math.floor(10 * Math.sqrt(Math.min(Math.trunc(score), MAX_SCORE) / 1000));
}

export function xpRequiredForLevel(level: number): number {
  return 100 + 20 * (Math.min(MAX_LEVEL, Math.max(1, Math.trunc(level))) - 1);
}

export function applyXp(progress: LevelProgress, earned: number): LevelProgress {
  const normalized = normalizeProgress(progress);
  if (!Number.isFinite(earned) || earned <= 0) return normalized;

  let level = normalized.level;
  let xp = normalized.xp + Math.min(Math.trunc(earned), MAX_XP);
  while (level < MAX_LEVEL && xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, xp: Math.min(xp, MAX_XP) };
  }
  return { level, xp };
}

function normalizeProgress(progress: LevelProgress): LevelProgress {
  const level = Number.isFinite(progress.level) ? Math.min(MAX_LEVEL, Math.max(1, Math.trunc(progress.level))) : 1;
  const xp = Number.isFinite(progress.xp) ? Math.min(MAX_XP, Math.max(0, Math.trunc(progress.xp))) : 0;
  return { level, xp };
}
