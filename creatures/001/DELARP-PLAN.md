# DELARP-PLAN: v4.0 consolidation (de-LARP audit)

> **Read Part V first.** Alex's correction of 2026-10-31 overrides Parts I–IV wherever they conflict. Butlin 14, the 10 frameworks and CQM 25 stay as the evaluation lists, all A-Life, brain and neurology content stays, and only literal physical, visual or mechanical copying of the 150 projects is dropped.

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

---
# Part II: Full-scope audit (Round 21 scope expansion, 2026-10-31)

Directive (Alex): CQM-25, the 10 frameworks, Butlin-14 and the 150-project list are applied too strictly and literally. Reframe them as **neural-network and brain attributes/qualities** the creature should exhibit. Each one stays falsifiable and is measured against controls, but none is a 1:1 reproduction of a project or theory.
Scope read: creatures/001 (organism, harness, preregs, src, MECHANISM_AUDIT), lab/ (src, instruments, biosphere, template, conformance, CROSSOVER), benchmark/ (projects.tsv 150 rows, capabilities_by_project.tsv 499 rows, capability_matrix.tsv), roadmap/capabilities.tsv (100 rows), docs/ + site/gen.py, .github (workflow + 4 issue templates), CITATION/README, and the Requirements Pipeline canvas 96123c90 (read only; not edited).
No canvas edit, no new prereg frozen, /tmp/w/r20 untouched.

## 7. Audit findings by area

