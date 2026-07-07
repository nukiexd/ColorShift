import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app';
import { AppProvider } from '../state/AppProvider';
import { createDefaultState } from '../storage/schema';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

async function renderHome() {
  const view = await render(
    <AppProvider seedFactory={() => 11}>
      <HomeScreen />
    </AppProvider>,
  );
  await waitFor(() => expect(storage.setItem).toHaveBeenCalled());
  storage.setItem.mockClear();
  return view;
}

async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
    await Promise.resolve();
  });
}

async function changeText(element: Parameters<typeof fireEvent.changeText>[0], value: string) {
  await act(async () => {
    fireEvent.changeText(element, value);
    await Promise.resolve();
  });
}

describe('Color Shift home experience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getItem.mockResolvedValue(JSON.stringify(createDefaultState()));
    storage.setItem.mockResolvedValue(undefined);
  });

  test('shows player progress, opens the Endless-only mode picker and navigates to game', async () => {
    const view = await renderHome();
    await waitFor(() => expect(view.getByText('COLOR SHIFT')).toBeTruthy());

    expect(view.getByText('Игрок')).toBeTruthy();
    expect(view.getAllByText('Уровень 1').length).toBeGreaterThanOrEqual(1);
    expect(view.queryByText('Продолжить')).toBeNull();

    await press(view.getByRole('button', { name: 'Новая игра' }));
    expect(view.getByText('Выбери режим')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Бесконечный режим' })).toBeTruthy();
    expect(view.getByText('На время')).toBeTruthy();
    expect(view.getAllByText('Скоро')).toHaveLength(2);

    await press(view.getByRole('button', { name: 'Бесконечный режим' }));
    await waitFor(() => expect(view.getByText('Продолжить')).toBeTruthy());
    expect(mockPush).toHaveBeenCalledWith('/game');
  });

  test('edits nickname, validates short names and updates settings', async () => {
    const view = await renderHome();
    await waitFor(() => expect(view.getByText('COLOR SHIFT')).toBeTruthy());

    await press(view.getByRole('button', { name: 'Профиль игрока' }));
    await waitFor(() => expect(view.getByPlaceholderText('Никнейм')).toBeTruthy());
    await changeText(view.getByPlaceholderText('Никнейм'), '  Лиса  ');
    await press(view.getByRole('button', { name: 'Сохранить никнейм' }));
    await waitFor(() => expect(view.getByText('Лиса')).toBeTruthy());

    await press(view.getByRole('button', { name: 'Профиль игрока' }));
    await changeText(view.getByPlaceholderText('Никнейм'), 'Я');
    await press(view.getByRole('button', { name: 'Сохранить никнейм' }));
    await waitFor(() => expect(view.getByText('Никнейм должен быть от 2 до 16 символов')).toBeTruthy());

    await press(view.getByRole('button', { name: 'Настройки' }));
    await press(view.getByRole('button', { name: 'Увеличить громкость эффектов' }));
    await press(view.getByRole('switch', { name: 'Вибрация' }));
    await press(view.getByRole('switch', { name: 'Меньше анимации' }));
    await waitFor(() => expect(view.getByText('Громкость 45%')).toBeTruthy());
    expect(view.getByRole('switch', { name: 'Вибрация' }).props.accessibilityState.checked).toBe(false);
    expect(view.getByRole('switch', { name: 'Меньше анимации' }).props.accessibilityState.checked).toBe(true);
  });
});
