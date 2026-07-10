---
description: "Hunter startup, skill loading, durable process/todo state, delegation, and validation workflow."
references: []
---

# Hunter Workflow

## Startup

1. Treat `AGENTS.md` as the project instruction root.
2. When exposed, call `hunter_graph_get_root`; the current tool takes no root-path argument.
3. Use visible descriptions and `hunter_skill_load_plan` to load the minimum matching instruction set.
4. Show a compact loaded/skipped summary for the turn.
5. If Hunter tools are not exposed, say so and read `AGENTS.md` plus its references manually.

## Process And Todo State

- For non-trivial work, infer the workflow before editing.
- Use `hunter_process_update` for ordered steps, dependencies, validation, artifacts, and blockers.
- Use `hunter_todo_update` for the high-level workstream or cross-process commitments.
- Do not mirror every process step as a todo.
- Review/sync near startup, after major phases, after validation, and before final delivery.
- Mark blocked or stale work honestly and explain why.
- Do not hand-edit tool-managed JSON. Current Pi integration may persist it under `.pi/hunter/`, which
  is local ignored runtime state.

## Documentation And Instruction Changes

- Keep YAML `description` and `references` frontmatter on graph Markdown.
- Keep references root-relative and verify each path exists.
- Run Hunter graph validation when the tool is exposed.
- If no graph validator is exposed, run local frontmatter/reference/link checks and explicitly report
  the capability gap.

## Delegation

Delegation is a first-class Hunter workflow, not merely a saved prompt. When requested, load the
`delegation` skill, prepare a narrow goal packet, and use the configured neighboring Hunter-owned
session topology. Keep the parent responsible for supervision and final validation. Do not claim a
worker ran when only a dry-run packet was prepared.

## Repository Guardrails

- Confirm root, branch, worktree, remotes, default branch, and local status before implementation.
- Keep the primary checkout on `main` and perform feature work in a separate worktree.
- Respect harness-owned worktree locations; use `../.worktrees/` for manually created worktrees.
- Keep unrelated and local runtime files out of the change.

## Delivery

Before final delivery:

1. review process and todo state;
2. run required build/diff/doc checks;
3. identify any visual checks that were not practical;
4. keep unfinished work open or blocked;
5. summarize changed files, validation evidence, and residual risks.
