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
| Starting/resetting a shift | First guest phrase. |
| New guest spawn | Guest phrase. |
| Guest speaker button | That guest phrase. |
| Correct dish | `Served {foodName}.` |
| Completed order | Thank-you/completion message. |
| Wrong dish | `No one ordered {foodName}.` |
| Shift complete | `Shift complete. All orders served.` |

Only `listenToGuest` shows explicit bad feedback when speech is unavailable. Other callers ignore the boolean return.

## Sound Effects

`playSound` supports `AudioContext` and `webkitAudioContext`.

| `SoundKind` | Trigger | Tone pattern |
| --- | --- | --- |
| `correct` | Correct dish, order still incomplete | Triangle tones at `660Hz` and `880Hz`. |
| `complete` | Guest order completed | Triangle tones at `523.25Hz`, `659.25Hz`, `783.99Hz`, and `1046.5Hz`. |
| `wrong` | No guest needs clicked food | Sawtooth tones at `180Hz` and `130Hz`. |

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
| `.mainSurface` | relative centered content | `2` | Main game UI. |
| `.portalRail` | relative top rail | `3` | Portal brand/game nav. |
| `.playerSprite` | fixed lower-left | `4` | Chef sprite in front of the scene. |
| Panels/cards | normal flow | auto | Guest cards, conveyor, engine panel, feedback. |

`.appShell` uses `isolation: isolate`, so the negative backdrop layer remains scoped behind the app content.

## Animation Inventory

| Animation | Applied to | Purpose |
| --- | --- | --- |
| `kitchenScenePan` | `.sceneBackdrop__image` | Slow background drift. |
| `playerIdleBob` | `.playerSprite` | Chef idle bob; speeds up while playing. |
| `beltRoll` | conveyor pseudo-elements | Moving belt texture. |
| `foodEnter` | `.beltFood` | Food entrance scale/fade. |
| `trayWobble` | `.beltFood` | Subtle food motion on trays. |
| `guestArrive` | `.guestCard` | New guest card arrival. |
| `customerBob` | `.customerSprite--active` | Selected customer motion. |

## Responsive Layout

| Breakpoint | Behavior |
| --- | --- |
| Default | Three-column game grid: guests, belt, engine. Score strip uses five columns. |
| `max-width: 1360px` | Game grid becomes two columns; engine panel spans full width. |
| `max-width: 980px` | Game grid and score strip become one column; top bar stacks; action buttons widen; chef shrinks. |
| `max-width: 560px` | Background is reframed, surface widths tighten, conveyor height and belt food sizes shrink. |

## Styling Organization

`src/styles.css` is organized in this practical order:

1. Global variables, font rendering, body, cursor.
2. Full-screen shell, background, and player sprite.
3. Portal rail and navigation.
4. Main surface, top bar, buttons.
5. Score strip and result banner.
6. Game grid, guest cards, conveyor, feedback, engine panel.
7. Customer and food art wrappers.
8. Keyframes.
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
| `--steel` | `#5c7182` | Conveyor-adjacent accent. |

## Visual Rules To Preserve

| Rule | Why |
| --- | --- |
| Keep cards and buttons at `8px` radius or less | Matches the arcade panel style already in CSS. |
| Preserve chunky borders and offset shadows | They create the game-like physical UI. |
| Keep the chef fixed and non-interactive | It is scenic feedback, not a control. |
| Avoid adding text-heavy instruction panels inside the game scene | The current UI teaches through labels, cards, and controls. |
| Keep food buttons fixed-size on the belt | Variable sizes could make movement and click targets unstable. |
| Check mobile after changing dimensions | The belt and background have separate mobile framing rules. |

## Custom Cursor

The cursor is declared once:

```css
--game-cursor: url("./assets/game-cursor.svg") 7 6, auto;
```

It is applied globally through `*`, and repeated on `button` and `[role="button"]`. If the cursor asset changes, verify the hotspot coordinates still line up with the visible pointer.
