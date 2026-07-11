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
| Restaurant stage | A Phaser-rendered responsive 10 × 5 tiled floor below the kitchen, four persistent tables, a door, and animated customer sprites. |
| Kitchen pass | Six Phaser-rendered dish slots available for drag service, each with a lifetime indicator. |
| Result banner | Completion message and `New Shift` button after 24 orders. |

## Starting And Taking Orders

`RestaurantGame` starts automatically and creates one entering guest. Four tables are placed before
service starts and remain visible; each new guest walks to an available table without crossing table
tiles, and the same table can be reused after that guest leaves. The four seat anchors are centered on
the left, right, bottom, and top table edges respectively, with each seated guest facing the table.
Level 1 allows one active customer; later levels gradually add concurrent customers as timing and
capacity allow.

Tables with an entering guest ignore pointer input. Empty tables are visible but non-interactive.
Once seated:

1. Select anywhere in the customer's table area.
2. The written order and a `○`/`✓` dish-progress line appear immediately, and speech synthesis attempts the order phrase. The bubble shows neither a customer name nor reference dish images, so the player must read the dish name and choose the matching kitchen-pass dish.
3. Selecting another seated customer immediately cancels unfinished speech, switches the visual
   selection, and speaks that customer's order even when the previous order is incomplete.
4. Previously revealed orders remain visible and serviceable; selection does not lock service to one
   customer.

Before an order is heard, its bubble says `Tap to hear order`. Dropping a dish there keeps the dish
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
| Guest still needs the dish | Dish leaves the pass, its bubble marker changes from `○` to `✓`, patience rises slightly, score increases, and correct feedback plays. |
| Dish completes the order | Guest leaves, completed orders and combo increase, owned leftovers animate off, and completion feedback plays. |
| Guest does not need the dish | Dish remains available, wrong feedback plays, and that guest loses 2.5–5 seconds of patience based on level; score and combo do not change. |
| Guest has not given the order | Dish remains, and the game asks the player to select the customer and hear the order. |
| Guest expires | Guest leaves, owned scheduled food is removed, visible dishes animate off, and combo resets. |

A decoy can satisfy an order when its food matches. `targetGuestId` governs dish lifecycle, not which
table may receive it.

## Diner Timing And Progress

- Patience and ordered-dish timing start after the guest reaches the table, so longer walking routes do
  not reduce the service window or age the guest's food early.
- Revealing or replaying an order does not change patience; each correct dish adds 2 seconds.
- An incorrect dish removes 2.5 seconds of patience at level 1, increasing by 0.5 seconds per level
  through a 5-second penalty at level 6. The attempted dish stays on the pass.
- The table renders an accessible progress bar, not a numeric seconds label.
- The kitchen pass holds up to six dishes in stable visible slots. Removing a dish leaves that exact slot blank; later dishes fill available blanks without shifting the other cards.
- Ordered dishes animate onto the pass over the guest's last-dish timing window.
- Missed ordered dishes animate off and recycle while the owning guest still needs them.
- Decoys animate off when their pass lifetime ends.
- Level 1 is a two-order introduction. Later levels require 3, 4, 4, 5, and 6 completed orders,
  preserving the six-level, 24-order shift.
- Level 1 serves one guest at a time with one-item orders. Higher levels gradually allow up to four
  concurrent guests, increase orders to two and then three items, speed up the pass and arrivals,
  add decoys more often, and reduce the extra patience buffer.

## Diner Score And Completion

Each correct dish awards 35 base points, remaining whole seconds, and `level * 5`. Completing a
consecutive happy guest can also add `(combo - 1) * 15`.

At 24 completed orders, timers stop, `Dinner service complete` appears, and `New Shift` resets all
diner state. The portal button remains available throughout. There is no mid-shift pause/reset.

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
