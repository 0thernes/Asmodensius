# DELARP-PLAN: v4.0 consolidation (de-LARP audit)

Status: PLAN ONLY. Read-only audit of organism.ts v3.9, harness/, preregistrations/ v1–v3.9, results (v3.8 = latest complete scored round; v3.9 queue still running, not read or touched) and lab/.
Nothing here alters a frozen preregistration or any recorded result. The v3.9 Round-20 results are scored as frozen when the queue finishes.

## 0. Directive (Alex, 2026-10-31)
Use OpenWorm as an example of the idea, not as a template. We take what neurology, brain science, A-Life and AI actually teach and build ONE coherent, original brain/organism. We do not copy any project's connectome, body, look, signature mechanics or benchmark checklist literally. Mechanisms that were bolted on to satisfy one borrowed test each, and that then fight each other, are the main reason items keep failing.

Rule used below: a module is **CONCEPT** if it implements a general principle (e.g. reward-prediction-error learning, sleep consolidation, homeostasis). It is **PORT/MIMIC** if it reproduces one project's data, body, named mechanic or test protocol.

## 1. Inventory: literal ports and imitations

| # | Item (where) | Source imitated | Kind | Conflict / failure it causes |
|---|---|---|---|---|
| P1 | CAP-C touch circuit (harness/v27tests.ts, data/celegans_herm_full_edgelist.csv) | OpenWorm c302 *C. elegans* hermaphrodite connectome (ALM/AVM/PLM → AVA/AVB) | literal data port | Failed with the response **reversed** (anterior/posterior sign). The wiring belongs to a different animal and has no link to 001's own CNS. Already excluded from the organism (SYSTEMS_DESIGN §105), but it is still in the harness, the data and the rollups. |
| P2 | CAP-B contact-physics crawler (v2.7) | Nematode/annelid crawling: 6-segment chain, CPG with phase lag 2π/5, "bristle-like" anisotropic friction (setae) | body/locomotion mimic | 001's own body is a shell with an arm (AE-2 reaching). The test exercises a separate worm body that the organism never uses. |
| P3 | thaler9 + "Thaler inverted-U" (v1 rules, harness, REM recombination parameter M35.remAll/remLr) | Stephen Thaler's Creativity Machine / "Imagitron" noise-driven recombination | project-specific mechanic + test | Direct conflict with the EFE drive (P5): v3.5 A7 efeK 1.5 dropped thaler9 to d 0.69; v3.7 thaler9 d 0.04; v3.8 §C "no configuration satisfies the two-block rule for both thaler9 and AINF". FAIL in v3.8. |
| P4 | ctm "report agrees with action" | Blum & Blum Conscious Turing Machine (one-hot "chunk" broadcast) | framework-protocol mimic | Clean one-hot stimuli push it to the ceiling, so it fails the non-ceiling rule (FAIL v3.8). GWT-3 is the same test (same broadcast lesion), so it is double-counted. ctm-R passes. |
| P5 | activeInference / efeK / efeTau / efeVis / M36 IG / M37 bmW / M38 efeC (organism.ts L494–499) | Friston EFE as a literal formula layered **on top of** the spiking race | 4 stacked versions of one drive | A uniform epistemic bonus saturates the race (v3.8 §C). It fights thaler9, AE-1 (v3.5 A7 d 0.39) and UAL (via the vK trade-off in v3.9 §D). activeInference FAIL in v3.8. |
| P6 | AST-1 / AST-1R (harness, Kalman + LQG controller) | Graziano Attention Schema, implemented as a control-theory toy | harness model, not the organism (MECHANISM_AUDIT FLAG) | v2.7 showed it **cannot pass by construction** (seed 3012 actuator-limit bound). It is a permanent FAIL that measures nothing about 001. |
| P7 | CQM-25 checklist: CQM01 heredity, CQM02 open-endedness, CQM03/03R ecological coupling, CQM04 "reach gene" morphology, CQM14 signalling game, CQM23 substrate pluralism, CQM24/25 | A-Life benchmark list modelled on Avida/Tierra/Polyworld-style evolution and Karl-Sims-style morphology genes | checklist mimicry | CQM04: reach costs ATP, so selection favours low reach (v3.6/3.7: "test economics", no organism fix possible). It directly opposes the energy ledger that VIAB and CQM05/17 reward. CQM01 was degenerate until CQM01R. CQM03R FAIL (d −1.99) because births are generational and do not depend on food. CQM23 cannot apply (JS only). |
| P8 | LTC neurons (V3.4-L1..L5, 10 items) | Hasani et al. Liquid Time-Constant networks (themselves derived from *C. elegans* neurons) | named-architecture port | 0/10 pass in v3.8. Added as a parallel neuron type next to LIF, not integrated. |
| P9 | Quantum layer Q3 / QGT / Berry / NIST (organism Q, NOISESIGN, lab moonlabDice, CROSSOVER tsk/qrng/qgeom/taylor rows) | tsotchke repos (moonlab_qgt, qrng, taylor.js), marked [port] in SYSTEMS_DESIGN | code port | No neuroscience claim. The Q3 stream fails NIST (ones 0.175) and needed the v3.6 NOISESIGN patch. Neuromodulator → qubit-angle coupling is decorative. |
| P10 | "GPU 100M net" (browser only, app.tsx) | LLM-scale parameter count | scale mimicry | Not in the node organism, so no test can see it. CQM25 "scale" counts parameters. |
| P11 | lab/CROSSOVER.md Neuralese → A-Life map (logit/motor lens, ROME memory editing, ACDC, SAE, grokking, RSI) | Neuralese / LLM-interpretability tool suite | instrument mimicry | These are instruments, not organism mechanisms. They are fine as analysis tools. Only "motor lens" became a pass/fail gate (it passes from v0.5). Keep as tools; drop any pass/fail gates that are not concept-level. |
| P12 | Butlin-14 / 10-framework scorecard as **design driver** (RPT, GWT, HOT, AST, PP, AE, IIT, UAL, projective…) | Butlin et al. 2023 indicator list, plus one named theory per framework | framework mimicry | The checklist itself is concept-level and legitimate. The problem: v3.5–v3.9 each added a dedicated mechanism per indicator (cross-module axons for RPT-2, tdIter for HOT-1, evQ for HOT-3, vK for AE-1), each tuned in isolation. v3.9 §D: all four are null or break UAL. |
| P13 | v1 harness models (76/85 frozen items, MECHANISM_AUDIT.tsv "self-contained harness model") | — | test runs a toy, not 001 | Already known. v3.1+ re-runs exist. Keep the v1 results on record, but stop counting them anywhere. |

