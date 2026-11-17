# Changelog

## Governor finals (2026-11-16, binding: 96 fresh seeds per decision, NI margin -0.3)
- AE1 v07 **REJECT** (seeds 752-847): target AE1 delta-d +0.162 [-0.111, +0.435], no gain; GWT2 NI lower CI -0.328 < -0.3.
- CQM10 v01 K0.5 **REJECT** (seeds 848-943): C10 gain +0.834 [+0.577, +1.117], but NI fails on HOT3RM, AE1, AE2 (CI [-0.577, -0.049]) and RPT2RL5.
- Block 736-751 voided (aborted single-block start; consumed, no decision). Combo A unchanged; AE1 still fails.

## Unreleased: Dome replay viewer (2026-11-17)
- `docs/viewer/`: static interactive replay viewer (GitHub Pages ready). Replays recorded numbers only; no organism code in the browser.
- `viewer/tools/record.ts` + `record_all.sh`: record Combo A runs headless (refuses unless `organism.ts` is byte-identical to `bc6ad6a`
  and seeds are in 500-703). Library: dome seeds 500-590 baseline + seed 540 x {lush, sparse, harsh, hazard, grazers, hell}.
- `viewer/tools/test_viewer.mjs`: headless Chrome check (desktop + mobile): loads runs, play, scrub, step, zoom, pan, pick, overlays,
  charts, compare, no console errors.
- Supersedes the MSI viewer WIP in `imports/msi-viewer-wip-2026-11-12/` for the purpose of testing (that patch stays unapplied).
- Status unchanged: Combo A official has 6 of 7 claims at grade A plus GWT2 must-hold at A; **AE1 does not pass** (0.73 / 5.48).

## Unreleased: v4.1 (local branch, not pushed)
Phase 0 (hygiene) and Phase 1 (instruments) of the v4.1 plan. The organism code is unchanged: the identity gate shows
Combo A bit-identical to the frozen SC-PORT output on seeds 540-543.
- `SEEDS.md` seed ledger; `run_v41.ts` refuses to start without `MODE`, `ARM` and `SEEDBASE`, and keeps dev work on 500-999.
- Reproducible bundles (`specialists/tools/build_bundle.sh`): fixed build path per commit, pinned bun 1.4.4, sha256 record.
- Identity gate (`specialists/tools/identity_gate.sh`) with goldens made from `bc6ad6a`.
- Energy meter in every `run_v41` result: metabolic heat (kJ), organism-ticks, CPU-seconds, daily energy-ledger check.
- Instruments (`tests_v41.ts`): PAUSE, PERSIST (persistence baseline), LASR (action grounding), STAGES (3 life stages).
- Governor v0 (`specialists/tools/governor.py`): fresh 16-seed blocks from 704-999, paired non-inferiority, gain per energy.
- Lab fixes: Moonlab wasm path, conformance from any cwd, smoke argv guards; lab dev seeds moved from 2000+ to 500+.
- Repo: package.json, tsconfig, bun.lock, .gitattributes, .editorconfig, SECURITY.md, CODE_OF_CONDUCT.md; dead runners to `archive/`.
- `imports/msi-viewer-wip-2026-11-12/`: the MSI copy's uncommitted viewer work, copied read-only for review.

## SC-PORT Combo A official (v4.0 line; prereg frozen cb3aaed, code pin bc6ad6a; scored 6973f19)
- Seeds 1112-1159 (n = 48), AE1 pooled with 1160-1223 (n = 112).
- 6 of 7 claims grade A: RPT2R 3.87/19.0, RPT2RL5 3.17/15.5, RPT1 0.92/4.5, UAL 1.11/5.5, HOT3RM 1.43/7.0, AE2 2.65/13.0.
- AE1 fail (pooled 0.73/5.48; d below 0.8). GWT2 must-hold A 7.73/37.9. AINF, C10, C16R reported, all fail.
- Caveats in the prereg: HOT-3 confidence still harness-trained (integration (a) not passed); hub and body model came from flag screens.

## Dev rounds B28-B29 (v6.1, v6.2; dev only, not frozen)
- v6.1 synaptic scaling by fan-in and v6.2 fan-in pooled readouts did not meet their goals on dev seeds (negative results, kept on record in `preregistrations/v4.0.md`).

## Round 21 official (OFFICIAL-R21, prereg f7ff08d; seeds 1064-1111)
- Arm A v5.7b: Butlin 9/14, frameworks 6/10, CQM 17/25 (with disclosed R variants 12/14, 8/10, 20/25).
- Arm D v5.7d: Butlin 9/14, frameworks 5/10, CQM 17/25.

