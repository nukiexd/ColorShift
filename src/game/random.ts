import { StatefulRandomSource, StatefulTileIdSource } from './model';
import { MAX_TILE_ID_COUNTER } from './balance';

export function createSeededRandom(seed: number): StatefulRandomSource {
  let state = seed >>> 0;

  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    getState: () => state,
  };
}

export function createTileIdSource(start = 0, namespace = 'refill'): StatefulTileIdSource {
  if (!Number.isSafeInteger(start) || start < 0 || start >= MAX_TILE_ID_COUNTER) {
    throw new RangeError(`TileIdSource start must be an integer in [0, ${MAX_TILE_ID_COUNTER}); received ${start}`);
  }
  let counter = start;
  return {
    namespace,
    next: () => {
      if (counter >= MAX_TILE_ID_COUNTER) {
        throw new RangeError(`TileIdSource counter exhausted at ${MAX_TILE_ID_COUNTER}`);
      }
      return `${namespace}-${counter++}`;
    },
    getCounter: () => counter,
  };
}
