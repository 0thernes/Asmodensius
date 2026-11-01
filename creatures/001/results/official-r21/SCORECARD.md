# OFFICIAL Round 21 scorecard (Creature #1)

Generated 2026-11-01 14:35 PT by scoring/gen.py. Prereg: creatures/001/preregistrations/OFFICIAL-R21.md (commit f7ff08d, frozen before any test run). Test seeds 1064-1111 (n=48).

**Run status:** test files done: arm A 56/63, arm D 56/63. Items marked PENDING have not finished; totals below count only finished PASS items and are NOT final while anything is pending.

Pass = d>=0.8 AND Welch t>=2.75 vs every control (+ non-ceiling rule). PARTIAL = passes some controls but not all, or the original fails while a disclosed R variant passes. Official totals count originals only.

Previous official (R20, v3.9): Butlin 9/14, frameworks 7/10, CQM 17/25.

## Totals

| List | A v5.7b official | A with R variants | D v5.7d official | D with R variants |
|---|---|---|---|---|
| Butlin | 9/14 (partial 3, pending 0) | 12/14 (partial 0, pending 0) | 9/14 (partial 3, pending 0) | 12/14 (partial 0, pending 0) |
| Frameworks | 6/10 (partial 2, pending 0) | 8/10 (partial 0, pending 0) | 5/10 (partial 2, pending 0) | 7/10 (partial 0, pending 0) |
| CQM | 15/25 (partial 2, pending 4) | 18/25 (partial 0, pending 3) | 15/25 (partial 2, pending 4) | 18/25 (partial 0, pending 3) |

## Butlin 14

| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |
|---|---|---|---|---|---|
| RPT-1 | PASS | d 1.04 t 5.10 | PASS | d 1.13 t 5.55 |  |
| RPT-2 | PARTIAL | d -0.28 t -1.36 | PARTIAL | d -0.17 t -0.81 | RPT2R: FAIL / PASS, RPT2RL5: PASS / PASS |
| GWT-1 | PASS | d 2.89 t 14.17 | PASS | d 3.19 t 15.64 |  |
| GWT-2 | FAIL | d 8.43 t 41.28 | FAIL | d 8.43 t 41.29 |  |
| GWT-3 | PARTIAL | d 19.44 t 95.25 | PARTIAL | d 26.15 t 128.10 | GWT-3R: PASS / PASS |
| GWT-4 | FAIL | d 14.51 t 71.10 | FAIL | d 20.04 t 98.16 |  |
| HOT-1 | PASS | d 2.08 t 10.18 | PASS | d 2.13 t 10.45 |  |
| HOT-2 | PASS | d 2.06 t 10.09 | PASS | d 2.10 t 10.30 |  |
| HOT-3 | PARTIAL | d 0.01 t 0.07; d 0.02 t 0.11 | PARTIAL | d -0.01 t -0.07; d 0.10 t 0.47 | HOT3RM: PARTIAL / PARTIAL, HOT3RM-P: PASS / PASS |
| HOT-4 | PASS | d 6.31 t 30.89 | PASS | d 6.50 t 31.84 |  |
| AST-1 | PASS | d 1.18 t 5.77 | PASS | d 0.97 t 4.74 |  |
| PP-1 | PASS | d 1.12 t 5.49 | PASS | d 1.06 t 5.18 |  |
| AE-1 | PASS | d 0.98 t 4.80 | PASS | d 1.19 t 5.84 | AE1R: FAIL / FAIL |
| AE-2 | PASS | d 2.48 t 12.14 | PASS | d 2.62 t 12.85 |  |

## Frameworks 10

| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |
|---|---|---|---|---|---|
| thaler9 | PASS | d 1.29 t 6.31 | PASS | d 1.74 t 8.53 |  |
| iit4 | PASS | d 2.46 t 12.03 | PASS | d 2.50 t 12.23 |  |
| activeInference | FAIL | d 0.00 t 0.01 | FAIL | d 0.01 t 0.05 |  |
| attentionSchema | PASS | d 7.85 t 38.46 | PASS | d 8.86 t 43.42 |  |
| fieldIntegration | PASS | d 1.20 t 5.87 | FAIL | d 0.76 t 3.72 |  |
| ual | PASS | d 1.06 t 5.19 | PASS | d 1.36 t 6.66 |  |
| sensorimotor | PASS | d 3.31 t 16.19 | PASS | d 3.64 t 17.85 |  |
| projective | PARTIAL | d 9.62 t 47.15 | PARTIAL | d 10.72 t 52.51 | PROJR: PASS / PASS |
| ctm | PARTIAL | d 17.04 t 83.47 | PARTIAL | d 21.35 t 104.61 | ctm-R: PASS / PASS |
| butlin14 | FAIL |  | FAIL |  |  |

## CQM 25

| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |
|---|---|---|---|---|---|
| CQM01 | PENDING |  | PENDING |  | CQM01R: PASS / PASS |
| CQM02 | PENDING |  | PENDING |  |  |
| CQM03 | PENDING |  | PENDING |  | CQM03R: FAIL / FAIL |
| CQM04 | PENDING |  | PENDING |  |  |
| CQM05 | PASS | d 39.05 t 191.32 | PASS | d 38.29 t 187.58 |  |
| CQM06 | FAIL | d 0.30 t 1.48 | FAIL | d 0.56 t 2.76 |  |
| CQM07 | PASS | d 5.81 t 28.48 | PASS | d 6.48 t 31.74 |  |
| CQM08 | PARTIAL | d 0.59 t 2.91 | PARTIAL | d 0.59 t 2.90 | CQM08R: PASS / PASS |
| CQM09 | PASS | d 6.09 t 29.81 | PASS | d 5.23 t 25.63 |  |
| CQM10 | FAIL | d -0.82 t -4.02 | FAIL | d -0.81 t -3.95 |  |
| CQM11 | PASS | d 7.04 t 34.48 | PASS | d 7.29 t 35.72 |  |
| CQM12 | PASS | d 1.03 t 5.07 | PASS | d 1.33 t 6.52 |  |
| CQM13 (=HOT-2) | PASS | d 2.06 t 10.09 | PASS | d 2.10 t 10.30 |  |
| CQM14 | PASS | d 4.73 t 23.18 | PASS | d 3.74 t 18.33 |  |
| CQM15 | PASS | d 1.68 t 8.22 | PASS | d 1.58 t 7.72 |  |
| CQM16 | PASS | d 7.25 t 35.52 | PASS | d 7.88 t 38.63 | C16R: FAIL / FAIL |
| CQM17 | PASS | d 1.49 t 7.30 | PASS | d 1.51 t 7.38 |  |
| CQM18 | FAIL | d 0.00 t 0.00 | FAIL | d 0.00 t 0.00 | CQM18R: FAIL / FAIL |
| CQM19 (=RPT-1) | PASS | d 1.04 t 5.10 | PASS | d 1.13 t 5.55 |  |
| CQM20 (=GWT-3) | PARTIAL | d 19.44 t 95.25 | PARTIAL | d 26.15 t 128.10 |  |
| CQM21 (=iit4) | PASS | d 2.46 t 12.03 | PASS | d 2.50 t 12.23 |  |
| CQM22 | PASS | d 2.50 t 12.25 | PASS | d 2.44 t 11.93 |  |
| CQM23 | FAIL |  | FAIL |  |  |
| CQM24 | PASS |  | PASS |  |  |
| CQM25 | PASS |  | PASS |  |  |

## Disclosed R variants (detail)

- A RPT2R: FAIL vs cross-module CTX synapses lesioned: d -0.11 t -0.53
- A RPT2RL5: PASS vs cross-module CTX synapses lesioned: d 1.14 t 5.6
- A HOT3RM: PARTIAL vs random opt-out (matched rate): d 0.84 t 4.09; vs confidence shuffled: d 0.74 t 3.6
- A HOT3RM-P: PASS vs confidence shuffled (paired): dz 1.15 t 7.97
- A AE1R: FAIL vs RPE learning lesioned: d 0.31 t 1.52
- A PROJR: PASS vs efference copy lesioned: d 4.89 t 23.93
- A C16R: FAIL vs anticipation lesioned (reactive only): d 0.74 t 3.6
- A CQM18R: FAIL(ceiling) vs plasticity frozen after lesion: d 7.15 t 35.02
- A GWT-3R: PASS d 10.03 t 49.15
- A ctm-R: PASS d 12.80 t 62.73
- A CQM08R: PASS d 7.98 t 39.07
- A CQM03R: FAIL d -2.31 t -11.32
- A CQM01R: PASS d 1.09 t 5.34
- A K1aR: FAIL d 0.13 t 0.66
- A K1cR: FAIL d 0.24 t 1.18
- D RPT2R: PASS vs cross-module CTX synapses lesioned: d 3.36 t 16.44; vs shuffled pairing (vshuf): d 2.74 t 13.44
- D RPT2RL5: PASS vs cross-module CTX synapses lesioned: d 3.43 t 16.81
- D HOT3RM: PARTIAL vs random opt-out (matched rate): d 0.95 t 4.67; vs confidence shuffled: d 0.75 t 3.68
- D HOT3RM-P: PASS vs confidence shuffled (paired): dz 1.09 t 7.55
- D AE1R: FAIL vs RPE learning lesioned: d 0.56 t 2.76
- D PROJR: PASS vs efference copy lesioned: d 4.68 t 22.95
- D C16R: FAIL vs anticipation lesioned (reactive only): d 0.78 t 3.84
- D CQM18R: FAIL(ceiling) vs plasticity frozen after lesion: d 6.33 t 31.03
- D GWT-3R: PASS d 8.60 t 42.15
- D ctm-R: PASS d 10.93 t 53.54
- D CQM08R: PASS d 6.91 t 33.87
- D CQM03R: FAIL d -2.50 t -12.27
- D CQM01R: PASS d 1.47 t 7.19
- D K1aR: FAIL d -0.38 t -1.87
- D K1cR: FAIL d -0.12 t -0.59

## NOVEL-100

Unchanged: 0 done, 2 partial. No R21 test is direct evidence for a NOVEL-100 item.

## Deviations and disclosures
- The prereg header says "frozen ~09:58 PT"; the freeze commit f7ff08d was actually made at about 09:54 PT, still before any test-seed job started (first launch 09:54:20 PT).
- The first launch was stopped after ~1.5 min with no output written, and the queue was reordered (long EVO/L1/L3 moved last). Nothing was seen, nothing tuned. Relaunch 09:55:44 PT (commit 3ae2fea).
- v5.7d was not ported into the v4.0 tree (conflicts with v6.2/V6-S1 at ORG_V5=15 and the shared `hubH` field); it runs from wild-arch 4bc5c03.
- HOT3RM is scored against both of its controls (random opt-out and confidence shuffled), which is stricter than the prereg table (that lists only confidence shuffled). CQM18R has only the "plasticity frozen after lesion" control in code; the afferent-remap control listed in the prereg does not exist in this build.
- Viability (steady/starve/refeed) is reported but does not count in any list.

## Raw scorer output

See raw/A, raw/D, raw/Dshuf (per-test JSON) and scoring/ (A_orig.txt, D_orig.txt, *_rvar.json).
