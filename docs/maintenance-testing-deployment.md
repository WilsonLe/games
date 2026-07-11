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
2. Update `FoodId`, the import, `FOODS`, and `foodArtById`.
3. Confirm `difficultyForLevel().orderSize <= FOODS.length`.
4. Update `docs/assets.md`.
5. Build and smoke-test food rendering in the portal/game where applicable.

### Add A Diner Customer

1. Add a 4 × 4 directional sheet at
   `src/assets/sprites/generated/walk/customer-{id}-walk-sheet.png` using the shared cell size and row order.
2. Update `CustomerProfile`, `CUSTOMERS`, the sheet import, and `customerWalkSheetById`.
3. Add a still image only if the portal or another component imports it.
4. Update `src/assets/sprites/generated/walk/manifest.json` and `docs/assets.md`.
5. Verify idle, south, north, east, mirrored-west, reduced-motion, and responsive rendering states.

### Tune Diner Difficulty

| Symbol | Effect |
| --- | --- |
| `DINER_LEVELS`, `TARGET_SERVES` | Per-level order targets, difficulty curve, and derived completion target. |
| `HAPPY_GUEST_COMBO_BONUS` | Consecutive completed-guest bonus. |
| `FIRST_DISH_DELAY_MS` | First ordered dish timing. |
| `NEXT_GUEST_AFTER_COMPLETE_MS` | Replacement pacing. |
| `DINER_CLOCK_MS`, `CHARACTER_STEP_MS` | Customer-route sampling interval and linearly interpolated travel time per tile. |
| `LEAVING_GUEST_LINGER_MS` | Post-route doorway fade and guest cleanup. |
| `DISH_EXIT_MS` | Serving-line exit-animation cleanup delay. |
| `WRONG_DISH_PATIENCE_BASE_MS`, `WRONG_DISH_PATIENCE_PER_LEVEL_MS` | Level-scaled patience removed by an incorrect dish. |
| `SERVED_DISH_PATIENCE_BONUS_MS` | Patience rewarded by a correct dish. |
| `ORDER_LANES` | Lane selection/lift; requires matching CSS support. |
| `difficultyForLevel` | Capacity, order size, dish timing, decoys, and patience. |

Test scheduled spawn, blocked-lane retry (`650ms`), recycle, expiration, replacement guests, scoring,
and completion after changes.

### Change Drop Hop Data

- Location: update `LocationId`, `CITY_LOCATIONS`, `CITY_ROADS`, and affected missions.
- Road: keep `CITY_ROADS` undirected through `cityNeighbors`; inspect visual geometry.
- Mission: align phrase, pickup, dropoff, item, quantity, relation, focus words, reward, and optional
  required stop.
- Item: update `DeliveryItemId`, `CITY_ITEMS`, and any mission references.

Test pickup at the depot and elsewhere, invalid roads, detours, required stops, score, win, loss,
pause guidance, and exact edge highlighting.

### Change Shared Layout

Before editing `.mainSurface`, `.gameGrid`, `.resultBanner`, `.sceneBackdrop`, or `.appShell`, inspect
both game routes. Diner full-viewport overrides must remain scoped with
`.appShell:not(.appShell--city)` so Drop Hop keeps its grid and scroll behavior.

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
| Initial load | One guest enters; score 0, orders 0/24, level 1, and six kitchen-pass slots are visible. Patience and ordered-food timing wait until seating. |
| Guest selection | After seating, the full customer/table area reveals and speaks the order immediately; selecting another customer replaces unfinished speech, and earlier orders remain visible. |
| Character travel and walk cycles | All six customers move smoothly at `360ms` per tile, advance four distinct frames at `180ms` per frame in south, north, east, and mirrored-west movement, finish the endpoint transition before returning to front idle, and fade naturally at the doorway without flicker or size jitter. |
| Reduced motion | With reduced motion enabled, position transitions and gait/step/shadow loops stop while required route-position updates continue. |
| Correct dish | Dish animates off, chip and patience update, score rises, and visible good feedback appears. |
| Drop before order | Dish remains and status asks the player to select the customer and hear the order. |
| Drop outside | Dish remains and status explains where to serve it. |
| Incorrect dish | Dish remains available, the receiving guest loses level-scaled patience, score/combo stay unchanged, and bad feedback appears. |
| Expiration | Guest leaves and owned dishes animate off before cleanup. |
| Pass capacity | At most six dishes occupy the pass; additional ordered dishes retry and decoys wait until a slot opens. |
| Keyboard service | `Enter`/`Space` serves to selected table. |
| Win | At 24 orders, completion banner and `New Shift` appear. |
| New Shift | All diner counters and runtime state reset. |

### Drop Hop

| Test | Expected |
| --- | --- |
| Initial load | Ready state with Start Route and no movement until start. |
| Valid adjacent move | Courier/path advances and only the traversed edge highlights. |
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

Verify portal scrolling, diner HUD/status/table overlap, Drop Hop document scrolling, map readability,
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
publication.

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
