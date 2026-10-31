# First principles for the unmet goals (creature 001, v4.0 DRAFT, 2026-10-31)

Method: for each goal, (a) the core claim from its primary source, (b) the smallest original mechanism that would make the claim true, (c) why the current build fails, from the evidence on record, and (d) the cleanest test that is not at ceiling.
- Every mechanism is built **in isolation** first (`organism/fp/*.ts`), with its own dev test on fresh dev seeds and a held-out dev confirmation.
- It is integrated into the creature only after it passes alone, and then existing passes are rechecked.
- Evidence is from results/organism_v38.txt (frozen test run) and the v4.0 dev runs in DISCOVERIES.md. No test seeds.
- "Closeness" is ranked at the end.

## RPT-2: integration (XOR readout)
- **(a) Claim.** Recurrent processing theory: consciousness requires local recurrent (re-entrant) processing that binds features into an integrated representation (Lamme 2006, *Trends Cogn Sci* 10:494; Lamme & Roelfsema 2000, *TINS* 23:571). The Butlin et al. (2023) RPT-2 indicator is "organised, integrated perceptual representations".
- **(b) Mechanism.** A conjunction must be computed from two feature streams, and only recurrent exchange between them should make it decodable. Minimal form: two modules, each seeing one feature, with cross-module recurrent synapses that are plastic (Hebbian on co-activity). After k recurrent iterations a linear readout can decode XOR. Without cross-module synapses XOR is linearly impossible, so the lesion goes to chance by construction of the *task*, not of the metric.
- **(c) Why it fails.** v38: full 0.532 vs cross-module lesion 0.515 (d 0.28). The readout is near chance in both arms, so the current cross-module CTX weights carry no conjunctive code. They are random or near-uniform, not learned conjunctions.
- **(d) Test.** XOR of two features shown to different modules; ridge readout of CTX state after T recurrent ticks; controls are cross-module lesion and feedforward-only (T = 1). Not at ceiling while the full arm stays below 0.95.

**Neuro.** Conjunctions of features carried by different areas are formed by dendritic coincidence detection in layer-5 pyramidal cells: feedback/cross-area input on apical tufts gates somatic bursts only when coincident with basal feedforward drive (Larkum, Zhu & Sakmann 1999 Nature 398:338; Larkum 2013 TINS 36:141), with NMDA dendritic spikes giving a local threshold nonlinearity (Schiller et al. 2000 Nature 404:285; Häusser & Mel 2003 Curr Opin Neurobiol 13:372). Mixed selectivity in PFC makes XOR-like readouts linear (Rigotti et al. 2013 Nature 497:585). Guide: the module is a two-population net with thresholded dendritic cross-input arriving one tick late.

## RPTLATE: late evoked response carried by feedback
- **(a) Claim.** Recurrent processing theory: the late (>100 ms) part of the evoked response reflects feedback and correlates with awareness (Lamme 2006; Supèr, Spekreijse & Lamme 2001, *Nat Neurosci* 4:304).
- **(b) Mechanism.** A feedback loop (CTX→THAL→CTX) whose delay places its contribution in the late window, so cutting feedback removes the late, not the early, response.
- **(c) Why it fails.** v38: late effect 3.4e-5, i.e. none. CTX→CTX lesion changes the early window more (early change 6.13). The late component is dominated by local recurrence and saturation, not by feedback.
- **(d) Test.** Evoked response in 0–10 vs 11–60 tick windows; lesion feedback only; require late drop ≥ X·early drop, with no cortex saturation.

**Neuro.** Late (>100 ms) evoked activity depends on recurrent feedback from higher areas and on thalamocortical loops through pulvinar and matrix-thalamus (Lamme & Roelfsema 2000 TINS 23:571; Saalmann et al. 2012 Science 337:753; Suzuki & Larkum 2020 Cell 180:666, anesthesia decouples apical dendrites). Guide: late component should vanish when CTX→THAL feedback is cut (ctFbLesion).

