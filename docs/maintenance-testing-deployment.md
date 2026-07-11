---
description: "Maintenance recipes, two-game browser smoke tests, build verification, and static deployment notes."
references: []
---

# Maintenance, Testing, And Deployment

[Docs index](./README.md) | [Repo README](../README.md)

## Common Change Recipes

### Change Portal Routing

1. Update route constants and `App` path branches together.
2. Keep portal cards as real anchors.
3. Preserve modified-click behavior in `handleGameLinkClick`.
4. Update document-title logic and every route table in docs.
5. Verify root, direct game URLs, browser back/forward, and both home buttons.
6. Document static-host fallback requirements for any new deep path.

### Add A Diner Food

1. Add `src/assets/sprites/food-{id}.png`.
2. Update `FoodId`, `DishWishFoodId`, both imports, `FOODS`, `foodArtById`, `FOOD_ASSETS`, and `FOOD_NAMES`.
3. Confirm `difficultyForLevel().orderSize <= FOODS.length`.
4. Update `docs/assets.md`.
5. Build and smoke-test food rendering in the portal/game where applicable.

### Add A Diner Customer

1. Add a 4 × 4 directional sheet at
   `src/assets/sprites/generated/walk/customer-{id}-walk-sheet.png` using the shared cell size and row order.
2. Update `CustomerProfile`, `DishWishCustomerId`, `CUSTOMERS`, and `CUSTOMER_ASSETS` in `DishWishScene`.
3. Add a still image only if the portal or another component imports it.
4. Update `src/assets/sprites/generated/walk/manifest.json` and `docs/assets.md`.
5. Verify direction-matched idle, south, north, east, west, reduced-motion, and responsive rendering states.

### Tune Diner Difficulty

| Symbol | Effect |
| --- | --- |
| `DINER_LEVELS`, `TARGET_SERVES` | Per-level order targets, difficulty curve, and derived completion target. |
| `HAPPY_GUEST_COMBO_BONUS` | Consecutive completed-guest bonus. |
| `FIRST_DISH_DELAY_MS` | First ordered dish timing. |
| `NEXT_GUEST_AFTER_COMPLETE_MS` | Replacement pacing. |
| `DINER_CLOCK_MS`, `CHARACTER_STEP_MS` | React route-sampling interval and travel time per tile; the Phaser scene bridges samples with short tweens. |
| `LEAVING_GUEST_LINGER_MS` | Post-route doorway fade and guest cleanup. |
| `DISH_EXIT_MS` | Serving-line exit-animation cleanup delay. |
| `WRONG_DISH_PATIENCE_BASE_MS`, `WRONG_DISH_PATIENCE_PER_LEVEL_MS` | Level-scaled patience removed by an incorrect dish. |
| `SERVED_DISH_PATIENCE_BONUS_MS` | Patience rewarded by a correct dish. |
| `SUPPLY_DELAY_RETRY_MS` | Ordered-dish retry cadence and matching patience compensation when the pass blocks supply. |
| `MISSED_RECAP_MS`, `MAX_PRACTICE_REPEATS_PER_FOOD` | Duration and bound for expiration recap plus later-word repetition. |
| `ORDER_LANES` | Lane selection/lift; requires matching `DishWishScene` placement support. |
| `difficultyForLevel` | Capacity, order size, dish timing, decoys, first-decoy onset, and patience. |

Test scheduled spawn, blocked-lane retry (`650ms`) plus patience compensation, `Coming next`/`On the pass`
forecasting, recycle, expiration recap, bounded later repetition, replacement guests, scoring, and
completion after changes.

### Change Drop Hop Data

- Location: update `LocationId`, `CITY_LOCATIONS`, `CITY_ROADS`, and affected missions.
- Road: keep `CITY_ROADS` undirected through `cityNeighbors`; inspect visual geometry.
- Mission: align phrase, pickup, dropoff, item, quantity, relation, focus words, reward, and optional
  required stop.
- Item: update `DeliveryItemId`, `CITY_ITEMS`, and any mission references.

Test pickup at the depot and elsewhere, invalid roads, detours, required stops, score, win, loss,
pause guidance, and exact edge highlighting.

### Change A Phaser Scene

- Keep gameplay decisions in `RestaurantGame` or `DropHopGame`; scenes render snapshots and emit IDs.
- Preload textures in the owning scene and keep scene ID unions aligned with `src/App.tsx`.
- Create/destroy scenes only through `PhaserGameHost`.
- Keep Dish Wish static geometry cached between resizes; its snapshot updates every `100ms`.
- Preserve native companion buttons in `.phaserA11yControls` when changing canvas input.
- Verify WebGL and Canvas-capable browsers, reduced motion, desktop/mobile sizing, and route unmounts.

### Change Shared Layout

Before editing `.mainSurface`, `.gameGrid`, `.resultBanner`, `.sceneBackdrop`, `.appShell`, or a
`.phaserStage` host, inspect both game routes. Both games are fixed to the dynamic viewport with
scrolling disabled, while diner overrides must remain scoped with `.appShell:not(.appShell--city)` so
Drop Hop keeps its own responsive grid.

### Replace Art Or Cursor

Replace files in place when possible, verify crop/sheet alignment and mobile framing, then run the
build so Vite validates imports. For cursor changes, verify the `7 6` hotspot.

## Browser Smoke Tests

Run `npm run dev`, then inspect the console throughout.

### Portal And Routing

