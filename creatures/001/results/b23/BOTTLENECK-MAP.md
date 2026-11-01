# B23 bottleneck map (dev seeds 3445-3460, v5.6, diagnostics only)

## AINF: where reward is limited (AINF protocol, depleting, 2 days, 16 seeds)
| Probe | Reward | Forages | Hits per forage |
|---|---|---|---|
| creature (none) | 46.8 ±12.4 | 211 | 0.222 |
| epistemic lesion (the AINF control) | 45.9 | 213 | 0.216 |
| random site choice | 45.3 | 218 | 0.208 |
| oracle site choice (true p) | 50.1 ±15.2 | 167 | 0.300 |
| forage every awake tick | 128.3 | 978 | 0.131 |
| no satiety gating (fixed drive) | 34.7 | 141 | 0.246 |

Findings:
- Reward is set by how many forages hunger permits, not by which site is chosen.
- Even a perfect oracle for site choice adds only +3.3 reward (d of about 0.24 at SD 12). The creature eats to need, so better sites mean fewer forages.
- The epistemic lesion costs 0.9 reward. AINF as defined (raw reward) cannot reach d 0.8 through site choice, whatever the exploration mechanism.
- Hits per forage is where site choice shows: 0.222 vs a 0.300 oracle ceiling.

Recommendation: do not build more for AINF against raw reward. A disclosed variant scored on hits per forage, the original AINF still reported, is the measure that can see exploration. Not run here, because no new test was requested.

## RPT2R: where a^b is lost (ridge decode, 160 train / 60 test, 16 seeds)
| Stage | a | b | a^b |
|---|---|---|---|
| senses | 1.00 | 1.00 | 0.51 |
| thalamus | 0.99 | 1.00 | 0.56 |
| cortex module 0 (the a side) | 0.97 | **0.88** | 0.58 |
| cortex module 1 (the b side) | **0.85** | 0.98 | 0.56 |
| ctx31 readout (m0+m1) | 0.97 | 0.98 | 0.57 |
| m0+m1, 3-tick mean | 1.00 | 1.00 | 0.60 |
| all cortex (64) | 0.98 | 0.98 | 0.56 |
| L5 pool (random dendrites) | 0.92 | 0.93 | 0.54 |
| whole brain | 1.00 | 1.00 | 0.55 |
| oracle: ctx31 + a*b feature | 0.98 | 0.99 | **0.93** |

Findings:
- Nothing is lost upstream. Both cues are linearly present everywhere, and cross-module mixing already carries b into module 0 and a into module 1.
- The decoder works: with an a*b feature it scores 0.93.
- No stage anywhere in the brain computes the product. The cortex is linear-additive in the cue variables.
- The L5 pool has the information, but its random or principal-component dendrites are not aligned to the cue directions, so its products mix in noise.

Justified next step: dendritic weights that select the cue-carrying cells. Covariance learning gated by surprise at stimulus onset (phasic LC-NE) picks out the directions that vary with the cues, not with ongoing drift.
