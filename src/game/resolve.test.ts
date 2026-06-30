import { applyGravityAndRefill, resolveMove, shuffleToPlayable } from './resolve';
import { findLegalMoves } from './board';
import { findMatches } from './matches';
import { Board, RandomSource, Special, Tile, TileColor } from './model';
import { createSeededRandom, createTileIdSource } from './random';

const base: TileColor[][] = [
  ['coral', 'sky', 'mint', 'sun', 'plum', 'coral'],
  ['sky', 'mint', 'sun', 'plum', 'coral', 'sky'],
  ['mint', 'sun', 'plum', 'coral', 'sky', 'mint'],
  ['sun', 'plum', 'coral', 'sky', 'mint', 'sun'],
  ['plum', 'coral', 'sky', 'mint', 'sun', 'plum'],
  ['coral', 'sky', 'mint', 'sun', 'plum', 'coral'],
];

function boardWith(overrides: readonly [number, number, TileColor, Special?][]): Board {
  const board: Tile[][] = base.map((colors, row) =>
    colors.map((color, col) => ({ id: `${row}-${col}`, color, special: null })),
  );
  for (const [row, col, color, special = null] of overrides) {
    board[row][col] = { id: `${row}-${col}`, color, special };
  }
  return board;
}

const random: RandomSource = { next: () => 0.99 };

test('rejects a non-matching adjacent swap and preserves the board reference', () => {
  const board = boardWith([]);
  expect(resolveMove(board, { row: 0, col: 0 }, { row: 0, col: 1 }, random)).toEqual({
    accepted: false,
    board,
    phases: [],
    scoreDelta: 0,
    shuffled: false,
  });
});

test('resolves a three-cell clear for 300 points', () => {
  const board = boardWith([
    [0, 0, 'coral'], [0, 1, 'sky'], [0, 2, 'coral'], [1, 1, 'coral'],
  ]);
  const result = resolveMove(board, { row: 0, col: 1 }, { row: 1, col: 1 }, createSeededRandom(42));
  expect(result.accepted).toBe(true);
  expect(result.phases[0].cleared).toHaveLength(3);
  expect(result.phases[0].scoreDelta).toBe(300);
});

test('gravity compacts surviving tiles and assigns non-colliding IDs to refills', () => {
  const board = boardWith([]).map((row) => [...row]) as (Tile | null)[][];
  board[5][0] = null;
  board[3][0] = null;
  const filled = applyGravityAndRefill(board, { next: () => 0 });
  expect(filled.flat().every(Boolean)).toBe(true);
  expect(filled[5][0]?.id).toBe('4-0');
  expect(new Set(filled.flat().map((tile) => tile?.id)).size).toBe(36);
});

test('successive refill calls with one random source do not reuse cleared refill IDs', () => {
  const source = { next: () => 0 };
  const ids = createTileIdSource(10, 'session');
  const firstInput = boardWith([]).map((row) => [...row]) as (Tile | null)[][];
  firstInput[0][0] = null;
  const first = applyGravityAndRefill(firstInput, source, ids);
  const firstId = first[0][0]?.id;
  const secondInput = first.map((row) => [...row]) as (Tile | null)[][];
  secondInput[0][0] = null;
  const second = applyGravityAndRefill(secondInput, source, ids);
  expect(second[0][0]?.id).not.toBe(firstId);
});

test('tile ID allocators have deterministic starts and namespaces', () => {
  const ids = createTileIdSource(7, 'game');
  expect([ids.next(), ids.next(), ids.next()]).toEqual(['game-7', 'game-8', 'game-9']);
});

test('creates a row special at the player destination and does not clear it immediately', () => {
  const board = boardWith([
    [0, 0, 'coral'], [0, 1, 'coral'], [0, 2, 'coral'], [0, 3, 'sky'], [1, 3, 'coral'],
  ]);
  const result = resolveMove(board, { row: 1, col: 3 }, { row: 0, col: 3 }, createSeededRandom(9));

  expect(result.phases[0].createdSpecial).toEqual({ coord: { row: 0, col: 3 }, special: 'row' });
  expect(result.phases[0].cleared).not.toContainEqual({ row: 0, col: 3 });
  expect(result.phases[0].scoreDelta).toBe(300);
});

