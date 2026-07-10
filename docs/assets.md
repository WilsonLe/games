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
| `src/assets/sprites/generated/walk/customer-{id}-walk-sheet.png` | `1536 x 1024` each | `customerWalkSheetById` in `CharacterActor` | Six runtime 4-column × 4-row sheets. Rows contain south, north, east, and front-idle art; four walk frames loop at `720ms` (`180ms` per frame), and west mirrors east. |
| `src/assets/sprites/generated/walk/waiter-walk-sheet.png` | `1536 x 1024` | `waiterWalkSheetUrl` in `CharacterActor` | Runtime waiter sheet with the same layout, scale, foot anchor, and frame loop as customers. |
| `src/assets/sprites/generated/walk/manifest.json` | JSON | Maintainer metadata | Generation model, layout, frame order, post-processing, character mapping, and SHA-256 hashes for the runtime sheets. |
| `src/assets/sprites/generated/customer-fullbody-sheet.png` | `1448 x 1086` | Not imported by app code | Legacy/reference 4-column × 6-row customer sheet retained for visual history. |
| `src/assets/sprites/generated/waiter-fullbody-sheet.png` | `2172 x 724` | Not imported by app code | Legacy/reference four-column waiter sheet retained for visual history. |

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

Customer IDs are defined by `CustomerProfile`, `CUSTOMERS`, and `customerWalkSheetById` in
`src/App.tsx`. Each active diner customer uses an individual sheet under
`src/assets/sprites/generated/walk/`.

| Customer ID | Display name | Runtime walk sheet |
| --- | --- | --- |
| `mai` | `Mia` | `customer-mai-walk-sheet.png` |
| `leo` | `Leo` | `customer-leo-walk-sheet.png` |
| `nora` | `Nora` | `customer-nora-walk-sheet.png` |
| `ben` | `Ben` | `customer-ben-walk-sheet.png` |
| `ivy` | `Ivy` | `customer-ivy-walk-sheet.png` |
| `sam` | `Sam` | `customer-sam-walk-sheet.png` |

Every runtime sheet is a transparent 4 × 4 grid with `384 x 256` cells. Rows 0–2 contain four-frame
south, north, and east walk cycles. Row 3 column 0 contains the front idle pose; the remaining cells
are transparent. The figures share a `220px` source height and stable bottom-center foot anchor.
West-facing movement mirrors the east row in CSS.

Individual `src/assets/sprites/customer-*.png` files remain in the repo. The portal preview imports
`customer-mai.png`; the active Dish Wish actors use the per-character generated walk sheets.

## Naming Conventions

| Asset kind | Convention |
| --- | --- |
| Food sprite | `src/assets/sprites/food-{food-id}.png` |
| Customer walk sheet | `src/assets/sprites/generated/walk/customer-{customer-id}-walk-sheet.png` |
| Waiter walk sheet | `src/assets/sprites/generated/walk/waiter-walk-sheet.png` |
| Walk-sheet metadata | `src/assets/sprites/generated/walk/manifest.json` |
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

1. Add a transparent `1536 x 1024` 4 × 4 sheet at
   `src/assets/sprites/generated/walk/customer-{id}-walk-sheet.png` using the documented row order,
   scale, and foot anchor.
2. If the new customer also needs a portal/legacy still, add `src/assets/sprites/customer-{id}.png`.
3. Add the ID to `CustomerProfile["id"]`.
4. Add `{ id, name }` to `CUSTOMERS`.
5. Import the sheet and add it to `customerWalkSheetById`.
6. Update `src/assets/sprites/generated/walk/manifest.json` and this guide's customer table.
7. Verify all directions, west mirroring, idle state, reduced-motion behavior, and responsive sizing.
8. Run `npm run build`.

## Replacing Existing Art

If the filename stays the same, no import changes are needed. Still check:

| Asset | Check |
| --- | --- |
| Food sprites | They crop well inside fixed food-art wrappers. |
| Customer/waiter sheets | Every file is `1536 x 1024`; 4 × 4 slicing, row order, transparent idle cells, scale, foot anchors, west mirroring, and animation keyframes remain aligned. |
| Portal chef sprite | Transparent background works in the portal preview. |
| Kitchen background | `background-size: cover` and mobile inset still frame the useful part. |
| Cursor | Hotspot in `--game-cursor` still feels accurate. |
| Legacy/reference sheets | Leave unused reference files alone unless intentionally replacing the asset set. |
