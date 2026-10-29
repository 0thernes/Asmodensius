# DIALS-v3 results (test seeds 1000-1015, run after commit 13b5536)

| # | dial | control | treated | p | d | result |
|---|------|---------|---------|---|---|--------|
| 0 | one-shot PD, random anonymous partners, phasic DA reward (dir -) | 0.5 | 0.367 | 0.038 | -0.57 | PASS (dev seeds had not moved: 0.475, p 0.80) |
| 1 | learned repeated PD retest, flag + | 0.5 | 0.629 | 0.002 | 0.94 | PASS (replaces the NOT COUNTED v2 #7) |
| 2 | 3x time dilation -> eaten/world day | 56.0 | 155.1 | 1e-13 | 5.9 | PASS |
| 3 | frozen-time zone -> asleep fraction (dir -) | 0.578 | 0.335 | 0.0012 | -1.41 | PASS |
| 4 | creature-waste-only recycling, 10 days -> local food | 26.03 | 25.78 | 0.70 | -0.14 | **FAIL** (second failure; creature waste alone is too small to move cell food) |

All ledgers <= 5e-14. Caveat on #0 vs #1: they differ in reward window, lr and partner rule at once. So the result does not isolate
partner anonymity; it shows that a payoff-monotonic (phasic) DA reward plus anonymous partners gives defection, while the 15-tick
window (non-monotonic in payoff, see the prereg diagnosis) gives cooperation.

Instruments (smoke8 test, seeds 1000-1003): QGT matches the organism's qgt() trace, is PSD, the product-state control matches its analytic trace with zero
Berry curvature, and the Wilson-loop Berry phase matches curvature x area: 4/4 PASS. 3D field Moran's I 0.16-0.20 vs shuffled max <= 0.014: PASS.
Scorecard (indicators only): PCI row 4/4 pass (but PCI sits below the shuffled bound, so the response is near-random); GWT 3/4; RPT feedback lesion 0/4;
interoceptive decoder 0/4 (equal to the shuffled control).
