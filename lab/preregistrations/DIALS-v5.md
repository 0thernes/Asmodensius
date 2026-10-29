# DIALS-v5 preregistration (round 7, lab v0.8). Written and committed BEFORE any test seed was run.
Instrument: `smoke10.ts`, test seeds 1000-1015 (n=16 per arm), 2 simulated days, one creature 001 (organism v3.6) per dome, radius 4.
All light arms set `lightToCreatures: true` (dome light reaches the organism via `setLight`); the 12:12 control is the original sine (dayLength 12 reproduces it exactly).
Directions come from dev seeds 2000-2005 (out/dials8_dev_*.json). PASS = Welch p<0.05, sign as predicted, |d|>=0.5. NULL predictions PASS = p>=0.05 and |d|<0.5.

| # | Dial | Metric | Prediction | Dev result (seeds 2000-2005) |
|---|------|--------|------------|-------------|
| 0 | Constant dark (DD) vs 12:12 | mean asleep | NULL | 0.571 vs 0.571, d 0.08 |
| 1 | Constant light (LL) vs 12:12 | mean asleep | lower | 0.541 vs 0.571, d −2.8 |
| 2 | 6 h day vs 12 h | mean asleep | higher | d +0.48, p 0.42 (weak, may fail) |
| 3 | 18 h day vs 12 h | mean asleep | lower | d −1.2, p 0.058 |
| 4 | Dim light 0.3 vs 1 | mean melatonin | higher | 0.485 vs 0.467 |
| 5 | Coupling check: DD coupled vs uncoupled | mean melatonin | higher | 0.493 vs 0.410 |
| 6 | Moonlab dice vs classical dice, kicks 0.05 | kick count | NULL | d −0.60, p 0.33 (dev already fails the null criterion) |
| dice | Moonlab dice checks | chi² 15 df < 30.58, bit-reproducible, Born P(1)=0.25 at θ=π/3, uniform 1/8 at θ=π/2 | PASS | chi² 19.6, all true |

Moonlab dice label: **simulated quantum, not hardware QRNG.** Moonlab WASM computes a 3-qubit statevector; outcomes are drawn from its Born probabilities by a seeded classical stream.
Melatonin is deterministic given the light input, so dials 4 and 5 have near-zero variance and d is huge. That is a manipulation check, not evidence of behaviour.
Also on test seeds: `exact8.ts test` (dome snapshot restore is bit-exact, @snapshot transplant moves effect 1, self-control is 0). All results are recorded, failures included.