## HOT-1: generative top-down perception
- **(a) Claim.** Higher-order and predictive-processing views: perception is a generative inference in which top-down predictions shape the percept (Lau 2008, *Prog Brain Res* 168:35; Rao & Ballard 1999, *Nat Neurosci* 2:79). Butlin HOT-1: "generative, top-down or noisy perception modules".
- **(b) Mechanism.** The percept is the posterior mean E[clean | x] under a learned generative model, here a mixture of learned prototypes with a learned noise variance. When input is noisy, the posterior beats raw evidence by Bayes' rule. Lesion: percept = bottom-up evidence.
- **(c) Why it fails.** v38: d 0.86, t 2.43 (dev d near threshold, t short). The existing top-down weight is small, because a fitted blend weight is learned from the cortex's noisy bottom-up channel, so the generative prediction only nudges the percept.
- **(d) Test.** The HOT1 task (noisy one-hot, MSE to clean). The isolated module is tested on the same stream; the integrated version uses the creature's bu percept.

**Neuro.** Top-down generative signals from higher cortex to V1 (predictive coding; Rao & Ballard 1999 Nat Neurosci 2:79; Keller & Mrsic-Flogel 2018 Neuron 100:424) with layer-4 thalamorecipient input as the feedforward channel (Douglas & Martin 2004 Annu Rev Neurosci 27:419).

## HOT-3: metacognitive agency (opt-out)
- **(a) Claim.** Higher-order theory: a metacognitive representation of first-order reliability guides belief and action (Lau & Rosenthal 2011, *TiCS* 15:365; Butlin HOT-3). The behavioural signature is adaptive opt-out (Kiani & Shadlen 2009, *Science* 324:759).
- **(b) Mechanism.** Opt out when P(correct | metacognitive evidence) < safe/1. This needs a confidence signal that is *more* informative than the decision variable alone, e.g. a second-order read of evidence quality: stimulus amplitude, response conflict between top-2 classes, or curvature.
- **(c) Why it fails.** v38: opt-out vs none d −0.12; vs random opt-out −0.42. Accuracy (~0.61) is far above the safe value 0.3 in almost every confidence bin, so opting out is rarely optimal; the task is at a floor for opt-out value. The N09 dev run confirmed that adding curvature changes nothing.
- **(d) Test.** A new R test (disclosed, does not replace HOT-3). The safe value is set at the creature's own running accuracy, so opt-out pays exactly when confidence discriminates trials. Controls: random opt-out at matched rate, and confidence-shuffled.

**Neuro.** Decision confidence is read from the same accumulator that makes the choice: LIP neurons encode opt-out confidence (Kiani & Shadlen 2009 Science 324:759), OFC neurons signal confidence for waiting decisions (Kepecs et al. 2008 Nature 455:227; Lak et al. 2014 Neuron 84:190), and anterior PFC supports metacognitive report (Fleming et al. 2010 Science 329:1541). Guide: confidence = monotone read of the decision margin (MarginConf), not a separate learned network.

## AE-1 margin: agency, RL under reversals
- **(a) Claim.** Agency means learning from feedback to pursue goals, with flexible responsiveness to competing goals (Butlin AE-1; Dickinson & Balleine 1994 goal-directed action; Schultz, Dayan & Montague 1997 RPE).
- **(b) Mechanism.** After a reversal, the RPE has to drive revaluation fast. Volatility-scaled learning rate (Behrens et al. 2007) on the value actually used by choice.
- **(c) Why the margin is small.** The v4.0 fix (volLeak plus RPE gating) gives dev d 1.24 / 1.10 / 0.88 across three blocks. The leak is driven by raw |RPE|, which mixes outcome noise with change (see AINF-R diagnosis), so it adds noise to value.
- **(d) Test.** The existing AE1. Candidate: volatility from *unexpected* uncertainty (volX, already coded, off).

**Neuro.** Midbrain dopamine neurons broadcast reward prediction errors (Schultz, Dayan & Montague 1997 Science 275:1593) that drive corticostriatal plasticity in D1/D2 medium spiny neurons (Reynolds, Hyland & Wickens 2001 Nature 413:67); reversal additionally relies on OFC (Izquierdo et al. 2004 J Neurosci 24:7540) and sleep replay consolidates the pre-sleep contingency (Wilson & McNaughton 1994 Science 265:676). Guide: RPE lesion should matter most right after a reversal; replay of old contingencies at night opposes it.

## UAL: unlimited associative learning (trace conditioning)
- **(a) Claim.** Learning about novel compound stimuli and actions across time gaps (Ginsburg & Jablonka 2019, *The Evolution of the Sensitive Soul*). Trace conditioning requires a memory trace bridging the gap.
- **(b) Mechanism.** An eligibility trace with a time constant matched to the CS–US gap (Sutton & Barto TD(λ)).
- **(c) Status.** It passes in v38 and on dev (d 1.0–1.3). It is listed for margin only.
- **(d) Test.** The existing UAL vs trace lesion.

