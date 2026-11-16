# FREAK-100: weird and fringe architecture ideas for creature 001 (2026-11-01)
Each line gives the name, the core mechanism, a source with its confidence, and the failing test it could help.
Source confidence: [H] = well-known published work, citation checked from memory against standard references; [M] = published, but the exact venue or year is uncertain; [L] = fringe, speculative or preprint; [A] = Alex's or Tsotchke's own work (allowed for use).
Failing tests: RPT2R, AINF, CQM10 (C10), C03R, CQM04 (C04), UAL-at-scale, HOT3RM.
Concepts only. No other A-Life project's code or mechanics is used.

## A. Binding and conjunction (multiplicative or nonlinear mixing)
1. Sparse expansion layer (granule-like): random fan-out from the relay plus a k-WTA threshold, so XOR becomes linearly separable. Source: Litwin-Kumar et al. 2017, Neuron [H]; Marr 1969 [H]. Helps: RPT2R.
2. Vector-symbolic binding (MAP): elementwise product of bipolar codes for each module, injected into cortex. Source: Gayler 2003 [M]; Kanerva 2009, Cogn Comput [H]. Helps: RPT2R.
3. Holographic reduced representations: circular-convolution binding. Source: Plate 1995, IEEE TNN [H]. Helps: RPT2R.
4. Gamma-phase binding: cues that fire in the same gamma cycle bind, read out as phase-locked rate. Source: Singer & Gray 1995 [H]; von der Malsburg 1981 [H]. Helps: RPT2R.
5. Theta-gamma nested code: items held in gamma subcycles inside theta. Source: Lisman & Jensen 2013, Neuron [H]. Helps: RPT2R, AINF.
6. Shunting-inhibition XOR: divisive inhibition that is non-monotonic in its input. Source: Koch & Poggio 1992 [M]. Helps: RPT2R.
7. Single-neuron XOR via dendritic calcium action potentials (dCaAP), which peak at threshold and fall beyond it. Source: Gidon et al. 2020, Science [H]. Helps: RPT2R.
8. Gain-field multiplicative units: one input scales another's tuning. Source: Salinas & Abbott 1996 [M]; Andersen 1985 [H]. Helps: RPT2R.
9. Sigma-pi dendritic clusters: products of synapse clusters. Source: Mel 1992 [M]; Poirazi, Brannon & Mel 2003, Neuron [H]. Helps: RPT2R.
10. Randomly connected mixed-selectivity cells. Source: Rigotti et al. 2013, Nature [H]; Barak et al. 2013 [M]. Helps: RPT2R.
11. Tensor-product binding. Source: Smolensky 1990, AI [H]. Helps: RPT2R.
12. Conjunctive hippocampal (CA3) codes for cue pairs. Source: O'Reilly & Rudy 2001 [M]. Helps: RPT2R, CQM12.
13. Burst multiplexing: the event rate codes the basal input and the burst fraction codes the apical input. Source: Naud & Sprekeler 2018, PNAS [H]. Helps: RPT2R, HOT3RM.

## B. Temporal and analog coding beyond 7 rate levels
14. Spiking neural networks with time-to-first-spike codes. Source: Thorpe et al. 2001 [H]; Maass 1997 (third generation) [H]. Helps: RPT2R.
15. sLTC neurons, Alex's term, read in the repo as Spiking Liquid Time-Constant neurons, where tau depends on conductance. Source: Vanhalle & Gielen, ICECS 2025, as cited in preregistrations/v3.3.md [M]; Hasani et al. 2021, AAAI (LTC) [H]. Helps: RPT2R, HOT3RM.
16. More sub-steps per tick, giving finer rate levels (SUB 6 to 24). Source: engineering, no citation [-]. Helps: RPT2R.
17. Population rate with dithering noise: stochastic resonance breaks the quantisation. Source: McDonnell & Abbott 2009, PLoS CB [H]. Helps: RPT2R.
18. Readout from membrane voltage (subthreshold analog) rather than spikes. Source: Carandini & Ferster 2000 [M]. Helps: RPT2R.
19. Liquid state machine as a reservoir with a plastic readout. Source: Maass, Natschläger & Markram 2002 [H]. Helps: RPT2R.
20. Echo-state reservoir with a FORCE-trained readout. Source: Jaeger 2001 [H]; Sussillo & Abbott 2009, Neuron [H]. Helps: RPT2R, UAL.
21. Polychronous groups: time-locked spike patterns. Source: Izhikevich 2006, Neural Comp [H]. Helps: RPT2R.
22. Resonate-and-fire neurons that are frequency selective. Source: Izhikevich 2001 [H]. Helps: RPT2R.

