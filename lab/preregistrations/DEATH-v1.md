# DEATH-v1 preregistration (lab v0.9): lifecycle rule and viability monitor
> Provenance: first committed at 12:3x London time on Oct 29 as b814ea6, before test seeds, with results in 47839d3. Both commits were lost when the box was rolled back (about 12:32). This text is restored verbatim from the session record and recommitted at 14:1x.
> The predictions below were made for organism v3.7. The rerun on organism v3.8a is reported separately in RESULTS-DEATH-v1.md and is not re-scored against them.

## Diagnosis (v3.7)
- The live creatures were dead by creature 001's own rule (`o.dead`: >120 ticks of blood glucose <0.9 or ATP <1).
  - The v1→v2 migration exposed this. v1 restores had resurrected starved creatures with a fresh organism, so earlier deaths stayed hidden.
  - Nothing in the lab honoured `o.dead`, so metabolism ran on to ATP −12 000. Heat balanced it, so the ledger stayed exact.
- Not a dial, and not food depletion (patches at cap).
- Root cause (organism-side): negative energy balance. A fresh 5×001 dome dies on days 11-13.5; 001 alone dies on day ~16. Intake is 50-66 kJ/day against a fat loss of 20-28 kJ/day.

## Rule (dials `deathRule`, `respawnAfter`)
1. `deathRule: "organism"` (default): when `alive()` is false, the dome stops sensing, stepping and moving that creature, and its energy stays in the ledger. There is no homeostatic floor, because a floor would create energy.
2. `respawnAfter: N > 0` (0 in batteries, 60 in the viewer): N ticks after a death, the corpse energy goes to detritus and a newborn (seed 7000000 + 1000·domeSeed + births) replaces it. Its energy is logged as `born`. Ledger: total = E0 + grown + born.

## Predictions (viability.ts: 5×001, default dome, respawn 60, 20 days, test dome seeds 1000-1004)
| # | Check | Prediction |
|---|---|---|
| P1 | world ledger error | < 1e-9 every tick |
| P2 | dead creature stepped | never |
| P3 | living creature ATP < −1 | never |
| P4 | alive fraction | ≥ 0.95 |
| P5 | median lifespan ≥ 30 d | FAIL predicted for v3.7 (dev 12.3 and 17.3 d) |
| P6 | DIALS-v5 dev outputs (2 d) unchanged by the rule | identical |
Also: `/inspect` qrng reports the v3.6+ debiased sign (the lab instrument used the pre-v3.6 raw bit-0 formula), and `/inspect` sends CORS headers.
