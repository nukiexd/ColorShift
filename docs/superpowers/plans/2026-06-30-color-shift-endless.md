# Color Shift Endless MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Deliver a polished Expo mobile MVP with a tested 6×6 Endless match-three engine, tracked directional gestures, cascades, specials, adaptive background, local progression, and session restore.

**Architecture:** Keep a deterministic TypeScript engine independent from React Native. A session controller converts engine outcomes into animation phases; Expo Router screens consume versioned local state and focused feedback services. Gesture Handler tracks intent without moving the held tile, while Reanimated renders preview swaps and resolution phases.

**Tech Stack:** Expo SDK 56, React Native, TypeScript, Expo Router, Gesture Handler 3, Reanimated 4, AsyncStorage, expo-audio, expo-haptics, Manrope, Jest, and React Native Testing Library.

---

## File map

- app/_layout.tsx: providers, fonts, status bar, root stack.
- app/index.tsx: home and new/continue actions.
- app/game.tsx: active game route.
- app/results.tsx: completed-session statistics.
- src/game/model.ts: board and resolution types.
- src/game/random.ts: deterministic random source.
- src/game/board.ts: generation, swap, gravity, refill.
- src/game/matches.ts: matching and legal moves.
- src/game/specials.ts: special creation and chained clears.
- src/game/resolve.ts: move resolution, scoring, shuffle.
- src/game/session.ts: pure session state machine.
- src/game/balance.ts: tunable colors, timing, score, gesture, XP.
- src/storage/schema.ts: validation and migration.
- src/storage/repository.ts: AsyncStorage boundary.
- src/state/AppProvider.tsx: profile, settings, active game actions.
- src/components/Board.tsx and Tile.tsx: gestures and animated cells.
- src/components/AdaptiveBackground.tsx: navy base and color glow.
- src/components/GameHud.tsx: score, record, multiplier, pause.
- src/components/sheets/*.tsx: mode, profile, settings, pause, confirmation.
- src/ui/tokens.ts: semantic visual tokens.
- src/feedback/index.ts and assets/audio/*.wav: sounds and haptics.
- src/**/*.test.ts(x): colocated tests.

### Task 1: Scaffold Expo and testing

**Files:**
- Create: package.json, app.json, tsconfig.json, jest.config.js, .gitignore
- Create: app/_layout.tsx, app/index.tsx
- Test: src/smoke.test.ts

- [ ] **Step 1: Scaffold in a verified temporary directory**

    npx.cmd create-expo-app@latest _scaffold --template default
    Copy-Item -Path .\_scaffold\* -Destination . -Recurse -Force
    Copy-Item -Path .\_scaffold\.gitignore -Destination .\.gitignore -Force
    $resolved = (Resolve-Path .\_scaffold).Path
    if ($resolved -ne 'D:\www\ColorShift\_scaffold') { throw "Unexpected path: $resolved" }
    Remove-Item -LiteralPath $resolved -Recurse -Force

Expected: the Expo Router scaffold exists and docs remains intact.

- [ ] **Step 2: Install Expo-compatible dependencies**

    npx.cmd expo install react-native-reanimated react-native-gesture-handler @react-native-async-storage/async-storage expo-audio expo-haptics expo-font @expo-google-fonts/manrope
    npm.cmd install -D jest-expo @testing-library/react-native @types/jest

Expected: both commands exit 0.

- [ ] **Step 3: Configure scripts and environment hygiene**

Set package scripts to:

    {
      "start": "expo start",
      "android": "expo start --android",
      "ios": "expo start --ios",
      "web": "expo start --web",
      "test": "jest --runInBand",
      "typecheck": "tsc --noEmit",
      "lint": "expo lint"
    }

Create jest.config.js:

    module.exports = {
      preset: 'jest-expo',
      testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    };

Append to .gitignore:

    .env
    .env.*
    !.env.example
    coverage/
    .expo/
    dist/

