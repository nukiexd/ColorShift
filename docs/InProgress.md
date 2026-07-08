# Color Shift — InProgress

> Живой статус разработки Endless MVP. Файл обновляется после каждого завершённого шага и каждого review-gate.
>
> Последнее обновление: 9 июля 2026
>
> Рабочая ветка: feature/endless-mvp

## Обозначения

- [x] выполнено и проверено;
- [ ] ещё не выполнено;
- 🟡 реализация готова, но обязательные проверки ещё не завершены;
- 🔵 выполняется сейчас;
- ⛔ заблокировано.

## Источники требований

- Дизайн: [2026-06-30-color-shift-endless-design.md](superpowers/specs/2026-06-30-color-shift-endless-design.md)
- План реализации: [2026-06-30-color-shift-endless.md](superpowers/plans/2026-06-30-color-shift-endless.md)

## Общий статус

| Этап | Статус | Последний коммит |
| --- | --- | --- |
| 1. Expo scaffold | ✅ Завершён | 92855f2 |
| 2. Базовый игровой движок | ✅ Завершён | 154db49 |
| 3. Каскады и бонусы | ✅ Завершён | 3fe9357 |
| 4. Сессия, сохранение, прогресс | 🟡 На проверке | 77b494e |
| 5. Дизайн-система и главный экран | 🟡 Реализовано, ждёт review | — |
| 6. Игровое поле, жесты, анимации | 🟡 Частично реализовано | — |
| 7. Пауза, результаты, звук | ✅ Завершён локально | — |
| 8. Доступность, QA, релиз | ✅ Завершён локально, commit/push ожидают решения пользователя | — |

## 0. Проектирование и безопасность

- [x] Утвердить границы Endless MVP.
- [x] Утвердить механику жеста без следования блока за пальцем.
- [x] Утвердить бонусы, каскады, адаптивный фон и локальную прогрессию.
- [x] Записать дизайн-спецификацию.
- [x] Записать пошаговый TDD-план.
- [x] Создать корневой AGENTS.md с постоянными инструкциями для Codex.
- [x] Заменить шаблонный README.md описанием Color Shift и командами запуска.
- [x] Создать корневой TASKS.md с кратким актуальным чеклистом.
- [x] Создать изолированный worktree и ветку feature/endless-mvp.
- [x] Защитить .env, .env.*, .worktrees, coverage и build-артефакты через .gitignore.
- [x] Настроить origin через HTTPS и запушить текущую ветку.

## 1. Expo scaffold и тестовый контур

- [x] Создать Expo SDK 56 проект с Expo Router и TypeScript.
- [x] Установить Gesture Handler, Reanimated, AsyncStorage, expo-audio и expo-haptics.
- [x] Подключить Manrope и Expo-совместимые тестовые зависимости.
- [x] Настроить команды test, typecheck и lint.
- [x] Добавить smoke-тест.
- [x] Исправить идентификаторы приложения на Color Shift / color-shift / colorshift.
- [x] Добавить прямую native-зависимость expo-asset.
- [x] Добиться Expo Doctor 21/21.
- [x] Пройти review соответствия спецификации.
- [x] Пройти review качества кода.

## 2. Генерация поля и допустимые ходы

- [x] Описать типы Board, Tile, Coord, MatchGroup, TileColor и Special.
- [x] Реализовать детерминированный seeded RNG.
- [x] Реализовать неизменяемые чтение, запись и обмен клеток.
- [x] Реализовать поиск горизонтальных и вертикальных комбинаций.
- [x] Реализовать поиск всех допустимых соседних обменов.
- [x] Генерировать поле 6×6 без готовых рядов и минимум с одним ходом.
- [x] Гарантировать уникальные ID стартовых блоков.
- [x] Добавить проверки неверных координат и неверных значений RNG.
- [x] Проверить 100 seed-сценариев тестами.
- [x] Проверить completeness и отсутствие дублей в legal moves.
- [x] Пройти review соответствия спецификации.
- [x] Пройти review качества кода.

## 3. Каскады, бонусы, очки и shuffle