test.each([
  [4, 'row'],
  [5, 'bomb'],
  [6, 'rainbow'],
] as const)('a horizontal match of %i creates a %s at the destination', (length, special) => {
  const overrides: [number, number, TileColor][] = [];
  for (let col = 0; col < length - 1; col += 1) overrides.push([0, col, 'coral']);
  overrides.push([0, length - 1, 'sky'], [1, length - 1, 'coral']);
  if (length < 6) overrides.push([0, length, 'plum']);
  const result = resolveMove(
    boardWith(overrides),
    { row: 1, col: length - 1 },
    { row: 0, col: length - 1 },
    createSeededRandom(300 + length),
  );

  expect(result.phases[0].createdSpecial).toEqual({ coord: { row: 0, col: length - 1 }, special });
});

test('a vertical match of four creates a column special', () => {
  const board = boardWith([
    [0, 0, 'mint'], [1, 0, 'mint'], [2, 0, 'mint'], [3, 0, 'sky'], [3, 1, 'mint'],
  ]);
  const result = resolveMove(board, { row: 3, col: 1 }, { row: 3, col: 0 }, createSeededRandom(44));
  expect(result.phases[0].createdSpecial).toEqual({ coord: { row: 3, col: 0 }, special: 'column' });
});

test('a rainbow swap is accepted without a natural match and clears its target color', () => {
  const board = boardWith([[0, 0, 'coral', 'rainbow']]);
  const result = resolveMove(board, { row: 0, col: 0 }, { row: 0, col: 1 }, createSeededRandom(21));

  expect(result.accepted).toBe(true);
  expect(result.phases[0].cleared).toEqual(expect.arrayContaining([
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 },
  ]));
});

test('swapping two rainbows clears every tile exactly once', () => {
  const board = boardWith([[0, 0, 'coral', 'rainbow'], [0, 1, 'sky', 'rainbow']]);
  const result = resolveMove(board, { row: 0, col: 0 }, { row: 0, col: 1 }, createSeededRandom(77));
  expect(result.phases[0].cleared).toHaveLength(36);
  expect(result.phases[0].scoreDelta).toBe(3600);
});

test('two rainbows suppress special creation even when their swap forms a qualifying group', () => {
  const board = boardWith([
    [0, 0, 'coral', 'rainbow'], [0, 1, 'coral', 'rainbow'],
    [0, 2, 'coral'], [0, 3, 'coral'], [0, 4, 'coral'], [0, 5, 'coral'],
  ]);
  const result = resolveMove(board, { row: 0, col: 0 }, { row: 0, col: 1 }, createSeededRandom(177));

  expect(result.phases[0].groups[0].cells).toHaveLength(6);
  expect(result.phases[0].createdSpecial).toBeNull();
  expect(result.phases[0].cleared).toHaveLength(36);
});

test('shuffle preserves tile identities and special values while producing a stable playable board', () => {
  const board = boardWith([[0, 0, 'coral', 'bomb']]);
  const shuffled = shuffleToPlayable(board, createSeededRandom(15));
  const summarize = (value: Board) => value.flat().map((tile) => `${tile?.id}:${tile?.special}`).sort();

  expect(summarize(shuffled)).toEqual(summarize(board));
  expect(shuffled).not.toBe(board);
  expect(findMatches(shuffled)).toHaveLength(0);
  expect(findLegalMoves(shuffled).length).toBeGreaterThan(0);
});

