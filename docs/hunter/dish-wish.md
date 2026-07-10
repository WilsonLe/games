---
description: "Dish Wish gameplay model, state flow, implementation risks, and verification notes."
references: []
---

# Dish Wish

## Gameplay Model

- The game starts automatically with one entering guest.
- Four sparse tables are rendered before service and remain after guests leave; incoming guests are
  assigned to an available table.
- Customers travel smoothly along their tile routes when entering and leaving.
- Selecting a seated customer's table reveals and speaks the order immediately. Requested dish names
  are underlined inline; the bubble does not show reference dish images. Selecting another customer
  replaces unfinished speech, while every previously revealed order remains visible and serviceable.
- Correct dishes update the inline served state, animate off the pass, and add patience. Incorrect dishes stay
  available and reduce only that guest's patience; expiration resets the combo.
- Completing all requested food sends the guest out, awards points, and advances order/level progress.
- The target is 24 orders; there is no diner loss state.
- A visible status toast reports feedback, and completion offers `New Shift`.

## Implementation Map

- Food/customer data and balancing constants: top of `src/App.tsx`.
- Difficulty: `difficultyForLevel`.
- Movement: `SEAT_LAYOUT`, `DINER_FLOOR_TILES`, `buildTileRoute`, `getRouteVisual`, `CharacterActor`.
- Generation: `makeGuest`, `makeDecoyFood`, `chooseSpawnLane`.
- Order-taking: `handleGuestSelect` and `revealGuestOrder`.
- Serving/scoring: `handleFoodDrop`.
- Spawning/recycling/expiration: `RestaurantGame` effects.
- Presentation: `RestaurantStage` and the scoped top-down CSS section.

## Risks

- Keep `orderSize <= FOODS.length`.
- Treat `targetGuestId` as lifecycle metadata, not a serve lock.
- Preserve both custom pointer and keyboard service.
- Keep empty tables and tables with entering guests non-interactive, preserve table occupancy until a
  leaving guest is removed, and reveal orders immediately once customers are seated.
- Keep diner full-viewport generic selectors scoped away from `.appShell--city`.
- Update visible feedback, speech, tones, score, combo, and cleanup together when changing outcomes.

## Verify

Initial guest/second spawn, all four tables visible before and after occupancy, responsive floor
coverage, linear guest route travel, all direction frames/mirroring and `180ms` frame cadence,
immediate order reveal and speech switching, underlined dish names without order images, persistent
revealed orders, correct-dish patience increases, dish entry/bob/exit, correct/partial/complete
service, decoy match, drop outside, unheard
guest, non-consuming incorrect-dish patience loss, expiration, recycling, keyboard service, win,
New Shift, portal return, desktop, and mobile.
