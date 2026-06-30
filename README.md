# Color Shift

Color Shift is a calm, minimalist match-three mobile game built with React Native and Expo. The current milestone is a polished Endless mode for children and adults, with fast interactions, soft feedback, cascades, special tiles, local progression, and an adaptive color background.

## Current status

Development is active on the feature/endless-mvp branch.

Completed foundations:

- Expo SDK 56 project and verification toolchain;
- deterministic 6×6 match-three engine;
- legal-move detection and safe board generation;
- cascades and score multipliers;
- row/column stripes, 3×3 bombs, and rainbows;
- safe shuffle recovery;
- versioned local session, profile, settings, XP, and best-score storage.

The session layer is currently under review. The main UI, animated board, audio, final accessibility pass, and release QA remain in progress.

See [TASKS.md](TASKS.md) for the concise checklist and [docs/InProgress.md](docs/InProgress.md) for detailed status.

## Core gameplay

- Swap adjacent tiles to create a row of three or more.
- Every cleared tile awards 100 points multiplied by cascade depth.
- Four tiles create a row or column stripe.
- Five tiles create a 3×3 bomb.
- Six or more tiles create a rainbow that clears a color.
- A dead settled board shuffles automatically.
- Endless mode finishes only through the pause menu.

## Controls

Both input styles remain available:

- Tap one tile, then tap an adjacent tile.
- Hold a tile and move toward a neighbor. The held tile stays in place; after the directional threshold, the pair previews the swap. Releasing commits one swap and moving back cancels it.

## Visual direction

Color Shift uses a deep navy foundation, a softly elevated board, rounded tiles, muted coral, sky, mint, sun, and plum colors, and Manrope typography. A subtle glow changes to the color of the latest resolved match without sacrificing text contrast.

## Technology

- Expo SDK 56
- React Native 0.85
- React 19
- TypeScript
- Expo Router
- React Native Gesture Handler
- React Native Reanimated
- AsyncStorage
- expo-audio and expo-haptics
- Jest and React Native Testing Library

## Requirements

- Node.js compatible with Expo SDK 56
- npm
- Android Studio, Xcode, Expo Go, or a web browser depending on the target platform

On Windows PowerShell, use npm.cmd and npx.cmd if npm.ps1 is blocked by execution policy.

## Install and run

Install dependencies:

    npm.cmd install

Start Expo:

    npm.cmd start

Run a platform:

    npm.cmd run android
    npm.cmd run ios
    npm.cmd run web

The iOS simulator requires macOS. Expo Go or a development build can be used on physical devices.

## Verification

Run tests:

    npm.cmd test

Run TypeScript checks:

    npm.cmd run typecheck

Run lint:

    npm.cmd run lint

Check Expo dependency compatibility:

    npx.cmd expo-doctor

Create a web export:

    npx.cmd expo export --platform web

## Project structure

    src/app/          Expo Router screens and layouts
    src/game/         deterministic match-three engine and session rules
    src/storage/      persisted-state validation and AsyncStorage repository
    src/state/        application provider and actions
    src/components/   reusable UI and game components
    src/hooks/        gesture and animation controllers
    src/feedback/     sound and haptic services
    src/ui/           semantic design tokens
    docs/             specifications, plans, and live progress

## Project documentation

- [AGENTS.md](AGENTS.md) — permanent implementation rules for Codex and contributors
- [TASKS.md](TASKS.md) — concise active checklist
- [docs/InProgress.md](docs/InProgress.md) — detailed execution status
- [Endless MVP design](docs/superpowers/specs/2026-06-30-color-shift-endless-design.md)
- [Implementation plan](docs/superpowers/plans/2026-06-30-color-shift-endless.md)

## Data and privacy

The MVP stores nickname, level, XP, settings, best score, and a settled active session locally on the device. It has no account system, cloud synchronization, analytics, or online leaderboard.

Environment files and credentials must never be committed.

## Later milestones

The following features are intentionally outside the Endless MVP:

- Time Attack;
- Demining;
- custom avatars;
- background music;
- accounts and cloud saves;
- leaderboards and monetization.

## Repository

GitHub: https://github.com/nukiexd/ColorShift
