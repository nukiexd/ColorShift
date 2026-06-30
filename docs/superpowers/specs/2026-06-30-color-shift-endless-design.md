# Color Shift — Endless MVP Design

## Product goal

Build a polished, calming match-three mobile game in React Native with Expo. The first release focuses on the Endless mode and establishes an extensible game engine for Time Attack and Demining later.

The game targets children and adults. It uses simple rules, forgiving pacing, responsive touch input, soft audiovisual feedback, and no online account requirement.

## First-release scope

The MVP includes:

- a home screen, local player profile, level progress, settings, and mode picker;
- a fully playable Endless mode on a 6×6 board;
- tap and tracked directional-drag controls;
- cascades, adaptive background color, score multipliers, and special tiles;
- pause, restart, voluntary finish, automatic shuffle, results, local XP, and best score;
- automatic session restoration, sound effects, optional haptics, reduced-motion setting, and accessibility labels;
- locked “Coming soon” entries for Time Attack and Demining.

The MVP excludes background music, custom avatars, authentication, cloud synchronization, leaderboards, monetization, Time Attack gameplay, and Demining gameplay.

## Visual direction

The base background is a deep navy. A low-opacity color glow crossfades over it after a match, using the color of the last resolved match group. This preserves legibility while making the board feel responsive.

The board sits on a subtly elevated dark panel. Tiles are at most 56×56 logical pixels with a 16-pixel corner radius. They scale down uniformly on narrow devices so the complete board, gaps, panel padding, and screen gutters always fit. The palette consists of muted coral red, sky blue, mint green, warm yellow, and plum.

Typography is clean and compact with deliberate letter spacing. The title is rendered as `COLOR SHIFT`; interface copy is localized in Russian for the MVP. Motion is quick and soft rather than bouncy or showy.

## Screens and navigation

### Home

The home screen contains the game title, a primary “Новая игра” button, a secondary “Настройки” action, and a player card in the upper-right area. The player card shows a neutral avatar placeholder, nickname, level number, and XP progress. Tapping the card opens a profile sheet where the nickname can be edited; the avatar is visible but not editable in this release.

If a saved session exists, “Продолжить” is shown as the primary action and “Новая игра” remains available with confirmation before replacing the session.

### Mode picker

The picker shows three modes. “Бесконечный” is active. “На время” and “Разминирование” are visible but disabled and marked “Скоро”. This communicates the planned product without implying unfinished gameplay is available.

### Game

The upper-left HUD shows current score and best score. A pause button occupies the upper-right corner. The board is vertically centered within the remaining safe area. Cascade feedback appears close to the board without covering interactive cells.

### Pause and results

Pause offers “Продолжить”, “Начать заново”, and “Завершить игру”. Restart requires confirmation. Finishing updates the record, awards XP, clears the active session, and opens a results view with score, highest cascade, cleared-tile count, and XP earned.

### Settings

Settings include effects volume, haptics, and reduced motion. Background music is intentionally excluded from this release.

## Board generation and legal moves

The board contains six rows and six columns and uses five base colors. A new board must have no pre-existing matches and at least one legal move.

When no legal move remains after a settled cascade, the board automatically shuffles until it contains no immediate match and has at least one legal move. The score, statistics, and session continue unchanged. Endless mode ends only through the pause menu.

Generation and shuffle operations use bounded attempts. If an attempt limit is reached, the engine regenerates a valid board rather than leaving the session unusable.

## Input model

The tile does not follow the finger while held. The system tracks displacement invisibly. Once movement passes 32% of the rendered cell pitch, the dominant axis selects one adjacent tile and the pair plays a swap-preview animation. Returning the finger below 24% cancels the preview, providing hysteresis that prevents flicker near the boundary. Releasing while the preview is active commits one swap; a single gesture cannot traverse multiple cells.

Tap input remains available. The first tap selects a tile with a subtle visual state. Tapping an adjacent tile attempts the swap. Tapping a non-adjacent tile moves the selection. Tapping the selected tile clears it.

An invalid swap animates back to its original state. Input is disabled while a committed move, match resolution, fall, refill, cascade, or shuffle is running.

## Match resolution

After a valid swap, the session proceeds through explicit phases:

1. detect all match groups;
2. choose any special tile to create;
3. activate specials included by the clear;
4. remove affected cells and update score/statistics;
5. drop surviving tiles;
6. refill empty cells;
7. repeat from match detection until stable;
8. validate that a legal move exists, shuffling when necessary;
9. persist the settled session and re-enable input.

The background transitions to the color of the final match group in the deterministic resolution order. Simultaneous groups are ordered top-to-bottom and left-to-right, making the chosen color reproducible.

## Scoring and cascades