- [x] Реализовать удаление, гравитацию и заполнение клеток.
- [x] Реализовать каскадный множитель ×1, ×2, ×3 и далее.
- [x] Реализовать начисление 100 очков за уникальную удалённую клетку.
- [x] Создавать полоску за 4 блока.
- [x] Создавать бомбу 3×3 за 5 блоков.
- [x] Создавать радугу за 6 и более блоков.
- [x] Реализовать цепные срабатывания бонусов без двойного начисления.
- [x] Реализовать обмен радуги с цветом и двойную радугу.
- [x] Исправить семантику радуги, активированной цепной реакцией.
- [x] Сохранять новый бонус на выбранной anchor-клетке.
- [x] Выбирать фон по пространственно последней комбинации.
- [x] Добавить снимки boardBefore, boardAfterClear, boardAfterGravity и boardAfterRefill для анимаций.
- [x] Реализовать shuffle до стабильного играбельного поля.
- [x] Реализовать безопасную регенерацию при исчерпании попыток shuffle.
- [x] Отделить монотонный TileIdSource от цветового RNG.
- [x] Гарантировать уникальность ID между последовательными refill.
- [x] Проверить неизменяемость входного поля.
- [x] Пройти review соответствия спецификации.
- [x] Пройти review качества кода.

## 4. Состояние сессии, сохранение и прогресс

Статус: 🟡 spec-review пройден; quality-review выявил блокирующие проблемы. Исправления числовых границ, конкурентных действий, hydration, stale settlement, playable restore и очереди сохранений реализованы; ожидается повторный quality-review.

- [x] Реализовать GameSession и допустимые фазы.
- [x] Принимать ход только в idle-состоянии.
- [x] Обновлять score, bestCascade, clearedTiles и backgroundColor.
- [x] Сохранять состояние RNG между ходами и перезапусками.
- [x] Сохранять namespace и counter TileIdSource.
- [x] Реализовать XP по формуле floor(10 × sqrt(score / 1000)).
- [x] Реализовать растущую стоимость уровня и перенос лишнего XP.
- [x] Реализовать Profile и Settings.
- [x] Валидировать никнейм и ограничивать громкость диапазоном 0–1.
- [x] Реализовать версионированную схему PersistedState v1.
- [x] Валидировать размер поля, цвета, бонусы и уникальность ID при загрузке.
- [x] Изолировать повреждённую активную партию от профиля и настроек.
- [x] Сохранять только settled idle/paused сессии.
- [x] Обработать ошибки AsyncStorage без аварии UI.
- [x] Реализовать AppProvider и hydration-флаг.
- [x] Реализовать start, continue, settle, finish и discard-and-start.
- [x] Добавить тесты сессии, схемы, репозитория и провайдера.
- [x] Получить 158 проходящих тестов, чистые typecheck и lint.
- [x] Пройти review соответствия спецификации.
- [x] Исправить все замечания spec-review и повторно пройти проверку.
- [x] Получить замечания quality-review по числовым границам, конкурентным действиям, hydration и восстановлению поля.
- [x] Добавить красные регрессионные тесты числовых границ, порядка записи и неиграбельного сохранения.
- [x] Добавить оставшиеся регрессионные тесты конкурентных действий и hydration.
- [x] Реализовать исправления до прохождения всех регрессионных тестов.
- [x] Получить 172 проходящих теста, чистые typecheck и lint после quality-fix исправлений.
- [ ] Повторно пройти review качества кода.
- [ ] Обновить этот раздел до статуса «Завершён».
- [ ] Запушить проверенный результат.

## 5. Дизайн-система и главный экран

- [x] Сгенерировать и сохранить дизайн-систему Color Shift.
- [x] Утвердить финальные semantic tokens цветов, отступов, радиусов и теней.
- [x] Подключить Manrope до скрытия splash screen.
- [x] Настроить корневой layout, safe area и status bar.
- [x] Создать PrimaryButton и PlayerCard.
- [x] Создать главный экран с названием, уровнем, никнеймом и XP.
- [x] Создать ModeSheet.
- [x] Сделать Endless активным режимом.
- [x] Показать Time Attack и Demining как заблокированные «Скоро».
- [x] Создать ProfileSheet с редактированием никнейма.
- [x] Показать неактивную заглушку аватара.
- [x] Создать SettingsSheet с громкостью, вибрацией и reduced motion.
- [x] Показывать «Продолжить» только при наличии активной партии.
- [x] Добавить подтверждение замены сохранённой партии.
- [x] Обеспечить touch targets не меньше 48×48 dp.
- [x] Добавить semantic roles, labels и pressed states.
- [x] Добавить и пройти тесты домашних сценариев.
- [x] Получить 174 проходящих теста, чистые typecheck и lint после реализации главного экрана.
- [ ] Пройти review соответствия спецификации.
- [ ] Пройти review качества кода.
- [ ] Обновить InProgress и запушить результат.

