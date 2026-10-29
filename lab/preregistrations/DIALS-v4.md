# DIALS-v4 preregistration: single-factor arms for the one-shot PD confound (frozen before test seeds 1000-1015)

v3 result: the one-shot arm and the repeated arm differed in partner rule, reward window and learning rate at once. v4 holds population
(8 creatures, dome r=4, 3 days, learned PD) fixed. A reference arm A (one-shot, 1-tick phasic DA reward, lr 300) is compared with arms that
each change exactly ONE factor. Driver `smoke9.ts <arm> test`, comparison `smoke9cmp.ts test` (Welch + Cohen d, B vs A).
Predictions are in `DIALS-v4.pred.json` and are machine-read by the comparison script.

| arm | changes vs A | prediction | dev (2000-2005) mean p(C) |
|-----|--------------|------------|---------------------------|
| A_ref | - | reference | 0.475 |
| C_window15 | 15-tick DA window (not phasic) | **+** (window drives cooperation): p<0.05, d>=0.5 | 0.624 |
| B_contact | contact (repeated) partners | **null**: PASS iff \|d\|<0.5 and p>=0.05 | 0.520 |
| D_lr30 | lr 30 | **null**: PASS iff \|d\|<0.5 and p>=0.05 | 0.533 |
| E_v3repeatedAtN8 | all three (= v3 repeated config at n=8) | descriptive only, not tested | 0.650 |

A null PASS is weak evidence (16 seeds); it is reported as "no effect detected at d>=0.5", not as proof of no effect.

Scorecard diagnosis (dev seeds, recorded before test; see HANDOFF-R17-scorecard.md): descriptive replication on test seeds 1000-1003 with `rptProbe` and the glucose decoders, no pass/fail.
