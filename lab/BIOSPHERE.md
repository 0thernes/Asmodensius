# Dome biosphere: shared world spec (v0.1)

All 100 creatures will eventually live together in one digital dome: a terrarium/aquarium where they roam and live autonomously. This file is the world contract. `src/biosphere/dome.ts` is the first headless implementation, and `src/biosphere/god.ts` is the God control panel. Every dial is a real mechanism. It acts on the creature only through the Creature Lab Interface, it conserves energy, and it has a test against a seed-matched control (`smoke3.ts`). There are no cosmetic dials.

## World
- **Geometry/physics (v0.1):** a 2-D disk floor (radius 12, 1×1 cells) with a reflecting dome wall. Planned: a 3-D water column with land and air zones (`BodySpec.habitat`), buoyancy, currents, and collisions.
- **Clock:** 1 tick = 1 min, matching creature 001's SCN. Light is `max(0, sin)` with dawn at 06:00.
- **Resources:** a nutrient patch per cell holding food in kJ. Photosynthetic regrowth is `growth·light·(cap−food)`. Creature 001 forages through its own `pool` mechanism, so every 2.2 kJ it eats comes out of the patch under its body.
- **Conservation:** Σpatch + Σcreature.energy() − grown = constant. This is `worldLedgerError`. Each creature also keeps its own internal ledger.
- **Interaction (v0.1):** contact within 1.2 units becomes touch, which creature 001 receives as insula drive. Creatures compete for the same patches.
- **Persistence:** `Dome.snapshot()` gives JSON (t, dials, patches, positions, ledgers, seeds). Full creature state is **not** serialisable yet. Organism 001 holds RNG closures and the Mind object; see the transplant completeness gap below.

## Creature interface extension (in `src/interface.ts`)
`body()`, `sense(WorldSense)`, `act() → {heading, speed, forage, site}`, `exchange({foodPatch})` and `ledger()`. God-panel hooks: `harm`, `work` (ATP → heat), `shiftModulator`, `rewire`. Creature 001's mapping:
- **Heading:** the forage site the creature chose (16 sites around a compass).
- **Speed:** the motor-region rate, zero while asleep.
- **Sensing and exchange:** touch becomes insula stimulation, and the organism's food pool becomes the world patch.

## God control panel
The p-values below come from a paired permutation test over 6 seeds and 1 simulated day. The re-run control repeats the baseline exactly, so its difference is 0. Every row's world and creature ledgers stayed below 1e-13.

| dial | group | metric | control → treated | p | status |
|---|---|---|---|---|---|
| food: barren (cap × 0.05, growth × 0.05) | world/ecology | kJ eaten | 54.3 → 0 | 0.029 | ✅ PASS |
| toxicity 0.003/tick | world | tissue integrity | 1.00 → 0.0009 | 0.029 | ✅ PASS |
| gravity × 3 | world/physics | path length | 28.4 → 17.2 | 0.029 | ✅ PASS |
| electrical stimulation VTA 1.0 | world | mean DA | 0.194 → 0.301 | 0.029 | ✅ PASS |
| sensory hyper-stimulation 2.0 | world | sleep fraction | 0.578 → 0.598 | 0.029 | ❌ FAIL: significant but in the *opposite* direction to the prediction (more sleep, not less) |
| quantum kicks p = 0.2 (dice) | world/quantum | CTX rate | 0.152 → 0.171 | 0.029 | ✅ PASS (dice source: seeded classical) |
| preset hell vs baseline | preset | integrity | 1.00 → 0.001 | 0.029 | ✅ PASS |
| preset utopia vs baseline | preset | path length | 28.4 → 39.5 | 0.029 | ✅ PASS |
| neuromodulator shift NE +0.01/tick | creature | sleep fraction | 0.578 → 0.577 | 0.061 | ❌ FAIL: no measurable effect (NE reuptake clears the shift) |
| dice: rewire 30 % of synapses | creature | CTX rate (abs Δ) | 0.152 → 0.147 | 0.029 | ✅ PASS |
| dice: one random mechanism lesion | creature | forages (abs Δ) | 58.5 → 71 | 0.029 | ✅ PASS |
| dice: mutation σ 0.7 | creature | forages (abs Δ) | 58.5 → 129 | 0.029 | ✅ PASS |

**About the dice:** "God plays dice" draws come from a `DiceSource` that records its provenance. For now it is a seeded mulberry32 stream. The creature's own Q3 "quantum" stream **fails** NIST tests (ones = 0.175, monobit p ≈ 0) because it is a biased measured state, not a uniform RNG, so it is not used as dice. The planned source is the tsotchke quantum_rng WASM that Neuralese ships (`neuralese-git/tsotchke/qrng.mjs`), with the NIST check run before use.

## Planned dials (not built; each needs a mechanism and a test before it counts)
- **Weather:** wind/currents, rain/nutrient wash, temperature. These need thermoregulation in the creature.
- **Gas composition (O2/CO2):** needs a respiration term in the metabolism.
- **Radiation:** tissue damage plus DNA/gene mutation rate.
- **Hypo-stimulation:** creature 001 has no way to suppress sensory input externally; `sense()` needs a sensory gain.
- **Day/night length and light intensity:** creature 001 computes light internally from the hour (organism.ts line 280). A light input in the organism is needed. The world side, food growth, already follows the dome light.
- **Chemical balance:** pH and salinity, acting on neuromodulator kinetics.
- **Singularities and anomalies:** local time dilation (substeps per tick), teleport zones, gravity wells.
- **Game theory:** shared-pool commons, signalling, and prisoner's-dilemma food sharing. This needs an `emit()` action channel between creatures.
- **Waste cycle:** excreted energy returns to patches through decomposers. This closes the loop; today waste is a sink.
- **Parasitism:** a parasite agent that drains `feed` from a host, plus immune cost.
- **Full hell-to-utopia preset ladder:** about 7 steps with survival curves.


## v0.4 dials (Round 3)
Built and tested: weather (temperature, wind), gas (O2 hypoxia, CO2 hypercapnia; both labelled proxies), radiation, waste recycling (detritus account), parasites (parasite-biomass account), prisoner's dilemma and stag-hunt payoffs harvested from the local patch, and the 7-rung utopia→hell LADDER. The world ledger now also includes detritus and parasite biomass. Results: preregistrations/RESULTS-DIALS-v1.md.
