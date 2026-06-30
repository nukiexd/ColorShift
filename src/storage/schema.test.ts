import { commitMove, createSession, xpForScore } from '../game/session';
import { createDefaultState, parsePersistedState } from './schema';
import { MAX_LEVEL, MAX_SCORE, MAX_TILE_ID_COUNTER, MAX_TILE_IDS_PER_MOVE, MAX_XP } from '../game/balance';
import { Board, Tile, TileColor } from '../game/model';
import { findLegalMoves } from '../game/board';

const deadColors: TileColor[][] = [
  ['coral', 'sky', 'mint', 'sun', 'plum', 'coral'],
  ['sky', 'mint', 'sun', 'plum', 'coral', 'sky'],
  ['mint', 'sun', 'plum', 'coral', 'sky', 'mint'],
  ['sun', 'plum', 'coral', 'sky', 'mint', 'sun'],
  ['plum', 'coral', 'sky', 'mint', 'sun', 'plum'],
  ['coral', 'sky', 'mint', 'sun', 'plum', 'coral'],
];

function deadBoard(): Board {
  return deadColors.map((row, rowIndex) => row.map((color, colIndex): Tile => ({ id: `dead-${rowIndex}-${colIndex}`, color, special: null })));
}

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

  test('rejects persisted numeric values beyond domain limits', () => {
    const state = createDefaultState();
    expect(parsePersistedState({ ...state, profile: { ...state.profile, level: MAX_LEVEL + 1, xp: MAX_XP + 1, bestScore: MAX_SCORE + 1 } }).profile).toEqual(state.profile);
    expect(parsePersistedState({ ...state, activeSession: { ...createSession(7), tileIdCounter: MAX_TILE_ID_COUNTER } }).activeSession).toBeNull();
  });

  test('restores a near-exhausted allocator without crashing on the next valid move', () => {
    const session = createSession(2);
    const restored = parsePersistedState({
      ...createDefaultState(),
      activeSession: { ...session, tileIdCounter: MAX_TILE_ID_COUNTER - 1 },
    }).activeSession;
    expect(restored).not.toBeNull();
    const [from, to] = findLegalMoves(restored!.board)[0];
    let next!: ReturnType<typeof commitMove>;
    expect(() => { next = commitMove(restored!, from, to); }).not.toThrow();
    expect(next.tileIdNamespace).not.toBe(restored!.tileIdNamespace);
    expect(next.tileIdCounter).toBeLessThan(MAX_TILE_ID_COUNTER);
    const ids = next.board.flatMap((row) => row.map((tile) => tile!.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('rolls the allocator namespace at the exact per-move reserve boundary', () => {
    const session = createSession(2);
    const restored = parsePersistedState({
      ...createDefaultState(),
      activeSession: { ...session, tileIdCounter: MAX_TILE_ID_COUNTER - MAX_TILE_IDS_PER_MOVE },
    }).activeSession!;
    const [from, to] = findLegalMoves(restored.board)[0];
    const next = commitMove(restored, from, to);
    expect(next.tileIdNamespace).not.toBe(restored.tileIdNamespace);
  });

  test('rejects session identities too long for a bounded rollover namespace', () => {
    const session = createSession(2);
    const restored = parsePersistedState({
      ...createDefaultState(),
      activeSession: { ...session, sessionId: 's'.repeat(64), tileIdCounter: MAX_TILE_ID_COUNTER - 1 },
    }).activeSession;
    expect(restored).toBeNull();
  });

  test('keeps an engine session persistable when scoring reaches the runtime ceiling', () => {
    const session = { ...createSession(2), score: MAX_SCORE - 100 };
    const [from, to] = findLegalMoves(session.board)[0];
    const next = commitMove(session, from, to);
    expect(next.score).toBe(MAX_SCORE);
    expect(xpForScore(next.score)).toBe(Math.floor(10 * Math.sqrt(next.score / 1000)));
    const restored = parsePersistedState({ ...createDefaultState(), activeSession: next }).activeSession;
    expect(restored).toEqual(next);
  });

  test('drops matched and dead active boards while preserving other segments', () => {
    const state = createDefaultState();
    const profile = { nickname: 'Лиса', level: 2, xp: 3, bestScore: 400 };
    const settings = { effectsVolume: 0.7, haptics: false, reducedMotion: true };
    const matched = createSession(3).board.map((row) => row.map((tile) => ({ ...tile! })));
    matched[0][0].color = 'coral';
    matched[0][1].color = 'coral';
    matched[0][2].color = 'coral';
    for (const board of [matched, deadBoard()]) {
      const parsed = parsePersistedState({ ...state, profile, settings, activeSession: { ...createSession(3), board } });
      expect(parsed).toMatchObject({ profile, settings, activeSession: null });
    }
  });
});
