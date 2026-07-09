# Maintenance, Testing, And Deployment

[Docs index](./README.md) | [Repo README](../README.md)

## Maintenance Recipes

### Add A New Food

1. Add `src/assets/sprites/food-{id}.png`.
2. Import it at the top of `src/App.tsx`.
3. Add `{id}` to the `FoodId` union.
4. Add `{ id: "{id}", name: "{display name}" }` to `FOODS`.
5. Add `{id}: importedSpriteUrl` to `foodArtById`.
6. Confirm `difficultyForLevel` never returns an `orderSize` greater than `FOODS.length`.
7. Update [Assets Guide](./assets.md).
8. Run `npm run build` and `git diff --check`.

### Add A New Customer

1. Add `src/assets/sprites/customer-{id}.png`.
2. Import it at the top of `src/App.tsx`.
3. Add `{id}` to `CustomerProfile["id"]`.
4. Add `{ id: "{id}", name: "{display name}" }` to `CUSTOMERS`.
5. Add `{id}: importedSpriteUrl` to `customerSpriteById`.
6. Update [Assets Guide](./assets.md).
7. Run `npm run build` and `git diff --check`.

### Change Order Difficulty

Start with these symbols in `src/App.tsx`:

| Symbol | Effect |
| --- | --- |
| `TARGET_SERVES` | Orders needed to win. Also affects derived `MAX_LEVEL`. |
| `MAX_MISSES` | Lives before losing. |
| `ORDERS_PER_LEVEL` | Completed orders per level. |
| `STREAK_BONUS_PER_HIT` | Points added by streak growth. |
| `FIRST_DISH_DELAY_MS` | Earliest ordered dish spawn delay. |
| `NEXT_GUEST_AFTER_COMPLETE_MS` | Replacement guest pacing after order completion. |
| `ORDER_LANES` | Number of logical conveyor lanes. CSS currently styles lane `0` and lane `1`. |
| `difficultyForLevel` | Main level scaling formula. |

If changing `ORDER_LANES`, update `ConveyorBelt` rendering and CSS classes such as `.beltFood--lane0` and `.beltFood--lane1`.

If changing `orderSize`, keep it at or below `FOODS.length`; `selectFoods` looks for unique foods and would not finish if asked for more unique foods than exist.

### Adjust Timers

| Timer | Where |
| --- | --- |
| Guest spawn interval | `difficultyForLevel().guestIntervalMs` and `nextGuestAtRef`. |
| Decoy spawn interval | `difficultyForLevel().decoyIntervalMs` and `nextDecoyAtRef`. |
| Belt travel | `difficultyForLevel().beltTravelMs`. |
| Dish spacing | `difficultyForLevel().timeToLastDishMs`, `dishGapMs`, and `makeGuest`. |
| Expiration | `timeToLastDishMs + patienceBufferMs`. |
| Lane retry delay | Hard-coded `650ms` delays in scheduled spawn and decoy retry logic. |

After timer changes, manually test pause/resume. `resumeGame` shifts all active timestamps by the paused duration.

### Replace Generated Art

| Asset | Safest replacement path |
| --- | --- |
| Kitchen background | Replace `src/assets/game-kitchen-bg.png`, then check desktop and mobile framing. |
| Player chef | Replace `src/assets/player-chef.png`, preserving transparent background if possible. |
| Food/customer sprites | Replace individual files under `src/assets/sprites/`. |
| Sprite sheet preview | Replace `src/assets/conveyor-kitchen-sprite-sheet.png`; it is preview-only. |
| Cursor | Replace `src/assets/game-cursor.svg` and adjust hotspot coordinates in `--game-cursor` if needed. |

Run `npm run build` after replacing assets so Vite validates imports and emits optimized asset files.

### Tune Sounds

Sound effects are generated in `playSound` through calls to `scheduleTone`.

| Sound | Tune here |
| --- | --- |
| Correct dish | `kind === "correct"` branch. |
| Completed order | `kind === "complete"` branch. |
| Wrong dish | Final branch in `playSound`. |

Keep volumes modest. Current tones use gain values around `0.055` to `0.08`.

## Manual Smoke Tests

Run these in a browser through `npm run dev` after gameplay changes.

| Test | Expected result |
| --- | --- |
| Initial load | App renders with background, chef, portal rail, top bar, empty guests, and no console errors. |
| Start shift | Two guests appear, first guest is selected, order audio attempts to play, score is `0`, orders are `0/24`, lives are `5`. |
| Listen button | Guest remains selected and the order phrase is replayed or an audio-unavailable message appears. |
| Pause/resume | Timers stop while paused and continue after resume without guests instantly expiring. |
| Correct food | Food disappears, guest chip is marked served, score/streak increase, feedback is good. |
| Complete order | Guest card disappears, orders count increments, completion sound/TTS attempts to play. |
| Wrong food | Food disappears, lives decrease by one, streak resets, feedback is bad. |
| Guest expiration | Waiting too long removes the guest and decreases lives by one. |
| Loss | After five misses, result banner shows `Kitchen closed`. |
| Win | After `24` completed orders, result banner shows `Shift complete`. |
| Reset | Reset icon starts a fresh shift from ready, paused, playing, or ended states. |
| Responsive layout | Check around desktop, `1360px`, `980px`, and `560px` widths. |
| Console | No React errors, missing asset errors, or unhandled audio exceptions. |

## Command Verification

For docs-only changes, run:

```bash
git diff --check
```

For source, import, package metadata, or asset changes, run:

```bash
npm run build
git diff --check
```

There is no test script in `package.json` today.

## Browser Checks

| Check | Why |
| --- | --- |
| Chrome or Chromium desktop | Vite dev target and common Web Audio/SpeechSynthesis behavior. |
| Narrow mobile viewport | Conveyor dimensions and background framing change below `560px`. |
| Console while clicking audio controls | Browser audio policies can vary. |
| Hard refresh after build preview | Verifies static assets resolve from the built bundle. |

## Deployment Notes

| Topic | Current repo state |
| --- | --- |
| Repository URL | `https://github.com/WilsonLe/games.git` |
| Current branch | `main` |
| Build output | `dist/` from `npm run build`. |
| Static hosting | Any static host that can serve Vite output from `dist/` should work. |
| Deployment config | No provider-specific config is present. |
| CI | No GitHub Actions or other CI config is present. |

## What To Commit

Commit source and documentation changes:

| Commit | Do not commit |
| --- | --- |
| `src/**` source and assets | `node_modules/` |
| `docs/**` | `dist/` |
| `README.md` | `.DS_Store` |
| `package.json` and `package-lock.json` when dependencies change | `*.local` files |

The current `.gitignore` ignores `node_modules`, `dist`, `.DS_Store`, and `*.local`.

## Known Limitations

| Limitation | Current impact |
| --- | --- |
| No automated tests | Gameplay must be smoke-tested manually. |
| No CI | Build checks are local unless a future workflow is added. |
| Browser-native TTS | Voices, timing, and availability vary by browser and OS. |
| Browser-native Web Audio | Playback can be gesture-gated or unavailable. |
| One game in portal | Navigation currently has one active game button. |
| No persistence | Score and progress reset on reload or new shift. |
| No asset generation metadata | Final images are committed, but prompts/source process are not documented in the repo. |
