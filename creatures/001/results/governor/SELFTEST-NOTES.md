# Governor v0 self-test: what it showed (Mon 16 Nov 2026, PT)

Run: `governor.py selftest` at commit 3c70d93, bundle sha256 7ef46baa985c..., blocks 704-719 and 720-735 (first use;
logged in `ledger.jsonl` and `SEEDS.md` before the runs). Raw outputs: `20261116-1228_selftest/raw/`. Verdicts: `VERDICT.md`.

**Works as designed**
- Parent vs parent (Combo A run twice in separate processes) on both blocks: per-seed outputs identical on all 8 tests,
  delta-d exactly 0, ACCEPT. Runs are deterministic across processes.
- Sensitivity, known loss: Combo A -> v5.7b with target RPT2R is REJECTED (RPT2R delta-d -3.87 [-4.46, -3.20];
  RPT2RL5 -2.88; AE2 -5.54). The gate catches a real regression.
- Energy meter: about 91-94 kJ metabolic heat and 1.1-1.5 CPU-s per organism-day; energy-ledger error at most 7e-15.
  Combo A costs the same metabolic energy as v5.7b (-0.1%) but about 31% more CPU per organism-day.

**Problem: the v0 gate is too strict at n = 16 (finding F63, a dilemma for Alex)**
- v5.7b -> Combo A with target RPT2R (the change that the official round confirmed: +3.37 d on RPT2R) was also REJECTED.
  RPT2R gained +3.87 [+3.20, +4.46], but AE1 (+0.17 [-0.57, +0.88]) and RPT1 (-0.00 [-0.53, +0.54]) fail the
  non-inferiority margin: their 95% CI is about +/-0.55 to 0.75 wide even when the true change is near zero.
- Any change to the creature changes each seed's whole life (the dynamics are chaotic), so paired seeds do not shrink
  the noise much. To get a lower bound above -0.3 when the true delta-d is 0, the CI half-width must be under 0.3,
  which needs roughly n = 50 (RPT1) to n = 95 (AE1) seeds per decision. The reservoir 704-999 holds 18 blocks of 16.
- The gate was not changed after seeing these numbers. Options for Alex (choosing one is a rule change):
  (a) keep margin -0.3 and use 6 blocks (n = 96) per decision: about 2 more decisions from the reservoir;
  (b) 3 blocks (n = 48) per decision with margin -0.5: about 5 decisions;
  (c) n = 16 screening verdicts are advisory only; a binding verdict needs (a) or (b) and is used only for finalists;
  (d) extend the reservoir (it must stay below 1000, so only by re-allocating unused dev ranges such as 596-599 or 632-639).
- Also seen: RPT1 on block 720 graded fail for Combo A (0.89/2.52) and A for v5.7b, while both are A officially (n = 48).
  At n = 16 grades near d = 1 flip between blocks, which is the known winner's-curse risk.
