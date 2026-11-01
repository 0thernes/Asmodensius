# Specialist: HOT3RM (HOT-3 metacognitive opt-out)
Substrate: Creature #1 v5.7b (ORG_V5=11) with one flag on; controls are the test's own (random opt-out at matched rate, shuffled confidence). Dev seeds only.

Cheap screen (8 seeds, block 520; pass needs d>=0.8 and t>=2.75 vs both controls, weakest shown):
| v | approach (source) | flags | d / t | result |
|---|---|---|---|---|
| v01 | active-inference stack: EFE info gain + empowerment + SR + belief-precision confidence (Friston 2015; Klyubin 2005; Dayan 1993; Meyniel 2015; SUPER CREATURE) | scAIe1 scEm1 scSR1 scAIm0.5 | 1.71 / 3.4 | PASS |
| v02 | belief-precision confidence only (Meyniel, Sigman & Mainen 2015) | scAIm0.5 | 1.10 / 2.2 | fail (screen) |
| v03 | soft capacity-limited workspace, T=1 (Baars; Cowan; SUPER CREATURE gwtCapacity) | scGW1 scGWT1 | 1.11 / 2.2 | fail |
| v04 | workspace, no capacity limit (K=16) | scGW1 scGWk16 | 0.57 / 1.1 | fail |
| v05 | V6 binding hub, no learned precision (Gayler 2003) | ORG_V6 v6P0 | 1.06 / 2.1 | fail |
| v06 | Hebbian fast weights + learned recurrence (Ba et al. 2016; SUPER CREATURE FastWeights) | scFW1 scLR1 | 1.30 / 2.6 | fail (near) |
| v07 | sampling-based confidence, noise 0.5 (Buesing et al. 2011) | scSMC0.5 | 0.47 / 0.9 | fail |
| v08 | sampling-based confidence, noise 0.2 | scSMC0.2 | 0.56 / 1.1 | fail |
| v09 | belief-precision confidence, weight 1.0 | scAIm1 | 0.86 / 1.7 | fail |
| v10 | workspace T=0.5 | scGW1 scGWT0.5 | see raw | |

Full dev (16 seeds, block 540): base 0.73/2.1 fail; v01 1.79/5.1 PASS; v06 1.03/2.9 PASS; v03 0.80/2.3 fail; hybrid A (v01+v03) 1.91/5.4 PASS; hybrid B (v01+v06) see raw. Block 500 (16 seeds): v01 1.49/4.2 PASS, v02 1.28/3.6 PASS, v03 1.94/5.5 PASS but GWT2 effect -3.3 d vs base (regression), v06 fail.
Ablation inside v01: without scAIm (aiC) HOT3RM fails (0.61) -> the gain is carried by belief-precision confidence (scAIm). Hybrid A is best on 540 but costs GWT2, so the port choice is v01's scAIm (+ optional rest of the stack).

## Port and integration check (Alex's rule)
Port = scAIm 0.5 plus scCI 1 (confidence below its running mean drives the LC via predErr; hunger lowers the weight on belief precision).
- (b) state dependence: PASS. Belief-precision weight 0.47 when sated vs 0.28 when hungry (16 dev seeds, seed base 600).
- (a) ablation moves >=2 other subsystems: FAIL. In a natural life (no test teaching) the monitor never learns: conf stays 0.5 and margin 0 every tick, because the action readout (mind.act) and the confidence monitor (meta3) are trained only by the harness calls teachAction/teachConf. So nothing reaches NE, sleep, foraging or mood (all paired differences exactly 0). This is an architecture finding, not a tuning problem: HOT-3 as built is a test-only pathway.
- Needed fix (not done yet): self-supervise confidence from the creature's own forage outcomes (confidence about the chosen site = Beta-posterior precision and race margin, trained on got/not-got), so it exists outside tests and can drive LC and learning rate.
