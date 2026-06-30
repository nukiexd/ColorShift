import { createSession } from '../game/session';
import { createDefaultState, parsePersistedState } from './schema';

describe('persisted state schema', () => {
  test('accepts a valid state and trims a valid nickname', () => {
    const state = createDefaultState();
    expect(parsePersistedState({ ...state, profile: { ...state.profile, nickname: '  Лиса  ' }, activeSession: createSession(3) }))
      .toMatchObject({ profile: { nickname: 'Лиса' }, activeSession: { phase: 'idle' } });
  });

  test('isolates invalid nested segments', () => {
    const state = createDefaultState();
    const parsed = parsePersistedState({
      ...state,
      profile: { nickname: 'x', level: 4, xp: 2, bestScore: 10 },
      settings: { effectsVolume: 2, haptics: false, reducedMotion: true },
      activeSession: { ...createSession(4), board: [] },
    });
    expect(parsed.profile).toEqual(state.profile);
    expect(parsed.settings).toEqual(state.settings);
    expect(parsed.activeSession).toBeNull();
  });

  test('preserves valid non-default profile and settings when only the active session is corrupt', () => {
    const profile = { nickname: '  Лиса  ', level: 4, xp: 72, bestScore: 45000 };
    const settings = { effectsVolume: 0.8, haptics: false, reducedMotion: true };
    const parsed = parsePersistedState({
      version: 1,
      profile,
      settings,
      activeSession: { ...createSession(12), board: [] },
    });
    expect(parsed.profile).toEqual({ ...profile, nickname: 'Лиса' });
    expect(parsed.settings).toEqual(settings);
    expect(parsed.activeSession).toBeNull();
  });

  test('rejects duplicate tile ids and unstable persisted phases', () => {
    const session = createSession(5);
    const board = session.board.map((row) => row.map((tile) => ({ ...tile! })));
    board[0][0].id = board[0][1].id;
    expect(parsePersistedState({ ...createDefaultState(), activeSession: { ...session, board } }).activeSession).toBeNull();
    expect(parsePersistedState({ ...createDefaultState(), activeSession: { ...session, phase: 'clearing' } }).activeSession).toBeNull();
  });

  test('unknown versions safely produce v1 defaults', () => {
    expect(parsePersistedState({ version: 99 })).toEqual(createDefaultState());
  });
});
