# Neuralese -> A-Life crossover map

Source: `/workspace/neuralese-git`. **There is no v13.1 on the box.** The newest is v13.0.1 (tags v13.0.0 and v13.0.1; HEAD 0d1b6b1 adds STEERING_GUIDE.md). The working dirs are neuralese-v9..v12.1. This map covers v13.0.1: 12 tab groups and about 75 tabs (lab-ui.js GROUPS).
Neuralese is an LLM lab built on TinyStories-8M (a transformer). The creatures are spiking, embodied, and have no tokens or prompts. Each row translates the LLM concept into its A-Life equivalent. **No LLM or token ever enters a creature.**
Classes: **A** = transfers directly. **B** = transfers with the change named in the row. **C** = does not apply. Status: ✅ = implemented in lab/src (smoke-tested). Everything else is planned.

| Neuralese feature (tab / file) | LLM concept | A-Life equivalent | Class | Exactly what changes / why not |
|---|---|---|---|---|
| gen (RUN, engine.js decode.js) | text generation from a prompt | free-running life: `step(n)` with live behaviour | B | No prompt. The "rollout" is n ticks from a seed and an initial condition |
| steer, ctrl (analysis.js buildControlVector, vectorArithmetic) | residual steering / control vectors | neuromodulator and stimulation steering ✅ `steer.ts` | B | The vector is a drive into a part (region or modulator), not a residual direction. Mean-difference "state vectors" between conditions can then be written with `writeState` |
| audio (audio.js) | sonify tokens/activations | sonify spike rasters and modulator levels | B | Map regions to voices and rates to pitch/amplitude |
| arch, params (labcore paramBreakdown, flopsPerToken, archGraph) | architecture graph, param counts | `parts()` + `couplings()` graph; organism `paramCount()` | B | "FLOPs/token" becomes cost per tick (ms, synaptic events) |
| weights, surg (surgery.js Editor, quantize, safetensors) | weight surgery | synapse-mask surgery (`lesionCoupling` gain 0..1), weight quantisation robustness | B | Edits go to `syn.w`/`mask`. Export as JSON, not safetensors |
| an (analysis.js computeStats, actCovariance) | activation statistics | per-region rate/voltage moments, covariance, spectra | A | Same maths on `readState` |
| attn, heads (headScores, attentionRollout, headFactors, eigen) | attention heads | workspace routing ✅ `routing.ts` (PLV 0.99 vs lag-null 0.70; 27 ignitions/h) | B | There are no QK/OV matrices. Score modules by workspace access and phase-locking |
| resid, lens (fitTunedLens, logitLensKL, dla) | logit lens / tuned lens / direct logit attribution | motor-output lens ⚠️ `motorLens.ts` (built; CTX 0.569 vs shuffled 0.475, below the +0.1 bar: FAIL) | B | The target is `motor()`/choice, not vocabulary logits |
| circuit, acdc (research.js acdc, scrub) | ACDC circuit discovery, causal scrubbing | connectome circuit discovery by coupling lesion ✅ `circuit.ts` | B | The nodes are region->region couplings. The objective is a behavioural metric averaged over seeds |
| causal (patchResid, patchHeads, pathPatch) | activation patching | neural state transplant ✅ `transplant.ts` (v0.2 full mode: spikes, traces, thresholds, incoming weights, eligibility; the whole-creature completeness control is only 0.039, see LAB_DESIGN) | B | A part's state is copied from a donor at tick T. The effect is how far the trajectory moves toward the donor |
| atp (attribution patching) | gradient approximation of patching | finite-difference / e-prop eligibility approximation vs true transplant | B | Spikes are non-differentiable. Use surrogate gradients (creature 001 has e-prop) or finite differences |
| neurons (neuronAtlas) | neuron atlas, top tokens | neuron tuning atlas: top stimuli, stages and states per neuron | B | Tokens become stimulus/state conditions |
| embed, hemb (embedNorms, nearestTokens, cosineMatrix) | token embeddings | stimulus-representation geometry (16 sensory lines, sites) | B | There is no vocabulary. Embed sensory conditions by evoked state |
| sae, saed (sae.js) | sparse autoencoder features | SAE on population state ✅ `sae.ts` (CTX EV 0.735 vs shuffled 0.355) | A | The same SAE runs on `readState` vectors |
| probe (trainProbe + control task) | linear probes | stimulus/state decoders with shuffled control ✅ `decoder.ts` | A | Only the labels change: creature variables instead of word lists |
| rt, sweep, ops (rome.js computeRome, ablationSweep) | ROME fact editing, ablation sweeps | memory editing: rewrite a HIP->STR site value. Lesion sweeps ✅ (`lesionStats`) | B | A "fact" becomes a learned site/value association |
| timeline, impact (editImpact, klLogits) | edit impact on logits | edit impact on behaviour distributions (choice KL) | B | KL is over choice/motor distributions |
| calib (calibration) | calibration of next-token probs | metacognitive calibration (`Mind.conf` vs correctness) | B | Uses the creature's confidence/report outputs |
| prof, runs, memoryInfo | profiling, run log | tick-time profiling, run registry | A | |
| drill (drill.js) | drill-down tensor inspector | part -> neuron -> synapse drill-down over the CLI | B | The paths are `REGION.i.syn.k` |
| grad (grad.js, gxi/IG, fisher, hess) | gradients, Fisher, Hessian | sensitivity via finite differences or e-prop. Fisher over plastic weights | B | Needs a differentiable surrogate. Exact for the Mind's linear readouts only |
| geom, land (science.js cka, twoNN, anisotropy, spectral, powerLawFit) | representation geometry | CKA + participation ratio ✅ `geometry.ts` (HYP 0.227 vs 0.055; body 0.874 vs 0.013) | A | |
| repro (manifest, weightsHash) | reproducibility manifest | seed + opts + code-hash manifest. Creature 001 harness already has repro.sh | A | |
| stats (permPaired, holm, bh, bootCI, cohenD) | significance testing | identical ✅ `stats.ts`, `lesionStats.ts` | A | |
| data, evalh (evalSuite, ppl, facts, distinct-n) | eval harness | behavioural eval suite: forage reward, probe EV, ledger error, sleep architecture | B | Perplexity becomes prediction error and reward rate |
| nb, report, log | notebook / HTML report | same, using InstrumentResult JSON | A | |
| tsk (TSOTCHKE overview) | provenance of the tsotchke components | same provenance cards | A | |
| qrng (tsotchke/qrng, nist.js) | quantum-RNG decoding seed + NIST tests | NIST tests ✅ `nist.ts`: the controls behave (PRNG passes, biased stream fails). The creature's Q3 stream FAILS (ones 0.175) | B | The seed feeds the creature RNG, not decoding |
| qgeom, fsdist, qgtcheck (moonlab_qgt, qgtl) | Fubini–Study geometry of LM predictions | QGT/Berry geometry of the creature's Q3 3-qubit noise state (`qgt()`, `qgtTrace`) and FS distance between behaviour distributions | B | Applies to creatures with a quantum/noise module. Others use the classical Fisher metric |
| types, typecheck (eshkol types) | type-check the model graph | type-check the CLI coupling graph (shapes/units of the parts) | B | |
| unify (neurosym soft-unify on token embeddings) | neurosymbolic unify | soft-unify on stimulus representations | B | Token embeddings become evoked-state vectors |
| taylor (tsotchke/taylor.js) | exact higher-order derivatives of the loss | Taylor expansion of a metric around a parameter (time constants, gains) | B | Uses smooth parameters only, not spikes |
| claims, fclaims (CLAIMS.md live checks) | claims & evidence | a claim registry tied to preregistered harness tests (001 preregistrations/) | A | |
| fx, PREREG-v11, frontier | preregistered frontier tests | same discipline. 001 already preregisters | A | |
| fsc (Butlin scorecard) | consciousness-indicator scorecard for an LLM | the same scorecard for each creature (GWT, RPT, HOT, AST, agency, embodiment) | B | Embodiment/agency rows become testable for creatures. Still never claim consciousness |
| fmind (mind.js introspection) | introspection tests | metacognition and report tests on the Mind layer | B | |
| frsi (rsi.js) | recursive self-improvement | lineage/evolution over genes (`genes`, ecology pool) | B | Self-improvement becomes heritable variation plus selection |
| fgrok (grok.js) | grokking modular addition | learning-curve phase transitions in creature tasks | B | Grokking is a separate toy net in Neuralese. Only the analysis (delayed generalisation) transfers |
| pci | perturbational complexity vs random-init null | PCI ✅ `pci.ts` (THAL pulse: PCI 0.92, shuffled bound 1.01, sham 0) | A | This is closer to the original neuroscience than the LLM version |
| fatlas (complete causal map) | complete causal map | full coupling x metric lesion matrix | B | |
| viz (viz.js) | 2D activation views | raster, region heatmaps, modulator traces (001 inspector already has many) | A | |
| v3d (viz3d.js, 3d field/surface/circuit) | 3D activation field | 3D body/brain field: neuron positions x rate. The 3D circuit is the coupling graph | B | Needs a layout per creature (`parts()` can carry coordinates) |
| learn (learn/, guide.js) | tutorials | per-creature lab guide | A | |
| term (term.js CLI) | lab terminal | the same command set over the CLI (headless node already works) | A | |
| gpu (gpu.js WebGPU) | GPU matmul | GPU batch over seeds | B | Only worth it for large populations |
| zoo (zoo.js) | model zoo | the 100-creature zoo: identical instruments on every creature | A | This is the core goal of R-028 |
| share | share state | share a manifest + InstrumentResult | A | |
| hub, hspeech, hvision, hgen, hft (transformers.js models) | external HF LLM/ASR/vision models | — | C | These are LLMs and other pretrained nets. Bringing them in would put an LLM into the creatures, so they are excluded. (A vision net as an *external observer* of creature video is allowed only outside the creature.) |
| tokenizer.js, corpus.js, dataset.js, mkcorpus | tokens, text corpora | — | C | The creatures have no tokens. The nearest equivalent is the stimulus schedule, which is defined per creature |
| repeatedTokens, inductionScores | induction heads | sequence-replay / HIP sequence detectors | B | These test repeated *stimulus sequences*, not tokens |
| rome FACTS / factProbe | factual recall of text | — | C | There is no text knowledge. Site-value memory is covered by the rt row |
| neuralese-diffusion (STFT, image/music/video/shape3d diffusion) | generative diffusion models | — for the creatures. Its analysis tools (spectrograms, STFT) carry over as B, for creature sounds/rhythms | C (models) / B (STFT) | The diffusion models are generative nets and are kept out of the creatures |
| desktop/Electron, Capacitor Android/iOS, gh-pages build, release.yml | packaging | site/gen.py -> docs/ already. Packaging can be copied later | A | DevOps only. Asmodensius has local git only and never pushes |
| provenance.js banners, stale-chart stamps | provenance | provenance banner on every instrument output (seed, opts, git hash) | A | |


## v0.4 updates
- logit lens → motor lens: still FAIL. It reaches 0.29 of the oracle ceiling; the oracle itself is 0.76 because foraging is stochastic.
- steering → neuromodulator shift: the manipulation PASSes (NE ×2), but the effect on sleep is null by construction. The ignitions R version PASSes.
- RNG audit → qrngDiag: the bias equals the Born rule. VN→Toeplitz passes NIST. A decision-sign bias bug was found in organism.ts and reported, not fixed.