**Neuro.** Trace conditioning needs hippocampus and mPFC to bridge the gap (Solomon et al. 1986 Behav Neurosci 100:729; Kalmbach et al. 2009 Learn Mem 16:86), plus eligibility traces at synapses tagged for later dopamine (Yagishita et al. 2014 Science 345:1616).

## activeInference: EFE choice
- **(a) Claim.** Agents choose policies minimising expected free energy, the sum of risk (pragmatic) and ambiguity (epistemic) (Friston et al. 2015, *Cogn Neurosci* 6:187; Friston et al. 2017, *Neural Comput* 29:1).
- **(b) Mechanism.** The epistemic value of a site is the expected information gain about its *current* hidden state, which grows with time since it was last observed under the believed hazard. It is not outcome variance.
- **(c) Why it fails.** The diagnosis is in DISCOVERIES.md (2:45 PM PT):
  - Dreams write pseudo-certainty into unseen sites.
  - Beta SD mixes aleatoric noise into "uncertainty".
  - Volatility from raw |RPE| makes beliefs forget about 15× too fast.
  - Undirected noise already explores enough, so the directed term has no headroom.
- **(d) Test.** AINFR4, where expected value of the unknown sites is below the known option, with decision noise matched across arms. The isolated module is tested with a fixed softmax policy, so noise exploration is controlled.

**Neuro.** Directed exploration is driven by LC-NE (Aston-Jones & Cohen 2005 Annu Rev Neurosci 28:403) for unexpected uncertainty and basal-forebrain ACh for expected uncertainty (Yu & Dayan 2005 Neuron 46:681); frontopolar cortex tracks uncertainty bonuses (Badre et al. 2012 Neuron 73:595). Guide: epistemic term should be a count/uncertainty bonus gated by NE-like volatility.

## GWT-3: global broadcast (ceiling)
- **(a) Claim.** Content in the workspace becomes available to many consumer systems at once (Baars 1988; Dehaene & Naccache 2001, *Cognition* 79:1).
- **(b) Mechanism.** Ignition: a winner-take-all workspace whose state gates all consumers.
- **(c) Why it fails.** It is at ceiling (0.96 vs 0.25), so the test can't grade. GWT-3R (degraded stimuli) already passes; this goal is about the test, not the mechanism.
- **(d) Test.** GWT-3R is the non-ceiling version. Keep it, and report GWT-3 as ceiling.

**Neuro.** Ignition and broadcast via long-range layer-2/3 pyramidal cells of fronto-parietal cortex (Dehaene & Changeux 2011 Neuron 70:200).

## projective: self/other ownership (ceiling)
- **(a) Claim.** The comparator model: self-generated sensations are predicted by an efference copy, and a mismatch signals "other" (Frith, Blakemore & Wolpert 2000, *Phil Trans B* 355:1771).
- **(b) Mechanism.** A forward model fed by an efference copy, plus a threshold on prediction error.
- **(c) Why it fails.** Ceiling (1.000 vs 0.49): self/other are perfectly separable.
- **(d) Test.** A non-ceiling R test where external perturbations are partly correlated with own movements (graded), so attribution accuracy is below 1.

**Neuro.** Self/other attribution via efference copy and cerebellar forward models (Blakemore, Wolpert & Frith 1998 Nat Neurosci 1:635); TPJ for self–other distinction.