## 6. Игровой экран, жесты и анимации

- [x] Создать AdaptiveBackground.
- [x] Создать GameHud со счётом, рекордом, каскадом и паузой.
- [x] Создать Tile с цветонезависимой меткой формы.
- [x] Создать адаптивное поле Board 6×6.
- [x] Ограничить размер блока максимумом 56×56 и радиусом 16.
- [x] Уместить поле на экранах шириной от 360 px.
- [x] Реализовать выбор блока одиночным тапом.
- [x] Реализовать обмен вторым тапом по соседнему блоку.
- [x] Реализовать reselection и снятие выбора.
- [x] Реализовать gestureIntent с порогом включения 32%.
- [x] Реализовать порог отмены preview 24%.
- [x] Оставлять зажатый блок неподвижным до выбора направления.
- [ ] Анимировать preview обмена соседней пары.
- [x] Подготовить previewOffsets: зажатый блок остаётся на месте, соседний блок смещается к нему за 180 ms.
- [x] Ограничить один жест одним обменом.
- [x] Откатывать неверный обмен.
- [x] Блокировать ввод на время resolution.
- [ ] Анимировать swap, clear, gravity и refill по снимкам resolver.
- [x] Подготовить ordered animation plan для swap, clear, fall, refill и shuffle по resolver phases.
- [x] Плавно менять цветное свечение фона.
- [x] Реализовать reduced-motion вариант.
- [x] Добавить accessibility labels для цвета, координат и бонуса.
- [x] Добавить и пройти тесты жестов и контроллера.
- [x] Подключить переход с главного экрана на игровой экран для новой и сохранённой Endless-сессии.
- [x] Сохранять выбранный блок между тапами на игровом экране.
- [x] Прокинуть reduced-motion в controller animation plan.
- [x] Получить 187 проходящих тестов, чистые typecheck и lint после первого слоя игрового экрана.
- [ ] Пройти review соответствия спецификации.
- [ ] Пройти review качества кода.
- [x] Обновить InProgress по итогам реализации Task 6.
- [ ] Запушить результат после разрешения пользователя.

### Task 6 checkpoint — 8 July 2026

- [x] Added a RED test proving `BoardView` must consume pending `animationPlan.steps` and block taps during playback.
- [x] `BoardView` now accepts `animationPlan`, disables tile input while steps are pending, and calls `onAnimationPlanComplete` after the final step duration.
- [x] `BoardView` renders resolver snapshots for swap, clear, fall, refill, and shuffle steps.
- [x] `BoardView` renders stationary directional preview: the held tile remains in place while only the neighboring tile receives the preview offset.
- [x] `BoardView` exposes pan tracking callbacks to the game screen without adding dependencies.
- [x] `GameScreen` delays `settleSession` until animation playback completes, so only settled states are persisted.
- [x] Added tests for pending-step input lock, stationary preview offset, and playback completion callback.
- [x] Verification passed: targeted Task 6 tests, full `npm.cmd test`, `npm.cmd run typecheck`, and `npm.cmd run lint`.
- [ ] Formal specification review remains pending because this chat explicitly did not run separate review agents.
- [ ] Formal quality review remains pending because this chat explicitly did not run separate review agents.

## 7. Пауза, результаты, звук и восстановление

- [x] Создать PauseSheet.
- [x] Реализовать «Продолжить».
- [x] Реализовать подтверждённое «Начать заново».
- [x] Реализовать «Завершить игру».
- [x] Создать экран результатов.
- [x] Показать score, bestCascade, clearedTiles и earned XP.
- [x] Обновлять лучший результат.
- [x] Реализовать восстановление активной settled-сессии.
- [x] Создать оригинальные короткие WAV для swap, match, cascade, special и shuffle.
- [x] Реализовать preload и ограниченную громкость эффектов.
- [x] Реализовать повышающийся тон каскада с лимитом.
- [x] Реализовать мягкий haptic feedback.
- [x] Уважать отключённые звук и вибрацию.
- [x] Не допускать влияния ошибок audio/haptics на игровое состояние.
- [x] Добавить и пройти тесты session flows и feedback.
- [x] Пройти review соответствия спецификации в этом чате без отдельного агента.
- [x] Пройти review качества кода в этом чате без отдельного агента.
- [x] Обновить InProgress; push не выполнялся по ограничению пользователя.

