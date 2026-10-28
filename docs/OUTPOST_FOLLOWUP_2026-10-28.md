# ChatGPT follow-up: outpost-control investigation (2026-10-28)

## Scope and safety
This is an experimental branch based on `main`. Claude's unpushed `exp/croc-outpost` branch and scratchpad JSON outputs were not available from GitHub, so this work is a reproducible follow-up from the public `main` source, not a restoration of those missing changes.
No changes were made to `main` or `dist/game.html`.

## Changes on this branch
- Strengthened four vacuous assertions in `tests/rules_real.js`; each now checks a real move condition:
  - Dog can enter marsh from (6,6) to (5,6).
  - A dog on the bank actually captures the adjacent weaker piece in marsh.
  - Bison can dash into marsh if the midpoint is clear.
  - A bank-side rat can actually capture an elephant on the bank.
- Updated AI evaluation in `src/engine.js` for AI mask bit 4:
  - reward safe occupation of an outpost (+28, plus 8 for effective rank >= 5);
  - reduce the holding reward by 20 when that holder is threatened;
  - retain a smaller approach reward (+8) for a friendly piece adjacent to an empty outpost;
  - retain the existing bridge-control term.
- Added `tests/outpost_ai.js` to test evaluation differences for safe occupation, enemy occupation, approach and a threatened holder.
- Added `tests/outpost_compare.js`, a paired-seed simulator that swaps AI sides and tracks wins, draws, lane usage, outpost entries, bonus steps, outpost-presence samples, own-turn holding turns, hold episodes and longest consecutive hold streak.
- Added a CI workflow to run engine, AI and browser tests on this branch.

## Logic test results
The following scripts were run using the GitHub source in an in-memory JavaScript harness. This verifies the engine/test logic but is not the same as running the suite on a local Node.js installation with Chromium.

- `tests/rules_real.js`: 144 pass, 0 fail.
- `tests/t16.js`: 20 pass, 0 fail.
- `tests/terrain.js`: 104 pass, 0 fail.
- `tests/ai.js`: 6 pass, 0 fail.
- `tests/outpost_ai.js`: 6 pass, 0 fail.

Total: 280 assertions reported passing across these five scripts. The actual GitHub Actions run completed successfully on commit `744349d1f99793619fdf756639d9e8e243b9136f`: build, all five Node.js test scripts, paired-seed simulation, Chromium installation and all three Playwright/browser scripts passed. [Workflow run #2](https://github.com/kevinpan2108-oss/co-thu/actions/runs/40669252002).

## Paired-seed outpost heuristic simulations

The script compares baseline AI (mask 0) against the outpost-control heuristic (mask 4). Each squad seed is played twice with sides swapped. Search budgets and ply caps are deliberately reduced for a quick experiment. These are direction-finding samples, not production-quality strength tests.

### Budget 10 ms, cap 120 plies — 30 games
Three independent batches, five seed pairs each:

| Metric | Baseline | Outpost heuristic |
|---|---:|---:|
| Wins | 4 | 5 |
| Draws across both AIs | 21 | — |
| Moves to left / center / right lanes | 272 / 862 / 429 | 294 / 836 / 432 |
| Moves entering an outpost | 50 | 80 |
| Bonus steps used | 38 | 61 |
| Board-state samples with an outpost occupied by that AI | 425 | 1,794 |
| Samples adjacent to an outpost | 236 | 276 |
| Samples where both sides were adjacent to the same outpost | 16 | 16 |

Total games: 30; improved AI 5 wins, baseline 4 wins, 21 draws. Twenty-one games reached the 120-ply cap; nine ended by entering a den. Average length: 104.2 plies.

Interpretation: at this low search budget, the evaluator noticeably increases outpost engagement/occupation and bonus-step use, but win counts are effectively tied and most games draw. The occupied-outpost metric is a board-position sample count, not a count of unique turns held or successful defences.

### Budget 25 ms — 20 games across different caps
Three batches, ten seed pairs total. Two batches used a 100-ply cap; one used a 90-ply cap.

| Metric | Baseline | Outpost heuristic |
|---|---:|---:|
| Wins | 3 | 2 |
| Draws across both AIs | 15 | — |
| Moves to left / center / right lanes | 119 / 571 / 203 | 145 / 483 / 265 |
| Moves entering an outpost | 15 | 41 |
| Bonus steps used | 10 | 29 |
| Board-state samples with an outpost occupied by that AI | 105 | 1,062 |
| Samples adjacent to an outpost | 102 | 116 |

Total games: 20; improved AI 2 wins, baseline 3 wins, 15 draws. Fifteen games reached their ply cap; five ended by entering a den. Average length: 89.3 plies.

Interpretation: the heuristic again produced more outpost entries, bonus steps and occupied-outpost samples, but the win counts remain tied in practical terms (3–2) and most games draw. Results are sensitive to the random squad/seed and ply cap.

### Latest CI sample — budget 25 ms, cap 120 plies — 20 games

GitHub Actions run [#2](https://github.com/kevinpan2108-oss/co-thu/actions/runs/40669252002) ran 10 seed pairs, swapping the AI sides for each pair. The uploaded artifact reports:

| Metric | Baseline | Outpost heuristic |
|---|---:|---:|
| Wins | 2 | 4 |
| Draws across both AIs | 14 | — |
| Moves to left / center / right lanes | 266 / 461 / 347 | 340 / 401 / 331 |
| Moves entering an outpost | 44 | 108 |
| Bonus steps used | 38 | 90 |
| Board-state samples with an outpost occupied by that AI | 259 | 1,097 |
| Samples adjacent to an outpost | 400 | 800 |
| Own turns ending while holding at least one outpost | 123 | 488 |
| Separate hold episodes | 26 | 70 |
| Longest consecutive own-turn hold streak | 25 | 43 |

Total: 20 games; 14 reached the 120-ply cap and six ended by entering a den. Average length: 107.3 plies. The heuristic occupied or entered outposts much more often, but only six games were decisive, so 4 wins versus 2 is not strong evidence of a win-rate improvement.

A second in-memory run with the same seeds and settings produced 2 baseline wins, 3 heuristic wins and 15 draws, with different move/occupation counts. The search uses a wall-clock time budget, so small timing differences can change search results. Treat these as exploratory samples, not a deterministic benchmark. The uploaded CI artifact is the recorded result for run #2.

### What the simulations do and do not show
- Supported: mask 4 changes AI behaviour and generally increases its attention to/occupation of outposts in these exploratory samples.
- Not established: a stronger win rate, better defence when challenged, or overall game balance.
- Limitations: small random-squad samples, deliberately low search budgets, ply caps producing many draws, and limited direct contest positions.

## Crocodile-in-marsh rule check
A separate six-game exploratory comparison of the current special attack (a land piece with effective rank >= 6 can attack a crocodile in marsh) against a variant without that attack ended with 1 current-rule win, 2 variant wins and 3 draws (140-ply cap). The move was available in two sampled positions and used twice. This is far too small to infer balance.

## Recommended next steps
1. Increase the ply cap and seed count, and favor scenarios where squads deliberately contest the outposts so fewer games end at the cap.
2. Add targeted side-swapped positions to measure whether an AI can defend an occupied outpost and recapture it after losing control.
3. Consider a deterministic node-budget or fixed-depth comparison; the current wall-clock budget makes results vary between runs.
4. Keep the heuristic behind the experimental AI flag until a larger set of resolved games shows a repeatable benefit. Do not merge into `main` based on the current samples.