## Round 20 official (v3.9; seeds 1016-1063)
- Butlin 9/14, frameworks 7/10, CQM 17/25. Old test seeds 1000-1015 retired.

## Round 19: organism v3.8a (energy budget, fasting physiology, viability tests, range-adapted epistemic value)
Code and prereg were frozen before any test-seed run. The v3.8 freeze is 14c377e. The v3.8a amendment (bb5846f) replaced the 30-day lifespan criterion and added fasting physiology. The aborted first launch is disclosed in the prereg.

**Energy**
- Mechanisms: leptin/AgRP forage drive (fK 4), adaptive thermogenesis (thK 1, floor 0.6), muscle-accretion saturation.
- Fasting: glycogen-gated PEPCK gluconeogenesis, phase-II proteolysis, CPT1 ketogenesis, brain ketone priority, renal ketone reabsorption, FFA feedback on lipolysis.
- Viability results:
  - VIAB-a (steady state with food) PASS: fat slope 0.40 [0.21, 0.59]/d; glycogen slope 0.055 [−0.015, 0.125]/d; imbalance 3%; 0/30 deaths.
  - VIAB-b (starvation) PASS: 16/16 seeds show the stages in order (forage up 0.5 d, glycogen ~0.9 d, ketosis ~2 d, torpor 2–3 d) and die at ~6.7 d, inside the reserve-scaled window.
  - VIAB-c (refeeding) PASS: 16/16 recovered; d 52.8, t 144.5 against no refeed.
- Before v3.8: v3.7 died at a median of 11–17 d with ample food. With no food it died of hypoglycaemia at 1.6 d with about 70% of its fat left.

**Methodology**
- With n=16 the SE of d is about 0.4, so items near d≈1 flip between blocks, and picking the best of several variants on one block produces a winner's curse.
- New rule: a mechanism is frozen only if d ≥ 1.0 and t ≥ 2.75 on both dev blocks (2000–2015 and 2016–2031).

**efe conflict**
- Fix: min-referenced epistemic value, efeC 0.5 (range adaptation).
- On dev it held thaler9 (1.05/1.65) and CQM12 (1.69/1.31), with AINF at 0.78/0.88.
- On test, thaler9 d 0.64, CQM12 d 0.68 and AINF d 0.75 all FAIL. Non-replication persists even under the two-block rule.

**Test results**
- Rollups: Butlin 8/14, frameworks 5/10, CQM 17/25.
- Recovered: ual (d 1.29, t 3.66).
- Lost:
  - CQM01: too few deaths for the heredity metric to be meaningful.
  - ctm: 0.958 is over the ceiling.
- Still failing:
  - AST-1 (d 0.93, t 2.63)
  - RPT-2 (d 0.28)
  - HOT-1 (d 0.86, t 2.43)
  - HOT-3 (d −0.12 / −0.42)
  - AE-1 (d 0.25)
  - RPTLATE
- RPT-1 passes (d 4.10).
- No new RPT-2/HOT mechanism was attempted this round.
## Round 18: organism v3.7 (slow NMDA recurrence under divisive inhibition, slow CTX→THAL feedback, dendritic plateau, depletion forward model in EFE choice, ignition feature for confidence; R-variants K1aR/K1cR/CQM03R; Page PRNG snapshot-capable); prereg + code frozen 14cc830, test seeds 1000–1015
- Rollups: Butlin 8/14 (v3.6: 9/14), frameworks 5/10, CQM 18/25; v3.7 items 2/3.
- Passes:
  - RPT-1 (d 3.42, t 9.68)
  - K1aR (d 7.41, t 20.95; 0.82, non-ceiling)
  - K1cR (d 10.42, t 29.46)
  - CQM03 (0.920, now under the ceiling; d 5.99)
  - ctm (0.943; d 14.33)
- Lost (v3.6 pass → v3.7 fail):
  - AST-1 (d 0.86, t 2.44)
  - ual (d 0.74, t 2.09)
  - CQM12 (d 0.80, t 2.25), just under t
- Still failing:
  - RPT-2 (d −0.29)
  - RPTLATE: late response negative (−7e-4); vs CTX→THAL d −0.90
  - HOT-1 (d −0.01)
  - HOT-3 (d 0.14 / 0.48)
  - AE-1 (d 0.17)
  - activeInference (d 0.35, t 0.98)
  - thaler9 (d 0.04)
  - CQM04 (d 0.17; test economics)
  - CQM03R (d −2.82: random birth counts track food better than the organism)
