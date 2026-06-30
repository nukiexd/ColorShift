import { BOARD_SIZE } from './balance';
import {
  areAdjacent,
  createBoard,
  findLegalMoves,
  getCell,
  setCell,
  swapCells,
} from './board';
import { findMatches } from './matches';
import { Coord, Tile } from './model';
import { createSeededRandom } from './random';

const tile = (id: string, color: Tile['color']): Tile => ({ id, color, special: null });

describe('board coordinates and immutable updates', () => {
  test('only orthogonal neighboring coordinates are adjacent', () => {
    expect(areAdjacent({ row: 2, col: 2 }, { row: 2, col: 3 })).toBe(true);
    expect(areAdjacent({ row: 2, col: 2 }, { row: 3, col: 2 })).toBe(true);
    expect(areAdjacent({ row: 2, col: 2 }, { row: 3, col: 3 })).toBe(false);
    expect(areAdjacent({ row: 2, col: 2 }, { row: 2, col: 4 })).toBe(false);
  });

  test('setCell changes one cell without mutating the original board', () => {
    const original = createBoard(createSeededRandom(7));
    const coord = { row: 1, col: 1 };
    const replacement = tile('replacement', 'plum');
    const updated = setCell(original, coord, replacement);

    expect(getCell(updated, coord)).toBe(replacement);
    expect(getCell(original, coord)).not.toBe(replacement);
    expect(updated).not.toBe(original);
    expect(updated[0]).toBe(original[0]);
    expect(updated[1]).not.toBe(original[1]);
  });

  test('swapCells preserves tile IDs and leaves the original board unchanged', () => {
    const original = createBoard(createSeededRandom(11));
    const left = { row: 0, col: 0 };
    const right = { row: 0, col: 1 };
    const leftTile = getCell(original, left);
    const rightTile = getCell(original, right);
    const swapped = swapCells(original, left, right);

    expect(getCell(swapped, left)?.id).toBe(rightTile?.id);
    expect(getCell(swapped, right)?.id).toBe(leftTile?.id);
    expect(getCell(original, left)).toBe(leftTile);
    expect(getCell(original, right)).toBe(rightTile);
  });
});

describe('deterministic board generation', () => {
  test('the same seed produces the same random sequence and board', () => {
    const firstRandom = createSeededRandom(1234);
    const secondRandom = createSeededRandom(1234);
    expect([firstRandom.next(), firstRandom.next(), firstRandom.next()]).toEqual([
      secondRandom.next(),
      secondRandom.next(),
      secondRandom.next(),
    ]);

    expect(createBoard(createSeededRandom(88))).toEqual(createBoard(createSeededRandom(88)));
  });

  test.each(Array.from({ length: 100 }, (_, index) => index + 1))(
    'seed %i creates a full match-free board with a legal move and unique IDs',
    (seed) => {
      const board = createBoard(createSeededRandom(seed));
      const cells = board.flat();

      expect(board).toHaveLength(BOARD_SIZE);
      expect(board.every((row) => row.length === BOARD_SIZE)).toBe(true);
      expect(cells.every((cell) => cell !== null)).toBe(true);
      expect(new Set(cells.map((cell) => cell?.id)).size).toBe(BOARD_SIZE * BOARD_SIZE);
      expect(findMatches(board)).toEqual([]);
      expect(findLegalMoves(board).length).toBeGreaterThan(0);
    },
  );
});

describe('legal moves', () => {
  test('every move is an adjacent right/down pair whose swap creates a match at a moved cell', () => {
    const board = createBoard(createSeededRandom(42));

    for (const move of findLegalMoves(board)) {
      const [from, to] = move;
      expect(areAdjacent(from, to)).toBe(true);
      expect(to.row > from.row || to.col > from.col).toBe(true);

      const matches = findMatches(swapCells(board, from, to));
      expect(matches.some((group) => group.cells.some((cell) => sameCoord(cell, from) || sameCoord(cell, to)))).toBe(
        true,
      );
    }
  });
});

function sameCoord(left: Coord, right: Coord): boolean {
  return left.row === right.row && left.col === right.col;
}
