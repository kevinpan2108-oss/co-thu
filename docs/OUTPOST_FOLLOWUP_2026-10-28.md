# ChatGPT follow-up: outpost-control investigation (2026-10-28)

## Scope and safety
This branch is based on `main` and is separate from the release branch. Claude's `exp/croc-outpost` work and private scratchpad JSON were not present on GitHub, so this is a reproducible follow-up from the public `main` source, not a restoration of the missing scratchpad.
No changes were made to `main` or `dist/game.html`.

## Changes on this branch
- Strengthened four vacuous assertions in `tests/rules_real.js`; each now checks a real move condition. In particular, the Bison test now checks its intended allowed dash into marsh when the midpoint is clear.
- Added `tests/outpost_ai.js` to ensure the AI's outpost heuristic rewards safe occupation, penalizes the opponent holding an outpost, gives a smaller reward for approaching an empty outpost, and discounts a threatened holder.
- Updated the experimental AI evaluation in `src/engine.js` for AI mask bit 4:
  - reward an occupied outpost (+28, plus 8 for effective rank >= 5);
  - reduce that holding reward by 20 when the piece is threatened;
  - retain a smaller approach reward (+8) for a friendly piece adjacent to an empty outpost;
  - retain the existing bridge-control term.
- Added `tests/outpost_compare.js`, a paired-seed simulator that swaps the AI sides and reports lane usage, outpost entries, bonus steps, outpost occupancy/adjacency samples, wins, draws and end reasons.
- Updated this report with findings.

## Logic test results
The following scripts were run from the GitHub source in an in-memory JavaScript harness. This validates engine/test behavior, but is not the same as running all tests on a real local Node.js plus Chromium installation.

- `tests/rules_real.js`: 144 pass, 0 fail (rerun after the final assertion correction).
- `tests/t16.js`: 20 pass, 0 fail.
- `tests/terrain.js`: 104 pass, 0 fail.
- `tests/ai.js`: 6 pass, 0 fail.
- `tests/outpost_ai.js`: 6 pass, 0 fail.

Total: 280 reported assertions passed across these five test scripts. Browser/Playwright suites have not been run in this environment.

## Paired-seed outpost heuristic simulation
A 12-game exploratory comparison was run using the same rules and squad seed in both conditions, with the sides swapped for each pair. Both AI variants used a reduced 10 ms search budget; each game had a 120-ply cap.

Results:
- Improved heuristic: 3 wins.
- Baseline heuristic: 3 wins.
- Draws: 6 (six games reached the cap; six games ended by den entry).
- Average game length: 102.1 plies.
- Moves to the left / center / right lanes: improved 83 / 342 / 188; baseline 48 / 377 / 187.
- Outpost entries: improved 30; baseline 7.
- Bonus steps: improved 26; baseline 7.
- Board-state samples with an outpost occupied by that strategy: improved 764; baseline 115.
- Samples with that strategy adjacent to an outpost: improved 91; baseline 24.
- No position in this small sample had both sides adjacent to the same outpost at once.

Interpretation: the new evaluator clearly increases engagement with outposts in this small run and shifts more moves toward the left lane where the outposts are located. It did not improve the measured win count in this 12-game sample. These results are directional only: low search budget, limited seeds, a ply cap and no contested-outpost positions mean they do not establish a real balance or win-rate advantage.

A smoke test of `tests/outpost_compare.js` (one seed pair, 8 ms, 35-ply cap) completed and emitted valid JSON.

## Crocodile-in-marsh rule check
A separate six-game exploratory comparison of the current special attack (land piece with effective rank >= 6 can attack a crocodile in marsh) against a variant without that attack ended with 1 current-rule win, 2 variant wins and 3 draws (140-ply cap). The move was available in two sampled positions and used twice. This is far too small to infer balance.

## Recommended next steps
1. Run `node tests/outpost_compare.js 20 100 2026102807 140` on a local Node.js environment for a larger, higher-budget comparison. It may take several minutes because it runs paired full games.
2. Run the Playwright suites after building `dist/game_local.html` in a real Node/browser environment.
3. Review whether bonus-step use, actual hold duration and successful defence of outposts correlate with wins; the current quick sample shows more outpost use, not a proven strength advantage.
4. Keep the heuristic behind the experimental AI flag until higher-budget paired-seed results show it is useful.
5. Only merge by pull request after reviewing the diff and full test suite.