- thaler9: the v3.6 prereg figure came from pre-freeze code. On tuning seeds only efeK=0 restores it (d 2.33), so the information-gain drive masks dream novelty. efeK was deliberately left unchanged (see prereg v3.7 §C).
- Lab tab: tested in headless Chrome against the live viewer on :8787. Cross-origin, every request fails with the CORS message, because the viewer sends no Access-Control-Allow-Origin header. Through a same-origin proxy, all 4 endpoints render. The live c0 is depleted (energy −643, ATP −8930, asleep).
## Round 17: organism v3.6 (steering API, new mechanisms, lab-handoff mechanisms, WASM backends); prereg + code frozen 9050c4f, test seeds 1000–1015
- v3.1 suite: Butlin 9/14 (v3.5: 8/14), frameworks 5/10 (5/10), CQM 18/25 (17/25); 27 of 41 d/t items pass (v3.5: 25/41).
- New passes:
  - CQM12 (−0.0117 vs −0.0228; d 1.21, t 3.41), from schema extraction.
  - CQM06 (d 1.01, t 2.85). No mechanism targeted CQM06.
  - AST-1 (d 1.33, t 3.75). The adaptive Kalman ships off because it hurt on tuning seeds, so this pass does not come from a targeted mechanism.
- Lost to the non-ceiling rule:
  - CQM03 (0.958)
  - K1a and K1c (0.962)
- Still failing:
  - HOT-1 (d 0.45, t 1.28)
  - HOT-3 (d −0.06 / 0.39)
  - RPT-2 (d 0.26)
  - AE-1 (d 0.47, t 1.33)
  - activeInference (d 0.19)
  - thaler9 (d 0.01; tuning showed d 1.79, which did not replicate)
  - CQM04 (d 0.30)
  - CQM08 (ceiling)
  - GWT-3 and ctm (ceiling)
- New v3.6 items, 7/8 pass:
  - GWT-3R (d 5.68), ctm-R (d 5.21) and CQM08R (d 12.05): degraded-stimulus variants; the originals stay on record.
  - SNAP: 16/16.
  - NOISESIGN: |P(+)−0.5| is 0.022 vs 0.295 for the raw bit.
  - LIGHT: passes.
  - INSGLC: 0.872 vs 0.494 with the visceral afferent cut (d 3.74, t 10.58).
  - RPTLATE fails: there is no late evoked phase. The slow NMDA current that creates one saturates cortex, so it ships off.
- WASM: Moonlab and Eshkol are opt-in backends (organism/backends.ts).
  - Moonlab probabilities match the TS circuit to 6.7e-16 on 5000 circuits.
  - The Eshkol flip-flop has 0/2000 mismatches.
  - The 2-day full state is identical with both backends on seeds 1000–1003 (results/wasm_equiv_v36.json).
