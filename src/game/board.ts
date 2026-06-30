import { BOARD_SIZE, MAX_BOARD_GENERATION_ATTEMPTS, TILE_COLORS } from './balance';
import { findMatches } from './matches';
import { Board, Cell, Coord, RandomSource, Tile, TileColor } from './model';

export type LegalMove = readonly [Coord, Coord];

export function getCell(board: Board, coord: Coord): Cell {
  return board[coord.row]?.[coord.col] ?? null;
}

export function setCell(board: Board, coord: Coord, cell: Cell): Board {
  return board.map((row, rowIndex) =>
    rowIndex === coord.row ? row.map((current, colIndex) => (colIndex === coord.col ? cell : current)) : row,
  );
}

export function areAdjacent(first: Coord, second: Coord): boolean {
  return Math.abs(first.row - second.row) + Math.abs(first.col - second.col) === 1;
}

export function swapCells(board: Board, first: Coord, second: Coord): Board {
  if (!isInBounds(board, first) || !isInBounds(board, second)) {
    return board;
  }

  const firstCell = getCell(board, first);
  const secondCell = getCell(board, second);
  return setCell(setCell(board, first, secondCell), second, firstCell);
}

export function findLegalMoves(board: Board): readonly LegalMove[] {
  const moves: LegalMove[] = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const from = { row, col };
      if (col + 1 < board[row].length) {
        addIfLegal(board, moves, from, { row, col: col + 1 });
      }
      if (row + 1 < board.length && col < board[row + 1].length) {
        addIfLegal(board, moves, from, { row: row + 1, col });
      }
    }
  }

  return moves;
}

export function createBoard(random: RandomSource): Board {
  for (let attempt = 0; attempt < MAX_BOARD_GENERATION_ATTEMPTS; attempt += 1) {
    const board = fillBoard(random, attempt);
    if (findLegalMoves(board).length > 0) {
      return board;
    }
  }

  throw new Error(`Unable to generate a playable ${BOARD_SIZE}x${BOARD_SIZE} board after ${MAX_BOARD_GENERATION_ATTEMPTS} attempts`);
}

function addIfLegal(board: Board, moves: LegalMove[], from: Coord, to: Coord): void {
  if (getCell(board, from) === null || getCell(board, to) === null) {
    return;
  }

  const matches = findMatches(swapCells(board, from, to));
  if (matches.some((group) => group.cells.some((cell) => equalCoord(cell, from) || equalCoord(cell, to)))) {
    moves.push([from, to]);
  }
}

function fillBoard(random: RandomSource, attempt: number): Board {
  const board: Tile[][] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const currentRow: Tile[] = [];
    board.push(currentRow);
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const available = TILE_COLORS.filter((color) => !formsImmediateMatch(board, row, col, color));
      const randomValue = random.next();
      if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
        throw new RangeError(`RandomSource.next() must return a finite number in [0, 1); received ${randomValue}`);
      }
      const color = available[Math.floor(randomValue * available.length)];
      currentRow.push({ id: `tile-${attempt}-${row}-${col}`, color, special: null });
    }
  }

  return board;
}

function formsImmediateMatch(board: readonly (readonly Tile[])[], row: number, col: number, color: TileColor): boolean {
  const horizontal = col >= 2 && board[row][col - 1].color === color && board[row][col - 2].color === color;
  const vertical = row >= 2 && board[row - 1][col].color === color && board[row - 2][col].color === color;
  return horizontal || vertical;
}

function equalCoord(first: Coord, second: Coord): boolean {
  return first.row === second.row && first.col === second.col;
}

function isInBounds(board: Board, coord: Coord): boolean {
  return (
    Number.isInteger(coord.row) &&
    Number.isInteger(coord.col) &&
    coord.row >= 0 &&
    coord.row < board.length &&
    coord.col >= 0 &&
    coord.col < board[coord.row].length
  );
}
