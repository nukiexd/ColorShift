# AGENTS.md

## Project

Color Shift is a calm, minimalist match-three mobile game for all ages. The current delivery target is the polished Endless MVP. Time Attack, Demining, custom avatars, cloud accounts, leaderboards, monetization, and background music are outside the current scope.

Before changing code, read:

1. TASKS.md
2. docs/InProgress.md
3. docs/superpowers/specs/2026-06-30-color-shift-endless-design.md
4. docs/superpowers/plans/2026-06-30-color-shift-endless.md

TASKS.md is the short project checklist. docs/InProgress.md is the detailed execution record. Update both when a task changes status.

## Stack

- React Native with Expo SDK 56
- Expo Router with routes under src/app
- TypeScript in strict mode
- React Native Gesture Handler
- React Native Reanimated
- AsyncStorage
- expo-audio and expo-haptics
- Jest with jest-expo
- React Native Testing Library
- Manrope typography

Use npm.cmd and npx.cmd in PowerShell because local script execution policy may block npm.ps1.

## Architecture

Keep responsibilities separated:

- src/game: framework-independent deterministic game engine
- src/storage: versioned validation and persistence boundary
- src/state: application state and linearizable actions
- src/components: reusable visual components
- src/hooks: interaction and animation controllers
- src/feedback: sound and haptic services
- src/ui: semantic design tokens
- src/app: routing and screen composition

The game engine must not import React or React Native. UI components must not reimplement match, scoring, cascade, shuffle, or progression rules.

Prefer small focused files and functional components. Avoid large multipurpose screens, mutable shared state, and unnecessary third-party libraries.

## Game invariants

- Board size is always 6×6.
- A settled board has no immediate matches and at least one legal move.
- Input is accepted only while the session is idle.
- Invalid swaps restore the original state and award no points.
- Cascade score is 100 per unique cleared cell multiplied by cascade depth.
- Special effects never score one coordinate twice in the same phase.
- Persisted sessions are only idle or paused.
- RNG state and TileIdSource state must survive persistence.
- Refill IDs must never be reused within a session.
- Shuffle failure must recover to a valid playable board instead of blocking the session.
- Corrupt session data must not erase a valid profile or settings.

Any change to these invariants requires tests and an update to the approved design.

## Interaction and visual rules

- The held tile does not follow the finger.
- At 32% of cell pitch, the dominant direction starts a swap preview.
- Below 24%, the preview cancels.
- One pan gesture can commit at most one adjacent swap.
- Taps remain a complete alternative input method.
- Maximum tile size is 56×56 with radius 16; smaller screens scale the board down.
- The deep navy base remains visible while a low-opacity match-color glow adapts the background.
- Touch targets are at least 44×44 points, preferably 48×48 dp.
- Color must not be the only way to distinguish tiles.
- Reduced motion must preserve clarity without scale-heavy effects.
- UI copy is Russian. Source identifiers and code comments are English.

## Development workflow

For every feature or fix:

1. Check TASKS.md and docs/InProgress.md.
2. Write or update a failing test first.
3. Confirm the failure is relevant.
4. Implement the smallest correct change.
5. Run targeted tests.
6. Run the full relevant suite, typecheck, and lint.
7. Obtain specification review before quality review.
8. Fix every Critical or Important finding and re-run review.
9. Update TASKS.md and docs/InProgress.md.
10. Commit only intended files and push the feature branch when requested or at the documented checkpoint.

Required commands:

    npm.cmd test
    npm.cmd run typecheck
    npm.cmd run lint
    npx.cmd expo-doctor

Before release also run:

    npx.cmd expo export --platform web

Never claim completion without fresh command output.

## Testing expectations

Tests must cover behavior and dangerous boundaries, not only line execution:

- deterministic fixtures and seed-based generation;
- invalid coordinates and malformed persisted data;
- simultaneous provider actions in one event loop turn;
- stale async callbacks and hydration races;
- numeric limits and termination guarantees;
- session restore with RNG and ID continuity;
- accessibility roles, labels, and disabled states;
- narrow phone layouts and reduced motion.

Avoid broad snapshots when direct assertions are clearer.

## Git and safety

- Never commit .env, .env.*, credentials, access tokens, build output, coverage, or .expo.
- Do not use git add -A in a dirty worktree.
- Preserve unrelated user and agent changes.
- Stage explicit paths.
- Do not reset, discard, or overwrite uncommitted work without explicit permission.
- Do not develop directly on master.
- Use concise conventional commits such as feat:, fix:, test:, docs:, and chore:.
- Do not force-push unless explicitly requested.
- Do not run npm audit fix --force; Expo dependency compatibility takes priority.
- Add dependencies with npx.cmd expo install when an Expo-compatible version is required.

## Documentation rules

- README.md explains the product and how to run it.
- TASKS.md shows concise current status.
- docs/InProgress.md contains the detailed live checklist and review gates.
- Approved specifications and implementation plans remain immutable historical records unless requirements change.
- When task status changes, update TASKS.md and docs/InProgress.md in the same commit as the corresponding checkpoint.

## Definition of done

A task is complete only when:

- implementation matches the approved specification;
- targeted and full relevant tests pass;
- TypeScript and lint pass;
- specification review is approved;
- quality review has no open Critical or Important issues;
- TASKS.md and docs/InProgress.md are updated;
- no secrets or unrelated files are staged.
