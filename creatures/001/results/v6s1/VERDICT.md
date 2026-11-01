# V6-S1 verdict: Blueprint A stage 1 (ORG_V6=1) vs v5.7b (ORG_V5=11). KILLED.
Scored 2026-11-01 ~12:40 PT with /tmp/v6/score.py (full output in SCORE.txt). Criteria from preregistrations/V6-S1.md; no tuning after launch.

## Kill criteria
1. AE1 pooled (64 seeds, 4397-4460) vs RPE lesion: v6 d0.49 t2.76 (v5.7b d0.90 t5.09). d < 0.8, so **KILL**.
2. C10 and C16R must pass on both blocks: C10 passes 4365 (d1.00 t2.82) but fails 4381 (d0.76 t2.14); C16R fails 4365 (d0.27) and 4381 (d0.80 t2.27). **KILL**.
3. HOT3RM: fails both blocks (4365 opt-out d0.94/shuffle d0.95 t2.69; 4381 d0.85/d0.71 t2.00). **KILL** (d range on the weaker control is 0.24, under 0.4, but it fails both blocks).
4. Tests passed by v5.7b but lost by v6: block 4365 none; block 4381 two (C16R d1.26 to 0.80, HOT3RM to fail). More than 1, so **KILL**.

All four criteria trigger. Stage 1 is killed; v5.7b remains the floor.

## Gains (v6 passes where v5.7b fails)
- RPT2R on both blocks (4365 d3.70 t10.45; 4381 d4.21 t11.91; v5.7b d0.85 and d0.21).
- C10 on 4365 (d1.00 t2.82); UAL on 4365 (d1.70 t4.80).
- RPT2RL5 effect sizes rose on both blocks (d3.10 and 4.22 vs 1.59 and 2.13).

## Losses
- AE1 RPE dependence weakened (pooled d0.90 to 0.49; v5.7b passed 2 of 6 per-block AE1 sets, v6 passed 0).
- C16R and HOT3RM on 4381.
- Viability: no deaths in either arm, but foraging dropped (4365: 168 vs 260; 4381: 151 vs 209 items over 3 days).

## Unchanged
Pass for both: C08R, C16, GWT3R, HOT1, PROJR (both blocks). Fail for both: AINF, C03R.

## Read
The binding hub clearly helps the recurrent-processing tests (RPT2R), but the learned precision and/or the hub's RPE-gated gain appears to dilute the DA-RPE signature AE1 relies on and costs foraging and metacognition. Hunch for the next stage, to be tested not assumed: carry the binding hub forward alone, without learned precision.
