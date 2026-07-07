import { fireEvent, render } from '@testing-library/react-native';
import { createSession } from '../game/session';
import { BoardView, calculateBoardLayout } from './Board';

describe('BoardView', () => {
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
    expect(view.getAllByText(/[◆●■▲✦]/).length).toBeGreaterThan(0);
  });

  test('forwards tap events and exposes selected state', async () => {
    const session = createSession(3);
    const onTapTile = jest.fn();
    const view = await render(<BoardView session={session} width={360} selected={{ row: 0, col: 0 }} onTapTile={onTapTile} />);
    const firstColor = session.board[0][0]!.color;

    fireEvent.press(view.getByLabelText(`Блок ${firstColor}, строка 1, столбец 1, выбран`));
    expect(onTapTile).toHaveBeenCalledWith({ row: 0, col: 0 });
  });
});
