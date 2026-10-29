# Handoff to the Round 17 worker: why creature 001 fails two scorecard rows (lab-side diagnosis; creatures/001 untouched)

All numbers: dev seeds 2000-2005 (lab `diag9.ts`, `rptProbe`), creature 001 as of the current working tree.

## 1. Recurrent processing (RPT row, 0/4)
Findings:
- Connectome counts: THAL->CTX 364 synapses, CTX->THAL only 54 (feedback ~15% of feedforward; in mammals corticothalamic L6 feedback outnumbers thalamocortical input ~10:1).
- Cutting CTX->THAL lowers mean CTX rate by 0.014 of 0.171 (p 0.28). Cutting THAL->CTX lowers it by 0.089 (p 0.036). Cutting CTX->CTX (1511 synapses) changes it by +0.003 (p 0.88).
- Evoked response to a SENS pulse (rptProbe, evoked minus sham twin): early (1-10 ticks) +0.094 to +0.100; late (11-60) is NEGATIVE (-0.007 to -0.008), an adaptation undershoot. There is no sustained late phase for feedback to carry.
- Cutting CTX->CTX RAISES the early response (0.100 -> 0.129) and removes the undershoot: cortical recurrence is net inhibitory/stabilising, not amplifying.
Conclusion: the RPT signature is absent by construction, not a probe failure. The row stays FAIL.
Proposed organism-side mechanisms (for organism.ts, not done here):
1. Strengthen corticothalamic feedback: raise CTX->THAL fan-out to >= THAL->CTX (L6-like, modulatory gain on THAL relay rather than drive).
2. Slow recurrent excitation in CTX: an NMDA-like slow excitatory current (tau ~ 50-100 ticks) on CTX->CTX so evoked activity can reverberate for tens of ticks.
3. Ignition-gated sustain: when the workspace ignites, raise CTX->CTX gain transiently so the winning module's activity persists (ties RPT to GWT ignition already present).
Acceptance test to run after the change: rptProbe late window > 0 for intact, and cutting CTX->THAL or CTX->CTX reduces late by >= 50% while early changes < 20%.

## 2. Interoceptive self-model (INS decoder row, 0/4)
Findings (seed 2000, one day): blood glucose 2.34-4.12 (53% of ticks > 3, so labels are balanced). corr(mean INS rate, glc) = -0.07; corr(mean HYP rate, glc) = -0.77.
Decoding glc > median: from INS 0.558 (shuffled 0.514), from HYP 0.953, from the body part 0.997. The glucose signal reaches HYP, not INS.
Conclusion: 001's insula is driven by touch (adapter sense(): INS stim on touch) and its RLS insula model, but no visceral glucose afferent reaches it. The row stays FAIL; the scorecard is not re-pointed at HYP after the fact.
Proposed organism-side mechanisms:
1. Visceral afferent: blood glucose, ENS activity and heart rate drive an INS input population (vagal/NTS-like route), like the existing HYP glucose sensing.
2. Make the RLS insula model predict body variables (glc, hr) from INS activity, with the prediction error fed back into INS (interoceptive predictive coding).
3. HYP->INS coupling (currently only INS->HYP exists) so homeostatic state is re-represented in INS.
Acceptance test: INS decodes glc > median at >= 0.75 balanced accuracy vs shuffled ~0.5 on seeds 1000-1003.
