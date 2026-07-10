---
description: "Project-wide Hunter root for the Lingo Game React/Vite mini-game portal."
references:
  - "README.md"
  - "docs/README.md"
---

# Lingo Game Hunter Root

This file is the startup entry point for future coding sessions in this repository.

## Future Session Protocol

- If Hunter graph tools are exposed, start with `hunter_graph_get_root`; its current tool contract
  takes no project-root argument.
- Use visible child descriptions and `hunter_skill_load_plan` to load only the smallest relevant
  instructions for the task.
- If Hunter tools are unavailable, say so directly, then read this file and its referenced Markdown
  files manually.
- For non-trivial work, use `hunter_todo_update` for the high-level workstream and
  `hunter_process_update` for ordered implementation and validation steps. Do not hand-edit runtime
  Hunter state files.
- If project instruction or graph Markdown changes, run Hunter graph validation when that tool is
  available. Otherwise validate frontmatter and referenced paths locally and report that the graph
  validator was unavailable.

## Checkout Discipline

- Keep the primary repository checkout on `main`.
- Do not check out feature branches directly in the primary checkout.
- For manually created branch work, use the repository's sibling `../.worktrees/` area.
- A worktree created and owned by the active coding harness (for example, Paseo) may remain in that
  harness's managed worktree root; do not move or recreate it merely to match the manual convention.
- Do not create project worktrees or temporary clones under `/private/tmp`.

## Product Context

- The root route, `/`, is a usable two-game mini-game portal, not a marketing landing page and not a
  direct launch into either game.
- The shipped games are Dish Wish and Drop Hop.
- Dish Wish is a food-serving arcade game for practical English orders.
- Drop Hop is a map-routing game for English prepositions, place words, and quantities.
- Both game routes must provide a clear way back to the portal.
- The app is client-only and asset-rich: imported art, a custom cursor, Web Audio feedback, and
  browser speech synthesis are part of the product experience.
- Preserve the portal as the first usable screen when changing routing or startup behavior.

## Verification Rules

- Run `npm run build` after source, dependency, asset import, or package metadata changes.
- Run `git diff --check` before handing work back.
- For routing changes, verify `/`, both `/games/...` paths, browser back/forward, and portal-return
  controls.
- For layout, animation, or asset changes, inspect the running portal and both games at desktop and
  mobile widths when practical.
- For docs or instructions, validate local Markdown references and confirm implementation claims
  against source.
