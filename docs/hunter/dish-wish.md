---
description: "Dish Wish gameplay model, state flow, implementation risks, and verification notes."
references: []
---

# Dish Wish

## Gameplay Model

- The game starts automatically with one entering guest.
- Four sparse tables are rendered before service and remain after guests leave; incoming guests are
  assigned to an available table.
- Customers take shortest collision-free tile routes around table tiles when entering and leaving,
  then sit at the configured left, right, bottom, or top edge facing the table.
- Selecting a seated customer's table reveals and speaks the order immediately. The Phaser bubble
  shows the phrase plus `○`/`✓` text progress without a customer label or reference dish images. When
  relevant it also shows `Practice again` for a bounded retry word and `Coming next`/`On the pass`
  supply cues. Selecting another customer replaces unfinished speech, while every previously revealed
  order remains visible and serviceable.
- Correct dishes update the inline served state, animate off the pass, and add patience. Incorrect dishes stay
  available and reduce only that guest's patience; expiration resets the combo and now triggers a brief
  missed-word recap plus bounded later repetition for at least one missed item.
- Completing all requested food sends the guest out, awards points, and advances order/level progress.
- The target is 24 orders; there is no diner loss state.
- Screen-reader status announcements report feedback without a visible narration bubble, and completion offers `New Shift`.

## Implementation Map

- Food/customer data and balancing constants: top of `src/App.tsx`.
- Difficulty and progression rationale: `DINER_LEVELS` plus `difficultyForLevel`.
- Movement model: `SEAT_LAYOUT`, `buildTileRoute`, `getRouteVisual`, and `getGuestVisual` in `src/App.tsx`.
- Rendering: `DishWishStage` snapshot adapter and `DishWishScene` Phaser grid/sprites/input.
- Generation: `makeGuest`, `makeDecoyFood`, `chooseAvailableDishSlot`, and `chooseSpawnLane`.
- Order-taking: `handleGuestSelect` and `revealGuestOrder`.
- Serving/scoring: `handleFoodDrop`.
- Spawning/recycling/expiration: `RestaurantGame` effects, especially the ordered-dish retry +
  patience-compensation invariant and the missed-word recap/practice queue.
- Presentation shell: scoped full-viewport/HUD/canvas CSS in `src/styles.css`.

## Risks

- Keep `orderSize <= FOODS.length`.
- Treat `targetGuestId` as lifecycle metadata, not a serve lock.
- Preserve the ordered-dish fairness invariant: if supply is blocked, retry cadence and patience
  compensation must stay matched so a guest cannot expire solely because the kitchen withheld the
  needed item.
- Preserve Phaser pointer/touch drag service and the native focus-revealed keyboard controls.
- Keep empty tables and tables with entering guests non-interactive, preserve table occupancy until a
  leaving guest is removed, and reveal orders immediately once customers are seated.
- Keep diner full-viewport generic selectors scoped away from `.appShell--city`.
- Update status announcements, speech, tones, score, combo, and cleanup together when changing outcomes.

## Verify

Initial guest/second spawn, all four Phaser tables visible before and after occupancy, responsive floor
coverage, collision-free route travel, all dedicated direction rows and approximate `120ms` frame cadence,
immediate order reveal and speech switching, text dish progress without customer labels or order images, persistent
revealed orders, `Practice again` and `Coming next`/`On the pass` hints, correct-dish patience increases,
dish entry/bob/exit, correct/partial/complete service, decoy match, drop outside, unheard guest,
non-consuming incorrect-dish patience loss, stable dish slots after removal, fair blocked-supply retries,
expiration recap, bounded later repetition, recycling, keyboard service, win, New Shift, portal return,
desktop, and mobile.
