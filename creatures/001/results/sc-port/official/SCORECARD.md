# SC-PORT Combo A — OFFICIAL test scorecard

Frozen prereg: preregistrations/SC-PORT.md (freeze commit cb3aaed, code pin bc6ad6a). Seeds 1112–1159 (n=48/arm); AE1 also pooled with 1160–1223 (n=112).
Cell: grade / weakest control d/t. Grade A = d≥0.8 and t≥2.75 vs every control.

| test | role | v5.7b | Combo A | Combo A full vs v5.7b full d |
|---|---|---|---|---|
| RPT2R | claim | fail 0.47/2.3 (n=48) | A 3.87/19.0 (n=48) | +3.37 |
| RPT2RL5 | claim | A 1.36/6.7 (n=48) | A 3.17/15.5 (n=48) | +2.00 |
| RPT1 | claim | A 1.08/5.3 (n=48) | A 0.92/4.5 (n=48) | -0.01 |
| UAL | claim | A 1.52/7.4 (n=48) | A 1.11/5.5 (n=48) | -0.00 |
| HOT3RM | claim | A 0.99/4.8 (n=48) | A 1.43/7.0 (n=48) | +0.43 |
| AE2 | claim | A 2.80/13.7 (n=48) | A 2.65/13.0 (n=48) | +3.56 |
| AE1 | claim | fail 0.58/4.3 (n=112) | fail 0.73/5.5 (n=112) | +0.17 |
| GWT2 | must-hold | A 6.35/31.1 (n=48) | A 7.73/37.9 (n=48) | +0.29 |
| AINF | reported | fail -0.03/-0.2 (n=48) | fail 0.12/0.6 (n=48) | +0.11 |
| C10 | reported | fail -0.52/-2.5 (n=48) | fail -0.48/-2.3 (n=48) | +0.01 |
| C16R | reported | fail 0.52/2.6 (n=48) | fail 0.50/2.4 (n=48) | -0.08 |

AE1 detail (frozen bundle sha256 d3e3b973…, no re-runs needed; all 7 blocks present on both arms):
- n=48 (1112–1159): v5.7b 0.38/1.85, Combo A 0.41/2.03 — fail.
- n=112 (1112–1223 pooled, prereg claim basis): v5.7b 0.58/4.34, Combo A 0.73/5.48 — fail on d (<0.8). AE1 is not claimed; per kill rule "AE1 pooled d < 0.8 (only if AE1 is claimed)".
