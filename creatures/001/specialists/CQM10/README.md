# Specialist: CQM10 (goal regulation, viable fraction)
Test (organism/tests_v31.ts C10): fraction of ticks on days 2-4 with 2 < glucose < 4.5, ATP > 1.5, adenosine < 0.9; arm full vs fixed forage probability 0.12. Grade A needs full > fixed (d>=0.8, t>=2.75).
Diagnosis (diag.ts, Combo A, seeds 500-507): full fails only by hyperglycaemia (5.8% of ticks vs 2.6%); full forages 68/day vs 54 and ends with fat 292 vs 271. So the fix must be meal termination / satiety, not more drive.
Substrate: Combo A (ORG_V6=1 v6P0 v6Ak0 scAIm0.5 scBM1). Code: Organism.c10G/c10Tick in organism/organism.ts, flag M50.c10=<variant>, gain c10K (default 0 = off, bit-identical: comboA C10 rerun -0.57/-1.6 identical). Each vNN/ folder = spec + runner.

C10 screen, block 500, 16 seeds (weakest control d/t), plus diag (8 seeds) forages/day and end fat (full arm; fixed = 54/day, fat 271):
| v | approach (source) | C10 | forages/day | fat | verdict |
|---|---|---|---|---|---|
| base | Combo A | fail -0.57/-1.6 | 67.9 | 292 | over-eats |
| v01 | hypothalamic glucose-sensing satiety (Parton 2007) | PASS 1.40/3.9 | 56.8 | 269 | winner |
| v02 | gastric stretch / CCK satiation (Schwartz & Moran 1996) | PASS 1.32/3.7 | 60.7 | 270 | winner |
| v03 | interoceptive forward prediction of glucose (Seth 2013) | PASS 1.50/4.2 | 31.2 | 233 | reject: under-eats |
| v04 | post-ingestive GLP-1 refractory (Turton 1996) | PASS 1.50/4.2 | 49.0 | 258 | winner (mild under-eating) |
| v05 | set-point PI controller on glucose (Cannon 1932) | PASS 1.50/4.2 | 39.3 | 239 | reject: under-eats |
| v06 | learned allostatic meal anticipation (Sterling 2012) | PASS 1.35/3.8 | 65.3 | 273 | winner |
| v07 | cephalic-phase insulin (Teff 2000) | fail -0.75/-2.1 | 93.5 | 324 | fail (raises intake) |
| v08 | hepatic glucokinase uptake (Agius 2008) | fail -0.58/-1.6 | 71.4 | 297 | fail (helps both arms) |
| v09 | hepatic insulin sensitivity (Cherrington 1999) | fail -0.57/-1.6 | - | - | fail (helps both arms) |
| v10 | central insulin satiety on whole drive (Woods 1979) | PASS 1.46/4.1 | 46.8 | 243 | reject: under-eats |
| h11 | v01+v03 | PASS 1.50/4.2 | 31.2 | 233 | reject |
| h12 | v03+v04 | PASS 1.50/4.2 | 30.3 | 231 | reject |
| h13 | v01 x v02 | PASS 1.50/4.2 | 54.0 | 259 | RPT1 fail 0.26/0.7 -> reject |
| v01 K0.5 | v01, gate starts at 3.6 mM | PASS 1.27/3.6 | 65.8 | 275 | best candidate |

Is the PASS real? The full arm reaches viable fraction 1.0 on every seed by removing post-meal hyperglycaemia. Variants that only pass by eating less than the fixed arm and losing fat (v03, v05, v10, h11, h12) are flagged as wrong-reason. v01/v02/v06/v01K0.5 keep intake at or above the fixed arm and fat steady: genuine regulation. Physiological-only fixes fail because the control arm shares the body.
Regression checks on Combo A, block 500: v01 (K1) full battery: C10/HOT3RM/RPT2R/RPT2RL5/UAL/AE2/GWT2 PASS, RPT1 0.90/2.5 (Combo A 1.70/4.8) -> regression. v01 K0.5: RPT1 PASS 1.00/2.8. v04: RPT1 PASS 0.98/2.8.
Integration (v01 K1 vs Combo A, probe seeds 600-615): (a) PASS, moves NE, ACh, DA, foraging, rewards; (b) the gate reads blood glucose (internal state) by construction.
Status: NOT ported. Next: v01 K0.5 full battery on 500 + 540, integration probe, then a v01K0.5 x v06 hybrid if needed.
