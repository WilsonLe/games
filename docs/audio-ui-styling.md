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
| Diner order reveal | A rotating greeting plus the guest's order. |
| Diner serve/wrong/complete | Served food, wrong-table message, happy guest line, or final completion. |
| Tiny City start/reset/new ticket | Current mission phrase. |
| Tiny City listen | Current mission phrase, with visible fallback if unavailable. |
| Tiny City pickup/wrong/complete | Pickup, route error, or completion feedback. |

Only order/listen flows that inspect the boolean result explicitly report unavailable speech. Other
automatic callers remain visual-first but ignore a failed speech return.

## Web Audio

`scheduleTone` creates an oscillator and gain envelope. Each game lazily owns an audio context,
resumes it when suspended, and closes it on unmount.

| Game/event | Pattern |
| --- | --- |
| Diner correct | Triangle `660Hz`, `880Hz`. |
| Diner complete | Triangle `523.25Hz`, `659.25Hz`, `783.99Hz`, `1046.5Hz`. |
| Diner wrong | Sawtooth `180Hz`, `130Hz`. |
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
- a CSS-built Tiny City preview;
- stacked cards below `980px` and tighter art/card dimensions below `560px`.

The portal scrolls vertically when the two cards exceed the viewport.

## Shared Game UI

- `.appShell` is the root for either game.
- `.mainSurface` is the primary game content wrapper.
- `.topBar`, `.scoreStrip`, `.statPill`, `.resultBanner`, buttons, and feedback classes are shared.
- Tiny City uses the normal document layout and must be allowed to scroll at narrow sizes.
- Diner intentionally uses a fixed full-viewport stage.

## Critical CSS Scope

The later section headed `/* Top-down restaurant game stage */` overrides generic classes for the
diner. Any override touching `.appShell`, `.sceneBackdrop`, `.mainSurface`, `.gameGrid`, or
`.resultBanner` must remain scoped under:

```css
.appShell:not(.appShell--city)
```

Without that scope, Tiny City's three-column grid becomes a block, its result banner becomes fixed,
and its content can be clipped by diner overflow rules. Diner-specific classes such as
`.restaurantStage`, `.guestTable`, and `.kitchenStation` do not need the extra qualifier because Tiny
City does not render them.

## Diner Layers

| Layer/class | Position | z-index | Role |
| --- | --- | ---: | --- |
| `.floorTiles` | absolute stage fill | 0 | Floor pattern. |
| stage frame/wall pseudo-elements | absolute | 1–2 | Room boundary and kitchen wall. |
| `.walkTileLayer` | absolute stage fill | 2 | Visible route tiles. |
| `.kitchenStation` | absolute top | 4 | Stove, prep counter, and dish rail. |
| `.restaurantDoor` | tile-positioned | 8 | Guest entry/exit. |
| `.guestTable` | tile-positioned | 11 / 18 selected | Interactive table and order UI. |
| `.customerActor` | tile-positioned | `14 + row` | Moving guest art. |
| `.playerSprite` | tile-positioned | `16 + row` | Moving waiter art. |
| `.gameHud` | fixed | 30 | Portal button and three stats. |
| `.dinerFeedback` / result | fixed | 31 | Visible status or completion controls. |
| `.dragDishPreview` | fixed | 60 | Pointer drag preview. |

The waiter and customer positions update every 100ms through React interpolation. CSS 90ms
transitions smooth those updates.

## Diner Tile System

`restaurantStage` defines `--tile-size`, `--tile-origin-x`, and `--tile-origin-y`. Actor and table
positions use:

```css
calc(var(--tile-origin-x) + var(--column) * var(--tile-size))
calc(var(--tile-origin-y) + var(--row) * var(--tile-size))
```

Below `560px`, tile size/origin, kitchen dimensions, table/sprite size, and speech bubble offsets are
reduced independently. Check all six seats after changing these variables.

## Tiny City Layout

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

- Diner feedback is a visible fixed status toast with `aria-live="polite"` while playing.
- Diner completion replaces the toast with a result banner and `New Shift` action.
- Tiny City feedback stays in the mission column with `role="status"`.
- Both game routes expose a portal-return button.
- Buttons and location/table/dish controls remain native interactive elements.

## Animation Inventory

Active animations include portal backdrop pan, dish card entry/bob, selected guest bob, diner actor
step/shadow motion, Tiny City pickup pulse, delivery pop, and courier bob. Direction classes select
sheet columns for north/south/east/west; west-facing art mirrors the east-facing column. Whole-actor
step motion supplies the walking bounce.

## Visual Rules

- Preserve chunky borders, offset shadows, and the compact arcade palette.
- Keep ordinary panel/button radii at `8px` or less; circular map/courier elements are intentional.
- Keep character actors non-interactive; tables, dishes, and map stops own input.
- Do not let diner full-viewport rules leak into `.appShell--city`.
- Check portal, diner, and city at desktop, `980px`, `560px`, and a short mobile viewport.
- Keep dish buttons stable in size and retain keyboard service.

## Cursor

`--game-cursor: url("./assets/game-cursor.svg") 7 6, auto` is applied globally. Verify the hotspot if
the SVG changes.
