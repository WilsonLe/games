---
description: "Runtime asset inventory, naming conventions, and asset replacement guidance."
references: []
---

# Assets Guide

[Docs index](./README.md) | [Repo README](../README.md)

Runtime assets live under `src/assets/`. Portal and React-panel art is imported by `src/App.tsx`.
Dish Wish textures are imported and preloaded by `DishWishScene`; Drop Hop preloads its courier sheet
in `DropHopScene`. The kitchen background remains available to portal CSS/React, and the cursor URL
is declared in `src/styles.css`.

## Scene Assets

| File | Dimensions | Used by | Notes |
| --- | ---: | --- | --- |
| `src/assets/game-kitchen-bg.png` | `1672 x 941` | Portal background/preview plus `DishWishScene` texture `dish-kitchen` | Generated kitchen background for the portal and Phaser kitchen strip. |
| `src/assets/player-chef.png` | `1024 x 1536` | `playerChefUrl` in `GamePortal` | Portal preview chef image. |
| `src/assets/player-chef-source.png` | `1024 x 1536` | Not imported by app code | Source/reference image kept in the repo. |
| `src/assets/game-cursor.svg` | SVG | `--game-cursor` in `src/styles.css` | Custom cursor applied globally and to buttons. |
| `src/assets/conveyor-kitchen-sprite-sheet.png` | `1536 x 1024` | Not imported by app code | Legacy/reference kitchen sprite sheet. |
| `src/assets/sprites/generated/walk/customer-{id}-walk-sheet.png` | `1536 x 1024` each | Phaser preload maps in `DishWishScene`; Mai also supplies the Drop Hop courier | Six runtime 4-column × 4-row sheets. Rows contain dedicated south, north, east, and west art; four walk frames loop near `720ms` (`180ms` per frame). |
| `src/assets/sprites/generated/walk/manifest.json` | JSON | Maintainer metadata | Generation model, layout, frame order, post-processing, character mapping, and SHA-256 hashes for the runtime sheets. |
| `src/assets/sprites/generated/customer-fullbody-sheet.png` | `1448 x 1086` | Not imported by app code | Legacy/reference 4-column × 6-row customer sheet retained for visual history. |

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

Dish Wish preloads these files as Phaser textures named `dish-food-{id}`. React's `FoodArt` still
uses the same files in portal/ticket UI. The `foodArt--...` CSS classes remain only for those React
image wrappers; pseudo-shapes are disabled.

## Customer Sprites

Customer IDs are defined by `CustomerProfile` and `CUSTOMERS` in `src/App.tsx`, and the texture URL
map in `DishWishScene` must cover the same union. Each active diner customer uses an individual sheet
under `src/assets/sprites/generated/walk/`.

| Customer ID | Display name | Runtime walk sheet |
| --- | --- | --- |
| `mai` | `Mia` | `customer-mai-walk-sheet.png` |
| `leo` | `Leo` | `customer-leo-walk-sheet.png` |
| `nora` | `Nora` | `customer-nora-walk-sheet.png` |
| `ben` | `Ben` | `customer-ben-walk-sheet.png` |
| `ivy` | `Ivy` | `customer-ivy-walk-sheet.png` |
| `sam` | `Sam` | `customer-sam-walk-sheet.png` |

Every runtime sheet is a transparent 4 × 4 grid with `384 x 256` cells. Rows 0–3 contain four-frame
south, north, east, and west walk cycles. The west row stores cell-by-cell mirrored east art so every
direction has a dedicated sheet row. Non-walking Phaser sprites use column 0 of the row matching
their facing direction. The figures share a `220px` source height and stable bottom-center foot anchor.

Individual `src/assets/sprites/customer-*.png` files remain in the repo. The portal preview imports
`customer-mai.png`; the active Dish Wish actors use the per-character generated walk sheets.

## Naming Conventions

| Asset kind | Convention |
| --- | --- |
| Food sprite | `src/assets/sprites/food-{food-id}.png` |
| Customer walk sheet | `src/assets/sprites/generated/walk/customer-{customer-id}-walk-sheet.png` |
| Walk-sheet metadata | `src/assets/sprites/generated/walk/manifest.json` |
| Legacy customer sprite | `src/assets/sprites/customer-{customer-id}.png` |
| Background | `src/assets/game-kitchen-bg.png` |
| Player chef | `src/assets/player-chef.png` |
| Player source/reference | `src/assets/player-chef-source.png` |
| Cursor | `src/assets/game-cursor.svg` |

Use lowercase kebab-case filenames. Keep `FoodId` and customer IDs lowercase because they are used in generated IDs, CSS class names, maps, and aria labels.

## Adding A Food Asset

1. Add `src/assets/sprites/food-{id}.png`.
2. Import it for React ticket/portal use in `src/App.tsx` and for canvas use in `DishWishScene`.
3. Add the ID to `FoodId` and `DishWishFoodId`.
4. Add `{ id, name }` to `FOODS`.
5. Add the sprite to `foodArtById`, `FOOD_ASSETS`, and `FOOD_NAMES`.
6. Confirm `orderSize` in `difficultyForLevel` never exceeds `FOODS.length`.
7. Update this guide's food table.
8. Run `npm run build`.

## Adding A Customer Asset

1. Add a transparent `1536 x 1024` 4 × 4 sheet at
   `src/assets/sprites/generated/walk/customer-{id}-walk-sheet.png` using the documented row order,
   scale, and foot anchor.
2. If the new customer also needs a portal/legacy still, add `src/assets/sprites/customer-{id}.png`.
3. Add the ID to `CustomerProfile["id"]` and `DishWishCustomerId`.
4. Add `{ id, name }` to `CUSTOMERS`.
5. Import the sheet and add it to `CUSTOMER_ASSETS` in `DishWishScene`.
6. Update `src/assets/sprites/generated/walk/manifest.json` and this guide's customer table.
7. Verify all four directional rows, direction-matched idle state, reduced-motion behavior, and responsive sizing.
8. Run `npm run build`.

## Replacing Existing Art

If the filename stays the same, no import changes are needed. Still check:

| Asset | Check |
| --- | --- |
| Food sprites | They crop well inside fixed food-art wrappers. |
| Customer sheets | Every file is `1536 x 1024`; 4 × 4 slicing, four-direction row order, scale, foot anchors, and animation keyframes remain aligned. |
| Portal chef sprite | Transparent background works in the portal preview. |
| Kitchen background | `background-size: cover` and mobile inset still frame the useful part. |
| Cursor | Hotspot in `--game-cursor` still feels accurate. |
| Legacy/reference sheets | Leave unused reference files alone unless intentionally replacing the asset set. |
