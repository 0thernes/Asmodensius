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

## 2026-10-31 3:02 PM PT turn (dev seeds 2225–2368)
- HOT3RM (new, disclosed): dev 2257 d 1.41 t 3.98 but held-out 2273 d 0.53 t 0.65 → not confirmed. Original HOT-3 stays failing.
- RPT-2 isolated dendritic module: dev 2289 d 0.87 t 2.47 (fails t), held-out 2305 d 1.43 t 4.05. RPT2R in creature (new, disclosed): null at T=1/3/5. Original RPT-2 stays failing.
- AE-1 diagnosis: night (no foraging) covers ~1/3 of the scored window and the first reversal is slept through with replay of the old contingency; the RPE effect is confined to daytime post-reversal bins. Recheck with l4 alone: 2321 AE-1 d 1.39 t 3.92, held-out 2353 d 0.81 t 2.29 → not confirmed.
- l4-only recheck passes held on both blocks: thaler9, CQM12, UAL, viability (0 deaths). AINF null.

## 2026-10-31 3:29 PM PT turn
- AE-1 is insensitive to dream replay (identical with dreamLr 0) — the replay/night account is falsified. Forget 0.001 passed dev 2465 (0.98/2.77) but failed held-out 2481 (0.56/1.57). AE1R (new) fails dev.
- Dendritic threshold does not create cross-module conjunctions; features are linearly encoded (0.95+) but XOR stays at chance.
- Learning-progress curiosity does not move AINF.

## 2026-10-31 3:48 PM PT turn
- AE-1 real bottleneck = exploitation (near-uniform choice despite accurate values). uK 1→0.3 passes the ORIGINAL AE-1 on dev 2577 and held-out 2593, 2609. Recheck 2609: thaler9 1.66/4.70, CQM12 1.62/4.57, UAL 1.08/3.07, AE-1 1.36/3.84, AINF −0.01/−0.02, 308 forages, 0 deaths. Default changed.
- Apical-gain conjunction passes alone (d 5.28 / 4.00) but not in the creature: the cross-module synapses carry almost no b information.

## 2026-10-31 3:55 PM PT turn
- uK 0.3 confirmed on fresh block 2625: every pass item plus viability passes.
- Feedforward-inhibition centring makes unselective excitatory cross wiring conjunctive in isolation (d ~10) but not in the creature (null on 2673). Hebbian self-organisation fails alone.

## 2026-10-31 4:02 PM PT turn
- RPT-2 loss localised: the CTX soma is driven by a slow NMDA persistence current (~60× the feedforward drive), so cross-module coincidence cannot gate spiking. b itself is transmitted. Apical gating variants are null in the creature (2705).
- HOT3RM at uK 0.3: passes both controls on 2737 and 2753, fails on 2721. Provisional.

## 2026-10-31 4:06 PM PT turn
- Onset reset of slow NMDA removes persistence (|nmdaS| 8.97→0.44) but does not create a×b conjunctions; RPT2R null (2785). Not adopted.
- HOT3RM held-out 2769: passes vs random, fails vs shuffled (t 2.33). Not confirmed.

## 4:08 PM PT turn
- RPT-2 additivity is due to b-invariant, sparse cross input in a balanced linear regime (not threshold/saturation).
- PROJ-R, CQM18-R (new, disclosed), GWT-3R and CQM08R pass on 2801/2817/2833 (see FIRST-PRINCIPLES.md).
- HOT3RM variance comes from between-seed baseline SD (paired dz≈1.5, unpaired block d≈1).

## 4:13 PM PT turn
- Audit: GWT-3R, PROJ-R and CQM08R survive matched-capacity or graded controls. CQM18-R does not (recovery = readout relearning only) and is demoted.
- RPT-2: signed selective cross input works in isolation but not in the creature (best d 0.92, t 2.59). The missing ingredient is an operating-point nonlinearity.
- HOT3RM paired passes on fresh held-out 2881 (dz 1.51, t 6.05).

## 4:20 PM PT turn
- CQM10 failure is over-eating (hyperglycaemia 33%), not under-foraging. An insulin→AgRP gate cuts it to 13% (d −3.27 → −0.64); not adopted.
- CQM16 already passes on fresh dev 2913 (d 6.69).
- RPT-2: a rest-rectified dendrite with xsel puts XOR information into the cortex (offline 0.74), but RPT2R's online readout does not extract it.

