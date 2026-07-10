---
description: "Speech, Web Audio, UI layers, animation, responsive layout, and styling rules."
references: []
---

# Audio, UI, And Styling

[Docs index](./README.md) | [Repo README](../README.md)

## Audio Overview

Audio is implemented directly in `src/App.tsx`.

| Helper | Purpose |
| --- | --- |
| `speak(text, rate = 0.9)` | Uses `window.speechSynthesis` to speak English order and feedback text. |
| `scheduleTone(...)` | Creates one oscillator and gain envelope in an `AudioContext`. |
| `playSound(kind)` | Lazily creates/resumes an audio context and schedules tone patterns. |

There are no audio files in the repo.

## Speech Synthesis

`speak` behavior:

1. Returns `false` when `speechSynthesis` is not available.
2. Calls `window.speechSynthesis.cancel()` before each new utterance.
3. Creates a `SpeechSynthesisUtterance`.
4. Sets `lang = "en-US"`, `rate`, `pitch = 1`, and `volume = 0.95`.
5. Calls `window.speechSynthesis.speak(utterance)` and returns `true`.

| Trigger | Text source |
| --- | --- |
| Tiny City start/reset or new mission | Mission phrase. |
| Diner guest table click/tap, after waiter arrival | Greeting plus that guest phrase. |
| Dish dropped before hearing order | `Ask {guestName} for an order first.` |
| Correct dish | `Served {foodName}.` |
| Completed order | Thank-you/completion message. |
| Wrong table | `{guestName} did not order {foodName}.` |
| Dinner service complete | `Dinner service complete. All guests are happy.` |

Only `revealGuestOrder` and Tiny City's `listenToMission` show explicit bad feedback when speech is
unavailable. Other callers ignore the boolean return.

## Sound Effects

`playSound` supports `AudioContext` and `webkitAudioContext`.

| `SoundKind` | Trigger | Tone pattern |
| --- | --- | --- |
| `correct` | Correct dish, order still incomplete | Triangle tones at `660Hz` and `880Hz`. |
| `complete` | Guest order completed | Triangle tones at `523.25Hz`, `659.25Hz`, `783.99Hz`, and `1046.5Hz`. |
| `wrong` | Wrong table or expired guest | Sawtooth tones at `180Hz` and `130Hz`. |

If no audio context constructor exists, `playSound` returns `false`. The UI does not currently surface that fallback.

## Browser Constraints

Speech synthesis and Web Audio behavior can vary by browser:

| Constraint | Current handling |
| --- | --- |
| Audio APIs absent | `speak`/`playSound` return `false`. |
| Web Audio suspended until user gesture | `playSound` calls `audioContext.resume()` when suspended. |
| Speech queue overlap | `speak` cancels current speech before starting the next utterance. |
| Voice availability | The app requests `en-US` but does not choose a specific installed voice. |

Starting the game is a user gesture, which helps unlock audio in common browsers. Later timed guest spawns can still depend on browser policy.

## Scene Layers

Layering is controlled by `src/styles.css`.

| Layer/class | Positioning | z-index | Purpose |
| --- | --- | ---: | --- |
| `.sceneBackdrop` | fixed full-screen | `-2` | Background container. |
| `.sceneBackdrop__image` | absolute oversized inset | inherited | Kitchen image with slow pan. |
| `.mainSurface` | full viewport | auto | Main game UI surface. |
| `.gameHud` | fixed top overlay | `30` | Diner score, order count, and level. |
| `.restaurantStage` | relative full viewport | isolated | Diner floor and all tile-positioned actors. |
| `.floorTiles` | absolute stage fill | `0` | Tile-pattern floor. |
| `.walkTileLayer` | absolute stage fill | `2` | Visible walk markers from `WALK_TILES`. |
| `.kitchenStation` | absolute top pass | `4` | Stove, prep counter, and draggable dish rail. |
| `.restaurantDoor` | tile-positioned | `8` | Guest entry/exit door. |
| `.guestTable` | tile-positioned button | `11` or `18` when selected | Table, chairs, speech bubble, and timer. |
| `.customerActor` | tile-positioned actor | `14 + row` | Guest sprite independent from the table button. |
| `.playerSprite` | tile-positioned actor | `16 + row` | Waiter sprite. |
| `.dragDishPreview` | fixed pointer overlay | `60` | Custom pointer-drag dish preview. |

`.appShell` uses `isolation: isolate`, so the negative backdrop layer remains scoped behind the app content.
The diner route hides `.sceneBackdrop`; the portal and legacy styles still define backdrop behavior.

## Animation Inventory

