// v4.1 Phase 1 instruments (PLAN.md 1.2 and 1.3). Read-only probes: they never change organism code or flags, and they
// make no grading claims. Each returns per-seed numbers per readout (the `arms` layout of run_v39), summarised by
// specialists/tools/summarize_v41.py. World randomness uses a separate world RNG so the creature's own stream is untouched.
import { Organism, Opts, SITES } from "./organism";
type M = Record<string, number[]>;
const D = 1440;
const mk = (seed: number, o: Partial<Opts> = {}): any => new Organism({ seed, ...o } as Opts);
const wr = (seed: number) => { let a = seed * 9973 + 4111; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const mean = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sd = (a: number[]): number => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
/** choice quality of forage k: pTrue[k] / best accessible pTrue (1 = always the best open site) */
const cq = (g: any, k: number): number => { let b = 0; for (let j = 0; j < SITES; j++) if (g.access[j] && g.pTrue[j] > b) b = g.pTrue[j]; return b > 0 && k >= 0 ? g.pTrue[k] / b : NaN; };
/** run until tick T, collecting choice quality of every forage made after tick `from` (lastChoice is reset inside step, so read choices[]) */
const live = (g: any, T: number, acc?: number[], from = 0): void => { while (g.t < T) { const f = g.foraged; g.step(); if (acc && g.t > from && g.foraged > f) acc.push(cq(g, g.choices[g.choices.length - 1])); } };

/** PAUSE (U3 i). Idle gap with food absent (every site pays 0) of G ticks, ending at 14:00 on day 2 for every G so the
 *  post-gap window (14:00-18:00) has the same clock time. The creature still lives and forages; nothing pays.
 *  Readouts: choice quality in the 4 h after the gap (pattern restored, same sites), and the mean |change| in the learned
 *  site values (wSite) over the gap. A memory that treats idle time as progress loses choice quality and drifts with G.
 *  Note: closing every site instead (access = 0) drives the organism to NaN (finding F59), so "food absent" is used. */
function pause(S: number[], gaps = [0, 60, 240, 720]): M {
  const out: M = {};
  for (const G of gaps) { const q: number[] = [], dr: number[] = [];
    for (const s of S) { const g = mk(s); const end = D + 840; live(g, end - G); const p0 = Float32Array.from(g.pTrue), w0 = Float32Array.from(g.wSite);
      g.pTrue.fill(0); live(g, end); g.pTrue.set(p0); let d = 0, n = 0; for (let k = 0; k < SITES; k++) if (g.access[k]) { d += Math.abs(g.wSite[k] - w0[k]); n++; }
      const acc: number[] = []; live(g, end + 240, acc); q.push(mean(acc)); dr.push(n ? d / n : 0); }
    out[`choice quality after gap ${G}`] = q; out[`value drift over gap ${G}`] = dr; }
  return out; }

/** PERSIST (U3 ii). Persistence baseline ("copy the last state") for three learned predictors, scored over day 2 (after a
 *  1-day warm-up). skill = 1 - MSE(model) / MSE(persistence); > 0 means the model beats copying the last state.
 *  glcPred: blood glucose 30 min ahead (v3.5 interoceptive model). SelfModel: next-tick [glc, atp, integrity, fat, surprise].
 *  Forward model: arm displacement from the efference copy, driven by an AR(1) motor command from the world RNG after a
 *  gain change (the arm only moves under a harness, as in AE2). */
function persist(S: number[]): M {
  const gS: number[] = [], sS: number[] = [], fS: number[] = [];
  for (const s of S) { const g = mk(s); const w = wr(s); live(g, D);
    const buf: { at: number; pred: number; now: number }[] = []; let eM = 0, eP = 0;
    let prevPred: number[] | null = null, prevTgt: number[] | null = null; let sM = 0, sP = 0;
    const tg = (x: number[]): number[] => [x[0], x[1], x[2], x[3], x[10]];
    while (g.t < 2 * D) { g.step(); const glc = g.blood.glc;
      while (buf.length && buf[0].at <= g.t) { const b = buf.shift()!; eM += (glc - b.pred) ** 2; eP += (glc - b.now) ** 2; }
      buf.push({ at: g.t + 30, pred: g.mind.glcPred, now: glc });
      const sm = g.selfM; if (sm && sm.lastX && sm.lastX.length >= 11) { const t = tg(sm.lastX); if (prevPred && prevTgt) for (let o = 0; o < 5; o++) { sM += (t[o] - prevPred[o]) ** 2; sP += (t[o] - prevTgt[o]) ** 2; } prevPred = [...sm.pred]; prevTgt = t; } }
    gS.push(eP > 0 ? 1 - eM / eP : NaN); sS.push(sP > 0 ? 1 - sM / sP : NaN);
    const m = g.mind; m.gTrue = 0.5 + 1.5 * w(); let u = 0, prevObs = 0, fM = 0, fP = 0, n = 0;
    for (let i = 0; i < 600; i++) { u = 0.8 * u + 0.6 * (2 * w() - 1); m.arm = 0; m.efference = u; g.step(); if (i >= 300) { fM += (m.dArmObs - m.dArmPred) ** 2; fP += (m.dArmObs - prevObs) ** 2; n++; } prevObs = m.dArmObs; }
    fS.push(fP > 0 ? 1 - fM / fP : NaN); }
  return { "glcPred skill vs persistence": gS, "SelfModel skill vs persistence": sS, "forward model skill vs persistence": fS }; }

/** LASR (U3 iii): action-grounding. Two copies of the same creature (same seed and flags) run in lockstep to 10:00 on day 2,
 *  so their state is identical. At the next forage the action is swapped (copy A takes the best open site, copy B the worst);
 *  the two sites pay the same probability on that tick and the outcome RNG is shared, so only the action differs.
 *  Readout: how far each predictor's next-state prediction moves at +1 tick and over +1..+30, in units of that predictor's
 *  own tick-to-tick SD over the previous 4 h. 0 = the prediction ignores the action. The forward model gets a matched
 *  efference swap (+0.5 vs -0.5, on a second lockstep pair) as the positive control: readout = change in predicted arm
 *  displacement per unit change of command (0 = not grounded; about the learned gain when grounded). */
function lasr(S: number[]): M {
  const keys = ["SelfModel", "glcPred", "site values"] as const;
  const r1: Record<string, number[]> = {}, r30: Record<string, number[]> = {}; for (const k of keys) { r1[k] = []; r30[k] = []; } const fw: number[] = [];
  const rd = (g: any): Record<string, number[]> => ({ SelfModel: g.selfM ? [...g.selfM.pred] : [0], glcPred: [g.mind.glcPred], "site values": Array.from(g.wSite as Float32Array) });
  const dist = (a: number[], b: number[]): number => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
  for (const s of S) { const A = mk(s), B = mk(s); const T = D + 600; const hist: Record<string, number[][]> = {}; for (const k of keys) hist[k] = [];
    while (A.t < T) { A.step(); B.step(); if (A.t > T - 240) { const x = rd(A); for (const k of keys) hist[k].push(x[k]); } }
    const scale: Record<string, number> = {}; for (const k of keys) { const h = hist[k]; const st: number[] = []; for (let i = 1; i < h.length; i++) st.push(dist(h[i], h[i - 1])); scale[k] = Math.max(1e-9, sd(st) || mean(st) || 1e-9); }
    let best = -1, worst = -1; for (let k = 0; k < SITES; k++) if (A.access[k]) { if (best < 0 || A.pTrue[k] > A.pTrue[best]) best = k; if (worst < 0 || A.pTrue[k] < A.pTrue[worst]) worst = k; }
    const pb = A.pTrue[best], pw = A.pTrue[worst], pm = 0.5 * (pb + pw); const force = (g: any, k: number) => { const c0 = g.choose; g.choose = function (da: number) { const c = c0.call(this, da); return { k, sp: c.sp }; }; return () => { delete g.choose; }; };
    const ua = force(A, best), ub = force(B, worst); const f0 = A.foraged; let guard = 0;
    while (A.foraged === f0 && guard++ < 600) { for (const g of [A, B]) { g.pTrue[best] = pm; g.pTrue[worst] = pm; } A.step(); B.step(); }
    ua(); ub(); for (const g of [A, B]) { g.pTrue[best] = pb; g.pTrue[worst] = pw; }
    const d1: Record<string, number> = {}, d30: Record<string, number[]> = {}; for (const k of keys) d30[k] = [];
    for (let i = 1; i <= 30; i++) { const a = rd(A), b = rd(B); for (const k of keys) { const v = dist(a[k], b[k]) / scale[k]; if (i === 1) d1[k] = v; d30[k].push(v); } A.step(); B.step(); }
    for (const k of keys) { r1[k].push(d1[k]); r30[k].push(mean(d30[k])); }
    const C = mk(s), Dd = mk(s); while (C.t < T) { C.step(); Dd.step(); } C.mind.arm = 0; Dd.mind.arm = 0; C.mind.efference = 0.5; Dd.mind.efference = -0.5; C.step(); Dd.step();
    fw.push(Math.abs(C.mind.dArmPred - Dd.mind.dArmPred) / 1.0); }
  const out: M = {}; for (const k of keys) { out[`${k} shift +1 (SD units)`] = r1[k]; out[`${k} shift +1..30 (SD units)`] = r30[k]; }
  out["forward model efference swap (positive control)"] = fw; return out; }

/** STAGES (U5 scorer). One 9-day natural life per seed, scored at 3 life stages: S1 = days 0-1, S2 = days 2-4, S3 = days 5-8.
 *  At the start of S2 and S3 the pay-offs of the open sites are re-dealt (a world-RNG permutation), so each stage measures
 *  learning at that age. Readouts per stage: choice quality, rewards per forage, forages per day, metabolic heat kJ/day.
 *  Alive = 1 if the creature survives the stage. */
function stages(S: number[]): M {
  const st = [[0, 2], [2, 5], [5, 9]]; const out: M = {};
  for (const [i] of st.entries()) for (const r of ["choice quality", "rewards per forage", "forages per day", "heat kJ per day", "alive"]) out[`S${i + 1} ${r}`] = [];
  for (const s of S) { const g = mk(s); const w = wr(s);
    for (const [i, [a, b]] of st.entries()) { if (i > 0) { const open: number[] = []; for (let k = 0; k < SITES; k++) if (g.access[k]) open.push(k); const vals = open.map((k) => g.pTrue[k]); for (let j = vals.length - 1; j > 0; j--) { const x = Math.floor(w() * (j + 1)); [vals[j], vals[x]] = [vals[x], vals[j]]; } open.forEach((k, j) => (g.pTrue[k] = vals[j])); }
      const acc: number[] = []; const f0 = g.foraged, r0 = g.rewards, h0 = g.heat; let dead = false; try { live(g, b * D, acc); } catch { dead = true; } const alive = !dead && !g.deathCause && Number.isFinite(g.energy());
      out[`S${i + 1} choice quality`].push(mean(acc)); out[`S${i + 1} rewards per forage`].push((g.rewards - r0) / Math.max(1, g.foraged - f0));
      out[`S${i + 1} forages per day`].push((g.foraged - f0) / (b - a)); out[`S${i + 1} heat kJ per day`].push((g.heat - h0) / (b - a)); out[`S${i + 1} alive`].push(alive ? 1 : 0); } }
  return out; }


/** C10INTAKE (CQM10 wrong-reason guard, PLAN.md Phase 2): days 1-4 of a natural life, full creature vs the C10 control
 *  (fixedDrive). Readouts per seed: forages per day and fat at day 4 for each arm. Same window as specialists/CQM10/diag.ts.
 *  A satiety fix only counts if full intake stays >= the fixed arm and fat stays steady (no under-eating). */
function c10intake(S: number[]): M {
  const run = (o: Partial<Opts>) => S.map((s) => { const g = mk(s, o); live(g, D); const f0 = g.foraged; live(g, 4 * D); return { eat: (g.foraged - f0) / 3, fat: g.fat }; });
  const a = run({}), b = run({ fixedDrive: true } as any);
  return { "full forages per day": a.map((x) => x.eat), "fixed forages per day": b.map((x) => x.eat), "full fat day 4": a.map((x) => x.fat), "fixed fat day 4": b.map((x) => x.fat) }; }
export const TESTS41: Record<string, (S: number[]) => M> = { PAUSE: pause, PERSIST: persist, LASR: lasr, STAGES: stages, C10INTAKE: c10intake };
