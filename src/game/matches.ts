import { Board, Coord, MatchGroup } from './model';

export function findMatches(board: Board): MatchGroup[] {
  const groups: MatchGroup[] = [];

  for (let row = 0; row < board.length; row += 1) {
    let start = 0;
    while (start < board[row].length) {
      const cell = board[row][start];
      let end = start + 1;
      while (cell !== null && end < board[row].length && board[row][end]?.color === cell.color) {
        end += 1;
      }
      if (cell !== null && end - start >= 3) {
        groups.push({
          color: cell.color,
          orientation: 'horizontal',
          cells: coordinates(start, end, (col) => ({ row, col })),
        });
      }
      start = end;
    }
  }

  const columnCount = board.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  for (let col = 0; col < columnCount; col += 1) {
    let start = 0;
    while (start < board.length) {
      const cell = board[start]?.[col] ?? null;
      let end = start + 1;
      while (cell !== null && end < board.length && board[end]?.[col]?.color === cell.color) {
        end += 1;
      }
      if (cell !== null && end - start >= 3) {
        groups.push({
          color: cell.color,
          orientation: 'vertical',
          cells: coordinates(start, end, (row) => ({ row, col })),
        });
      }
      start = end;
    }
  }

  return groups;
}

function coordinates(start: number, end: number, create: (index: number) => Coord): readonly Coord[] {
  return Array.from({ length: end - start }, (_, offset) => create(start + offset));
}
