---
description: "Fast orientation for future sessions opening the two-game portal with no prior context."
references: []
---

# Start Here

[Docs index](./README.md) | [Repo README](../README.md)

## Fast Path

1. Read `AGENTS.md` and `README.md`.
2. Confirm the checkout root, branch, worktree, remote default branch, and working-tree status.
3. Open `src/App.tsx`; portal routing and both games intentionally live in this file.
4. Scan the source anchors below.
5. Open `src/styles.css`, paying special attention to the diner-only selector scope near
   `/* Top-down restaurant game stage */`.
6. Check `src/assets/` before changing imports or filenames.
7. Run the appropriate checks before delivery.

## Source Anchors

| Symbol | Why it matters |
| --- | --- |
| `GAME_PATH`, `TINY_CITY_PATH`, `normalizePath`, `App` | Client-side path selection, history updates, document titles, and portal fallback. |
| `GamePortal` | Root two-game chooser and preview cards. |
| `FOODS`, `foodArtById` | Diner food inventory and image mapping. |
| `CUSTOMERS`, `customerSpriteRowById` | Guest inventory and generated sheet rows. |
| `TARGET_SERVES`, `ORDERS_PER_LEVEL`, `difficultyForLevel` | Diner progression and pacing. |
| `DINER_DOOR_TILE`, `WAITER_HOME_TILE`, `SEAT_LAYOUT`, `WALK_TILES` | Diner actor and table coordinates. |
| `buildTileRoute`, `getRouteVisual`, `getGuestVisual` | Diner route interpolation. |
| `makeGuest`, `makeDecoyFood`, `chooseSpawnLane` | Diner guest and dish generation. |
| `handleGuestSelect`, `revealGuestOrder`, `handleFoodDrop` | Diner order-taking and serving decisions. |
| `CITY_LOCATIONS`, `CITY_ROADS`, `CITY_MISSIONS` | Tiny City map, road graph, and lesson content. |
| `TinyCityDeliveryGame`, `handleCityLocationClick`, `completeCityMission` | Tiny City state, movement, scoring, and completion. |
| `getCityRoadKey`, `CityMap` | Exact traversed-edge highlighting and map rendering. |

## Product Shape

- `/` is the two-game mini-game portal.
- `/games/table-talk-diner` launches Table Talk Diner.
- `/games/tiny-city-delivery` launches Tiny City Delivery.
- In-app navigation uses the History API without a router package.
- Unknown paths render the portal without replacing the address.
- Both games have a portal-return control.

The app has no backend, accounts, saved progress, analytics, automated tests, CI workflow, or
provider-specific deployment configuration.

## Where To Change Things

| Task | Start in |
| --- | --- |
| Change portal cards or path behavior | `GamePortal`, `App`, and portal styles. |
| Add a diner food or guest | Types/data/imports in `src/App.tsx`, then `src/assets/`. |
| Tune diner difficulty | Named constants and `difficultyForLevel`. |
| Change serving or scoring | `handleFoodDrop`, `resetCombo`, and completion branches. |
| Change city locations or roads | `LocationId`, `CITY_LOCATIONS`, and `CITY_ROADS`. |
| Add or alter city missions | `CITY_MISSIONS`; keep phrase and structured fields aligned. |
| Change layout or animation | `src/styles.css`; preserve diner-only selector scoping. |
| Tune speech or tones | `speak`, both `playSound` callbacks, and `scheduleTone`. |

## High-Risk Gotchas

| Gotcha | Detail |
| --- | --- |
| Static deep links need fallback routing | Hosts must serve `index.html` for both `/games/...` paths. |
| Diner and city share generic class names | Diner full-viewport overrides must stay under `.appShell:not(.appShell--city)` when they touch `.mainSurface`, `.gameGrid`, `.resultBanner`, or `.sceneBackdrop`. |
| `targetGuestId` is dish lifecycle metadata | The table receiving a drop decides service; a decoy can satisfy a matching request. |
| `selectFoods` requires enough unique foods | Never allow `orderSize > FOODS.length`. |
| Diner has no mid-shift pause | Tiny City has ready/play/pause/end controls; Diner starts automatically and only offers a new shift after completion. |
| Audio is browser-dependent | Speech and Web Audio may be absent or gesture-gated. |
| Diner selection is movement-gated | Entering tables ignore pointer input; after selection, the order is revealed only once the waiter arrives and the guest is seated. |
| Road highlighting is edge-based | Keep consecutive-path logic; checking only whether both stops appear in the path produces false highlights. |

## Verification

Docs-only:

```bash
git diff --check
```

Source, dependency, asset, or package changes:

```bash
npm run build
git diff --check
```

Use [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md) for browser smoke
tests covering the portal and both games.
