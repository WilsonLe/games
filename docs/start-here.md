---
description: "Fast orientation for future sessions opening the two-game portal with no prior context."
references: []
---

# Start Here

[Docs index](./README.md) | [Repo README](../README.md)

## Fast Path

1. Read `AGENTS.md` and `README.md`.
2. Confirm the checkout root, branch, worktree, remote default branch, and working-tree status.
3. Open `src/App.tsx` for routing, game rules, state, scoring, speech, and scene snapshots.
4. Open `src/game-runtime/PhaserGameHost.tsx` and the relevant scene under `src/games/` for rendering.
5. Scan the source anchors below.
6. Open `src/styles.css` for shell/HUD/canvas sizing and the diner-only shared-selector scope.
7. Check `src/assets/` before changing imports or filenames.
8. Run the appropriate checks before delivery.

## Source Anchors

| Symbol | Why it matters |
| --- | --- |
| `DISH_WISH_PATH`, `DROP_HOP_PATH`, `canonicalizePath`, `App` | Client-side path selection, legacy aliases, history updates, document titles, and portal fallback. |
| `GamePortal` | Root two-game chooser and preview cards. |
| `FOODS`, `foodArtById` | Diner food inventory and image mapping. |
| `CUSTOMERS`, `DishWishScene.CUSTOMER_ASSETS` | Guest inventory and Phaser directional-sheet preload map. |
| `DINER_LEVELS`, `TARGET_SERVES`, `difficultyForLevel` | Diner progression and pacing. |
| `DINER_DOOR_TILE`, `SEAT_LAYOUT` | Door, table-edge customer coordinates, facing, and four persistent logical table positions. |
| `buildTileRoute`, `getRouteVisual`, `getGuestVisual` | Collision-free diner tile routes, interpolated positions, and directional actor state. |
| `makeGuest`, `makeDecoyFood`, `chooseAvailableDishSlot`, `chooseSpawnLane` | Diner guest and stable-slot dish generation. |
| `handleGuestSelect`, `revealGuestOrder`, `handleFoodDrop` | Diner order-taking and serving decisions. |
| `CITY_LOCATIONS`, `CITY_ROADS`, `CITY_MISSIONS` | Drop Hop map, road graph, and lesson content. |
| `DropHopGame`, `handleCityLocationClick`, `completeCityMission` | Drop Hop state, movement, scoring, and completion. |
| `getCityRoadKey`, `DropHopMap`, `DropHopScene` | Exact traversed-edge snapshots, accessible controls, and Phaser map rendering. |
| `PhaserGameHost`, `DishWishStage`, `DishWishScene` | Shared renderer lifecycle and Dish Wish canvas boundary. |

## Product Shape

- `/` is the two-game Lingo Game portal.
- `/games/dish-wish` launches Dish Wish.
- `/games/drop-hop` launches Drop Hop.
- The old `/games/table-talk-diner` and `/games/tiny-city-delivery` paths remain aliases that replace
  themselves with the corresponding canonical route.
- In-app navigation uses the History API without a router package.
- Unknown paths render the portal without replacing the address.
- Both games have a portal-return control.

The app has no backend, accounts, saved progress, analytics, automated tests, CI workflow, or
provider-specific deployment configuration.

## Where To Change Things

| Task | Start in |
| --- | --- |
| Change portal cards or path behavior | `GamePortal`, `App`, and portal styles. |
| Add a diner food or guest | Model/data in `src/App.tsx`, preload maps in `DishWishScene`, then `src/assets/`. |
| Tune diner difficulty | Named constants and `difficultyForLevel`. |
| Change serving or scoring | `handleFoodDrop`, `resetCombo`, and completion branches. |
| Change city locations or roads | `LocationId`, `CITY_LOCATIONS`, `CITY_ROADS`, then `DropHopScene` geometry if needed. |
| Add or alter city missions | `CITY_MISSIONS`; keep phrase and structured fields aligned. |
| Change playfield layout or animation | Owning Phaser scene plus canvas-host CSS; preserve diner-only selector scoping. |
| Tune speech or tones | `speak`, both `playSound` callbacks, and `scheduleTone`. |

## High-Risk Gotchas

| Gotcha | Detail |
| --- | --- |
| Static deep links need fallback routing | Hosts must serve `index.html` for both `/games/...` paths. |
| Diner and city share generic class names | Diner full-viewport overrides must stay under `.appShell:not(.appShell--city)` when they touch `.mainSurface`, `.gameGrid`, `.resultBanner`, or `.sceneBackdrop`. |
| `targetGuestId` is dish lifecycle metadata | The table receiving a drop decides service; a decoy can satisfy a matching request. `leavingAt` retains dishes only for their exit animation. |
| `selectFoods` requires enough unique foods | Never allow `orderSize > FOODS.length`. |
| Diner has no mid-shift pause | Drop Hop has ready/play/pause/end controls; the diner starts automatically and only offers a new shift after completion. |
| Audio is browser-dependent | Speech and Web Audio may be absent or gesture-gated. |
| Empty and entering tables are not selectable | The Dish Wish scene adds hit areas only for seated guests; once seated, table selection reveals and speaks the order immediately. |
| Road highlighting is edge-based | Keep consecutive-path logic in React and pass exact edge keys to Phaser; checking only whether both stops appear in the path produces false highlights. |
| Phaser is a renderer, not the state owner | Scenes emit IDs and drops. React remains authoritative for rules, score, timing, pickup, delivery, and cleanup. |

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