test('applies the cascade-depth multiplier to a refill-created match', () => {
  const board = boardWith([
    [0, 0, 'coral'], [0, 1, 'sky'], [0, 2, 'coral'], [1, 1, 'coral'],
  ]);
  const values = [0, 0, 0, 0.45, 0.65];
  const fallback = createSeededRandom(101);
  const result = resolveMove(board, { row: 0, col: 1 }, { row: 1, col: 1 }, {
    next: () => values.shift() ?? fallback.next(),
  });

  expect(result.phases[0].scoreDelta).toBe(300);
  expect(result.phases[1].scoreDelta).toBe(600);
  expect(result.phases[1].cascade).toBe(2);
  expect(result.phases[0].boardAfterRefill).toEqual(result.phases[1].boardBefore);
  expect(result.phases[0].boardAfterClear).not.toBe(result.phases[0].boardBefore);
  expect(result.phases[0].boardAfterGravity).not.toBe(result.phases[0].boardAfterClear);
});

test('validates refill randomness and caps impossible shuffles', () => {
  const board = boardWith([]).map((row) => [...row]) as (Tile | null)[][];
  board[0][0] = null;
  expect(() => applyGravityAndRefill(board, { next: () => 1 })).toThrow(RangeError);

  const impossible: Board = Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => ({ id: `${row}-${col}`, color: 'coral', special: null })),
  );
  expect(() => shuffleToPlayable(impossible, { next: () => 0 })).toThrow('after 200 attempts');
});

test('resolveMove recovers from exhausted dead-board shuffling without losing score', () => {
  const dead: Board = Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => ({
      id: `dead-${row}-${col}`,
      color: (['coral', 'sky', 'mint', 'sun', 'plum'] as const)[(row + col) % 5],
      special: null,
    })),
  );
  const input = dead.map((row) => row.map((tile) => ({ ...tile }))) as Tile[][];
  input[0][0] = { ...input[0][0], color: 'coral' };
  input[0][1] = { ...input[0][1], color: 'coral' };
  input[0][2] = { ...input[0][2], color: 'sun' };
  input[0][3] = { ...input[0][3], color: 'coral' };
  const draws = [0.1, 0.3, 0.5];
  const result = resolveMove(input, { row: 0, col: 2 }, { row: 0, col: 3 }, {
    next: () => draws.shift() ?? 0,
  });

  expect(result.accepted).toBe(true);
  expect(result.scoreDelta).toBe(result.phases.reduce((sum, phase) => sum + phase.scoreDelta, 0));
  expect(result.shuffled).toBe(true);
  expect(findMatches(result.board)).toHaveLength(0);
  expect(findLegalMoves(result.board).length).toBeGreaterThan(0);
});

test('spatial ordering uses the bottom group for background and the top group for tied special creation', () => {
  const board = boardWith([
    [0, 0, 'sky'], [1, 0, 'sky'], [2, 0, 'sky'], [3, 0, 'sky'],
    [5, 0, 'coral'], [5, 1, 'coral'], [5, 2, 'coral'], [5, 3, 'sky'], [4, 3, 'coral'],
  ]);
  const result = resolveMove(board, { row: 4, col: 3 }, { row: 5, col: 3 }, createSeededRandom(909));

  expect(result.phases[0].groups.map((group) => group.orientation)).toEqual(['vertical', 'horizontal']);
  expect(result.phases[0].createdSpecial).toEqual({ coord: { row: 2, col: 0 }, special: 'column' });
  expect(result.phases[0].backgroundColor).toBe('coral');
});

test('an accepted resolution does not mutate the input board, rows, or tiles', () => {
  const board = boardWith([
    [0, 0, 'coral'], [0, 1, 'sky'], [0, 2, 'coral'], [1, 1, 'coral'],
  ]);
  const snapshot = JSON.stringify(board);
  const rows = [...board];
  const tiles = board.map((row) => [...row]);
  expect(resolveMove(board, { row: 0, col: 1 }, { row: 1, col: 1 }, createSeededRandom(42)).accepted).toBe(true);
  expect(JSON.stringify(board)).toBe(snapshot);
  board.forEach((row, rowIndex) => {
    expect(row).toBe(rows[rowIndex]);
    row.forEach((tile, colIndex) => expect(tile).toBe(tiles[rowIndex][colIndex]));
  });
});
