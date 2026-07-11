---
description: "Player-facing portal, Dish Wish, and Drop Hop controls, rules, scoring, and outcomes."
references: []
---

# Gameplay Guide

[Docs index](./README.md) | [Repo README](../README.md)

## Mini-Game Portal

The root route is a two-card game chooser. Select either card to launch its game. Normal clicks stay
inside the single-page app; modified clicks retain normal link behavior. Both games include a home
button that returns to `/`, and browser back/forward also works.

# Dish Wish

## Objective

Complete 24 guest orders. Incorrect dishes reduce that guest's patience without consuming the dish
or changing the happy-guest combo. Expired guests reset the combo, but the diner has no lives or
loss condition.

## Screen Areas

| Area | Purpose |
| --- | --- |
| HUD | Portal button, score, completed orders, and level. |
| Status announcements | Screen-reader gameplay feedback with `role="status"`; no narration bubble is displayed over the stage. |
| Learning help panel | A visible guide/order helper that introduces the first untimed order, shows active-order replay and word cards, and echoes the latest served word. After onboarding, generic no-order help collapses to a compact `How to play` disclosure. |
| Missed words recap | A brief visible recap card with food pictures/labels after an expiration, including which word will return later when queued; it uses a denser layout on narrow or short screens. |
| Restaurant stage | A Phaser-rendered responsive 10 × 5 tiled floor below the kitchen, four persistent tables, a door, animated customer sprites, and restrained intro highlights on the first table/pass flow. |
| Kitchen pass | Six Phaser-rendered dish slots available for drag service, each with a lifetime indicator. |
| Result banner | Completion message and `New Shift` button after 24 orders. |

## Starting And Taking Orders

`RestaurantGame` starts automatically and creates one entering guest. Four tables are placed before
service starts and remain visible; each new guest walks to an available table without crossing table
tiles, and the same table can be reused after that guest leaves. The four seat anchors are centered on
the left, right, bottom, and top table edges respectively, with each seated guest facing the table.

Level 1 is a deliberate onboarding tier:

- the very first order is untimed from arrival through the first correct serve;
- the first table and matching pass dish receive restrained visual highlights;
- a visible helper panel explains the sequence without blocking the stage or keyboard controls;
- level 1 keeps the same simple polite frame, `I'd like …, please.`;
- later levels keep practical-English sentence variety while expanding food vocabulary.

Tables with an entering guest ignore pointer input. Empty tables are visible but non-interactive.
Once seated:

1. Select anywhere in the customer's table area.
2. The written order and a `○`/`✓` dish-progress line appear immediately, and speech synthesis attempts the order phrase. The bubble shows neither a customer name nor reference dish images, so the player must read the dish name and choose the matching kitchen-pass dish. When relevant, the bubble also shows `Practice again` for a repeated missed word and `Coming next`/`On the pass` for the next needed dish.
3. The helper panel also shows the current phrase with highlighted food words, picture + lowercase word cards, and replay buttons for the full order and target food words. When no heard order needs support after onboarding, it becomes a compact, expandable `How to play` control.
4. Selecting another seated customer immediately cancels unfinished speech, switches the visual
   selection, and speaks that customer's order even when the previous order is incomplete.
5. Previously revealed orders remain visible and serviceable; selection does not lock service to one
   customer.

Before an order is heard, a `?` appears above the customer. Dropping a dish there keeps the dish
available and asks the player to select the customer first.

## Serving Controls

| Control | Behavior |
| --- | --- |
| Pointer/touch drag | Press a Phaser dish, move it over a table, and release. |
| Keyboard | Tab into the native companion controls, select/hear a guest, then activate a dish with `Enter` or `Space`; it is served to that guest. |
| Drop outside a table | The dish remains available and the screen-reader status announcement explains where to drag it. |

## Serving Outcomes

| Situation | Outcome |
| --- | --- |
| Guest still needs the dish | Dish leaves the pass, its bubble marker changes from `○` to `✓`, patience rises slightly, score increases, correct feedback plays, and the helper briefly echoes the served picture/word with a replay button. |
| Dish completes the order | Guest leaves, completed orders and combo increase, owned leftovers animate off, and completion feedback plays. |
| Guest does not need the dish | Dish remains available, wrong feedback plays, and that guest loses 2.5–5 seconds of patience based on level; score and combo do not change. The untimed first order still gives corrective guidance without a patience penalty. |
| Guest has not given the order | Dish remains, and the game asks the player to select the customer and hear the order. |
| Guest expires | Guest leaves, owned scheduled food is removed, visible dishes animate off, combo resets, and a brief missed-word recap appears; at least one missed food is queued to return in a later order when the retry cap allows it. |

A decoy can satisfy an order when its food matches. `targetGuestId` governs dish lifecycle, not which
table may receive it.

## Diner Timing And Progress

- Patience and ordered-dish timing start after the guest reaches the table, so longer walking routes do
  not reduce the service window or age the guest's food early.
- The very first order stays untimed until it is served correctly; later guests use the normal patience clock.
- Revealing or replaying an order does not change patience; each correct dish adds 2 seconds.
- An incorrect dish removes 2.5 seconds of patience at level 1, increasing by 0.5 seconds per level
  through a 5-second penalty at level 6. The attempted dish stays on the pass.
