---
description: "Dish Wish gameplay model, state flow, implementation risks, and verification notes."
references: []
---

# Dish Wish

## Gameplay Model

- The game starts automatically with one entering guest.
- A seated table selection sends the waiter there in discrete tile steps; the order is revealed and
  spoken after arrival, and the greeting adds a small patience reward.
- Correct dishes advance the checklist, animate off the pass, and add patience; wrong-table drops and
  expiration reset the combo.
- Completing all requested food sends the guest out, awards points, and advances order/level progress.
- The target is 24 orders; there is no diner loss state.
- A visible status toast reports feedback, and completion offers `New Shift`.

## Implementation Map

- Food/customer data and balancing constants: top of `src/App.tsx`.
- Difficulty: `difficultyForLevel`.
- Movement: `SEAT_LAYOUT`, `DINER_FLOOR_TILES`, `buildTileRoute`, `getRouteVisual`, `CharacterActor`.
- Generation: `makeGuest`, `makeDecoyFood`, `chooseSpawnLane`.
- Order-taking: `handleGuestSelect`, waiter effects, `revealGuestOrder`.
- Serving/scoring: `handleFoodDrop`.
- Spawning/recycling/expiration: `RestaurantGame` effects.
- Presentation: `RestaurantStage` and the scoped top-down CSS section.

## Risks

- Keep `orderSize <= FOODS.length`.
- Treat `targetGuestId` as lifecycle metadata, not a serve lock.
- Preserve both custom pointer and keyboard service.
- Keep entering tables non-interactive and deferred reveal aligned with waiter/guest movement.
- Keep diner full-viewport generic selectors scoped away from `.appShell--city`.
- Update visible feedback, speech, tones, score, combo, and cleanup together when changing outcomes.

## Verify

Initial guest/second spawn, integer-only guest/waiter tile steps, all direction frames/mirroring,
greeting and correct-dish patience increases, dish entry/bob/exit, correct/partial/complete service,
decoy match, drop outside, unheard guest, wrong table, expiration, recycling, keyboard service, win,
New Shift, portal return, desktop, and mobile.
