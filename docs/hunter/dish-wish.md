---
description: "Dish Wish gameplay model, state flow, implementation risks, and verification notes."
references: []
---

# Dish Wish

## Gameplay Model

- The game starts automatically with one entering guest, and the opening order is a guided untimed teach-through.
- Four sparse tables are rendered before service and remain after guests leave; incoming guests are
  assigned to an available table.
- Customers take shortest collision-free tile routes around table tiles when entering and leaving,
  then sit at the configured left, right, bottom, or top edge facing the table.
- Selecting a seated customer's table reveals and speaks the order immediately. Level 1 keeps the stable
  `I'd like …, please.` frame, while later levels rotate through broader polite phrasing. The Phaser bubble
  shows the phrase plus `○`/`✓` text progress without a customer label or reference dish images. When
  relevant it also shows `Practice again` for a bounded retry word and `Coming next`/`On the pass`
  supply cues, and a visible helper panel adds highlighted word cards plus replay buttons. Selecting
  another customer replaces unfinished speech, while every previously revealed order remains visible and
  serviceable.
- Correct dishes update the inline served state, animate off the pass, add patience, and briefly echo the served picture/word. Incorrect dishes stay available and reduce only that guest's patience; the untimed first order skips that penalty, and expiration still resets the combo later in the shift while triggering a brief missed-word recap plus bounded later repetition for at least one missed item.
- Completing all requested food sends the guest out, awards points, and advances order/level progress.
- The target is 24 orders; there is no diner loss state.
- Screen-reader status announcements report feedback without a visible narration bubble, the helper panel mirrors key guidance visually, and completion offers `New Shift`.

## Implementation Map

- Food/customer data and balancing constants: top of `src/App.tsx`.
- Difficulty and progression rationale: `DINER_LEVELS` plus `difficultyForLevel`.
- Movement model: `SEAT_LAYOUT`, `buildTileRoute`, `getRouteVisual`, and `getGuestVisual` in `src/App.tsx`.
- Rendering: `DishWishStage` snapshot adapter and `DishWishScene` Phaser grid/sprites/input.
- Generation: `makeGuest`, `makeDecoyFood`, `chooseAvailableDishSlot`, and `chooseSpawnLane`.
- Order-taking: `handleGuestSelect` and `revealGuestOrder`.
- Guided onboarding, visible helper copy, and replay/echo behavior: `RestaurantGame` helper state plus `DishWishScene` guide highlights.
- Serving/scoring: `handleFoodDrop`.
- Spawning/recycling/expiration: `RestaurantGame` effects, especially the ordered-dish retry +
  patience-compensation invariant and the missed-word recap/practice queue.
- Presentation shell: scoped full-viewport/HUD/canvas CSS in `src/styles.css`.

## Risks

- Keep `orderSize <= FOODS.length`.
- Treat `targetGuestId` as lifecycle metadata, not a serve lock.
- Preserve the ordered-dish fairness invariant: if supply is blocked, retry cadence and patience
  compensation must stay matched so a guest cannot expire solely because the kitchen withheld the
  needed item. Expiration checks must account for same-sample pending supply compensation without
  granting that compensation twice.
- Preserve the recap/replacement invariant separately: an eligible expiration or active missed-word
  recap inhibits guest creation. Once the recap clears, spawn at most one overdue replacement and
  derive its seating, patience, and scheduled-food timestamps normally; do not also add recap-time
  patience compensation. Already-active guests keep normal timers while a recap is visible.
- Keep simultaneous expiration policy explicit: queue bounded practice retries for every expired
  guest, but keep the visible recap focused on the first expired guest.
- On final completion, clear pending scheduled food/recap state and settle active guests plus visible
  pass food so no timed lifecycle is frozen behind the win banner.
- Preserve Phaser pointer/touch drag service and the native focus-revealed keyboard controls.
- Keep the first order untimed until the first correct serve; do not let the guided guest expire or lose patience during the teach-through.
- Keep empty tables and tables with entering guests non-interactive, preserve table occupancy until a
  leaving guest is removed, and reveal orders immediately once customers are seated.
- Keep diner full-viewport generic selectors scoped away from `.appShell--city`.
- Update status announcements, speech, tones, score, combo, and cleanup together when changing outcomes.

## Verify

Initial guest/second spawn, guided first-order highlight flow, untimed opener that survives waiting before the first serve, all four Phaser tables visible before and after occupancy, responsive floor coverage, collision-free route travel, all dedicated direction rows and approximate `120ms` frame cadence, immediate order reveal and speech switching, helper phrase/word cards, replay safety when speech is unavailable, served-word echo, persistent revealed orders, `Practice again` and `Coming next`/`On the pass` hints, correct-dish patience increases, dish entry/bob/exit, correct/partial/complete service, decoy match, drop outside, unheard guest, non-consuming incorrect-dish intro guidance, stable dish slots after removal, fair blocked-supply retries, expiration recap with no replacement until it clears, a single normally timed replacement without stale scheduled food or seat duplication, bounded later repetition, recycling, keyboard service, win/recap cleanup, New Shift/timeout cleanup, portal return, desktop, and mobile.