### Task 7 checkpoint — 8 July 2026

- [x] Added RED tests for pause/continue/restart/finish/results/restore flows and feedback behavior.
- [x] Added `PauseSheet` with continue, restart confirmation, and finish actions.
- [x] Added `/results` route showing score, best cascade, cleared tiles, earned XP, and new-record state.
- [x] Home continue now resumes paused saved sessions before routing to the game.
- [x] Game finish now calls `finishGame`, clears the active session, applies XP/best score through the provider, and routes immutable result params.
- [x] Added `src/feedback` service for swap, match, cascade, special, shuffle, and light haptics.
- [x] Added original short WAV files for all local effects under `assets/audio`.
- [x] Feedback respects disabled volume/haptics, caps effect volume, caps cascade pitch, and contains audio/haptic errors.
- [x] Updated existing GameScreen tests to mock feedback in the Jest environment.
- [x] Patched existing Expo SDK 56 package versions with `npx.cmd expo install` so `expo-doctor` passes.
- [x] Verification passed: targeted Task 7 tests, full `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, and `npx.cmd expo-doctor`.

## 8. Доступность, QA и релизная проверка

- [x] Проверить test suite с coverage.
- [x] Проверить TypeScript.
- [x] Проверить Expo lint.
- [x] Проверить Expo Doctor.
- [x] Собрать Expo web export.
- [x] Проверить отсутствие отслеживаемых .env-файлов.
- [x] Проверить экран 360×800.
- [x] Проверить экран 390×844.
- [x] Проверить экран 430×932.
- [x] Проверить safe areas.
- [x] Проверить минимальные touch targets.
- [x] Проверить читаемость блоков без опоры только на цвет.
- [x] Проверить быстрые повторные касания во время каскада.
- [x] Проверить pause, restart, finish и restore.
- [x] Проверить reduced motion и сохранение настроек.
- [x] Проверить уход приложения в background и возврат через browser reload restore.
- [x] Обновить README с запуском, управлением и ограничениями MVP.
- [x] Указать в README запрет на коммит .env.
- [x] Выполнить финальный review всего diff.
- [x] Выполнить финальную verification-before-completion.
- [x] Обновить все пункты InProgress.
- [ ] Commit/push release-candidate ветки ожидает решения пользователя.

### Task 8 checkpoint — 8 July 2026

- [x] Added release-surface regression coverage so Expo Router only exposes `/`, `/game`, and `/results`.
- [x] Removed the scaffold `/explore` route from the release surface.
- [x] Clipped the adaptive background glow so narrow web/mobile viewports do not gain horizontal overflow.
- [x] Marked board tiles disabled whenever the session is not idle, including paused restore.
- [x] Added explicit `aria-checked` for settings switches on web.
- [x] Contained asynchronous browser audio playback rejections from autoplay policy.
- [x] Browser QA passed at 360×800, 390×844, and 430×932 for board fit, touch targets, color-independent marks, pause/restart/finish/restore, reduced motion persistence, and reload restore.
- [x] README, TASKS, and InProgress were updated for the Task 8 local release-candidate checkpoint.
- [ ] Commit and push were intentionally not performed by user request.

### Playtest polish checkpoint — 8 July 2026

- [x] Added RED regression coverage for regular tile marks, special-only marks, stationary preview motion wrappers, and sound settings as a binary switch.
- [x] Replaced regular color marks with plain tiles while preserving special marks and accessibility labels.
- [x] Moved pan responder handling onto stable animated tile wrappers so drag gestures are not coupled to the Pressable tap surface.
- [x] Added visible Animated transitions for swap, clear, fall, refill, shuffle, and adaptive background glow using existing resolver snapshots.
- [x] Replaced the effects-volume increment button with a sound on/off switch backed by the existing `effectsVolume` setting.
- [x] Verification passed for targeted Board, home/settings, background, controller, and animation-plan tests, plus full tests, typecheck, and lint.
- [ ] Commit and push remain intentionally not performed unless the user requests them.

### Phone playtest fix checkpoint — 8 July 2026

- [x] Stored the true pre-move board in `MoveAnimationPlan` so swap animation starts from the visible board instead of the resolver's post-swap phase snapshot.
- [x] Reset the game controller after animated settlement so pan gestures are available after every completed move.
- [x] Removed cached pan responders that captured stale controller/session callbacks after the first swipe.
- [x] Made tile pan responders avoid stealing tap start events and respect the animation lock state.
- [x] Kept an optimistic visible settled session after animation completion so the board does not flash back to the pre-move state while AppProvider catches up.
- [x] Stopped in-flight tile animations before starting the next step and used JS-driven board transforms to avoid stale native-driver offsets.
- [x] Softened adaptive background glow opacity, size, and transition timing to avoid heavy darkening during cascades.
- [x] Added bottom safe-area padding for modal sheets so settings controls clear Android navigation bars.
- [x] Added regression coverage for pre-move animation plans, sheet safe-area padding, softer glow, and updated board behavior.
- [x] Verification passed: targeted affected tests, full `npm.cmd test`, `npm.cmd run typecheck`, and `npm.cmd run lint`.
- [ ] Commit and push remain intentionally not performed unless the user requests them.

### Pan-swipe and special-rule polish checkpoint - 8 July 2026

- [x] Added regression coverage for easier pan-swipe activation and preview cancellation thresholds.
- [x] Lowered pan intent activation from 32% to 22% of cell pitch and cancellation from 24% to 14%.
- [x] Added invalid-swap animation plans that move the pair forward and then return it before re-enabling input.
- [x] Kept the faster reduced-motion timing as the default for new settings and removed the settings-row toggle for now.
- [x] Added regression coverage for hidden reduced-motion settings UI and the default reduced-motion value.
- [x] Changed special-tile creation to count connected same-color match components cleared in the same phase, including T/L/cross clears.
- [x] Kept separate simultaneous same-color groups from combining into one special.
- [x] Verified that 6+ connected clears create a rainbow at the moved destination and rainbow swaps clear the target color currently on the board.
- [x] Removed visual dimming while cascade and invalid-swap animation locks input.
- [x] Rendered rainbow tiles as striped blocks using the five game colors, without an extra special icon.
- [x] Removed the rainbow tile inset so the stripes reach the tile edges without a separate outline.
- [x] Prevented rainbow tiles from auto-activating when they are cleared by cascades or chained special effects without an explicit swap target.
- [x] Expanded ordinary combo clears to include same-color cells connected to the matched line in the same phase.
- [x] Kept row, column, and bomb specials chain-activating when reached by cascade or special clears; only passive rainbow activation is suppressed.
- [x] Fixed invalid pan-swipe rollback so the next pan gesture can preview and commit normally.
- [x] Targeted verification passed for resolver, controller, board, animation-plan, settings, and storage tests.
- [x] Full verification passed for `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, and `npx.cmd expo-doctor`.
- [ ] Commit and push remain intentionally not performed unless the user requests them.