Every cleared cell is worth 100 points multiplied by the current cascade depth. The first resolution is ×1, the next is ×2, then ×3, and so on. Cells cleared by a special count toward the same resolution step and multiplier. Creating a special does not add a separate score; its future clear provides the reward.

The UI briefly shows the current multiplier for cascades of ×2 or greater. The session tracks total cleared tiles and the highest cascade for results.

## Special tiles

Special creation is anchored to the destination of the player-swapped tile when that cell belongs to the qualifying group. Otherwise the engine uses a deterministic center cell.

- Four in a straight line creates a stripe. A horizontal match creates a row-clearing stripe; a vertical match creates a column-clearing stripe.
- Five in a straight line creates a bomb. When activated, it clears its 3×3 neighborhood, clipped at board edges.
- Six or more in a straight line creates a rainbow. Swapping a rainbow with a regular tile clears every tile of that regular tile’s base color. A rainbow activated by another special clears the most common base color on the board, resolving ties deterministically.

The cell selected to hold the new special survives the match that created it. Special effects can trigger other specials. Every cell is scored at most once per resolution step, even if multiple effects overlap.

T- and L-shaped groups are treated as their constituent straight matches in this MVP; only the longest qualifying straight segment creates a single special. This avoids ambiguous multi-special creation while preserving predictable play.

## Motion and feedback

Initial timings are 180 ms for swaps, 160 ms for clears, and 220 ms plus 30 ms per additional traveled row for falling and refill, capped at 310 ms. Reduced motion shortens transitions and removes scale-heavy effects while preserving state clarity. All values live in the balance module and may be tuned after playtesting.

The sound set contains a soft swap click, an airy match sound, ascending cascade tones, a restrained special activation, and a shuffle cue. Effects volume is capped to maintain the calm tone. Optional light haptics reinforce valid swaps and special activations; invalid moves do not use strong feedback.

## Progression and persistence

The app stores profile, nickname, level, XP, best score, settings, and the active settled session locally. The default profile uses a neutral avatar placeholder and an editable local nickname.

XP is awarded only when the player chooses “Завершить игру”. The award uses a diminishing-return score conversion so longer sessions remain valuable without making early levels disappear instantly. The initial balance is:

`xpAward = floor(10 × sqrt(score / 1000))`

Each level requires `100 + 20 × (level - 1)` XP. Excess XP carries into following levels. These constants live in a balance module so playtesting can tune them without changing engine logic.

The app persists only settled board states, after resolution completes. If the app backgrounds during an animation, it finishes or rolls back to the last settled state when restored. Stored data includes a schema version. Invalid session data is discarded without deleting a valid profile or settings.

## Architecture

The implementation uses a native-first modular React Native approach:

- `engine`: framework-independent TypeScript board model, generation, legal-move detection, matching, specials, shuffle, and scoring;
- `session`: explicit phase controller that turns engine outcomes into ordered animation steps and persistence events;
- `presentation`: screens, HUD, board, tiles, dialogs, adaptive background, and accessibility semantics;
- `storage`: versioned local profile, settings, statistics, and settled-session repositories;
- `feedback`: centralized audio and haptic playback governed by settings;
- `balance`: colors, score values, thresholds, animation durations, and XP constants.

React Native views render the 36 tiles. Gesture Handler tracks directional drags; Reanimated owns UI-thread positions, preview swaps, falls, clears, and background transitions. Expo Router provides the home, game, and results routes; settings, profile, mode selection, and pause use modal sheets over those routes. No environment variables or secrets are required.

## Reliability and accessibility

All interactive controls have semantic labels, visible pressed/selected states, and at least a 44×44-point hit area. Color is reinforced by a subtle, distinct tile mark so gameplay does not depend on hue alone. Safe areas and dynamic screen dimensions are respected.

The phase controller rejects input outside the idle phase. Resolution steps use stable tile identifiers so rendering does not confuse newly refilled tiles with moved tiles. Persistence errors do not interrupt play; they are contained and retried on the next settled state.

## Verification

Engine tests cover:

- initial boards with no matches and at least one legal move;
- legal and illegal adjacent swaps;
- simultaneous groups and deterministic resolution ordering;
- cascade depth and score multipliers;
- creation and activation of stripes, bombs, and rainbows;
- chained and overlapping special effects without double scoring;
- gravity, refill, shuffle invariants, and session statistics;
- XP thresholds and versioned persistence validation.

Interface checks cover tap selection, directional preview and cancellation, input locking, pause flows, session restore, reduced motion, narrow-phone layout, safe areas, and accessibility labels. Delivery verification includes unit tests, TypeScript checks, linting, an Expo build/start smoke test, and a manual run on a phone-sized viewport.