### 7.1 Requirements Pipeline canvas (R-001…R-048)
| Req | Problem | Proposed rewording (for Alex's approval; canvas not edited) |
|---|---|---|
| R-013 "all 14 Butlin, no exceptions, grade A" | Literal 14/14 gate. Butlin et al. present these as indicator **properties** to assess, not a pass/fail exam. Some items cannot be passed by design (AST-1R). | "Exhibit the brain qualities behind the Butlin indicators (§8.1), each with a concept test vs. controls." |
| R-014 "all 10 frameworks" | Each "framework" is a single theory's signature protocol (Thaler, CTM, IIT…). These protocols conflict (C1). | "Exhibit the 6 shared mechanisms the frameworks point to (§8.2)." |
| R-015 "all 25 CQM, grade A" | Mixes brain qualities with A-Life population checks (heredity, morphology genes, substrate pluralism) and with duplicates (13=HOT-2, 19=RPT-1, 20=GWT-3, 21=iit4). | §8.3: 25 → 14 qualities, with duplicates merged. |
| R-020 "do everything all 150 do" | Literal union of 150 projects (worms, Tierra, Lenia, Polyworld bodies…). Impossible, and the cause of the larping. | "Cover the capability clusters (§9) in one coherent organism; projects are references, not targets." |
| R-021 100 novel capabilities | 11 rows copy named projects (c302/BAAIWorm reversal rates, FlyWire subgraph, Polyworld vision/mating, Creatures modulators, Brian2/NEST match). | Restate as principles (§9.2). |
| R-022 "fly connectome, rodent and human brain, NHI/UAP" | Invites literal connectome imports (CAP-C). | "Use connectomics/neuroanatomy findings as design principles (motifs, E/I, modularity, neuromodulation), not as data imports." |
| R-025 LTC SNNs | Named-architecture port; 0/10. | "Neurons with state-dependent time constants" (DEV-1R). |
| R-004/R-005/R-008/R-039 Eshkol, Moonlab, QGT/HoTT, "math beyond understanding" | Tool-driven requirements. The quantum layer is decorative (P9) and the RNG fails NIST. | Keep as **lab tools / provenance**, outside the organism's claimed brain. Flag to Alex: these are his own explicit asks, so removal needs his decision. |
| R-007 "nothing cosmetic" | Correct, and currently failing. The 100M GPU net (R-011) violates it. | Keep. Enforce through the conformance check C-NC (§10). |
| R-018 release gate "grade A on every gate" | Tied to literal rollups. It would never open. | "Release when every principle-level quality (§3) has ≥1 passing concept test and nothing is cosmetic." |
| Headline gates (8/14, 5/10, 17/25) | Rollups reward test counting and double-count shared mechanisms. | Replace with 5 principle tiles + 12 quality tiles (§8.4). |
| R-002/R-006/R-009/R-012 visuals | Not larping (original shell body). Keep. | — |

### 7.2 Code
- **organism.ts**: The 15 version gates (ge35/is37/is38/is39…) make the code layered history rather than one design. The choice term at L494–499 holds 5 epistemic variants plus 2 value variants. v4.0 = one code path. Old minds are reproducible through a tagged commit, not through live branches.
- **harness/**: v24–v27 mech/tests are self-contained models (MECHANISM_AUDIT: 76/85). harness.ts still hosts the Thaler inverted-U, the AST Kalman, CAP-B/C/S/R and the cqm21rNet toy. These go to `archive/harness-v1-v2.7/`.
- **coupling.ts / SYSTEMS_DESIGN**: Lists "Quantum", "GPU 100M net", "LTC neurons" and "Curvature" as organism parts. Rewrite to the 5 principles. The quantum and GPU entries become lab/visual tools.
- **lab/src/instruments**: These are fine as analysis tools (decoder, PCI, SAE, transplant, lesionStats, routing, geometry). `scorecard.ts` encodes the literal Butlin/framework rollup, so switch it to the quality list (§8). `qgeom.ts`/`qrngDiag.ts`/`nist.ts` stay as tool diagnostics only.
- **lab/biosphere**: The dome, God dials and dice are original. Keep them. `moonlabDice` is labelled simulated, which is fine.
- **lab/template + conformance**: The template is a generic small LIF creature. It is good and not a mimic. The conformance suite checks the interface and energy (19 checks). It has no brain-quality checks, so add an optional quality tier (§10).
- **lab smoke/diag scripts** (smoke…smoke10, diag9*, exact8, viab2): one-off scripts. Move them to lab/scratch/ and stop counting them as evidence.

### 7.3 Pipeline / DevOps
- **.github/workflows/harness.yml runs only the v1 harness** (the toy models, run6.txt + repro.sh). It never runs the organism suite, VIAB or conformance. So CI evidence = the 14/14 "harness" column, which measures toys. **This is the biggest pipeline bug.**
- The 3-job nohup queues in /tmp/w/rNN are untracked and outside the repo, so they cannot be reproduced from git. Add `pipeline/queue.sh` + `pipeline/score.sh` to the repo (same logic, versioned).
- The summarize_v3x.ts/run_v3x.ts copies (9 near-duplicates) should become one `run.ts --prereg vX` that reads the frozen item list from the prereg file.
- The results tree mixes tuning, dev and test outputs. Store them as results/<prereg>/{dev,test}/ with a manifest (seed set, git hash), as the lab provenance banner already does.
- site/gen.py and docs/{benchmark,rankings,results}.html publish the literal rollups and the "top of 151" ranking. Regenerate them from the quality list. Drop "rankings" vs. 150 projects (self-scored).

### 7.4 Schemas, templates, references
- `benchmark/projects.tsv` caps rubric (E R M D O B N L S C I W) is a feature-presence rubric: "has evolution", "has a connectome". It invites copying. Re-key it to the clusters (§9).
- Issue templates: `indicator-dispute.md` assumes the Butlin/CQM item IDs. Add a "quality-test dispute" template referencing quality IDs. `new-creature.md` should link the conformance quality tier.
- References: keep the citations (Butlin 2023, Friston, Gershman/Niv, Cahill, Owen, Wilson & McNaughton…) as **sources of principles**. Label c302 / FlyWire / BAAIWorm / Polyworld / Creatures entries "reference only (not reproduced)".
- Preregistration format: add a mandatory field `concept:` (which quality/principle) and `mimicry-check:` ("does this test require reproducing a specific project's data, body or protocol? if yes, justify or reject").

## 8. Reinterpretation: from literal items to brain qualities
Format: original item → over-literal? → concept-level quality test (new R ID for v4.0, not frozen yet). Same pass rule and controls discipline. "Keep" = already concept-level and kept as is.

### 8.1 Butlin-14 → brain qualities
| Item | Literal? | Quality / replacement |
|---|---|---|
| RPT-1 recurrence | no | Keep: **Q-RECUR** recurrent processing sustains information (delayed recall vs. feedback cut). |
| RPT-2 integration (XOR readout) | yes: the XOR readout protocol | **Q-BIND**: stimulus-conjunction decoding from recurrent cortex beats either-feature decoding vs. recurrent cut. Merged with CQM06 and fieldIntegration. |
| GWT-1 specialist modules | no | Keep: **Q-MOD** functional modularity (lesion dissociation). |
| GWT-2 limited capacity | no | Keep: **Q-CAP**. |
| GWT-3 broadcast | ceiling protocol | **Q-BCAST** = WS-1R (degraded input; one item for GWT-3, ctm, CQM20). |
| GWT-4 state-dependent attention | no | Keep: **Q-ATTN**. |
| HOT-1 generative top-down | yes: a dedicated tdIter bolt-on | **Q-TOPDOWN**: top-down expectations improve perception of degraded input vs. feedback cut (uses principle 1). |
| HOT-2 metacognitive monitoring | no | Keep: **Q-META** (merged with CQM13). |
| HOT-3 metacognitive agency (opt-out) | partly | **Q-META-ACT** = META-1R: confidence is used to act (opt out, seek information). |
| HOT-4 quality space | no | Keep: **Q-SIM** graded similarity structure. |
| AST-1 / AST-1R | yes: Kalman/LQG toy, unpassable | **Q-SELFATTN** = ATT-1R: a learned model of its own attention improves control. |
| PP-1 predictive coding | no | Keep: **Q-PRED**. |
| AE-1 agency under reversals | partly | **Q-AGENCY** = REV-1R (learned action–outcome model, flexible after reversal). |
| AE-2 embodiment | no | Keep: **Q-BODY**. |

### 8.2 The 10 frameworks → 6 shared mechanisms
| Framework item | Literal? | Shared mechanism / test |
|---|---|---|
| thaler9 | **yes** (Creativity Machine noise inverted-U) | **Q-GEN** generative recombination (REC-1R). Noise-level inverted-U dropped. |
| iit4 (phi proxy) | proxy | **Q-INTEG** integration–differentiation balance (PCI-style perturbational complexity vs. lesioned/shuffled; the lab pci.ts already exists). Merged with CQM21. |
| activeInference | **yes** (EFE formula) | **Q-CURIO** = CUR-1R (directed exploration from uncertainty). |
| attentionSchema (model of another's attention) | partly | **Q-SOCIAL-ATTN**: predicting another agent's attention focus vs. shuffled. Shares its model with Q-SELFATTN. |
| fieldIntegration (phase locking) | no | Merged into **Q-BIND**. |
| ual (trace conditioning) | no | Keep: **Q-ASSOC** unlimited-associative-learning marker. |
| sensorimotor (efference prediction) | no | Merged into **Q-PRED** (self-generated vs. external input). |
| projective (self/other ownership) | ceiling protocol | **Q-SELF** self/other distinction under degraded cues. |
| ctm | **yes** (CTM chunk protocol) | Merged into **Q-BCAST**. |
| butlin14 rollup | rollup | Removed (rollups are not tests). |
Result: Q-GEN, Q-INTEG, Q-CURIO, Q-SOCIAL-ATTN/Q-SELF, Q-ASSOC, plus the merged Q-BIND/Q-PRED/Q-BCAST.

### 8.3 CQM-25 → 14 organism qualities
| CQM | Literal? | Disposition |
|---|---|---|
| 01 heredity | A-Life population protocol | **Q-LINEAGE** = EVO-1R (resource-gated reproduction). |
| 02 open-endedness | ok | **Q-NOVEL** behavioural/representational novelty keeps growing vs. a fixed-world control. |
| 03 ecological coupling | protocol artefact (C3) | **Q-ECO** = ECO-1R. |
| 04 morphology (reach gene) | **yes** (Sims-style gene; fights the energy ledger) | **Q-ADAPT-BODY** = MORPH-1R (two environments, opposite optima). |
| 05 embodied consistency | ok | Keep: **Q-ENERGY** (with VIAB). |
| 06 perceptual integration | dup | → Q-BIND. |
| 07 learning | ok | Keep: **Q-LEARN**. |
| 08 continual retention | ceiling | **Q-RETAIN** = CQM08R. |
| 09 causal interoceptive model | ok | Keep: **Q-INTERO**. |
| 10 goal regulation | partly (ceiling) | **Q-GOAL** goal-directed vs. habitual switching after devaluation (concept-level). |
| 11 planning | ok | Keep: **Q-PLAN**. |
| 12 compositional transfer | ok | Merged with **Q-GEN**. |
| 13 = HOT-2, 19 = RPT-1, 20 = GWT-3, 21 = iit4 | duplicates | Count once (Q-META, Q-RECUR, Q-BCAST, Q-INTEG). |
| 14 signalling game | ok | Keep: **Q-COMM**. |
| 15 boundary, 16 self-maintenance, 17 homeostasis | ok | Merge into **Q-HOMEO** (allostasis family; VIAB-a/b/c are its tests). |
| 18 resilience | ceiling | **Q-ROBUST** graceful degradation after graded lesions (dose–response slope vs. no-plasticity control). |
| 22 valence trade-off | ok | Keep: **Q-VALENCE**. |
| 23 substrate pluralism | not applicable | Drop as a gate. Keep the WASM-equivalence check as engineering. |
| 24 reproducibility, 25 scale | engineering | Move to the conformance tier, not "qualities". |

### 8.4 Resulting quality list (v4.0 scorecard: 34 qualities under the 5 principles, replacing 49 literal items)
P1 Predictive allostasis: Q-PRED, Q-TOPDOWN, Q-INTERO, Q-HOMEO, Q-ENERGY · P2 Value/uncertainty: Q-CURIO, Q-AGENCY, Q-VALENCE, Q-GOAL, Q-ASSOC, Q-LEARN · P3 Workspace: Q-RECUR, Q-BIND, Q-MOD, Q-CAP, Q-ATTN, Q-BCAST, Q-META, Q-META-ACT, Q-SIM, Q-SELFATTN, Q-SELF, Q-SOCIAL-ATTN, Q-INTEG · P4 Sleep/generative: Q-GEN, Q-RETAIN, Q-PLAN · P5 Embodied lineage: Q-BODY, Q-LINEAGE, Q-ECO, Q-ADAPT-BODY, Q-NOVEL, Q-COMM, Q-ROBUST.
Each quality needs ≥1 concept test with a causal lesion **and** a non-mechanistic control (shuffle/random). Each test must be non-ceiling (degraded inputs by default). No test may require a specific project's data, body or protocol.

## 9. The 150-project list → capability clusters

### 9.1 Collapse
projects.tsv has 150 projects in 30 categories; capabilities_by_project.tsv has 499 project×capability rows over 12 rubric codes. Collapsed into 8 clusters, each a quality family (not "do what project X does"):
| Cluster | Source categories (n projects) | Rubric codes | Quality family in 001 |
|---|---|---|---|
| K1 Neural control & brain models | brain model, connectome-grounded (10), consciousness models, cognitive architecture, neuroevolution | N, C, I | P3 workspace qualities. **"connectome-grounded" becomes "biologically-informed wiring principles"** (modularity, E/I balance, neuromodulator hubs), not a connectome import. |
| K2 Learning & memory | embodied RL, multi-agent RL, cognitive arch. | L | P2 + P4 (Q-LEARN, Q-ASSOC, Q-RETAIN, Q-GEN) |
| K3 Metabolism & self-maintenance | artificial chemistry (9), synthetic biology, protocells | M | P1 (Q-HOMEO, Q-ENERGY) |
| K4 Evolution & lineage | digital evolution (8), open-endedness (7), neuroevolution | E, R, O(pen-ended) | P5 (Q-LINEAGE, Q-NOVEL) |
| K5 Bodies & morphogenesis | evolved bodies (12), morphogenesis (8), physics engine, embodied agents | B | P5 (Q-BODY, Q-ADAPT-BODY). **No worm/Sims body reproduction.** |
| K6 Self-organising media | CA, continuous CA/Lenia (7), reaction–diffusion, particle life | — | Out of scope for the brain. At most a dome-environment feature. Not a gate. |
| K7 Ecology & society | agent ecology (12), collective behaviour, game creatures, agent modelling | S | P5 (Q-ECO, Q-COMM, Q-SOCIAL-ATTN) |
| K8 Engineering & openness | (all) | D, W, O(pen source) | Conformance tier (determinism, browser, reproducibility). Not qualities. |
Excluded as not applicable: LLM agents (4) (no LLM by R-010) and biological hybrids (3) (wetware).

### 9.2 Roadmap (100 "novel capabilities")
Rows that copy a project must be restated as principles:
- c302/BAAIWorm reversal rates → "forward/backward switching emerges from a learned approach/avoid circuit".
- FlyWire subgraph controller → "modular wiring motifs improve steering vs. degree-preserving shuffle".
- Polyworld vision/mating/predation → "vision from own render", "recombination speeds adaptation", "predator–prey dynamics".
- Creatures (Grand) modulators → Q-VALENCE / neuromodulator ablation.
- Brian2/NEST match → drop.
- Eshkol bit-for-bit → engineering check.
- Genome-to-connectome, chemotaxis, thermotaxis → keep as principles (development, gradient following), no worm specifics.
The rest are already concept-level.

## 10. Pipeline and template changes (proposed)
1. **CI**: harness.yml runs (a) conformance suite on 001 + template, (b) organism smoke on dev seeds (a few minutes), (c) the reproducibility hash. The v1 toy harness moves to an `archive` job that is non-gating and labelled.
2. **Repo pipeline**: `pipeline/{queue.sh,score.sh,run.ts}`, with the item list read from the frozen prereg and results under results/<prereg>/{dev,test}/ with a manifest.
3. **Prereg template** (`preregistrations/TEMPLATE.md`): fields concept/principle, quality ID, mimicry-check, controls (lesion + non-mechanistic), non-ceiling design, seeds (fresh test, dev 2000–2031), the freeze commit before test seeds, R-suffix rule for redefinitions, and the two-block freezing rule.
4. **Conformance**: keep the 19 interface/energy checks (required). Add **C-NC** "no cosmetic parts": each declared part must change a metric when lesioned. Add an optional **quality tier**: run any Q-test whose hooks the creature implements, and report per cluster. creature template docs: "copy the interface, invent your own brain; do not reproduce a named project".
5. **Scorecard/canvas/site**: tiles per principle (P1–P5), each listing its quality IDs and PASS/FAIL. The Butlin/framework/CQM/150 tables stay as historical mappings with a column "→ quality ID". Remove the "top of 151" ranking.
6. **Issue templates**: add quality-test dispute; update indicator-dispute to the quality IDs.

## 11. Approval checklist for Alex (nothing below is done yet)
- [x] (approved) Approve reframing R-013/14/15/20/21/22/25 (§7.1) and the canvas tile change. The canvas will be edited only after approval.
- [x] (approved) Eshkol/Moonlab/quantum stay inside the organism (§16).
- [x] (approved) Approve the quality list (§8.4) and the cluster collapse (§9).
- [ ] Approve the two-tier assessment (§12–13): 6 strict claims + 28 graded qualities.
- [ ] Then: write and freeze preregistrations/v4.0.md (R items + retirements) **after Round 20 completes**, before any v4.0 test seed.

---
# Part III: Graded evidence profiles (Round 21 direction, 2026-10-31)

Direction (Alex): be less rigid. Keep honesty and real measurement, but judge most qualities the way a biologist, ecologist or artist would. That means graded evidence profiles from observable behaviour with simple controls, not brittle d/t gates on everything. Value open-ended, emergent, ecological and aesthetic richness.

## 12. Two tiers of claims

### 12.1 Tier S: strict core claims (preregistered statistics, unchanged rules)
Only claims that are load-bearing for "this is a living, learning, integrated organism":
| Claim | Test(s) | Why strict |
|---|---|---|
| Viability | VIAB-a/b/c (steady state, ordered starvation and death, recovery) | Everything else rests on a real energy ledger. |
| Learning | Q-LEARN (RPE/STDP learning vs. learning lesion), Q-RETAIN (CQM08R) | The core claim of a brain, not a script. |
| Broadcast / workspace | Q-BCAST (WS-1R, degraded input, broadcast lesion) | The central integration claim. |
| Interoception | Q-INTERO (INSGLC style: decodes body state; afferent cut + label shuffle) | Body–brain coupling is the organism's identity. |
| Reproducibility | snapshot/restore, state hash | Engineering honesty. |
Rules stay as they are: frozen R-suffixed prereg before test seeds, fresh test seeds, dev-only tuning, d ≥ 0.8 and Welch t ≥ 2.75 vs. every control, non-ceiling rule, and failures stay on record.

### 12.2 Tier G: graded qualities (everything else among the 34)
Each quality gets an **evidence profile**, not a PASS/FAIL:
| Grade | Meaning (all must hold for the grade) |
|---|---|
| **Strong** | The behaviour is clearly observable across most seeds and contexts (e.g. ≥ 3/4 of dev+test seeds). One simple causal control removes or clearly weakens it (lesion, shuffle or random). The direction holds in ≥ 2 independent seed blocks. Effect sizes are reported, with no threshold. |
| **Emerging** | Seen in some seeds/contexts or only under some conditions, OR a control weakens it only partly, OR the effect is consistent but small. Report where it shows up and where it does not. |
| **Absent** | Not observed, or not distinguishable from its control. |
| **Untested** | No mechanism or no measurement yet. |
Honesty guards that are kept from the strict tier:
- Observations come from the real organism, never a stand-alone model.
- Every grade has ≥ 1 control (lesion or shuffle), so the grade means "the brain does this", not "it happened once".
- A grade is assigned by a written rubric per quality, fixed **before** looking at that round's data. The rubric may be revised between rounds, with a dated note. No silent regrading.
- Failures and downgrades are shown, not hidden. Grades are never summed into a single score or a consciousness claim.
- Ceiling is not a failure here. If a behaviour is easy and robust, that is Strong, with a note that the task may be too easy.

### 12.3 Evidence types allowed in Tier G (beyond d/t)
- **Behavioural ethology**: time budgets (forage/rest/explore/sleep), ethograms, sequences, individual differences between seeds ("personalities"), behaviour across dome conditions.
- **Ecological**: population dynamics in the dome, niche use, coexistence of species, responses along the utopia-to-hell ladder, recovery after perturbation (resilience curves).
- **Neural observation**: raster/field signatures, ignition events, replay content during sleep, PCI-style complexity, representational geometry, lesion dose–response curves.
- **Open-endedness / emergence**: novelty growth over long runs, new behaviours not coded as rules, surprising interactions. These are logged as **observations** with seed, time and replay file, then checked against a shuffle/no-plasticity run.
- **Aesthetic / experiential richness**: visual and sonic variety driven by internal state (measured: state→visual mutual information; diversity of rendered states over a day; lesion → visual change, which is the "nothing cosmetic" check). Plus qualitative notes from human viewing (Alex as curator), clearly labelled as subjective.
- **Case studies**: annotated episodes ("seed 2017, day 3: reversal after food crash") with replay files, in the style of a field notebook.

## 13. Which of the 34 qualities go where
- **Tier S (strict)**: Q-LEARN, Q-RETAIN, Q-BCAST, Q-INTERO, Q-HOMEO/Q-ENERGY (via VIAB). Six qualities, plus reproducibility.
- **Tier G (graded)**: Q-PRED, Q-TOPDOWN, Q-CURIO, Q-AGENCY, Q-VALENCE, Q-GOAL, Q-ASSOC, Q-RECUR, Q-BIND, Q-MOD, Q-CAP, Q-ATTN, Q-META, Q-META-ACT, Q-SIM, Q-SELFATTN, Q-SELF, Q-SOCIAL-ATTN, Q-INTEG, Q-GEN, Q-PLAN, Q-BODY, Q-LINEAGE, Q-ECO, Q-ADAPT-BODY, Q-NOVEL, Q-COMM, Q-ROBUST. That is 28 graded.
- A graded quality can be promoted to Tier S later with a new preregistration, when the claim needs it (e.g. for a paper).
- The R items proposed in §4b (CUR-1R, REC-1R, REV-1R, META-1R, ATT-1R, REC-2R, EVO-1R, ECO-1R, MORPH-1R, DEV-1R) become **graded protocols**: the same task and control, read as a profile instead of a gate. Only WS-1R stays a strict prereg item.

## 14. What this changes elsewhere in the plan
- **§4 / §8**: "retire / redefine" still applies, but only Tier S items need frozen R-suffixed preregs. Tier G uses a per-round **rubric file** (`assessments/RUBRIC-vX.md`), committed before the round's data are read.
- **Conflicts (§2)** become less fatal. Under graded reading, curiosity vs. dreaming is a **trade-off to describe** (e.g. Q-CURIO Strong, Q-GEN Emerging), not two FAILs. Still, merge the mechanisms (§3), because one coherent brain is the goal.
- **Scorecard / canvas / site (§10.5)**: the headline shows the strict claims (PASS/FAIL), then a **profile map**: 28 qualities × {Strong, Emerging, Absent, Untested} with short notes, a field-notebook page of observed emergent episodes, and a gallery (visual/sonic states with their internal-state source). No totals or rankings.
- **Pipeline (§10)**: add `assessments/` per round: the rubric, profile JSON (grade, evidence, controls, seeds, replay links), and the notebook. CI checks only that every grade references a control and a data file.
- **Prereg template (§10.3)**: add `tier: S | G`. Tier G entries need a rubric and a control, not a pass threshold.
- **Release gate (R-018)**: proposed as "all Tier S claims PASS, nothing cosmetic, every quality graded with evidence", not "grade A everywhere".

## 15. Risks
- A graded scheme can drift into storytelling. The guard is controls on every grade, rubrics committed before the data, visible downgrades, and replay files for every claim.
- Grades are not comparable with the old d/t rollups. The history stays on record as it is.

---
# Part IV: Alex's approvals and the evolutionary stance (2026-10-31)

## 16. Approved decisions
1. **Canvas reworded (done this round):** R-013/14/15/20/21/22/25 and R-018 now state brain qualities, and per-principle tiles were added. The old Butlin/framework/CQM tables stay as history.
2. **Quantum layer, Eshkol and Moonlab stay inside the creature.** This reverses the P9 removal in §3 and §7.1. They are organism parts, not a NIST gate:
   - Q3 state is driven by neuromodulators (as now) and feeds **chance in the organism**: decision noise, mutation draws, dream recombination sampling and developmental variation. "Chance" in principles 4 and 5 is quantum-sourced.
   - QGT/Berry curvature of that state is an **observable internal signal** (e.g. feeding the insula/curvature channel and the visuals/sound). It is graded in Tier G like any other part: does lesioning it change behaviour or aesthetics? (the "nothing cosmetic" check).
   - The NIST/bias results stay as a disclosed property of the source (biased, ones 0.175). The v3.6 debiasing stays where unbiasedness matters (decision sign). Bias elsewhere is allowed as "character" if it is disclosed. NOISESIGN moves from a gate to a diagnostic.
   - Eshkol/Moonlab code paths stay as the implementation substrate where they are used now. The WASM/bytecode equivalence checks stay as engineering checks.
3. **34 qualities (§8.4) and 8 clusters (§9) approved**, assessed with the two-tier scheme of §12–13: 6 strict claims, 28 graded qualities.

## 17. Evolutionary, wild, chaotic stance for v4.0
"Life is evolutionary, wild, random, chaotic and beautiful." Design consequences:
- **Populations, not one tuned individual.** Every assessment runs over a varied population: per-seed genomes with mutation, drift, recombination, developmental noise and quantum-sourced chance. Individual differences are a result to describe ("personalities", lineages), not noise to average away.
- **Open-ended evolution in the dome.** Resource-gated reproduction (principle 5) with heritable brain parameters (neuromodulator gains, plasticity rates, curiosity weight, sleep need, body traits). Selection is left to the ecology, not to the test suite. Species and lineages may diverge, go extinct or coexist.
- **No tuning to tidy targets.** Stop hand-tuning parameters to make an item pass on dev seeds (the §D freezing dance of v3.5–v3.9). Instead, set wide, biologically plausible **ranges**, let evolution and development pick values, and report what emerges. Hand-tuning is allowed only for Tier S core claims, under the existing dev-seed rules.
- **Chaos is allowed, artefacts are not.** Sensitive dependence, bursts, extinctions and weird behaviours are kept and logged. They are told apart from noise by:
  1. a **shuffle/neutral baseline**: the same population with heritability shuffled, or neutral drift only (no selection), or plasticity frozen;
  2. **replication across independent runs** (different master seeds), reported as how often the phenomenon appears (e.g. "in 7/10 runs");
  3. **dose–response** where possible (more of the cause → more of the effect);
  4. replay files for every highlighted episode.
  A phenomenon that appears just as often under the neutral baseline is reported as drift/chance, not as an adaptation.
- **Determinism stays a tool, not a doctrine.** Seeds stay recorded so any run can be replayed exactly (snapshot/restore, state hash). The world itself is free to be random.
- **Beauty counts.** Visual and sonic diversity driven by internal and evolutionary state is a goal. It is measured as state→render dependence and diversity over lineages, plus Alex's curator notes (subjective, labelled).

## 18. Plan deltas from Part IV
- §3 "Remove" list: **P9 removed from the list** (the quantum layer stays). The GPU 100M net is still not a claimed organism part unless it is wired in (the same no-cosmetic check applies).
- §4b MORPH-1R / EVO-1R / ECO-1R become long-run dome experiments with a neutral-drift baseline and frequency-across-runs reporting (Tier G).
- §10 pipeline: add `pipeline/evolve.ts` (long dome runs, many master seeds, low priority within the 3-job cap) and a lineage/phylogeny log in `assessments/`.
- §11 checklist: items 1–3 approved. Remaining: write `assessments/RUBRIC-v4.0.md` and freeze `preregistrations/v4.0.md` (Tier S only) after Round 20 completes.

---
# Part V: Alex's CORRECTION (2026-10-31), which overrides Parts I–IV where they conflict

## 19. What changes
1. **Butlin 14, the 10 frameworks and CQM 25 stay the evaluation lists**, with their rollups (x/14, x/10, x/25). They are **not** collapsed into the 34 qualities.
   - §4a "retire", §4c "drop rollups", §8 "replaces" and §12–13 "34 qualities" are **withdrawn** as replacements.
   - What survives from them: §8 becomes an **interpretation aid**. Each list item gets a short "brain quality" note and a principle (P1–P5) tag. The proposed R tests (WS-1R, CUR-1R, REC-1R, REV-1R, META-1R, ATT-1R, REC-2R, EVO-1R, ECO-1R, MORPH-1R, DEV-1R) become **additional R versions of list items** (e.g. thaler9-R, activeInference-R, AE-1R, CQM04R), preregistered as before. They do not replace the items.
   - The graded lens (§12: strong / emerging / absent from behaviour + lesion/shuffle control) is applied **alongside** d/t for every list item, as an extra column. Strict d/t stays the pass rule for the lists, and core claims (viability, learning, retention, broadcast, interoception, reproducibility) must pass strictly.
   - Fixes kept: duplicates (CQM13/19/20/21 = HOT-2/RPT-1/GWT-3/iit4; ctm ≈ GWT-3) are **flagged as shared mechanisms** in reports, but still counted as the list defines them. Ceiling items are scored through their degraded-input R versions (already preregistered: GWT-3R, ctm-R, CQM08R, K1aR/cR), and the originals stay on record. AST-1R stays on record as unpassable by design.
2. **All A-Life, brain and neurology content stays**, including LTC (as state-dependent time constants inside the shared cortex), the latent/curvature layers, the GPU net (it must be wired in, per "nothing cosmetic"), the lab instruments and CAP-S/CAP-R.
3. **Eshkol, Moonlab and the quantum layer stay inside the creature** (§16), integrated as the organism's source of chance and an observable internal signal. NIST is a disclosed diagnostic, not a gate.
4. **Evolution, randomness, chaos, mutation, drift and individual variation are embraced** (§17), with real effects told apart from noise by neutral-drift/shuffle baselines, replication across runs, dose–response and replay files.
5. **The ONLY thing dropped: literal physical, visual or mechanical copying of the 150 projects.**
   - **CAP-C**: the c302 *C. elegans* connectome import. Archived; result stays on record.
   - **CAP-B**: the worm crawler body (segment chain, setae friction, worm CPG). Archived; the body capability is shown by 001's own body (AE-2 reaching, dome locomotion).
   - **Project-specific ports in the roadmap**: c302/BAAIWorm reversal-rate matching, FlyWire subgraph import, Polyworld-specific vision/mating mechanics, Creatures-specific modulators, Brian2/NEST output matching. Restated as concepts (§9.2).
   - The 150 projects inform **concepts** through the 8 capability clusters (§9). They are references, never templates.
   - Concepts from those projects stay welcome (connectome-informed wiring principles, crawling as one way to move, heredity, ecology).

## 20. Mechanism conflicts still to fix in v4.0 (list items stay, mechanisms merge)
The consolidation of §3 still applies to **mechanisms**: one value-and-uncertainty drive instead of 5 stacked curiosity terms, and REM writing uncertainty instead of overwriting values. This resolves thaler9 vs. activeInference vs. AE-1/UAL **without dropping any list item**. The per-indicator bolt-ons (xsW, tdIter, evQ, vK) are merged into the shared workspace rather than removed from the evaluation.

## 21. Canvas (edited 2026-10-31 to match)
- R-013/14/15 restored to "pass all 14 / 10 / 25", with notes on the graded lens, shared mechanisms and ceiling R versions.
- R-018: release when strong across the three lists, with strict d/t for core claims and nothing cosmetic.
- R-020/21/22/25 keep the concept-through-clusters wording.
- The top section "v4.0 plan" maps each principle to its Butlin/framework/CQM items. The old tables are no longer labelled "history" (they are the live lists).

---
# Part VI: Beyond the lists (exploratory roadmap, 2026-10-31)
These go beyond Butlin 14, the 10 frameworks and CQM 25. They are **exploratory**, with no gates. Results go to DISCOVERIES.md. An item can be promoted to a measured test later through a new preregistration. Principles only; no project is copied.

## 22. Other theories of mind and consciousness, not yet represented
| Theory | Core idea to borrow | Possible observable in 001 |
|---|---|---|
| Dendritic integration theory (Aru, Suzuki & Larkum 2020) | Consciousness depends on L5 pyramidal apical–basal coupling, gated by the thalamus (matrix cells) | An apical/basal 2-compartment E cell. Anaesthesia-like decoupling (a drug dial) should collapse broadcast while leaving local processing intact |
| Temporo-spatial theory (Northoff) | Intrinsic slow-fluctuation scale-free dynamics "nest" stimuli | Power-law exponent of resting activity; stimulus-evoked change scaled by pre-stimulus state |
| Beast-machine / interoceptive inference (Seth) | The self as prediction of the body's inner state | Already partly present (INS). Selfhood dissociation: a body-signal "illusion" via a gut/HR mismatch dial |
| Self-organising criticality / neuronal avalanches (Beggs & Plenz) | The brain operates near a critical branching ratio ≈ 1 | Avalanche size and duration exponents; criticality vs. sleep stage; does learning peak near σ ≈ 1? |
| Assembly calculus (Papadimitriou et al. 2020) | Projection, association, merge of neural assemblies | Assembly formation and merge in CTX as compositional primitives (CQM12-adjacent) |
| Thousand Brains / cortical column voting (Hawkins) | Many column models vote on object identity | Principle only: modules each hold a partial model and vote in the workspace |
| Neural ODE / continuous attractor + grid codes (Moser; Burak & Fiete) | Path integration in a continuous attractor | A dome navigation map: a grid-like code for food locations, novel shortcuts |
| Global neuronal workspace "ignition" bistability (Dehaene) | All-or-none ignition at threshold | Already measured (ignitions). Add a masking/threshold psychometric curve |
| Recurrent "integrated information" alternatives (causal emergence, Hoel) | Macro-scale causation exceeds micro | Effective information at region vs. neuron scale |
| Free-energy "markov blanket" selfhood (Friston/Kirchhoff) | Organism = a self-evidencing blanket | Information-theoretic blanket detection between body, brain and dome |
| Unlimited associative learning (Ginsburg & Jablonka): full marker set | Compound stimuli, second-order conditioning, novelty | Extend ual: second-order conditioning, blocking, latent inhibition |
| Higher-order "perceptual reality monitoring" (Lau) | Discriminating real vs. imagined (dream) content | Does the monitor tell perception from REM-generated content? (v4.0 dreams write beliefs, so this is testable) |

## 23. New neuroscience findings worth turning into mechanisms
- **Fly central complex (ring attractor, heading) + mushroom body (sparse Kenyon coding, dopamine compartments)**: a heading ring for dome navigation, and a sparse expansion layer (×50 KC-like units) feeding valence-compartment outputs. A good place to scale toward ~100M parameters, with weights sparse and mostly random as in the fly.
- **Mouse thalamocortical loops (core vs. matrix thalamus, L5→higher-order thalamus)**: route the workspace through higher-order thalamus. Matrix thalamus gates apical dendrites (dendritic integration theory).
- **Primate PFC working memory (activity-silent STP traces, Mongillo 2008; bursty gamma/beta, Miller)**: working memory held in synaptic facilitation between bursts. Delayed recall then survives a distractor.
- **Human cortical hierarchy (timescale gradient; Murray 2014)**: intrinsic time constants rising from sensory to association areas. This is the LTC concept done as a gradient.
- **Astrocytes and the tripartite synapse; glymphatic clearance in sleep**: a slow glial layer that integrates activity, modulates plasticity and clears adenosine/waste during N3 (couples sleep need to metabolism).
- **Neuropeptide / volume transmission (connectome of peptides; Ripoll-Sánchez 2023, principle only)**: a second, wireless "chemical connectome" of diffuse peptide signals with slow, state-setting effects.
- **Representational drift (Driscoll 2017)**: stable behaviour despite drifting neural codes. Observable in long dome runs.
- **Gut–brain microbiome axis**: a microbial population in the gut organ with its own evolution, affecting 5-HT precursor supply.
- **Predictive processing in dendrites, burst-dependent plasticity (Payeur 2021)**: a credit-assignment alternative to e-prop.

## 24. Sci-fi / fringe angles (exploratory, labelled speculative)
- **Self-rewiring brain**: sleep-time synaptic turnover (M40.turn, implemented, off), then structural growth/pruning of whole modules, grafting a module from another individual ("brain graft"), and hybrid offspring brains.
- **Alien senses**: magnetoreception-like field sense in the dome, electric-field sense of other creatures, a sense of the quantum layer's own geometry (QGT trace as an interoceptive channel), time-sense.
- **Hive / distributed cognition**: creatures in the dome share a slow broadcast channel (a pheromone-like field). Test whether a collective solves a foraging problem no individual solves.
- **Exotic neuromodulation**: a "psychedelic" 5-HT2A-like dial that flattens priors (REBUS; Carhart-Harris & Friston 2019), measured as increased entropy and changed exploration; a "fear-bliss" opioid/oxytocin axis.
- **Quantum-chance development**: Moonlab/Q3 draws set developmental wiring noise and temperament (temperament implemented), so siblings differ.
- **Open-ended evolution of brain architecture**: genomes encode module counts and coupling motifs, not just gains.

## 25. Proposed canvas additions (for Alex's approval; not yet on the canvas)
- New requirement **R-049 "Beyond the lists"**: explore the theories and findings in §22–24; results logged in DISCOVERIES.md; promotion to measured tests via prereg. Stage "2 Architecture", status "in progress".
- New requirement **R-050 "DISCOVERIES log"**: surprising or never-before-seen behaviours, each with a replay seed; no gates.
- A canvas section "Beyond the lists" with a table of §22 (theory → observable) and a "Discoveries" counter.

---
# Part VII: Multisensory intake (v4.0 design, 2026-10-31)
Goal: the creature takes in the world through many senses, including alien ones, and the brain **learns** to fuse them. No hand-wired meaning per sense.

## 26. One sensory bus, many transducers
Every sense is a **transducer** that writes a fixed-size, time-stamped vector onto a shared sensory bus: `Sense = { id, dims, rateHz, read(world, body) → Float32Array, cost }`. Each transducer has an energy cost (ATP ledger), so evolution can grow or shrink senses.
| Sense | Source | Notes |
|---|---|---|
| Vision | dome render of the creature's viewpoint (low-res retina, e.g. 32×32×3, log-polar fovea) | from the real render; covers the "vision from its own render" roadmap row |
| Sound | dome audio field (other creatures' calls, events); cochlea-like filterbank, 32 bands | creatures already sonify; they can hear each other |
| Touch / proprioception | contact, pressure on the shell and arm, joint angles | AE-2 body |
| Chemosense | food odour gradients, toxins, pheromone field (hive channel) | gradient following as a principle |
| Interoception | blood glucose, ketones, HR, gut fill, hormones, temperature, ATP | existing INS path, generalised onto the bus |
| **EM field sense** (alien) | dome electric/magnetic dial fields and other creatures' spike-driven E-fields | electroreception/magnetoreception-like |
| **Quantum sense** (alien) | the creature's own Q3/Moonlab stream: Born-rule bits, QGT trace, Berry phase | it can feel its own quantum layer |
| **Data-stream sense** (alien) | any raw numeric stream piped into the dome (e.g. weather dials, a market or sensor feed, text-free) | tokenless: numbers only, consistent with "no LLM" |
| **World-dial sense** (alien) | God-panel dial states (gravity, toxicity, light, chaos) | a sense of "the laws of its world" |
| Time sense | circadian phase, ultradian, interval timers | |

## 27. Learned fusion (no per-sense hand wiring)
1. **Sensory expansion layer** (fly mushroom-body principle): each transducer projects through sparse random weights into a large, sparse code (KC-like, ~2–5% active, global inhibition). This is where the parameter count scales toward ~100M (sparse random projections are cheap and biologically plausible).
2. **Per-sense predictive encoders**: each sense has a small recurrent predictor of its own next input. Prediction errors (not raw input) go upward (predictive coding, PP-1).
3. **Multisensory association cortex**: modules receive prediction errors from several senses. Coincidence (Hebbian/STDP) and the workspace learn cross-modal links. Reliability-weighted fusion (each sense weighted by its learned precision, as in optimal cue integration; Ernst & Banks 2002) via NE/ACh gain.
4. **Attention as precision**: the workspace raises the gain of the sense that is currently most informative for value (link to the single value-plus-uncertainty term: senses that reduce uncertainty about food get weight).
5. **Evolvable sensorium**: the genome encodes which transducers exist, their resolution and gain. Unused senses cost energy and can be lost; mutations can add a sense. Individual variation in sensory profile.

## 28. Observables (exploratory first; promotable to tests)
- **Learned fusion**: decoding a dome event from 2 senses beats the best single sense; lesioning one sense degrades it gracefully (reliability weighting).
- **Cross-modal transfer**: learning in one sense transfers to another (sound → vision of a food type).
- **Alien-sense use**: the creature uses EM or quantum sense in behaviour (shuffle that channel → behaviour changes) — DISCOVERIES candidate.
- **Sensory evolution**: across generations, sensory profiles adapt to the dome environment vs. a neutral-drift baseline.
- **Illusions**: conflicting cues produce ventriloquism-like capture (illusion rows R-006).
These touch Butlin (GWT-1/4, PP-1, AE-2), frameworks (fieldIntegration, sensorimotor) and CQM06 (perceptual integration).

## 29. Build order
(1) Sense bus + interface in `organism.ts` (v40 gate), existing senses moved onto it. (2) Interoceptive, quantum, world-dial and time senses (cheap, node-side). (3) Sparse expansion layer + reliability-weighted fusion. (4) Vision/sound from the dome render (browser and headless). (5) Genome-encoded sensorium.
