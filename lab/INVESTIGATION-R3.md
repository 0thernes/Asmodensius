# Round 3 investigations (read-only on organism.ts)

## Hyper-stim dial makes the creature sleep MORE
The dial injects current into SENS. Two mechanisms explain the result:
1. **Adenosine.** Sleep pressure grows with brain activity (line 430): `S += 0.0008·brainD/0.0075` while awake. More spiking means faster S, which means more sleep. This is a real homeostatic effect, not a bug.
2. **Orexin bypass.** The v3.5 orexin wake-hold (line 287) reads `this.sens`, the task sensory lines, not the `stim` current. Injected current therefore never engages arousal.

The original hypothesis was wrong for this model and is recorded as FAIL. Two R versions were tested:
- (a) The reversed prediction, which passes (+0.021 asleep, d 1.68).
- (b) `sensoryLinesR`, which writes `o.sens` through the new `senseLines` hook. Sleep goes to 0 (complete insomnia), which is an extreme effect. The dial needs a dose-response sweep before it is usable as a gentle knob.

## NE shift does nothing to sleep
The sleep drive (line 286) is `S − C + 0.15·melatonin`, with no NE term. Only LC *stim* above 3 forces wake. So an NE shift cannot move sleep by construction.
- The manipulation itself works: NE rises from 0.122 to 0.251, so reuptake does not clear the shift (correcting my Round 2 guess).
- NE feeds neuronal gain (line 326) and the workspace and epistemic weight (line 438). The R target is workspace ignitions, which rise from 649 to 668 (p 1e-4).

## Motor lens
Foraging is stochastic: hazard h = clamp(3·hunger − 0.1) per awake tick (line 379). The oracle ceiling is about 0.76 balanced accuracy, and the lens reaches 29 % of the way from chance to that ceiling.

## QRNG "17.5 % ones"
- **Not a measurement bug.** `qOut = measure(prepare(π·[DA, 5HT, NE]))`. The modulators are low (about 0.1-0.25), so the state sits near |000⟩, and the Born rule yields few ones. Observed frequencies match Born within 0.005.
- **The entropy is not quantum.** The u in `measure(u)` comes from `ent()`, which is seeded mulberry.
- **Real bias bug: the sign of the decision noise.** `choose()` (line 444) uses `(measure(ent()) & 1) ? 1 : −1` as the sign of its Gaussian noise. P(bit0) ≈ 0.13, so the mean sign is about −0.75 instead of 0, and decisions get a systematic negative offset.
- **Proposed organism fix, for the Round 16 owner (NOT applied here).** Draw the noise sign from a separate register prepared with Hadamard (θ = π/2) on qubit 0, which gives an unbiased Born-rule outcome. Alternatively, debias with von Neumann on bit 0, which passes NIST 4/4. Keep the modulator-prepared register as a deliberately state-dependent "quantum mood" signal, labelled as biased by design.
- **Debiasing for the dome's dice.** VN→Toeplitz(64→32) passes NIST 4/4. It still certifies only a PRNG until a hardware or ANU QRNG source is wired in.

## Not done / gaps
- Waste recycling is far too small to see in 1 day. It needs a local-patch metric or a longer run (DIALS-v2).
- The game strategy is a fixed DA threshold, not learned.
- Gas dials are labelled proxies (the organism has no respiration model).
- Full transplant is still FAIL (it needs organism snapshot/restore).
