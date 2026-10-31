// v4.0 R-tests (preregistrations/v4.0.md, DRAFT). New tests; the originals stay on record unchanged.
import { Organism, Opts } from "./organism";
import { OptOut } from "./fp/hot3";
type M = Record<string, number[]>;
const D = 1440; const mk = (seed: number, o: Partial<Opts> = {}): Organism => new Organism({ seed, ...o } as Opts);
const wr = (seed: number) => { let a = seed * 7349 + 101; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
/** AINF-R (activeInference, revised; NEW test, AINF stays reported). Hidden volatile sites: every site independently flips between rich (0.8) and poor (0.1)
 *  with hazard 1/H per tick; the state is observable only by visiting. A world RNG separate from the creature's makes the world identical across arms (matched).
 *  Stale beliefs cost food, so checking uncertain sites pays. Metric: rewards per forage attempt over 2 days after warm-up. Control: epistemic (uncertainty) term lesioned. */
function ainfR(S: number[], H = 360): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const st = Array.from({ length: n }, () => (r() < 0.5 ? 1 : 0));
    const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = st[k] ? 0.8 : 0.1; }; set(); while (g.t < 480) { g.step(); set(); } const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 480 + 2 * D) { for (let k = 0; k < n; k++) if (r() < 1 / H) st[k] ^= 1; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }
/** AINF-R2 design (chosen): ONE hidden rich site (0.8; all others 0.05) that relocates to a uniformly random other site with hazard 1/H per tick.
 *  After a relocation, value alone points nowhere (every other site was last seen poor); only knowledge of WHICH sites are least recently checked helps. */
function ainfR2(S: number[], H = 240): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; let rich = Math.floor(r() * n);
    const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = k === rich ? 0.8 : 0.05; }; set(); while (g.t < 480) { g.step(); set(); } const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 480 + 2 * D) { if (r() < 1 / H) rich = (rich + 1 + Math.floor(r() * (n - 1))) % n; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }
/** AINF-R3 (chosen design). Phase 1 (warm-up to 08:00 day 1): only the creature's usual half of the sites is open; they pay a steady 0.35.
 *  Phase 2 (2 days): the other half opens. Each new site has a HIDDEN state, rich (0.8) or poor (0.05), drawn 50/50 and flipping with hazard 1/720 per tick;
 *  it can only be learned by visiting. Old sites keep paying 0.35. So information-seeking (sampling the new, uncertain sites and re-checking them) pays,
 *  and a stale belief about a new site costs food. World draws come from a separate world RNG, identical across arms (matched).
 *  Metric: rewards per forage attempt in phase 2. Control: epistemic (uncertainty) term lesioned. Same noise, same value learning. */
function ainfR3(S: number[], H = 720): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const old = Array.from(g.access as Uint8Array);
    for (let k = 0; k < n; k++) if (old[k]) g.pTrue[k] = 0.35; while (g.t < D + 480) g.step(); const st = Array.from({ length: n }, () => (r() < 0.5 ? 1 : 0));
    for (let k = 0; k < n; k++) g.access[k] = 1; const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = old[k] ? 0.35 : st[k] ? 0.8 : 0.05; }; set(); const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 3 * D + 480) { for (let k = 0; k < n; k++) if (!old[k] && r() < 1 / H) st[k] ^= 1; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }

/** AINF-R4 (design iteration of R3 on dev seeds, disclosed): same layout, but the known old sites pay 0.5 and each new site is rich (0.85) with p = 0.3,
 *  else poor (0.05), so a new site's EXPECTED value (~0.3) is below the known option: a greedy forager has no pragmatic reason to sample it, and only
 *  information-seeking finds the rich ones. Hidden states flip with hazard 1/H (H = 2880, ~once per 2 days) so learned knowledge stays useful for a while
 *  but goes stale. World RNG separate and identical across arms. Metric: rewards per forage over the 2-day phase 2. Control: epistemic term lesioned. */
function ainfR4(S: number[], H = 2880, pOld = 0.5): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const old = Array.from(g.access as Uint8Array);
    for (let k = 0; k < n; k++) if (old[k]) g.pTrue[k] = pOld; while (g.t < D + 480) g.step(); const st = Array.from({ length: n }, () => (r() < 0.3 ? 1 : 0));
    for (let k = 0; k < n; k++) g.access[k] = 1; const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = old[k] ? pOld : st[k] ? 0.85 : 0.05; }; set(); const r0 = g.rewards, f0 = g.foraged;
    while (g.t < 3 * D + 480) { for (let k = 0; k < n; k++) if (!old[k] && r() < 1 / H) st[k] = r() < 0.3 ? 1 : 0; set(); g.step(); } return (g.rewards - r0) / Math.max(1, g.foraged - f0); });
  return { full: f({}), "epistemic term lesioned": f({ efeLesion: true }) }; }