- The inspector has a Lab tab that calls the dome viewer's /inspect endpoint.
- The summarizer's LTC rollup now counts only V3.4- items (e8a035c).
## Round 16: organism v3.5 (metacognition, agency and interoception mechanisms); prereg + code frozen 1da03c4, test seeds 1000–1015
- v3.1 suite: Butlin 8/14 (v3.4: 8/14), frameworks 5/10 (5/10), CQM 17/25 (16/25); 25 of 41 d/t items pass (v3.4: 24/41).
- New passes: HOT-2 (AUROC 0.660 vs 0.492; d 2.94, t 8.33), GWT-4 (d 13.04), ual (d 1.57, t 4.44), CQM09 (forecast error 0.68 vs persistence 1.33; d 8.06, t 22.80), CQM14 (0.776 vs 0.230; d 7.70, t 21.79).
- Lost: GWT-3 and ctm now fail the non-ceiling rule (the organism stays awake through long protocols). CQM08 is lost (d 0.61, t 1.72) and AST-1 is lost (d 0.92, t 2.59).
- Still failing: HOT-1 (d 0.66, t 1.86), HOT-3 (d −0.15), RPT-2 (d 0.26), AE-1 (d 0.17), activeInference (d 0.09), thaler9 (d 0.58), CQM04 (d −0.13), CQM06 (d 0.69, t 1.96), CQM12 (d −0.82).
- K1a and K1c pass (0.944 < ceiling); K1b, K1d and K1e fail. K2 passes. LTC learned and hand-set vs fixed: 0/5 each (L4 is hurt again). LTC is now off by default.
- Separate item (34563ba): real Eshkol VM and Moonlab compiled to WASM, with a node smoke test and a browser demo in creatures/001/wasm.
## Round 10 scoring (2026-10-29): prereg v2.3 LIVE tests on the rendered creature, 3 of 5 pass
- 80/80 runs (seeds 1000–1015 × full, hab, circ, circbody, chain ablations) scored with the committed harness/score23.ts, unchanged.
- PASS LIVE-28 circadian entrainment (PLV 0.987 vs 0.752 circ-ablated; d 1.37, t 3.86). PASS LIVE-28B circadian drives the body (r 0.887 vs 0.107; d 5.11, t 14.46). PASS LIVE-47 tamper-evident lineage (1.000 vs 0.000; every tamper detected, none with the chain ablated).
- **FAIL** LIVE-80 habituation in the body (0.287 vs 0.392 hab-ablated; d −0.64, t −1.81: the ablated body habituates more). **FAIL** LIVE-81 stimulus-specific habituation (0.522 vs 0.357; d 0.49, t 1.39).
- Scores: creatures/001/results/v23_scores.json and v23_scores.txt; added to results.json as `v23` and to the site Results page.
## Round 15: organism v3.4 (plastic topographic cortex, learned-gate LTC via e-prop); frozen a85966e, test seeds 1000–1015
- v3.1 suite on the v3.4 organism: Butlin 8/14 (v3.1: 4/14), frameworks 5/10, CQM 16/25; 24 of 41 d/t items pass (v3.1: 22/41). New passes include RPT-1, GWT-1, GWT-2 and GWT-3. thaler9 is lost (d 0.62). RPT-2, HOT-1/2/3 and AE-1 still fail, and PROJ, CQM10 and CQM18 fail the ceiling rule.
- Cortex: K1 module-0 accuracy is 0.957 vs 0.527 for the v3.1 cortex, but K1a–e all fail the ceiling rule. No dev waves (0.962) and E/I loops lesioned (1.000) are not worse. K2 persistence passes (0.566 vs 0.222 with NMDA lesioned; d 5.58, t 15.77).
- LTC: learned-vs-fixed 0/5 and hand-set-vs-fixed 0/5. Both arms hurt L4 delayed recall (learned d −1.15, t −3.26). Verdict: no benefit.
- The v3.0 regression (run_v34reg, reported but not counted) was not run in this round.
## Round 14: organism v3.1 / v3.2 / v3.3 (preregistered; tuning on seeds 2000–2015, testing on 1000–1015)
- v3.1: added a Mind layer to organism.ts with workspace/ignition/broadcast, a Kalman attention schema, metacognitive opt-out, NLMS predictive coding, Kuramoto binding, TD(λ) value, an efference/forward model, an interoceptive forecaster, model-based planning, awake/NREM replay, topographic sensory wiring, tissue integrity/repair, and an evolving genome. 22 of 41 d/t-tested items pass (24 of 45 rows, counting the CQM24 and CQM25 bookkeeping rows). Cortical classification items are at chance (RPT-1/2, GWT-2/3, HOT-1/2/3, AE-1). PROJ fails on ceiling. CQM09 does worse than a persistence forecast.
- v3.2: C2 now passes (d 2.37, t 6.72 vs forced wake; d 1.29, t 3.65 vs no replay). C8b still fails (d 0.40). New regression: the C9 quantum-vs-classical equivalence fails (d 0.66). Found a v3.0 bug: the raphe drive was inside a comment, so 5-HT was ≈ 0. The v3.0 results stay on record unchanged.
- v3.3: added liquid time-constant spiking neurons (opt-in `ltc`), with τ gated by synaptic input, ACh and NE. 0 of 5 preregistered items pass. On memory-guided choice LTC is non-significantly worse than fixed τ (d −0.63), and on the sleep effect also worse (d −0.70). Verdict: no benefit.
- Inspector (index.v3.html) gained Senses, Workspace/attention, Metacognition, Prediction, Body/arm, Integrity and LTC panels, plus lesion toggles.

