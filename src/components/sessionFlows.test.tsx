import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app';
import GameScreen from '../app/game';
import ResultsScreen from '../app/results';
import { createSession } from '../game/session';
import { AppProvider } from '../state/AppProvider';
import { createDefaultState } from '../storage/schema';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('../feedback', () => ({
  createFeedback: jest.fn(() => ({ preload: jest.fn(), play: jest.fn(), lightImpact: jest.fn() })),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
    await Promise.resolve();
  });
}

describe('Task 7 session flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    storage.setItem.mockResolvedValue(undefined);
    storage.getItem.mockResolvedValue(JSON.stringify(createDefaultState()));
  });

  test('pauses, continues, restarts only after confirmation, and finishes to results', async () => {
    const session = { ...createSession(7), score: 4000, bestCascade: 3, clearedTiles: 18 };
    storage.getItem.mockResolvedValue(JSON.stringify({ ...createDefaultState(), activeSession: session }));
    const game = await render(
      <AppProvider>
        <GameScreen />
      </AppProvider>,
    );

    await waitFor(() => expect(game.getByRole('button', { name: 'Пауза' })).toBeTruthy());
    await press(game.getByRole('button', { name: 'Пауза' }));
    expect(game.getByText('Пауза')).toBeTruthy();

    await press(game.getByRole('button', { name: 'Продолжить' }));
    await waitFor(() => expect(game.queryByText('Пауза')).toBeNull());

    await press(game.getByRole('button', { name: 'Пауза' }));
    await press(game.getByRole('button', { name: 'Начать заново' }));
    expect(game.getByText('Начать заново?')).toBeTruthy();
    await press(game.getByRole('button', { name: 'Отмена' }));
    expect(game.queryByText('Начать заново?')).toBeNull();

    await press(game.getByRole('button', { name: 'Начать заново' }));
    await press(game.getByRole('button', { name: 'Начать новую' }));
    await waitFor(() => expect(game.getByText('0')).toBeTruthy());

    await press(game.getByRole('button', { name: 'Пауза' }));
    await press(game.getByRole('button', { name: 'Завершить игру' }));
    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/results',
      params: expect.objectContaining({ score: '0', xpEarned: '0' }),
    }));
  });

  test('restores a settled active session from home and results present XP and record state', async () => {
    const session = { ...createSession(9), score: 10000, bestCascade: 4, clearedTiles: 36 };
    storage.getItem.mockResolvedValue(JSON.stringify({ ...createDefaultState(), activeSession: session }));
    const home = await render(
      <AppProvider>
        <HomeScreen />
      </AppProvider>,
    );

    await waitFor(() => expect(home.getByRole('button', { name: 'Продолжить' })).toBeTruthy());
    await press(home.getByRole('button', { name: 'Продолжить' }));
    expect(mockPush).toHaveBeenCalledWith('/game');

    mockParams = {
      score: '10000',
      bestCascade: '4',
      clearedTiles: '36',
      xpEarned: '31',
      isNewBest: 'true',
    };
    const results = await render(<ResultsScreen />);

    expect(results.getByText('10000')).toBeTruthy();
    expect(results.getByText('Каскад ×4')).toBeTruthy();
    expect(results.getByText('36 плиток')).toBeTruthy();
    expect(results.getByText('+31 XP')).toBeTruthy();
    expect(results.getByText('Новый рекорд')).toBeTruthy();
  });
});
