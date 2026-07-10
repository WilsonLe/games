---
description: "Repository workflow, stack, command, and change-boundary guidance for Table Talk Games."
references: []
---

# Repo Workflow

## Stack

- React 18 with Vite 5 and TypeScript.
- Source entrypoint: `src/main.tsx`.
- Main app and game implementation: `src/App.tsx`.
- Global styling and responsive layout: `src/styles.css`.
- Static art and sprites live under `src/assets/`.

## Commands

- Install dependencies with `npm ci` when using the lockfile.
- Start local development with `npm run dev`.
- Verify production build with `npm run build`.
- Preview a built app with `npm run preview`.

## Change Boundaries

- Keep runtime code changes focused on `src/App.tsx` and `src/styles.css` unless the task needs new
  components, routes, assets, or build configuration.
- Avoid unrelated refactors while tuning gameplay or presentation.
- Do not edit generated output in `dist/`; rebuild instead.
- Treat `node_modules/` and `dist/` as local artifacts.

## Checkout Discipline

- The main repo checkout at `games/` must stay on `main`.
- Do not switch the main repo checkout to feature branches.
- For branch work, create a sibling worktree under `../.worktrees/` and check out the branch there.
- Avoid temporary repo clones or worktrees under `/private/tmp` for this project.

## Verification

- Run `npm run build` before completing code changes.
- Run `git diff --check` before handing work back.
- For animation, layout, or asset changes, verify the app visually in a browser at desktop and mobile
  widths.
- For audio or speech changes, confirm behavior manually in a browser because these APIs depend on
  browser permissions and user gesture rules.
