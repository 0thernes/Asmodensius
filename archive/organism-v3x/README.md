# Archived organism runners (v3.1-v3.8) and score_v39.sh

Moved here on branch v4.1 (Phase 0.5, audit findings F39/F42). Nothing in the live code imports these files:
the live runners are `creatures/001/organism/run_v39.ts` (frozen line) and `run_v41.ts` (v4.1).

- `run_v31.ts` ... `run_v38.ts`, `summarize_v3x.ts`, `viability_v38.ts`, `viab_eval_v38.py`: superseded runners and summarisers.
  Their relative imports (`./organism`, `./tests_v3x`) only resolve inside `creatures/001/organism/`.
- `score_v39.sh`: hard-codes `/tmp/w` and `/workspace/Asmodensius` and waits for a flag file that no longer exists (F39).

To rerun a historical round exactly, check out that round's commit (the runner, tests and organism move together).
