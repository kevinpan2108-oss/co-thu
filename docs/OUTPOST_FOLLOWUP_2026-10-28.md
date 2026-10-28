# ChatGPT follow-up: outpost-control investigation (2026-10-28)

## Scope
This branch is based on `main`. It does not contain Claude's unpushed `exp/croc-outpost` work or the scratchpad JSON outputs. No changes were made to `main` or the release artifact.

## Test hardening
`tests/rules_real.js` had four weak assertions:
- A marsh-entry test used `length >= 0`, which is always true.
- A bank-to-marsh capture test used `length === 0 || true`, which is always true.
- A Bison dash test used `... || true`, which is always true.
- A rat-on-bank capture test used `... || true`, which is always true.

On this branch, the assertions were changed to verify actual legal moves:
- Dog can enter the marsh from (6,6) to (5,6).
- The bank-to-marsh capture test checks that the generated move actually targets the marsh occupant.
- The Bison test checks an ordinary legal step beside the marsh instead of the vacuous dash assertion.
- Rat-on-bank capture checks that the generated move targets the elephant.

## Focused test result
The strengthened `tests/rules_real.js` ran against the current `src/engine.js` and reported `pass 144 fail 0` in the temporary test harness.

## Provisional AI simulations
These are low-budget, exploratory runs, not release-quality benchmarks.

### Outpost heuristic
Six games, AI with the outpost heuristic enabled versus baseline AI, both at a deliberately reduced 8 ms search budget and a 100-ply cap:
- Wins: 0
- Losses: 0
- Draws: 6 (all hit the ply cap)
- Average plies: 100
- Outpost-heuristic AI move counts: left 46, center 151, right 113; landed on an outpost 12 times; used bonus step 10 times.
- Baseline AI move counts: left 40, center 162, right 104; landed on an outpost 9 times; used bonus step 6 times.
- Side-adjacent outpost zone presence samples: heuristic AI 327, baseline AI 89. Occupied-outpost samples were similar (44 vs 47).

Interpretation: the heuristic appeared to increase proximity to outpost zones but did not clearly increase actual outpost occupation. The sample is too small and all games drew, so it does not establish a win-rate benefit.

### Crocodile marsh-attack rule
Six matched exploratory games, comparing current `main` (land pieces of effective rank >= 6 can attack a crocodile in marsh) against a variant with that special attack removed, with sides swapped:
- Current rule variant wins: 1
- No-special-attack variant wins: 2
- Draws: 3
- Average plies: 119.5 (140-ply cap)
- The special attack was available in 2 sampled positions and selected twice.

Interpretation: too few games and too low a search budget to draw a balance conclusion. This only confirms the current engine exposes and uses the special move in this small sample.

## Next recommended work
1. Run larger paired-seed simulations with both colors swapped and normal AI budgets.
2. Track actual outpost entry, turns held, cooldown, bonus-step conversion, lane use, den wins, captures, and draw rate.
3. Compare the existing heuristic against a candidate that values *occupying* an outpost and holding it safely, not merely standing adjacent to it.
4. Run browser tests (Playwright) against `dist/game_local.html` in a proper Node/browser environment.
5. Review and strengthen other tests, but keep each assertion tied to an intended rule and a known-good expected outcome.
