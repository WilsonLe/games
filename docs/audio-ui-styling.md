---
description: "Speech, Web Audio, React UI layers, Phaser scenes, accessibility, and responsive layout."
references: []
---

# Audio, UI, And Styling

[Docs index](./README.md) | [Repo README](../README.md)

## Speech Synthesis

`speak(text, rate = 0.9)`:

1. returns `false` when `speechSynthesis` is unavailable;
2. cancels any current utterance;
3. creates `SpeechSynthesisUtterance` with `en-US`, the requested rate, pitch `1`, and volume `0.95`;
4. speaks it and returns `true`.

| Trigger | Spoken content |
| --- | --- |
| Dish Wish order reveal | The selected guest's order; selecting another seated guest cancels and replaces unfinished speech. |
| Dish Wish serve/wrong/complete | Served food, incorrect-dish message, happy guest line, or final completion. |
| Drop Hop start/reset/new ticket | Current mission phrase. |
| Drop Hop listen | Current mission phrase, with visible fallback if unavailable. |
| Drop Hop pickup/wrong/complete | Pickup, route error, or completion feedback. |

Only order/listen flows that inspect the boolean result explicitly report unavailable speech. Other
automatic callers remain visual-first but ignore a failed speech return.

## Web Audio

`scheduleTone` creates an oscillator and gain envelope. Each game lazily owns an audio context,
resumes it when suspended, and closes it on unmount.

| Game/event | Pattern |
| --- | --- |
| Dish Wish correct | Triangle `660Hz`, `880Hz`. |
| Dish Wish complete | Triangle `523.25Hz`, `659.25Hz`, `783.99Hz`, `1046.5Hz`. |
| Dish Wish wrong | Sawtooth `180Hz`, `130Hz`. |
| City correct | Triangle `523.25Hz`, `698.46Hz`. |
| City complete | Triangle `587.33Hz`, `783.99Hz`, `1174.66Hz`. |
| City wrong | Sawtooth `170Hz`, `120Hz`. |

There are no audio files. Web Audio may be absent or gesture-gated; `playSound` returns `false`, and
callers currently do not surface that failure.

## Portal UI

`GamePortal` renders:

- a fixed kitchen-art backdrop and dark overlay;
- a `Mini-game portal` header;
- one real anchor card per game;
- imported diner preview art;
- a CSS-built Drop Hop preview;
- stacked cards below `980px` and tighter art/card dimensions below `560px`.

The portal scrolls vertically when the two cards exceed the viewport. Phaser is dynamically imported
only after a game route renders, so the chooser does not pay the engine download cost.

## React And Phaser Layers

React and CSS own:

- `.appShell`, `.mainSurface`, navigation, HUDs, score/status panels, result banners, and feedback;
- the Drop Hop ticket/clue/fact panels and each game's fixed dynamic-viewport shell;
- `.phaserStage` sizing, renderer loading fallbacks, and focus-revealed keyboard controls.

Phaser owns the two interactive playfields:

| Scene | Canvas content |
| --- | --- |
| `DishWishScene` | Kitchen pass, six slots, floor grid, door, tables/chairs, customer sprites, speech bubbles, patience bars, dish sprites, lifetime bars, drag targets, and movement tweens. |
| `DropHopScene` | City blocks, river, roads, traversed edges, route dots, location markers/labels, mission rings, courier/cargo, relation label, and movement tween. |

Gameplay truth remains in React. Scenes consume snapshots and emit semantic selection/drop events.
Both game routes lock document scrolling; the portal remains vertically scrollable. See
[Phaser Rendering Engine](./rendering-engine.md) for the exact boundary.

## Critical CSS Scope

Both games use fixed dynamic-viewport shells, with separate responsive rules for Dish Wish and Drop Hop. Any shared override
touching `.appShell`, `.sceneBackdrop`, `.mainSurface`, `.gameGrid`, or `.resultBanner` must remain
scoped under:

```css
.appShell:not(.appShell--city)
```

Without that scope, Drop Hop's responsive fixed-viewport grid can inherit diner placement. The old
DOM-scene selectors remain separate from the active `.restaurantStage--phaser`,
`.cityMapPanel--phaser`, and `.phaserStage` host rules. New visual scene work belongs in Phaser.

## Dish Wish Grid And Animation

Dish Wish keeps the logical 10 × 5 route grid. The scene computes the largest square tile size that
fits below the kitchen and centers the floor. Under `560px`, `gridPoint` transposes the logical axes
into a 5 × 10 portrait floor without changing route data.

The 100ms React clock supplies fractional route visuals at `360ms` per tile. Persistent guest sprites
tween between samples and play dedicated four-frame south, north, east, or west sheet rows at
approximately `120ms` per frame (`480ms` per loop). Seated guests display column 0 of the row that
faces their table edge. Static kitchen/floor graphics are cached until a resize instead of being
rebuilt on every clock sample.

Dish containers persist by instance ID. Phaser pointer/touch drag events move the visible container,
resolve a seated table on release, then call React for validation. Correct and wrong outcomes,
patience, score, speech, tones, and cleanup stay in React.

## Drop Hop Layout And Animation

Default `.cityGameGrid` has three columns:

1. mission ticket and feedback;
2. Phaser map;
3. clue/fact panel.

Below `1100px`, the clue panel spans a compact full row. Below `700px`, the mission ticket and clue
panel compress around a flexible Phaser map so the entire game remains visible without document
scrolling. The scene converts percentage location coordinates to pixels after every resize.

Only edge keys from consecutive path pairs are emphasized. Route dots include repeated stops. A
valid React location change triggers the directional courier walk cycle and a `360ms` tween; cargo
follows the courier.

## Accessible Controls

Canvas objects support pointer and touch interaction, but canvas alone is not the semantic interface.
`DishWishStage` and `DropHopMap` render native buttons in `.phaserA11yControls`:

- they remain in keyboard and assistive-technology order;
- they become visible when focus enters the group;
- guest buttons expose order/patience state;
- dish buttons serve to the selected guest;
- city buttons expose all location names and the current location.

React feedback remains in live/status regions. Both Phaser scenes read `prefers-reduced-motion` at
creation and disable movement tweens/walk loops while still applying state positions.

## Visual Rules

- Preserve chunky borders, offset shadows, and the compact arcade palette.
- Keep ordinary panel/button radii at `8px` or less; circular map/table/courier elements are intentional.
- Keep sprites non-semantic; scene hit areas plus native companion buttons own input.
- Do not let diner full-viewport rules leak into `.appShell--city`.
- Check the portal, Dish Wish, and Drop Hop at desktop, `980px`, `560px`, and a short mobile viewport.
- Keep all six Dish Wish pass slots visible, table bubbles readable, and map labels away from page panels.
- Inspect the browser console for texture, WebGL, or lazy-chunk errors after renderer changes.

## Cursor

`--game-cursor: url("./assets/game-cursor.svg") 7 6, auto` is applied globally. Verify the hotspot if
the SVG changes. Phaser canvas input inherits the page cursor except when the scene assigns a
pointer/grab cursor to an interactive object.