Not a mimic (keep): LIF spiking CNS with region names taken from mammalian anatomy as **functional roles**; DA-gated three-factor STDP; RPE value learning; neuromodulator kinetics; hormones and metabolism (Cahill/Owen starvation physiology); two-process sleep; NREM replay; interoceptive insula; workspace ignition; latent-cause inference (Gershman/Niv) as a principle; homeostasis; e-prop; the visual body (a shell with an arm; **no worm likeness was found in src/app.tsx / page.tsx**).

## 2. Conflict map → failing tests (v3.8 scored, n = 16)

| Conflict | Mechanisms involved | Failing items it explains |
|---|---|---|
| C1 Epistemic drive vs. learned value vs. dream novelty | P5 efeK/IG/bmW/efeC, P3 REM remAll, v3.9 vK | activeInference, thaler9 (alternating), AE-1, UAL put at risk by vK, CQM12 drop at v37 |
| C2 Energy economics vs. morphology selection | P7 CQM04 vs. ATP ledger (VIAB, CQM05, CQM17) | CQM04, CQM10 (viable fraction) |
| C3 Generational evolution vs. ecology | P7 evo() generational births | CQM03R, CQM01 (CQM01R pending in v3.9) |
| C4 Clean one-hot protocol vs. non-ceiling rule | P4 ctm, GWT-3, CQM08, CQM18, projective, K1a–e | 9 ceiling FAILs; their degraded-stimulus R versions all PASS |
| C5 Per-indicator bolt-ons vs. shared cortex | P12 xs-axons, tdIter, evQ, dendritic gating, LTC | RPT-2, RPTLATE, HOT-1, HOT-3, CQM06, CQM12, all 10 LTC items |
| C6 Foreign anatomy / unprovable test | P1 CAP-C reversed sign, P6 AST-1R bound | CAP-C, AST-1, AST-1R (permanent) |

