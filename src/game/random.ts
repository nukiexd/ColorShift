import { StatefulRandomSource, StatefulTileIdSource } from './model';

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
  let counter = start;
  return { namespace, next: () => `${namespace}-${counter++}`, getCounter: () => counter };
}