/** Diagnostic for AINFR4 (not a test): per arm, fraction of phase-2 forages on currently-rich new sites ("exploit"), and on any new site ("explore+exploit"). */
function ainfR4diag(S: number[], H = 2880, pOld = 0.5): M { const out: M = {}; for (const [nm, o] of [["full", {}], ["lesion", { efeLesion: true }]] as [string, Partial<Opts>][]) { const a: number[] = [], b: number[] = [], c: number[] = [];
    for (const s of S) { const g: any = mk(s, o); const r = wr(s); const n = g.pTrue.length; const old = Array.from(g.access as Uint8Array);
      for (let k = 0; k < n; k++) if (old[k]) g.pTrue[k] = pOld; while (g.t < D + 480) g.step(); const st = Array.from({ length: n }, () => (r() < 0.3 ? 1 : 0));
      for (let k = 0; k < n; k++) g.access[k] = 1; const set = () => { for (let k = 0; k < n; k++) g.pTrue[k] = old[k] ? pOld : st[k] ? 0.85 : 0.05; }; set(); let nr = 0, nn = 0, nf = 0, known = 0, kn = 0;
      while (g.t < 3 * D + 480) { for (let k = 0; k < n; k++) if (!old[k] && r() < 1 / H) st[k] = r() < 0.3 ? 1 : 0; set(); const f0 = g.foraged; g.step(); if (g.foraged > f0) { const k = g.choices[g.choices.length - 1]; nf++; if (!old[k]) { nn++; if (st[k]) nr++; }
          /* belief quality: does the creature's value estimate rank a rich new site above the old ones? */ let bestRich = -1, bestV = -1e9; for (let j = 0; j < n; j++) { const v = g.valueEst(j); if (v > bestV) { bestV = v; bestRich = !old[j] && st[j] ? 1 : 0; } } known += bestRich; kn++; } }
      a.push(nr / Math.max(1, nf)); b.push(nn / Math.max(1, nf)); c.push(known / Math.max(1, kn)); }
    out[nm + ":onRich"] = a; out[nm + ":onNew"] = b; out[nm + ":argmaxValueIsRich"] = c; } return out; }
const at = (g: Organism, t: number): void => { while (g.t < t) g.step(); };
const show = (g: Organism, x: number[]): void => { for (let i = 0; i < 16; i++) g.sens[i] = Math.max(0, x[i]); };
const blank = (g: Organism): void => { g.sens.fill(0); g.step(); };
/** N09 thought-curvature metacognition (NOVEL-100 N09). HOT-3-style opt-out task (4 cue maps, noisy cues, safe opt-out 0.3 vs 1/0 gamble).
 *  The creature keeps a running accuracy table indexed by its own confidence bin; arm "curv" also splits the table by whether its
 *  cortical trajectory curvature (v40mods Curvature.kappa, z > 0.5) is high on that trial. Controls: "blind" (confidence only, = HOT-3 opt-out)
 *  and "shuf" (same 2-D table, but the curvature flag is drawn from a random earlier trial of the same run). Metric: mean reward, trials 160-259.
 *  Descriptive (logged, not graded here): P(confidence drops next trial | curvature peak) vs | no peak. */
function n09(S: number[]): M { const f = (mode: "curv" | "blind" | "shuf") => S.map((s) => { const g: any = mk(s); at(g, 480); const r = wr(s);
    for (let k = 0; k < 120; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); }
    const pc = new Array(20).fill(0.5); const flags: number[] = []; let R = 0, n = 0;
    for (let t = 0; t < 260; t++) { const m = Math.floor(r() * 4), c = Math.floor(r() * 4); const x = new Array(16).fill(0); x[m * 4 + c] = 0.5 + 0.7 * r(); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(gq(r)); show(g, x); g.step();
      const okk = g.mind.action === c; const b = Math.min(9, Math.floor(g.mind.conf * 10)); const cv = g.curv; const hi = (cv.kappa - cv.kMean) / Math.max(1e-6, cv.kSD) > 0.5 ? 1 : 0; flags.push(hi);
      const fl = mode === "curv" ? hi : mode === "shuf" ? flags[Math.floor(r() * flags.length)] : 0; const idx = b + 10 * fl;
      const out = pc[idx] < 0.3; const rw = out ? 0.3 : okk ? 1 : 0; if (t >= 160) { R += rw; n++; }
      pc[idx] += 0.1 * ((okk ? 1 : 0) - pc[idx]); g.mind.rew = rw - 0.4; g.mind.teachConf(okk); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } return R / n; });
  return { curv: f("curv"), blind: f("blind"), shuf: f("shuf") }; }
