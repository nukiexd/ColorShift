import { MAX_BOARD_GENERATION_ATTEMPTS, MAX_CASCADES, TILE_COLORS } from './balance';
import { areAdjacent, createBoard, findLegalMoves, getCell, swapCells } from './board';
import { findMatches } from './matches';
import {
  Board,
  ClearPhase,
  Coord,
  MatchGroup,
  MoveResolution,
  RandomSource,
  Special,
  Tile,
  TileColor,
  TileIdSource,
} from './model';
import { expandSpecialClears } from './specials';
import { createSeededRandom, createTileIdSource } from './random';

const defaultTileIds = createTileIdSource();

export function applyGravityAndRefill(board: Board, random: RandomSource, tileIds: TileIdSource = defaultTileIds): Board {
  return refillEmptyCells(applyGravity(board), random, tileIds);
}

function applyGravity(board: Board): Board {
  const result = board.map((row) => row.map(() => null)) as (Tile | null)[][];
  const columns = board.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  for (let col = 0; col < columns; col += 1) {
    const survivors = board.map((row) => row[col]).filter((cell): cell is Tile => cell !== null && cell !== undefined);
    let target = board.length - 1;
    for (let index = survivors.length - 1; index >= 0; index -= 1) {
      while (target >= 0 && col >= result[target].length) target -= 1;
      if (target >= 0) result[target--][col] = survivors[index];
    }
  }
  return result;
}

function refillEmptyCells(board: Board, random: RandomSource, tileIds: TileIdSource): Board {
  const result = board.map((row) => [...row]);
  const usedIds = new Set(board.flatMap((row) => row.filter((cell): cell is Tile => cell !== null).map((tile) => tile.id)));
  for (let row = 0; row < result.length; row += 1) {
    for (let col = 0; col < result[row].length; col += 1) {
      if (result[row][col] === null) {
        const value = nextRandom(random);
        let id: string;
        do id = tileIds.next(); while (usedIds.has(id));
        usedIds.add(id);
        result[row][col] = { id, color: TILE_COLORS[Math.floor(value * TILE_COLORS.length)], special: null };
      }
    }
  }
  return result;
}

export function resolveMove(board: Board, from: Coord, to: Coord, random: RandomSource, tileIds: TileIdSource = defaultTileIds): MoveResolution {
  if (!areAdjacent(from, to) || getCell(board, from) === null || getCell(board, to) === null || !inBounds(board, from) || !inBounds(board, to)) {
    return rejected(board);
  }

  let current = swapCells(board, from, to);
  const movedFrom = getCell(current, to);
  const movedTo = getCell(current, from);
  const rainbowSwap = movedFrom?.special === 'rainbow' || movedTo?.special === 'rainbow';
  let groups = orderGroups(findMatches(current));
  if (!rainbowSwap && !groups.some((group) => group.cells.some((coord) => sameCoord(coord, from) || sameCoord(coord, to)))) {
    return rejected(board);
  }

  const phases: ClearPhase[] = [];
  let cascade = 1;
  let specialInitial: Coord[] | null = null;
  let rainbowColor: TileColor | undefined;
  let clearEntireBoard = false;
  if (rainbowSwap) {
    const rainbowCoords = [from, to].filter((coord) => getCell(current, coord)?.special === 'rainbow');
    if (rainbowCoords.length === 2) clearEntireBoard = true;
    else {
      const rainbowCoord = rainbowCoords[0];
      const otherCoord = sameCoord(rainbowCoord, from) ? to : from;
      rainbowColor = getCell(current, otherCoord)?.color;
      specialInitial = [rainbowCoord, otherCoord];
    }
  }

  while (groups.length > 0 || specialInitial !== null || clearEntireBoard) {
    if (cascade > MAX_CASCADES) throw new Error(`Unable to stabilize board after ${MAX_CASCADES} cascades`);
    const created = clearEntireBoard ? null : chooseSpecial(groups, cascade === 1 ? to : undefined);
    const matched = uniqueCoords(groups.flatMap((group) => group.cells));
    const initial = clearEntireBoard ? allOccupiedCoords(current) : uniqueCoords([...(specialInitial ?? []), ...matched]);
    const boardForExpansion = created ? withoutSpecial(current, created.coord) : current;
    let cleared = expandSpecialClears(boardForExpansion, initial, rainbowColor);
    if (created) cleared = cleared.filter((coord) => !sameCoord(coord, created.coord));
    const backgroundColor = groups.at(-1)?.color ?? rainbowColor ?? TILE_COLORS[0];
    const scoreDelta = 100 * cleared.length * cascade;
    const boardBefore = current;
    const next = current.map((row) => [...row]);
    for (const coord of cleared) next[coord.row][coord.col] = null;
    if (created) {
      const source = getCell(current, created.coord);
      if (source) next[created.coord.row][created.coord.col] = { ...source, special: created.special };
    }
    const boardAfterClear = next;
    const boardAfterGravity = applyGravity(boardAfterClear);
    const boardAfterRefill = refillEmptyCells(boardAfterGravity, random, tileIds);
    phases.push({ cascade, groups, cleared, createdSpecial: created, scoreDelta, backgroundColor,
      boardBefore, boardAfterClear, boardAfterGravity, boardAfterRefill });
    current = boardAfterRefill;
    groups = orderGroups(findMatches(current));
    cascade += 1;
    specialInitial = null;
    rainbowColor = undefined;
    clearEntireBoard = false;
  }

  let shuffled = false;
  if (findLegalMoves(current).length === 0) {
    try {
      current = shuffleToPlayable(current, random);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('Unable to shuffle board')) throw error;
      current = replaceTileIds(createBoard(createSeededRandom(boardSeed(current))), tileIds);
    }
    shuffled = true;
  }
  return { accepted: true, board: current, phases, scoreDelta: phases.reduce((sum, phase) => sum + phase.scoreDelta, 0), shuffled };
}

