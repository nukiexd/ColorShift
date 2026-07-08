import { fireEvent, render } from '@testing-library/react-native';
import { createSession } from '../game/session';
import { MoveAnimationPlan } from '../hooks/animationPlan';
import { BoardView, calculateBoardLayout } from './Board';

describe('BoardView', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('calculates compact responsive geometry with 56px tile cap', () => {
    expect(calculateBoardLayout(360)).toMatchObject({ gutter: 12, boardPadding: 8, gap: 4, tileSize: 50, pitch: 54 });
    expect(calculateBoardLayout(430)).toMatchObject({ gutter: 20, boardPadding: 12, gap: 4, tileSize: 56, pitch: 60 });
  });

  test('renders all cells with color-independent accessibility labels', async () => {
    const session = createSession(3);
    const view = await render(<BoardView session={session} width={360} onTapTile={jest.fn()} />);
    const firstColor = session.board[0][0]!.color;

    expect(view.getAllByRole('button')).toHaveLength(36);
    expect(view.getByLabelText(`Блок ${firstColor}, строка 1, столбец 1`)).toBeTruthy();
    expect(view.queryByText(/[◆●■▲✦]/)).toBeNull();
  });

  test('shows marks only for special tiles', async () => {
    const session = createSession(3);
    const board = session.board.map((row, rowIndex) => row.map((tile, colIndex) => {
      if (!tile) return tile;
      return rowIndex === 0 && colIndex === 0 ? { ...tile, special: 'row' as const } : tile;
    }));
    const view = await render(<BoardView session={{ ...session, board }} width={360} onTapTile={jest.fn()} />);

    expect(view.getByText('↔')).toBeTruthy();
    expect(view.queryByText(/[◆●■▲✦]/)).toBeNull();
  });

  test('renders rainbow as a striped tile without a special icon', async () => {
    const session = createSession(3);
    const board = session.board.map((row, rowIndex) => row.map((tile, colIndex) => {
      if (!tile) return tile;
      return rowIndex === 0 && colIndex === 0 ? { ...tile, special: 'rainbow' as const } : tile;
    }));
    const view = await render(<BoardView session={{ ...session, board }} width={360} onTapTile={jest.fn()} />);

    expect(view.getByTestId('rainbow-tile-0-0')).toBeTruthy();
    expect(view.getByTestId('rainbow-stripe-coral-0-0')).toBeTruthy();
    expect(view.getByTestId('rainbow-stripe-sky-0-0')).toBeTruthy();
    expect(view.getByTestId('rainbow-stripe-mint-0-0')).toBeTruthy();
    expect(view.getByTestId('rainbow-stripe-sun-0-0')).toBeTruthy();
    expect(view.getByTestId('rainbow-stripe-plum-0-0')).toBeTruthy();
    expect(view.getByTestId('rainbow-tile-0-0')).toHaveStyle({ inset: 0 });
    expect(view.queryByText('◎')).toBeNull();
  });

  test('forwards tap events and exposes selected state', async () => {
    const session = createSession(3);
    const onTapTile = jest.fn();
    const view = await render(<BoardView session={session} width={360} selected={{ row: 0, col: 0 }} onTapTile={onTapTile} />);
    const firstColor = session.board[0][0]!.color;

    fireEvent.press(view.getByLabelText(`Блок ${firstColor}, строка 1, столбец 1, выбран`));
    expect(onTapTile).toHaveBeenCalledWith({ row: 0, col: 0 });
  });

  test('blocks tile taps while consuming pending animation plan steps', async () => {
    const session = createSession(3);
    const onTapTile = jest.fn();
    const animationPlan: MoveAnimationPlan = {
      accepted: true,
      boardBeforeMove: session.board,
      resolution: { accepted: true, board: session.board, phases: [], scoreDelta: 0, shuffled: false },
      steps: [{ type: 'swap', cascade: 0, durationMs: 180 }],
      randomState: session.randomState,
      tileIdCounter: session.tileIdCounter,
    };
    const view = await render(<BoardView session={session} width={360} animationPlan={animationPlan} onTapTile={onTapTile} />);

    fireEvent.press(view.getAllByRole('button')[0]);
    expect(onTapTile).not.toHaveBeenCalled();
  });

  test('does not visually dim tiles while input is locked by animation', async () => {
    const session = createSession(3);
    const animationPlan: MoveAnimationPlan = {
      accepted: false,
      boardBeforeMove: session.board,
      resolution: { accepted: false, board: session.board, phases: [], scoreDelta: 0, shuffled: false },
      steps: [{ type: 'swapBack', cascade: 0, durationMs: 80 }],
      randomState: session.randomState,
      tileIdCounter: session.tileIdCounter,
    };
    const view = await render(<BoardView session={session} width={360} animationPlan={animationPlan} onTapTile={jest.fn()} />);

    expect(view.getAllByRole('button')[0]).not.toHaveStyle({ opacity: 0.94 });
  });

  test('marks tiles disabled while the session is paused', async () => {
    const session = { ...createSession(3), phase: 'paused' as const };
    const onTapTile = jest.fn();
    const view = await render(<BoardView session={session} width={360} onTapTile={onTapTile} />);

    const firstTile = view.getAllByRole('button')[0];
    expect(firstTile.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(firstTile);
    expect(onTapTile).not.toHaveBeenCalled();
  });

  test('moves only the neighbor tile during stationary swap preview', async () => {
    const session = createSession(3);
    const view = await render(
      <BoardView
        session={session}
        width={360}
        preview={{ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } }}
        onTapTile={jest.fn()}
      />,
    );

    expect(view.getByTestId('tile-motion-0-0')).toHaveStyle({ transform: [{ translateX: 0 }, { translateY: 0 }] });
    expect(view.getByTestId('tile-motion-0-1')).toHaveStyle({ transform: [{ translateX: -54 }, { translateY: 0 }] });
  });

  test('notifies when pending animation plan steps are consumed', async () => {
    jest.useFakeTimers();
    const session = createSession(3);
    const onAnimationPlanComplete = jest.fn();
    const animationPlan: MoveAnimationPlan = {
      accepted: true,
      boardBeforeMove: session.board,
      resolution: { accepted: true, board: session.board, phases: [], scoreDelta: 0, shuffled: false },
      steps: [{ type: 'swap', cascade: 0, durationMs: 180 }],
      randomState: session.randomState,
      tileIdCounter: session.tileIdCounter,
    };

    await render(
      <BoardView
        session={session}
        width={360}
        animationPlan={animationPlan}
        onTapTile={jest.fn()}
        onAnimationPlanComplete={onAnimationPlanComplete}
      />,
    );

    jest.advanceTimersByTime(179);
    expect(onAnimationPlanComplete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onAnimationPlanComplete).toHaveBeenCalledWith(animationPlan);
  });
});