- The table renders an accessible progress bar, not a numeric seconds label.
- The kitchen pass holds up to six dishes in stable visible slots. Removing a dish leaves that exact slot blank; later dishes fill available blanks without shifting the other cards.
- Ordered dishes animate onto the pass over the guest's last-dish timing window.
- Every requested dish has a deterministic ready time. If a due requested dish is blocked by pass
  congestion or lane gating, the game retries every `650ms`, shows `Coming next`, and grants matching
  patience compensation so waiting for withheld supply cannot silently cause an unfair expiration.
- Missed ordered dishes animate off and recycle while the owning guest still needs them.
- Decoys animate off when their pass lifetime ends.
- Each of the six levels now lasts 4 completed orders, preserving the 24-order shift while spacing
  new challenge more deliberately. On each transition, a brief dismissible status message announces
  the new level and explains the next changed challenge from the current level profiles; it dismisses
  automatically and does not pause or change gameplay.
- Level 1 serves one guest at a time with one-item orders, keeps the stable `I'd like …, please.` frame,
  and opens with one untimed guided order. Level 2 stays at one guest with one-item orders while broader
  phrase variety returns and decoys start gently. Level 3 introduces two-item memory without concurrency.
  Levels 4 and 5 use two guests with two-item orders, first steady and then faster. Level 6 finishes
  with three-item orders, three guests, and the fastest pressure.
- When a guest expires, the 5.5-second recap names and shows the missed food word(s). On narrow or short
  screens its spacing, type, and food chips compact without changing retry behavior. One missed item is
  queued for later deliberate repetition, bounded to avoid infinite retries or overly repetitive shifts.
  If several guests expire in the same clock sample, all eligible missed words can enter the bounded
  practice queue, while the visible recap stays focused on the first expired guest.
- A replacement guest does not begin entering while that missed-word recap is visible. After the
  recap clears, at most one overdue replacement enters and receives the normal full service window
  and ordered-dish schedule from seating; recap time is not charged to the new order. Guests who were
  already active before the recap keep their normal timers rather than receiving recap compensation.

## Diner Score And Completion

Each correct dish awards 35 base points, remaining whole seconds, and `level * 5`. Completing a
consecutive happy guest can also add `(combo - 1) * 15`.

At 24 completed orders, timers stop, `Dinner service complete` appears, pending recap/scheduled food
are cleared, visible pass food and active guests settle into their leaving cleanup, and `New Shift`
resets all diner state. The portal button remains available throughout. There is no mid-shift
pause/reset.

# Drop Hop

## Objective

Complete 10 delivery tickets before making 5 invalid-road or required-stop mistakes.

## Starting And Controls

Drop Hop opens in `ready` state. Use `Start Route` to begin. The controls are:

| Control | Behavior |
| --- | --- |
| Map location | Move there only when a road directly connects it to the current stop. |
| Current pickup stop | Pick up cargo when it is not already in the basket. |
| Speaker button | Repeat the current delivery instruction through speech synthesis. |
| Pause/Resume | Block or restore map movement; no countdown needs timestamp adjustment. |
| Reset | Start again from mission 1 with zero score, deliveries, streak, and mistakes. |
| Home | Return to the two-game portal. |

## Reading A Delivery Ticket

Each ticket provides:

- a spoken/written phrase;
- cargo and quantity;
- pickup and target locations;
- a spatial relation label;
- focus-word chips;
- an optional required stop such as the bridge.

Cargo whose pickup is the depot begins in the basket. Other cargo is picked up automatically when
the courier reaches the pickup, or by clicking the current pickup location.

## City Movement Outcomes

| Situation | Outcome |
| --- | --- |
| Click adjacent stop | Courier moves, the stop is appended to the path, and that exact road is highlighted. |
| Click non-adjacent stop | One mistake, streak reset, wrong tone/speech, no movement. |
| Visit another valid stop before pickup | Allowed; feedback points back to the pickup. |
| Visit another valid stop with cargo | Allowed; feedback repeats the spatial clue. |
| Reach dropoff without cargo | No delivery; feedback points to the pickup. |
| Reach dropoff without required stop | One mistake and guidance to visit that stop first. |
| Reach valid dropoff | Delivery, score, and streak increase; the next ticket loads. |

The game does not treat every detour or non-target stop as a mistake. Only invalid road choices and a
missing required stop at delivery call `addCityMistake`.

## City Score And Completion

Each delivery awards its mission reward plus:

- `max(0, 8 - roads used) * 4` clean-route points;
- `max(0, next streak - 1) * 12` streak points.

The displayed level increases every 2 deliveries and is capped at 5. `Lives` shows
`5 - mistakes`.

After 10 deliveries, the route ends in a win. At 5 mistakes, it ends with `Route closed`. In either
case, the main button becomes `New Route`, and the reset button also starts over.

## Audio Availability

The games remain visually playable when browser speech or Web Audio is unavailable. The explicit
listen controls report speech unavailability; some automatic sound attempts fail silently because
browser APIs and autoplay policies vary.