Count: of 31 FAIL lines in v3.8, 9 are ceiling artefacts (C4), 10 are LTC (P8), 3 are evolution/morphology (C2/C3), and about 6 come from the drive conflict (C1) or bolt-ons (C5). Only CQM23 (not applicable) falls outside these clusters. In practice every failure traces to a mimicry or to a conflict between bolted-on mechanisms.

## 3. v4.0 architecture: one brain, five shared principles
Every mechanism must serve one of these principles. A mechanism that serves only one test is removed.

1. **Predictive, homeostatic control (allostasis).** One generative model with an interoceptive part (insula; hormones; metabolism) and an exteroceptive part (cortex). Prediction error drives learning and LC/NE gain. Replaces: P5's four stacked EFE terms, the separate PP-1 / CQM09 / sensorimotor estimators, and the AST Kalman toy.
2. **Value and uncertainty as one quantity.** The striatum keeps a Beta (mean, variance) per option. Choice = value + **one** uncertainty bonus, centred and gated by ACh/NE (expected uncertainty / unexpected uncertainty; Yu & Dayan). Replaces: efeK/efeTau/efeVis/M36/M37 bmW/M38 efeC/M39 vK. Curiosity, active inference and agency all become readouts of this single term.
3. **Global workspace from recurrent cortex.** Ignition plus broadcast via the thalamo-cortical loops already present. Recurrent re-entry supports late responses. Metacognitive confidence is read from workspace evidence strength. Replaces: the RPT-2 axons, HOT-1 tdIter, HOT-3 evQ, the ctm protocol, the projective toy and the separate attention schema. An "attention model" is learned as a predictor of the workspace's own selection: a concept, not a Graziano-Kalman port.
4. **Offline consolidation and generative replay (sleep).** NREM consolidates. REM samples from the **same** generative model (principle 1) and writes **uncertainty** (not value) for unexperienced combinations. Novelty from dreams then flows through principle 2's single bonus instead of competing with it. This removes C1 by construction. Replaces the Thaler noise-inverted-U and remAll/remLr value overwrites.
5. **Embodied energetics and lineage.** One energy ledger. Any heritable trait has a cost and a benefit in the same currency. Reproduction is resource-gated (births depend on stored energy), so ecological coupling emerges instead of being scored on a generational schedule. Replaces the CQM04 "reach gene" and the generational evo().

**Remove from organism and harness gates (archive under `archive/`, results stay on record):** CAP-C and the c302 edge list (P1); CAP-B crawler (P2); the thaler9 noise inverted-U (P3); the AST Kalman/LQG model (P6); the LTC neuron type and V3.4-L* items (P8); the Q3/QGT/Berry layer and NOISESIGN, replaced by a plain seeded RNG with provenance, NIST kept only as an RNG sanity check (P9); the GPU 100M net as a claimed part of the organism (it may stay as a browser visualisation, labelled as such) (P10); and the shipped-OFF v3.9 bolt-ons xsW/tdIter/evQ/vK (P12).
**Merge:** all EFE variants → principle 2. Dendritic gating, cross-module synapses and RPT feedback → principle 3 (a single recurrent mechanism). Schema extraction (featC/featS ALS) plus REM → principle 4. evo() → principle 5.
**Keep unchanged:** CNS LIF and regions, STDP/RPE, neuromodulators, hormones, metabolism and starvation (v3.9 M39), sleep, insula, latent-cause inference, snapshot/restore, VIAB, the dome, the lab instruments (as tools, not gates).

## 4. Tests: concept-level vs. project-mimicry (preregistration rules)
Rules respected: frozen items are never edited or deleted, and their FAIL/PASS stays on record. Each redefinition is a **new R-suffixed item** in `preregistrations/v4.0.md`, frozen and committed **before** any v4.0 test-seed run. Dev/tuning happens only on dev seeds 2000–2031 and the two-block freezing rule applies. v4.0 test seeds must be fresh (1064+, none used before). The pass rule stays the same (d ≥ 0.8, Welch t ≥ 2.75 vs every control; non-ceiling 0.95·max). Retiring an item from the **rollup** is declared in the prereg before any run; it is never done after seeing results.

