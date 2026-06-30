export { BOARD_SIZE } from './balance';

export type TileColor = 'coral' | 'sky' | 'mint' | 'sun' | 'plum';

export type Special = 'row' | 'column' | 'bomb' | 'rainbow' | null;

export interface Coord {
  readonly row: number;
  readonly col: number;
}

export interface Tile {
  readonly id: string;
  readonly color: TileColor;
  readonly special: Special;
}

export type Cell = Tile | null;

export type Board = readonly (readonly Cell[])[];

export interface MatchGroup {
  readonly color: TileColor;
  readonly orientation: 'horizontal' | 'vertical';
  readonly cells: readonly Coord[];
}

export interface RandomSource {
  next(): number;
}
