# DIALS smoke suites rerun on organism v3.8a (test seeds, Oct 29 14:2x London). Report only; the frozen results are NOT re-scored.
The same code and seeds were used, with the new organism default (v3.8a).
"Verdict now" applies the frozen criterion to the new numbers, for information.

**Verdicts that would change**
| Battery | Dial | frozen | v3.8a now |
|---|---|---|---|
| DIALS-v3 #0 | one-shot PD → coop prob (pred −) | 0.367, p 0.038, d −0.57 PASS | 0.375, p 0.063, d −0.50 → would FAIL (just misses) |
| DIALS-v5 #3 | 18 h day → asleep (pred −) | 0.567→0.560, p 0.0025, d −1.17 PASS | 0.580→0.578, p 0.69, d −0.14 → would FAIL |

**Shifted in size, same verdict**
- v5 #1 LL: d −2.55 → −1.64.
- v5 #0 DD: d −0.02 → −0.31, still within the null criterion.
- v5 #2 short day: still FAIL, d ≈ 0.
- v1 #0 barren: control eaten 55.3 → 57.8.
- v1 #7 utopia → path: p 0.028 → 0.048, still PASS.
- v1 #16 40 °C stores: 525 → 527 control.
- v2 #3 pH 4 stores: 525 → 512.
- v4: window15 0.367→0.375 vs 0.562→0.616 (p 0.003, d 1.15); contact null (p 0.47); lr30 null (p 0.60).

**Unchanged:**
- All other v1 verdicts, including the recorded failures (#4 original hyper-stim wrong direction, #8 NE null, #21 waste recycling).
- All of v2, including #2 FAIL and the #7 inconsistency.
- v3 #1-#4, including #4 FAIL.
- v5 #4, #5 and #6 (melatonin and kick counts are bit-identical, because they do not depend on metabolism) and the Moonlab dice checks.

Interpretation: v3.8a's well-fed baseline sleeps slightly more (0.580 vs 0.567) and its sleep is less sensitive to added light. The one-shot PD effect was marginal before and is marginal now.
Raw outputs: out/out/dials{4..8}_test_*.json.
