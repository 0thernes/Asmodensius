# Preregistration DIALS-v1 (Round 3), frozen before any run on seeds 1000-1015

Written and committed **before** any seed in 1000-1015 was run. All tuning was done on dev seeds 2000-2005 (the logs are in out/dev_*.log and are not committed). Code: `smoke4.ts` (dials), `smoke5.ts` (motor lens R + QRNG), at the commit that adds this file.

## Design
- Seeds: 1000..1015 (n = 16 per arm). Control = same creature seed and same dome seed with the dial off. 1 day = 1440 ticks.
- Test: two-sided **Welch t** (unequal variances) treated vs control, plus **pooled Cohen's d**.
- **PASS (directional dial)** requires all three: p < 0.05, sign(diff) equals the predicted direction, and |d| >= 0.5.
- **PASS (dice dial, no predicted direction)**: Welch on |treated - control| vs |sham - control|, where sham is a deterministic re-run of the control. Requires p < 0.05, d >= 0.5, and the max sham delta exactly 0.
- No multiplicity correction is used for the pass flag. Holm-adjusted p values over the family are reported alongside it.
- Every dial result is reported. A failure stays a failure. A dial cannot be changed after this point without a new preregistration (DIALS-v2).

## Dials and predictions (index = smoke4.ts DIALS index)
| # | dial | metric | predicted |
|---|---|---|---|
| 0 | barren food | eaten (end) | − |
| 1 | toxicity 0.003 | integrity (end) | − |
| 2 | gravity ×3 | path | − |
| 3 | electrical VTA 1.0 | mean DA | + |
| 4 | sensory hyper-stim 2.0 (original v0.3 hypothesis) | mean asleep | − (expected to FAIL; dev shows +) |
| 5 | quantum kicks p=0.2 | ctxRate | dice |
| 6 | preset hell | integrity | − |
| 7 | preset utopia | path | + |
| 8 | NE +0.01/tick → asleep (original) | asleep | − (expected to FAIL: NE is not in the sleep drive) |
| 9 | rewire 30 % | ctxRate | dice |
| 10 | random mechanism lesion | foraged | dice |
| 11 | mutation σ 0.7 | foraged | dice |
| 12 | **R** sensoryLinesR 1.0 (drives o.sens, the orexin path) | asleep | − |
| 13 | **R** hyper-stim 2.0, reversed hypothesis (adenosine) | asleep | + |
| 14 | **R** NE +0.01/tick → NE level (manipulation check) | mean NE | + |
| 15 | **R** NE +0.01/tick → workspace ignitions | ignitions | + |
| 16 | weather: temperature 40 °C | stores | − |
| 17 | weather: wind 0.05 | path | + |
| 18 | gas: hypoxia O2 0.10 (proxy) | stores | − |
| 19 | gas: hypercapnia CO2 0.08 (proxy, LC drive) | asleep | − |
| 20 | radiation 0.001 | integrity | − |
| 21 | waste recycling 0.05 | dome patch food | + (dev: null, expected FAIL at 1 day) |
| 22 | parasites 0.03 kJ/tick | mean blood glc | − (tuned from 0.003 on dev) |
| 23 | prisoner's dilemma, 4 creatures, r=3 | population eaten | + |
| L | utopia→hell ladder, 7 rungs | per-seed Spearman(rung, integrity) | mean ρ ≤ −0.8, and Welch ρ vs 0 gives p < 0.05 |

Ledger requirement: the world and creature ledger errors stay below 1e-12 in every treated run.

## Motor lens R (smoke5.ts)
For each seed: 300 warm-up ticks, then 900 samples with lead 5 over parts CTX, HYP, STR, MOT, HIP. The test compares the best part with the best shuffled-label part.
- **PASS** requires Welch p < 0.05, d ≥ 0.5, and a mean fraction of the oracle ceiling, (best − 0.5)/(oracle − 0.5), of at least 0.5.
- The oracle is the true per-tick forage hazard clamp(3·(HYP − 0.4·vagal) − 0.1).
- Dev gave 0.35, so this is expected to FAIL. The oracle tells us how much of the ceiling the state actually carries.

## QRNG (smoke5.ts, seeds 1000-1003, 20000 samples × 3 bits)
- H1: the observed per-bit ones-frequency matches the Born-rule expectation from the prepared state (|obs − born| < 0.01 per bit). If it holds, the bias is physics, not a bug.
- H2: the raw stream fails NIST (monobit, block frequency, runs).
- H3: **von Neumann → Toeplitz (64→32)** passes all three tests (p ≥ 0.01) on 4/4 seeds. Plain VN, VN on the LSB and Toeplitz (H·0.5 and H·0.25) are reported as secondary results.
- Caveat stated in advance: the measurement's uniform draw comes from the seeded mulberry PRNG, so passing NIST does not certify any quantum randomness.
