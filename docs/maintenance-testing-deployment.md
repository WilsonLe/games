---
description: "Maintenance recipes, manual smoke tests, build verification, and deployment notes."
references: []
---

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

1. Add or regenerate the customer row in `src/assets/sprites/generated/customer-fullbody-sheet.png`.
2. If needed for portal/legacy preview use, add `src/assets/sprites/customer-{id}.png` and import it
   at the top of `src/App.tsx`.
3. Add `{id}` to `CustomerProfile["id"]`.
4. Add `{ id: "{id}", name: "{display name}" }` to `CUSTOMERS`.
5. Add `{id}: "{row position}"` to `customerSpriteRowById`.
6. Update [Assets Guide](./assets.md).
7. Run `npm run build` and `git diff --check`.

### Change Order Difficulty

Start with these symbols in `src/App.tsx`:

| Symbol | Effect |
| --- | --- |
| `TARGET_SERVES` | Orders needed to win. Also affects derived `MAX_LEVEL`. |
| `ORDERS_PER_LEVEL` | Completed orders per level. |
| `HAPPY_GUEST_COMBO_BONUS` | Points added by consecutive happy-guest completions. |
| `FIRST_DISH_DELAY_MS` | Earliest ordered dish spawn delay. |
| `NEXT_GUEST_AFTER_COMPLETE_MS` | Replacement guest pacing after order completion. |
| `GUEST_STEP_MS` | Guest tile-route segment duration for entering and leaving. |
| `WAITER_STEP_MS` | Waiter tile-route segment duration after selecting a guest. |
| `LEAVING_GUEST_LINGER_MS` | Extra time after a leaving guest finishes the reverse route before removal. |
| `ORDER_LANES` | Logical kitchen-pass lane offset count for ordered/decoy timing. Check current rendering before changing it. |
| `difficultyForLevel` | Main level scaling formula. |

If changing `ORDER_LANES`, update `KitchenStation` rendering and CSS classes such as `.beltFood--lane0` and `.beltFood--lane1`.

If changing `orderSize`, keep it at or below `FOODS.length`; `selectFoods` looks for unique foods and would not finish if asked for more unique foods than exist.

### Adjust Timers

| Timer | Where |
| --- | --- |
| Guest spawn interval | `difficultyForLevel().guestIntervalMs` and `nextGuestAtRef`. |
| Decoy spawn interval | `difficultyForLevel().decoyIntervalMs` and `nextDecoyAtRef`. |
| Dish lifetime/pass timing | `difficultyForLevel().beltTravelMs`. |
| Dish spacing | `difficultyForLevel().timeToLastDishMs`, `dishGapMs`, and `makeGuest`. |
| Expiration | `timeToLastDishMs + patienceBufferMs`. |
| Guest walk duration | `getGuestWalkDuration`, derived from the seat route length and `GUEST_STEP_MS`. |
| Waiter-to-table route duration | `buildTileRoute` plus `WAITER_STEP_MS`. |
| Lane retry delay | Hard-coded `650ms` delays in scheduled spawn and decoy retry logic. |

After timer changes, manually test guest spawning, dish spawning/recycling, expiration, and Tiny City
pause/resume if the shared status flow is touched.

### Replace Generated Art

| Asset | Safest replacement path |
| --- | --- |
| Kitchen background | Replace `src/assets/game-kitchen-bg.png`, then check desktop and mobile framing. |
| Portal chef preview | Replace `src/assets/player-chef.png`, preserving transparent background if possible. |
| Food sprites | Replace individual `src/assets/sprites/food-*.png` files. |
| Customer full-body sheet | Replace `src/assets/sprites/generated/customer-fullbody-sheet.png` and verify row mapping. |
| Waiter full-body sheet | Replace `src/assets/sprites/generated/waiter-fullbody-sheet.png` and verify animation frames. |
| Legacy/reference sprite sheet | Replace `src/assets/conveyor-kitchen-sprite-sheet.png` only if refreshing unused reference art. |
| Cursor | Replace `src/assets/game-cursor.svg` and adjust hotspot coordinates in `--game-cursor` if needed. |

Run `npm run build` after replacing assets so Vite validates imports and emits optimized asset files.

### Tune Sounds

Sound effects are generated in `playSound` through calls to `scheduleTone`.

| Sound | Tune here |
| --- | --- |
| Correct dish | `kind === "correct"` branch. |
| Completed order | `kind === "complete"` branch. |
| Wrong table or expired guest | Final branch in `playSound`. |

Keep volumes modest. Current tones use gain values around `0.055` to `0.08`.

## Manual Smoke Tests

Run these in a browser through `npm run dev` after gameplay changes.

| Test | Expected result |
| --- | --- |
| Initial load | Portal renders both game choices, preview art, and no console errors. |
| Initial diner route | One guest begins walking in, no guest is selected, score is `0`, orders are `0/24`, and level is `1`; another guest can spawn shortly after while under the level max. |
| Guest table tap | Guest becomes selected, the waiter walks to that guest's table, then the speech bubble shows the order and order audio attempts to play. |
| Correct dish drag | Dish disappears, guest chip is marked served, score increases, and feedback/sound state is good. |
| Complete order | Guest walks back toward the door, orders count increments, combo may increase, completion sound/TTS attempts to play. |
| Wrong table | Dish disappears, wrong sound/TTS attempts to play, and the happy-guest combo resets internally. |
| Guest expiration | Waiting too long sends the guest leaving toward the door, removes targeted dishes, and resets the combo internally. |
| Win | After `24` completed orders, result banner shows `Dinner service complete`. |
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
| Narrow mobile viewport | Kitchen pass dimensions and background framing change below `560px`. |
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
| No persistence | Score and progress reset on reload or new route/shift. |
| No asset generation metadata | Final images are committed, but prompts/source process are not documented in the repo. |