## CQM08: continual retention (ceiling)
- **(a) Claim.** Complementary learning systems: replay protects old memories from interference (McClelland, McNaughton & O'Reilly 1995, *Psychol Rev* 102:419).
- **(b) Mechanism.** Interleaved replay of old items during sleep.
- **(c) Why it fails.** Ceiling (0.956 vs 0.955, replay lesion). There is no interference, so nothing to protect. CQM08R (degraded) passes.
- **(d) Test.** CQM08R. Report CQM08 as ceiling.

**Neuro.** Retention via synaptic consolidation (Benna & Fusi 2016 Nat Neurosci 19:1697) and sleep replay interleaving (McClelland et al. 1995 Psychol Rev 102:419).

## CQM16: self-maintenance and CQM18: resilience after lesion
- **(a) Claim.** Autopoiesis / homeostatic self-maintenance (Maturana & Varela 1980), and recovery of function through plasticity after damage (Nudo 2006, *Curr Opin Neurobiol* 16:638).
- **(b) Mechanism.** For CQM18, post-lesion plasticity re-learns the lost mapping.
- **(c) Why they fail.**
  - CQM18: ceiling (0.993 vs 0.995). A 40% lesion barely hurts, so plasticity has nothing to recover.
  - CQM16: passes in v38 and is listed for margin.
- **(d) Test.** A larger lesion that drops performance to about 0.5, then recovery, vs plasticity frozen.

**Neuro.** Homeostatic regulation by hypothalamic AgRP/POMC circuits and interoceptive insula (Craig 2002 Nat Rev Neurosci 3:655; Sternson 2013 Neuron 77:810).

## CQM03R: ecological coupling and CQM01: heredity (population items)
- **(a) Claim.** Evolution by natural selection needs variation, heredity and fitness differences (Lewontin 1970, *Annu Rev Ecol Syst* 1:1). Population growth tracks resources (Malthus; logistic ecology).
- **(b) Mechanism.**
  - CQM01: offspring genomes = parent + small mutation, and the measure is parent–offspring trait correlation.
  - CQM03R: birth rate gated by stored energy that comes from food.
- **(c) Why they fail.**
  - CQM01: d −0.52. The offspring-random control scores *higher*, which suggests the metric rewards diversity rather than heredity.
  - CQM03R: not established.
- **(d) Test.** CQM01: parent–offspring regression slope (heritability) vs random-genome control. CQM03R: lagged food→births correlation vs a random-birth control.

**Neuro.** Not a neural property; population genetics (no circuit).

## CQM04: morphology (reach gene)
- **(a) Claim.** Morphology co-evolves with ecology: a body trait is selected when it changes fitness (Darwinian selection on a heritable trait).
- **(b) Mechanism.** Reach changes which food is accessible at an energy cost, and births depend on energy.
- **(c) Why it fails.** d −0.05. Reach has no fitness consequence in the current world.
- **(d) Test.** A world with food that only long reach can get, at a cost; measure the reach shift vs random survival.

**Neuro.** Not a neural property; developmental genetics.

## CQM10: goal regulation (viable fraction)
- **(a) Claim.** Allostasis: regulation anticipates needs instead of reacting to error (Sterling 2012, *Physiol Behav* 106:5).
- **(b) Mechanism.** Foraging drive set by predicted energy deficit (fat plus a forecast of glucose).
- **(c) Why it fails.** The fixed-drive control is *more* viable (0.94 vs 0.67, d −4.29). The learned drive under-forages.
- **(d) Test.** The existing CQM10.

**Neuro.** Goal switching by ACC foraging-value signals (Kolling et al. 2012 Science 336:95).

## LTC: liquid time-constant neurons
- **(a) Claim.** Input-dependent time constants give more expressive, robust dynamics (Hasani et al. 2021, *AAAI* 35:7657).
- **(b) Mechanism.** τ modulated by input and neuromodulators, *learned*.
- **(c) Why it fails.** 0/10 in v3.4. The gains are hand-set, and the tasks don't need variable τ.
- **(d) Test.** A task with two input timescales, where a fixed τ is provably mismatched.

**Neuro.** Input-dependent time constants arise from conductance-based synapses (shunting) in real neurons (Koch, Rapp & Segev 1996 Cereb Cortex 6:93).

## Ranking by closeness (start here)
1. **HOT-1:** d 0.86, t 2.43 already; the isolated Bayes posterior is a small, clean change.
2. **HOT-3 (R):** the mechanism exists (HOT-2 AUROC passes); only opt-out value is missing, so the test redesign is principled.
3. **AE-1 margin:** dev d 0.88–1.24; volX is a principled candidate.

Then activeInference, RPT-2, CQM10, CQM01/04/03R, RPTLATE, LTC. The ceiling items (GWT-3, projective, CQM08, CQM18) need non-ceiling R tests, not mechanisms.

## Results so far (dev only; times PT, 2026-10-31 afternoon)
- **HOT-1, isolated** (fp/hot1.ts, fp/dev_hot1.ts; no tuning):
  - 2096: module vs bottom-up d 9.99, t 28.3; vs a learned linear decoder d 5.19, t 14.7.
  - Held-out 2112: d 10.99 and 6.92.
  - **Integrated** (fpH1, off by default): 2096 d −0.17 vs top-down lesion (existing build d 0.14).
  - Diagnosis: the creature already runs the same prototype posterior (v3.5). The limit is the *bottom-up cortical code* `bu`: lesion-arm MSE 0.128 implies about 25% wrong-class percepts, versus about 5% from the raw input. So the generative prior has nothing reliable to select from. HOT-1 is blocked by perceptual encoding, not by missing top-down.
- **HOT-3R, isolated** (fp/hot3.ts, safe option = own running accuracy):
  - 2128: d 2.05 vs random, 2.22 vs shuffled.
  - Held-out 2144: d 2.05 and 2.06.
  - **Integrated** HOT3R on g.mind.conf: 2128 d 0.37 / 0.00; held-out 2144 d 0.01 / 0.12. It fails for the same root cause: the creature's confidence is computed on the degraded cortical code.
- **Next goal implied:** a principled fix to bottom-up encoding (sensory → CTX → `recon`/`cls` read-out), e.g. a read-out trained on the module's own input statistics, or lower cortical noise for cue channels. That one change is upstream of HOT-1, HOT-3 and probably RPT-2.
- **Cue encoding (done):** the L4 input layer is adopted (l4 = 1).
  - HOT-1 passes on dev 2177 (d 1.54) and held-out 2193 (d 3.41).
  - HOT-3R is still short (d 0.63): the next bottleneck is the confidence signal itself (teachConf), not the percept.
  - RPT-2 is unaffected and needs its own conjunctive-recurrence module.
  - The AE-1 margin does not replicate at defaults (0.26-0.58 on fresh blocks); volX is mixed. AE-1 moves up the list.


## 3:02 PM PT turn results (dev seeds 2225+; held-out blocks; no test seeds)
- HOT-3 module alone (MarginConf, percentile of decision margin): 2225 d 1.93 t 1.80*; 2241 d 1.66 t 1.53* (*t fails at n=16 isolated); raw margin 2.09/2.14 and 1.84/1.95. In creature HOT3RM: 2257 vs random d 1.41 t 3.98, vs shuffled 0.84/2.36; held-out 2273 d 0.53/0.65 → **not confirmed**.
- RPT-2 module alone (fp/rpt2.ts, dendritic threshold cross-input, T=3): 2289 d 0.87 t 2.47 (t fails); held-out 2305 d 1.43 t 4.05. Mixed. In creature (new RPT2R, stimulus held T ticks, disclosed): 2289 T1 0.40/1.14, T3 0.25/0.70, T5 −0.20/−0.57. Diagnosis: the creature's CTX code for modules 0–1 is near chance on XOR (0.50–0.55) even with time for recurrence, so the missing piece is a dendritic threshold nonlinearity on kind-3 (cross-module) synapses (300 live, mean |w| 0.85, so not pruned away). Not integrated yet.
- AE-1 first principles (q5 diag, 2337–2342, 240-tick bins): reversals fall at t=720/1440/2160 after warm-up; ticks ~720–1200 of each day are night (zero forages), so a third of the scored window carries no samples, and the first reversal block is spent asleep with replay of the old contingency. Full vs RPE-lesioned differ only in daytime post-reversal bins (0.33 vs 0.24). AE-1 d is therefore diluted by night and replay, not by a broken RPE.
- Recheck at l4-default (no volX), block 2321: thaler9 d 1.82 t 5.16, CQM12 1.40/3.95, AINF −0.01/−0.03, **AE-1 1.39/3.92**, UAL 1.75/4.94, viability 288 forages, 0 deaths. Held-out block 2353: thaler9 1.50/4.24, CQM12 1.28/3.61, AINF −0.19/−0.54, AE-1 0.81/2.29 (t fails → **AE-1 not confirmed**, 3 of 5 l4 blocks now fail), UAL 1.30/3.66, 320 forages, 0 deaths.
- SUPER CREATURE (Alex's own, cq5/src/sim/super-creature.ts): mined. Its cortex/actor are untrained; the reusable mechanism is the online one-step sense predictors (AD-MLPs) and the 6-beat foresight ring, a candidate for activeInference epistemic value (learning progress). Not reused in code yet.

## 3:29 PM PT turn (dev seeds 2369–2496; all new options default OFF)
- RPT-2: added dTh/dG (local NMDA-spike threshold on cross-module dendrites, Schiller 2000). RPT2R 2369: baseline 0.25/0.71, dTh0.5 0.13/0.37, dTh1 −0.08/−0.22; 2385: dTh0.5 dG6 0.20/0.56, dTh1.5 −0.08/−0.22, dTh2.9 dG10 0.27/0.76. Diagnostic: CTX decodes a and b alone at 0.95–0.99, so features are encoded but not conjoined; a threshold alone does not create XOR-selective units. Next: BAC-style multiplicative apical×basal gating (Larkum 1999) rather than an additive threshold.
- AE-1: dream-replay gate (dreamGate, ACh-like surprise suppression, Hasselmo 1999) had **zero** effect: AE-1 is bit-identical even with dreamLr 0 (2401, 2417), so replay does not drive AE-1; and the score is reward per forage, so night does not dilute it. Both earlier hypotheses are falsified. AE1R (daytime adaptation window, new, disclosed) 2433 d 0.59 t 1.68 (fails). Count forgetting (forget 0.001, volatility after Behrens 2007): dev 2465 d 0.98 t 2.77, held-out 2481 d 0.56 t 1.57 → not confirmed. Original AE-1 stays reported (failing at defaults: 2401 0.80/2.25, 2417 0.81/2.30, 2465 0.54/1.52, 2481 0.53/1.50).
- activeInference: fp/cur.ts learning-progress curiosity (inspired by Alex's SUPER CREATURE predictors): AINF 2449 curK3 d 0.06 t 0.18, curK10 0.12/0.33 → null.

## 3:48 PM PT turn (dev seeds 2497–2624)
- RPT-2 apical-gain module (fp/rpt2.ts ApicalGain, original; BAC firing after Larkum 1999): alone XOR 0.947 vs 0.509 lesioned, dev 2497 d 5.28 t 14.93; held-out 2513 d 4.00 t 11.32 → **module passes**. In creature (aG/aTh, default off) RPT2R 2529: aG1 −0.51/−1.45, aG2 0.42/1.17, aG2 aTh0.5 0.15/0.43; plus SOM-like apical mean subtraction 2545: 0.00/0.00, −0.16/−0.45, 0.25/0.72 → null. Diagnosis (fp/diag_rpt2.ts): all 288 cross-module synapses are excitatory and unstructured, so apical drive barely depends on b (median d′ 0.21, max 0.83). Next: feature-selective cross-module wiring.
- AE-1 diagnosis (fp/diag_ae1.ts, 8 seeds 2561): values track truth (r 0.68 in day blocks) but choice is near-uniform: chosen-site p 0.33–0.35 vs chance 0.30, best 0.53, entropy 2.76/3.0 bits; lesioned arm's Beta counts track truth (r 0.79) but its policy can't use them. **Bottleneck = exploitation; uncertainty bonus uK 1 swamps value.** uK 0.3: dev 2577 d 1.01 t 2.85; held-out 2593 d 0.98 t 2.78; recheck 2609 all pass. Now default; original AE-1 unchanged.

## 3:55 PM PT turn (dev seeds 2625–2688)
- uK 0.3 confirmation block 2625 (defaults): thaler9 1.39/3.93, CQM12 1.05/2.98, AE-1 1.43/4.05, UAL 1.66/4.69, HOT-1 1.80/5.10, AINF −0.07/−0.19 (null as before), viability 343 forages, 0 deaths → **confirmed**.
- RPT-2 feature-selective cross wiring, isolated (fp/rpt2.ts LearnedApical): (a) Hebbian growth plus per-cell normalisation (competitive self-organisation, Miller 1989): 2641 d 0.82 t 2.33 (fails); (b) all-excitatory unselective weights, with feedforward inhibition centring the apical drive on the source-population mean (Pouille & Scanziani 2001): 2641 d 9.54 t 26.98, held-out 2657 d 10.32 t 29.18 → **passes alone**. In creature (ffi option, default off) RPT2R 2673: aG2 0.32/0.91, aG4 −0.52/−1.48 → null. The creature's cross-module signal is too weakly b-selective at the spike level for centring to recover it. Not yet localised further.
- HOT-3R: not attempted this turn (time).

## 4:02 PM PT turn (dev seeds 2689–2768)
- RPT-2 trace of b (fp/diag_rpt2_trace.ts, fp/diag_rpt2_xor.ts; seed 2689):
  - b is not lost. It is in module-1 spikes (max d′ 2.0–3.2) and reaches module 0 by tick 2–3 (max d′ 1.2–1.5).
  - An offline decoder (600 trials) reads a 0.95–0.98 and b 0.97–1.00 from modules 0+1, but XOR only 0.48–0.56. Per-unit a×b interaction is ≤0.1.
  - The integrated apical signal carries b well (d′ up to 1.88).
  - **Source of the loss:** CTX somatic current is dominated by the slow NMDA persistence current (mean |nmdaS| 8.97 vs ext 0.15, fast NMDA 0.47, dend 0.62). Apical gain on the fast feedforward drive therefore barely changes spiking, so there is no conjunction.
- Fixes tried (all default off):
  - apL: apical plateau integration.
  - apAll: gain on the total drive.
  - apH: homeostatic apical centring and scaling (Triesch 2005).
  - These raise interaction only slightly (0.145). RPT2R 2705: −0.30/−0.85, −0.69/−1.94, −0.17/−0.48 → null.
  - Next principled step: let the slow NMDA persistence be reset or gated by stimulus onset, so the soma reflects the current trial's coincidence.
- HOT-3R start: HOT3RM at the new defaults (uK 0.3), not tuned:
  - 2721: 0.85/2.40 and 0.56/1.59 (fails).
  - 2737: 1.37/3.86 and 1.21/3.43 (passes).
  - 2753: 1.06/3.00 and 1.15/3.26 (passes).
  - 2 of 3 fresh blocks pass both controls. This is provisional, not confirmed.

## 4:06 PM PT turn (dev seeds 2769–2800)
- RPT-2 onset reset (onR, default off): sensory onset truncates CTX slow-NMDA persistence, modelling PV inhibition recruited by an onset transient (Gutkin et al. 2001; Cardin et al. 2009).
  - It works mechanically: mean |nmdaS| drops from 8.97 to 0.44.
  - XOR is still absent: offline decode 0.49–0.54, interaction ≤0.13.
  - RPT2R 2785: onR0.8 −0.13/−0.37; plus apical gating −0.02/−0.05; onR1 plus apical gating −0.44/−1.25 → null.
  - So slow-NMDA dominance was not the sole cause; the spiking soma remains near-additive in a and b. Not adopted, so defaults are unchanged and the 2625 recheck still stands.
- HOT3RM held-out 2769 (no tuning): vs random 1.01/2.85 (passes), vs shuffled 0.82/2.33 (t fails) → **not confirmed**. Tally: 2 of 4 fresh blocks pass both controls.

## 4:08 PM PT turn (dev seeds 2801–2848)
### RPT-2: why cortical cells stay additive (unit diagnostics, seed 2801; no fix yet)
Module-0 cells: a-effect up to 0.35, b-effect ≤0.09 (mean 0.027 ≈ mixLesion 0.025), a×b interaction ≤0.05. No saturated/silent units (rates 0.1–0.5, v p5/p50/p95 −1.24/0/2.55): a linear regime, not threshold/saturation. Cross synapses only lower mean rate (0.354→0.304): the cross drive is non-specific and cancelled by E/I balance (normalization). Fan-in is sparse (~1.8 module-1 synapses/cell), and one-hot b makes total cross drive b-invariant, so no cell can see b-specific input. Patchy wiring (xsW 1, 3) still null. Root cause = connectivity carries no b identity to individual cells + balanced linear regime.
**Neuro:** multiplicative mixing needs convergent, feature-specific input onto a nonlinear dendrite (Larkum 2013; Rigotti et al. 2013, mixed selectivity); balanced networks linearize population responses (van Vreeswijk & Sompolinsky 1996).
### Ceiling tests → R variants (NEW, disclosed; originals still reported)
- PROJ-R: graded external pushes (0–0.6) on half the trials on top of own commands; comparator threshold unchanged. Neuro: Frith, Blakemore & Wolpert 2000.
- CQM18-R: the original 40% CTX lesion is bypassed by the L4 path. The R lesion remaps afferents (permutation of the module-0 readout inputs; Merzenich et al. 1983); frozen = no synaptic or readout plasticity after lesion.
- GWT-3R and CQM08R (C08R) already existed (v3.6); rerun on new seeds.
### HOT3RM block variance
Paired diff vs shuffled: mean 0.037, sd 0.024 (n=64, dz≈1.5). Unpaired d is diluted by between-seed accuracy SD (0.03–0.044); shuffled-arm accuracy correlates −0.56 with the diff. Expected block d≈1 → ~half of blocks pass. Source = between-seed baseline variance, not the mechanism. A paired analysis would be a disclosed variant; not adopted this turn.
