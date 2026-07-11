---
description: "Repository stack, checkout discipline, commands, change boundaries, and verification."
references: []
---

# Repo Workflow

## Stack And Entrypoints

- React 18, Phaser 4.2.1 for lazy-loaded 2D playfields, patched Vite 6.4.x, and TypeScript.
- HTML entry: `index.html`.
- React mount: `src/main.tsx`.
- Portal, routing, gameplay state/rules, snapshots, and audio: `src/App.tsx`.
- Shared Phaser host: `src/game-runtime/PhaserGameHost.tsx`.
- Game renderers: `src/games/dish-wish/` and `src/games/drop-hop/`.
- Global shell/HUD/canvas styling: `src/styles.css`.
- Runtime art: `src/assets/`.

## Commands

```bash
npm ci
npm run dev
npm run build
npm run preview
npm audit
git diff --check
```

There is no test script.

## Checkout Discipline

- Keep the primary checkout on `main`.
- Use a separate feature worktree and non-main branch for implementation.
- Manually created worktrees belong under the repository sibling `../.worktrees/` convention.
- Harness-managed worktrees may stay in the harness's own managed root.
- Do not create temporary project clones/worktrees under `/private/tmp`.

## Change Boundaries

- Keep gameplay rules/state in `src/App.tsx`, renderer behavior in the owning Phaser scene, and
  page/canvas layout in `src/styles.css`.
- Do not edit `dist/`; rebuild it locally.
- Do not commit `node_modules/`, `dist/`, or `.pi/` runtime state.
- Avoid unrelated cleanup while repairing gameplay or docs.

## Cross-Game CSS Rule

Dish Wish and Drop Hop share `.appShell`, `.mainSurface`, `.gameGrid`, and `.resultBanner`. Full-screen
diner overrides must be qualified under `.appShell:not(.appShell--city)`. Verify both games after
changing any shared selector.

## Verification

- Source/dependency/asset/package changes: `npm run build`, `npm audit`, and `git diff --check`.
- Routing changes: root, both game paths, home controls, back/forward, and title updates.
- Layout/animation/assets: portal plus both games at desktop and mobile widths.
- Audio/speech: manual browser check because policy and API support vary.
- Docs/instructions: local link/frontmatter/reference checks, plus Hunter graph validation when
  exposed.