## C. Predictive coding, precision, active inference
23. Predictive-coding hierarchy with precision-weighted errors. Source: Rao & Ballard 1999 [H]; Friston 2005 [H]. Helps: HOT3RM, AINF.
24. Precision as metacognitive confidence, read for opt-out. Source: Fleming & Daw 2017, Psych Rev [H]. Helps: HOT3RM.
25. Interoceptive active inference: hunger as predicted interoceptive error. Source: Seth 2013, TiCS [H]; Barrett & Simmons 2015 [H]. Helps: CQM10.
26. Expected free-energy site choice. Source: Friston et al. 2015 [H]. Helps: AINF (per the B23 map, raw reward is blind to it).
27. Dendritic prediction errors: apical minus basal. Source: Sacramento et al. 2018, NeurIPS [H]. Helps: RPT2R.
28. Time-to-collision of a glucose forecast (anticipatory drive). Source: Sterling 2012, allostasis [H]. Helps: CQM10.
29. Learned precision on the drive channel: confidence in the interoceptive forecast gates feeding. Source: Ainley et al. 2016 [M]. Helps: CQM10.

## D. Homeostatic control (body)
30. Integral feedback on glucose error, so there is zero steady-state error. Source: Yi, Huang, Simon & Doyle 2000, PNAS [H]. Helps: CQM10.
31. Antithetic integral motif: two molecules annihilate each other. Source: Briat, Gupta & Khammash 2016, Cell Systems [H]. Helps: CQM10.
32. Satiation cascade: gut stretch, then CCK, then GLP-1 over three timescales. Source: Cummings & Overduin 2007 [M]. Helps: CQM10.
33. Rheostasis: the set-point itself drifts with season or circadian phase. Source: Mrosovsky 1990 [H]. Helps: CQM10, CQM04.
34. Body-plan plasticity: organ allocation follows the load placed on it (Baldwin effect). Source: Hinton & Nowlan 1987 [H]. Helps: CQM04.
35. Hormesis gene expression: stress-driven slow gene-expression state. Source: Calabrese 2008 [M]. Helps: CQM04.
36. Allostatic load accumulator. Source: McEwen 1998, NEJM [H]. Helps: CQM04, CQM10.
37. Brown-fat thermogenic buffer: burns excess glucose to clip highs. Source: Cannon & Nedergaard 2004 [H]. Helps: CQM10.
38. Glycogen buffer with astrocyte-lactate shuttle. Source: Pellerin & Magistretti 1994, PNAS [H]. Helps: CQM10.

## E. Glia, slow gating, neuromodulation
39. Astrocyte slow calcium gate on plasticity. Source: Araque et al. 1999 tripartite synapse [H]. Helps: UAL, HOT3RM.
40. Astrocyte network as a working-memory integrator. Source: De Pittà, Brunel & Volterra 2016 [M]. Helps: HOT3RM.
41. Neuromodulator-gated mixture of brains: DA, NE and ACh select expert subnetworks. Source: Doya 2002, Neural Networks [H]; Jacobs et al. 1991 MoE [H]. Helps: UAL, AINF.
42. LC adaptive gain, switching between exploit and explore modes. Source: Aston-Jones & Cohen 2005 [H]. Helps: AINF.
43. ACh/NE expected vs unexpected uncertainty. Source: Yu & Dayan 2005 [H]. Already present.
44. Serotonin patience / discount control. Source: Miyazaki et al. 2014 [M]. Helps: CQM10.
45. Neuropeptide broadcast as a volume-transmitted slow "mood bus". Source: Bargmann 2012, BioEssays [H]. Helps: CQM10.
46. Microglial synaptic pruning during sleep. Source: Schafer et al. 2012, Neuron [H]. Helps: UAL-at-scale.
47. Synaptic homeostasis hypothesis: downscaling during sleep. Source: Tononi & Cirelli 2014 [H]. Helps: UAL-at-scale.

