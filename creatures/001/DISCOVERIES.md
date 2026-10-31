# DISCOVERIES (Creature #1, v4.0 branch)

Open exploration log. Entries here are **observations, not claims**: no gates, no thresholds. Each entry gives the mind version, the opts/tuning env, the seed(s) to replay it and what was seen. The official list scoring (Butlin 14, 10 frameworks, CQM 25, VIAB) stays separate, preregistered and measured.
Replay: `ORG_MIND=<mind> V40TUNE='<json>' NSEEDS=1 SEEDBASE=<seed> node run.js tune <KEY>` (bundle of organism/run_v39.ts on the v4.0 branch).

## Experiment toggles on the v4.0 branch
| Toggle | What it does | Default |
|---|---|---|
| M40.uK / mK | single value-plus-uncertainty drive (replaces 5 curiosity terms) | 1.0 / 0.5 |
| M40.dreamC / dreamLr | REM dreams write a low-confidence belief instead of a value | 2 / 0.25 |
| M40.tempSD | per-individual curiosity temperament; drawn from the creature's own Q3 Born-rule measurements when noise = quantum | 0.25 |
| M40.turn | sleep-time synaptic turnover (prune the weakest spine, regrow a random one) | 0 (exploratory) |

## Log
(entries appended as runs land; dev seeds 2000+ only)

### 2026-10-31 population dev runs (seeds 2000-2015, 16 per arm; tune mode; 3-day viability probe `viab_dev.ts`)
Controls via `V40OPTS` (busShuffle, selfBody, glitchInj, glitchNoise, neoRandom, curv clamp, affect lesions, develop) and `V40TUNE`.
- **Grown wiring forages far more than i.i.d. wiring**: 320 vs 248 food in 3 days (d 1.10, t 3.11). Now the v4.0 default (`develop:false` = i.i.d. control).
- **v4.0 i.i.d. cost foraging vs v3.9** (248 vs 318, d 1.93). Grown wiring plus halved module gains recovers it (335).
- **Module gains at the old values cost food**; halving them (busOut .15, insK .15, cautK .25, simK .3, markK .05, affK .5) makes the full system ≥ modules-off (335 vs 327, n.s.). Seed 2007 1-day smoke: full 98 vs v40all 88 (was 57 vs 75).
- **Affect dysregulation costs food** (dysreg lesion 363 vs 335, t −1.7 n.s.; affect-all lesion +27 on i.i.d., t −2.1). It is a natural cost, left as is (no shaping).
- **CQM12 was degenerate in v4.0 (d = 0 exactly)**: dreams write a Beta belief, not wSite, and the test read wSite. Test now reads `valueEst(k)` (the value the chooser uses; identical to wSite before v4.0). With dreamC 4: d 0.99–1.56.
- **activeInference shows no v4.0 effect** (d ≈ 0 for all uK 0.5–6, belief leak `forget` 0.0005–0.01). The depleting-world gain in v3.9 came from terms the unified uncertainty term replaced. Open problem; `forget` is left in at 0.
- Personality lesion was a no-op over 3 days (drift is tiny). It now means "population-mean temperament".
- Every per-module control was viable (0 deaths in any arm). No single module control changed food significantly (|t| < 1.5); glitchNoise (noise bursts in world senses) foraged *more* (277 vs 248, n.s.).
