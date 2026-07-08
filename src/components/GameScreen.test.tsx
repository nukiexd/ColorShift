import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import GameScreen from '../app/game';
import { tileAccessibilityLabel } from './Tile';
import { findLegalMoves } from '../game/board';
import { createSession } from '../game/session';
import { AppProvider } from '../state/AppProvider';
import { createDefaultState } from '../storage/schema';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('GameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.setItem.mockResolvedValue(undefined);
  });

  test('keeps tap selection on the rendered board and commits adjacent swap', async () => {
    const session = createSession(2);
    const [from, to] = findLegalMoves(session.board)[0];
    storage.getItem.mockResolvedValue(JSON.stringify({ ...createDefaultState(), activeSession: session }));

    const view = await render(
      <AppProvider>
        <GameScreen />
      </AppProvider>,
    );

    await waitFor(() => expect(view.getByText('Счёт')).toBeTruthy());
    fireEvent.press(view.getByLabelText(tileAccessibilityLabel(session.board[from.row][from.col]!.color, null, from, false)));
    await waitFor(() => expect(view.getByLabelText(tileAccessibilityLabel(session.board[from.row][from.col]!.color, null, from, true))).toBeTruthy());

    fireEvent.press(view.getByLabelText(tileAccessibilityLabel(session.board[to.row][to.col]!.color, null, to, false)));
    await waitFor(() => expect(view.queryByLabelText(tileAccessibilityLabel(session.board[from.row][from.col]!.color, null, from, true))).toBeNull());
  });
});
