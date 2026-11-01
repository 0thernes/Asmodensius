# DRAFT preregistration: SC-PORT combo A (NOT FROZEN, NOT RUN)
Status: draft. Freeze only after the dev confirmation on block 540 finishes and Alex approves. No test seed (>=1064) has been used for any SC-PORT work.

## Candidate
ORG_V6=1 with M50J {"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}: v5.7b + V6 binding hub (DA-RPE-consolidated) without learned precision and without the antithetic appetite integral, + belief-precision confidence (HOT-3), + Kalman body model (AE-2). Bundle built from organism/run_v39.ts at the freeze commit; parameters fixed as above (no further tuning).
Comparator arm: v5.7b (ORG_V5=11). Fallback if combo A fails dev confirmation: combo B (adds scAIe/scEm/scSR) or v6hub alone; the choice is made on dev data before freezing and recorded here.

## Seeds
Test seeds 1112-1159 (n=48, after OFFICIAL-R21's 1064-1111), NSEEDS=16 x 3 blocks per test; AE1 also pooled 64 seeds 1160-1223. To be confirmed against the seed ledger before freezing.

## Tests and controls (each test's own controls)
HOT3RM (random opt-out matched rate; confidence shuffled), RPT2R and RPT2RL5 (cross-module CTX lesion), RPT1, AE1 (RPE lesion, pooled), AE2 (forward model lesion), GWT2, UAL, AINF, C10, C16R, C03R; plus viability (3 days, deaths and foraging).

## Criteria
Grade A per test: d>=0.8 and Welch t>=2.75 vs every control. Kill if: HOT3RM or RPT2R fails; AE1 pooled d<0.8; more than one test passed by v5.7b is lost; foraging falls by >25% vs v5.7b.

## Known limits disclosed in advance
HOT-3 confidence is trained only by the test harness (integration check (a) fails, specialists/HOT3RM/README.md). AINF is under-powered as an unpaired test. C03R and CQM04 are decided by harness birth/selection rules.