## F. Plasticity rules and meta-learning
48. Eshkol-differentiable meta-learning of the plasticity-rule coefficients. Source: Miconi et al. 2018 differentiable plasticity [H]; Eshkol [A]. Helps: RPT2R, UAL.
49. Behavioural time-scale plasticity (BTSP): one-shot plateau-driven learning. Source: Bittner et al. 2017, Science [H]. Helps: RPT2R, CQM12.
50. Three-factor eligibility traces. Source: Gerstner et al. 2018 [H]. Helps: UAL.
51. e-prop for spiking recurrent nets. Source: Bellec et al. 2020, Nat Comm [H]. Helps: RPT2R.
52. Bienenstock-Cooper-Munro sliding threshold. Source: BCM 1982 [H]. Helps: RPT2R.
53. Fan-in normalised UAL value learning. Source: Turrigiano 2008 [H]. Helps: UAL-at-scale.
54. Learned synaptic consolidation (cascade model). Source: Fusi, Drew & Abbott 2005 [H]. Helps: UAL.
55. Node-perturbation / weight-perturbation learning that uses noise. Source: Fiete & Seung 2006 [H]. Helps: RPT2R.
56. Feedback alignment. Source: Lillicrap et al. 2016 [H]. Helps: RPT2R.
57. Hebbian-plus-anti-Hebbian decorrelation (whitening). Source: Földiák 1990 [H]. Helps: RPT2R.

## G. Developmental and evolutionary (indirect encodings)
58. Compositional pattern-producing genome: a body or brain grown from a compact function. Source: Stanley 2007 (CPPN concept) [H]. Helps: C03R, CQM04.
59. Gene-regulatory-network developmental genome. Source: Davidson 2006 [M]. Helps: CQM04.
60. Evolvable learning rates (meta-genes). Source: Baldwin 1896 [H]; Hinton & Nowlan 1987 [H]. Helps: C03R.
61. Density-dependent fecundity: birth count tied to the food pool through a heritable energy threshold. Source: logistic regulation, Verhulst 1838 [H]. Helps: C03R.
62. Maternal provisioning: offspring energy taken from the parent's reserves. Source: Smith & Fretwell 1974 [H]. Helps: C03R.
63. Neural Darwinism: selection among neuronal groups. Source: Edelman 1987 [H]. Helps: UAL.
64. Genomic bottleneck: wiring compressed through a small genome. Source: Zador 2019, Nat Comm [H]. Helps: CQM04.
65. Morphogen gradient field (Turing) to lay out cortical maps. Source: Turing 1952 [H]. Helps: CQM04.
66. Bioelectric pattern memory. Source: Levin 2014 [M]. Helps: CQM04.
67. Epigenetic memory of parental starvation (Dutch hunger winter analogue). Source: Heijmans et al. 2008, PNAS [H]. Helps: CQM04, C03R.

## H. Stochastic and quantum-flavoured exploration
68. QRNG-sampled exploration noise (true entropy into the softmax temperature). Source: Tsotchke QRNG [A]; no evidence of a behavioural advantage over a PRNG [L]. Helps: AINF (expected null).
69. Noisy-net exploration with learned noise scale. Source: Fortunato et al. 2018, ICLR [H]. Helps: AINF.
70. Lévy-flight foraging. Source: Viswanathan et al. 1999, Nature [H]. Helps: AINF.
71. Sampling-based probabilistic inference (neural sampling). Source: Buesing et al. 2011 [H]. Helps: HOT3RM.
72. Moonlab quantum-circuit "superposition" over options, collapsed by drive. Source: Tsotchke Moonlab [A]; quantum cognition, Busemeyer & Bruza 2012 [M], with no neural evidence [L]. Helps: AINF.
73. Chaotic itinerancy as an exploration generator. Source: Tsuda 2001 [M]. Helps: AINF.
74. Spin-glass instinct floor (Hopfield/Ising settling). Source: Hopfield 1982 [H]; Tsotchke spin_based_neural_network [A]. Helps: HOT3RM.
75. Stochastic-resonance boosting of weak cues. Source: Douglass et al. 1993, Nature [H]. Helps: RPT2R.

