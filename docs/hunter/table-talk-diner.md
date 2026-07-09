---
description: "Table Talk Diner gameplay model, state flow, and implementation notes."
references: []
---

# Table Talk Diner

## Gameplay Model

- Players serve food to active dining-room guests.
- Guests request practical English orders, spoken through browser speech synthesis.
- Matching a requested food advances that guest's checklist; wrong food or expired patience counts as
  a miss.
- Serving all requested food completes the guest, awards points, and contributes to level progress.

## Implementation Map

- Food and customer types are defined near the top of `src/App.tsx`.
- `difficultyForLevel` controls guest pressure, order size, food timing, decoys, and patience.
- `makeGuest` creates a guest plus scheduled target foods.
- `makeDecoyFood` adds non-target food items.
- `handleFoodClick` is the key serve/miss decision path.
- `RestaurantStage` handles the current table-oriented presentation.
- The main game loop is implemented with React effects that spawn guests, spawn food, expire guests,
  and end the game.

## Editing Guidance

- Keep timing constants readable and named; avoid burying gameplay tuning in JSX.
- Update score, streak, level, miss, and feedback behavior together when changing serve outcomes.
- Preserve keyboard and pointer ergonomics: food and guest controls should remain buttons or clear
  clickable controls.
- If adding foods or customers, update the type unions, source arrays, image maps, and display art in
  the same change.
