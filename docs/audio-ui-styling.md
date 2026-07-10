---
description: "Speech, Web Audio, portal and game UI layers, CSS scope, animation, and responsive layout."
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
| Dish Wish order reveal | A rotating greeting plus the guest's order. |
| Dish Wish serve/wrong/complete | Served food, wrong-table message, happy guest line, or final completion. |
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

The portal scrolls vertically when the two cards exceed the viewport.

## Shared Game UI

- `.appShell` is the root for either game.
- `.mainSurface` is the primary game content wrapper.
- `.topBar`, `.scoreStrip`, `.statPill`, `.resultBanner`, buttons, and feedback classes are shared.
- Drop Hop uses the normal document layout and must be allowed to scroll at narrow sizes.
- Dish Wish intentionally uses a fixed full-viewport stage.

## Critical CSS Scope

The later section headed `/* Top-down restaurant game stage */` overrides generic classes for the
diner. Any override touching `.appShell`, `.sceneBackdrop`, `.mainSurface`, `.gameGrid`, or
`.resultBanner` must remain scoped under:

```css
.appShell:not(.appShell--city)
```

Without that scope, Drop Hop's three-column grid becomes a block, its result banner becomes fixed,
and its content can be clipped by diner overflow rules. Diner-specific classes such as
`.restaurantStage`, `.guestTable`, and `.kitchenStation` do not need the extra qualifier because Drop
Hop does not render them.

## Dish Wish Layers

| Layer/class | Position | z-index | Role |
| --- | --- | ---: | --- |
| `.floorTiles` / `.floorTile` | responsive grid below kitchen | 0 | Opaque 10 × 5 dining-floor grid aligned to actor coordinates. |
| stage frame/wall pseudo-elements | absolute | 1–2 | Room boundary and kitchen wall. |
| `.kitchenStation` | absolute top | 4 | Kitchen-art backdrop, burners, cabinets, and dish rail. |
| `.restaurantDoor` | tile-positioned | 8 | Guest entry/exit. |
| `.guestTable` | tile-positioned | 11 / 18 selected | One of four persistent tables; guest UI appears only while occupied. |
| `.characterActor--customer` | tile-positioned | `14 + row` | Guest art rendered by the shared actor. |
| `.characterActor--waiter` | tile-positioned | `16 + row` | Waiter art rendered at the same height and tile cadence. |
| `.gameHud` | fixed | 30 | Portal button and three stats. |
| `.dinerFeedback` / result | fixed | 31 | Visible status or completion controls. |
| `.dragDishPreview` | fixed | 60 | Pointer drag preview. |

The 100ms React clock samples fractional progress along each route segment, and matching linear
`top`/`left` transitions bridge those samples so actors travel smoothly at `360ms` per tile. The
shared character renderer loops four-frame south, north, or east sheet rows at `720ms` (`180ms` per
frame) while a route is active; west mirrors east. Stopped actors use the front idle cell.

## Dish Wish Tile System

`restaurantStage` defines the dining inset/top and derives `--tile-width` and `--tile-height` from the
remaining viewport below the kitchen. The stage renders 50 opaque `floorTile` elements as a 10 × 5
CSS grid. Logical coordinates use columns 0–9 and rows 0–4; actors, the door, and four persistent
tables use the corresponding responsive cell centers:

```css
calc(var(--dining-inset) + var(--column-center) * var(--tile-width))
calc(var(--dining-top) + var(--row-center) * var(--tile-height))
```

`--tile-size` is retained only to scale character art from the smaller responsive cell dimension. Below
`560px`, the dining inset/top, kitchen dimensions, table/sprite size, and speech bubble offsets are
reduced independently. Check all four tables after changing these variables.

## Drop Hop Layout

Default `.cityGameGrid` has three columns:

1. mission ticket and feedback;
2. map;
3. clue/fact panel.

Below `1360px`, the clue panel spans the full row. Below `980px`, the layout becomes one column. The
map uses percentage-positioned location buttons and road geometry, so desktop and mobile checks are
required after coordinate or minimum-height changes.

`CityMap` marks only consecutive path edges as used. Route dots show each visited stop, including
repeats.

## Feedback And Controls

- Dish Wish feedback is a visible fixed status toast with `aria-live="polite"` while playing.
- Dish Wish completion replaces the toast with a result banner and `New Shift` action.
- Drop Hop feedback stays in the mission column with `role="status"`.
- Both game routes expose a portal-return button.
- Buttons and location/table/dish controls remain native interactive elements.

## Animation Inventory

Active animations include portal backdrop pan, dish card entry/content bob/exit, selected guest bob,
Dish Wish four-frame sheet loops, linear actor travel, and actor step/shadow motion, plus Drop Hop
pickup pulse, delivery pop, and courier bob. Dish entry/exit runs on the button while its nested dish
content bobs inside padded rail clearance. Direction classes select south, north, or east rows;
west-facing art mirrors east. Under `prefers-reduced-motion: reduce`, diner position transitions are
disabled and gait, step, and shadow loops freeze on the first directional frame while route-position
updates continue.

## Visual Rules

- Preserve chunky borders, offset shadows, and the compact arcade palette.
- Keep ordinary panel/button radii at `8px` or less; circular map/courier elements are intentional.
- Keep character actors non-interactive; tables, dishes, and map stops own input.
- Do not let diner full-viewport rules leak into `.appShell--city`.
- Check the portal, Dish Wish, and Drop Hop at desktop, `980px`, `560px`, and a short mobile viewport.
- Keep dish buttons stable in size and retain keyboard service.

## Cursor

`--game-cursor: url("./assets/game-cursor.svg") 7 6, auto` is applied globally. Verify the hotspot if
the SVG changes.
