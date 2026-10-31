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
## 2026-10-31 (afternoon PT): AINF-R designs, knowledge gradient, N09/N13 scaffolds (dev seeds 2064-2079 only)
- **AINF-R is not passing yet.** New R tests (tests_v40.ts; the old AINF stays reported as failing): R (independent flips) d -0.46, R2 (relocating rich site) d -0.04, R3 (new half hidden rich/poor) d -0.56, R4 (new sites' expected value below the known option, so only info-seeking finds rich ones; hazard 1/2880) d **-0.75**. So the v4.0 default uncertainty term (centred posterior SD) *costs* food when information should pay.
- volLeak is not the cause (R3: volLeak 0 d -0.53, 0.002 d -0.87).
- **Mechanism found:** the centred-SD bonus pays for uncertainty about sites that are clearly poor. Replacing it with a knowledge gradient (value of information: Howard 1966; Frazier, Powell & Dayanik 2008; M40.kgK) flips the sign: R4 kgK 3/10/20/40 d -0.07/0.25/0.22/0.04; R3 kgK 1/3/6/10/20 d 0.18/0.40/0.10/0.19/-0.02. Ceiling is about d 0.4, below the 0.8 bar.
- KG at kgK 10 costs other items on 2064 (AE-1 1.10→0.33, thaler9 2.13→0.88, UAL 1.32→1.00), so it is **not adopted**: kgK default stays 0, kept as an option.
- Fresh-block reference (defaults, 2064-2079): thaler9 2.13, CQM12 1.98, AINF 0.07, AE-1 1.10, UAL 1.32; viability 0 deaths, 342 forages over 3 days. This is not a confirmation block for anything retuned on it.
- **N13 "free won't"** (Opts.veto own/shuffle/off; after the decision race the creature reads its own learned harm prediction for the chosen act and can cancel it and re-decide): own vs lens-shuffled d 0.57 (t 1.60), own vs off d 0.23. vetoThr 0.15 gives the same result; 0.5 is worse. Most harm is already priced into the race, so the veto is mostly redundant. Grade A is not met.
- **N09 curvature metacognition** (HOT-3 opt-out with an accuracy table split by curvature-peak flag): curv vs blind d -0.01, vs shuffled flag d 0.21. Null result: in this task the curvature carries no information about errors beyond confidence.

## 2026-10-31 (2:45 PM PT): AINF-R exploitation/belief bottleneck diagnosis (dev 2080-2095)
- Diagnostic (AINFR4D): the full creature visits new sites LESS than the epistemic lesion (37% vs 47% of forages; rich hits 24% vs 38%).
- Three causes found in the belief machinery:
  1. **Dream confabulation of certainty.** REM recombination writes pseudo-counts (dreamC 6) into never-visited sites, so their Beta SD (0.20) falls below that of visited sites (0.21-0.23).
  2. **Aleatoric/epistemic conflation.** Beta SD is largest for p≈0.5 sites, so the bonus favours noisy known sites over rich ones.
  3. **Volatility from raw |RPE|.** Outcome noise drives the leak, so beliefs forget at a half-life of about 170 ticks in a world with hazard 1/2880.
- Fixes are added as options, all off by default:
  - srcMon: real-outcome counts only (Johnson & Raye 1981).
  - epiN: count-based ignorance 0.5/sqrt(n+1).
  - volX: unexpected uncertainty = |RPE| minus 2w(1-w) (Yu & Dayan 2005).
- AINFR4 d results: default −0.77; srcMon −0.55; srcMon+epiN −0.36; srcMon+epiN+volLeak 0 **+0.12**; srcMon+epiN+volX+volLeak 0.03 +0.22.
- The epistemic lesion still explores enough by decision noise (lesion 0.59 per forage), so directed info-seeking has almost no margin here. Not passing.

## 2026-10-31 (2:50 PM PT): first-principles pass (see FIRST-PRINCIPLES.md)
- N13b integrity-gated veto on fresh 2080-2095: own vs lens-shuffled d 0.08, vs off 0.07, vs integrity-shuffled 0.04 (vetoI 3/10 similar). The 2064 d 0.57 did not replicate. N13 is null.
- HOT-1 and HOT-3R mechanisms pass in isolation with held-out confirmation (d 5-11 and d ≈ 2), and fail when integrated (d −0.17; 0.37/0.01). The shared cause is the bottom-up cortical code (about 25% wrong-class percepts vs about 5% from raw input).

## 2026-10-31 (afternoon PT): cortical cue encoding (first principles), dev 2145-2224
- **Diagnosis.** On the HOT1 stream (seeds 2145-2152), raw-input argmax is 91% correct, the creature's `recon` percept 64%, and a batch ridge decoder on the same CTX rates 69%. So the information is lost in the adaptation-normalised cortical rates, not in the read-out. Holding the stimulus for 2 ticks drops it to 29%: transient dynamics.
- **Module** (fp/l4.ts): a static L4-like input layer. Labelled-line copies plus a random rectified expansion of the module's own receptor channels, appended to the read-out features.
  - Isolated: 88.9% vs raw 90.2% (2145) and 88.7% vs 90.7% (held-out 2161), within the 3-point goal.
  - In the creature: 89% vs 91%.
- **Integrated (l4 now default ON):**
  - HOT-1: 2177 d 1.54, t 4.35; held-out 2193 **d 3.41, t 9.66**. Without l4, 2177 gave d 0.48. **HOT-1 now passes dev and held-out.**
  - HOT-3R: d 0.63 / 0.27 (was 0.36 / −0.21). Not passing: the metacognitive confidence still discriminates trials poorly.
  - RPT-2: d 0.56, unchanged. Its XOR read-out does not use these features.
- **AE-1 + volX:**
  - 2145: d 0.49 → 0.94. Held-out 2161: 0.26 → 0.62. 2209 with l4: 0.58 → 0.50.
  - Mixed, so volX stays off.
  - **Flag:** AE-1 at defaults is only d 0.26-0.58 on these three fresh blocks, so the earlier 0.88-1.24 margin does not replicate.
- **Recheck on 2209-2224, defaults vs l4+volX:** thaler9 2.25 → 1.62, CQM12 1.49 → 1.50, UAL 2.25 → 1.98, AINF 0.07 → −0.02. Viability 318 forages, 0 deaths in both.
