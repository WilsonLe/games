---
description: "Asset, styling, and visual QA guidance for the game portal."
references: []
---

# Assets And Visual QA

## Assets

- Background, chef, cursor, customer, and food art live in `src/assets/`.
- Food sprites, generated customer/waiter sheets, and portal preview art are imported directly by
  `src/App.tsx`; add new assets with explicit imports so bundling stays predictable.
- Keep image names descriptive and grouped by role, such as `customer-*` and `food-*`.

## Styling

- The visual system is defined in `src/styles.css` with CSS variables at `:root`.
- The game uses compact panels, a tile-positioned diner floor, a fixed-format kitchen pass, and
  animated directional sprites.
- Keep button, card, and panel radii at 8px or less unless extending an existing circular element.
- Avoid layouts where text can overlap game controls, counters, sprites, or dish items at small widths.

## Visual QA

- Check desktop and mobile breakpoints after layout changes, especially near 980px and 560px.
- Confirm the kitchen background, player sprite, customer sprites, food sprites, and cursor all render.
- Confirm active animations are visible but do not shift layout: dish entry/bobbing, customer
  walking/bobbing, and waiter directional walking.
- Use browser inspection or screenshots when changing fixed-format surfaces such as the kitchen pass,
  guest tables, stat pills, or top controls.
