import { TILE_COLORS } from './balance';
import { Board, Coord, TileColor } from './model';

export function expandSpecialClears(board: Board, initial: readonly Coord[], rainbowColor?: TileColor): Coord[] {
  const result: Coord[] = [];
  const queued = new Set<string>();
  const queue: Coord[] = [];
  const explicitRainbow = rainbowColor === undefined
    ? undefined
    : initial.find((coord) => isInBounds(board, coord) && board[coord.row][coord.col]?.special === 'rainbow');
  const explicitRainbowKey = explicitRainbow ? coordKey(explicitRainbow) : undefined;

  const enqueue = (coord: Coord): void => {
    if (!isInBounds(board, coord) || board[coord.row][coord.col] === null) return;
    const key = coordKey(coord);
    if (queued.has(key)) return;
    queued.add(key);
    queue.push(coord);
    result.push(coord);
  };

  initial.forEach(enqueue);
  for (let index = 0; index < queue.length; index += 1) {
    const coord = queue[index];
    const special = board[coord.row][coord.col]?.special;
    if (special === 'row') {
      for (let col = 0; col < board[coord.row].length; col += 1) enqueue({ row: coord.row, col });
    } else if (special === 'column') {
      for (let row = 0; row < board.length; row += 1) enqueue({ row, col: coord.col });
    } else if (special === 'bomb') {
      for (let row = coord.row - 1; row <= coord.row + 1; row += 1) {
        for (let col = coord.col - 1; col <= coord.col + 1; col += 1) enqueue({ row, col });
      }
    } else if (special === 'rainbow') {
      const target = explicitRainbowKey === coordKey(coord) ? rainbowColor : mostCommonColor(board, coord);
      for (let row = 0; row < board.length; row += 1) {
        for (let col = 0; col < board[row].length; col += 1) {
          if (board[row][col]?.color === target) enqueue({ row, col });
        }
      }
    }
  }

  return result;
}

function mostCommonColor(board: Board, rainbow: Coord): TileColor {
  const counts = new Map<TileColor, number>(TILE_COLORS.map((color) => [color, 0]));
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (row === rainbow.row && col === rainbow.col) continue;
      const tile = board[row][col];
      if (tile) counts.set(tile.color, (counts.get(tile.color) ?? 0) + 1);
    }
  }
  return TILE_COLORS.reduce((best, color) =>
    (counts.get(color) ?? 0) > (counts.get(best) ?? 0) ? color : best,
  );
}

function coordKey(coord: Coord): string {
  return `${coord.row},${coord.col}`;
}

function isInBounds(board: Board, coord: Coord): boolean {
  return Number.isInteger(coord.row) && Number.isInteger(coord.col) && coord.row >= 0 && coord.row < board.length
    && coord.col >= 0 && coord.col < board[coord.row].length;
}
