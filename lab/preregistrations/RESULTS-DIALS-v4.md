# DIALS-v4 results (test seeds 1000-1015, run after prereg commit 7ba6731)

All arms: 8 creatures, dome r=4, 3 days, learned PD. A_ref = one-shot partners, 1-tick phasic DA reward, lr 300.

| comparison (one factor) | A_ref | arm | p | d | prediction | result |
|---|---|---|---|---|---|---|
| reward window 15 vs 1 tick (C_window15) | 0.367 | 0.562 | 0.008 | 1.02 | + | PASS |
| partner rule contact vs one-shot (B_contact) | 0.367 | 0.375 | 0.91 | 0.04 | null | PASS (no effect detected at d>=0.5) |
| learning rate 30 vs 300 (D_lr30) | 0.367 | 0.397 | 0.66 | 0.16 | null | PASS (no effect detected) |
| E: all three changed (v3 repeated config at n=8) | 0.367 | 0.591 | - | - | descriptive | - |

Conclusion: the v3 one-shot vs repeated difference is carried by the DA reward window, not by partner anonymity or learning rate.
This fits the dev diagnosis: the 15-tick DA mean is not monotonic in payoff, so it rewards C. The creatures have no partner memory,
so anonymity has nothing to act on. Ledgers <= 1.7e-14.

Scorecard diagnosis, descriptive replication on test seeds 1000-1003 (out/scorediag_test.json):
- Intact early evoked CTX response 0.091-0.100; late window -0.005 to -0.009 (undershoot) on all 4 seeds. Cutting CTX->CTX raises early to 0.117-0.126.
- Glucose > median decoded from INS 0.52-0.62 (shuffled ~0.50), from HYP 0.95-0.97. Matches dev; see HANDOFF-R17-scorecard.md.
