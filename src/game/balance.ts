import type { TileColor } from './model';

export const BOARD_SIZE = 6;
export const MAX_BOARD_GENERATION_ATTEMPTS = 200;
export const MAX_SCORE = 1_000_000_000;
export const MAX_SESSION_EPOCH = 1_000_000_000;
export const MAX_SESSION_REVISION = 1_000_000_000;
export const MAX_LEVEL = 10_000;
export const MAX_XP = 100 + 20 * (MAX_LEVEL - 1) - 1;
export const MAX_TILE_ID_COUNTER = 1_000_000_000;
export const MAX_TILE_ID_GENERATION = 1_000_000_000;
export const MAX_CASCADES = 200;
export const MAX_TILE_IDS_PER_MOVE = BOARD_SIZE * BOARD_SIZE * (MAX_CASCADES + 1);
export const MAX_TILE_ID_NAMESPACE_LENGTH = 64;
export const MAX_SESSION_ID_LENGTH = MAX_TILE_ID_NAMESPACE_LENGTH - 'cs2-'.length - '-g'.length
  - String(MAX_TILE_ID_GENERATION).length;

export const TILE_COLORS: readonly TileColor[] = ['coral', 'sky', 'mint', 'sun', 'plum'];
