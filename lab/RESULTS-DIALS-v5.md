# DIALS-v5 results (round 7, lab v0.8): test seeds 1000-1015, n=16, preregistered in 5f6e6ab
| # | Dial | Prediction | Control → treated | p | d | Result |
|---|---|---|---|---|---|---|
| 0 | DD vs 12:12 → asleep | NULL | 0.5668 → 0.5667 | 0.96 | −0.02 | PASS (null) |
| 1 | LL vs 12:12 → asleep | lower | 0.5668 → 0.5421 | 2.5e-7 | −2.55 | PASS |
| 2 | 6 h day vs 12 h → asleep | higher | 0.5668 → 0.5699 | 0.30 | +0.37 | **FAIL** (right sign, too small) |
| 3 | 18 h day vs 12 h → asleep | lower | 0.5668 → 0.5599 | 0.0025 | −1.17 | PASS |
| 4 | dim 0.3 vs 1 → melatonin | higher | 0.4665 → 0.4854 | ~0 | huge | PASS (manipulation check, deterministic) |
| 5 | DD coupled vs uncoupled → melatonin | higher | 0.4103 → 0.4934 | ~0 | huge | PASS (shows setLight reaches the organism) |
| 6 | Moonlab dice vs classical, kicks 0.05 → kick count | NULL | 147.4 → 147.5 | 0.97 | 0.01 | PASS (null) |
| dice | Moonlab dice checks | PASS | chi² 19.6 (15 df, critical 30.58), bit-reproducible, Born P(1)=0.25 at θ=π/3, uniform at θ=π/2 | | | PASS |

Score: 7/8 pass. Dial 2 failed and stays recorded. Interpretation: with dome light driving the organism, constant dark does not change sleep fraction (sleep is gated by the internal clock state), while extra light (LL, an 18 h day) suppresses sleep. A short day does not add measurable sleep within 2 days.
Moonlab dice are **simulated quantum, not hardware QRNG**. A 3-qubit Moonlab WASM statevector gives the Born probabilities, and a seeded classical stream draws the outcomes. As predicted, it is behaviourally indistinguishable from classical dice.

## Exact restore and full-state transplant (exact8.ts, test seeds)
- Dome snapshotFull/fromSnapshot restore is bit-exact (true).
- `@snapshot` transplant (organism v3.6 snapshot) gives effect 1 for both same-seed and cross-seed; self-control is 0.
- The old "*" all-lab-parts transplant gives effects −0.18 to +0.12 (mean ≈0). The remaining identity lives in hidden organism state outside the lab parts, and only the full snapshot carries it.
- The viewer now persists v:2 exact snapshots. test_persist checks 8/8, including exactMode. The live :8787 server was migrated (v1 → v2) and now restores as "exact".
- Item 3 (creatures 002-005) was stopped per instruction. No new species files exist; out/scaffold/002 is the round-6 template output.
