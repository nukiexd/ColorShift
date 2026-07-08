import { findLegalMoves } from '../game/board';
import { createSession } from '../game/session';
import {
  createGameControllerState,
  gestureIntent,
  releasePan,
  tapTile,
  updatePan,
} from './useGameController';

describe('game controller and stationary drag policy', () => {
  test('uses hysteresis thresholds for invisible directional tracking', () => {
    expect(gestureIntent(10, 0, 56, null)).toBeNull();
    expect(gestureIntent(13, 3, 56, null)).toBe('right');
    expect(gestureIntent(7, 0, 56, 'right')).toBeNull();
    expect(gestureIntent(-13, 2, 56, null)).toBe('left');
    expect(gestureIntent(2, -19, 56, null)).toBe('up');
    expect(gestureIntent(5, 20, 56, 'right')).toBe('down');
  });

  test('tap selection supports reselection, deselection and adjacent commits', () => {
    const session = createSession(2);
    const [from, to] = findLegalMoves(session.board)[0];
    let state = createGameControllerState(session);

    state = tapTile(state, from).state;
    expect(state.selected).toEqual(from);
    state = tapTile(state, from).state;
    expect(state.selected).toBeNull();
    state = tapTile(state, from).state;
    state = tapTile(state, { row: 5, col: 5 }).state;
    expect(state.selected).toEqual({ row: 5, col: 5 });

    state = tapTile(createGameControllerState(session), from).state;
    const committed = tapTile(state, to, { reducedMotion: true });
    expect(committed.accepted).toBe(true);
    expect(committed.animationPlan?.steps[0]).toMatchObject({ type: 'swap', durationMs: 80 });
    expect(committed.state.session.score).toBeGreaterThan(session.score);
    expect(committed.state.selected).toBeNull();
  });

  test('invalid adjacent tap rolls back and non-idle sessions reject input', () => {
    const session = createSession(8);
    const legalKeys = new Set(findLegalMoves(session.board).map(([from, to]) => key(from, to)));
    const invalid = adjacentPairs().find(([from, to]) => !legalKeys.has(key(from, to)) && !legalKeys.has(key(to, from)));
    expect(invalid).toBeDefined();
    const [from, to] = invalid!;

    let state = tapTile(createGameControllerState(session), from).state;
    const rejected = tapTile(state, to);
    expect(rejected.accepted).toBe(false);
    expect(rejected.state.session).toBe(session);
    expect(rejected.state.selected).toBeNull();
    expect(rejected.animationPlan?.steps.map((step) => step.type)).toEqual(['swap', 'swapBack']);

    const paused = createGameControllerState({ ...session, phase: 'paused' });
    expect(tapTile(paused, from).state).toBe(paused);
    expect(updatePan(paused, from, 40, 0, 56)).toBe(paused);
  });

  test('one pan gesture previews one neighbor and commits at most once', () => {
    const session = createSession(2);
    const [from, to] = findLegalMoves(session.board)[0];
    const dx = to.col > from.col ? 24 : to.col < from.col ? -24 : 0;
    const dy = to.row > from.row ? 24 : to.row < from.row ? -24 : 0;
    let state = createGameControllerState(session);

    state = updatePan(state, from, dx, dy, 56);
    expect(state.preview).toEqual({ from, to });

    const first = releasePan(state);
    expect(first.accepted).toBe(true);
    expect(first.animationPlan?.steps.map((step) => step.type)).toContain('clear');
    expect(first.state.panCommitted).toBe(true);
    const second = releasePan(first.state);
    expect(second.accepted).toBe(false);
    expect(second.state.session).toBe(first.state.session);
  });

  test('invalid pan release does not block the next pan gesture', () => {
    const session = createSession(8);
    const legalKeys = new Set(findLegalMoves(session.board).map(([from, to]) => key(from, to)));
    const invalid = adjacentPairs().find(([from, to]) => !legalKeys.has(key(from, to)) && !legalKeys.has(key(to, from)));
    expect(invalid).toBeDefined();
    const [from, to] = invalid!;
    const dx = to.col > from.col ? 24 : to.col < from.col ? -24 : 0;
    const dy = to.row > from.row ? 24 : to.row < from.row ? -24 : 0;

    let state = updatePan(createGameControllerState(session), from, dx, dy, 56);
    const rejected = releasePan(state);
    expect(rejected.accepted).toBe(false);
    expect(rejected.state.panCommitted).toBe(false);

    state = updatePan(rejected.state, from, dx, dy, 56);
    expect(state.preview).toEqual({ from, to });
  });
});

function key(from: { row: number; col: number }, to: { row: number; col: number }) {
  return `${from.row},${from.col}->${to.row},${to.col}`;
}

function adjacentPairs() {
  const pairs: (readonly [{ row: number; col: number }, { row: number; col: number }])[] = [];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      if (col < 5) pairs.push([{ row, col }, { row, col: col + 1 }]);
      if (row < 5) pairs.push([{ row, col }, { row: row + 1, col }]);
    }
  }
  return pairs;
}