## I. Whole-brain and multibrain hybrids ("Frankenstein")
76. Alex's SUPER CREATURE 1.0 Biomimetic Multibrains: a polymorphic composite of about 12 specialised sub-networks in a 5-stage pipeline (perceive, imagine, reason, feel, act), with a Thaler-style creativity machine (noise-perturbed imagitron plus perceptor critic), a 5x5 tree of thought and a dream consolidator. Source: /workspace/cq5/src/sim/super-mind.ts and ADR-0008 [A]; Thaler 1997 Creativity Machine [M]. Helps: AINF, HOT3RM.
77. Creativity-machine critic as a metacognitive confidence signal (perceptor novelty as uncertainty). Source: Thaler [M]; [A]. Helps: HOT3RM.
78. Cerebellar forward-model sidecar: a granule expansion plus Purkinje delta rule for interoception. Source: Wolpert, Miall & Kawato 1998 [H]. Helps: CQM10, RPT2R.
79. Basal-ganglia action gating as a mixture-of-cortex selector. Source: Redgrave, Prescott & Gurney 1999 [H]. Helps: AINF.
80. Thousand Brains cortical-column voting. Source: Hawkins et al. 2019, Front Neural Circuits [M]. Helps: HOT3RM.
81. Global workspace plus a slow parallel "unconscious" reservoir. Source: Dehaene & Changeux 2011 [H]. Helps: HOT3RM.
82. Two-brain consensus (left/right hemispheres with different priors, a corpus-callosum arbiter). Source: Gazzaniga 2000 [M]. Helps: HOT3RM.
83. Insect mushroom-body (Kenyon cell) valence module grafted onto the vertebrate cortex. Source: Aso et al. 2014, eLife [H]. Helps: RPT2R, UAL.
84. Octopus-style distributed arm ganglia as local body controllers. Source: Hochner 2012, Curr Biol [H]. Helps: CQM04.
85. Hyperdimensional associative hippocampus. Source: Kanerva 1988 sparse distributed memory [H]. Helps: RPT2R, CQM12.
86. Hypernetwork: a slow brain writes the fast brain's weights. Source: Ha, Dai & Le 2017 [H]; Schmidhuber 1992 fast weights [H]. Helps: UAL.
87. Fast weights (Hebbian short-term matrix) for binding. Source: Ba et al. 2016 [H]. Helps: RPT2R.
88. Attention as multiplicative binding (query-key product) inside a spiking module. Source: Vaswani 2017 [H]; biological reading, Whittington et al. 2022 [M]. Helps: RPT2R.
89. Modern Hopfield / dense associative memory (polynomial energy gives products). Source: Krotov & Hopfield 2016 [H]. Helps: RPT2R.
90. Tolman-Eichenbaum machine-style structural binding. Source: Whittington et al. 2020, Cell [H] (concept only). Helps: RPT2R.

## J. Fringe and exotic (low confidence; listed for completeness)
91. Ephaptic coupling: field effects synchronise neighbours without synapses. Source: Anastassiou et al. 2011, Nat Neuro [H] (effect real; computational role [L]). Helps: RPT2R.
92. Microtubule/Orch-OR "quantum" computation. Source: Hameroff & Penrose 2014 [L]. Helps: none credible.
93. Dendritic spine-neck electrical compartments as bits. Source: Yuste 2013 [M]. Helps: RPT2R.
94. Myelin plasticity tuning conduction delays for synchrony. Source: Fields 2015 [M]. Helps: RPT2R.
95. Gap-junction interneuron nets for fast synchrony. Source: Galarreta & Hestrin 2001 [H]. Helps: RPT2R.
96. Critical-branching self-organised criticality as a gain setpoint. Source: Beggs & Plenz 2003 [H]. Helps: UAL-at-scale.
97. Dendritic-spine "memory engram" tagging (synaptic tag and capture). Source: Frey & Morris 1997 [H]. Helps: UAL.
98. Gut-microbiome mood/appetite bus. Source: Cryan & Dinan 2012 [M]. Helps: CQM10.
99. Circadian clock gating of plasticity (learn only in the active phase). Source: Gerstner & Yin 2010 [M]. Helps: UAL.
100. Free-energy-minimising morphology (body shape as inference). Source: Friston/Levin 2015 [L]. Helps: CQM04.

## Prototype shortlist (chosen from this list)
- #1 + #2: sparse expansion / VSA binding drive into cortex. Target: RPT2R.
- #30: integral feedback on the appetite drive. Target: CQM10.
- #61 + #60: density-dependent heritable fecundity. Target: C03R.
- #39 / #47: astrocyte slow gate (if time allows). Target: UAL, HOT3RM.