| Animation | Applied to | Purpose |
| --- | --- | --- |
| `kitchenScenePan` | `.sceneBackdrop__image` | Slow background drift. |
| `dishCardEnter` | `.dishRail .beltFood` | Dish card entrance scale/fade on the kitchen pass. |
| `dishCardBob` | `.dishRail .beltFood` | Subtle dish card motion. |
| `customerSpriteSideWalk` | east/west walking customer sheet | Side-facing customer frame stepping. |
| `customerSpriteNorthWalk` | north walking customer sheet | North-facing customer frame stepping. |
| `customerSpriteSouthWalk` | south walking customer sheet | South-facing customer frame stepping. |
| `playerSpriteSideWalk` | east/west walking waiter sheet | Side-facing waiter frame stepping. |
| `playerSpriteNorthWalk` | north walking waiter sheet | North-facing waiter frame stepping. |
| `playerSpriteSouthWalk` | south walking waiter sheet | South-facing waiter frame stepping. |
| `guestCustomerBob` | `.customerSprite--active` | Selected customer bob. |

Guest and waiter travel between tables is primarily React-driven tile interpolation through
`getRouteVisual`; CSS transitions smooth the `top` and `left` updates over the tile grid.

## Diner Tile Grid

The diner stage defines tile placement variables on `.restaurantStage`:

| Variable | Default | Mobile override under `560px` |
| --- | --- | --- |
| `--tile-origin-x` | `8%` | `14%` |
| `--tile-origin-y` | `34%` | `30%` |
| `--tile-step-x` | `7.5%` | `7%` |
| `--tile-step-y` | `7.4%` | `7%` |

`GuestTable`, `CustomerActor`, `PlayerSprite`, `walkTile`, and `restaurantDoor` all derive their
positions from these variables. Any change to tile sizing should be checked against desktop and
mobile actor overlap.

## Responsive Layout

| Breakpoint | Behavior |
| --- | --- |
| Default | The diner route uses a full restaurant stage with an overlaid three-stat HUD. Tiny City uses its own map/sidebar grid. |
| `max-width: 1360px` | Wide surfaces tighten and multi-column layouts begin collapsing where needed. |
| `max-width: 980px` | Game grid and score strip become one column; top bar stacks where present; action buttons widen; sprites shrink. |
| `max-width: 560px` | Diner tile origin/step values shift, kitchen pass and dish sizes shrink, guest/table/sprite sizes shrink. |

## Styling Organization

`src/styles.css` is organized in this practical order:

1. Global variables, font rendering, body, cursor.
2. Full-screen shell, background, and player sprite.
3. Portal rail and navigation.
4. Main surface, top bar, buttons.
5. Score strip and result banner.
6. Game grid, restaurant stage, walk tiles, guest tables, actors, kitchen pass, feedback, and side panels.
7. Customer and food art wrappers.
8. Directional sprite frame rules and keyframes.
9. Responsive media queries.

## Palette

Main custom properties:

| Variable | Value | Use |
| --- | --- | --- |
| `--ink` | `#172f2b` | Primary text/dark borders. |
| `--muted` | `#65736f` | Secondary text. |
| `--panel` | `#fffdf8` | Warm panel background. |
| `--line` | `#dbe4df` | Light borders. |
| `--green` | `#167451` | Good/accent green. |
| `--green-dark` | `#103c34` | Dark green surfaces. |
| `--blue` | `#2d6fa8` | Blue accents. |
| `--yellow` | `#f1b83f` | Buttons, borders, timers. |
| `--red` | `#ce5143` | Bad feedback accents. |
| `--coral` | `#f07d5f` | Food/CSS art accent. |
| `--steel` | `#5c7182` | Kitchen-pass and city-map adjacent accent. |

## Visual Rules To Preserve

| Rule | Why |
| --- | --- |
| Keep cards and buttons at `8px` radius or less | Matches the arcade panel style already in CSS. |
| Preserve chunky borders and offset shadows | They create the game-like physical UI. |
| Keep waiter and customer actors non-interactive | Guest tables and dish buttons are the controls; actors are visual feedback. |
| Avoid adding text-heavy instruction panels inside the game scene | The current UI teaches through labels, cards, and controls. |
| Keep dish buttons fixed-size on the kitchen pass | Variable sizes could make drag targets unstable. |
| Check mobile after changing dimensions | The kitchen pass, tile grid, actors, tables, and speech bubbles have separate mobile sizing rules. |

## Custom Cursor

The cursor is declared once:

```css
--game-cursor: url("./assets/game-cursor.svg") 7 6, auto;
```

It is applied globally through `*`, and repeated on `button` and `[role="button"]`. If the cursor asset changes, verify the hotspot coordinates still line up with the visible pointer.
