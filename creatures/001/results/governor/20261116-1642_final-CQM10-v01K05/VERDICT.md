# Governor: 20261116-1642_final-CQM10-v01K05

Decided 2026-11-16 17:12 PST. Gate: every retained test non-inferior (lower 95% CI of paired delta-d > -0.3) and, if a target is named, a gain on it (lower CI > 0).

Rule: 96 fresh seeds (6 x 16) per decision, NI margin -0.3 (Alex, 2026-11-17); binding. Seeds: 848-863, 864-879, 880-895, 896-911, 912-927, 928-943 (96 paired seeds).

### final-CQM10-v01K05: **REJECT**

Block 848-863, 864-879, 880-895, 896-911, 912-927, 928-943; parent `comboA`, child `custom-07e0a577`; target C10; bundle dc9b62f894ec (commit 91891e6, bun 1.4.4).

| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |
|---|---|---|---|---|---|---|
| HOT3RM | A 1.15/7.97 | A 1.335/9.25 | -0.156 | [-0.366, +0.061] | **no** | no |
| RPT2R | A 4.002/27.73 | A 3.721/25.78 | -0.112 | [-0.249, +0.025] | yes | no |
| AE1 | fail 0.722/5.0 | A 0.889/6.16 | -0.156 | [-0.398, +0.088] | **no** | no |
| AE2 | A 2.218/15.36 | A 2.093/14.5 | -0.313 | [-0.577, -0.049] | **no** | no |
| RPT1 | A 0.853/5.91 | A 0.904/6.27 | +0.011 | [-0.188, +0.207] | yes | no |
| RPT2RL5 | A 3.555/24.63 | A 3.6/24.94 | -0.165 | [-0.312, -0.018] | **no** | no |
| UAL | A 1.441/9.99 | A 0.976/6.76 | +0.170 | [+0.028, +0.309] | yes | no |
| GWT2 | A 7.984/55.32 | A 7.034/48.74 | +0.109 | [-0.148, +0.389] | yes | no |
| C10 | fail -0.498/-3.45 | A 0.858/5.94 | +0.834 | [+0.577, +1.117] | yes | no |

Cost (all retained tests): parent 88.6 kJ and 2.19 CPU-s per organism-day; child 85.5 kJ and 2.57 CPU-s. Energy-ledger max error 1.0e-14; non-finite 0.
Target C10: delta-d per kJ/org-day +0.0098; per CPU-s/org-day +0.324; metabolic cost -3.4%, compute cost +17.5%.