### Final match/special/combo checkpoint - 9 July 2026

- [x] Added RED regression coverage for final match participation rules: line-specials remain colored, while bomb-specials and rainbow-specials are colorless for normal matches.
- [x] Added RED regression coverage that a match group containing an existing line-special activates it without creating a new special from the same group.
- [x] Added RED regression coverage for rainbow + line, rainbow + bomb, and line/bomb base-effect swaps.
- [x] Preserved the final creation priority: 3 tiles clear normally, 4 in a line creates a colored line-special, 5 connected same-color cleared tiles creates a colorless bomb, and 6+ creates a colorless rainbow.
- [x] Kept cascades eligible to create line, bomb, and rainbow specials by the same rules, while newly created cascade specials do not activate immediately.
- [x] Implemented rainbow + line as clear the line-special color plus activate that line-special direction.
- [x] Implemented rainbow + bomb and rainbow + rainbow as full-board clears.
- [x] Kept line + line, line + bomb, and bomb + bomb swaps as both base effects, without adding unique candy-crush-style combo logic.
- [x] Targeted engine verification passed: `npm.cmd test -- src/game/matches.test.ts src/game/resolve.test.ts src/game/specials.test.ts`.
- [x] Full game-engine verification passed: `npm.cmd test -- src/game`.
- [x] Full project verification passed: `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, and `npx.cmd expo-doctor`.
- [ ] Commit and push remain intentionally not performed unless the user requests them.

## Вне Endless MVP

Эти пункты намеренно не входят в текущий цикл и не отмечаются как незавершённые задачи MVP:

- Time Attack;
- Разминирование;
- пользовательские аватары;
- фоновая музыка;
- серверная авторизация и облачная синхронизация;
- таблицы лидеров и монетизация.
