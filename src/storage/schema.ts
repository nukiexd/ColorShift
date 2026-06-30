import { BOARD_SIZE, MAX_LEVEL, MAX_SCORE, MAX_TILE_ID_COUNTER, MAX_XP, TILE_COLORS } from '../game/balance';
import { GameSession } from '../game/session';
import { Special, TileColor } from '../game/model';
import { findLegalMoves } from '../game/board';
import { findMatches } from '../game/matches';

export interface Profile {
  readonly nickname: string;
  readonly level: number;
  readonly xp: number;
  readonly bestScore: number;
}

export interface Settings {
  readonly effectsVolume: number;
  readonly haptics: boolean;
  readonly reducedMotion: boolean;
}

export interface PersistedState {
  readonly version: 1;
  readonly profile: Profile;
  readonly settings: Settings;
  readonly activeSession: GameSession | null;
}

export const DEFAULT_PROFILE: Profile = { nickname: 'Игрок', level: 1, xp: 0, bestScore: 0 };
export const DEFAULT_SETTINGS: Settings = { effectsVolume: 0.35, haptics: true, reducedMotion: false };

export function createDefaultState(): PersistedState {
  return { version: 1, profile: { ...DEFAULT_PROFILE }, settings: { ...DEFAULT_SETTINGS }, activeSession: null };
}

export function parsePersistedState(value: unknown): PersistedState {
  if (!isRecord(value) || value.version !== 1) return createDefaultState();
  return {
    version: 1,
    profile: parseProfile(value.profile) ?? { ...DEFAULT_PROFILE },
    settings: parseSettings(value.settings) ?? { ...DEFAULT_SETTINGS },
    activeSession: value.activeSession === null ? null : parseSession(value.activeSession),
  };
}

export function normalizeNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  return trimmed.length >= 2 && trimmed.length <= 16 ? trimmed : null;
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.effectsVolume;
  return Math.min(1, Math.max(0, value));
}

function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value) || typeof value.nickname !== 'string') return null;
  const nickname = normalizeNickname(value.nickname);
  if (!nickname || !isBoundedInteger(value.level, 1, MAX_LEVEL) || !isBoundedInteger(value.xp, 0, MAX_XP)
    || !isBoundedInteger(value.bestScore, 0, MAX_SCORE)) return null;
  return { nickname, level: value.level, xp: value.xp, bestScore: value.bestScore };
}

function parseSettings(value: unknown): Settings | null {
  if (!isRecord(value) || typeof value.effectsVolume !== 'number' || !Number.isFinite(value.effectsVolume)
    || value.effectsVolume < 0 || value.effectsVolume > 1 || typeof value.haptics !== 'boolean' || typeof value.reducedMotion !== 'boolean') return null;
  return { effectsVolume: value.effectsVolume, haptics: value.haptics, reducedMotion: value.reducedMotion };
}

function parseSession(value: unknown): GameSession | null {
  if (!isRecord(value) || (value.phase !== 'idle' && value.phase !== 'paused') || !isBoard(value.board)
    || typeof value.sessionId !== 'string' || value.sessionId.length === 0 || value.sessionId.length > 64
    || !isBoundedInteger(value.score, 0, MAX_SCORE) || !isBoundedInteger(value.bestCascade, 0, MAX_SCORE)
    || !isBoundedInteger(value.clearedTiles, 0, MAX_SCORE)
    || (value.backgroundColor !== null && !isTileColor(value.backgroundColor))
    || !isUint32(value.randomState) || !isBoundedInteger(value.tileIdCounter, 0, MAX_TILE_ID_COUNTER - 1)
    || typeof value.tileIdNamespace !== 'string' || value.tileIdNamespace.length === 0 || value.tileIdNamespace.length > 64
    || findMatches(value.board as unknown as GameSession['board']).length > 0
    || findLegalMoves(value.board as unknown as GameSession['board']).length === 0) return null;
  return value as unknown as GameSession;
}

function isBoard(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== BOARD_SIZE) return false;
  const ids = new Set<string>();
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return false;
    for (const cell of row) {
      if (!isRecord(cell) || typeof cell.id !== 'string' || cell.id.length === 0 || cell.id.length > 128 || ids.has(cell.id)
        || !isTileColor(cell.color) || !isSpecial(cell.special)) return false;
      ids.add(cell.id);
    }
  }
  return true;
}

function isTileColor(value: unknown): value is TileColor {
  return typeof value === 'string' && (TILE_COLORS as readonly string[]).includes(value);
}

function isSpecial(value: unknown): value is Special {
  return value === null || value === 'row' || value === 'column' || value === 'bomb' || value === 'rainbow';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isBoundedInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function isUint32(value: unknown): value is number {
  return isNonnegativeInteger(value) && value <= 0xffffffff;
}
