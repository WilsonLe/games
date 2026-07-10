---
description: "Player-facing Table Talk Diner gameplay, controls, serving rules, and outcomes."
references: []
---

# Gameplay Guide

[Docs index](./README.md) | [Repo README](../README.md)

This guide describes current player-facing behavior implemented in `src/App.tsx`.

## Objective

Complete `24` guest orders. A wrong table or expired guest resets the happy-guest combo, but the
current diner implementation does not track lives or end the shift from misses.

## Main Screen

| Area | Purpose |
| --- | --- |
| Game HUD | Shows score, completed orders, and level. |
| Restaurant stage | Shows the top-down floor, walk tiles, guest tables, waiter sprite, and kitchen station. |
| Guest tables | Show each guest, speech bubble, requested-food chips, patience bar, and seconds remaining. |
| Kitchen pass | Shows draggable dish buttons in two lane offsets. |
| Drag preview | Follows the pointer while a dish is being dragged. |
| Result banner | Appears after the target order count is reached. |

## Controls

| Control | Current behavior |
| --- | --- |
| Initial route load | `RestaurantGame` calls `resetGame`, creates the first level-1 guest, and starts play. |
| Guest table click/tap | Selects that guest, sends the waiter along a tile route to the table, then marks the order as heard and speaks a greeting plus the order phrase after the waiter arrives. |
| Dish pointer drag | Starts a custom drag preview and asks the player to serve the dish to the correct guest. |
| Native HTML drag/drop | Supports dragging a dish button to a guest table through browser drag events. |
| Dish keyboard `Enter` or `Space` | Attempts to serve the dish to the currently selected guest. |

## Initial Shift

`resetGame` runs on mount and creates the first guest:

| Guest sequence | Spawn timestamp | Source |
| --- | --- | --- |
| `0` | Current start time | First active guest. |
| `1+` | Earliest next spawn is current start time plus `900ms`, then `difficulty.guestIntervalMs` after each later spawn. | `addGuest` through the guest-spawning effect while below `difficulty.maxGuests`. |

The game resets score, completed orders, happy-guest combo, belt foods, scheduled foods, drag state,
guest sequence, food sequence, consumed dish IDs, waiter tile/route state, pending order reveal, and
feedback state. No guest is selected until the player clicks or taps a guest table.

## Guest And Waiter Movement

Guests and the waiter use tile coordinates from `SEAT_LAYOUT`, `DINER_DOOR_TILE`,
`WAITER_HOME_TILE`, and `WALK_TILES`.

| Movement | Current behavior |
| --- | --- |
| Guest entry | `getGuestVisual` follows `buildTileRoute(DINER_DOOR_TILE, seat.customer)` until `getGuestWalkDuration` completes, then the guest phase becomes `seated`. |
| Guest leaving | Completed or expired guests reverse their entry route and are removed after their walk duration plus `LEAVING_GUEST_LINGER_MS`. |
| Waiter route | `handleGuestSelect` snaps the current waiter visual to a tile, builds a route to `seat.waiter`, and stores it in `waiterRoute`. |
| Order reveal | When the waiter route finishes, `pendingOrderGuestId` is set. `revealGuestOrder` runs only after the target guest is not leaving and no longer entering. |

Dropping a dish before a guest has heard the order leaves the dish available and asks the player to
take that guest's order first.

## Serving Rules

Food matching is resolved in `handleFoodDrop`.

| Situation | Outcome |
| --- | --- |
| Game is not `playing` | Feedback state says `The diner is getting ready.` Dish is not served. |
| Dish is dropped outside a guest table | Feedback state asks the player to drag the dish to the guest who ordered it. Dish remains available. |
| Dish is dropped on a guest whose order has not been heard | Feedback/TTS asks the player to take that guest's order first. Dish remains available. |
| Dish is dropped on a guest who still needs that food | Dish is removed and served to that guest. |
| Dish is dropped on a guest who does not need that food | Dish is removed, wrong sound/TTS plays, and the happy-guest combo resets. |

Important: visible decoy dishes can still complete an order if the player drops them on a guest who
needs that food. The `targetGuestId` field is now used for scheduled/recycled dish ownership, not for
cross-guest serve priority.

## Correct Food

On a correct dish drop:

1. The belt item is removed.
2. The matching guest receives that `foodId` in `servedFoods`.
3. Score increases using the base, remaining-time, level, and happy-guest combo bonuses.
4. Feedback state becomes `good`.
5. Speech synthesis announces the served food or completed order.
6. Web Audio plays `correct` or `complete`.

If the guest order is not complete, the guest card remains and its food chip becomes served.

If the order is complete, the guest enters a leaving phase, `served` increments, the happy-guest
combo increments, remaining scheduled and visible foods for that guest are removed, and the game may
schedule a later replacement guest.

## Wrong Table And Expiration

| Problem | Current behavior |
| --- | --- |
| Wrong table | Removes the dish, plays the `wrong` sound, speaks `{guest} did not order ...`, and resets the happy-guest combo. |
| Guest expiration | Marks the guest leaving, removes matching scheduled/belt foods, plays the `wrong` sound, and resets the happy-guest combo. |

The current diner source has no miss counter and no loss transition. `gameStatus` becomes `ended`
only when `served >= TARGET_SERVES`.

## Guest Patience

Each guest receives:

```text
expiresAt = createdAt + profile.timeToLastDishMs + profile.patienceBufferMs
```

`GuestTable` displays:

| UI | Source |
| --- | --- |
| Patience bar width | Remaining time divided by total guest lifetime. |
| Seconds remaining | `formatTime(guest.expiresAt - now)`. |
| Speech bubble | Hidden as `Tap to order` until `guest.heardOrder` or the guest is selected. |

## Kitchen Pass Behavior

| Food type | Source | End-of-belt behavior |
| --- | --- | --- |
| Ordered dish | `ScheduledFood` created by `makeGuest` | Recycles if its target guest still needs it after the dish lifetime ends. |
| Decoy dish | `makeDecoyFood` | Disappears after its dish lifetime ends. |

`KitchenStation` renders visible `BeltFood` rows as draggable dish buttons inside `.dishRail`.
`--dish-life` is derived from `(now - spawnedAt) / travelMs` and drives the small timer bar on each
dish. Lane classes still use `.beltFood--lane0` and `.beltFood--lane1`.

## Completion Conditions

| Condition | Result banner |
| --- | --- |
| `served >= TARGET_SERVES` | `Dinner service complete`; text says all target orders were served. |

The diner route currently has no visible pause/reset/new-shift controls after completion.

## Feedback State

`RestaurantGame` still maintains `Feedback` state and updates it for neutral, good, and bad events,
but the current diner JSX does not render a `.feedbackBar`. Tiny City Delivery still renders a
visible feedback bar with `role="status"`.
