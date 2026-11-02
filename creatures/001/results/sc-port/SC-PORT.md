# SC-PORT dev report (updated 2026-11-01 evening US Pacific)
Dev seeds only (blocks 500/520/540 x16 seeds; integration probe seeds 600-615). No test seeds, no push. Grade A = d>=0.8 and Welch t>=2.75 vs every control. Tables: scores_500/520/540.md (auto-scored from raw/).

## Methodology caveat (honesty)
Combo A's parts (v6hub for RPT2R, scBM for AE2) were adopted from flag screens, NOT via Alex's full 10-way side-specialist method; they are provisional. HOT3 and CQM10 below follow the method (side-specialist folders specialists/<ITEM>/vNN, up to 10 approaches, hybrids, port only after standalone PASS + integration a/b/c). Implementation note: each variant's code is flag-gated (default off) in organism/organism.ts; the specialist folders hold spec, flags and runner.

## Combo verdict
- **Combo A = v6hub (ORG_V6=1, v6P 0, v6Ak 0) + scAIm 0.5 + scBM 1: leading candidate.**
  Block 500: PASS AE2 2.27/6.4, GWT2 6.88/19.5, HOT3RM 1.31/3.7, RPT1 1.70/4.8, RPT2R 3.76/10.6, RPT2RL5 2.46/7.0, UAL 1.95/5.5; fail AE1 0.76/2.1 (near), AINF -0.09, C10 -0.57, C16R 0.55.
  Block 540: PASS AE1 1.33/3.8, AE2 2.07/5.9, GWT2 8.92/25.2, HOT3RM 1.27/3.6, RPT1 1.11/3.1, RPT2R 3.65/10.3, RPT2RL5 4.15/11.7, UAL 1.00/2.8; fail AINF -0.44, C10 -0.49, C16R 0.80/2.2.
  Block 520 (HOT3RM only): fail 0.92/2.6 (borderline).
- **Combo B (Combo A + scAIe/scEm/scSR): rejected.** RPT1 fails on both blocks (500: 0.12/0.3; 540: 0.85/2.4) and AE1 drops (500 0.47, 540 0.27 fail); no test gained over A.
- Fast weights excluded (RPT2R/UAL/AE2 regressions). scBM: AE2 +4 d, no side effects. Off-path bit-identical check: comboA rerun with new code gives identical HOT3RM (1.31/3.7) and C10 (-0.57/-1.6) on 500.

## HOT3 self-training (specialists/HOT3RM, st01-st08)
Problem: the confidence monitor (meta3) was trained only by harness teachConf, so in natural life conf=0.5 and integration (a) failed. Change: Mind.selfConf (flag scST, default off): at every forage, monitor confidence is treated as a prediction of that choice's success and updated on the creature's own outcome (got food or not), DA-gated lr. Optional scSTs puts it in separate weights. scCI couples low confidence to the LC (predErr) and hunger to belief-precision weight.
| arm | flags (on Combo A) | HOT3RM 500 | 520 | 540 | RPT1 500 | integ (a) |
|---|---|---|---|---|---|---|
| comboA | - | PASS 1.31/3.7 | fail 0.92/2.6 | PASS 1.27/3.6 | PASS 1.70/4.8 | FAIL (conf inert) |
| st01 stA | scCI1 scST1 | PASS 1.10/3.1 | fail 0.70/2.0 | fail 0.84/2.4 | fail 0.18/0.5 | PASS (cortisol, foraged) |
| st02 stB | scCI1 scST3 | fail 0.76/2.1 | PASS 1.57/4.4 | PASS 1.15/3.2 | - | PASS (NE, DA, cortisol) |
| st03 stC | scCI1 scST1 scSTs1 | PASS 1.10/3.1 | - | - | fail 0.18/0.5 | - |
| st04 stD | scCI0.25 scST1 scSTs1 | PASS 1.02/2.9 | - | - | fail 0.77/2.2 | - |
| st05 stE | scCI0.25 scST3 | PASS 1.18/3.4 | PASS 1.76/5.0 | PASS 1.29/3.6 | PASS 1.17/3.3 | FAIL (only foraged moves; NE/DA/cortisol t~2) |
| st06 | scCI0.5 scST3 | PASS 0.99/2.8 | PASS 1.19/3.4 | fail 0.95/2.7 | fail 0.48/1.4 | PASS (DA, foraged) |
| st08 | scCI0.35 scST3 | PASS 1.49/4.2 | fail 0.97/2.7 | PASS 1.25/3.5 | fail 0.87/2.5 | PASS (DA, cortisol, rewards) |
Verdict: no self-train arm passes a+b+c; not ported. st07 (scCI0.5 scST6) a PASS, tests not run.
stA full 500 battery: RPT1 regresses (1.70 -> 0.18); others as Combo A. Trade-off found: strong LC coupling passes (a) but costs HOT3RM/RPT1; weak coupling passes HOT3RM on all 3 blocks + RPT1 but (a) fails. (b) PASS in all (belief-precision weight 0.47 sated vs 0.28 hungry).

## CQM10 (specialists/CQM10, v01-v10 + h11-h13)
What C10 measures: fraction of days 2-4 with glucose in (2, 4.5), ATP>1.5, adenosine<0.9; full vs fixed forage probability 0.12. Diagnosis (diag.ts, 8 seeds): full fails only by hyperglycaemia (glcHi 5.8% vs 2.6%) from over-foraging (68 vs 54 forages/day, fat 292 vs 271). See specialists/CQM10/README.md for the table. Behavioural satiety gates (v01-v06, v10) PASS 1.32-1.50 (full reaches ceiling 1.0); physiological fixes (v07-v09) fail because they help both arms. v01 (glucose-sensing satiety) is the non-gaming winner (eats 57/day, fat steady); v03/v05/h11/h12 pass by under-eating (fat falls to ~233) and are rejected as wrong-reason.
Port status: NOT ported. v01 on Combo A (block 500 battery): C10 PASS 1.40/3.9, HOT3RM/RPT2R/RPT2RL5/UAL/AE2/GWT2 PASS, but RPT1 0.90/2.5 (Combo A 1.70) regresses; integration (a) PASS (NE, ACh, DA, foraging, rewards move), (b) inherent (gate reads blood glucose).

v01 with gain K0.5 (gate from 3.6 mM): C10 PASS 1.27/3.6, RPT1 PASS 1.00/2.8, eats 65.8/day, fat 275: best CQM10 candidate; full battery + integration still to run before any port.
