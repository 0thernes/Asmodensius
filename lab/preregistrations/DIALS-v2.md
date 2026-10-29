# Preregistration DIALS-v2 (Round 4), frozen before any run on seeds 1000-1015

This file is committed before any test-seed run. All tuning used dev seeds 2000-2005; dev values are quoted below. Code: `smoke6.ts` at this commit. Statistics are the same as DIALS-v1: Welch two-sided t and pooled Cohen's d, n = 16 per arm. A PASS needs p < 0.05, the predicted direction, and |d| ≥ 0.5. Every ledger error must stay below 1e-12. Failures stay recorded.

| # | test | treated vs control | metric | predicted | dev (n=6) |
|---|---|---|---|---|---|
| sweep | sensory-lines dose sweep, doses 0 / 0.005 / 0.01 / 0.02 / 0.03 / 0.05 | — | per-seed Spearman(dose, asleep) | mean ρ ≤ −0.8 and Welch ρ vs 0 p < 0.05 | ρ = −1 on 6/6 |
| 0 | gentle knob: sensoryLinesR 0.02 | vs off | asleep fraction | − AND treated mean ≥ 0.30 (no insomnia) | 0.580 → 0.514 |
| 1 | recycling 0.05 with grazer litter, 3 days | vs grazers without recycling | food in the creature's own cell (time mean) | + | 24.0 → 73.0 |
| 2 | recycling 0.05, creature waste only, 3 days | vs off | local food | + (expected FAIL: about 0.5 kJ/day of waste) | p 0.98 |
| 3 | chemistry pH 4 (digestive loss to detritus) | vs pH 7 | stores | − | p 0.009 |
| 4 | anomaly: singularity 1.5 (attractor + dice teleport) | vs off | mean distance to dome centre | − | p 0.057, d −1.4 |
| 5 | ecology: 100 grazers (0.1 kJ/tick each), r=5 dome, 3 days | vs no grazers | creature eaten | − | 179 → 70 |
| 6 | learned game (REINFORCE on the creature's own DA response): stag hunt vs PD, 4 creatures, 3 days | stag vs PD | mean final p(cooperate) | + | 0.69 → 0.96 |
| 7 | learned PD: p(cooperate) vs 0.5 starting value | vs constant 0.5 | p(cooperate) | **+** (direction taken from dev; one-shot theory predicts −) | 0.686 |
| lens | motor lens v2: parts CTX, HYP, regionRates, rateAvg (slow per-neuron rates of HYP, CTX, STR, MOT, INS) | best vs shuffled | balanced accuracy | p < 0.05, d ≥ 0.5, fraction of oracle ≥ 0.5 | 0.92 of oracle |

Caveat stated in advance: dials 1, 4, 5 and 6 were strength-tuned on dev seeds after the first dev run (singularity 0.05 → 1.5, grazers 60 → 100 at 0.1 kJ each, dose 0.1 → 0.02, learning rate 4 → 30 with a 15-tick DA window).
