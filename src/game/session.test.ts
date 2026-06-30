import { findLegalMoves } from './board';
import { commitMove, createSession, applyXp, xpForScore, xpRequiredForLevel } from './session';

describe('game session', () => {
  test('creates a deterministic playable idle session', () => {
    const first = createSession(123);
    const second = createSession(123);
    expect(first).toEqual(second);
    expect(first.phase).toBe('idle');
    expect(findLegalMoves(first.board).length).toBeGreaterThan(0);
  });

  test('only accepts input while idle and rejected moves preserve statistics', () => {
    const session = createSession(123);
    const paused = { ...session, phase: 'paused' as const };
    expect(commitMove(paused, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(paused);

    const rejected = commitMove(session, { row: 0, col: 0 }, { row: 5, col: 5 });
    expect(rejected).toEqual(session);
  });

  test('an accepted move updates score, cleared tiles, cascade and continuation state', () => {
    const session = createSession(2);
    const [from, to] = findLegalMoves(session.board)[0];
    const next = commitMove(session, from, to);
    expect(next.score).toBeGreaterThan(0);
    expect(next.clearedTiles).toBeGreaterThan(0);
    expect(next.bestCascade).toBeGreaterThanOrEqual(1);
    expect(next.randomState).not.toBe(session.randomState);
    expect(next.tileIdCounter).toBeGreaterThan(session.tileIdCounter);
    expect(next.phase).toBe('idle');
  });

  test('restoring continuation fields produces the same next board without reused IDs', () => {
    const first = createSession(29);
    const [from, to] = findLegalMoves(first.board)[0];
    const afterFirstMove = commitMove(first, from, to);
    const restored = JSON.parse(JSON.stringify(afterFirstMove));
    const [nextFrom, nextTo] = findLegalMoves(afterFirstMove.board)[0];
    const direct = commitMove(afterFirstMove, nextFrom, nextTo);
    const resumed = commitMove(restored, nextFrom, nextTo);
    expect(resumed).toEqual(direct);
    const ids = direct.board.flat().map((tile) => tile?.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('tracks an exact known multi-cascade and never lowers an existing best', () => {
    const session = createSession(0);
    const next = commitMove(session, { row: 0, col: 3 }, { row: 1, col: 3 });
    expect(next.bestCascade).toBe(2);
    const previousRecord = { ...session, bestCascade: 5 };
    expect(commitMove(previousRecord, { row: 0, col: 3 }, { row: 1, col: 3 }).bestCascade).toBe(5);
  });

  test('restored allocator advances beyond all historical IDs', () => {
    const session = createSession(29);
    const [from, to] = findLegalMoves(session.board)[0];
    const afterMove = commitMove(session, from, to);
    const historicalIds = new Set([...session.board.flat(), ...afterMove.board.flat()].map((tile) => tile?.id));
    const restored = JSON.parse(JSON.stringify(afterMove));
    const [nextFrom, nextTo] = findLegalMoves(restored.board)[0];
    const resumed = commitMove(restored, nextFrom, nextTo);
    expect(resumed.tileIdCounter).toBeGreaterThan(afterMove.tileIdCounter);
    const newIds = resumed.board.flat().map((tile) => tile?.id).filter((id) => !afterMove.board.flat().some((tile) => tile?.id === id));
    expect(newIds.every((id) => !historicalIds.has(id))).toBe(true);
  });

  test('calculates XP and carries it across multiple levels', () => {
    expect(xpForScore(0)).toBe(0);
    expect(xpForScore(1000)).toBe(10);
    expect(xpForScore(100000)).toBe(100);
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(applyXp({ level: 1, xp: 90 }, 250)).toEqual({ level: 3, xp: 120 });
  });
});
