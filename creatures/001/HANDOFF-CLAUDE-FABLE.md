# Creature #1 (Asmodensius v4.0) handoff for Claude Opus 5.5 and Fable 5.2

**Written:** Tue 10 Nov 2026, about 4:50 AM US Pacific (PST, UTC-8), by Grok Bot. The previous agent was Grok Bot; Gemini Argon 4 High in Antigravity also ran on the laptop for a short time.
**Owner:** Alex Donahue (American). Report every time in US Pacific (PT). If a system clock says Manila (PHT, UTC+8), convert it.
**Assumes no prior context.** Read sections 0–4 before you touch anything. Section 11 has a kickoff prompt you can paste.
**Replaces:** `HANDOFF-GEMINI-ARGON4.md` and `ANTIGRAVITY-GOAL-ARGON4.md` (both in this folder). Older numbers there are superseded where this file differs.
**Latest real work:** Mon 2 Nov 2026, 9:04 PM PT (last result file, `/tmp/scp/integ4/c10k5.json`). Last commit: `ed3d9c5`, 6:50 PM PT. Nothing has run since then. Some repo files show 10 Nov mtimes because the box restored them; their content is unchanged.

---

## 0. TL;DR (read this if nothing else)

1. **What it is.** Creature #1 is a promptless artificial-life organism written in TypeScript (node/bun). It is scored with preregistered, controlled, falsifiable tests against these lists: Butlin-14 indicator properties, 10 consciousness theories ("frameworks"), CQM-25, LIFE-100, FREAK-100 and NOVEL-100. This is an indicator-property benchmark. **Never claim consciousness.**
2. **Official scores.** Official list totals are still Round 21 (R21, arm A = v5.7b): **Butlin 9/14, frameworks 6/10, CQM 17/25.** With disclosed R variants they are 12/14, 8/10 and 20/25, but those don't count. A harsh audit puts the defensible distinct passes at about **11–12 of 32**.
3. **Latest official round (SC-PORT Combo A,** test seeds 1112–1159, n=48)**.** RPT2R went from fail to **grade A, 3.87/19.0.** RPT2RL5, RPT1, UAL, HOT3RM and AE2 are grade A, and GWT2 held. **AE1 FAILED: d 0.73, t 5.48 at n=112.** AINF, C10 and C16R fail as well (not claimed). Commits: `6973f19` and `15543a4`. **List points did not move:** Combo A was only run on its 11 claim tests, and RPT2R is an R variant.
4. **Honesty flags you must raise with Alex (section 6.1).**
   - (a) Under a strict reading of the prereg, AE1 *was* claimed, because the 64-seed extension was run. Then its kill rule fires and Combo A fails as a round.
   - (b) The prereg's retention battery (every other test v5.7b passes) and the foraging −25% viability kill check were **not run**, so the round is incomplete.
   - (c) At n=112 the v5.7b comparator scores AE1 only 0.58. That casts doubt on R21's AE-1 pass (0.98 at n=48).
5. **Specialists (dev seeds only).** None is ready to port.
   - HOT-3 st10 fails integration check (a) and RPT1 (540: 0.97/2.7; 520: 0.63/1.8).
   - The RPT2R hybrids (Combo A + rp2 v01/v07/v08) reach d 6–8 but break RPT1 on 540 and fail (a).
   - The AE2 hybrids (RLS, particle filter) are bolted on: every other variable is bit-identical, so (a) fails.
   - CQM10 v02 (CCK satiation) is the best candidate. It passes (a) (NE, DA, foraging, rewards move) and passes the food-intake check (60.7 and 62.2 forages/day vs 54 and 62.9 for the fixed arm; fat steady). It costs AE1 on 500 (0.34 vs Combo A 0.76) and C16R on 540 (−0.05 vs 0.80).
6. **Open rule question for Alex.** Combo A itself fails AE1 on dev block 500 (0.76/2.1). Should check (c) mean "AE1 must pass" or "AE1 no worse than Combo A"? The default proposal is "no worse than Combo A". Even then, CQM10 v02 regresses on 500.
7. **Hard rules.**
   - Never `git push` without official grade A **and** Alex's explicit OK.
   - Freeze the prereg before any test seed.
   - Tune only on dev seeds below 1064.
   - Keep the dome neutral.
   - Use the specialist method (10 approaches, hybridise, weave in, pass checks a/b/c, no regressions).
8. **Not committed:** the `preregistrations/v4.0.md` B28 FINAL edit, the b28/b29 result tweaks, `specialists/AE2/v01–v10`, `specialists/HOT3RM/st09–st10`, `specialists/RPT2R/v01–v10`, the Gemini handoff files and this file.

---

## 1. What this is: Alex's vision for Creature #1