const gq = (r: () => number): number => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
/** N13 "free won't" (NOVEL-100 N13). Danger world (sites carry hidden harm probabilities). After the decision race the creature reads its own
 *  learned harm prediction for the selected act and may veto it and re-decide (Opts.veto). Controls: "shuffle" (veto reads the prediction
 *  for a different act: lens-shuffled) and "off". Metric over 2 days after warm-up: (rewards - harms) per forage. Grade A also needs veto rate
 *  to track predicted harm (logged: vetoes, and mean predicted harm). */
function n13(S: number[]): M { const f = (o: Partial<Opts>) => S.map((s) => { const g: any = mk(s, { danger: true, ...o }); at(g, 480); const r0 = g.rewards, h0 = g.harms, f0 = g.foraged; at(g, 480 + 2 * D);
    return (g.rewards - r0 - (g.harms - h0)) / Math.max(1, g.foraged - f0); });
  return { own: f({ veto: "own" }), shuffle: f({ veto: "shuffle" }), off: f({ veto: "off" }), intShuf: f({ veto: "intShuf" }) }; }
/** HOT-3R (NEW R test, disclosed; HOT-3 stays reported as failing). FIRST-PRINCIPLES.md: opt-out only has value if the safe option is worth about as much as
 *  an average trial, so the safe option pays the creature's own running accuracy (EMA 0.05). Same stream as HOT-3 (fp/hot3.ts OptOut on g.mind.conf).
 *  Arms: metacognitive opt-out vs random opt-out at the matched per-seed rate vs confidence-shuffled (table built on random confidences). Metric: mean reward trials 160-259. */
function hot3R(S: number[]): M { const rate: number[] = []; const f = (mode: "meta" | "rand" | "shuf") => S.map((s, si) => { const g: any = mk(s); at(g, 480); const r = wr(s), rr = wr(s + 99991);
    for (let k = 0; k < 120; k++) { const c = [0, 1, 2, 3].map(() => Math.floor(r() * 4)); const x = new Array(16).fill(0); c.forEach((cc, m) => (x[m * 4 + cc] = 1)); show(g, x); g.step(); c.forEach((cc, m) => g.mind.teach(m, cc)); blank(g); }
    const o = new OptOut(); let acc = 0.5, R = 0, n = 0, outs = 0;
    for (let t = 0; t < 260; t++) { const m = Math.floor(r() * 4), c = Math.floor(r() * 4); const x = new Array(16).fill(0); x[m * 4 + c] = 0.5 + 0.7 * r(); for (let i = 0; i < 16; i++) x[i] += 0.3 * Math.abs(gq(r)); show(g, x); g.step();
      const ok = g.mind.action === c; const cf = mode === "shuf" ? rr() : g.mind.conf; const out = mode === "rand" ? rr() < rate[si] : o.decide(cf, acc); const rw = out ? acc : ok ? 1 : 0; if (t >= 160) { R += rw; n++; outs += +out; }
      o.learn(cf, ok); acc += 0.05 * ((ok ? 1 : 0) - acc); g.mind.rew = rw - 0.4; g.mind.teachConf(ok); g.mind.teachAction(c); g.mind.teach(m, c); blank(g); } if (mode === "meta") rate[si] = outs / n; return R / n; });
  const meta = f("meta"); return { "metacognitive opt-out": meta, "random opt-out (matched rate)": f("rand"), "confidence shuffled": f("shuf") }; }
export const TESTS40: Record<string, (S: number[]) => M> = { AINFR: (S) => ainfR3(S), AINFR4: (S) => ainfR4(S), AINFR4D: (S) => ainfR4diag(S), N09: n09, HOT3R: hot3R, N13: n13 };
