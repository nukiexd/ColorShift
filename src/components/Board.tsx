import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Board, Coord } from '../game/model';
import { GameSession } from '../game/session';
import { MoveAnimationPlan, AnimationStep, previewOffsets } from '../hooks/animationPlan';
import { SwapPreview } from '../hooks/useGameController';
import { colors, radii } from '../ui/tokens';
import { TileView } from './Tile';

export interface BoardLayout {
  readonly gutter: number;
  readonly boardPadding: number;
  readonly gap: number;
  readonly available: number;
  readonly tileSize: number;
  readonly pitch: number;
  readonly boardSize: number;
}

interface BoardViewProps {
  readonly session: GameSession;
  readonly width: number;
  readonly selected?: Coord | null;
  readonly preview?: SwapPreview | null;
  readonly animationPlan?: MoveAnimationPlan | null;
  readonly onTapTile: (coord: Coord) => void;
  readonly onPanMove?: (coord: Coord, dx: number, dy: number, pitch: number) => void;
  readonly onPanRelease?: () => void;
  readonly onAnimationPlanComplete?: (plan: MoveAnimationPlan) => void;
}

export function calculateBoardLayout(width: number): BoardLayout {
  const gutter = width < 380 ? 12 : 20;
  const boardPadding = width < 380 ? 8 : 12;
  const gap = 4;
  const available = Math.min(width - gutter * 2 - boardPadding * 2, 356);
  const tileSize = Math.min(56, Math.floor((available - gap * 5) / 6));
  const pitch = tileSize + gap;
  return { gutter, boardPadding, gap, available, tileSize, pitch, boardSize: tileSize * 6 + gap * 5 + boardPadding * 2 };
}

export function BoardView({
  session,
  width,
  selected = null,
  preview = null,
  animationPlan = null,
  onTapTile,
  onPanMove,
  onPanRelease,
  onAnimationPlanComplete,
}: BoardViewProps) {
  const layout = calculateBoardLayout(width);
  const [playback, setPlayback] = useState<{ readonly plan: MoveAnimationPlan | null; readonly stepIndex: number }>({ plan: null, stepIndex: 0 });
  const completedPlanRef = useRef<MoveAnimationPlan | null>(null);
  const stepIndex = playback.plan === animationPlan ? playback.stepIndex : 0;
  const activeStep = animationPlan?.steps[stepIndex] ?? null;
  const resolving = Boolean(animationPlan && animationPlan.steps.length > 0 && activeStep);
  const board = activeStep && animationPlan ? boardForAnimationStep(session.board, animationPlan, activeStep) : session.board;
  const tileGestures = new Map<string, ReturnType<typeof PanResponder.create>['panHandlers']>();

  useEffect(() => {
    if (!animationPlan || !activeStep) return undefined;
    const timer = setTimeout(() => {
      if (stepIndex >= animationPlan.steps.length - 1) {
        if (completedPlanRef.current !== animationPlan) {
          completedPlanRef.current = animationPlan;
          onAnimationPlanComplete?.(animationPlan);
        }
      } else {
        setPlayback({ plan: animationPlan, stepIndex: stepIndex + 1 });
      }
    }, activeStep.durationMs);
    return () => clearTimeout(timer);
  }, [activeStep, animationPlan, onAnimationPlanComplete, stepIndex]);

  return (
    <View style={[styles.board, { width: layout.boardSize, height: layout.boardSize, padding: layout.boardPadding }]}>
      {board.map((row, rowIndex) => row.map((tile, colIndex) => tile ? (
        <TileView
          key={tile.id}
          color={tile.color}
          special={tile.special}
          coord={{ row: rowIndex, col: colIndex }}
          size={layout.tileSize}
          selected={selected?.row === rowIndex && selected.col === colIndex}
          disabled={resolving}
          style={tileStyle(rowIndex, colIndex, layout, preview, resolving)}
          gestureHandlers={tileGestureHandlers(tileGestures, { row: rowIndex, col: colIndex }, resolving, layout.pitch, onPanMove, onPanRelease)}
          onPress={(coord) => {
            if (!resolving) onTapTile(coord);
          }}
        />
      ) : null))}
    </View>
  );
}

function tileStyle(row: number, col: number, layout: BoardLayout, preview: SwapPreview | null, resolving: boolean) {
  const offset = !resolving && preview && preview.to.row === row && preview.to.col === col
    ? previewOffsets(preview, layout.pitch).neighbor
    : { x: 0, y: 0 };
  return {
    position: 'absolute' as const,
    left: layout.boardPadding + col * layout.pitch,
    top: layout.boardPadding + row * layout.pitch,
    transform: [{ translateX: offset.x }, { translateY: offset.y }],
  };
}

function tileGestureHandlers(
  cache: Map<string, ReturnType<typeof PanResponder.create>['panHandlers']>,
  coord: Coord,
  resolving: boolean,
  pitch: number,
  onPanMove?: (coord: Coord, dx: number, dy: number, pitch: number) => void,
  onPanRelease?: () => void,
) {
  const key = `${coord.row},${coord.col}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !resolving,
    onMoveShouldSetPanResponder: (_, gesture) => !resolving && Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) > 3,
    onPanResponderMove: (_, gesture) => {
      if (!resolving) onPanMove?.(coord, gesture.dx, gesture.dy, pitch);
    },
    onPanResponderRelease: () => {
      if (!resolving) onPanRelease?.();
    },
    onPanResponderTerminate: () => {
      if (!resolving) onPanRelease?.();
    },
  }).panHandlers;
  cache.set(key, responder);
  return responder;
}

function boardForAnimationStep(fallback: Board, plan: MoveAnimationPlan, step: AnimationStep): Board {
  const phase = plan.resolution.phases.find((candidate) => candidate.cascade === step.cascade) ?? plan.resolution.phases.at(-1);
  switch (step.type) {
    case 'swap':
      return plan.resolution.phases[0]?.boardBefore ?? fallback;
    case 'clear':
      return phase?.boardAfterClear ?? fallback;
    case 'fall':
      return phase?.boardAfterGravity ?? fallback;
    case 'refill':
      return phase?.boardAfterRefill ?? plan.resolution.board;
    case 'shuffle':
      return plan.resolution.board;
  }
}

const styles = StyleSheet.create({
  board: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
});
