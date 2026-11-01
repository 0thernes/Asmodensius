# SC-PORT dev report (interim, 2026-11-02 Asia/Manila)
All runs on dev seeds below 1064 (blocks 500, 520, 540, 560, integration probe 600-615). No test seeds touched. Code: organism/organism.ts flags scGW*, scFW/scLR, scAIe/scEm/scSR/scAIm, scBM, scSMC, scCI, v6P/v6Ak (all default off; bit-identical when off, checked on AE2 and GWT2). Raw JSON in raw/, auto-scored tables in scores_<block>.md (refreshed every 10 min by a detached commit loop).

Cell format: weakest within-test control d/t; [d of arm full vs base full]. Grade A = d>=0.8 and t>=2.75 vs every control.

## Block 500, 16 seeds (main screen)
| module | moves (helps) | regressions |
|---|---|---|
| 1 workspace scGW (K=4,T=0.25) | GWT2 +0.98 vs base (already PASS), HOT3RM raw +0.55 (still fail) | RPT1 -0.54 vs base; RPT1 falls to fail 0.81 |
| 1 variants | T=0.1: GWT2 +1.24. T=1: HOT3RM PASS 1.94/5.5 | T=1: GWT2 -3.29 vs base (still passes 2.74) |
| 2 fast weights + learned recurrence (scFW1 scLR1) | RPT1 PASS 1.35/3.8, AE1 0.88/2.5 (base 0.23), GWT2 +0.18 | RPT2R worse (-0.34), HOT3RM -0.29, UAL -0.53, AE2 -0.47; larger gains (x3) worse |
| 3 active-inference stack (scAIe/scEm/scSR/scAIm) | HOT3RM PASS 1.49/4.2 (base fail 0.75); RPT1 PASS 1.08; AE1 0.52 | RPT2R -0.25, UAL -0.22; AINF unchanged |
| 3 belief-precision confidence only (scAIm) | HOT3RM PASS 1.28/3.6; nothing else changes | none |
| 4 body model scBM | AE2 tracking +4.24 vs base (PASS 2.55/7.2) | none (all other tests identical) |
| V6 hub without learned precision, no aic (v6hub) | RPT2R PASS 3.76/10.6, RPT2RL5 PASS 2.46, RPT1 PASS 1.70, UAL PASS 1.95, AE1 0.76 (base 0.23) | HOT3RM -0.41 vs base, AINF -0.12 |
| V6 hub + aic, no precision (v6np) | RPT2R PASS 3.48, RPT2RL5 2.59, RPT1 1.41, GWT2 11.1 | AINF -1.37 vs base, AE2 -0.66, HOT3RM -0.70 |

Base (v5.7b) on block 500: AE2, GWT2, UAL pass; AE1 0.23, AINF 0.13, C10 -0.73, HOT3RM 0.75, RPT1 0.86 (t 2.4), RPT2R 0.28, RPT2RL5 0.70 fail. Note AE1 base fails on this 16-seed block although it passed R21 at n=48; 16-seed AE1 is noisy.

Dropping V6's learned precision removes most of its HOT3RM/AE1 damage (v6hub AE1 0.76 vs v6s1 report 0.49 pooled; different seeds, indicative only). Dropping aic too protects AINF and AE2.

## HOT3RM specialist (10 variants + hybrids) -> see specialists/HOT3RM/README.md
## AINF (10 variants, all fail, test under-powered) -> specialists/AINF/README.md
## Ill-posed: C03R, CQM04 (harness-side birth/selection rules), GWT2 R21 fail (ceiling rule) -> specialists/*/README.md

## Specialist table
| specialist | standalone (dev) | ported | integration a/b/c | regressions |
|---|---|---|---|---|
| HOT3RM (scAIm, v01 stack) | PASS blocks 500/520/540 | scAIm+scCI battery running | a FAIL (pathway inert outside tests), b PASS (weight 0.47 sated / 0.28 hungry), c pending | none for scAIm alone |
| RPT2R (v6hub) | PASS 3.76/10.6 | in combo battery | pending | HOT3RM -0.41 |
| AE2 (scBM) | PASS, +4.24 d | in combo battery | pending | none |
| AINF | 10/10 fail | - | - | - |
| C03R, CQM04 | ill-posed | - | - | - |

## Pending (detached loops in /tmp/scp, auto-committed)
- rest of block-500 battery (C16R; ablation arms).
- combo A = v6hub + scAIm + scBM; combo B = combo A + scAIe/scEm/scSR; on blocks 500 and 540, with base and v6hub on 540 as controls.
- HOT3RM port battery (scAIm+scCI) and integration probe.
