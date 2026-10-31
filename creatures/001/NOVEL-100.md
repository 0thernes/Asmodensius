# NOVEL-100: the 100 novel A-Life capabilities, made tougher (R-021)

Source list: `roadmap/capabilities.tsv` (100 rows, used by `site/gen.py`). Evidence from `creatures/001/results/results.json` (v2.2–v2.7 RM/CAP/LIVE tests), `organism_v3x.json` scorecards and lab DIALS results recorded on the Requirements Pipeline canvas. Written 2026-10-31 on branch v4.0. No code changed.

## Status rules
- **done**: a passing, preregistered test on the organism, the live body or the dome (never harness-only).
- **partial**: passes only as a standalone harness model, or the organism test passes a weaker version, or the instrument exists but fails.
- **not started**: no passing test of any kind.

## Counts
- done: 7 · partial: 38 · not started: 55 (total 100)
- Replaced with BEYOND-ROADMAP items: 8 (6, 30, 45, 48, 49, 50, 93, 94); BEYOND items merged into existing rows: 12, 26, 44, 58, 72, 79
- Rows reworded from a named project to a concept: 31. Prior art stays a reference, never a template (DELARP Part V).
- Old site count "23/100 achieved" counted harness passes; under these rules most of those are **partial**.

## Grade-A rule for every tougher criterion
Runs on organism v4.0 (not the harness), 16 preregistered test seeds (1000–1015), d ≥ 0.8 and t ≥ 2.75 against every control (lesion, shuffle and neutral-drift where relevant), non-ceiling baseline, energy ledger exact, effect wired to behaviour (nothing cosmetic). Criteria below add item-specific controls on top.

## Top 20 to attack first in v4.0 (feasibility × impact on remaining fails)

| Rank | # | Capability | Gap it targets |
|---|---|---|---|
| 1 | 6 | Active dendrites as coincidence gates (replaces FlyWire subgraph import) | RPT-2, HOT-1 |
| 2 | 48 | Astrocyte slow glial layer (replaces multi-tab BroadcastChannel) | RPTLATE, CQM08R |
| 3 | 12 | One curiosity drive: learning progress + empowerment | AE-1, activeInference, thaler9 |
| 4 | 49 | Curvature-triggered metacognition (replaces WebGPU 10^6 cells) | HOT-3 |
| 5 | 36 | Neuromodulator-gated plasticity | UAL |
| 6 | 81 | Classical conditioning with blocking | UAL |
| 7 | 31 | Ecological niche construction | CQM03R |
| 8 | 26 | Bioelectric body plan (morphospace memory) | CQM04 |
| 9 | 60 | Self-generated goals | CQM10 |
| 10 | 30 | Self-tuned criticality (replaces developmental curriculum) | CQM18, iit4 |
| 11 | 52 | Graceful degradation under neuron loss | CQM18 |
| 12 | 8 | Sleep-like offline consolidation | CQM08 |
| 13 | 2 | Metabolic closure from an internal autocatalytic set | CQM16 |
| 14 | 65 | Attentional blink | GWT-3, projective (non-ceiling) |
| 15 | 67 | Masking-dependent reportability | RPT-2, HOT-1 |
| 16 | 51 | Self-model of its own failure modes | HOT-3, CQM18 |
| 17 | 19 | Counterfactual self-model | AE-1 |
| 18 | 44 | Neuromodulator cocktail modes | AE-1, GWT-4 |
| 19 | 1 | Self-repair of a damaged limb after injury | CQM04, CQM16 |
| 20 | 72 | Dreams that seed evolution | thaler9, CQM01/02 |

Remaining fails addressed: RPT-2, HOT-1, HOT-3, AE-1, RPTLATE, UAL, CQM03R, CQM04, CQM10; ceiling items GWT-3, projective, CQM08, CQM16, CQM18 through non-ceiling designs.

## The 100