## Round 13 (2026-10-29): integrated organism
- New `creatures/001/organism/`: one deterministic, seedable organism (224-neuron LIF CNS + 48-neuron ENS, 7 neuromodulators, an exact kJ metabolic ledger, hormones with PID allostasis, SCN and two-process sleep, NREM replay and REM recombination, latent curvature into the insula and LC, a 3-qubit noise layer with QGT and NIST health tests ported from tsotchke). About 2.3k organism parameters. The browser couples it both ways to the 100M procedural net and its 680,008 learned parameters.
- Pre-registration v3.0, committed before the test run (d767098). Test seeds 1000–1015: 10 of 12 pass. **Failures:** C2 (against the replay-off control, t = 2.63 < 2.75) and C8b (level → choice, d 0.22). Results commit: 52b3e8b.
- The browser creature now runs the same organism.ts as the tests. Visuals (energy, arousal, light, sleep calm, κ, fibre pulse) read organism state. The GPU net's prediction error drives LC, and organism DA and κ feed the net's senses. A live inspector covers every subsystem: coupling graph (click to isolate), connectome, NT, metabolism, sleep, quantum, and behaviour. It also has controls to feed, stimulate, lesion a region, inject, and switch on vagotomy, SCN, insula, sympathectomy, replay, forceWake, starve and level.
- The build goes to `creatures/001/index.v3.html` (`src/build_html.sh`). `index.html` was not overwritten because the v2.3 live suite is still reading it. Promote it with `sh build_html.sh ../index.html` after that suite finishes.
- Site: new Systems page with the coupling matrix and the v3.0 table.
## [0.5.0] - 2026-10-28
- Pre-registration v2.1, committed before any code: CQM-23 substrate pluralism (RV32IM / GLSL / JS), CQM-24 bit reproducibility, CQM-25 embodied and visual scale. All pass.
- AST-1: surprise-inflated focus uncertainty (ASTA=0.001, chosen on held-out seeds). Against the random control, d went from 1.03 to 1.85.
- RV32I interpreter gained RV32M `mul` and `LUI`.
- Research site, 150-project benchmark, 100-capability roadmap, grounding pages, CI.
## [0.4.0]
- Pre-registration v2: non-ceiling re-tests for active inference, CQM-10, CQM-21. All pass. The v1 failures stand.
- iit4 strengthening (phi-proxy fitness term, α=0.1).
## [0.3.0]
- v3 creature: shader body, limb chains, photosensitivity gate, calm mode, mute.
## [0.1.0]–[0.2.0]
- v1 harness: Butlin 14, 10 frameworks, CQM-25 dimensions.

## Round 7 (2026-10-28)
- CQM-21 now passes under v1 via an itinerant Gray-code CPG mechanism (caveat logged). v1 is 44/49.
- AST-1 held-out diagnostics: an oracle bound shows the frozen metric cannot pass bases 2000/3000. AST-1R was preregistered in v2.2 and fails at base 3000 only.
- The app limb motion uses the shared `limbNodeStep`.
- Preregistration v2.2: 9 of 11 pass; 9 of 100 roadmap capabilities are achieved as small harness models.
- Benchmark rubric: 7 → 8.5. E is tested (CQM-01/02) and R is partial; the asymmetric-scoring caveat is shown on the page.
- Link check (2026-10-28): the benchmark TSV citations are plain-text references with no URLs, so there were no citation links to check. The site's only outbound links are github.com/tsotchke/eshkol and github.com/tsotchke/moonlab; both returned HTTP 200. The README CI badge still points at a placeholder OWNER repo, because the repo is unpublished by design.

## Round 8 (2026-10-28)
- REVERTED the round-7 CQM-21 mechanism (Gray-code binary counter). It passed only because a deterministic state cycle covers states more evenly than iid sampling, which is not genuine differentiation. CQM-21 is reported as FAIL again under v1.
  Why no real mechanism can pass this frozen test: its metric is the unconditioned plug-in state entropy of 6 binary units, and its control is iid fair coins, the maximum-entropy source. Any genuine stochastic network, including stimulus-dependent repertoires, has true entropy ≤ 6 bits. Its expected plug-in estimate cannot exceed the iid control except through super-uniform (counter-like) coverage. The non-ceiling differentiation test v2-21 (C_N, I(S;X)) passes.

### Round 8 (continued)
- CQM-21 is reported FAIL. The counter mechanism was reverted because a deterministic state cycle that games entropy coverage is not genuine differentiation.
- AST-1R (base 3000) and RM-10 are still FAIL and are reported honestly (see HARNESS_CHANGES.md).
- The live creature now has circadian arousal (modulates limb reach, HUD day/night), stimulus-specific habituation of the poke startle, and a tamper-evident lineage chain driven by the RV32I mutation word. Prereg v2.3 LIVE tests: NOT RUN yet.

