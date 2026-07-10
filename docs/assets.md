---
description: "Runtime asset inventory, naming conventions, and asset replacement guidance."
references: []
---

# Assets Guide

[Docs index](./README.md) | [Repo README](../README.md)

Runtime assets live under `src/assets/`. Food and customer sprite imports are declared at the top of `src/App.tsx`; background and cursor URLs are declared in `src/styles.css`.

## Scene Assets

| File | Dimensions | Used by | Notes |
| --- | ---: | --- | --- |
| `src/assets/game-kitchen-bg.png` | `1672 x 941` | `.sceneBackdrop__image` in `src/styles.css` | Full-screen generated kitchen background with CSS pan animation. |
| `src/assets/player-chef.png` | `1024 x 1536` | `playerChefUrl` in `src/App.tsx` | Runtime chef sprite shown fixed near the lower-left corner. |
| `src/assets/player-chef-source.png` | `1024 x 1536` | Not imported by app code | Source/reference image kept in the repo. |
| `src/assets/game-cursor.svg` | SVG | `--game-cursor` in `src/styles.css` | Custom cursor applied globally and to buttons. |
| `src/assets/conveyor-kitchen-sprite-sheet.png` | `1536 x 1024` | `spriteSheetUrl` in `EnginePanel` | Displayed as a preview image only; the app does not slice sprites from this sheet. |

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

Customer IDs are defined by `CustomerProfile`, `CUSTOMERS`, and `customerSpriteById` in `src/App.tsx`.

| Customer ID | Display name | File | Dimensions |
| --- | --- | --- | ---: |
| `mai` | `Mia` | `src/assets/sprites/customer-mai.png` | `228 x 310` |
| `leo` | `Leo` | `src/assets/sprites/customer-leo.png` | `235 x 310` |
| `nora` | `Nora` | `src/assets/sprites/customer-nora.png` | `237 x 310` |
| `ben` | `Ben` | `src/assets/sprites/customer-ben.png` | `228 x 310` |
| `ivy` | `Ivy` | `src/assets/sprites/customer-ivy.png` | `248 x 310` |
| `sam` | `Sam` | `src/assets/sprites/customer-sam.png` | `239 x 310` |

## Naming Conventions

| Asset kind | Convention |
| --- | --- |
| Food sprite | `src/assets/sprites/food-{food-id}.png` |
| Customer sprite | `src/assets/sprites/customer-{customer-id}.png` |
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

1. Add `src/assets/sprites/customer-{id}.png`.
2. Import it near the existing customer imports in `src/App.tsx`.
3. Add the ID to `CustomerProfile["id"]`.
4. Add `{ id, name }` to `CUSTOMERS`.
5. Add the sprite to `customerSpriteById`.
6. Update this guide's customer table.
7. Run `npm run build`.

## Replacing Existing Art

If the filename stays the same, no import changes are needed. Still check:

| Asset | Check |
| --- | --- |
| Food/customer sprites | They crop well inside `object-fit: cover` square-ish wrappers. |
| Chef sprite | Transparent background works over the scene and scales at mobile widths. |
| Kitchen background | `background-size: cover` and mobile inset still frame the useful part. |
| Cursor | Hotspot in `--game-cursor` still feels accurate. |
| Sprite sheet preview | It still reads inside `.assetPreview img` with `object-fit: contain`. |