- [ ] **Step 4: Write and prove the smoke test**

Create src/smoke.test.ts:

    describe('project harness', () => {
      it('runs TypeScript tests', () => expect(6 * 6).toBe(36));
    });

Run: npm.cmd test -- src/smoke.test.ts
Expected: one passing test.

- [ ] **Step 5: Verify and commit**

    npm.cmd run typecheck
    npm.cmd run lint
    git add .gitignore package.json package-lock.json app.json tsconfig.json jest.config.js app src assets
    git commit -m "chore: scaffold Expo application"

Expected: checks pass and no environment file is committed.

### Task 2: Board generation, matching, and legal moves

**Files:**
- Create: src/game/model.ts, random.ts, board.ts, matches.ts, balance.ts
- Test: src/game/board.test.ts, matches.test.ts

- [ ] **Step 1: Write failing tests for seeds 1 through 100**

Assert every generated board is 6×6, contains no nulls or immediate matches, and has at least one legal move. Assert diagonal/distant cells are not adjacent and legal moves produce a match containing a swapped coordinate.

- [ ] **Step 2: Run tests and observe module-not-found failure**

Run: npm.cmd test -- src/game/board.test.ts src/game/matches.test.ts
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Define the complete engine contract**

Create model.ts:

    export const BOARD_SIZE = 6;
    export type TileColor = 'coral' | 'sky' | 'mint' | 'sun' | 'plum';
    export type Special = 'row' | 'column' | 'bomb' | 'rainbow' | null;
    export type Coord = Readonly<{ row: number; col: number }>;
    export type Tile = Readonly<{ id: string; color: TileColor; special: Special }>;
    export type Cell = Tile | null;
    export type Board = ReadonlyArray<ReadonlyArray<Cell>>;
    export type MatchGroup = Readonly<{
      color: TileColor;
      orientation: 'horizontal' | 'vertical';
      cells: ReadonlyArray<Coord>;
    }>;
    export type RandomSource = { next(): number };

Export these functions:

    createSeededRandom(seed: number): RandomSource
    getCell(board: Board, coord: Coord): Cell
    setCell(board: Board, coord: Coord, cell: Cell): Board
    areAdjacent(a: Coord, b: Coord): boolean
    swapCells(board: Board, a: Coord, b: Coord): Board
    findMatches(board: Board): MatchGroup[]
    findLegalMoves(board: Board): ReadonlyArray<readonly [Coord, Coord]>
    createBoard(random: RandomSource): Board

Fill row-major while excluding colors that form an immediate three. Scan horizontal then vertical, top-to-bottom and left-to-right. Cap regeneration at 200 attempts and throw a descriptive error if no playable board can be generated.

- [ ] **Step 4: Run all board tests**

Run: npm.cmd test -- src/game/board.test.ts src/game/matches.test.ts
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/game
    git commit -m "feat: add deterministic match-three board engine"

### Task 3: Cascades, specials, scoring, and shuffle

**Files:**
- Create: src/game/specials.ts, resolve.ts
- Modify: src/game/board.ts, model.ts, balance.ts
- Test: src/game/resolve.test.ts, specials.test.ts

- [ ] **Step 1: Write failing fixed-fixture tests**

Cover: three clears for 300; second cascade multiplies by 2; horizontal/vertical four creates row/column stripe at the moved destination; five creates bomb; six creates rainbow; bomb clears clipped 3×3; rainbow swap clears a color; chained overlap scores a coordinate once; dead board shuffles without changing tile IDs or score.

- [ ] **Step 2: Run and observe missing-export failures**

Run: npm.cmd test -- src/game/resolve.test.ts src/game/specials.test.ts
Expected: FAIL.

