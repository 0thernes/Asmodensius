# Results: DIALS-v2 (seeds 1000-1015, n = 16 per arm)
Preregistration commit: 536012e. Welch two-sided t, pooled Cohen's d. Every ledger error is ≤ 8.8e-13.

| # | test | control → treated | p | d | result |
|---|---|---|---|---|---|
| sweep | sensory-lines dose sweep | asleep 0.578 / 0.550 / 0.527 / 0.512 / 0.476 / 0.155; ρ = −1 on 16/16 | ≈0 | | PASS |
| 0 | gentle knob 0.02 | asleep 0.578 → 0.512 (no insomnia) | 1.5e-28 | −15.4 | PASS |
| 1 | recycling + grazer litter, 3 d | local food 24.2 → 72.8 | 4.5e-16 | 9.5 | PASS |
| 2 | recycling, creature waste only, 3 d | 25.76 → 25.83 | 0.91 | 0.04 | **FAIL** (as predicted: waste is tiny) |
| 3 | chemistry pH 4 | stores 525 → 504 | 3.0e-8 | −2.6 | PASS |
| 4 | singularity 1.5 | distance to centre 8.82 → 6.06 | 1.0e-5 | −2.3 | PASS |
| 5 | grazers 100 (r=5 dome), 3 d | eaten 164 → 61 | 7.3e-11 | −3.7 | PASS |
| 6 | learned game: stag hunt vs PD | p(C) 0.65 → 0.97 | 3.7e-9 | 4.0 | PASS |
| 7 | learned PD p(C) vs 0.5 | 0.650 | 6.7e-5 | 1.36 | **NOT COUNTED**: the prereg text predicts +, but the frozen code has dir −1, so the code flag reads FAIL. This is a preregistration inconsistency, recorded as such. The data shows cooperation rising in a repeated 4-creature PD. |
| lens | motor lens v2 (rateAvg / regionRates parts) | best 0.659 vs shuffled; oracle 0.756; **0.66 of oracle** | 6.3e-7 | 2.8 | PASS |

Per part: rateAvg 0.625, regionRates 0.582, CTX 0.562, HYP (slow-mode state) 0.509.

Tally: 8 PASS (7 dial rows plus the dose sweep), plus the motor lens; 1 FAIL; 1 not counted.

## Viewer integration test (viewer/test_viewer.mjs, live server, seed 3000, 5 creatures): 6/6 PASS
- Setting gravity 1 → 5 through the API drops path per tick from 0.102 to 0.034.
- An unknown dial is rejected with a 400.
- Toxicity 0.004 drops integrity on all 5 creatures.
- World ledger error is 1.7e-14.
- Pause stops ticks (0 ticks in 1 s).
- Inspector endpoints return state and motor lens results (rateAvg 0.604, oracle 0.755).
- A headless Chrome render (CDP) shows the 3D dome, the food grid and the creatures, and the HUD streams live sim values (out/viewer.png, not committed).
