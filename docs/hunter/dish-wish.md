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
  shows the phrase plus `○`/`✓` text progress without a customer label or reference dish images. Selecting another customer
  replaces unfinished speech, while every previously revealed order remains visible and serviceable.
- Correct dishes update the inline served state, animate off the pass, and add patience. Incorrect dishes stay
  available and reduce only that guest's patience; expiration resets the combo.
- Completing all requested food sends the guest out, awards points, and advances order/level progress.
- The target is 24 orders; there is no diner loss state.
- A visible status toast reports feedback, and completion offers `New Shift`.

## Implementation Map

- Food/customer data and balancing constants: top of `src/App.tsx`.
- Difficulty: `difficultyForLevel`.
- Movement model: `SEAT_LAYOUT`, `buildTileRoute`, `getRouteVisual`, and `getGuestVisual` in `src/App.tsx`.
- Rendering: `DishWishStage` snapshot adapter and `DishWishScene` Phaser grid/sprites/input.
- Generation: `makeGuest`, `makeDecoyFood`, `chooseAvailableDishSlot`, and `chooseSpawnLane`.
- Order-taking: `handleGuestSelect` and `revealGuestOrder`.
- Serving/scoring: `handleFoodDrop`.
- Spawning/recycling/expiration: `RestaurantGame` effects.
- Presentation shell: scoped full-viewport/HUD/canvas CSS in `src/styles.css`.

## Risks

- Keep `orderSize <= FOODS.length`.
- Treat `targetGuestId` as lifecycle metadata, not a serve lock.
- Preserve Phaser pointer/touch drag service and the native focus-revealed keyboard controls.
- Keep empty tables and tables with entering guests non-interactive, preserve table occupancy until a
  leaving guest is removed, and reveal orders immediately once customers are seated.
- Keep diner full-viewport generic selectors scoped away from `.appShell--city`.
- Update visible feedback, speech, tones, score, combo, and cleanup together when changing outcomes.

## Verify

Initial guest/second spawn, all four Phaser tables visible before and after occupancy, responsive floor
coverage, collision-free route travel, all dedicated direction rows and approximate `180ms` frame cadence,
immediate order reveal and speech switching, text dish progress without customer labels or order images, persistent
revealed orders, correct-dish patience increases, dish entry/bob/exit, correct/partial/complete
service, decoy match, drop outside, unheard
guest, non-consuming incorrect-dish patience loss, stable dish slots after removal, expiration, recycling, keyboard service, win,
New Shift, portal return, desktop, and mobile.
