# Governor: 20261116-1624_final-AE1-v07

Decided 2026-11-16 16:42 PST. Gate: every retained test non-inferior (lower 95% CI of paired delta-d > -0.3) and, if a target is named, a gain on it (lower CI > 0).

Rule: 96 fresh seeds (6 x 16) per decision, NI margin -0.3 (Alex, 2026-11-17); binding. Seeds: 752-767, 768-783, 784-799, 800-815, 816-831, 832-847 (96 paired seeds).

### final-AE1-v07: **REJECT**

Block 752-767, 768-783, 784-799, 800-815, 816-831, 832-847; parent `comboA`, child `custom-aad76ece`; target AE1; bundle dc9b62f894ec (commit 91891e6, bun 1.4.4).

| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |
|---|---|---|---|---|---|---|
| HOT3RM | A 1.306/9.05 | A 1.241/8.6 | +0.027 | [-0.188, +0.246] | yes | no |
| RPT2R | A 4.113/28.49 | A 4.113/28.5 | -0.027 | [-0.155, +0.097] | yes | no |
| AE1 | A 0.936/6.49 | A 1.077/7.46 | +0.162 | [-0.111, +0.435] | yes | no |
| AE2 | A 2.409/16.69 | A 2.359/16.35 | -0.017 | [-0.293, +0.265] | yes | no |
| RPT1 | fail 0.713/4.94 | A 0.842/5.83 | -0.029 | [-0.289, +0.233] | yes | no |
| RPT2RL5 | A 3.859/26.74 | A 4.13/28.61 | -0.024 | [-0.204, +0.152] | yes | no |
| UAL | A 1.519/10.52 | A 1.35/9.35 | +0.021 | [-0.122, +0.164] | yes | no |
| GWT2 | A 8.44/58.47 | A 7.352/50.94 | -0.057 | [-0.328, +0.221] | **no** | no |

Cost (all retained tests): parent 91.9 kJ and 2.19 CPU-s per organism-day; child 91.9 kJ and 2.87 CPU-s. Energy-ledger max error 7.5e-15; non-finite 0.
Target AE1: delta-d per kJ/org-day +0.0018; per CPU-s/org-day +0.057; metabolic cost -0.0%, compute cost +30.6%.
