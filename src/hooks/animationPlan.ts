import { Coord, MoveResolution } from '../game/model';
import { createSeededRandom, createTileIdSource } from '../game/random';
import { resolveMove } from '../game/resolve';
import { GameSession } from '../game/session';
import { SwapPreview } from './useGameController';

export type AnimationStepType = 'swap' | 'swapBack' | 'clear' | 'fall' | 'refill' | 'shuffle';

export interface PreviewOffsets {
  readonly held: { readonly x: number; readonly y: number };
  readonly neighbor: { readonly x: number; readonly y: number };
  readonly durationMs: number;
}

export interface AnimationStep {
  readonly type: AnimationStepType;
  readonly cascade: number;
  readonly durationMs: number;
  readonly clearedCount?: number;
  readonly scoreDelta?: number;
}

export interface MoveAnimationPlan {
  readonly accepted: boolean;
  readonly swap?: SwapPreview;
  readonly boardBeforeMove: GameSession['board'];
  readonly resolution: MoveResolution;
  readonly steps: readonly AnimationStep[];
  readonly randomState: number;
  readonly tileIdCounter: number;
}

interface AnimationPlanOptions {
  readonly reducedMotion: boolean;
}

export function previewOffsets(preview: SwapPreview, pitch: number): PreviewOffsets {
  return {
    held: { x: 0, y: 0 },
    neighbor: {
      x: (preview.from.col - preview.to.col) * pitch,
      y: (preview.from.row - preview.to.row) * pitch,
    },
    durationMs: 180,
  };
}

export function buildMoveAnimationPlan(session: GameSession, from: Coord, to: Coord, options: AnimationPlanOptions): MoveAnimationPlan {
  const random = createSeededRandom(session.randomState);
  const tileIds = createTileIdSource(session.tileIdCounter, session.tileIdNamespace);
  const resolution = resolveMove(session.board, from, to, random, tileIds);
  if (!resolution.accepted) {
    return {
      accepted: false,
      swap: { from, to },
      boardBeforeMove: session.board,
      resolution,
      steps: [
        { type: 'swap', cascade: 0, durationMs: duration('swap', options.reducedMotion) },
        { type: 'swapBack', cascade: 0, durationMs: duration('swapBack', options.reducedMotion) },
      ],
      randomState: session.randomState,
      tileIdCounter: session.tileIdCounter,
    };
  }

  const steps: AnimationStep[] = [{ type: 'swap', cascade: 0, durationMs: duration('swap', options.reducedMotion) }];
  for (const phase of resolution.phases) {
    steps.push({
      type: 'clear',
      cascade: phase.cascade,
      durationMs: duration('clear', options.reducedMotion),
      clearedCount: phase.cleared.length,
      scoreDelta: phase.scoreDelta,
    });
    steps.push({ type: 'fall', cascade: phase.cascade, durationMs: duration('fall', options.reducedMotion) });
    steps.push({ type: 'refill', cascade: phase.cascade, durationMs: duration('refill', options.reducedMotion) });
  }
  if (resolution.shuffled) steps.push({ type: 'shuffle', cascade: resolution.phases.at(-1)?.cascade ?? 0, durationMs: duration('shuffle', options.reducedMotion) });
  return { accepted: true, swap: { from, to }, boardBeforeMove: session.board, resolution, steps, randomState: random.getState(), tileIdCounter: tileIds.getCounter() };
}

function duration(type: AnimationStepType, reducedMotion: boolean): number {
  if (reducedMotion) return 80;
  switch (type) {
    case 'swap': return 180;
    case 'swapBack': return 120;
    case 'clear': return 160;
    case 'fall':
    case 'refill': return 220;
    case 'shuffle': return 220;
  }
}