## Round 9 (2026-10-29, Asia/Manila): v2.4
- `item()` in harness.ts is now exported, with no behaviour change, so the v2.4 tests can reuse it.
- New mechanism module `harness/v24mech.ts` (mutable): PI thermostat, task-gated readout, RPE dopamine gate, energy-budget waiting, run-and-tumble, energy-budget risk rule, log-scale numerosity, Bouton two-process extinction, TMR genome scrubbing, dormancy switch, cosine population code.
- New frozen test module `harness/v24tests.ts` follows preregistrations/v2.4.md (commit 4d820ee). Before the first full run, three in-progress edits were made so the tests match the prereg text: the RM-29 metric is pure retention; RM-52 uses the sample Var(s); the RM-97 energy cap was removed because the prereg doesn't specify one. Nothing has changed in it since the first full run (results/run10.txt).
- Result: v2.4 passed 11/11 on the first run. Several tests are easy by construction, as stated on the site.

## Round 10 (2026-10-29)
- Preregistration v2.5 adds CQM-21R, differentiation measured on the creature's own network, with shuffled-weight, lesion and rate-matched iid controls. The first run FAILED vs shuffled weights (d 0.62, t 1.74). Addendum v2.5a adds developmental Hebbian/anti-Hebbian plasticity. The rerun PASSES: d 2.10/3.46/3.47, t 5.95/9.79/9.80. CQM-21R does not count as v1 CQM-21. CQM-21 stays FAIL.
- Fixed the corrupted creature index.html (nested bundles caused a SyntaxError), so the live page now actually runs. Headless Chrome renders at about 0.6 fps on SwiftShader.
- Site regenerated, with fresh screenshots.

## Round 11 (2026-10-29, Europe/London): prereg v2.6
- Preregistration v2.6 (7939995) was committed before any code. Mechanisms + frozen tests (83c119b) were committed before the test-seed run. Results: results/run14.txt.
- RM-10R PASS: vs persistence d 4.53, t 12.81; vs no-efference-copy d 1.94, t 5.49. Same world and mechanism as RM-10, but T=10000 (chosen by power analysis on tuning seeds). This is a power fix, not a new mechanism. Frozen RM-10 stays FAIL (d 0.01).
- RM-64 perceptual bistability PASS: gamma shape k 6.39 vs Poisson 1.26, d 3.03, t 8.57.
- RM-83 latent learning PASS: vs naive d 2.26, t 6.39; vs wrong map d 2.37, t 6.71. Close to pass-by-construction.
- activeInference, CQM-10, CQM-23 and CQM-24 were already re-tested and pass under v2 / v2.1 (V2-AI, V2-10, v2.1-23, v2.1-24). Their v1 results stay FAIL / IMPL.
- AST-1R: still FAIL. No genuine improvement was found (see HARNESS_CHANGES).
- Roadmap: 20 → 23 of 100 achieved (harness models). v1..v2.5 outputs are byte-identical to run13.

## Round 12 (2026-10-29, Europe/London): prereg v2.7 + addendum v2.7a
- AST-1R: proven unpassable at base 3000 by any causal mechanism. Seed 3012's drift exceeds the actuator limit for 55 steps, and a clairvoyant noise-free controller still reaches MSE 6.13, while a pass needs about 4 or less (harness/ast_bound.ts). It stays FAIL, with no mechanism change.
- CAP-B contact-physics crawler PASS: vs uncoordinated gait d 1.55, t 4.39; vs no friction and vs isotropic friction both very large.
- CAP-S social learning PASS: vs random peer d 1.39, t 3.94; vs no peer d 1.62, t 4.58. Uses the new seekPref planner (v2.7a, UNK tuned on 2000.. seeds).
- CAP-R full-state self-reproduction PASS: fidelity 1.000; vs random init d 25.3; vs no repair d 1.55, t 4.37. Near pass-by-construction.
- CAP-C real C. elegans connectome FAIL: AUROC 0.000 vs shuffled 0.611 (d −2.08). The connectome separates touch location perfectly but in the reversed direction under the Dale/GABA sign rule. v2.7a added synaptic scaling (deviation disclosed).
- Benchmark audit: benchmark/capabilities_by_project.tsv (499 project×capability rows, from rubric codes with verified source URLs; the sources were not re-read for finer features) and benchmark/capability_matrix.tsv. Coverage: 9/12 classes are test-proven (E R B N L M S I D). W is not test-proven yet, C fails, and O is not testable.
- creatures/001/MECHANISM_AUDIT.tsv: 76 of 85 frozen tests are flagged as self-contained harness models. 5 share code with the live page; 4 use the bundled creature agent/network.