### 4a. Retire as project-mimicry (stay on record, excluded from v4.0 rollups)
CAP-C, CAP-B, AST-1 / AST-1R, thaler9 (inverted-U form), ctm (non-R), CQM04 (reach gene), CQM23, CQM25 (parameter count), V3.4-L1a…L5b (LTC), NOISESIGN, all v1 harness-model items (MECHANISM_AUDIT FLAG), and the clean-stimulus ceiling originals GWT-3, CQM08, CQM18, projective, K1a–e (their R versions carry the concept).

### 4b. Redefine as concept-level (new R items)
| New item | Concept tested | Replaces | Control(s) |
|---|---|---|---|
| CUR-1R | Directed exploration: an uncertainty bonus raises information gain per choice in a non-stationary world without lowering reward rate | activeInference, efe parts of AE-1 | bonus lesioned; random exploration matched for entropy |
| REC-1R | Offline generative recombination improves first-choice accuracy on never-experienced feature combinations | thaler9, CQM12 | REM lesioned; REM with shuffled features |
| REV-1R | Reversal learning by latent-cause switching (switch cost falls on the 2nd reversal) | AE-1 | latent-cause lesioned |
| WS-1R | Workspace broadcast under degraded input (= GWT-3R/ctm-R merged; one item, one lesion) | GWT-3, ctm | broadcast lesioned |
| META-1R | Confidence from workspace evidence predicts accuracy, and opt-out raises reward | HOT-2/HOT-3 | confidence shuffled; no opt-out |
| ATT-1R | A learned internal model of the organism's own attention improves attention control when the input is perturbed | AST-1/AST-1R | model lesioned (no Kalman toy; organism-only) |
| REC-2R | Recurrent late cortical response carries stimulus information (decoding, not raw amplitude) | RPT-2, RPTLATE | feedback cut |
| EVO-1R | Heritable trait responds to selection under resource-gated reproduction | CQM01/01R | offspring genome randomised |
| ECO-1R | Population tracks food supply with births gated by energy | CQM03/03R | food schedule shuffled |
| MORPH-1R | A heritable body trait evolves toward the energy-optimal value for the current environment (two environments, opposite optima) | CQM04 | trait not heritable |
| DEV-1R | Plastic neurons with adaptive time constants (a general principle, no LTC port) help delayed recall | V3.4-L* | fixed tau |

Keep as already concept-level: RPT-1, GWT-1/2/4, HOT-2/4, PP-1, AE-2, iit4 proxy (labelled a proxy), fieldIntegration, ual, sensorimotor, CQM02, 05, 06, 07, 09, 10, 11, 14–17, 22, 24, K2, K1aR/K1cR, GWT-3R, ctm-R, CQM08R, INSGLC, LIGHT, SNAP, VIAB-a/b/c.

### 4c. Scoring and frameworks
Report concept rollups by principle (§3: P1–P5) instead of "Butlin x/14, frameworks x/10, CQM x/25". Keep the Butlin/framework/CQM tables only as historical mappings.

## 5. Order of work for v4.0 (no runs until Round 20 finishes)
1. Wait for /tmp/w/r20 to finish (qt.done), then score v3.9 as frozen. Do not touch the queue.
2. Write `preregistrations/v4.0.md`: the retirements (§4a), the R items (§4b) with metrics, controls, seeds 1064+ and the pass rule. Commit it (freeze) before any v4.0 code.
3. Code on a branch: remove/archive P1, P2, P6, P8, P9, P12. Implement principles 2 and 4 first (they remove C1), then 5, then 3.
4. Tune on dev 2000–2031 only, two-block rule. Re-run the kept items to make sure there is no regression. Then freeze parameters, commit, and run test seeds.
5. Verify bit-for-bit reproduction of v3.9 under ORG_MIND=v39 (as in v3.9 §E) so the historical record stays reproducible.

## 6. Risks and honesty notes
- Retiring items lowers the published rollup counts. That is intended and must be reported, not hidden.
- Merging the drives (principle 2) may lose the passing UAL/thaler9 dev results. Any drop is reported as such.
- The CQM-25 source attribution (Avida/Tierra/Polyworld/Sims) is an inference from the item content. The v1 prereg defines the categories but does not name a source.
