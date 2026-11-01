| Block | Comparison | mean A | mean B | d (or paired dz) | t | pass |
|---|---|---|---|---|---|---|
| dev 3077-3084 | (1) meal AUC: Eshkol BPTT dream model vs TS TPC (paired) | 0.921 | 0.769 | 3.84 | 10.86 | ✓; min B 0.897 (target >0.9; Bayes ceiling 0.931) |
| held-out 3093-3096 | (1) meal AUC: Eshkol BPTT dream model vs TS TPC (paired) | 0.930 | 0.681 | 4.09 | 8.18 | ✓; min B 0.917 (target >0.9; Bayes ceiling 0.931) |
| dev 3077-3084 | (2) rollout vs one-step greedy | 0.726 | 0.537 | 4.51 | 9.03 | ✓ |
| dev 3077-3084 | (2) rollout vs identity-model lesion | 0.726 | 0.502 | 16.56 | 33.13 | ✓ |
| dev 3077-3084 | (3) opt-out with error model vs shuffled | 0.968 | 0.724 | 17.16 | 34.32 | ✓ |
| dev 3077-3084 | (3) error model vs readout margin (paired) | 0.968 | 0.964 | 1.38 | 3.89 | ✓ |
| held-out 3093-3100 | (2) rollout vs one-step greedy | 0.731 | 0.543 | 4.19 | 8.38 | ✓ |
| held-out 3093-3100 | (2) rollout vs identity-model lesion | 0.731 | 0.504 | 13.98 | 27.95 | ✓ |
| held-out 3093-3100 | (3) opt-out with error model vs shuffled | 0.967 | 0.728 | 15.06 | 30.11 | ✓ |
| held-out 3093-3100 | (3) error model vs readout margin (paired) | 0.967 | 0.963 | 1.48 | 4.19 | ✓ |
