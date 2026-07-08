import { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, View } from 'react-native';
import { Board, Coord, Tile } from '../game/model';
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
  const [progress] = useState(() => new Animated.Value(1));
  const stepIndex = playback.plan === animationPlan ? playback.stepIndex : 0;
  const activeStep = animationPlan?.steps[stepIndex] ?? null;
  const resolving = Boolean(animationPlan && animationPlan.steps.length > 0 && activeStep);
  const inputDisabled = resolving || session.phase !== 'idle';
  const board = activeStep && animationPlan ? boardForAnimationStep(session.board, animationPlan, activeStep) : session.board;

  useLayoutEffect(() => {
    if (!animationPlan || !activeStep) return undefined;
    if (process.env.NODE_ENV !== 'test') {
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: activeStep.durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
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
  }, [activeStep, animationPlan, onAnimationPlanComplete, progress, stepIndex]);

  return (
    <View style={[styles.board, { width: layout.boardSize, height: layout.boardSize, padding: layout.boardPadding }]}>
      {board.map((row, rowIndex) => row.map((tile, colIndex) => tile ? (
        <Animated.View
          key={tile.id}
          testID={`tile-motion-${rowIndex}-${colIndex}`}
          style={tileStyle(rowIndex, colIndex, tile, layout, preview, inputDisabled, animationPlan, activeStep, progress)}
          {...tileGestureHandlers({ row: rowIndex, col: colIndex }, inputDisabled, layout.pitch, onPanMove, onPanRelease)}
        >
          <TileView
            color={tile.color}
            special={tile.special}
            coord={{ row: rowIndex, col: colIndex }}
            size={layout.tileSize}
            selected={selected?.row === rowIndex && selected.col === colIndex}
            disabled={inputDisabled}
            onPress={(coord) => {
              if (!inputDisabled) onTapTile(coord);
            }}
          />
        </Animated.View>
      ) : null))}
    </View>
  );
}

function tileStyle(
  row: number,
  col: number,
  tile: Tile,
  layout: BoardLayout,
  preview: SwapPreview | null,
  resolving: boolean,
  plan: MoveAnimationPlan | null,
  step: AnimationStep | null,
  progress: Animated.Value,
) {
  const offset = !resolving && preview && preview.to.row === row && preview.to.col === col
    ? previewOffsets(preview, layout.pitch).neighbor
    : { x: 0, y: 0 };
  const animated = step && plan ? animationStyleForTile(tile, { row, col }, layout.pitch, plan, step, progress) : {};
  return {
    position: 'absolute' as const,
    left: layout.boardPadding + col * layout.pitch,
    top: layout.boardPadding + row * layout.pitch,
    transform: [{ translateX: offset.x }, { translateY: offset.y }],
    ...animated,
  };
}

function tileGestureHandlers(
  coord: Coord,
  resolving: boolean,
  pitch: number,
  onPanMove?: (coord: Coord, dx: number, dy: number, pitch: number) => void,
  onPanRelease?: () => void,
) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => !resolving && Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) > 3,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      if (!resolving) onPanMove?.(coord, gesture.dx, gesture.dy, pitch);
    },
    onPanResponderRelease: () => {
      if (!resolving) onPanRelease?.();
    },
    onPanResponderTerminate: () => {
      if (!resolving) onPanRelease?.();
    },
    onShouldBlockNativeResponder: () => true,
  }).panHandlers;
}

function boardForAnimationStep(fallback: Board, plan: MoveAnimationPlan, step: AnimationStep): Board {
  const phase = plan.resolution.phases.find((candidate) => candidate.cascade === step.cascade) ?? plan.resolution.phases.at(-1);
  switch (step.type) {
    case 'swap':
    case 'swapBack':
      return plan.boardBeforeMove ?? fallback;
    case 'clear':
      return phase?.boardBefore ?? fallback;
    case 'fall':
      return phase?.boardAfterGravity ?? fallback;
    case 'refill':
      return phase?.boardAfterRefill ?? plan.resolution.board;
    case 'shuffle':
      return plan.resolution.board;
  }
}

function animationStyleForTile(
  tile: Tile,
  coord: Coord,
  pitch: number,
  plan: MoveAnimationPlan,
  step: AnimationStep,
  progress: Animated.Value,
) {
  const phase = plan.resolution.phases.find((candidate) => candidate.cascade === step.cascade) ?? plan.resolution.phases.at(-1);
  if (step.type === 'swap' || step.type === 'swapBack') {
    return swapAnimation(tile.id, coord, pitch, plan, progress, step.type);
  }
  if (step.type === 'clear' && phase && hasCoord(phase.cleared, coord)) {
    return {
      opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) },
      ],
    };
  }
  if (step.type === 'fall' && phase) {
    const before = findTileCoord(phase.boardAfterClear, tile.id);
    if (before) {
      return {
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [(before.row - coord.row) * pitch, 0] }) },
        ],
      };
    }
  }
  if (step.type === 'refill' && phase && !findTileCoord(phase.boardAfterGravity, tile.id)) {
    return {
      opacity: progress,
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-pitch, 0] }) },
      ],
    };
  }
  if (step.type === 'shuffle') {
    return {
      opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.64, 1] }),
      transform: [
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      ],
    };
  }
  return {};
}

function swapAnimation(tileId: string, coord: Coord, pitch: number, plan: MoveAnimationPlan, progress: Animated.Value, type: 'swap' | 'swapBack') {
  if (!plan.swap) return {};
  const fromTile = plan.boardBeforeMove[plan.swap.from.row]?.[plan.swap.from.col];
  const toTile = plan.boardBeforeMove[plan.swap.to.row]?.[plan.swap.to.col];
  const final = fromTile?.id === tileId ? plan.swap.to : toTile?.id === tileId ? plan.swap.from : null;
  if (!final) return {};
  const x = (final.col - coord.col) * pitch;
  const y = (final.row - coord.row) * pitch;
  return {
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: type === 'swap' ? [0, x] : [x, 0] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: type === 'swap' ? [0, y] : [y, 0] }) },
    ],
  };
}

function findTileCoord(board: Board, tileId: string): Coord | null {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col]?.id === tileId) return { row, col };
    }
  }
  return null;
}

function hasCoord(coords: readonly Coord[], coord: Coord): boolean {
  return coords.some((candidate) => candidate.row === coord.row && candidate.col === coord.col);
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
