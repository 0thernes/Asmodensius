# Results: DIALS-v1 (seeds 1000-1015, n = 16 per arm)
Preregistration commit: fd7b5af. Welch two-sided t, pooled d. "Holm" is the Holm-adjusted p over the 24 dials (reported only; it is not used for the pass flag).

| # | dial | ctl | trt | p | d | Holm | result |
|---|---|---|---|---|---|---|---|
| 0 | barren food → eaten | 55.28 | 0.00 | 1.9e-13 | −8.57 | 3e-12 | PASS |
| 1 | toxicity → integrity | 1.000 | 0.0009 | 5e-68 | huge | 1e-66 | PASS |
| 2 | gravity ×3 → path | 27.75 | 16.00 | 0.001 | −1.32 | 6e-3 | PASS |
| 3 | VTA electrical → DA | 0.198 | 0.305 | 1.5e-13 | 4.53 | 3e-12 | PASS |
| 4 | hyper-stim → asleep (orig, pred −) | 0.578 | 0.599 | 1.9e-4 | +1.68 | 2e-3 | **FAIL** (significant, wrong direction) |
| 5 | quantum kicks (dice) | | | 1.2e-10 | 5.49 | 2e-9 | PASS |
| 6 | hell → integrity | 1.000 | 0.001 | 5e-97 | huge | 1e-95 | PASS |
| 7 | utopia → path | 27.75 | 38.64 | 0.028 | 0.82 | 0.11 | PASS (not after Holm) |
| 8 | NE → asleep (orig) | 0.578 | 0.577 | 0.68 | −0.15 | 1 | **FAIL** (null) |
| 9 | rewire 30 % (dice) | | | 4.9e-7 | 2.96 | 6e-6 | PASS |
| 10 | mechanism lesion (dice) | | | 0.0024 | 1.29 | 0.012 | PASS |
| 11 | mutation 0.7 (dice) | | | 1.4e-4 | 1.79 | 1e-3 | PASS |
| 12 | R sensoryLinesR → asleep | 0.578 | 0.000 | 2e-33 | −185 | 5e-32 | PASS (caveat: total insomnia, see below) |
| 13 | R hyper-stim reversed (pred +) | 0.578 | 0.599 | 1.9e-4 | 1.68 | 2e-3 | PASS (direction set from dev seeds 2000-2005) |
| 14 | R NE → NE level | 0.122 | 0.251 | 9e-28 | 15.7 | 2e-26 | PASS |
| 15 | R NE → ignitions | 649.3 | 668.2 | 1.0e-4 | 1.58 | 1e-3 | PASS (dev, n=6: p 0.42) |
| 16 | 40 °C → stores | 525.0 | 489.1 | 6e-14 | −4.65 | 1e-12 | PASS |
| 17 | wind 0.05 → path | 27.75 | 43.06 | 3.7e-4 | 1.42 | 3e-3 | PASS |
| 18 | hypoxia (proxy) → stores | 525.0 | 506.1 | 1.3e-7 | −2.43 | 2e-6 | PASS |
| 19 | hypercapnia (proxy) → asleep | 0.578 | 0.002 | 2e-33 | −185 | 5e-32 | PASS (caveat: forced wake, LC stim > 3) |
| 20 | radiation → integrity | 1.000 | 0.981 | 6e-24 | −43.5 | 1e-22 | PASS |
| 21 | waste recycling → patch food | 12877.26 | 12877.51 | 0.96 | 0.02 | 1 | **FAIL** (≈0.51 kJ/day recycled against ~12,900 kJ of patch food) |
| 22 | parasites 0.03 → glc | 3.342 | 2.630 | 5e-13 | −4.74 | 8e-12 | PASS |
| 23 | PD game, 4 creatures → population eaten | 210.2 | 226.7 | 0.032 | 0.80 | 0.11 | PASS (not after Holm) |
| L | utopia→hell ladder | ρ = −0.99 on all 16 seeds (eaten ρ −0.98) | | p≈0 | | | PASS |

Totals: 21/24 dials pass, plus the ladder. All ledger errors are ≤ 1.5e-14.
Prisoner's dilemma: 12-34 games per creature-day; the cooperation rate is 3-33 % (the strategy is DA > 0.25).

## Motor lens R: FAIL (as predicted)
- Best part 0.573 vs shuffled 0.518: p 7.7e-6, d 2.16.
- The oracle ceiling is 0.756, so the lens reaches only **0.29 of the oracle** (bar 0.5).
- Per part: CTX 0.562, HIP 0.548, MOT 0.530, STR 0.514, HYP 0.509.
- Even the oracle reaches only 0.76, because foraging is a per-tick coin flip on the hazard.
- HYP carries the hazard as a 16-neuron *rate*, but the decoder reads the slow-mode state, which picks it up poorly. A next step is to add a regionRate readout as a part.

## QRNG: all preregistered hypotheses hold (seeds 1000-1003)
- **H1 holds.** |observed − Born| per bit is ≤ 0.0052 on every seed. The bias comes from the prepared state, not from sampling.
- **H2 holds.** The raw stream fails all three NIST tests.
- **H3 holds on 4/4 seeds.** VN→Toeplitz passes, with a yield of 3.1-3.4 %.
- Secondary extractors:
  - Plain VN fails the runs test on 4/4 seeds (the bits within a sample are entangled).
  - VN on the LSB passes 4/4.
  - Toeplitz at H·0.5 and at H·0.25 each pass 4/4 test seeds (on dev seed 2000, H·0.5 failed).
- The decision-noise sign mean is −0.73 to −0.77. See INVESTIGATION-R3.md.
