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

export interface TileIdSource {
  next(): string;
}

export interface ClearPhase {
  readonly cascade: number;
  readonly groups: readonly MatchGroup[];
  readonly cleared: readonly Coord[];
  readonly createdSpecial: { readonly coord: Coord; readonly special: Exclude<Special, null> } | null;
  readonly scoreDelta: number;
  readonly backgroundColor: TileColor;
  readonly boardBefore: Board;
  readonly boardAfterClear: Board;
  readonly boardAfterGravity: Board;
  readonly boardAfterRefill: Board;
}

export interface MoveResolution {
  readonly accepted: boolean;
  readonly board: Board;
  readonly phases: readonly ClearPhase[];
  readonly scoreDelta: number;
  readonly shuffled: boolean;
}
