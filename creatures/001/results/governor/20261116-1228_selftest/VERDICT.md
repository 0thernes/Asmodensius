# Governor: 20261116-1228_selftest

Decided 2026-11-16 12:34 PST. Gate: every retained test non-inferior (lower 95% CI of paired delta-d > -0.3) and, if a target is named, a gain on it (lower CI > 0).

### parent vs parent (Combo A twice), block 704: **ACCEPT**

Block 704-719; parent `comboA`, child `comboA`; target (none); bundle 7ef46baa985c (commit 3c70d93, bun 1.4.4).

| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |
|---|---|---|---|---|---|---|
| HOT3RM | A 1.772/5.01 | A 1.772/5.01 | +0.000 | [+0.000, +0.000] | yes | yes |
| RPT2R | A 4.784/13.53 | A 4.784/13.53 | +0.000 | [+0.000, +0.000] | yes | yes |
| AE1 | A 1.143/3.23 | A 1.143/3.23 | +0.000 | [+0.000, +0.000] | yes | yes |
| AE2 | A 1.858/5.26 | A 1.858/5.26 | +0.000 | [+0.000, +0.000] | yes | yes |
| RPT1 | A 1.025/2.9 | A 1.025/2.9 | +0.000 | [+0.000, +0.000] | yes | yes |
| RPT2RL5 | A 4.144/11.72 | A 4.144/11.72 | +0.000 | [+0.000, +0.000] | yes | yes |
| UAL | A 1.592/4.5 | A 1.592/4.5 | +0.000 | [+0.000, +0.000] | yes | yes |
| GWT2 | A 6.6/18.67 | A 6.6/18.67 | +0.000 | [+0.000, +0.000] | yes | yes |

Cost (all retained tests): parent 90.9 kJ and 1.52 CPU-s per organism-day; child 90.9 kJ and 1.52 CPU-s. Energy-ledger max error 5.6e-15; non-finite 0.

### parent vs parent (Combo A twice), block 720: **ACCEPT**

Block 720-735; parent `comboA`, child `comboA`; target (none); bundle 7ef46baa985c (commit 3c70d93, bun 1.4.4).

| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |
|---|---|---|---|---|---|---|
| HOT3RM | A 1.428/4.04 | A 1.428/4.04 | +0.000 | [+0.000, +0.000] | yes | yes |
| RPT2R | A 3.935/11.13 | A 3.935/11.13 | +0.000 | [+0.000, +0.000] | yes | yes |
| AE1 | A 2.003/5.66 | A 2.003/5.66 | +0.000 | [+0.000, +0.000] | yes | yes |
| AE2 | A 2.745/7.76 | A 2.745/7.76 | +0.000 | [+0.000, +0.000] | yes | yes |
| RPT1 | fail 0.892/2.52 | fail 0.892/2.52 | +0.000 | [+0.000, +0.000] | yes | yes |
| RPT2RL5 | A 3.974/11.24 | A 3.974/11.24 | +0.000 | [+0.000, +0.000] | yes | yes |
| UAL | A 1.698/4.8 | A 1.698/4.8 | +0.000 | [+0.000, +0.000] | yes | yes |
| GWT2 | A 8.171/23.11 | A 8.171/23.11 | +0.000 | [+0.000, +0.000] | yes | yes |

Cost (all retained tests): parent 94.0 kJ and 1.45 CPU-s per organism-day; child 94.0 kJ and 1.43 CPU-s. Energy-ledger max error 4.1e-15; non-finite 0.

### sensitivity: Combo A -> v5.7b (a known RPT2R loss; must REJECT): **REJECT**

Block 720-735; parent `comboA`, child `v57b`; target RPT2R; bundle 7ef46baa985c (commit 3c70d93, bun 1.4.4).

| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |
|---|---|---|---|---|---|---|
| HOT3RM | A 1.428/4.04 | A 1.406/3.98 | -0.938 | [-1.497, -0.325] | **no** | no |
| RPT2R | A 3.935/11.13 | fail -0.031/-0.09 | -3.867 | [-4.463, -3.201] | **no** | no |
| AE1 | A 2.003/5.66 | A 2.03/5.74 | -0.167 | [-0.882, +0.571] | **no** | no |
| AE2 | A 2.745/7.76 | A 2.95/8.34 | -5.539 | [-6.153, -4.905] | **no** | no |
| RPT1 | fail 0.892/2.52 | A 1.011/2.86 | +0.000 | [-0.540, +0.527] | **no** | no |
| RPT2RL5 | A 3.974/11.24 | A 1.678/4.75 | -2.883 | [-3.429, -2.299] | **no** | no |
| UAL | A 1.698/4.8 | A 1.656/4.68 | -0.007 | [-0.254, +0.298] | yes | no |
| GWT2 | A 8.171/23.11 | A 6.496/18.37 | -0.545 | [-1.163, +0.073] | **no** | no |

Cost (all retained tests): parent 94.0 kJ and 1.45 CPU-s per organism-day; child 94.1 kJ and 1.11 CPU-s. Energy-ledger max error 7.0e-15; non-finite 0.
Target RPT2R: delta-d per kJ/org-day -0.0411; per CPU-s/org-day -3.489; metabolic cost +0.1%, compute cost -23.4%.

### sensitivity: v5.7b -> Combo A, target RPT2R (the official +3.37 d gain): **REJECT**

Block 720-735; parent `v57b`, child `comboA`; target RPT2R; bundle 7ef46baa985c (commit 3c70d93, bun 1.4.4).

| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |
|---|---|---|---|---|---|---|
| HOT3RM | A 1.406/3.98 | A 1.428/4.04 | +0.938 | [+0.325, +1.497] | yes | no |
| RPT2R | fail -0.031/-0.09 | A 3.935/11.13 | +3.867 | [+3.201, +4.463] | yes | no |
| AE1 | A 2.03/5.74 | A 2.003/5.66 | +0.167 | [-0.571, +0.882] | **no** | no |
| AE2 | A 2.95/8.34 | A 2.745/7.76 | +5.539 | [+4.905, +6.153] | yes | no |
| RPT1 | A 1.011/2.86 | fail 0.892/2.52 | -0.000 | [-0.527, +0.540] | **no** | no |
| RPT2RL5 | A 1.678/4.75 | A 3.974/11.24 | +2.883 | [+2.299, +3.429] | yes | no |
| UAL | A 1.656/4.68 | A 1.698/4.8 | +0.007 | [-0.298, +0.254] | yes | no |
| GWT2 | A 6.496/18.37 | A 8.171/23.11 | +0.545 | [-0.073, +1.163] | yes | no |

Cost (all retained tests): parent 94.1 kJ and 1.11 CPU-s per organism-day; child 94.0 kJ and 1.45 CPU-s. Energy-ledger max error 7.0e-15; non-finite 0.
Target RPT2R: delta-d per kJ/org-day +0.0411; per CPU-s/org-day +2.672; metabolic cost -0.1%, compute cost +30.6%.