### 1.1 The vision, in Alex's terms
- A **promptless A-Life organism.** No LLM and no prompt: it lives, senses, acts and learns from its own body and world. It is the first of 100 planned creatures in the Asmodensius repo (`creatures/001 … creatures/100`).
- **Nothing cosmetic. Everything is causally interconnected.** Every part is adaptive, reactive and coupled, so dome stimuli and the creature's own state reach every other part. If a module could be deleted without changing anything else, it does not count. Integration check (a) exists for exactly this reason.
- **A morphing alien body** that can morph, mimic, expand and contract, extend and shorten, grow, die, mutate, procreate, harvest, nurture, raise young and evolve. It has alien eyes, arms and body, and **legs with their own brains** (local ganglia; LIFE-100 #27).
- **Many senses:** chemical, touch and proprioception, hearing, vision, EM and magnetic, a "quantum" sense, and substrate senses. **"Psychic", wireless and remote-viewing senses** are built as *real simulated mechanisms inside the dome*: fields and channels with cost and noise, validated against shuffle controls. They are never presented as real-world ESP claims.
- **Emotions, mood, feelings, stress, attitudes, wanting**, with many nerve types and neuromodulators (DA, NE, ACh, 5-HT, cortisol, adenosine).
- **A full life cycle:** birth, development, growth, ageing, death and decay, reproduction and mating, heredity, mutation, epigenetics, parenting.
- **The dome stays neutral.** All balancing happens inside the creature (self-regulation). You may never make the world or harness easier so that a test passes.
- **Scale target:** about 100M parameters/synapses eventually, beyond the FlyWire fly connectome (~140k neurons, ~5×10^7 synapses).
- **Long horizon:** Alex sees the project as stepping toward a super-intelligent entity, reported honestly at each stage. He wants genuinely unprecedented mechanisms (NOVEL-100). Results must be the kind a clinical, physics or neuroscience reviewer would accept: preregistered, controlled, falsifiable.

### 1.2 What exists in code (branch v4.0)
- Organism: `creatures/001/organism/organism.ts` (one large file; specialist mechanisms are flag-gated behind the `M50J` JSON env var, default off, bit-identical when off).
- Runner: `creatures/001/organism/run_v39.ts` (the `tune <TEST>` subcommand runs one test across seeds with all its arms/controls). Test definitions: `organism/tests_v31.ts` … `tests_v40.ts`. Viability: `organism/viability_v39.ts`, `organism/viab_dev.ts`.
- Architecture paths are selected by env:
  - `ORG_V5=11` → v5.7b (the official R21 baseline, arm A).
  - `ORG_V5=16` on branch `wild-arch` @ `4bc5c03` → v5.7d (R21 arm D; not ported to v4.0).
  - `ORG_V6=1` → V6 binding hub (DA-RPE consolidated; `v6P` learned precision and `v6Ak` antithetic appetite integral are sub-flags).
  - `ORG_V5=15` → v6.2.
  - `ORG_MIND=v40` → current mind; `ORG_MIND=v39` reproduces v39 bit for bit.
- v6.1 (B28, cortex-size-invariant efferent gain) **FAILED its goal.** It keeps AE1 but loses C16R and CQM12 on dev, and recovers none of C10, UAL and RPT2RL5. v6.2 (B29, a dev screen on 3961 only) also recovers none of them.
- Design docs in `creatures/001/`:
  - `CORE-ARCHITECTURE.md`, `FIRST-PRINCIPLES.md`, `REARCHITECT.md` (scale stages);
  - `DELARP-PLAN.md` (the de-LARP audit: which parts are real and which are imitation);
  - `DISCOVERIES.md`, `ORIGINS.md`, `MECHANISM_AUDIT.tsv`, `STATUS-R20.md`;
  - `LIFE-100.md`, `NOVEL-100.md`.
- FREAK-100 lives on the box at `/workspace/freak-100.md` (it is not in the repo; copy it in if you need it, see section 4).

### 1.3 Reuse and originality rules
- Concepts from the literature are allowed, with citations. **No other A-Life project's code or mechanics.**
- **SUPER CREATURE 1.0 / CQM is Alex's own work and may be reused freely.** It reached **10/10 on the 10 consciousness theories** and scored well on CQM-25, so it is the reference bar. It used **Biomimetic Multibrains.** In organism.ts, flags named `sc*` are SUPER CREATURE ports.
- Tsotchke's Eshkol and Moonlab are allowed and credited.
- The Glitchling game (`/workspace/glitchling-jam/`) is a separate creature-game and is **ON HOLD**. Its simulated psychic mechanics are fiction and must never be mixed into Creature #1 science claims.

---

## 2. Goal lists and current honest score

Grade A means d ≥ 0.8 **and** Welch t ≥ 2.75 against **every** control, plus the non-ceiling rule (section 3). "Official" means a frozen prereg run on fresh test seeds. Dev passes are not points.

### 2.1 Summary table

| List | Official (R21 arm A v5.7b, seeds 1064–1111) | With disclosed R variants (not official) | Harsh-audit view | Combo A effect |
|---|---|---|---|---|
| **Butlin 14** | **9/14** (3 partial) | 12/14 | ~7 solid; AE-1 now doubtful (v5.7b AE1 0.58 at n=112) | RPT2R (an R variant of RPT-2) fail→A in arm A; no original moved |
| **Frameworks (10 theories)** | **6/10** (2 partial) | 8/10 | ~3–4 solid (ual, sensorimotor, fieldIntegration; thaler9 weak) | none scored |
| **CQM 25** | **17/25** (3 partial) | 20/25 | ~6–8 distinct solid after duplicates and fluff are removed | none scored |
| **FREAK-100** | 0 official | — | 100 ideas listed; ~15 tried as dev specialists (RPT2R v01–v10, CQM10 v01–v10, HOT3/AE2 variants); 0 ported | — |
| **LIFE-100** (100 areas × 5 attributes = 500) | **0 preregistered passes** | — | 202 BUILT (code exists only), 27 PARTIAL, 106 PLANNED, 165 MISSING | — |
| **NOVEL-100** | 0 done, 2 partial, 98 not started | — | Foundations (99): 7 done, 38 partial, 54 not started | — |
| Previous official, R20 (v3.9) | Butlin 9/14, frameworks 7/10, CQM 17/25 | | | |

Alex also keeps a **150 A-Life comparison list** (the creature against 150 known A-Life systems). It follows the same evidence rules and has no new results this period.

### 2.2 Butlin 14: R21 official (arm A v5.7b / arm D v5.7d)

| Item | A | A d/t | D | D d/t | Notes |
|---|---|---|---|---|---|
| RPT-1 | PASS | 1.04 / 5.10 | PASS | 1.13 / 5.55 | solid; Combo A official 0.92/4.5 |
| RPT-2 | PARTIAL | −0.28 / −1.36 | PARTIAL | −0.17 / −0.81 | RPT2R A FAIL / D PASS 3.36; RPT2RL5 PASS both. Combo A official RPT2R **A 3.87/19.0** |
| GWT-1 | PASS | 2.89 / 14.17 | PASS | 3.19 / 15.64 | solid |
| GWT-2 | FAIL | 8.43 / 41.28 | FAIL | 8.43 / 41.29 | fails the **ceiling rule**, not effect size; needs harder distractors |
| GWT-3 | PARTIAL | 19.44 / 95.25 | PARTIAL | 26.15 / 128.1 | clean-stimulus ceiling original; GWT-3R PASS 10.03 |
| GWT-4 | FAIL | 14.51 / 71.10 | FAIL | 20.04 / 98.16 | |
| HOT-1 | PASS | 2.08 / 10.18 | PASS | 2.13 / 10.45 | solid |
| HOT-2 | PASS | 2.06 / 10.09 | PASS | 2.10 / 10.30 | solid (also counted as CQM13) |
| HOT-3 | PARTIAL | ~0.01 | PARTIAL | ~0 | HOT3RM PARTIAL; HOT3RM-P PASS dz 1.15. Combo A official HOT3RM **A 1.43/7.0** |
| HOT-4 | PASS | 6.31 / 30.89 | PASS | 6.50 / 31.84 | suspiciously large |
| AST-1 | PASS | 1.18 / 5.77 | PASS | 0.97 / 4.74 | was a harness toy in its old form (DELARP P6); treat with care |
| PP-1 | PASS | 1.12 / 5.49 | PASS | 1.06 / 5.18 | solid |
| AE-1 | PASS | 0.98 / 4.80 | PASS | 1.19 / 5.84 | **doubtful now:** the same v5.7b gives 0.58/4.34 at n=112 (seeds 1112–1223) |
| AE-2 | PASS | 2.48 / 12.14 | PASS | 2.62 / 12.85 | solid |

### 2.3 Frameworks 10: R21 official

| Item | A | A d/t | D | Notes |
|---|---|---|---|---|
| thaler9 | PASS | 1.29 / 6.31 | PASS 1.74 | project-specific Thaler mechanic, inverted-U form; weak |
| iit4 | PASS | 2.46 / 12.03 | PASS 2.50 | **circular** (the phi proxy is measured on the coupling the build adds); also counted as CQM21 |
| activeInference | FAIL | 0.00 / 0.01 | FAIL | test under-powered (see AINF) |
| attentionSchema | PASS | 7.85 / 38.46 | PASS 8.86 | likely an easy control (last-observation predictor) |
| fieldIntegration | PASS | 1.20 / 5.87 | FAIL 0.76 | solid in arm A |
| ual | PASS | 1.06 / 5.19 | PASS 1.36 | solid; Combo A official 1.11/5.5 |
| sensorimotor | PASS | 3.31 / 16.19 | PASS 3.64 | solid |
| projective | PARTIAL | 9.62 / 47.15 | PARTIAL | ceiling original; PROJR PASS 4.89 |
| ctm | PARTIAL | 17.04 / 83.47 | PARTIAL | double-counted with GWT-3; ctm-R PASS 12.80 |
| butlin14 | FAIL | — | FAIL | rollup: passes only at 14/14 |

### 2.4 CQM 25: R21 official, arm A

| Item | Result | d/t | Audit |
|---|---|---|---|
| CQM01 | PARTIAL | 0.44 / 2.17 | CQM01R PASS 1.09 |
| CQM02 | PASS | 14.47 / 70.89 | ceiling-size d; suspicious |
| CQM03 | PASS | 6.23 / 30.54 | **fluff:** the control is 0 by construction (births on a fixed schedule); CQM03R FAILS −2.31; births are generational in the harness |
| CQM04 | FAIL | 0.04 | ill-posed: selection is in the harness, and reach costs ATP |
| CQM05 | PASS | 39.05 / 191.3 | **fluff:** strawman control (leaky ledger); d≈39 is a giveaway |
| CQM06 | FAIL | 0.30 | |
| CQM07 | PASS | 5.81 | |
| CQM08 | PARTIAL | 0.59 | CQM08R PASS 7.98 |
| CQM09 | PASS | 6.09 | |
| CQM10 | FAIL | −0.82 / −4.02 | the creature over-eats; CQM10 specialist in progress |
| CQM11 | PASS | 7.04 | |
| CQM12 | PASS | 1.03 / 5.07 | |
| CQM13 | PASS | = HOT-2 | duplicate |
| CQM14 | PASS | 4.73 | |
| CQM15 | PASS | 1.68 | |
| CQM16 | PASS | 7.25 | C16R (anticipation) FAILS 0.74 |
| CQM17 | PASS | 1.49 | |
| CQM18 | FAIL | 0.00 | ceiling |
| CQM19 | PASS | = RPT-1 | duplicate |
| CQM20 | PARTIAL | = GWT-3 | duplicate |
| CQM21 | PASS | = iit4 | duplicate and circular |
| CQM22 | PASS | 2.50 | |
| CQM23 | FAIL | — | substrate pluralism: JS only |
| CQM24 | PASS | no d/t | **fluff:** only a determinism/state-hash check |
| CQM25 | PASS | no d/t | **fluff:** hardcoded; counts parameters (DELARP P10: the GPU 100M net is browser-only, so no test sees it) |

### 2.5 Harsh solid-vs-fluff audit (delivered to Alex 2 Nov)
- **About 11–12 of the 32 claimed official passes (9 + 6 + 17) are solid:** RPT-1, GWT-1, HOT-1, HOT-2/CQM13, AST-1 (with care), PP-1, AE-1 (borderline, now doubtful), AE-2, ual, sensorimotor, fieldIntegration (arm A only), plus RPT2RL5 and PROJR as R variants with real lesions.
- **About 10–12 are fluff, weak or duplicates.**
  - CQM25 is hardcoded to pass.
  - CQM03's control is 0 by construction.
  - CQM05 is tested against a strawman.
  - iit4/CQM21 is circular.
  - CQM24 only checks determinism.
  - Huge d values (GWT-3 19, ctm 17, projective 9.6, CQM02 14) come from clean one-hot stimuli at ceiling.
  - thaler9 has an inverted-U form.
  - HOT-4 at 6.3 is suspicious.
  - attentionSchema at 7.85 probably has an easy control.
  - Duplicates: CQM13 = HOT-2, CQM19 = RPT-1, CQM20 = GWT-3, CQM21 = iit4.
- **LIFE-100 has 0 actual passes.** "BUILT" only means the code exists (mostly n=1 smoke tests).
- Section 7 turns each fluff item into a real test.

---

## 3. Rules (non-negotiable)

1. **Grade A** = Cohen d ≥ 0.8 (pooled SD) **AND** Welch t ≥ 2.75 against **every** control of that test.
   - **Ceiling rule:** a bounded metric with the full-arm mean above 0.95·max fails. A full arm at ceiling with zero variance cannot pass by itself; the control must not sit at the same ceiling.
   - A partial is not a pass. R variants are disclosed but not counted in official totals.
2. **Preregister and freeze before test seeds.**
   - Write `preregistrations/<NAME>.md` and get Alex's approval.
   - Make the **freeze commit**, whose diff is only the prereg, and pin the code commit and bundle sha256.
   - Only then run test seeds.
   - Never tune, change flags, re-seed or change the harness after seeing a test result. Any change means a new prereg on new seeds. Report every result, pass or fail.
3. **Seeds.**
   - Tune only on dev seeds below 1064.
   - Test seeds are used once. Next free test range: **1224+**.
   - Record a ledger check in every prereg (section 5.7).
4. **No consciousness claims.** Say "indicator property". Marketing framing: "an indicator-property benchmark for an artificial organism", never "conscious AI".
5. **The dome stays neutral; the creature self-regulates.**
   - No world or harness edits that make a test easier.
   - Variants that "pass" by gaming are rejected. Example: CQM10 variants that pass by under-eating, losing fat while the viable fraction rises.
6. **Specialist method (Alex's):**
   1. **Side folder** `specialists/<ITEM>/vNN`: **up to 10 cited approaches**, each flag-gated in organism.ts (default off, bit-identical when off). Flags inside organism.ts count as "specialists" for now (Alex OK'd this on 2 Nov).
   2. **Screen** on a dev block (16 seeds) with the test's own controls, using the weakest-control d/t.
   3. **Hybridise** the winners (hNN, or name tags such as cArp*, aeA*).
   4. **Weave/port check** (all three must pass):
      - **(a)** ablating the module moves at least 2 *other* subsystems' variables (paired |t| ≥ 2.75 on probe seeds 600–615, via `specialists/HOT3RM/integ_ab.py`);
      - **(b)** the module's behaviour shifts with internal state (hunger or mood);
      - **(c)** the specialist test still passes and nothing regresses across the dev battery on 2 blocks.
   5. **Each passing version becomes the new floor.** Never accept a regression. Then write a new prereg, use new test seeds, and run officially.
7. **Git.** Commit locally only. **No `git push` (and no new remote) without official grade A AND Alex saying OK for that specific push.** Note that Alex once said "just push it if it's grade A". The standing rule is still official grade A plus his explicit OK; ask him.
8. **Keep shared machinery alive.** Do not kill other agents' jobs. Run with `nice -n 19` and at most 2–3 parallel jobs on the 8-core box.

---

## 4. Where everything is

### 4.1 Alex's laptop (MSI, Windows; registered machine id `a2203401-8c90-43b0-9083-e19a3635095e`)

| What | Path |
|---|---|
| **Repo copy (work here)** | `Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40` |
| Creature #1 folder | `Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40\creatures\001` |
| This handoff (once copied) | `...\creatures\001\HANDOFF-CLAUDE-FABLE.md` |
| Older handoff + Antigravity goal | `...\creatures\001\HANDOFF-GEMINI-ARGON4.md`, `ANTIGRAVITY-GOAL-ARGON4.md` |
| Antigravity workspace copies | `Z:\[Vibe Coded (AI)]\ANTIGRAVITY\` (HANDOFF-GEMINI-ARGON4.md, ANTIGRAVITY-GOAL-ARGON4.md) |
| Antigravity app | `C:\Users\Alexa\AppData\Local\Programs\Antigravity\Antigravity.exe` |
| Antigravity launch script | `C:\Users\Alexa\run-antigravity-goal.ps1` |
| Alex's other Claude Code projects | `Z:\[Vibe Coded (AI)]\CLAUDECODE\` (includes **CQM** and **SUPER CREATURE 1.0**, the 10/10-on-theories reference; run `dir` to find exact folder names) |

**Do this first on the laptop.** Paths contain brackets and spaces, so quote them and use `-LiteralPath` in PowerShell.
```powershell
Set-Location -LiteralPath 'Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40'
git status -s
git log --oneline -15 --date=iso --format='%h %ad %s'
git branch -a
git remote -v
git stash list
Get-ChildItem -LiteralPath 'Z:\[Vibe Coded (AI)]\CLAUDECODE' | Select-Object Name
```
- **Gemini Argon 4 High ran in Antigravity on this copy** (launched 2 Nov), so there may be local edits or commits you have never seen. Diff them against this file's numbers before you trust or build on them. Anything Gemini "passed" counts only if it followed the rules: dev seeds, specialist method, no test seeds without a freeze.
- The laptop copy was taken on 2 Nov PT, around the Combo A freeze. It may **lack** the later commits (`6973f19` … `ed3d9c5`) and the untracked specialist folders. Compare `git log` there with section 6.3.
- **Remote and branch.** Work on branch **`v4.0`**; `master` and `wild-arch` also exist. On the box, **no git remote is configured**: `git remote -v` prints nothing, and the README CI badge still points at a placeholder `github.com/OWNER/Asmodensius`. Alex's public GitHub repo is named **Asmodensius**; the account is free tier. Check `git remote -v` on the laptop. If it is empty, **do not add a remote or push**; ask Alex.

### 4.2 Shared Linux box (Grok Bot's machine; the source of truth for runs up to 2 Nov)
- Live worktree: `/workspace/Asmodensius-v40`, branch `v4.0`, HEAD `ed3d9c5`.
- Scratch run area: `/tmp/scp/`. It is **volatile** and box-only, and its numbers are copied into this file.
  - Bundles: `off_frozen.js` (sha256 `d3e3b973c0c2804a4abb94477843af4707ca1a7272223f931852f1fd73b9a382`, the frozen Combo A build), `off.js`, `sc10.js`.
  - Probes: `probe7.js` (integration probe, built from `specialists/probe_integ.ts`), `c10diag.js` (from `specialists/CQM10/diag.ts`).
  - Job files: `jobs_p*.txt`. Loops: `loop_p6.sh`, `loop_p7.sh`.
  - Outputs: `out/<arm>_<block>/tune_<TEST>.json`, integration probes `integ*/`, food diag `out/diag_*.json`.
- FREAK-100: `/workspace/freak-100.md`. Glitchling: `/workspace/glitchling-jam/` (on hold).
- If you are on the laptop and need these, ask Alex or the parent agent to copy them over. The repo already holds the official raw data in `results/sc-port/official/raw/`.

### 4.3 Key files in the repo (paths relative to `creatures/001/`)

| File | What |
|---|---|
| `preregistrations/SC-PORT.md` | Combo A prereg, FROZEN (commit `cb3aaed`) |
| `results/sc-port/official/SCORECARD.md` + `raw/` + `score_official.py` | Combo A official result (verbatim in Appendix A) |
| `preregistrations/OFFICIAL-R21.md` | R21 prereg (freeze `f7ff08d`) with the full test/control list |
| `results/official-r21/SCORECARD.md`, `raw/`, `scoring/gen.py` | R21 official scorecard |
| `results/sc-port/SC-PORT.md`, `scores_500/520/540/560.md`, `c10diag/`, `integ*/` | dev reports |
| `specialists/QUEUE.md`, `status.json`, `gen_queue.py` | master specialist queue (111 rows, P0–P4) |
| `specialists/<ITEM>/README.md`, `vNN/` | specialist folders: HOT3RM, CQM10, RPT2R, AE2, AINF, GWT2, C03R, CQM04 |
| `specialists/tools/run3.sh`, `score.py`, `loop_combo.sh` | run and score tools |
| `specialists/probe_integ.ts`, `specialists/HOT3RM/integ_ab.py` | integration check (a) |
| `preregistrations/v4.0.md` | B-round log (B20–B29); B28 FINAL edit is uncommitted |
| `LIFE-100.md`, `NOVEL-100.md`, `DELARP-PLAN.md`, `REARCHITECT.md` | goal lists and audits |

---

## 5. How to build, run and score

### 5.1 Build the runner bundle
R21 used bun; the SC-PORT bundles are equivalent single-file node bundles.
```bash
cd /workspace/Asmodensius-v40            # laptop: Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40
bun build creatures/001/organism/run_v39.ts --target=node --outfile=/tmp/scp/dev.js
# alternative: npx esbuild creatures/001/organism/run_v39.ts --bundle --platform=node --outfile=/tmp/scp/dev.js
sha256sum /tmp/scp/dev.js
```
For an **official** run, build from a clean checkout of the pinned commit. Example: `git archive <pin> | tar -x -C /tmp/pin && cd /tmp/pin && bun build …`. Record the sha256 in the run log, not by editing the frozen prereg. The Combo A frozen bundle has sha256 `d3e3b973…a382` (pin `bc6ad6a`).

Probe bundles:
```bash
bun build creatures/001/specialists/probe_integ.ts --target=node --outfile=/tmp/scp/probe.js
bun build creatures/001/specialists/CQM10/diag.ts  --target=node --outfile=/tmp/scp/c10diag.js
```

### 5.2 Run one test (dev)
```bash
# run3.sh ARM ENV M50J BLOCK TEST [V40TUNE]  -> /tmp/scp/out/<ARM>_<BLOCK>/tune_<TEST>.json
BUNDLE=/tmp/scp/dev.js creatures/001/specialists/tools/run3.sh comboA ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}' 540 HOT3RM '{}'
# what it does:
env ORG_V6=1 M50J='<json>' V40TUNE='{}' ORG_MIND=v40 NSEEDS=16 SEEDBASE=540 V39OUT=/tmp/scp/out/comboA_540 nice -n 19 node /tmp/scp/dev.js tune HOT3RM
```
In PowerShell on the laptop (run3.sh is bash; you can use Git Bash or WSL instead):
```powershell
$env:ORG_V6='1'; $env:M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'; $env:V40TUNE='{}'; $env:ORG_MIND='v40'
$env:NSEEDS='16'; $env:SEEDBASE='540'; $env:V39OUT='C:\scp\out\comboA_540'
node C:\scp\dev.js tune HOT3RM
```
- Comparator arm: `ORG_V5=11 M50J='{}'` (v5.7b), usually named `base`.
- Test keys (11 in the SC-PORT battery): `AE1 AE2 AINF C10 C16R GWT2 HOT3RM RPT1 RPT2R RPT2RL5 UAL`.
- The full R21 key list is in `preregistrations/OFFICIAL-R21.md` §4: AE1 AE2 AINF ASO AST1 C01R C03R C05 … UAL.

### 5.3 Queue many jobs
Job lines: `<arm> <ENV> '<M50J>' <block> <TEST> '{}'`
```bash
cd /tmp/scp
xargs -P 2 -L 1 bash -c 'BUNDLE=/tmp/scp/dev.js /workspace/Asmodensius-v40/creatures/001/specialists/tools/run3.sh "$0" "$1" "$2" "$3" "$4" "$5"' < jobs_X.txt; touch X.done
```

### 5.4 Score
```bash
python3 creatures/001/specialists/tools/score.py 540 > /tmp/scp/scores_540.md
```
For each arm and test, `score.py` computes d (pooled SD) and Welch t of the full arm against each control, prints PASS only when every control clears the bar, shows the weakest control, and `[+d]` against the `base` arm. It reads `/tmp/scp/out/*_<blk>/tune_*.json`, so edit the glob if your out dir differs. Official pooled n=48 scoring: `results/sc-port/official/score_official.py`; R21: `results/official-r21/scoring/gen.py`.

### 5.5 Integration check (a)
```bash
ORG_V6=1 ORG_MIND=v40 M50J='<on-json>'  nice -n 19 node /tmp/scp/probe.js 600 16 > on.json
ORG_V6=1 ORG_MIND=v40 M50J='<off-json>' nice -n 19 node /tmp/scp/probe.js 600 16 > off.json
python3 creatures/001/specialists/HOT3RM/integ_ab.py on.json off.json   # "(a) PASS" if >=2 vars move (paired |t|>=2.75)
```
It reports NE, ACh, DA, adenosine, glucose, cortisol, mood, ignitions, foraged and rewards (conf and the aw* fields are skipped). Check (b): `awSated` vs `awHungry`, or any state-split readout of the module.

### 5.6 Food-intake / anti-gaming check (CQM10 and anything that touches feeding)
```bash
ORG_V6=1 ORG_MIND=v40 M50J='<json>' nice -n 19 node /tmp/scp/c10diag.js 500 8 > diag.json
```
The output compares `full` against `fixed`: viable fraction `ok`, glcHi, forages/day and end fat. **Reject a variant if `full` forages less than the fixed arm and ends with lower fat** (under-eating).

### 5.7 Seed ledger (authoritative)

| Range | Status | Used by |
|---|---|---|
| 500–515, 520–535, 540–555, 560–575 | dev | SC-PORT screens, specialists |
| 600–615 | dev | integration probe (a/b) |
| 1000–1015 | old test | NOVEL-100 legacy prereg definition |
| 1016–1063 | retired | Round 20 |
| 1064–1111 | used | OFFICIAL-R21 |
| **1112–1159** | **used** | SC-PORT Combo A official (blocks 1112/1128/1144) |
| **1160–1223** | **used** | SC-PORT AE1 pooled extension (1160/1176/1192/1208) |
| 2000–2031 | dev | LIFE-100 stage method |
| 3061–3093, 3285–3381, 3945, 3961, 3977–4024, 4461–4492 | dev/held-out | B-rounds b20–b31 |
| **1224+** | **free** | next official test range |

### 5.8 Persist results
`/tmp` is volatile. Copy every result into `creatures/001/results/<round>/` and commit locally with a plain message. Never push.

---

## 6. Current state and every pending task (priority order)

### 6.1 FIRST: raise these honesty issues with Alex (no compute needed)
1. **The AE1 claim reading.**
   - SC-PORT §4 says "AE1 is claimed **only with** the pooled 64-seed extension", and the extension was run.
   - The kill rule says: "AE1 pooled d < 0.8 (only if AE1 is claimed)". Result: d 0.73.
   - **Strict reading:** AE1 was claimed, the kill rule fires, and Combo A fails as a round. **Lenient reading (the one SCORECARD uses):** AE1 is not claimed, and 7/8 claims (6 primary + GWT2 must-hold) are grade A.
   - Present both readings. Recommend the strict one unless Alex rules otherwise in writing, and log his ruling as a disclosed deviation.
2. **The official round is incomplete under its own prereg.** The retention battery ("every other test v5.7b passes in R21") and viability with its foraging −25% kill rule were **not run** on seeds 1112–1159.
   - Running them now on the *same frozen bundle and same seeds, with no changes* completes the frozen plan; it is not tuning.
   - Propose this to Alex, and do it only on his OK.
   - Until then, Combo A cannot change any official list total.
3. **AE-1 in R21 is now doubtful.** The v5.7b comparator scores 0.58/4.34 at n=112 (0.38 at n=48 on 1112–1159), against R21's 0.98/4.80 at n=48 on 1064–1111. Disclose this next to the R21 Butlin 9/14 total.
4. **The check (c) rule for AE1.** Combo A fails AE1 on dev 500 (0.76/2.1) and passes on 540 (1.33/3.8). Ask Alex to choose between "AE1 must pass on both dev blocks" and "AE1 no worse than Combo A (within d 0.2) on each block". The default proposal is the second.

### 6.2 Combo A official result (detail)
- Candidate: `ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'` = v5.7b + V6 binding hub (no learned precision, no appetite integral) + belief-precision confidence (scAIm 0.5, HOT-3) + Kalman body model (scBM 1, AE-2).
- Prereg FROZEN at `cb3aaed` (1 Nov, 9:36 PM PT); code pin `bc6ad6a`; frozen bundle sha256 `d3e3b973…`.

| test | role | v5.7b | Combo A | Δd vs v5.7b |
|---|---|---|---|---|
| RPT2R | claim | fail 0.47/2.3 | **A 3.87/19.0** | +3.37 |
| RPT2RL5 | claim | A 1.36/6.7 | **A 3.17/15.5** | +2.00 |
| RPT1 | claim | A 1.08/5.3 | **A 0.92/4.5** | −0.01 |
| UAL | claim | A 1.52/7.4 | **A 1.11/5.5** | −0.00 |
| HOT3RM | claim | A 0.99/4.8 | **A 1.43/7.0** | +0.43 |
| AE2 | claim | A 2.80/13.7 | **A 2.65/13.0** | +3.56 |
| AE1 | claim (conditional) | fail 0.58/4.3 (n=112) | **fail 0.73/5.5 (n=112)** | +0.17 |
| GWT2 | must-hold | A 6.35/31.1 | **A 7.73/37.9** | +0.29 |
| AINF | reported | fail −0.03 | fail 0.12/0.6 | +0.11 |
| C10 | reported | fail −0.52 | fail −0.48/−2.3 | +0.01 |
| C16R | reported | fail 0.52 | fail 0.50/2.4 | −0.08 |

- AE1 at n=48 (1112–1159): v5.7b 0.38/1.85, Combo A 0.41/2.03.
- Commits: `6973f19` (AE1 graded at n=48 and n=112, fail on both arms), `15543a4` (specialist partial results), and `ed3d9c5` (last progress commit).
- **Not pushed.** Alex has not been asked for a push, and it is not pushable: AE1 failed and the battery is incomplete.

### 6.3 Git state on the box (branch v4.0, HEAD `ed3d9c5`)
```
ed3d9c5 2026-11-02 18:50 PT SC-PORT progress (769 json)
15543a4 2026-11-02 12:51 PT Specialists: st10 integ, CQM10/RPT2R/AE2 hybrid partial results
6973f19 2026-11-02 12:01 PT SC-PORT official: AE1 graded at n=48 and n=112 (fail both arms)
58b25d0 2026-11-01 22:07 PT SC-PORT official test seeds progress (74/74 json)
cb3aaed 2026-11-01 21:36 PT SC-PORT Combo A prereg FROZEN; code pin bc6ad6a; no test seeds run
bc6ad6a 2026-11-01 21:25 PT Specialist code (AE2 ae2/ae2K, RPT2R rp2, HOT3 scCF/scCL/scCH, confDev): all flag-gated, default off
521b985 2026-11-01 21:24 PT SC-PORT Combo A prereg DRAFT
```
Uncommitted on the box:
- Modified: `preregistrations/v4.0.md` (B28 FINAL + B29 screen result, Appendix C); `results/b28/c14_v60_3945/viab.json`; `results/b28/recheck_3945_v57b_v60.md`; `results/b28/recheck_3945_v60_v61.md`; `results/b29/c15_v62_3961/viab.json`; `results/b29/screen_3961_v57b_v62.md`; `results/b29/screen_3961_v61_v62.md`.
- Untracked: `HANDOFF-GEMINI-ARGON4.md`; `ANTIGRAVITY-GOAL-ARGON4.md`; `HANDOFF-CLAUDE-FABLE.md` (this file); `specialists/AE2/v01–v10/`; `specialists/HOT3RM/st09/`, `st10/`; `specialists/RPT2R/v01–v10/`.
- Suggested local commit, which needs nobody's approval because it stays local: commit the B28/B29 docs and specialist folders as one "docs/specialists" commit. Keep it separate from any future freeze commit.

### 6.4 Specialists: state and next steps (dev seeds only)

**HOT-3 (`specialists/HOT3RM`, st01–st10). Not port-ready.**
- Root problem: the confidence monitor was trained only by the harness, so in natural life `conf` stayed at 0.5 and nothing downstream moved.
- Fix: self-training `scST`, which updates confidence from the creature's own forage outcomes, DA-gated.
- Coupling confidence to the LC creates a trade-off: strong coupling passes (a) but costs HOT3RM and RPT1.
- **st10** (confidence → value learning rate, no LC route; flags `scCH1 scST3 scCL1` on Combo A):

  | Check | Block 500 | Block 520 | Block 540 |
  |---|---|---|---|
  | HOT3RM | PASS 1.52/4.3 | PASS 1.37/3.9 | PASS 1.21/3.4 |
  | RPT1 | PASS 1.19/3.4 | **fail 0.63/1.8** | **fail 0.97/2.7** |

  - The rest of the 500 battery matches Combo A.
  - (a) **FAIL:** 0 subsystems move, either against Combo A or against st10 without scCL.
  - (b) PASS: weight 0.47 sated vs 0.28 hungry.
  - (c) FAIL: RPT1 regresses.
- Other arms: st05 (`scCI0.25 scST3`) passes HOT3RM on 3/3 blocks and RPT1, but its (a) moves only foraging. st08 (`scCI0.35`) passes (a) but fails HOT3RM on 520 (0.97/2.7) and RPT1 (0.87/2.5). st09 and st09b pass HOT3RM on 3 blocks but fail RPT1 on 500 (0.77, 0.91). st10h (st09+st10) fails HOT3RM and RPT1 on 500.
- **Next:**
  1. Route confidence to targets that do not share RPT1's recurrent loop: forage persistence/patience, sleep pressure, exploration temperature (Aston-Jones LC adaptive gain via a separate channel), or a 5-HT-like patience signal.
  2. Try a st05 × (non-LC target) hybrid. The goal is (a) with ≥2 subsystems while keeping RPT1 on 500, 520 and 540.
  3. Find out why RPT1 is sensitive: probe RPT1's per-seed values with and without scCL.

**RPT2R / RPT-2 (`specialists/RPT2R`, rp2 v01–v10). Combo A's hub already passes officially, so these are about weaving in, not passing.**
- 10-way screen on v5.7b, block 560 (16 seeds; gain K1 / K3; base fail 0.00):

  | Variant | Approach | K1 | K3 |
  |---|---|---|---|
  | v08 | claustral hub | 3.09 | **6.63** |
  | v07 | gamma coincidence | 2.71 | **6.22** |
  | v01 | tensor-product | 1.78 | **6.00** |
  | v09 | BCM conjunctive | **4.60** | 3.92 |
  | v02 | HRR | — | 2.87 |
  | v05 | sparse expansion | — | 2.81 |
  | v10 | apical amplification | — | 2.07 |
  | v06 | granule expansion | — | 1.75 |
  | v04 | transthalamic | — | 1.20 |
  | v03 | sigma-pi | fail | fail |
  | v6hub (reference) | — | 3.90 | |

- Hybrids on Combo A, K3 (`cArp1/7/8` = +v01/v07/v08): RPT2R reaches up to **8.34/23.6** (cArp8, 540).
  - But **RPT1 fails on 540 in all three:** 0.92/2.6, 0.69/1.9 and 0.21/0.6. cArp8 also fails RPT1 on 500 (0.23).
  - AE1 is mixed. UAL drops by d 0.3–0.8.
- Integration (integ4, seeds 600–615): **(a) FAIL for all three.** cArp1 and cArp7 move 0 subsystems; cArp8 moves only DA.
- **Next:**
  1. Lower gain (K1, K2) hybrids on Combo A, so RPT2R stays high while RPT1 is kept.
  2. Make the binding hub feed something else (action-value or the workspace) so ablation moves ≥2 subsystems.
  3. Also try v09 (BCM, best at K1) as a hybrid.

**AE2 (`specialists/AE2`, ae2 v01–v10). Base and Combo A already pass.**
- 10-way screen on block 560: AE2 tracking improves against base for v01 RLS (+5.25, K3 +6.07), v03 particle (+5.39), v02 adaptive Kalman (+4.42), v09 (+3.95) and scBM (+4.52). The rest are negative.
- Hybrids `aeA1` (Combo A + RLS, K3) and `aeA3` (+particle, K3): AE2 improves by +6.12 / +5.14 d against base on 500. **Every other test and every probe variable is bit-identical to Combo A**, so (a) FAILS: the module is bolted on.
- **Next:** make the body model *used*. Route forward-model prediction error into motor-gain adaptation, an interoceptive surprise signal (NE) or foraging-effort cost, so that ablating it moves ≥2 subsystems. Re-screen afterwards.

**CQM10 (`specialists/CQM10`, v01–v10 + h11–h13). Best candidate overall, still not port-ready.**
- Diagnosis: Combo A fails C10 by over-eating, which causes hyperglycaemia: 68 vs 54 forages/day, fat 292 vs 271.
- Results on Combo A, dev:

  | arm | C10 500 | C10 540 | AE1 500 | AE1 540 | RPT1 500/540 | C16R 540 | integ (a) | food (forages/day; fat) |
  |---|---|---|---|---|---|---|---|---|
  | Combo A | fail −0.57 | fail −0.49 | fail 0.76 | PASS 1.33 | PASS 1.70 / 1.11 | 0.80/2.2 | — | 67.9/82.5; 292/312 |
  | **v02 CCK** (`c10:2`) | **PASS 1.32/3.7** | **PASS 1.51/4.3** | fail 0.34 | PASS 1.11 | PASS 1.35 / 1.08 | **−0.05** | **PASS** (NE, DA, foraged, rewards) | **60.7/62.2; 270/275** (fixed 54/62.9; 271/285) |
  | v01 K0.25 | PASS 1.04/2.9 | PASS 1.36/3.9 | fail 0.42 | fail 0.67 | PASS 1.13 / **fail 0.39** | 0.97/2.7 | PASS (NE, DA, adenosine) | 68.8/69.9; 282/289 |
  | v01 K0.5 | PASS 1.27/3.6 | PASS 1.35/3.8 | fail 0.72 | fail 0.78 | PASS 1.00 / 1.52 | 0.30 | PASS (NE, DA, foraged) | 65.8/70.8; 275/287 |

  All other claim tests (AE2, GWT2, HOT3RM, RPT2R, RPT2RL5, UAL) still pass in all three CQM10 arms on both blocks.
- The **food-intake check is now done:** v02 eats at or slightly above the fixed arm with fat steady, so it is not gaming by under-eating. v03, v05, v10, h11 and h12 pass by under-eating (31–47 forages/day, fat ~233) and are **rejected**. v07–v09 fail because physiological fixes help both arms.
- **Remaining blockers for v02:**
  - AE1 on 500 (0.34 vs Combo A 0.76); this is a regression under either reading of the AE1 rule.
  - C16R on 540 (−0.05 vs 0.80); C16R is not claimed, but this is still a regression.
  - Probe foraging falls 29% against Combo A (126 → 89 per day on seeds 600–615). That is intended, because it cuts over-eating, but **check the prereg's "foraging −25% vs v5.7b" kill rule against v5.7b's intake before any freeze.**
- **Next:**
  1. Hybrid v02 × v06 (learned allostatic anticipation, which may rescue C16R anticipation).
  2. v02 at lower gain.
  3. Diagnose the AE1 loss, likely fewer reward events, hence fewer RPE learning opportunities (rewards fall 42 → 29 in the probe). A satiety-aware RPE baseline might fix it.
  4. Then run a full battery on 500 and 540, and (b) per state.

**AINF (activeInference).** All 10 brain-side variants fail; the test is under-powered: rewards ~55 ± 18 SD, and the epistemic term moves them by ~2 (paired dz 0.45). **Next:** write a new prereg for a *paired-seed* or longer-horizon AINF test. Don't tune the brain to the test.

**GWT-2.** Passes on dev and in Combo A officially (7.73) but fails R21 on the ceiling rule. **Next:** redesign the test with harder distractors and lower stimulus salience (new prereg), so it is not at ceiling.

**C16R (anticipation).** 0.50–0.80 everywhere. **Next:** a 10-way specialist (allostatic forecasting, Sterling 2012; time-to-collision of the glucose forecast; FREAK #28–29).

### 6.5 Priority-ordered task list
1. **Report the four issues in 6.1 to Alex and get rulings.** No compute is needed.
2. **On Alex's OK, complete the frozen SC-PORT battery:**
   - the retention battery (every R21 v5.7b pass) on seeds 1112–1159 with the frozen bundle, both arms;
   - the viability and foraging check;
   - then append the results to SCORECARD.md as "completion of frozen plan".
3. **Commit locally** the uncommitted docs and specialist folders (section 6.3). Do not push.
4. **CQM10 v02:** v02 × v06 hybrid and gain sweep; fix the AE1 regression on 500 and C16R on 540; full battery; (a)/(b)/(c); food check.
5. **HOT-3:** a non-LC, non-RPT1 confidence target; st05 hybrid; pass a+b+c.
6. **RPT2R hybrids:** lower gain plus a hub output that feeds other systems; keep RPT1.
7. **AE2 hybrids:** make the forward model drive behaviour or physiology so (a) passes.
8. **Fluff cleanup (section 7).** Every fixed test needs a new prereg; batch them into one "R22-clean" prereg.
9. **AINF, GWT-2 and C16R redesigns** (new preregs).
10. **Combo A2 candidate:** once ≥1 specialist passes a+b+c, build Combo A + the woven specialist(s), write a new prereg (with seeds from 1224+) and Alex's approval, then run the full battery on **all lists** so that official points can actually move.
11. **LIFE-100 P1 basics** (ageing 0/5, decay 0/5, legs with their own brains 0/5, mating 0/5, respiration 0/5) via the specialist method, each with a falsifiable test and control.
12. **NOVEL-100 top-20 items** (N09 thought-curvature metacognition, N11 self-surgery, N13 free won't, N17 self-preregistration, N45 REM uncertainty maps, N41 dream-seeded germline, N85 pre-symptomatic self-diagnosis, N91 energy futures). Re-check novelty first.

---

## 7. Fluff-cleanup agenda: turning weak passes into real tests

Each fix is a **new test version** (new key, for example CQM25R) with a new prereg. Keep reporting the originals alongside, and never silently replace them.

| Item | Problem | Real test to build | Control(s) |
|---|---|---|---|
| CQM25 (scale) | hardcoded parameter count; the 100M net is browser-only | "Scale matters": performance on a capacity-limited task (e.g. RPT2R/UAL with many cue pairs) rises with cortex size in the node organism | same organism at 1/4 size; random-weight frozen cortex of equal size |
| CQM24 (reproducibility) | determinism only, no d/t | Robust reproducibility: behaviour statistics stay stable across seeds and small perturbations, and a perturbation of a *causal* module changes them | perturbed causal vs perturbed inert module; must detect a difference |
| CQM03 (birth/selection) | control is 0 by construction (fixed-schedule births in the harness) | Births depend on the organism's energy and state: birth rate tracks the creature's own surplus | births decoupled from state (shuffled timing at matched rate); move birth logic from the harness into the organism |
| CQM05 (ledger) | strawman leaky-ledger control (d≈39) | The energy ledger *drives* decisions: closing the ledger changes foraging and risk choices | ledger present but disconnected from decision making; ledger noise at matched variance |
| iit4 / CQM21 | circular: the phi proxy is measured on the coupling the build adds | Non-circular integration: a perturbational complexity index (PCI-like) of the evoked response, plus behaviour-relevant integration (a cross-modal task that needs two modules) | lesion that keeps mean activity (degree-preserving rewire); count once, not twice |
| CQM13/19/20/21 duplicates | counted twice | Count each once in totals; mark as an alias | — |
| GWT-3 / ctm / projective / CQM02 / CQM08 originals | clean one-hot stimuli at ceiling (d 9–26) | Promote the degraded-stimulus R variants (GWT-3R, ctm-R, PROJR, CQM08R) to primary in the next prereg, with noise levels set on dev | as in the R variants |
| thaler9 | project-specific mechanic, inverted-U | Replace with a standard creativity/novelty test: novel successful action sequences in a changed world | dreams/replay shuffled; random-sequence generator at matched rate |
| HOT-4 (6.3) | suspiciously large | Audit the control (sensory lines permuted may break everything); add a weaker, matched control | partial permutation; noise-matched lines |
| attentionSchema (7.85) | easy last-observation control | Compare against a stronger baseline (Kalman/AR predictor of attention) | AR(2) predictor; schema lesion |
| AST-1 | was a harness toy | Verify the current test uses the organism's own schema; add a lesion inside the organism | schema-lesioned organism |
| AE-1 | fragile (0.98 at n=48, 0.58 at n=112 for v5.7b) | Always score at n ≥ 112 pooled; preregister AE1R (adaptation window) as primary if it is better grounded | RPE learning lesioned |
| CQM04 | selection in the harness; reach costs ATP | Move selection pressure into the ecology (resources and predators) and test the organism's adaptive choice | random survival |
| CQM23 | substrate pluralism: JS only | Port a core loop to a second substrate (WASM, which `creatures/001/wasm/` already has, or Eshkol), then test equivalence plus a difference that is functional | same substrate twice |
| LIFE-100 "BUILT" | code exists, n=1 smoke | For each P1/P2 area write one falsifiable test with a lesion control; BUILT → TESTED only on grade A | per-area lesion |

---

## 8. Bold idea backlog (all through the specialist method; cite sources)

- **Spiking neural networks (SNNs):** time-to-first-spike codes (Thorpe 2001), polychronous groups (Izhikevich 2006), resonate-and-fire (Izhikevich 2001). Likely targets: RPT2R binding, temporal coding beyond 7 rate levels, UAL at scale.
- **sLTC neurons:** Alex's term. The repo reads it as Spiking Liquid Time-Constant neurons, where tau depends on conductance (Vanhalle & Gielen ICECS 2025, cited in preregistrations/v3.3.md; Hasani et al. 2021 LTC). Targets: HOT3RM confidence dynamics, RPT2R, AINF over longer horizons.
- **Biomimetic multibrains:** this is SUPER CREATURE 1.0's architecture (reuse allowed). Distributed brains, including **legs with their own brains:**
  - 32-neuron Izhikevich ganglia per leg (design in `/workspace/glitchling-jam/BLUEPRINT.md`, `cqm-copy/src/math/izhikevich.ts`);
  - a central brain negotiating with limb brains;
  - neuromodulator-gated mixture of experts (Doya 2002; Jacobs 1991).
  - Targets: LIFE-100 #27 and #53, UAL, the 10/10 frameworks bar.
- **Frankenstein hybrids:** cross-wire winning specialists into new organs. Examples:
  - a claustral hub (RPT2R v08) that broadcasts satiety (CQM10 v02) into the workspace;
  - a confidence-gated body model (HOT-3 × AE2);
  - a sigma-pi dendritic binding layer fed by an SNN;
  - an astrocyte slow gate (FREAK #39) on plasticity for UAL and HOT3RM.
  - Each hybrid must still pass a/b/c.
- **FREAK-100 highlights** (`/workspace/freak-100.md`):
  - sparse granule expansion (Litwin-Kumar 2017);
  - dCaAP single-neuron XOR (Gidon 2020);
  - burst multiplexing (Naud & Sprekeler 2018);
  - theta–gamma code (Lisman & Jensen 2013);
  - dendritic prediction errors (Sacramento 2018);
  - antithetic integral feedback (Briat 2016);
  - satiation cascade (Cummings & Overduin 2007);
  - brown-fat buffer;
  - astrocyte-lactate shuttle;
  - LC adaptive gain (Aston-Jones & Cohen 2005);
  - 5-HT patience (Miyazaki 2014);
  - neuropeptide mood bus (Bargmann 2012);
  - reservoir and FORCE readouts.
- **Scale toward 100M synapses.** Sparse event-driven SNN on GPU/WASM, with tests that *see* the scale (see the CQM25 fix).
- **Simulated psychic, wireless and remote-viewing senses.** Real dome-internal channels with energy cost and noise:
  - an inter-creature field link;
  - a remote-viewing channel that samples a distant dome region at a cost.
  - Validate against shuffle controls. Never present them as real ESP.
- **Life cycle:** ageing (telomere-like damage accumulation), decay after death (ecology nutrient return), mating and sexual selection, epigenetics (stress-marked expression passed to offspring), parenting.
- **NOVEL-100 top picks:** thought-curvature metacognition (N09), self-surgery with the lab's own lesion tool (N11), free won't (N13), self-preregistration (N17), energy futures (N91).

---

## 9. DO / DO NOT

**DO**
- Run `git status` and `git log` first.
- Read SC-PORT.md and both SCORECARDs.
- Use `nice -n 19` and check the seed ledger.
- Commit locally and report fails plainly.
- Cite sources and keep flags default off.
- Report times in US Pacific.
- Explain to Alex in plain English what moved and what didn't.

**DO NOT**
- `git push` or add a remote without official grade A plus Alex's OK.
- Run test seeds (1224+) before a frozen prereg commit.
- Tune after seeing test results.
- Edit the harness or world to pass.
- Claim consciousness.
- Count R variants or dev passes as official.
- Copy other A-Life projects' code.
- Start Glitchling Phase 1 (it is on hold).
- Kill other agents' jobs on the box.

---

## 10. History in brief
- **R20 (v3.9):** Butlin 9/14, frameworks 7/10, CQM 17/25.
- **R21** (frozen `f7ff08d`, seeds 1064–1111, finished 1 Nov): arm A v5.7b 9/14, 6/10, 17/25; arm D v5.7d 9/14, 5/10, 17/25.
- **B27–B29 (v6.0–v6.2):**
  - v6.0 adds the binding hub (helps AE1 and RPT2R, hurts C10 and RPT2RL5 on some blocks).
  - v6.1 (fan-in scaled efferents) fails its goal.
  - v6.2 (pooled readouts) recovers nothing.
- **SC-PORT** (1–2 Nov), dev combos:
  - Combo A won. Combo B (+scAIe/scEm/scSR) was rejected because RPT1 and AE1 drop. Fast weights were excluded.
  - Alex approved "all 4" (clean code, freeze, GWT2 as must-hold, run test seeds).
  - Frozen `cb3aaed`; official run 1–2 Nov; AE1 graded 2 Nov at 12:01 PM PT.
- **2 Nov:**
  - Alex chose "all" on method: flags count as specialists, redo RPT2R and AE2 with the 10-way method, continue HOT3 and CQM10.
  - The repo was copied to the laptop, the Gemini Argon 4 handoff was written, and Antigravity was launched.
  - Specialist loops p6 and p7 finished at 9:04 PM PT.
- **10 Nov:** handoff to Claude Opus 5.5 and Fable 5.2 (this file).

---

## 11. Paste-ready kickoff prompt (for Claude Opus 5.5 or Fable 5.2)

```text
You are taking over Creature #1 of Alex Donahue's Asmodensius project: a promptless artificial-life organism (TypeScript/node) scored with preregistered, controlled tests against Butlin-14, 10 consciousness theories, CQM-25, LIFE-100, FREAK-100 and NOVEL-100. It is an indicator-property benchmark. Never claim consciousness. Alex is American: report every time in US Pacific.

1. Read creatures/001/HANDOFF-CLAUDE-FABLE.md fully. Then read creatures/001/preregistrations/SC-PORT.md, creatures/001/results/sc-port/official/SCORECARD.md, creatures/001/results/official-r21/SCORECARD.md and creatures/001/specialists/QUEUE.md.
2. The repo is on Alex's Windows laptop at Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40 (branch v4.0). Gemini ran on this copy earlier, so start with: git status -s; git log --oneline -15; git branch -a; git remote -v; git stash list. Tell me in plain English what changed since commit ed3d9c5 (2 Nov 2026, 6:50 PM PT) before you do anything else.
3. Hard rules:
   - grade A = Cohen d>=0.8 AND Welch t>=2.75 vs EVERY control, plus the ceiling rule;
   - freeze the prereg (Alex approves; the commit contains only the prereg) before any test seed; next free test seeds are 1224+;
   - tune only on dev seeds <1064; never tune after seeing test results; report every result;
   - the dome/harness stays neutral, the creature self-regulates, and gaming (e.g. passing by under-eating) is rejected;
   - specialist method: up to 10 cited approaches per item in specialists/<ITEM>/vNN (flag-gated, default off), hybridise the winners, then weave in only after integration checks pass: (a) ablation moves >=2 other subsystems, (b) behaviour shifts with internal state, (c) the test still passes with no regressions. Each passing version becomes the new floor;
   - NEVER git push or add a remote without official grade A AND my explicit OK; commit locally only.
4. Your first message to me: the 4 honesty issues in section 6.1 (the AE1 strict vs lenient reading, the incomplete retention/viability battery, the doubtful R21 AE-1, and the AE1 check-(c) rule), with your recommendation for each. Ask me to rule on them.
5. Then work through section 6.5 in order, starting with CQM10 v02 (fix the AE1 and C16R regressions, keep food intake honest) and HOT-3 (a non-LC confidence target), on dev seeds only. Keep specialists/status.json, QUEUE.md and the results/ folders updated, and commit locally.
6. Goal: real, official list points. That means a new frozen Combo A2 with woven specialists, run on fresh seeds across ALL lists, plus the fluff cleanup in section 7 so that passes are genuine. After each milestone, report what moved, what didn't, and why, in plain English.
```

---

## Appendix A: verbatim `results/sc-port/official/SCORECARD.md`

````markdown
# SC-PORT Combo A — OFFICIAL test scorecard

Frozen prereg: preregistrations/SC-PORT.md (freeze commit cb3aaed, code pin bc6ad6a). Seeds 1112–1159 (n=48/arm); AE1 also pooled with 1160–1223 (n=112).
Cell: grade / weakest control d/t. Grade A = d≥0.8 and t≥2.75 vs every control.

| test | role | v5.7b | Combo A | Combo A full vs v5.7b full d |
|---|---|---|---|---|
| RPT2R | claim | fail 0.47/2.3 (n=48) | A 3.87/19.0 (n=48) | +3.37 |
| RPT2RL5 | claim | A 1.36/6.7 (n=48) | A 3.17/15.5 (n=48) | +2.00 |
| RPT1 | claim | A 1.08/5.3 (n=48) | A 0.92/4.5 (n=48) | -0.01 |
| UAL | claim | A 1.52/7.4 (n=48) | A 1.11/5.5 (n=48) | -0.00 |
| HOT3RM | claim | A 0.99/4.8 (n=48) | A 1.43/7.0 (n=48) | +0.43 |
| AE2 | claim | A 2.80/13.7 (n=48) | A 2.65/13.0 (n=48) | +3.56 |
| AE1 | claim | fail 0.58/4.3 (n=112) | fail 0.73/5.5 (n=112) | +0.17 |
| GWT2 | must-hold | A 6.35/31.1 (n=48) | A 7.73/37.9 (n=48) | +0.29 |
| AINF | reported | fail -0.03/-0.2 (n=48) | fail 0.12/0.6 (n=48) | +0.11 |
| C10 | reported | fail -0.52/-2.5 (n=48) | fail -0.48/-2.3 (n=48) | +0.01 |
| C16R | reported | fail 0.52/2.6 (n=48) | fail 0.50/2.4 (n=48) | -0.08 |

AE1 detail (frozen bundle sha256 d3e3b973…, no re-runs needed; all 7 blocks present on both arms):
- n=48 (1112–1159): v5.7b 0.38/1.85, Combo A 0.41/2.03 — fail.
- n=112 (1112–1223 pooled, prereg claim basis): v5.7b 0.58/4.34, Combo A 0.73/5.48 — fail on d (<0.8). AE1 is not claimed; per kill rule "AE1 pooled d < 0.8 (only if AE1 is claimed)".
````

## Appendix B: SC-PORT prereg, key text (`preregistrations/SC-PORT.md`, frozen `cb3aaed`)
- Status: FROZEN, approved by Alex ("all 4"), 1 Nov 2026, 9:36 PM PST. No test seed had been run at freeze.
- Candidate: `ORG_V6=1`, `M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'`; every other SC/specialist flag stays off. Comparator: v5.7b (`ORG_V5=11`). Pin: `bc6ad6a`.
- Pass rule: d ≥ 0.8 and t ≥ 2.75 vs every control, plus the ceiling rule.
- **Kill rules (the round fails as a whole):**
  - HOT3RM or RPT2R fails;
  - AE1 pooled d < 0.8 (only if AE1 is claimed);
  - more than one test passed by v5.7b is lost;
  - foraging falls by more than 25% vs v5.7b.
- Seeds: 1112–1159 (n=48; blocks 1112/1128/1144). AE1 extension: 1160–1223.
- **Claims:**
  - Primary: RPT2R, RPT2RL5, RPT1, UAL, HOT3RM, AE2. **AE1 is claimed only with the pooled 64-seed extension.**
  - Must-hold: GWT2.
  - **Retention:** every other test v5.7b passes in R21 must not be lost. *(Not run yet; see 6.1.)*
  - Exploratory: C03R, CQM04. Not claimed: AINF, C10, C16R.
  - Viability: 3 days, deaths and foraging. *(Not run yet.)*
- Disclosed caveats:
  - HOT-3 confidence is trained by the harness only, and (a) was not passed.
  - CQM10 is excluded.
  - The hub and scBM came from flag screens, not the 10-way method, so they are provisional on method.
  - AINF is under-powered.

## Appendix C: B28/B29 final text (uncommitted edit in `preregistrations/v4.0.md`)
**B28 RESULT (FINAL, 2 Nov 2026).** The verdict uses dev 3961; held-out 3945 is context.

| Test | v6.1 dev 3961 | v6.1 held-out 3945 | Verdict | Comparison |
|---|---|---|---|---|
| C10 | −2.46/−6.95 | −2.54/−7.18 | FAIL | |
| RPT2RL5 | −0.10/−0.29 | 0.24/0.67 | FAIL | |
| UAL | −0.04/−0.12 | 0.50/1.42 | FAIL | |
| C16R | 0.91/2.56 | 0.57/1.62 | FAIL, not kept | v6.0 1.29/3.64 |
| CQM12 | 0.63/1.77 | 1.26/3.58 | FAIL on dev | v5.7b 1.26/3.56 |

- AE1 48-seed pool (3977–4024): v5.7b 0.80/3.90 (d = 0.795, fails), v6.0 1.48/7.23, v6.1 1.45/7.10. AE1 is kept.
- Glucose (mean / time above band): v5.7b 2.92 / 0.011; v6.0 5.92 / 0.28; v6.1 4.14 / 0.16.
- Forages (viability, dev): v5.7b 238, v6.0 625, v6.1 524; 0 deaths.
- **Verdict:** v6.1 does NOT meet its goal.

**B29 v6.2 dev screen (3961), v6.2 vs v6.1:**

| Test | v6.2 | v6.1 |
|---|---|---|
| UAL | 0.42/1.20 | −0.04 |
| RPT2RL5 | 0.09/0.25 | −0.10 |
| C10 | −2.16 | −2.46 |
| C16R | 0.82/2.33 | 0.91 |
| CQM12 | 0.89/2.53 | 0.63 |
| AE1 | 1.62/4.58 | 1.59 |

- v6.2 loses HOT1 (0.91/2.56) and HOT3RM-P (0.56/2.24).
- **Verdict:** v6.2 recovers none of UAL, RPT2RL5 or C10. No AE1 pool and no held-out run.

## Appendix D: dev score rows (16 seeds; weakest control d/t; [d vs base])
Block 500, columns: AE1 | AE2 | AINF | C10 | C16R | GWT2 | HOT3RM | RPT1 | RPT2R | RPT2RL5 | UAL
```
base    fail 0.23 | PASS 2.49 | fail 0.13 | fail -0.73 | fail 0.57 | PASS 6.41 | fail 0.75 | fail 0.86 | fail 0.28 | fail 0.70 | PASS 1.33
comboA  fail 0.76/2.1 | PASS 2.27/6.4 | fail -0.09 | fail -0.57 | fail 0.55 | PASS 6.88 | PASS 1.31/3.7 | PASS 1.70/4.8 | PASS 3.76/10.6 | PASS 2.46/7.0 | PASS 1.95/5.5
c10v2cA fail 0.34/1.0 | PASS 1.95 | fail 0.02 | PASS 1.32/3.7 | fail 0.21 | PASS 11.41 | PASS 1.15/3.3 | PASS 1.35/3.8 | PASS 2.89 | PASS 2.37 | PASS 1.41
c10k25  fail 0.42 | PASS 2.33 | fail -0.02 | PASS 1.04/2.9 | fail 0.29 | PASS 6.81 | PASS 1.65 | PASS 1.13/3.2 | PASS 3.67 | PASS 2.90 | PASS 1.42
c10k5   fail 0.72 | PASS 2.23 | fail -0.07 | PASS 1.27/3.6 | fail 0.79 | PASS 9.00 | PASS 1.23 | PASS 1.00/2.8 | PASS 4.06 | PASS 3.53 | PASS 1.31
cArp1   fail 0.95/2.7 | PASS 2.42 | fail | fail -0.59 | fail 0.79 | PASS 11.83 | PASS 1.44 | PASS 1.09/3.1 | PASS 6.39/18.1 | PASS 4.34 | PASS 1.25
cArp7   fail 0.06 | PASS 2.30 | fail | fail -0.72 | fail 0.67 | PASS 6.99 | PASS 1.38 | PASS 1.10/3.1 | PASS 6.58/18.6 | PASS 4.66 | PASS 1.71
cArp8   fail 0.25 | PASS 3.12 | fail | fail -0.74 | fail 0.42 | PASS 6.85 | PASS 1.27 | fail 0.23/0.6 | PASS 6.68/18.9 | PASS 4.61 | PASS 1.40
aeA1/3  identical to comboA except AE2 [+6.12 / +5.14 vs base]
st10    fail 0.78/2.2 | PASS 3.33 | fail 0.07 | fail -0.60 | fail 0.50 | PASS 10.50 | PASS 1.52/4.3 | PASS 1.19/3.4 | PASS 4.35 | PASS 3.98 | PASS 1.36
```
Block 540:
```
comboA  PASS 1.33/3.8 | PASS 2.07 | fail -0.44 | fail -0.49 | fail 0.80/2.2 | PASS 8.92 | PASS 1.27/3.6 | PASS 1.11/3.1 | PASS 3.65 | PASS 4.15 | PASS 1.00/2.8
c10v2cA PASS 1.11/3.1 | PASS 2.19 | fail 0.06 | PASS 1.51/4.3 | fail -0.05 | PASS 8.51 | PASS 1.21/3.4 | PASS 1.08/3.1 | PASS 3.06 | PASS 2.96 | PASS 1.31
c10k25  fail 0.67 | PASS 2.03 | fail | PASS 1.36/3.9 | fail 0.97/2.7 | PASS 8.38 | PASS 1.58 | fail 0.39/1.1 | PASS 3.74 | PASS 4.40 | PASS 0.98/2.8
c10k5   fail 0.78 | PASS 1.81 | fail | PASS 1.35/3.8 | fail 0.30 | PASS 7.42 | PASS 1.40 | PASS 1.52/4.3 | PASS 3.15 | PASS 3.56 | PASS 1.20
cArp1   fail 0.87 | PASS 2.12 | fail | fail -0.77 | fail 0.34 | PASS 7.09 | PASS 1.19 | fail 0.92/2.6 | PASS 8.00/22.6 | PASS 6.81 | PASS 1.09
cArp7   PASS 1.02/2.9 | PASS 1.77 | fail | fail -0.59 | fail 0.40 | PASS 5.70 | PASS 1.24 | fail 0.69/1.9 | PASS 7.12 | PASS 6.68 | PASS 1.17
cArp8   PASS 0.99/2.8 | PASS 1.84 | fail | fail -0.59 | fail 0.76 | PASS 7.31 | PASS 1.38 | fail 0.21/0.6 | PASS 8.34/23.6 | PASS 6.95 | PASS 1.37
st10    PASS 1.57/4.4 | PASS 1.92 | fail 0.13 | fail -0.42 | fail 0.51 | PASS 9.24 | PASS 1.21/3.4 | fail 0.97/2.7 | PASS 3.17 | PASS 4.00 | PASS 1.09
```
Block 520 (HOT3RM / RPT1): comboA fail 0.92/2.6 / PASS 1.10/3.1; st10 PASS 1.37/3.9 / **fail 0.63/1.8**; st05(stE) PASS 1.76/5.0; st09 PASS 1.35; st09b PASS 1.14; st10h PASS 1.11.

Flags:
- CQM10: `c10:2` = v02; `c10:1,c10K:0.25|0.5` = v01 at gain.
- RPT2R: `rp2:<v>,rp2K:<k>`.
- AE2: `ae2:<v>,ae2K:<k>`.
- HOT3: `scST`, `scCI`, `scCL`, `scCH`, `scCF`, `scSTs`.

## Appendix E: integration probe integ4 (seeds 600–615, 1-day life, paired vs Combo A)

| arm | moved (paired abs(t) ≥ 2.75) | (a) | mean forages | rewards |
|---|---|---|---|---|
| Combo A | — | — | 126 | 41.9 |
| c10v2 | NE, DA, foraged, rewards | PASS | 89 | 29.2 |
| c10k25 | NE, DA, adenosine | PASS | 95 | 32.6 |
| c10k5 | NE, DA, foraged | PASS | 93 | 31.5 |
| cArp1 | none | FAIL | 120 | 40.9 |
| cArp7 | none | FAIL | 123 | 42.1 |
| cArp8 | DA | FAIL | 126 | 42.1 |
| aeA1 / aeA3 | none (bit-identical) | FAIL | 126 | 41.9 |
| st10 (integ3) | none | FAIL | — | — |

Food diag (`/tmp/scp/out/diag_*.json`, 8 seeds), full arm against the fixed forage-probability arm:

| Variant | Block | Forages/day | End fat | Viable fraction ok |
|---|---|---|---|---|
| Combo A | 500 | 67.9 (fixed 54) | 292 (fixed 271) | 0.942 |
| Combo A | 540 | 82.5 (fixed 62.9) | 312 (fixed 285) | — |
| v02 | 500 | 60.7 | 270 | 0.995 |
| v02 | 540 | 62.2 | 275 | 0.999 |
| v01 K0.25 | 500 | 68.8 | 282 | — |
| v01 K0.25 | 540 | 69.9 | 289 | — |
| v01 K0.5 | 500 | 65.8 | 275 | — |
| v01 K0.5 | 540 | 70.8 | 287 | — |

End of handoff.