## 4:48 PM PT: direction change to CORE-ARCHITECTURE.md; v5-core vs v4.0 (dev 2993, 16 seeds, d/t vs each test's own control)
| Test | v4.0 d/t | v5-core d/t | pass v4/v5 |
|---|---|---|---|
| AE1 | 0.81/2.29 | 1.47/4.15 | ✗/✓ |
| AINF | 0.01/0.03 | -0.03/-0.10 | ✗/✗ |
| C03R | -1.65/-4.67 | -1.18/-3.34 | ✗/✗ |
| C08R | 6.76/19.11 | 10.24/28.95 | ✓/✓ |
| C10 | -4.09/-11.58 | -1.14/-3.23 | ✗/✗ |
| C16 | 42.27/119.56 | 9.99/28.25 | ✓/✓ |
| GWT3R | 8.76/24.77 | 9.70/27.44 | ✓/✓ |
| HOT1 | 1.91/5.41 | 2.09/5.90 | ✓/✓ |
| HOT3RM | 0.61/1.72 | 0.59/1.67 | ✗/✗ |
| HOT3RM-P | 0.99/3.97 | 0.92/3.69 | ✓/✓ |
| thaler9 | 1.75/4.95 | 2.33/6.60 | ✓/✓ |
| CQM12 | 1.39/3.92 | 1.76/4.99 | ✓/✓ |
| PROJR | 5.45/15.42 | 3.36/9.49 | ✓/✓ |
| RPT2R | -0.08/-0.23 | 0.78/2.20 | ✗/✗ |
| UAL | 1.40/3.95 | 1.36/3.84 | ✓/✓ |
| viability (forages, deaths) | 322, 0 | 278, 0 |  |
v5-core = ORG_V5=1 (xsel 3, dTh 0+, insS). Single dev block; no held-out yet. Earlier this turn (before the change): the CQM16 audit (P-only and gain 0.25 controls n.s., so the test measures any insulin feedback, not allostasis); the q12 XOR 0.74 did not replicate over 8 seeds (0.54), so there is no online/offline gap; the CQM10 residual is meal absorption with insulin saturated at its ceiling plus an ungated ghrelin/HYP term; LTC isolated beats oracle fixed τ (2945 d 2.27, 2961 d 3.19); EVO-S designed, not run.

## Nov 1 PHT: fresh dev block 3025-3040 (16 seeds). v4.0 vs v5-core vs v5.1
v5-core (ORG_V5=1) vs v4.0:
| Test | v4.0 d/t | v5-core d/t | pass v4/v5 |
|---|---|---|---|
| AE1 | 1.58/4.46 | 1.15/3.25 | ✓/✓ |
| AINF | -0.14/-0.40 | 0.04/0.10 | ✗/✗ |
| C03R | -1.63/-4.60 | -2.12/-6.00 | ✗/✗ |
| C08R | 8.16/23.08 | 11.10/31.41 | ✓/✓ |
| C10 | -3.39/-9.58 | -0.81/-2.30 | ✗/✗ |
| C16 | 72.89/206.15 | 9.33/26.39 | ✓/✓ |
| C16R | 0.00/0.00 | 0.00/0.00 | ✗/✗ |
| GWT3R | 10.49/29.67 | 9.28/26.24 | ✓/✓ |
| HOT1 | 1.73/4.91 | 3.00/8.49 | ✓/✓ |
| HOT3RM | 0.74/2.09 | 0.62/1.76 | ✗/✗ |
| HOT3RM-P | 0.95/3.79 | 1.02/4.07 | ✓/✓ |
| thaler9 | 2.67/7.56 | 2.02/5.72 | ✓/✓ |
| CQM12 | 1.75/4.95 | 1.52/4.29 | ✓/✓ |
| PROJR | 4.52/12.79 | 4.19/11.85 | ✓/✓ |
| RPT2R | -0.09/-0.26 | -0.30/-0.85 | ✗/✗ |
| UAL | 1.09/3.09 | 1.03/2.90 | ✓/✓ |
| viability (forages, deaths) | 320, 0 | 264, 0 |  |

v5.1 (ORG_V5=2: hebX, mmG, zr, ltcC, ceph) vs v4.0 (column 3 = v5.1):
| Test | v4.0 d/t | v5-core d/t | pass v4/v5 |
|---|---|---|---|
| AE1 | 1.58/4.46 | 0.24/0.68 | ✓/✗ |
| AINF | -0.14/-0.40 | 0.01/0.02 | ✗/✗ |
| C03R | -1.63/-4.60 | -2.34/-6.61 | ✗/✗ |
| C08R | 8.16/23.08 | 8.43/23.84 | ✓/✓ |
| C10 | -3.39/-9.58 | -0.87/-2.46 | ✗/✗ |
| C16 | 72.89/206.15 | 9.63/27.24 | ✓/✓ |
| C16R | 0.00/0.00 | 0.12/0.34 | ✗/✗ |
| GWT3R | 10.49/29.67 | 4.49/12.71 | ✓/✓ |
| HOT1 | 1.73/4.91 | 1.47/4.16 | ✓/✓ |
| HOT3RM | 0.74/2.09 | 0.21/0.58 | ✗/✗ |
| HOT3RM-P | 0.95/3.79 | 0.21/0.84 | ✓/✗ |
| thaler9 | 2.67/7.56 | 1.14/3.23 | ✓/✓ |
| CQM12 | 1.75/4.95 | 1.23/3.48 | ✓/✓ |
| PROJR | 4.52/12.79 | 5.64/15.94 | ✓/✓ |
| RPT2R | -0.09/-0.26 | -0.32/-0.91 | ✗/✗ |
| UAL | 1.09/3.09 | 1.15/3.24 | ✓/✓ |
| viability (forages, deaths) | 320, 0 | 270, 0 |  |

