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
