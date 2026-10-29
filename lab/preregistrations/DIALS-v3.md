# DIALS-v3 preregistration (frozen before test seeds 1000-1015)

Driver: `smoke7.ts` (dials 0-4) and `smoke8.ts test` (v0.6 instruments). Tuning used only dev seeds 2000-2005.
PASS = Welch two-sided p<0.05, sign of the difference equals the stated direction, |d| >= 0.5. vsConst rows: one-sample against the constant.

| # | dial | metric | direction | dev result (2000-2005) |
|---|------|--------|-----------|------------------------|
| 0 | one-shot PD: random anonymous partners dome-wide (8 creatures, r=4, 3 days), learned strategy with phasic reward (DA 1 tick after the payoff burst, read after the creature steps), lr 300 | mean p(C) vs 0.5 | **- (defection wins)** | 0.475, p 0.80 (fails on dev) |
| 1 | learned repeated PD retest, original v2 settings (15-tick DA window, lr 30, 4 creatures, r=3, 3 days); v2 #7 was mis-flagged (-1 in code, + in text) and NOT COUNTED | mean p(C) vs 0.5 | **+** (flag now matches text) | 0.674, p 0.048 |
| 2 | time anomaly: 3x time dilation zone (timeWarpR 5 covers the r=4 dome) | eaten per world day | + | 58 -> 169 |
| 3 | time anomaly: frozen-time zone (timeWarp 0, r=2) at centre of r=4 dome | asleep fraction (frozen creatures keep their state) | - (set from dev) | 0.58 -> 0.26, p 0.043 |
| 4 | creature-waste-only recycling 0.05, 10 days (v2 3-day version failed) | cell-local food | + | 26.75 -> 26.84, p 0.87 (fails on dev) |

Dev diagnosis behind #0 (recorded, not a test): the creature's mean DA over the 15 ticks after a VTA payoff burst is NOT monotonic in payoff
(seed 2000: pay 0 -> -0.005, 0.6 -> -0.082, 2.2 -> -0.044, 3.3 -> -0.017), so the 15-tick learner is rewarded for C. A 1-tick window is monotonic
(-0.028, -0.024, -0.009, +0.007). With that phasic reward the learner still did not move off 0.5 on dev at lr 30/100/300; #0 is run anyway at the
theory direction and will stay recorded as a failure if it fails.

Instruments (smoke8 test seeds 1000-1003), each with a control:
- QGT: lab tensor trace matches organism `qgt()` (rel err < 1e-3); metric PSD; product-state control matches analytic trace and has zero Berry curvature; Wilson-loop Berry phase matches curvature x area (10%).
- 3D field: Moran's I of time-averaged rates on region-anatomical positions > max of 10 shuffled-position controls.
- Scorecard: 4 indicator rows (PCI, GWT ignition/PLV vs lag null, RPT feedback lesion, INS interoception decoder vs shuffled). Reported, not a consciousness claim.
