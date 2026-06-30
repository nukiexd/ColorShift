import { expandSpecialClears } from './specials';
import { Board, Special, Tile, TileColor } from './model';

const colors: TileColor[] = ['coral', 'sky', 'mint', 'sun', 'plum'];

function boardWith(specials: readonly [number, number, Special][]): Board {
  const board: Tile[][] = Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => ({
      id: `${row}-${col}`,
      color: colors[(row + col) % colors.length],
      special: null,
    })),
  );
  for (const [row, col, special] of specials) board[row][col] = { ...board[row][col], special };
  return board;
}

test('a row special clears its row and chains another special without duplicates', () => {
  const board = boardWith([[2, 1, 'row'], [2, 4, 'column']]);
  const cleared = expandSpecialClears(board, [{ row: 2, col: 1 }]);

  expect(cleared).toHaveLength(11);
  expect(cleared).toContainEqual({ row: 0, col: 4 });
  expect(cleared).toContainEqual({ row: 2, col: 5 });
});

test('a bomb at the corner is clipped to the board', () => {
  const board = boardWith([[0, 0, 'bomb']]);
  expect(expandSpecialClears(board, [{ row: 0, col: 0 }])).toEqual([
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ]);
});

test('a rainbow clears the explicit target color', () => {
  const board = boardWith([[0, 0, 'rainbow']]);
  const cleared = expandSpecialClears(board, [{ row: 0, col: 0 }], 'sky');
  expect(cleared).toContainEqual({ row: 0, col: 1 });
  expect(cleared).toContainEqual({ row: 5, col: 1 });
});

test('special effects do not report empty cells as cleared', () => {
  const board = boardWith([[0, 0, 'bomb']]).map((row) => [...row]) as (Tile | null)[][];
  board[0][1] = null;

  expect(expandSpecialClears(board, [{ row: 0, col: 0 }])).not.toContainEqual({ row: 0, col: 1 });
});
