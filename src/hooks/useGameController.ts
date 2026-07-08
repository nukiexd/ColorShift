import { useCallback, useMemo, useState } from 'react';
import { areAdjacent } from '../game/board';
import { Coord } from '../game/model';
import { GameSession } from '../game/session';
import { buildMoveAnimationPlan, MoveAnimationPlan } from './animationPlan';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface SwapPreview {
  readonly from: Coord;
  readonly to: Coord;
}

export interface GameControllerState {
  readonly session: GameSession;
  readonly selected: Coord | null;
  readonly preview: SwapPreview | null;
  readonly panCommitted: boolean;
}

export interface ControllerResult {
  readonly state: GameControllerState;
  readonly accepted: boolean;
  readonly animationPlan?: MoveAnimationPlan;
}

interface CommitOptions {
  readonly reducedMotion?: boolean;
}

export function gestureIntent(dx: number, dy: number, pitch: number, current: Direction | null): Direction | null {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(pitch) || pitch <= 0) return null;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));
  if (current && distance < pitch * 0.14) return null;
  if (!current && distance < pitch * 0.22) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export function createGameControllerState(session: GameSession): GameControllerState {
  return { session, selected: null, preview: null, panCommitted: false };
}

export function tapTile(state: GameControllerState, coord: Coord, options: CommitOptions = {}): ControllerResult {
  if (!canAcceptInput(state)) return { state, accepted: false };
  if (state.selected === null) return { state: { ...state, selected: coord, preview: null, panCommitted: false }, accepted: false };
  if (sameCoord(state.selected, coord)) return { state: { ...state, selected: null, preview: null }, accepted: false };
  if (!areAdjacent(state.selected, coord)) return { state: { ...state, selected: coord, preview: null }, accepted: false };
  const animationPlan = buildMoveAnimationPlan(state.session, state.selected, coord, { reducedMotion: options.reducedMotion ?? false });
  const nextSession = animationPlan.accepted ? sessionFromPlan(state.session, animationPlan) : state.session;
  return {
    state: { ...state, session: nextSession, selected: null, preview: null, panCommitted: nextSession !== state.session },
    accepted: nextSession !== state.session,
    animationPlan,
  };
}

export function updatePan(state: GameControllerState, from: Coord, dx: number, dy: number, pitch: number): GameControllerState {
  if (!canAcceptInput(state) || state.panCommitted) return state;
  const currentDirection = state.preview ? directionBetween(state.preview.from, state.preview.to) : null;
  const direction = gestureIntent(dx, dy, pitch, currentDirection);
  if (!direction) return { ...state, selected: from, preview: null };
  const to = neighbor(from, direction);
  if (!isBoardCoord(to)) return { ...state, selected: from, preview: null };
  return { ...state, selected: from, preview: { from, to } };
}

export function releasePan(state: GameControllerState, options: CommitOptions = {}): ControllerResult {
  if (!canAcceptInput(state) || state.panCommitted || !state.preview) return { state, accepted: false };
  const animationPlan = buildMoveAnimationPlan(state.session, state.preview.from, state.preview.to, { reducedMotion: options.reducedMotion ?? false });
  const nextSession = animationPlan.accepted ? sessionFromPlan(state.session, animationPlan) : state.session;
  const accepted = nextSession !== state.session;
  return {
    state: { ...state, session: nextSession, selected: null, preview: null, panCommitted: accepted },
    accepted,
    animationPlan,
  };
}

export function useGameController(initialSession: GameSession) {
  const [state, setState] = useState(() => createGameControllerState(initialSession));
  const tap = useCallback((coord: Coord) => {
    let result: ControllerResult;
    setState((current) => {
      result = tapTile(current, coord);
      return result.state;
    });
  }, []);
  const updateGesture = useCallback((from: Coord, dx: number, dy: number, pitch: number) => {
    setState((current) => updatePan(current, from, dx, dy, pitch));
  }, []);
  const releaseGesture = useCallback(() => {
    setState((current) => releasePan(current).state);
  }, []);
  return useMemo(() => ({ state, tap, updateGesture, releaseGesture }), [state, tap, updateGesture, releaseGesture]);
}

function canAcceptInput(state: GameControllerState): boolean {
  return state.session.phase === 'idle';
}

function sessionFromPlan(session: GameSession, plan: MoveAnimationPlan): GameSession {
  const lastPhase = plan.resolution.phases.at(-1);
  return {
    ...session,
    board: plan.resolution.board,
    score: session.score + plan.resolution.scoreDelta,
    bestCascade: Math.max(session.bestCascade, ...plan.resolution.phases.map((phase) => phase.cascade)),
    clearedTiles: session.clearedTiles + plan.resolution.phases.reduce((sum, phase) => sum + new Set(phase.cleared.map(({ row, col }) => `${row},${col}`)).size, 0),
    backgroundColor: lastPhase?.backgroundColor ?? session.backgroundColor,
    phase: 'idle',
    randomState: plan.randomState,
    tileIdCounter: plan.tileIdCounter,
  };
}

function neighbor(coord: Coord, direction: Direction): Coord {
  switch (direction) {
    case 'up': return { row: coord.row - 1, col: coord.col };
    case 'down': return { row: coord.row + 1, col: coord.col };
    case 'left': return { row: coord.row, col: coord.col - 1 };
    case 'right': return { row: coord.row, col: coord.col + 1 };
  }
}

function directionBetween(from: Coord, to: Coord): Direction | null {
  if (to.row === from.row - 1 && to.col === from.col) return 'up';
  if (to.row === from.row + 1 && to.col === from.col) return 'down';
  if (to.row === from.row && to.col === from.col - 1) return 'left';
  if (to.row === from.row && to.col === from.col + 1) return 'right';
  return null;
}

function isBoardCoord(coord: Coord): boolean {
  return coord.row >= 0 && coord.row < 6 && coord.col >= 0 && coord.col < 6;
}

function sameCoord(first: Coord, second: Coord): boolean {
  return first.row === second.row && first.col === second.col;
}
