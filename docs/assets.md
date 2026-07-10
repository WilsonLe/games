---
description: "Runtime asset inventory, naming conventions, and asset replacement guidance."
references: []
---

# Assets Guide

[Docs index](./README.md) | [Repo README](../README.md)

Runtime assets live under `src/assets/`. Food sprites, generated character sheets, and portal
preview images are imported at the top of `src/App.tsx`; the kitchen background is also referenced
from CSS scene styles, and the cursor URL is declared in `src/styles.css`.

## Scene Assets

| File | Dimensions | Used by | Notes |
| --- | ---: | --- | --- |
| `src/assets/game-kitchen-bg.png` | `1672 x 941` | `.sceneBackdrop__image` and `.kitchenStation` in `src/styles.css`; `gameKitchenBgUrl` in `GamePortal` | Generated kitchen background for the scene, in-stage cooking area, and portal preview tile. |
| `src/assets/player-chef.png` | `1024 x 1536` | `playerChefUrl` in `GamePortal` | Portal preview chef image. |
| `src/assets/player-chef-source.png` | `1024 x 1536` | Not imported by app code | Source/reference image kept in the repo. |
| `src/assets/game-cursor.svg` | SVG | `--game-cursor` in `src/styles.css` | Custom cursor applied globally and to buttons. |
| `src/assets/conveyor-kitchen-sprite-sheet.png` | `1536 x 1024` | Not imported by app code | Legacy/reference kitchen sprite sheet. |
| `src/assets/sprites/generated/customer-fullbody-sheet.png` | `1448 x 1086` | `customerFullbodySheetUrl` in `CharacterActor` | Runtime 4-column × 6-row customer sheet, sliced at `400% 600%`; vertical and side frame pairs loop while walking. |
| `src/assets/sprites/generated/waiter-fullbody-sheet.png` | `2172 x 724` | `waiterFullbodySheetUrl` in `CharacterActor` | Runtime 4-column waiter sheet using the same world-space actor height and frame loop as customers; west mirrors east. |

## Food Sprites

Food IDs are defined by the `FoodId` union and `FOODS` array in `src/App.tsx`.

| Food ID | Display name | File | Dimensions |
| --- | --- | --- | ---: |
| `rice` | `rice` | `src/assets/sprites/food-rice.png` | `286 x 313` |
| `fish` | `fish` | `src/assets/sprites/food-fish.png` | `419 x 310` |
| `chicken` | `chicken` | `src/assets/sprites/food-chicken.png` | `286 x 313` |
| `egg` | `egg` | `src/assets/sprites/food-egg.png` | `286 x 313` |
| `noodles` | `noodles` | `src/assets/sprites/food-noodles.png` | `286 x 313` |
| `soup` | `soup` | `src/assets/sprites/food-soup.png` | `286 x 313` |
| `salad` | `salad` | `src/assets/sprites/food-salad.png` | `369 x 310` |
| `tea` | `tea` | `src/assets/sprites/food-tea.png` | `333 x 310` |
| `bread` | `bread` | `src/assets/sprites/food-bread.png` | `319 x 310` |

Visible food art comes from `<img>` tags inside `FoodArt`. The `foodArt--...` CSS classes still exist, but `.foodArt::before` and `.foodArt::after` are disabled, so those older CSS pseudo-shapes are not the rendered food art.

## Customer Sprites

Customer IDs are defined by `CustomerProfile`, `CUSTOMERS`, and `customerSpriteRowById` in
`src/App.tsx`. The active diner route uses `src/assets/sprites/generated/customer-fullbody-sheet.png`;
`customerSpriteRowById` maps each customer to the row exposed through CSS `--sprite-y`.

| Customer ID | Display name | Sheet row |
| --- | --- | ---: |
| `mai` | `Mia` | `0%` |
| `leo` | `Leo` | `20%` |
| `nora` | `Nora` | `40%` |
| `ben` | `Ben` | `60%` |
| `ivy` | `Ivy` | `80%` |
| `sam` | `Sam` | `100%` |

Individual `src/assets/sprites/customer-*.png` files remain in the repo. The portal preview imports
`customer-mai.png`; the active diner table sprites come from the generated full-body sheet.

## Naming Conventions

| Asset kind | Convention |
| --- | --- |
| Food sprite | `src/assets/sprites/food-{food-id}.png` |
| Customer sheet | `src/assets/sprites/generated/customer-fullbody-sheet.png` |
| Waiter sheet | `src/assets/sprites/generated/waiter-fullbody-sheet.png` |
| Legacy customer sprite | `src/assets/sprites/customer-{customer-id}.png` |
| Background | `src/assets/game-kitchen-bg.png` |
| Player chef | `src/assets/player-chef.png` |
| Player source/reference | `src/assets/player-chef-source.png` |
| Cursor | `src/assets/game-cursor.svg` |

Use lowercase kebab-case filenames. Keep `FoodId` and customer IDs lowercase because they are used in generated IDs, CSS class names, maps, and aria labels.

## Adding A Food Asset

1. Add `src/assets/sprites/food-{id}.png`.
2. Import it near the existing food imports in `src/App.tsx`.
3. Add the ID to `FoodId`.
4. Add `{ id, name }` to `FOODS`.
5. Add the sprite to `foodArtById`.
6. Confirm `orderSize` in `difficultyForLevel` never exceeds `FOODS.length`.
7. Update this guide's food table.
8. Run `npm run build`.

## Adding A Customer Asset

1. Add or regenerate the customer row in `src/assets/sprites/generated/customer-fullbody-sheet.png`.
2. If the new customer also needs a portal/legacy still, add `src/assets/sprites/customer-{id}.png`.
3. Add the ID to `CustomerProfile["id"]`.
4. Add `{ id, name }` to `CUSTOMERS`.
5. Add the row position to `customerSpriteRowById`.
6. Update this guide's customer table and generated sheet metadata.
7. Run `npm run build`.

## Replacing Existing Art

If the filename stays the same, no import changes are needed. Still check:

| Asset | Check |
| --- | --- |
| Food sprites | They crop well inside fixed food-art wrappers. |
| Customer/waiter sheets | Row/column slicing still aligns with `background-size` and animation keyframes. |
| Portal chef sprite | Transparent background works in the portal preview. |
| Kitchen background | `background-size: cover` and mobile inset still frame the useful part. |
| Cursor | Hotspot in `--game-cursor` still feels accurate. |
| Legacy/reference sheets | Leave unused reference files alone unless intentionally replacing the asset set. |
