---
description: "Asset, shared styling, and visual QA guidance for the portal and both games."
references: []
---

# Assets And Visual QA

## Assets

- Runtime art lives under `src/assets/`.
- Explicit imports in `src/App.tsx` cover portal previews, food sprites, and generated character sheets.
- CSS references the kitchen background for both scene and in-stage cooking visuals, plus the custom cursor.
- Keep descriptive lowercase kebab-case names and update `docs/assets.md` when inventory changes.

## Styling Guardrails

- `src/styles.css` is global; portal, diner, and city selectors coexist.
- Keep diner full-screen overrides for shared classes scoped with
  `.appShell:not(.appShell--city)`.
- Preserve native controls and visible focus/feedback behavior.
- Avoid text overlap with HUDs, status messages, sprites, dishes, map stops, and result controls.
- Keep ordinary panel/button radii compact and preserve chunky borders/offset shadows.

## Visual QA Matrix

Check all three screens:

| Screen | Desktop | 980px | 560px | 320–380px / short height |
| --- | --- | --- | --- | --- |
| Portal | Two cards, art, scroll | Cards stack | Compact previews | No clipped cards/header |
| Dish Wish | Four persistent tables, responsive floor, kitchen, HUD | Scaled stage | Compact HUD/tables | Status and controls remain reachable |
| Drop Hop | Three-column layout | One column | Compact map/stats | Document scroll and labels remain usable |

Also verify:

- portal and game home controls;
- kitchen, player, customer, food, and cursor assets;
- dish entry/bob/exit, linear guest tile-route movement and directional frame loops, city pickup pulse, and courier motion;
- no console errors or missing assets;
- exact traversed-road highlighting, including routes that revisit stops.
