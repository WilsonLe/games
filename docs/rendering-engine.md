---
description: "Phaser 2D rendering boundary, React state bridge, scene ownership, accessibility, and performance guidance."
references: []
---

# Phaser Rendering Engine

[Docs index](./README.md) | [Repo README](../README.md)

## Decision

Dish Wish and Drop Hop use **Phaser 4.2.1** for their interactive 2D playfields. React remains the
application shell and authoritative gameplay/state layer. Phaser owns canvas rendering, sprite-sheet
animation, hit testing, drag input, and movement tweens only.

This boundary fits the current games because both are small 2D grids with characters and custom
rules. They do not need a physics simulation, 3D camera, ECS, editor-authored scenes, or a second
source of gameplay truth inside Phaser.

The portal does not load Phaser. `src/App.tsx` lazy-loads each game renderer, and Vite places the
shared Phaser runtime in a route-only chunk. This keeps the root chooser usable without downloading
the engine.

## Files And Ownership

| File | Responsibility |
| --- | --- |
| `src/game-runtime/PhaserGameHost.tsx` | Creates one responsive Phaser game with a scene-specific opaque clear color, destroys it on React unmount, and reports the scene instance to its adapter. |
| `src/games/dish-wish/DishWishStage.tsx` | Converts React props into a scene snapshot and exposes hidden-on-canvas keyboard controls. |
| `src/games/dish-wish/DishWishScene.ts` | Draws the kitchen, square grid, tables, guests, dishes, timers, and drag/drop targets. |
| `src/games/drop-hop/DropHopMap.tsx` | Bridges the Drop Hop snapshot/callback and exposes keyboard-accessible location buttons. |
| `src/games/drop-hop/DropHopScene.ts` | Draws blocks, river, roads, stops, route history, courier, cargo, labels, and map hit targets. |
| `src/App.tsx` | Owns rules, timing, generation, scoring, speech, tones, routing, and all React state. |
| `src/styles.css` | Sizes canvas hosts, HUD/panels, fallbacks, focus-revealed keyboard controls, and responsive page layout. |

## Runtime Boundary

React sends immutable view snapshots to each scene:

- Dish Wish: status, current time, selected guest, guest route visuals, patience, visible dishes,
  lanes, and dish lifetime progress.
- Drop Hop: status, location/road data, traversed edges, full path, current stop, mission targets,
  cargo state, and relation label.

Scenes send semantic events back to React:

- Dish Wish: `onGuestSelect(guestId)` and `onFoodDrop(foodInstanceId, guestId | null)`.
- Drop Hop: `onLocationSelect(locationId)`.

A scene must not award points, complete a mission, mutate React collections, or independently decide
whether an action is correct. It may calculate presentation-only geometry such as pixel positions,
colors, animation direction, or hit radii.

## Dish Wish Rendering

The scene preserves the logical 10 × 5 diner coordinate system used by `buildTileRoute` and
`getGuestVisual`. On screens below `560px`, `gridPoint` transposes logical rows and columns into a
5 × 10 portrait grid; gameplay coordinates do not change.

- The kitchen and floor are cached until a resize.
- Four table controls are rebuilt from the latest guest snapshot so speech and patience stay current.
- Guest sprite objects persist by guest instance ID and tween between the 100ms React route samples.
- Each `1536 × 1024` customer sheet is sliced into `384 × 256` cells. Rows 0–3 are dedicated south,
  north, east, and west walk cycles at approximately `120ms` per frame; non-walking guests use column
  0 of their facing row.
- Dish containers persist by food instance ID. Phaser drag events move them and resolve a table hit
  on release; React validates the serving result.
- Phaser renders all six kitchen-pass slots, dish lifetime bars, speech bubbles, and selected/drop
  target emphasis.

## Drop Hop Rendering

The scene converts each location's percentage coordinates into canvas pixels. It draws the
undirected road graph, then emphasizes only edge keys supplied from consecutive pairs in React's
actual path. Location markers remain semantic callback targets rather than owning movement rules.

The courier uses the same four-direction sheet format as Dish Wish. Valid React state changes move it
with a short tween and walk cycle; the cargo badge follows the same destination. Map stops, relation
labels, route dots, current/pickup/dropoff/required-stop rings, and delivered state are rendered in
the scene.

## Input And Accessibility

Canvas objects support pointer/touch input:

- tap a Dish Wish table to hear/select an order;
- drag a dish to a table;
- tap a Drop Hop location to request movement.

Canvas content is not a replacement for semantic controls. Each React adapter includes native
buttons in `.phaserA11yControls`. They remain in keyboard and assistive-technology order and become
visually visible with `:focus-within`. Dish buttons serve to the currently selected guest, matching
the former keyboard flow. React status regions continue to announce outcomes.

Both scenes read `prefers-reduced-motion` when created. Reduced motion disables Phaser route tweens
and walk cycles while snapshots still advance to the required positions.

## Responsive And Lifecycle Rules

- Use `Phaser.Scale.RESIZE` and size the parent in CSS; never hard-code a viewport resolution.
- Keep the Dish Wish host at the full viewport. Drop Hop's map host must fill the flexible middle row
  of its fixed-viewport grid with `height: 100%` and `min-height: 0`; do not reintroduce document overflow.
- Create a scene only through `PhaserGameHost`; React Strict Mode may mount, destroy, and remount it
  during development.
- Destroy the Phaser game with `game.destroy(true)` on unmount so WebGL contexts, input listeners,
  textures, and timers do not leak across routes.
- Keep static Dish Wish geometry cached. The React clock updates at 100ms, so rebuilding background
  graphics on every snapshot is an avoidable performance regression.

## Asset And Engine Changes

When adding art, preload it in the owning scene and keep source IDs aligned with the React model.
When changing Phaser or the bridge:

1. run `npm run build`;
2. run `npm audit`;
3. verify `/` does not request the Phaser chunk before a game opens;
4. test both game routes, portal returns, and browser back/forward;
5. test pointer and keyboard controls at desktop, `560px`, and a short mobile viewport;
6. inspect console/network output for WebGL, texture, and chunk-loading errors;
7. run `git diff --check`.

Phaser's `AUTO` renderer prefers WebGL and falls back to Canvas. Do not introduce a 3D renderer for
these games unless the product changes beyond 2D grids; that would add complexity without improving
the current mechanics.
