import { findLegalMoves } from '../game/board';
import { createSession } from '../game/session';
import { createGameControllerState, updatePan } from './useGameController';
import { buildMoveAnimationPlan, previewOffsets } from './animationPlan';

describe('animation plan', () => {
  test('keeps held tile stationary while preview moves only the neighbor into the held cell', () => {
    const from = { row: 2, col: 2 };
    const to = { row: 2, col: 3 };
    expect(previewOffsets({ from, to }, 60)).toEqual({
      held: { x: 0, y: 0 },
      neighbor: { x: -60, y: 0 },
      durationMs: 180,
    });
  });

  test('marks preview as cancelled when gesture returns below hysteresis threshold', () => {
    const session = createSession(2);
    const [from] = findLegalMoves(session.board)[0];
    const previewing = updatePan(createGameControllerState(session), from, 24, 0, 56);
    expect(previewing.preview).not.toBeNull();
    const cancelled = updatePan(previewing, from, 10, 0, 56);
    expect(cancelled.preview).toBeNull();
  });

  test('builds fast ordered animation steps from resolver phases', () => {
    const session = createSession(2);
    const [from, to] = findLegalMoves(session.board)[0];
    const plan = buildMoveAnimationPlan(session, from, to, { reducedMotion: false });

    expect(plan.accepted).toBe(true);
    expect(plan.steps[0]).toMatchObject({ type: 'swap', durationMs: 180 });
    expect(plan.steps.map((step) => step.type)).toEqual(expect.arrayContaining(['clear', 'fall', 'refill']));
    expect(plan.steps.every((step) => step.durationMs <= 310)).toBe(true);
  });

  test('uses short opacity-first steps when reduced motion is enabled', () => {
    const session = createSession(2);
    const [from, to] = findLegalMoves(session.board)[0];
    const plan = buildMoveAnimationPlan(session, from, to, { reducedMotion: true });

    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.every((step) => step.durationMs <= 80)).toBe(true);
  });
});