- [ ] **Step 3: Implement the resolution API**

    export type ClearPhase = Readonly<{
      cascade: number;
      groups: ReadonlyArray<MatchGroup>;
      cleared: ReadonlyArray<Coord>;
      createdSpecial: Readonly<{
        coord: Coord;
        special: Exclude<Special, null>;
      }> | null;
      scoreDelta: number;
      backgroundColor: TileColor;
    }>;

    export type MoveResolution = Readonly<{
      accepted: boolean;
      board: Board;
      phases: ReadonlyArray<ClearPhase>;
      scoreDelta: number;
      shuffled: boolean;
    }>;

    applyGravityAndRefill(board, random): Board
    expandSpecialClears(board, initial, rainbowColor?): Coord[]
    resolveMove(board, from, to, random): MoveResolution
    shuffleToPlayable(board, random): Board

Choose the longest segment, breaking ties with deterministic scan order. Preserve the special anchor, expand effects with a queue and coordinate set, score 100 per unique cleared cell times cascade depth, compact columns downward, and refill with stable new IDs. Shuffle existing tile objects until there are no immediate matches and at least one move.

- [ ] **Step 4: Run the full engine suite**

Run: npm.cmd test -- src/game
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/game
    git commit -m "feat: implement cascades and special tiles"

### Task 4: Session state, persistence, and progression

