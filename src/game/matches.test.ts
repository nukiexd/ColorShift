import { findLegalMoves, swapCells } from './board';
import { findMatches } from './matches';
import { Board, Tile, TileColor } from './model';

const colors: TileColor[][] = [
  ['coral', 'sky', 'mint', 'sun', 'plum', 'coral'],
  ['sky', 'mint', 'sun', 'plum', 'coral', 'sky'],
  ['mint', 'sun', 'plum', 'coral', 'sky', 'mint'],
  ['sun', 'plum', 'coral', 'sky', 'mint', 'sun'],
  ['plum', 'coral', 'sky', 'mint', 'sun', 'plum'],
  ['coral', 'sky', 'mint', 'sun', 'plum', 'coral'],
];

function boardWith(overrides: readonly (readonly [number, number, TileColor | null])[]): Board {
  const board: (Tile | null)[][] = colors.map((row, rowIndex) =>
    row.map((color, colIndex) => ({ id: `${rowIndex}-${colIndex}`, color, special: null })),
  );
  for (const [row, col, color] of overrides) {
    board[row][col] = color === null ? null : { id: `${row}-${col}`, color, special: null };
  }
  return board;
}

test('findMatches returns horizontal groups before vertical groups in scan order', () => {
  const board = boardWith([
    [0, 1, 'coral'],
    [0, 2, 'coral'],
    [1, 4, 'sky'],
    [2, 4, 'sky'],
    [3, 4, 'sky'],
  ]);

  expect(findMatches(board)).toEqual([
    {
      color: 'coral',
      orientation: 'horizontal',
      cells: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
    },
    {
      color: 'sky',
      orientation: 'vertical',
      cells: [
        { row: 1, col: 4 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
      ],
    },
  ]);
});

test('findMatches ignores null cells and groups shorter than three', () => {
  const board = boardWith([
    [0, 0, 'coral'],
    [0, 1, 'coral'],
    [0, 2, null],
    [0, 3, 'coral'],
  ]);
  expect(findMatches(board)).toEqual([]);
});

test('findLegalMoves only includes swaps whose new match contains a swapped coordinate', () => {
  const board = boardWith([
    [0, 0, 'coral'],
    [0, 1, 'sky'],
    [0, 2, 'coral'],
    [1, 1, 'coral'],
  ]);

  const moves = findLegalMoves(board);
  expect(moves).toContainEqual([
    { row: 0, col: 1 },
    { row: 1, col: 1 },
  ]);
  for (const [from, to] of moves) {
    const groups = findMatches(swapCells(board, from, to));
    expect(
      groups.some((group) =>
        group.cells.some(
          (cell) =>
            (cell.row === from.row && cell.col === from.col) || (cell.row === to.row && cell.col === to.col),
        ),
      ),
    ).toBe(true);
  }
});
