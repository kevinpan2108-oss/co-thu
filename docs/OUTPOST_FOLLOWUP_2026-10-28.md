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
- Updated the AI evaluation in `src/engine.js` for AI mask bit 4:
  - reward safe occupation of an outpost (+28, plus 8 for effective rank >= 5);
  - reduce the holding reward by 20 when that holder is threatened;
  - retain a smaller approach reward (+8) for a friendly piece adjacent to an empty outpost;
  - retain the existing bridge-control term.
- Added `tests/outpost_ai.js` to test the evaluation differences for safe occupation, enemy occupation, approach and a threatened holder.
- Added `tests/outpost_compare.js`, a paired-seed simulator that swaps AI sides and tracks wins, draws, lane usage, outpost entries, bonus steps and outpost presence samples.
- Added this report and documented the scripts in the README.

## Logic test results
The following scripts were run using the GitHub source in an in-memory JavaScript harness. This verifies the engine/test logic but is not the same as running the suite on a local Node.js installation with Chromium.

- `tests/rules_real.js`: 144 pass, 0 fail.
- `tests/t16.js`: 20 pass, 0 fail.
- `tests/terrain.js`: 104 pass, 0 fail.
- `tests/ai.js`: 6 pass, 0 fail.
- `tests/outpost_ai.js`: 6 pass, 0 fail.

Total: 280 assertions reported passing across these five scripts. Playwright/browser tests were not run in this environment.

## Paired-seed outpost heuristic simulations

The script compares baseline AI (mask 0) against the outpost-control heuristic (mask 4). Each squad seed is played twice with sides swapped. Search budget and ply cap are deliberately reduced for a quick experiment. These are direction-finding samples, not production-quality strength tests.

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

Interpretation: at this low search budget the evaluator noticeably increases outpost engagement/occupation and bonus-step use, but win counts are effectively tied and most games draw. The occupied-outpost metric is a board-position sample count, not a count of unique turns held or successful defences.

### Budget 25 ms, cap 100 plies — 12 games
Two independent batches, three seed pairs each:

| Metric | Baseline | Outpost heuristic |
|---|---:|---:|
| Wins | 2 | 2 |
| Draws across both AIs | 8 | — |
| Moves to left / center / right lanes | 85 / 325 / 127 | 94 / 271 / 172 |
| Moves entering an outpost | 12 | 27 |
| Bonus steps used | 8 | 19 |
| Board-state samples with an outpost occupied by that AI | 102 | 774 |
| Samples adjacent to an outpost | 85 | 64 |

Total games: 12; improved AI 2 wins, baseline 2 wins, 8 draws. Eight games reached the 100-ply cap; four ended by entering a den. Average length: 89.5 plies.

Interpretation: the higher-budget samples also show more outpost entries and bonus steps overall, but those counts varied strongly by seed. Win counts are tied. This still does not establish a win-rate improvement or prove that the heuristic is well balanced.

### What the simulations do and do not show
- Supported: mask 4 changes AI behaviour and generally increases its attention to/occupation of outposts in these exploratory samples.
- Not established: a stronger win rate, better defence when challenged, or overall game balance.
- Limitations: low search budgets, small random-squad samples, ply caps producing many draws, and no meaningful sample of direct outpost contests in several batches.

## Crocodile-in-marsh rule check
A separate six-game exploratory comparison of the current special attack (a land piece with effective rank >= 6 can attack a crocodile in marsh) against a variant without that attack ended with 1 current-rule win, 2 variant wins and 3 draws (140-ply cap). The move was available in two sampled positions and used twice. This is far too small to infer balance.

## Recommended next steps
1. Run `node tests/outpost_compare.js 20 100 2026102807 140` on a local Node.js environment for a larger, higher-budget comparison. It can take several minutes.
2. Add a dedicated metric for actual consecutive turns held on an outpost, not just position-sample counts.
3. Design seed squads that deliberately contest the outpost and test who can occupy/defend it while swapping sides.
4. Run Playwright tests after building `dist/game_local.html` in a real Node.js/Chromium environment.
5. Keep the heuristic behind the experimental AI flag until higher-budget paired tests show a clear benefit. Do not merge into `main` based on the current samples.
