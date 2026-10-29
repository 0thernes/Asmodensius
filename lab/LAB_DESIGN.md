# Asmodensius shared Lab: design

Goal: every creature 001..100 gets the same lab bench. This is Neuralese parity, translated to A-Life (see CROSSOVER.md). Instruments only ever talk to the **Creature Lab Interface** (`src/interface.ts`). A creature joins by writing one adapter (`src/adapters/cNNN.ts`) that imports its sim read-only.

## Source
There is no Neuralese v13.1 on the box. The newest is **v13.0.1** (`/workspace/neuralese-git`, tag v13.0.1, HEAD 0d1b6b1).

## Creature Lab Interface (required unless marked optional)
| member | meaning | creature 001 mapping |
|---|---|---|
| `creatureId`, `seed` | identity and determinism | "001", Opts.seed (mulberry streams) |
| `parts()` | named parts: region / organ / modulator / module | 14 REGIONS, 7 neuromodulators, body |
| `couplings()` | part->part edges with synapse counts | derived from syn.pre/post |
| `step(n)`, `t()` | advance deterministically | Organism.step(), 1 tick = 1 min |
| `readState(part)` / `writeState(part,x)` | state tensors (transplant/patching) | rate ‖ v per region. Modulator P,E. Body vitals |
| `motor()` | output vector for the motor lens | MOT rates |
| `metrics()` | scalar readouts | foraged, rewards, asleep, DA, NE, glc, hr, kappa, qgtTrace, region rates |
| `lesionCoupling(id,gain)` | graded cut of an edge | syn mask |
| `lesionFlag?` | named mechanism lesions | Organism.lesion(Opts key). These are the inspector's lesion toggles |
| `stimulate(part,amt)` | drive injection | Organism.stimulate. This is the inspector's stimulate control |
| `feed?` | resource input | Organism.feed. This is the inspector's feed control |
| `clone?` | fresh copy | new Organism with the same opts |
Planned additions: `positions?()` for 3D views, `noiseStream?()` for QRNG/NIST, `choiceDist?()` for KL/calibration, `params?()` for Taylor/Fisher.

## Instrument catalogue
Each instrument has the shape `(Factory | CreatureLab, params) -> JSON result`. Results carry seeds and params so they can be repro-hashed. The full list with A/B/C classes is in CROSSOVER.md.
- Implemented (✅): stats (perm/Holm/BH/bootCI/Cohen d), lesionStats, stateDecoder (probe + shuffled control), transplant (activation patching), steer (stimulation steering), circuitDiscovery (ACDC by lesion).
- Next: motor lens, workspace-routing "heads", SAE, CKA/twoNN geometry, PCI, NIST on the noise stream, QGT/Berry (creatures with a Q module), 3D field, report/manifest, Butlin scorecard.

## Mapping of existing creature-001 assets
- Inspector lesion/stimulate/feed controls map to `lesionFlag`/`stimulate`/`feed`. The inspector can then host the lab instruments as panels.
- The preregistered harness (`harness/`, `preregistrations/`) is the model for the Claims/PREREG rows. Lab outputs should be cited by claims, and the lab never weakens preregistered thresholds.

## Honest adaptation notes
- Transformer-specific tools (QK/OV head eigen-scores, logit lens, token embeddings, induction heads) have no direct object here. They are re-targeted to workspace routing, motor decoding, stimulus geometry and sequence replay.
- Gradient tools (attribution patching, IG, Fisher, Hessian) need surrogate gradients or finite differences, because spikes are not differentiable.
- Region-level coupling cuts are coarse. Neuron-level ACDC is possible but costs about 3000 edges × seeds × ticks.
- HF models, tokenizers, corpora and diffusion generators are excluded (C). No LLM goes into any creature.

## v0.2/v0.3 status (Oct 29, 2026)
- New instruments (each has a control): motorLens, workspaceRouting, saeOnPart, geometry (CKA/participation ratio), pci, nistOnCreature. Run with `node out/smoke2.js <name>`; see the numbers in CROSSOVER.md.
- **Transplant.** `mode:"full"` copies v, spk, rate, xTr, yTr, nmda, thA, rateAvg, th, tau, every incoming synaptic weight and the e-prop eligibility traces. Cross-seed full transplants are refused because the wiring differs. The self-transplant control is an exact no-op. **Negative result:** copying *every* exposed part (`"*"`) from a same-seed donor that got a VTA pulse moves the recipient by only 0.039 of the gap. Most of creature 001's dynamical state is outside the interface: the RNG closures (stimulation changes how many draws are consumed), Mind internals, hormones, gut and liver stores, and the pending `stim` drive. Fixing this needs a `snapshot()/restore()` in organism.ts. That file is off limits while Round 16 is in progress.
- **The HIP->STR zero effect is explained.** Creature 001 has **no HIP->STR synapses** (the connection table in organism.ts lines 18-20 has CTX->STR and VTA->STR only), so the old lesion silently did nothing. Site values live in the non-synaptic `wSite` array, written by three-factor/RPE updates. `lesionCoupling` now throws on unknown couplings, and the `value` part exposes `wSite`. Value-learning lesion (`rpeLesion`) over 6 seeds and 1 day: rewards 26.5 → 25.3.
- **Biosphere:** BIOSPHERE.md, `src/biosphere/dome.ts`, `src/biosphere/god.ts`, `smoke3.ts` (dials).


## v0.4 status (Round 3)
This version adds the interface hooks senseLines, drain, give and takeWaste, plus Welch, Cohen's d and Spearman statistics, motorLensR with an oracle ceiling, and qrngDiag with von Neumann and Toeplitz extractors. The dial battery was preregistered (DIALS-v1) and run on 16 test seeds: 21/24 dials and the ladder pass. Failures: original hyper-stim, original NE→sleep, waste recycling, and motor lens R (0.29 of the oracle). See INVESTIGATION-R3.md.


## v0.5 status (Round 4)
New parts regionRates and rateAvg. The motor lens v2 PASSes at 0.66 of the oracle ceiling. The viewer server exposes the instruments as an inspector API. DIALS-v2: 8 PASS (plus the lens), 1 FAIL, 1 not counted (a direction-flag inconsistency in the prereg).

## v0.7 (Round 6)
- `template/creature.ts`: a minimal spiking creature implementing the full CreatureLab + biosphere surface; `template/scaffold.ts 002..100` copies it for a new creature (to lab/out/scaffold/NNN by default; creatures/NNN belongs to each creature's worker).
- `conformance/suite.ts`: 16 required checks + 2 optional ones (identity, parts, couplings, determinism, metrics, state round trip, stimulation, lesions, motor, biosphere hooks, body, dome ledger, God-hook conservation, direct per-hook booking, foraging, movement). `conformance/run.ts`: 001 16/16, template 16/16, and 3 broken mutants are all rejected.
- Multi-species dome: `Inhabitant.species`, `Dome.speciesStats()`, viewer `SPECIES="001:5,template:3"`, species colours, and persistence restores each creature with its own factory. `multispecies.ts`: integration test.
- `instruments/rpt.ts`: early/late evoked-response probe for recurrent processing.
