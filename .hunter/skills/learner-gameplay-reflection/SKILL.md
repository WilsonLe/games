---
name: learner-gameplay-reflection
description: Run Dish Wish in the local browser as a player-centered playtest for a Vietnamese child learning beginner English, then write one private local reflection with prioritized improvements. Use only when asked to playtest Dish Wish or generate a Dish Wish playtest reflection.
metadata:
  hunter:
    type: process
    status: active
    version: 0.1.0
    loading:
      token_budget_hint: 1900
      routing_terms:
        - playtest Dish Wish
        - run a Dish Wish playtest
        - do the Dish Wish playtest
        - run the playtest process
        - generate a Dish Wish playtest reflection
        - play Dish Wish as a Vietnamese child
    graph:
      parent_names:
        - process
---

# Dish Wish Learner Playtest

## Purpose and boundary

Run the actual local game, play it from the portal, and produce a candid reflection about how Dish Wish could better support a Vietnamese child learning English vocabulary and interaction through play.

This is a reflection-only workflow. Do not change source or docs, create issues or backlog items, implement recommendations, commit artifacts, or turn the run into an exhaustive QA checklist. Do not change Hunter's persona or claim to be a real child or to represent research with children; use the requested background as an empathy lens and label learner-specific conclusions as hypotheses.

## Preconditions

- Work from the repository root and preserve any pre-existing tracked changes.
- Use the local Vite app and the canonical `/games/dish-wish` route reached through the `/` portal.
- Load and follow the global `paseo-browser` skill before browser execution. Use Paseo's browser tools through `mcp`, discovering and describing the exact `paseo_browser_*` tools before first use.
- Write exactly one retained run artifact under `.hunter/artifacts/playtests/dish-wish/<UTC-timestamp>/reflection.md`. This path must be ignored by Git.
- A successful playtest requires an operable browser tab and enough game control to complete orders. If the browser host or controls are unavailable, stop and report the blocker; do not substitute source inspection or claim a browser playtest.

## Player lens

Approach unfamiliar screens before reading implementation or gameplay documentation. Think like a young, early-stage English learner in Vietnam who is curious about games but may:

- recognize food pictures before English spellings;
- need time to connect spoken words, written words, and images;
- be unsure what is clickable or draggable without a demonstration;
- learn through repetition, forgiving correction, and immediate feedback;
- lose confidence when timing, competing motion, or unexplained penalties overwhelm comprehension.

Avoid stereotypes and invented language facts. Distinguish what happened on screen from what this learner might experience.

## Run sequence

Use one durable process with steps for setup, play, reflection, and cleanup. A supervisory todo is unnecessary unless the playtest belongs to a broader workstream.

1. **Capture the baseline.** Record the UTC start time, current commit, existing `git status --short`, browser/viewport if observable, and whether audio can actually be heard or assessed. Do not read game internals to pre-explain the experience.
2. **Start the app.** Reuse dependencies when present; otherwise run `npm ci`. Start `npm run dev -- --host 127.0.0.1 --port <free-port> --strictPort`, retain the PID, and wait until the root URL responds. Keep transient server logs outside the retained artifact directory.
3. **Enter as a player.** Open `/` in a new Paseo tab. Observe the portal without assistance, choose Dish Wish through the visible UI, and notice whether the game's purpose and next action are understandable.
4. **Play naturally.** Use visible/player-facing controls rather than manipulating React state or calling game internals. Prefer the normal pointer path when the browser tools can operate it; otherwise use the game's native keyboard companion controls and disclose that limitation. Try to understand the game from its own cues. Continue through the first difficulty change and enough repeated service to judge the loop—normally at least 6 completed orders or 10 minutes. Continue to shift completion when the loop remains informative and time permits. Do not force mistakes solely to satisfy a test matrix, but observe natural errors and recovery.
5. **Observe the whole experience.** Re-snapshot and visually inspect after meaningful state changes. Pay attention to:
   - first impression, goal clarity, discoverability, and onboarding;
   - the connection among spoken order, written words, food art, and the player's action;
   - vocabulary load, repetition, recall, and whether the game teaches after confusion;
   - legibility, motion, layout, cursor/drag behavior, feedback, and accessibility of used controls;
   - pacing, patience pressure, difficulty growth, mistakes, recovery, confidence, delight, and fatigue;
   - culturally familiar or unfamiliar food/context, stated only as a hypothesis unless directly evidenced;
   - surrounding portal, HUD, score/progress, audio status, transitions, and return controls—not just successful dish drops.
6. **Reflect after playing.** Write the artifact from direct observations. Keep observed facts, learner-lens interpretations, and recommendations separate. Recommendations should improve learning or play, not merely add features.
7. **Clean up.** Close only the browser tab created for the run and stop only the server process started by this run. Confirm the reflection exists, is non-empty, and passes `git check-ignore`. Compare final tracked status with the baseline; the playtest must not introduce tracked changes.

## Reflection contract

Use this structure:

```markdown
# Dish Wish learner playtest reflection

- Played at (UTC):
- Commit:
- Run length and progress reached:
- Browser/viewport and control method:
- Audio actually assessed: yes/no — reason

## Simulated learner lens
A short reminder that this is an empathy-based simulation, not research with a real child.

## Player journey
A concise first-person account of what I noticed, tried, understood, misunderstood, and felt while playing.

## What already works
Specific observed moments that support comprehension, practice, confidence, or enjoyment.

## Friction and learning risks
For each important point: observation → learner-lens interpretation → likely consequence. Include surrounding experience as well as the core loop.

## Improvements to try
| Priority | Improvement | Evidence from this run | Expected learner benefit | Smallest useful experiment |
| --- | --- | --- | --- | --- |

## Open questions and limits
Unassessed audio, unavailable interactions, incomplete progression, uncertain cultural assumptions, and questions that require real child playtesting.
```

Prioritize no more than five improvements. Use `P0` only for a blocker, `P1` for major comprehension/learning friction, and `P2` for polish. Do not present speculative redesigns as proven solutions.

## Done and handoff

The run is complete only when the server and browser were used, meaningful gameplay occurred, the single reflection follows the contract, the artifact is ignored, tracked status is unchanged from baseline, and limitations are explicit. In the final response, provide the reflection path, progress reached, and any material capability limit. Do not implement the reflection unless the user separately asks for changes.
