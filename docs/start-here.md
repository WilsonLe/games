---
description: "Fast orientation for future sessions opening the repo with no prior thread context."
references: []
---

# Start Here

[Docs index](./README.md) | [Repo README](../README.md)

Use this when opening the repo with no prior thread context.

## Fast Path

1. Read `README.md` for setup and the docs map.
2. Open `src/App.tsx`. The game is intentionally concentrated there.
3. Scan these symbols first:

| Symbol | Why it matters |
| --- | --- |
| `FOODS`, `FoodId`, `foodArtById` | Food inventory and sprite mapping. |
| `CUSTOMERS`, `CustomerProfile`, `customerSpriteById` | Guest inventory and sprite mapping. |
| `TARGET_SERVES`, `MAX_MISSES`, `ORDERS_PER_LEVEL` | Main Table Talk Diner balancing constants. |
| `CITY_LOCATIONS`, `CITY_ROADS`, `CITY_MISSIONS`, `TARGET_CITY_DELIVERIES` | Tiny City Delivery map, route, mission, and target data. |
| `difficultyForLevel` | Level scaling and timer math. |
| `selectFoods`, `makeGuest`, `makeDecoyFood` | Deterministic order and conveyor generation. |
| `RestaurantGame`, `TinyCityDeliveryGame`, `GamePortal`, `App` | Route-level game selection and top-level render paths. |
| `handleFoodClick` | Serve resolution, scoring, streaks, completion, and wrong-food handling. |

4. Open `src/styles.css` for layout and visual behavior.
5. Check `src/assets/` before changing imports or filenames.
6. Run `npm run build` for code changes, and always run `git diff --check` before handing work back.

## What This App Is

`Table Talk Diner` is a single-screen 2D arcade game. Guests ask for English food orders and the
player clicks the right food to satisfy active guest orders before patience timers expire.

`Tiny City Delivery` is a map-routing game where the player follows delivery instructions using
English place words, quantities, and prepositions.

The current app is a portal shell with client-side path selection for the two games. There is no
backend, persistence, multiplayer, automated tests, or CI configuration in the repo.

## Where To Change Things

| Task | Start in |
| --- | --- |
| Add a food | `src/App.tsx` food types/data/imports, then `src/assets/sprites/`. |
| Add a customer | `src/App.tsx` customer types/data/imports, then `src/assets/sprites/`. |
| Tune difficulty | `difficultyForLevel` and nearby constants in `src/App.tsx`. |
| Change scoring or miss rules | `handleFoodClick`, `addMiss`, and completion branches in `src/App.tsx`. |
| Change layout or animation | `src/styles.css`. |
| Replace art | `src/assets/`, matching imports in `src/App.tsx` or URLs in `src/styles.css`. |
| Tune audio | `speak`, `playSound`, and `scheduleTone` in `src/App.tsx`. |
| Change Tiny City locations or routes | `CITY_LOCATIONS`, `CITY_ROADS`, and `CITY_MISSIONS` in `src/App.tsx`. |

## High-Risk Gotchas

| Gotcha | Detail |
| --- | --- |
| `targetGuestId` is priority, not a strict serving lock | If a visible food matches another guest who still needs it, `handleFoodClick` can apply it to that guest. |
| `selectFoods` assumes enough unique foods | Do not let `orderSize` exceed `FOODS.length`; the loop looks for unique food IDs. |
| Pause shifts timestamps | `resumeGame` adds paused time to guests, scheduled foods, belt foods, and spawn refs. |
| Audio depends on browser APIs | Speech and Web Audio may be unavailable or gesture-gated. |
| CSS owns most visual behavior | The background pan, chef bob, belt motion, food wobble, card arrival, cursor, and breakpoints are CSS-only. |

## Best First Verification

For a docs-only change:

```bash
git diff --check
```

For any source, dependency, asset import, or package metadata change:

```bash
npm run build
git diff --check
```
