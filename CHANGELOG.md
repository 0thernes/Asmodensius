# Changelog
## [0.5.0] - 2026-10-28
- Pre-registration v2.1, committed before any code: CQM-23 substrate pluralism (RV32IM / GLSL / JS), CQM-24 bit reproducibility, CQM-25 embodied and visual scale. All pass.
- AST-1: surprise-inflated focus uncertainty (ASTA=0.001, chosen on held-out seeds). Against the random control, d went from 1.03 to 1.85.
- RV32I interpreter gained RV32M `mul` and `LUI`.
- Research site, 150-project benchmark, 100-capability roadmap, grounding pages, CI.
## [0.4.0]
- Pre-registration v2: non-ceiling re-tests for active inference, CQM-10, CQM-21. All pass. The v1 failures stand.
- iit4 strengthening (phi-proxy fitness term, α=0.1).
## [0.3.0]
- v3 creature: shader body, limb chains, photosensitivity gate, calm mode, mute.
## [0.1.0]–[0.2.0]
- v1 harness: Butlin 14, 10 frameworks, CQM-25 dimensions.

## Round 7 (2026-10-28)
- CQM-21 now passes under v1 via an itinerant Gray-code CPG mechanism (caveat logged). v1 is 44/49.
- AST-1 held-out diagnostics: an oracle bound shows the frozen metric cannot pass bases 2000/3000. AST-1R was preregistered in v2.2 and fails at base 3000 only.
- The app limb motion uses the shared `limbNodeStep`.
- Preregistration v2.2: 9 of 11 pass; 9 of 100 roadmap capabilities are achieved as small harness models.
- Benchmark rubric: 7 → 8.5. E is tested (CQM-01/02) and R is partial; the asymmetric-scoring caveat is shown on the page.
- Link check (2026-10-28): the benchmark TSV citations are plain-text references with no URLs, so there were no citation links to check. The site's only outbound links are github.com/tsotchke/eshkol and github.com/tsotchke/moonlab; both returned HTTP 200. The README CI badge still points at a placeholder OWNER repo, because the repo is unpublished by design.

## Round 8 (2026-10-28)
- REVERTED the round-7 CQM-21 mechanism (Gray-code binary counter). It passed only because a deterministic state cycle covers states more evenly than iid sampling, which is not genuine differentiation. CQM-21 is reported as FAIL again under v1.
  Why no real mechanism can pass this frozen test: its metric is the unconditioned plug-in state entropy of 6 binary units, and its control is iid fair coins, the maximum-entropy source. Any genuine stochastic network, including stimulus-dependent repertoires, has true entropy ≤ 6 bits. Its expected plug-in estimate cannot exceed the iid control except through super-uniform (counter-like) coverage. The non-ceiling differentiation test v2-21 (C_N, I(S;X)) passes.

### Round 8 (continued)
- CQM-21 is reported FAIL. The counter mechanism was reverted because a deterministic state cycle that games entropy coverage is not genuine differentiation.
- AST-1R (base 3000) and RM-10 are still FAIL and are reported honestly (see HARNESS_CHANGES.md).
- The live creature now has circadian arousal (modulates limb reach, HUD day/night), stimulus-specific habituation of the poke startle, and a tamper-evident lineage chain driven by the RV32I mutation word. Prereg v2.3 LIVE tests: NOT RUN yet.

## Round 9 (2026-10-29, Asia/Manila): v2.4
- `item()` in harness.ts is now exported, with no behaviour change, so the v2.4 tests can reuse it.
- New mechanism module `harness/v24mech.ts` (mutable): PI thermostat, task-gated readout, RPE dopamine gate, energy-budget waiting, run-and-tumble, energy-budget risk rule, log-scale numerosity, Bouton two-process extinction, TMR genome scrubbing, dormancy switch, cosine population code.
- New frozen test module `harness/v24tests.ts` follows preregistrations/v2.4.md (commit 4d820ee). Before the first full run, three in-progress edits were made so the tests match the prereg text: the RM-29 metric is pure retention; RM-52 uses the sample Var(s); the RM-97 energy cap was removed because the prereg doesn't specify one. Nothing has changed in it since the first full run (results/run10.txt).
- Result: v2.4 passed 11/11 on the first run. Several tests are easy by construction, as stated on the site.

## Round 10 (2026-10-29)
- Preregistration v2.5 adds CQM-21R, differentiation measured on the creature's own network, with shuffled-weight, lesion and rate-matched iid controls. The first run FAILED vs shuffled weights (d 0.62, t 1.74). Addendum v2.5a adds developmental Hebbian/anti-Hebbian plasticity. The rerun PASSES: d 2.10/3.46/3.47, t 5.95/9.79/9.80. CQM-21R does not count as v1 CQM-21. CQM-21 stays FAIL.
- Fixed the corrupted creature index.html (nested bundles caused a SyntaxError), so the live page now actually runs. Headless Chrome renders at about 0.6 fps on SwiftShader.
- Site regenerated, with fresh screenshots.

## Round 11 (2026-10-29, Europe/London): prereg v2.6
- Preregistration v2.6 (7939995) was committed before any code. Mechanisms + frozen tests (83c119b) were committed before the test-seed run. Results: results/run14.txt.
- RM-10R PASS: vs persistence d 4.53, t 12.81; vs no-efference-copy d 1.94, t 5.49. Same world and mechanism as RM-10, but T=10000 (chosen by power analysis on tuning seeds). This is a power fix, not a new mechanism. Frozen RM-10 stays FAIL (d 0.01).
- RM-64 perceptual bistability PASS: gamma shape k 6.39 vs Poisson 1.26, d 3.03, t 8.57.
- RM-83 latent learning PASS: vs naive d 2.26, t 6.39; vs wrong map d 2.37, t 6.71. Close to pass-by-construction.
- activeInference, CQM-10, CQM-23 and CQM-24 were already re-tested and pass under v2 / v2.1 (V2-AI, V2-10, v2.1-23, v2.1-24). Their v1 results stay FAIL / IMPL.
- AST-1R: still FAIL. No genuine improvement was found (see HARNESS_CHANGES).
- Roadmap: 20 → 23 of 100 achieved (harness models). v1..v2.5 outputs are byte-identical to run13.
