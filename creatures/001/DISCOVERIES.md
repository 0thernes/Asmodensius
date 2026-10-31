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

### 2026-10-31 activeInference via Tsotchke ideas (dev 2000-2015)
- **Eshkol `vm_expected_free_energy` (pragmatic + epistemic split):** I added the entropy of each site's hidden depleted/recovered state to the epistemic term (`eK`). AINF did not improve (eK 0.3: d −0.05; eK 1–3: the full arm forages *less*, 63–67 vs 68.75 lesioned). Re-checking uncertain sites wastes trips.
- **Posterior sampling from the creature's own entropy stream** (Born-rule Q3 / QRNG lineage, `tsK`): AINF +2.7 rewards, but d only 0.13 (between-seed SD about 20), and AE-1 drops to d 0.57. Left OFF.
- **The real cause is likely a ceiling, not missing curiosity.** v4.0 with grown wiring and the epistemic term lesioned already gets 68.75 rewards in the depleting world, versus v3.9 full at 60.7. The lesion leaves little to gain.
- **CQM12 margin:** dreamC 6 with dreamLr 0.75 gives d 1.59 (was 0.99), with thaler9 1.83.

### 2026-10-31 AE-1 replication failure: diagnosis
- The full creature, not the lesion, was the problem. The Beta belief (blended into value via mK) never forgot, so after each reversal it dragged value back to the stale average. Volatility-scaled forgetting (volLeak 0.01) fixed it: held-out 2048–2063 d 1.24.
- Affect attitudes and "wanting" learned from raw outcomes, bypassing the RPE system. They are now gated by the phasic RPE.