**Files:**
- Create: src/game/session.ts
- Create: src/storage/schema.ts, repository.ts
- Create: src/state/AppProvider.tsx
- Test: src/game/session.test.ts, src/storage/*.test.ts

- [ ] **Step 1: Write failing session, XP, and corruption tests**

Assert idle-only moves, invalid-move stability, best cascade and cleared counts, and:

    expect(xpForScore(0)).toBe(0);
    expect(xpForScore(1_000)).toBe(10);
    expect(xpForScore(100_000)).toBe(100);
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(5)).toBe(180);

Assert invalid active-session data is discarded while valid profile/settings survive.

- [ ] **Step 2: Run and observe failure**

Run: npm.cmd test -- src/game/session.test.ts src/storage
Expected: FAIL.

- [ ] **Step 3: Implement versioned state**

    export type SessionPhase =
      | 'idle' | 'preview' | 'swapping' | 'clearing'
      | 'falling' | 'shuffling' | 'paused';
    export type GameSession = Readonly<{
      board: Board;
      score: number;
      bestCascade: number;
      clearedTiles: number;
      backgroundColor: TileColor | null;
      phase: SessionPhase;
    }>;
    export type Profile = Readonly<{
      nickname: string;
      level: number;
      xp: number;
      bestScore: number;
    }>;
    export type Settings = Readonly<{
      effectsVolume: number;
      haptics: boolean;
      reducedMotion: boolean;
    }>;

Export createSession, commitMove, xpForScore, xpRequiredForLevel, applyXp, parsePersistedState, loadState, saveState. Use AsyncStorage key color-shift/state/v1. Clamp nickname to 2–16 trimmed characters and volume to 0–1. Persist only idle/paused sessions.

- [ ] **Step 4: Implement AppProvider and pass tests**

Expose startGame, continueGame, settleSession, finishGame, discardAndStart, updateNickname, and updateSettings. Finish awards XP, carries excess across multiple levels, updates the record, and clears the session.

Run: npm.cmd test -- src/game/session.test.ts src/storage
Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/game/session* src/storage src/state
    git commit -m "feat: persist sessions and local progression"

### Task 5: Visual system and home flows

**Files:**
- Create: src/ui/tokens.ts, src/components/PlayerCard.tsx, PrimaryButton.tsx
- Create: src/components/sheets/ModeSheet.tsx, ProfileSheet.tsx, SettingsSheet.tsx, ConfirmSheet.tsx
- Modify: app/_layout.tsx, app/index.tsx
- Test: src/components/home.test.tsx

- [ ] **Step 1: Generate design guidance before final token selection**

    python .codex/skills/ui-ux-pro-max/scripts/search.py "mobile match three calm minimal dark all ages" --design-system --persist -p "Color Shift"
    python .codex/skills/ui-ux-pro-max/scripts/search.py "gesture accessibility animation dark mode" --domain ux
    python .codex/skills/ui-ux-pro-max/scripts/search.py "safe areas touch targets" --stack react-native

Expected: design-system/MASTER.md exists. Approved product direction overrides stylistic conflicts.

- [ ] **Step 2: Write failing home tests**

Assert “Новая игра”, “Настройки”, nickname and level; mode-sheet opening; two disabled “Скоро” modes; profile editing; nickname validation; and conditional “Продолжить”.

- [ ] **Step 3: Create semantic tokens**

    export const colors = {
      background: '#071426',
      surface: '#10233A',
      surfaceRaised: '#162C45',
      text: '#F4F7FB',
      textMuted: '#AAB8CA',
      coral: '#D96B68',
      sky: '#67A9C9',
      mint: '#71B797',
      sun: '#D8B65F',
      plum: '#9A729E',
      focus: '#DCE8F7',
    } as const;
    export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
    export const radii = { control: 14, tile: 16, sheet: 28 } as const;

Load Manrope before hiding splash; wrap routes in GestureHandlerRootView and AppProvider. All controls use at least 48×48 dp targets, semantic roles, visible press states, and one outline icon family.

- [ ] **Step 4: Implement sheets and pass home tests**

Profile edits nickname and shows a disabled avatar. Settings include effects volume, haptics, and reduced motion. Mode picker enables Endless and disables the other two.

Run: npm.cmd test -- src/components/home.test.tsx
Expected: PASS.

- [ ] **Step 5: Commit**

    git add app src/ui src/components design-system
    git commit -m "feat: add Color Shift home experience"

### Task 6: Animated board and tracked gesture

**Files:**
- Create: src/components/AdaptiveBackground.tsx, Board.tsx, Tile.tsx, GameHud.tsx
- Create: src/hooks/useGameController.ts
- Modify: app/game.tsx
- Test: src/components/Board.test.tsx, src/hooks/useGameController.test.ts

- [ ] **Step 1: Write failing gesture-policy and controller tests**

    expect(gestureIntent(10, 0, 56, null)).toBeNull();
    expect(gestureIntent(18, 3, 56, null)).toBe('right');
    expect(gestureIntent(10, 0, 56, 'right')).toBeNull();
    expect(gestureIntent(-20, 2, 56, null)).toBe('left');

Also test tap selection/reselection/deselection, adjacent commit, one pan swap, invalid rollback, and non-idle input rejection.

- [ ] **Step 2: Run and observe failure**

Run: npm.cmd test -- src/components/Board.test.tsx src/hooks/useGameController.test.ts
Expected: FAIL.

- [ ] **Step 3: Implement responsive geometry and tiles**

    const gutter = width < 380 ? 12 : 20;
    const boardPadding = width < 380 ? 8 : 12;
    const gap = 4;
    const available = Math.min(width - gutter * 2 - boardPadding * 2, 356);
    const tileSize = Math.min(56, Math.floor((available - gap * 5) / 6));
    const pitch = tileSize + gap;

Render cells with absolute positions and stable IDs. Add a distinct inset mark per color. Accessibility labels include color, row, column, and special.

- [ ] **Step 4: Implement gesture and animation phases**

Keep the held tile still. At 32% of pitch, animate the pair into preview over 180 ms. Below 24%, animate back. Release commits at most one neighbor. Await swap, clear, fall, refill, and shuffle phases before persisting and unlocking input. AdaptiveBackground keeps navy fixed and crossfades an 18–24% glow. Reduced motion uses 80 ms opacity changes and no scale.

- [ ] **Step 5: Verify and commit**

    npm.cmd test -- src/components/Board.test.tsx src/hooks/useGameController.test.ts
    npm.cmd run typecheck
    git add app/game.tsx src/components src/hooks
    git commit -m "feat: add animated game board and gestures"

Expected: tests and typecheck pass.

### Task 7: Pause, results, feedback, and restore

**Files:**
- Create: src/components/sheets/PauseSheet.tsx, src/feedback/index.ts, app/results.tsx
- Create: assets/audio/swap.wav, match.wav, cascade.wav, special.wav, shuffle.wav
- Modify: app/game.tsx, app/index.tsx, src/state/AppProvider.tsx
- Test: src/components/sessionFlows.test.tsx, src/feedback/index.test.ts

- [ ] **Step 1: Write failing flow tests**

Cover pause/continue, confirmed restart, finish to results, XP and record update, active-session restore, settled-state persistence, mocked audio, disabled haptics, and cascade tone depth.

- [ ] **Step 2: Run and observe failure**

Run: npm.cmd test -- src/components/sessionFlows.test.tsx src/feedback/index.test.ts
Expected: FAIL.

- [ ] **Step 3: Implement feedback service**

Create original local WAVs: swap ≤100 ms, match ≤220 ms, cascade ≤250 ms, special ≤350 ms, shuffle ≤300 ms, normalized conservatively.

    export type FeedbackCue =
      | 'swap' | 'match' | 'cascade' | 'special' | 'shuffle';
    export type Feedback = {
      preload(): Promise<void>;
      play(cue: FeedbackCue, cascadeDepth?: number): void;
      lightImpact(): void;
    };

Scale playback by settings, cap cascade pitch after depth 5, and contain device-audio errors.

- [ ] **Step 4: Implement flows and pass tests**

Pause sets paused phase. Restart only clears after confirmation. Finish sends immutable result statistics, clears active session, and applies carried XP. Home waits for hydration before showing Continue.

Run: npm.cmd test -- src/components/sessionFlows.test.tsx src/feedback/index.test.ts
Expected: PASS.

- [ ] **Step 5: Commit**

    git add app src assets/audio
    git commit -m "feat: add pause results and game feedback"

### Task 8: Accessibility, device QA, and release verification

**Files:**
- Modify: app/_layout.tsx, app/index.tsx, app/game.tsx, app/results.tsx
- Modify: src/components/Board.tsx, Tile.tsx, GameHud.tsx, AdaptiveBackground.tsx
- Modify: src/components/sheets/ModeSheet.tsx, ProfileSheet.tsx, SettingsSheet.tsx, PauseSheet.tsx
- Modify: src/state/AppProvider.tsx, src/feedback/index.ts, src/ui/tokens.ts
- Create: README.md

- [ ] **Step 1: Run automated verification**

    npm.cmd test -- --coverage
    npm.cmd run typecheck
    npm.cmd run lint
    npx.cmd expo export --platform web
    npx.cmd expo-doctor

Expected: tests, checks, export, and Doctor pass without actionable errors.

- [ ] **Step 2: Inspect repository hygiene**

    git status --short
    git ls-files | Select-String -Pattern '(^|/)\.env($|\.)'

Expected: no environment file is tracked.

- [ ] **Step 3: Perform manual device checks**

At 360×800, 390×844, and 430×932 verify: full board fits; safe areas work; controls are ≥44 points; marks distinguish colors; tap and pan preview/cancel/commit work; rapid input cannot interrupt cascades; pause/restore/restart/finish work; reduced motion persists.

- [ ] **Step 4: Document development and controls**

README must include Node/npm prerequisites, install/start/platform/test commands, drag thresholds, tap alternative, local persistence, MVP exclusions, and a warning never to commit .env files.

- [ ] **Step 5: Re-run and commit the release candidate**

    npm.cmd test
    npm.cmd run typecheck
    npm.cmd run lint
    npx.cmd expo export --platform web
    git add README.md app src assets package.json package-lock.json app.json tsconfig.json design-system
    git commit -m "chore: verify Endless MVP release candidate"
    git status --short

Expected: every check passes and only the pre-existing untracked .codex directory remains.