Reading:
- v5-core is at parity with v4.0. It passes the same 10 tests and none flip.
- v5.1 loses AE1 and HOT3RM-P and weakens GWT3R and thaler9. The learned and normalized pieces do not yet help; they stay behind the flag and are not adopted.
- CQM16-R (anticipation vs reactive feedback, ceph lesion): d 0.12, a null. v4.0 and v5-core have no cephalic forecast, so they score 0 by construction. The creature does not yet anticipate meals.
- Foraging: v5 270 and v5.1 264 vs v4.0 320, with 0 deaths in every arm. This is consistent with less over-eating (insS; C10 d −3.4 → −0.8), not with starvation.

## Held-out 3041-3056 (B17, chosen before the run): v5.1 vs v4.0 (column 3 = v5.1)
| Test | v4.0 d/t | v5-core d/t | pass v4/v5 |
|---|---|---|---|
| AE1 | 1.29/3.65 | 1.63/4.61 | ✓/✓ |
| viability (forages, deaths) | 316, 0 | 274, 0 |  |
| AINF | 0.00/0.00 | -0.03/-0.09 | ✗/✗ |
| C03R | -2.20/-6.23 | -2.17/-6.15 | ✗/✗ |
| C08R | 5.86/16.59 | 9.46/26.75 | ✓/✓ |
| C10 | -3.51/-9.94 | -1.01/-2.86 | ✗/✗ |
| C16 | 11.27/31.89 | 11.59/32.77 | ✓/✓ |
| C16R | 0.00/0.00 | 0.05/0.13 | ✗/✗ |
| GWT3R | 14.36/40.61 | 3.06/8.67 | ✓/✓ |
| HOT1 | 1.32/3.74 | 0.92/2.60 | ✓/✗ |
| HOT3RM | 0.39/1.11 | 0.38/1.08 | ✗/✗ |
| HOT3RM-P | 0.50/1.99 | 1.06/4.26 | ✗/✓ |
| thaler9 | 2.07/5.85 | 1.38/3.91 | ✓/✓ |
| CQM12 | 1.99/5.63 | 1.20/3.39 | ✓/✓ |
| PROJR | 3.74/10.59 | 4.23/11.97 | ✓/✓ |
| RPT2R | 0.24/0.68 | -0.59/-1.68 | ✗/✗ |
| UAL | 1.75/4.94 | 1.45/4.10 | ✓/✓ |

Reading: on held-out data, v5.1 also ties v4.0 overall. HOT1 is lost (t 2.60). HOT3RM-P is gained (v4.0 fails it on this block). GWT3R shrinks a lot (14.4 to 3.1) but still passes. CQM16-R is null again (d 0.05). Viability: v4.0 316 forages, v5.1 274, 0 deaths in both. Verdict: v5-core is the candidate; v5.1 stays behind the flag. EVO-S baselines are deferred.

## Nov 1 PHT: B18 TPC dev block 3077-3092 (column 1 = v5-core, column 2 = v5.2 = v5-core + TPC; the table's header labels are generic)
| Test | v5-core d/t | v5.2 TPC d/t | pass v5/v5.2 |
|---|---|---|---|
| AE1 | 0.45/1.28 | 1.30/3.67 | ✗/✓ |
| viability (forages, deaths) | 264, 0 | 267, 0 |  |
| AINF | 0.03/0.08 | -0.08/-0.22 | ✗/✗ |
| C03R | -2.08/-5.87 | -2.12/-5.99 | ✗/✗ |
| C08R | 6.48/18.32 | 10.89/30.80 | ✓/✓ |
| C10 | -0.76/-2.14 | -1.11/-3.13 | ✗/✗ |
| C16 | 8.45/23.90 | 8.96/25.34 | ✓/✓ |
| C16R | 0.00/0.00 | -0.01/-0.02 | ✗/✗ |
| GWT3R | 8.80/24.90 | 10.95/30.96 | ✓/✓ |
| HOT1 | 2.41/6.83 | 2.33/6.59 | ✓/✓ |
| HOT3RM | 0.92/2.60 | 0.93/2.63 | ✗/✗ |
| HOT3RM-P | 1.35/5.41 | 2.12/8.49 | ✓/✓ |
| thaler9 | 2.27/6.41 | 1.95/5.51 | ✓/✓ |
| CQM12 | 1.14/3.22 | 0.99/2.80 | ✓/✓ |
| PROJR | 4.20/11.87 | 5.43/15.35 | ✓/✓ |
| RPT2R | -0.48/-1.34 | -0.31/-0.87 | ✗/✗ |
| UAL | 1.67/4.72 | 1.64/4.63 | ✓/✓ |

Reading: TPC moves none of the failing set (C16R −0.01, C10 −1.11, AINF, RPT2R, C03R, HOT3RM all unchanged). AE1 passes in v5.2 on dev only; check against held-out 3093.

EVO-S baselines (3061-3076, 16 seeds; v5-core):
Caveat: CQM03's control (births on a fixed schedule) is 0 by construction, so d 17 is degenerate and not a valid pass. CQM01 passes; CQM04 does not.
