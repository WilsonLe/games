---
description: "Player-facing portal, Table Talk Diner, and Tiny City Delivery controls, rules, scoring, and outcomes."
references: []
---

# Gameplay Guide

[Docs index](./README.md) | [Repo README](../README.md)

## Mini-Game Portal

The root route is a two-card game chooser. Select either card to launch its game. Normal clicks stay
inside the single-page app; modified clicks retain normal link behavior. Both games include a home
button that returns to `/`, and browser back/forward also works.

# Table Talk Diner

## Objective

Complete 24 guest orders. Wrong tables and expired guests reset the happy-guest combo, but the diner
has no lives or loss condition.

## Screen Areas

| Area | Purpose |
| --- | --- |
| HUD | Portal button, score, completed orders, and level. |
| Status toast | Visible neutral/good/bad gameplay feedback with `role="status"`. |
| Restaurant stage | A 10 × 5 tiled floor, door, guest tables, and shared tile-based character actors. |
| Kitchen station | Stove/counter art, dishes available for service, and a visual pass-lifetime indicator. |
| Result banner | Completion message and `New Shift` button after 24 orders. |

## Starting And Taking Orders

`RestaurantGame` starts automatically and creates one entering guest. A second guest may spawn from
about 900ms after reset while the level-1 two-guest limit has room.

Entering tables ignore pointer input. Once seated:

1. Select a guest table.
2. The waiter steps through whole floor tiles to that table, using the same sprite actor model as guests.
3. After the waiter arrives, the guest's written order and food chips appear.
4. Speech synthesis attempts a greeting followed by the order phrase, and the greeting adds a small
   amount of patience.
5. Selecting the table again repeats the waiter/order flow and greeting interaction.

Before an order is heard, its bubble shows `...`. Dropping a dish there keeps the dish available and
asks the player to take the order first.

## Serving Controls

| Control | Behavior |
| --- | --- |
| Pointer drag | Press a dish, move the custom preview over a table, and release. |
| Native drag/drop | Browser drag events also carry a dish ID to a table. |
| Keyboard | Focus a dish and press `Enter` or `Space`; it is served to the selected guest. |
| Drop outside a table | The dish remains available and the status toast explains where to drag it. |

## Serving Outcomes

| Situation | Outcome |
| --- | --- |
| Guest still needs the dish | Dish animates off the pass, checklist updates, patience rises slightly, score increases, and correct feedback plays. |
| Dish completes the order | Guest leaves, completed orders and combo increase, owned leftovers animate off, and completion feedback plays. |
| Guest does not need the dish | Dish animates off, wrong feedback plays, and combo resets. |
| Guest has not given the order | Dish remains, and the game asks the player to take the order. |
| Guest expires | Guest leaves, owned scheduled food is removed, visible dishes animate off, and combo resets. |

A decoy can satisfy an order when its food matches. `targetGuestId` governs dish lifecycle, not which
table may receive it.

## Diner Timing And Progress

- Patience starts at guest creation, including entry time.
- Greeting/order reveal adds 1.5 seconds; each correct dish adds 2 seconds.
- The table renders an accessible progress bar, not a numeric seconds label.
- Ordered dishes animate onto the pass over the guest's last-dish timing window.
- Missed ordered dishes animate off and recycle while the owning guest still needs them.
- Decoys animate off when their pass lifetime ends.
- Every 4 completed orders advances a level, up to level 6.
- Higher levels allow more guests, eventually increase order size from 2 to 3, and adjust pacing.

## Diner Score And Completion

Each correct dish awards 35 base points, remaining whole seconds, and `level * 5`. Completing a
consecutive happy guest can also add `(combo - 1) * 15`.

At 24 completed orders, timers stop, `Dinner service complete` appears, and `New Shift` resets all
diner state. The portal button remains available throughout. There is no mid-shift pause/reset.

# Tiny City Delivery

## Objective

Complete 10 delivery tickets before making 5 invalid-road or required-stop mistakes.

## Starting And Controls

Tiny City opens in `ready` state. Use `Start Route` to begin. The controls are:

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
