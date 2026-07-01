# Color Shift — Tasks

This is the concise project checklist. Detailed subtasks, review gates, and verification history live in [docs/InProgress.md](docs/InProgress.md).

Last updated: 1 July 2026

Active branch: feature/endless-mvp

Current focus: Task 5 verified checkpoint; Task 6 not started

## Status

- [x] Task 0 — approve Endless MVP design and implementation plan
- [x] Task 1 — scaffold Expo SDK 56 and testing toolchain
- [x] Task 2 — implement board generation, matching, and legal moves
- [x] Task 3 — implement cascades, specials, scoring, animation snapshots, and safe shuffle
- [x] Task 4 — finish session, persistence, progression, and provider concurrency review
- [x] Task 5 — build the design system, home screen, profile, settings, and mode picker
- [ ] Task 6 — build the animated board, tap controls, tracked directional gestures, and adaptive background
- [ ] Task 7 — add pause, results, session restore, sound effects, and haptics
- [ ] Task 8 — complete accessibility, device QA, documentation, and release verification

## Task 4 completed

- [x] Implement GameSession, XP, profile, settings, schema, repository, and AppProvider
- [x] Pass specification review
- [x] Bound persisted numeric values and guarantee allocator termination
- [x] Make provider actions linearizable in the same event-loop turn
- [x] Add session identity and reject stale settlement
- [x] Block mutations before hydration completes
- [x] Reject or recover non-playable restored boards
- [x] Serialize persistence writes so the latest state wins
- [x] Add failing numeric-limit, write-order, and dead-board regression tests
- [x] Add the remaining provider concurrency and hydration regression tests
- [x] Pass full tests, typecheck, and lint
- [x] Pass quality review with no Critical or Important findings
- [x] Update docs/InProgress.md and push the verified checkpoint

## Task 5 completed

- [x] Persist the Color Shift design system
- [x] Add semantic tokens and Manrope app shell
- [x] Build home, player card, mode picker, profile sheet, settings sheet, and confirmation sheet
- [x] Keep Endless enabled and mark Time Attack/Demining as “Скоро”
- [x] Add home-flow and accessibility tests
- [x] Pass specification and quality review

## Task 6 preview

- [ ] Render a responsive 6×6 board with tiles up to 56×56
- [ ] Add tap selection and adjacent-tap swaps
- [ ] Add stationary-tile directional tracking with 32% preview and 24% cancel thresholds
- [ ] Animate swap, clear, gravity, refill, cascade, and shuffle phases
- [ ] Add adaptive background glow and reduced motion
- [ ] Add gesture, controller, and accessibility tests
- [ ] Pass specification and quality review

## Task 7 preview

- [ ] Add pause, continue, restart confirmation, and finish
- [ ] Add results and XP presentation
- [ ] Restore settled active sessions
- [ ] Add restrained local sound effects and optional haptics
- [ ] Add session-flow and feedback tests
- [ ] Pass specification and quality review

## Task 8 preview

- [ ] Run full test coverage, TypeScript, lint, Expo Doctor, and Expo export
- [ ] Verify 360×800, 390×844, and 430×932 layouts
- [ ] Verify safe areas, touch targets, color-independent marks, and reduced motion
- [ ] Verify pause, restart, finish, restore, and background/foreground behavior
- [ ] Confirm no environment files or secrets are tracked
- [ ] Complete final code review and release verification
- [ ] Mark docs/InProgress.md complete and push the release candidate

## Deferred beyond Endless MVP

- Time Attack gameplay
- Demining gameplay
- Custom avatars
- Background music
- Accounts and cloud synchronization
- Leaderboards and monetization
