---
description: "Repository stack, checkout discipline, commands, change boundaries, and verification."
references: []
---

# Repo Workflow

## Stack And Entrypoints

- React 18, patched Vite 6.4.x, and TypeScript.
- HTML entry: `index.html`.
- React mount: `src/main.tsx`.
- Portal, routing, and both games: `src/App.tsx`.
- Global styling: `src/styles.css`.
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

- Keep ordinary portal/game changes in `src/App.tsx` and `src/styles.css` unless extraction or build
  configuration is genuinely needed.
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
