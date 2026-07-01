import { fireEvent, render, screen, within } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { AppContextValue, useApp } from '@/state/AppProvider';

jest.mock('@/components/animated-icon', () => ({ AnimatedIcon: () => null }));
jest.mock('@/components/hint-row', () => ({ HintRow: () => null }));
jest.mock('@/components/themed-text', () => {
  const { Text } = jest.requireActual('react-native');
  return { ThemedText: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text> };
});
jest.mock('@/components/themed-view', () => {
  const { View } = jest.requireActual('react-native');
  return { ThemedView: ({ children }: { children?: React.ReactNode }) => <View>{children}</View> };
});
jest.mock('@/components/web-badge', () => ({ WebBadge: () => null }));
jest.mock('@/constants/theme', () => ({ BottomTabInset: 0, MaxContentWidth: 500, Spacing: { three: 12, four: 16 } }));
jest.mock('@/state/AppProvider', () => ({
  useApp: jest.fn(),
}));

const mockedUseApp = jest.mocked(useApp);

function appValue(overrides: Partial<AppContextValue> = {}): AppContextValue {
  return {
    loading: false,
    hydrated: true,
    profile: { nickname: 'Игрок', level: 3, xp: 24, bestScore: 900 },
    settings: { effectsVolume: 0.35, haptics: true, reducedMotion: false },
    activeSession: null,
    startGame: jest.fn(() => null),
    continueGame: jest.fn(() => null),
    settleSession: jest.fn(() => false),
    finishGame: jest.fn(() => null),
    discardAndStart: jest.fn(() => null),
    updateNickname: jest.fn(() => true),
    updateSettings: jest.fn(),
    pauseGame: jest.fn(),
    resumeGame: jest.fn(),
    ...overrides,
  };
}

describe('home flows', () => {
  beforeEach(() => {
    mockedUseApp.mockReturnValue(appValue());
  });

  test('renders the hydrated home identity and primary actions in Russian', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('COLOR SHIFT')).toBeOnTheScreen();
    expect(screen.getByText('Игрок')).toBeOnTheScreen();
    expect(screen.getByText('Уровень 3')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Новая игра' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Настройки' })).toBeEnabled();
  });

  test('opens profile and saves a valid nickname through the provider', async () => {
    const value = appValue();
    mockedUseApp.mockReturnValue(value);
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Открыть профиль' }));
    expect(screen.getByRole('image', { name: 'Аватар недоступен' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Никнейм'), '  Алиса  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Сохранить никнейм' }));

    expect(value.updateNickname).toHaveBeenCalledWith('  Алиса  ');
  });

  test('keeps profile open and announces invalid nickname feedback', async () => {
    mockedUseApp.mockReturnValue(appValue({ updateNickname: jest.fn(() => false) }));
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Открыть профиль' }));
    await fireEvent.changeText(screen.getByLabelText('Никнейм'), 'x');
    await fireEvent.press(screen.getByRole('button', { name: 'Сохранить никнейм' }));

    expect(screen.getByRole('alert')).toHaveTextContent('От 2 до 16 символов');
    expect(screen.getByLabelText('Никнейм')).toBeOnTheScreen();
  });

  test('offers Endless and labels unavailable modes as coming soon', async () => {
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Новая игра' }));

    expect(screen.getByRole('button', { name: 'Бесконечный' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'На время, Скоро' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Разминирование, Скоро' })).toBeDisabled();
    expect(screen.getAllByText('Скоро')).toHaveLength(2);
  });

  test('starts Endless once and closes the mode sheet without an active session', async () => {
    const value = appValue();
    mockedUseApp.mockReturnValue(value);
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Новая игра' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Бесконечный' }));

    expect(value.startGame).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Режим игры')).not.toBeOnTheScreen();
  });

  test('updates volume, haptics, and reduced motion from settings', async () => {
    const value = appValue();
    mockedUseApp.mockReturnValue(value);
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Настройки' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Увеличить громкость эффектов' }));
    await fireEvent(screen.getByRole('switch', { name: 'Тактильный отклик' }), 'valueChange', false);
    await fireEvent(screen.getByRole('switch', { name: 'Уменьшение движения' }), 'valueChange', true);

    expect(value.updateSettings).toHaveBeenNthCalledWith(1, { effectsVolume: 0.45 });
    expect(value.updateSettings).toHaveBeenNthCalledWith(2, { haptics: false });
    expect(value.updateSettings).toHaveBeenNthCalledWith(3, { reducedMotion: true });
  });

  test('gives native settings switches a 48 point interactive target', async () => {
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Настройки' }));

    expect(screen.getByRole('switch', { name: 'Тактильный отклик' })).toHaveStyle({ minWidth: 48, minHeight: 48 });
    expect(screen.getByRole('switch', { name: 'Уменьшение движения' })).toHaveStyle({ minWidth: 48, minHeight: 48 });
  });

  test('continues the active session once', async () => {
    const activeSession = { phase: 'idle' } as AppContextValue['activeSession'];
    const value = appValue({ activeSession });
    mockedUseApp.mockReturnValue(value);
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Продолжить' }));

    expect(value.continueGame).toHaveBeenCalledTimes(1);
  });

  test('shows Continue and confirms replacing an active session', async () => {
    const activeSession = { phase: 'idle' } as AppContextValue['activeSession'];
    const value = appValue({ activeSession });
    mockedUseApp.mockReturnValue(value);
    await render(<HomeScreen />);

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Новая игра' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Бесконечный' }));
    expect(value.discardAndStart).not.toHaveBeenCalled();
    const alert = screen.getByRole('alert', { name: 'Начать заново?' });
    expect(alert).toBeOnTheScreen();
    expect(within(alert).queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Начать заново' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Начать заново' }));
    expect(value.discardAndStart).toHaveBeenCalledTimes(1);
  });

  test('disables all mutating home actions while hydration is pending', async () => {
    mockedUseApp.mockReturnValue(appValue({ loading: true, hydrated: false }));
    await render(<HomeScreen />);

    expect(screen.getByRole('button', { name: 'Новая игра' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Настройки' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Открыть профиль' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Продолжить' })).not.toBeOnTheScreen();
    expect(screen.getByText('Загрузка…')).toBeOnTheScreen();
  });

  test('uses a preferred 48 point target for core controls', async () => {
    await render(<HomeScreen />);
    expect(screen.getByRole('button', { name: 'Новая игра' })).toHaveStyle({ minHeight: 48 });
    expect(screen.getByRole('button', { name: 'Открыть профиль' })).toHaveStyle({ minHeight: 48 });
  });
});