| # | Capability | Status | Evidence | Copy check | Tougher grade-A criterion |
|---|---|---|---|---|---|
| 1 | Self-repair of a damaged limb after injury | not started | No limb-cut test on 001 | ok (concept) | Cut 1 limb on organism v4.0, 16 test seeds: forage path/day recovers to ≥80% of own baseline within 1 simulated day; d≥0.8, t≥2.75 vs repair-pathway lesion AND vs sham cut; energy for repair paid from ledger (<1e-12) |
| 2 | Metabolic closure from an internal autocatalytic set | partial | Organism viability VIAB-a/b/c PASS (v3.8a, R-048), but energy comes from food, no autocatalytic set | ok | With the autocatalytic set intact, the creature is viable 30 d on raw substrate only; knocking out any one catalyst kills by day 10 in ≥14/16 seeds; shuffled-reaction-network control dies; ledger exact |
| 3 | Heritable variation across generations | partial | CQM01 heredity PASS v3.4–v3.7, FAIL v3.8a (d −0.52, few deaths) | was "across page reloads" (Avida/Tierra framing) → reworded | Parent–offspring trait r≥0.5 on ≥3 traits in the dome over ≥10 generations, d≥0.8 vs shuffled-parent and vs neutral-drift baseline; holds at the v4.0 death rate |
| 4 | Self-reproduction of the full creature state | done | Organism v3.6 snapshot/restore: @snapshot transplant effect 1, self-control 0 (R-047); exact persistence 8/8 (R-043); CAP-R PASS (v2.7) | ok (not Langton loops) | Tougher: the creature reproduces by its own action (budding costs ≥X kJ), child state = parent state ⊕ mutation, and child behaviour diverges from parent at a measured rate above seed noise, vs forced-copy control |
| 5 | Open-ended morphological novelty | not started | No body-plan evolution in 001 | POET/Chromaria named → concept only | Assembly index of evolved body plans rises with positive slope over 200 generations, beating neutral-drift and fixed-environment controls (Mann–Kendall p<0.01 on ≥12/16 seeds) |
| 6 | Active dendrites as coincidence gates (replaces FlyWire subgraph import) | not started | FlyWire import was a project copy and is dropped (Part V) | REPLACED (was FlyWire copy) → BEYOND B-01 | Cortex units with apical/basal branches: RPT-2 integration d≥0.8 vs point-neuron control and vs apical-lesion; single-unit XOR decoding ≥0.8 vs ≤0.6 for point units |
| 7 | Grown approach/escape switching circuit | not started | CAP-C (copied worm connectome) FAIL, AUROC 0.000, archived | reworded 2026-10-31 (concept only) | Switching emerges in 001's own developmentally grown wiring: switch latency and hysteresis d≥0.8 vs shuffled-synapse and vs degree-preserving rewire; no imported connectome |
| 8 | Sleep-like offline consolidation | partial | Harness passes; organism CQM08 on ceiling (FAIL), CQM08R PASS d 12.05 | ok | Held-out cue recall after sleep beats sleep-deprived and replay-shuffled controls d≥0.8 at a non-ceiling difficulty (baseline 0.5–0.8) on the organism |
| 9 | Homeostatic temperature regulation | partial | Harness RM-9 PASS (v2.4); dome weather 40 °C lowers stores (DIALS-v1) but no regulation test | Ashby/Daisyworld → concept | Core temperature in band ≥2× longer than open-loop under a drifting dome temperature, with behavioural (shade-seeking) AND physiological (thermogenesis) arms each lesionable |
| 10 | Interoceptive prediction of energy | partial | RM-10 FAIL; RM-10R PASS (harness, v2.6); organism INS glucose afferent INSGLC 0.872 vs 0.494 (v3.6) | ok | Organism INS forecasts glucose 1 h ahead with error below persistence AND AR(2) baselines, d≥0.8; forecast-lesion changes pre-emptive foraging (anticipatory) |
| 11 | Pain-avoidance learning with one-shot generalization | not started | No test | was "DishBrain" framing → concept | After one noxious contact, approach to novel same-feature objects drops d≥0.8 vs feature-binding lesion; different-feature objects unaffected (specificity) |
| 12 | One curiosity drive: learning progress + empowerment | partial | activeInference v3.8a d 0.75 FAIL; Beta-belief info-gain term exists | merged with BEYOND B-07; OMNI named → concept | Visits learnable > unlearnable ("noisy TV") regions, d≥0.8 vs count-based and vs info-gain-lesioned; resolves thaler9/activeInference/AE-1 conflict: all three pass on the same build |
| 13 | Social learning by observation | partial | CAP-S PASS (v2.7, harness pair) | Neural MMO/Generative Agents named → concept | In the dome, naive 001s learn a foraging route faster watching a trained peer than a random peer and than a blindfolded watcher, d≥0.8, 16 seeds |
| 14 | Theory-of-mind of a peer's attention | not started | No test | ok | Predicts peer's attended item above chance, d≥0.8 vs ablated attention-schema and vs gaze-shuffled peer |
| 15 | Emergent signalling channel | partial | Organism CQM14 signalling PASS v3.8a (d 9.77) | Lazaridou → concept | Signal–referent MI ≥0.5 bits between two 001s that evolved apart, with dialect divergence across isolated domes, vs shuffled-signal and deaf-receiver controls |
| 16 | Tool use: moving an object to reach food | not started | No movable objects in dome | hide-and-seek named → concept | Success with movable objects d≥0.8 vs object-frozen; transfers to a new object shape |
| 17 | Planning over long horizons | partial | Organism CQM11 planning PASS v3.8a (d 6.55); horizon not 50 steps | MuZero named → concept | Return on a delayed-reward detour maze beats a 4-step planner d≥0.8; planning-lesion falls to it |
| 18 | Episodic memory of specific events | not started | No test | Generative Agents → concept | Recalls what-where-when of a single event after 1 day, beating recency-only and familiarity-only controls |
| 19 | Counterfactual self-model | not started | No test | ok | Counterfactual prediction error lower than action-blind model d≥0.8; used in regret-driven choice (AE-1) |
| 20 | Bit-reproducible evolution | done | CQM24 organism PASS (state hash identical); v2.1-24 PASS | ok | Tougher: identical lineage hash on two OS/CPU types and Node vs browser, with a 1-bit perturbation control that diverges |
| 21 | Substrate-independent genome | partial | v2.1-23 harness PASS (RV32I/GPU/JS weight hash); organism CQM23 FAIL (not applicable) | ok | The organism's own genome decodes to identical phenotype hash on RV32I, Eshkol VM and TS; mismatched decoder differs |
| 22 | Quantum-sampled mutation operator | done | moonlab-sim dice: chi² 19.6 < 30.58, Born P(1)=0.25 at π/3; mutation dice PASS (R-031); labelled simulated quantum | ok (own Moonlab use) | Tougher: lineages mutated by Moonlab vs PRNG dice are compared on evolvability with a preregistered null; hardware QRNG if available |
| 23 | Eshkol-compiled controller with autodiff | partial | Eshkol evaluates the sleep/wake flip-flop rule 0/2000 mismatches (R-004); no controller or autodiff | ok | A learned controller compiled and differentiated in Eshkol matches TS bit-for-bit over 10^5 ticks and its gradients match finite differences (rel err <1e-6) |
| 24 | Morphogenesis from a single seed cell | not started | No growth model | "Growing NCA" named → concept: local-rule growth | 001's body grows from one cell by local rules; final body meets its own genome's target with IoU≥0.9 vs untrained rules; varies across seeds but stays viable |
| 25 | Regeneration after 50% tissue removal | not started | No test | NCA named → concept | Regrows to IoU≥0.85 of its pre-cut body, d≥0.8 vs bioelectric-memory lesion |
| 26 | Bioelectric body plan (morphospace memory) | not started | No voltage field | BETSE named → concept; merged BEYOND B-09 | Rewriting the voltage pattern changes the regrown body plan and the change persists across a second regrowth (pattern memory) in ≥80% of seeds; CQM04 R version |
| 27 | Immune-like anomaly detection | partial | RM-27 PASS (harness, v2.2) | ok | Organism detects injected weight corruption AUC≥0.9 and repairs it; immune-lesion control; sickness behaviour (lethargy) as a side effect |
| 28 | Circadian rhythm entrainment | done | LIVE-28/28B PASS (v2.3); DIALS-v5: LL lowers sleep d −2.5, DD null as predicted, 7/8 PASS | ok | Tougher: phase-response curve to light pulses with delays early and advances late in subjective night; food-entrainable second oscillator |
| 29 | Lifelong learning without catastrophic forgetting | partial | RM-29 PASS (harness, gave task id); organism CQM08 ceiling FAIL | EWC named → concept | Organism retains task A ≥80% after B with no task label, d≥0.8 vs no-sleep and vs no-consolidation |
| 30 | Self-tuned criticality (replaces developmental curriculum) | not started | No branching-ratio controller | REPLACED → BEYOND B-05 | Avalanche exponent −1.5±0.2 and branching ratio 1±0.05 in wake, drifts in sleep loss, recovers after perturbation; fixed-gain control fails; CQM18 resilience d≥0.8 |
| 31 | Ecological niche construction | partial | DIALS-v2 recycling + grazer litter PASS (24→73); creature-waste-only recycling FAIL twice | Sugarscape named → concept | Creature-made traces/caches raise its own and offspring fitness vs reset-niche and swapped-niche controls, d≥0.8 (CQM03R) |
| 32 | Predator–prey coevolution | not started | Grazers exist (DIALS-v2) but no oscillation test | Polyworld/Bibites named → concept | Spectral peak in predator/prey counts vs no-predation and vs shuffled-time controls; traits coevolve (arms race) |
| 33 | Multicellular division of labour | not started | No test | ok | Specialised organ cells raise fitness vs undifferentiated control d≥0.8 |
| 34 | Sexual recombination with mate choice | not started | No sex in dome | Polyworld named → concept | Recombining lineages adapt faster than asexual, and choosy faster than random mating, under a moving optimum |
| 35 | Genome-to-connectome developmental encoding | not started | No indirect encoding | HyperNEAT named → concept | Indirect encoding gives higher fitness per genome bit than direct encoding with equal compute |
| 36 | Neuromodulator-gated plasticity | partial | RM-36 PASS (harness); organism learned game from DA reward (R-038, d 4.0) but no ungated control | Izhikevich named → concept | Organism reward learning beats ungated Hebbian d≥0.8 and depends on DA window (dose–response); UAL passes on the same build |
| 37 | Spiking cortex with state-dependent time constants | partial | LTC module 0/5 (v3.3–v3.5), off by default | was "match Brian2/NEST" → reworded | Spiking version of the shared cortex keeps every passing list item within 5% and uses ≥30% less energy; rate-coded control |
| 38 | Energy-accurate neuron cost accounting | partial | Exact energy ledger (<1e-12) but no spike-cost penalty test | ok | Under spike costs, spikes drop ≥30% at ≤5% fitness cost; starving creatures shift to sparser codes |
| 39 | Vision from its own sensory array | not started | No pixel vision | Polyworld vision → concept | Policy from a raw 2-D light array reaches food above blind and scrambled-retina controls d≥0.8 |
| 40 | Proprioceptive body schema learning | not started | No test | ok | Predicts limb positions after babbling; schema updates within 1 day after limb change (rubber-limb drift) |
| 41 | Mirror self-recognition analogue | not started | No test | ok | Tells own-contingent display from replay d≥0.8; marks on its own body get investigated |
| 42 | Delayed gratification | partial | RM-42 PASS (harness) | ok | Organism chooses larger-later more when stores are high, sign flips when low, vs myopic control |
| 43 | Play without extrinsic reward | not started | No test | ok | Varied non-functional bouts rise with satiety and safety; play-deprived cohort learns slower later (d≥0.8) |
| 44 | Neuromodulator cocktail modes | partial | R NE shift PASS (NE 0.122→0.251); electric VTA DA PASS; no mode analysis | was "Creatures emotion modulators" → reworded; merged BEYOND B-03 | Clusters in 7-NT space are attractors; switching mode changes policy entropy d≥0.8 vs scrambled-interaction control; GWT-4 and AE-1 pass on the build |
| 45 | Gut–brain microbiome (replaces language grounding from text) | not started | Text grounding conflicts with promptless/tokenless (R-010) | REPLACED → BEYOND B-06 | Flora transplant between creatures shifts sleep/mood indices d≥0.8 vs germ-free and vs self-transplant; flora responds to diet |
| 46 | Reversible computing core | partial | RM-46 PASS (harness) | ok | Organism day runs backward to the bit-exact start state; 1-bit perturbed run does not |
| 47 | Cryptographic lineage provenance | done | RM-47 PASS; LIVE-47 tamper-evident lineage PASS (v2.3) | ok | Tougher: every dome birth chained; random tampering of any field detected 100% over 10^4 trials |
| 48 | Astrocyte slow glial layer (replaces multi-tab BroadcastChannel) | not started | Not built | REPLACED → BEYOND B-02 | RPTLATE late phase without cortex saturation, d≥0.8 vs glia lesion; retention after interference improves (CQM08R) |
| 49 | Curvature-triggered metacognition (replaces WebGPU 10^6 cells) | not started | Curvature layer exists (extrinsic); no trigger | REPLACED (ALIEN-style substrate was environment-only) → BEYOND B-12 | Intrinsic curvature peaks precede ignitions and confidence drops; acting on them improves HOT-3 d≥0.8 vs curvature-blind control |
| 50 | Assembly index of behaviour and form (replaces ASAL embeddings) | not started | Not built | REPLACED (ASAL copy) → BEYOND B-11 | Assembly index × copy number of motor sequences rises over generations vs neutral drift (CQM02, R-016) |
| 51 | Self-model of its own failure modes | not started | No test | ok | Predicts which perturbation causes collapse AUC≥0.8 and avoids it (HOT-3, CQM18) |
| 52 | Graceful degradation under neuron loss | partial | RM-52 PASS (harness, noiseless code); dice lesion abs Δforages d 1.3 (organism) | ok | Organism performance falls linearly with % neurons lost (R² ≥0.9) vs a non-redundant control that falls abruptly; CQM18 non-ceiling |
| 53 | Gradient-estimating chemotaxis | partial | RM-53 PASS (harness) | was C. elegans AIY/AIZ → reworded | Organism climbs food-odour gradient faster than random walk and than its gradient-circuit lesion, d≥0.8 |
| 54 | Anticipatory postural adjustment | not started | No test | ok | Correction begins before disturbance onset on cued trials vs uncued and reactive-only controls |
| 55 | Rhythm-generator gait switching | not started | No test | was Ijspeert salamander → reworded | Gait switches at a speed threshold with hysteresis; rhythm-lesion fails to switch |
| 56 | Locomotion in dome water zones | not started | No fluid zones | was Sibernetic/Artificial Fishes → reworded | Forward speed in water beats flailing control; switches gait land↔water |
| 57 | Collective construction with peers | not started | No construction | Termes named → concept | Group builds a useful structure (dam, shelter) faster than individuals summed |
| 58 | Memetic cultural transmission | not started | No test | merged BEYOND B-15 | Traditions persist ≥5 generations after the originator dies and differ between domes from one seed, vs isolated-rearing |
| 59 | Inequity aversion in sharing | not started | No test | ok | Rejects unfair splits more than self-interested control; depends on partner memory |
| 60 | Self-generated goals | not started | No test | autotelic agents named → concept | Achieves ≥50% of its own goals vs random goals; goal set changes with state (CQM10) |
| 61 | Metacognitive confidence | done | Organism HOT-2 PASS v3.5–v3.8a (d 2.80 v3.8a); RM-61 PASS | ok | Tougher: confidence AUROC ≥0.7 on held-out tasks and confidence used to opt out (HOT-3) |
| 62 | Blindsight-like dissociation | not started | No test | ok | Lesioned report path: forced choice stays above chance while reports fall to chance |
| 63 | Global ignition threshold dynamics | done | Organism GWT-3R PASS (d 5.68); GWT-3 ceiling | ok | Tougher: bimodal amplitude at threshold contrast; no-recurrence control unimodal; non-ceiling |
| 64 | Perceptual bistability | partial | RM-64 PASS (harness) | ok | Organism dominance durations gamma-like vs Poisson; NE shortens them (dose–response) |
| 65 | Attentional blink | not started | No test | ok | T2 detection dips at lag 2–3 vs flat curve in no-workspace control (projective/GWT non-ceiling) |
| 66 | Change blindness | not started | No test | ok | Detection drops under flicker vs no flicker |
| 67 | Masking-dependent reportability | not started | No test | ok | Report falls with mask SOA while forced choice persists (RPT-2, HOT-1) |
| 68 | Working-memory limit ~4 | not started | No test | ok | Recall plateaus at 3–5 items; capacity rises with ACh |
| 69 | Serial dependence | partial | RM-69 PASS (harness) | ok | Organism bias toward previous stimulus vs memoryless control |
| 70 | Anesthesia-like collapse of integration | not started | PCI row below shuffled bound (scorecard FAIL) | ok | PCI-analogue falls under global inhibition and recovers; baseline must exceed shuffled bound first |
| 71 | Perturbational complexity on the creature | partial | scorecard.ts PCI built; 4/4 below shuffled bound (FAIL) | ok | PCI above threshold in wake, below in deep sleep, d≥0.8 vs shuffled |
| 72 | Dreams that seed evolution | partial | Organism sleep replay exists; thaler9 FAIL v3.8a (d 0.64) | merged BEYOND B-14 | Replay order beats shuffled; dream-born motifs appear in waking and in offspring above drift; dream-lesion lineage control |
| 73 | Hunger-driven risk sensitivity | partial | RM-73 PASS (harness) | ok | Organism sign flip with stores, vs fixed policy |
| 74 | Grid-like spatial code | not started | No test | ok | Periodicity score >0.3 vs untrained; same torus reused for NT/social space |
| 75 | Place remapping | not started | No test | ok | Remapping index higher between dome zones than within |
| 76 | Object permanence | not started | No test | ok | Searches at hidden location vs last-seen-only |
| 77 | Causal intervention learning | partial | Organism CQM09 PASS (d 6.58) | ok | Tells cause from correlate after its own interventions vs observational-only learner (AE-1) |
| 78 | Numerosity with Weber law | partial | RM-78 PASS (harness) | ok | Organism Weber-law error scaling vs flat |
| 79 | Felt time (interval timing + temporal sense) | partial | RM-79 PASS (harness); DIALS-v3 time dilation affects eating | merged BEYOND B-13 | Scalar timing on organism; arousal speeds the clock; time-dilation dial biases interval estimates as predicted |
| 80 | Habituation and dishabituation | partial | RM-80 PASS (harness); LIVE-80/81 FAIL in the body | ok | Body-level decrement and stimulus-specific recovery, vs fatigue control |
| 81 | Classical conditioning with blocking | partial | RM-81 PASS (harness) | ok | Organism blocking present vs associative-only control (UAL) |
| 82 | Extinction and spontaneous recovery | partial | RM-82 PASS (harness) | ok | Organism recovery after delay vs unlearning control (UAL) |
| 83 | Latent learning | partial | RM-83 PASS (harness, near pass-by-construction) | ok | Organism faster route after reward introduced, vs naive; map not given |
| 84 | Detour behaviour | not started | No test | ok | Takes detours when blocked above chance; planning lesion fails |
| 85 | Ornament evolution by mate choice | not started | No test | ok | Ornament grows only with choice enabled |
| 86 | Speciation by isolation | not started | No test | ok | Reproductive incompatibility between isolated domes |
| 87 | Evolution of evolvability | not started | No test | ok | Mutational robustness rises vs fixed-mutation control |
| 88 | Endosymbiosis | not started | No test | Avida symbiont named → concept | Merged host–symbiont outcompetes both alone |
| 89 | Horizontal gene transfer | not started | No test | ok | Adaptive allele spreads faster than vertical-only |
| 90 | Parasite coevolution | partial | Parasite dial lowers glucose d −4.7 (DIALS-v1); no coevolution | Tierra parasites → concept | Host defence diversity rises with evolving parasites vs fixed parasites |
| 91 | Red Queen dynamics | not started | No test | ok | Relative fitness changes while absolute stays constant |
| 92 | Metabolic scaling across sizes | not started | No test | ok | Emergent exponent 0.6–0.85 across evolved sizes |
| 93 | Markov-blanket instrument (replaces allometric limbs) | not started | Not built | REPLACED → BEYOND B-10 | Recovers creature/organ/group blankets from conditional independence; cross-boundary shuffle destroys it (CQM15) |
| 94 | Traveling waves and phase codes (replaces non-carbon chemistry) | not started | Not built | REPLACED → BEYOND (traveling waves B-04) | Traveling waves sweep workspace content; phase codes decode items vs phase-shuffle; wave speed changes with sleep stage |
| 95 | Titan-like environment model [speculative] | not started | No test | ok (labelled speculative) | Membrane analogue stable at 94 K parameters vs water control |
| 96 | Radiation-tolerant genome repair | partial | RM-96 PASS (harness); radiation dial lowers integrity (organism) | ok | Organism survives 10× dose with repair vs without (CQM18) |
| 97 | Dormancy/cryptobiosis | partial | RM-97 PASS (harness) | ok | Organism revives after a zero-food period longer than 6.7 d death time only with dormancy |
| 98 | Explainable state verified against ablation | partial | Motor lens PASS 0.66 of oracle (R-034); circuit discovery faithfulness 0.92 (smoke) | ok | Probe-identified variables, when ablated, change behaviour in the predicted direction on ≥80% of probes |
| 99 | Public replication by an independent runner | not started | Nothing pushed (release gate closed) | ok | External run reproduces results SHA-256 |
| 100 | Thermotaxis with learned set point | not started | No test | was C. elegans AFD → reworded | Migrates to a trained temperature vs untrained; set point re-learns |