export function shuffleToPlayable(board: Board, random: RandomSource): Board {
  const positions = allOccupiedCoords(board);
  const original = positions.map((coord) => getCell(board, coord) as Tile);
  for (let attempt = 0; attempt < MAX_BOARD_GENERATION_ATTEMPTS; attempt += 1) {
    const tiles = [...original];
    for (let index = tiles.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(nextRandom(random) * (index + 1));
      [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
    }
    const candidate = board.map((row) => [...row]);
    positions.forEach((coord, index) => { candidate[coord.row][coord.col] = tiles[index]; });
    if (findMatches(candidate).length === 0 && findLegalMoves(candidate).length > 0) return candidate;
  }
  throw new Error(`Unable to shuffle board to a stable playable state after ${MAX_BOARD_GENERATION_ATTEMPTS} attempts`);
}

function chooseSpecial(groups: readonly MatchGroup[], playerAnchor?: Coord): { coord: Coord; special: Exclude<Special, null> } | null {
  const qualifying = groups.filter((group) => group.cells.length >= 4);
  if (qualifying.length === 0) return null;
  const longest = Math.max(...qualifying.map((group) => group.cells.length));
  const group = qualifying.find((candidate) => candidate.cells.length === longest) as MatchGroup;
  const coord = playerAnchor && group.cells.some((cell) => sameCoord(cell, playerAnchor))
    ? playerAnchor
    : group.cells[Math.floor(group.cells.length / 2)];
  const special: Exclude<Special, null> = group.cells.length >= 6
    ? 'rainbow'
    : group.cells.length === 5
      ? 'bomb'
      : group.orientation === 'horizontal' ? 'row' : 'column';
  return { coord, special };
}

function orderGroups(groups: readonly MatchGroup[]): MatchGroup[] {
  return [...groups].sort((left, right) => {
    const leftMin = left.cells.reduce((best, cell) => cell.row < best.row || (cell.row === best.row && cell.col < best.col) ? cell : best);
    const rightMin = right.cells.reduce((best, cell) => cell.row < best.row || (cell.row === best.row && cell.col < best.col) ? cell : best);
    return leftMin.row - rightMin.row || leftMin.col - rightMin.col || (left.orientation === right.orientation ? 0 : left.orientation === 'horizontal' ? -1 : 1);
  });
}

function boardSeed(board: Board): number {
  let hash = 2166136261;
  for (const tile of board.flat()) {
    for (const char of `${tile?.id ?? '-'}:${tile?.color ?? '-'}:${tile?.special ?? '-'}`) {
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    }
  }
  return hash >>> 0;
}

function replaceTileIds(board: Board, tileIds: TileIdSource): Board {
  return board.map((row) => row.map((tile) => tile ? { ...tile, id: tileIds.next() } : null));
}

function withoutSpecial(board: Board, coord: Coord): Board {
  return board.map((row, rowIndex) => row.map((cell, colIndex) =>
    rowIndex === coord.row && colIndex === coord.col && cell ? { ...cell, special: null } : cell,
  ));
}

function uniqueCoords(coords: readonly Coord[]): Coord[] {
  const seen = new Set<string>();
  return coords.filter((coord) => {
    const key = `${coord.row},${coord.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function allOccupiedCoords(board: Board): Coord[] {
  const result: Coord[] = [];
  board.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
    if (cell) result.push({ row: rowIndex, col: colIndex });
  }));
  return result;
}

function nextRandom(random: RandomSource): number {
  const value = random.next();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`RandomSource.next() must return a finite number in [0, 1); received ${value}`);
  }
  return value;
}

function sameCoord(first: Coord, second: Coord): boolean {
  return first.row === second.row && first.col === second.col;
}

function inBounds(board: Board, coord: Coord): boolean {
  return Number.isInteger(coord.row) && Number.isInteger(coord.col) && coord.row >= 0 && coord.row < board.length
    && coord.col >= 0 && coord.col < board[coord.row].length;
}

function rejected(board: Board): MoveResolution {
  return { accepted: false, board, phases: [], scoreDelta: 0, shuffled: false };
}

export type { ClearPhase, MoveResolution } from './model';