| Test | Expected |
| --- | --- |
| `/` | Header says mini-game portal and exactly two playable cards render. |
| Dish Wish card | URL and title change; diner starts. |
| Drop Hop card | URL and title change; city opens ready. |
| Home buttons | Return to `/` without reload. |
| Back/forward | Restores portal/game views and titles. |
| Direct canonical route | `/games/dish-wish` and `/games/drop-hop` work in Vite; production also needs SPA fallback. |
| Direct legacy route | Old paths launch the matching game and replace the address with its canonical route. |
| Unknown path | Portal renders and URL stays unchanged. |

### Dish Wish

| Test | Expected |
| --- | --- |
| Initial load | One guest enters; score 0, orders 0/24, level 1, and six kitchen-pass slots are visible. Patience and ordered-food timing wait until seating, and the first seated guest shows the visible guided helper and cannot expire before the first correct serve. |
| Level pacing | Levels 1-2 stay at one guest with one-item orders, level 3 is the first two-item level, level 4 is the first concurrent-guest level, and level 6 is the first three-item level. |
| Guest selection | After seating, the full customer/table area reveals and speaks the order immediately; level 1 uses the stable `I'd like …, please.` frame, the helper panel shows highlighted word cards/replay buttons, and selecting another customer replaces unfinished speech while earlier revealed orders remain visible. |
| Character travel and walk cycles | All six Phaser sprites take collision-free routes around table tiles, move smoothly at `360ms` per tile, advance four distinct frames near `120ms` per frame in dedicated south, north, east, and west rows, and settle on the configured table-facing row. |
| Reduced motion | With reduced motion enabled, Phaser route tweens and walk loops stop while required route-position updates continue. |
| Correct dish | Dish animates off, chip and patience update, score rises, correct audio feedback plays, and the helper briefly echoes the served picture/word with a replay control. |
| Drop before order | Dish remains; speech and the screen-reader status announcement ask the player to select the customer and hear the order. |
| Drop outside | Dish remains and the screen-reader status announcement explains where to serve it. |
| Incorrect dish | Dish remains available, the receiving guest loses level-scaled patience, score/combo stay unchanged, and wrong audio feedback plays; the untimed opening order gives guidance without a patience penalty. |
| Supply fairness | When a due requested dish is blocked by pass capacity or lane gating, the revealed order shows `Coming next` until the dish appears and the guest does not lose patience solely because the game withheld supply. |
| Expiration | Guest leaves and owned dishes animate off before cleanup; a visible missed-word recap appears with food art/labels, and at least one missed item later returns in a bounded `Practice again` order. |
| Pass capacity | At most six dishes occupy stable slots; removing a middle dish leaves its slot blank, other dishes do not shift, the next eligible dish fills an available blank, additional ordered dishes retry, and decoys wait until a slot opens. |
| Keyboard service | Tab into the focus-revealed native controls; guest activation selects/hears an order and dish activation serves to the selected table. Verify the opening guided order can be completed without pointer drag. |
| Win | At 24 orders, completion banner and `New Shift` appear. |
| New Shift | All diner counters and runtime state reset. |

### Drop Hop

| Test | Expected |
| --- | --- |
| Initial load | Ready state with Start Route and no movement until start. |
| Valid adjacent move | Phaser courier/path advances and only the traversed edge highlights. |
| Invalid move | No movement, one life lost, streak reset. |
| Pickup | Basket updates at the configured pickup. |
| Valid detour | Allowed with guidance; no mistake. |
| Delivery | Score/drops/streak update and next ticket loads. |
| Pause click | Map does not move and feedback says to resume. |
| Five mistakes | Route closes. |
| Ten deliveries | City route completes. |
| New/reset route | State returns to mission 1 at the depot. |

### Viewports

Check at least:

- desktop above `1360px`;
- around `980px`;
- around `560px`;
- 320–380px width;
- a short mobile viewport around 620px height.

Verify portal scrolling, both game routes remain viewport-locked with no document scrolling, diner
HUD/table overlap, Drop Hop map readability, canvas sizing, focus-revealed native controls,
and no clipped controls.

## Command Verification

Docs-only:

```bash
git diff --check
```

Source, imports, dependencies, assets, or package metadata:

```bash
npm ci          # when dependencies are missing or suspect
npm run build
npm audit
git diff --check
```

No automated test script exists today. `npm audit` should report zero known vulnerabilities before
publication. The production build should keep Phaser out of the initial portal chunk; confirm the
engine chunk is fetched only after opening a game.

## Documentation Validation

After Markdown or `AGENTS.md` changes:

1. verify every frontmatter `references` path exists;
2. verify local Markdown links resolve;
3. search for stale constants and route claims;
4. use Hunter graph validation when exposed;
5. report the tool as unavailable when it is not exposed rather than claiming it ran.

## Deployment

- Output: `dist/` from `npm run build`.
- Hosting: any static host that can serve Vite output.
- Required rewrite: send the canonical `/games/dish-wish` and `/games/drop-hop` paths, plus legacy
  aliases `/games/table-talk-diner` and `/games/tiny-city-delivery`, to `index.html` for direct
  loads/refreshes.
- Base path: current links assume hosting at `/`; a subpath deployment requires coordinated Vite and
  route changes.
- Provider config and CI: none in this repository.

## Commit Boundaries

Commit source, assets, docs, and package metadata that belong to the task. Do not commit
`node_modules/`, `dist/`, local `.pi/` Hunter state, `.DS_Store`, or `*.local` files.
