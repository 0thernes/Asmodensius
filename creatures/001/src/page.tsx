import { Fragment, useEffect, useRef, useState, Button, Toggle, useGrokTheme } from "grok/canvas";
// ===== Creature #1 evaluation harness: seeded functional tests with ablations and controls =====
type Rng = () => number;
function mulberry(seed: number): Rng { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r: Rng): number { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]): number => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
type Cmp = { control: string; full: number; ctrl: number; d: number; t: number; pass: boolean };
function compare(name: string, full: number[], ctrl: number[], higherBetter = true): Cmp {
  const s = higherBetter ? 1 : -1; const m1 = mean(full), m2 = mean(ctrl); const diff = s * (m1 - m2);
  const s1 = sd(full), s2 = sd(ctrl); const sp = Math.sqrt((s1 * s1 + s2 * s2) / 2); const se = Math.sqrt(s1 * s1 / full.length + s2 * s2 / ctrl.length);
  const d = sp > 1e-12 ? diff / sp : (diff > 0 ? Infinity : 0); const t = se > 1e-12 ? diff / se : (diff > 0 ? Infinity : 0);
  return { control: name, full: m1, ctrl: m2, d, t, pass: d >= 0.8 && t >= 2.75 };
}
const SEEDS = Array.from({ length: 16 }, (_, k) => 1000 + k);
const runSeeds = (f: (r: Rng, seed: number) => number, salt: number): number[] => SEEDS.map((s) => f(mulberry(s * 7919 + salt), s));
type Item = { id: string; group: string; name: string; metric: string; mechanism: string; cmps: Cmp[]; pass: boolean; category?: string; note?: string };
function item(id: string, group: string, name: string, metric: string, mechanism: string, cmps: Cmp[], note?: string): Item {
  const pass = cmps.length > 0 && cmps.every((c) => c.pass); const any = cmps.some((c) => c.pass);
  const category = cmps.length === 0 ? "Implementation identified" : pass ? "Bounded test evidence" : any ? "Mixed or restricted" : "Not established";
  return { id, group, name, metric, mechanism, cmps, pass, category, note };
}

// ---------- linear algebra ----------
function ridge(X: number[][], y: number[], lam = 1e-2): number[] {
  const n = X[0].length; const A = Array.from({ length: n }, () => new Float64Array(n + 1));
  for (let r = 0; r < X.length; r++) { const x = X[r]; for (let i = 0; i < n; i++) { A[i][n] += x[i] * y[r]; for (let j = 0; j < n; j++) A[i][j] += x[i] * x[j]; } }
  for (let i = 0; i < n; i++) A[i][i] += lam;
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];
    const v = A[c][c] || 1e-12; for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / v; if (f) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; } }
  return Array.from({ length: n }, (_, i) => A[i][n] / (A[i][i] || 1e-12));
}
const dot = (a: number[], b: number[]): number => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
function shuffle<X>(a: X[], r: Rng): X[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// ---------- Reservoir (recurrent module shared by the creature's core) ----------
class Reservoir { n: number; W: number[][]; U: number[][]; h: number[]; bias: number[];
  constructor(n: number, nin: number, r: Rng, rho = 0.9, mask?: (i: number, j: number) => boolean, inMask?: (i: number, k: number) => boolean) {
    this.n = n; this.W = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (mask && !mask(i, j)) ? 0 : gauss(r) * rho / Math.sqrt(n)));
    this.U = Array.from({ length: n }, (_, i) => Array.from({ length: nin }, (_, k) => (inMask && !inMask(i, k)) ? 0 : gauss(r))); this.h = new Array(n).fill(0); this.bias = Array.from({ length: n }, () => gauss(r) * 0.8); }
  reset(): void { this.h.fill(0); }
  step(x: number[]): number[] { const h2 = new Array(this.n); for (let i = 0; i < this.n; i++) h2[i] = Math.tanh(dot(this.W[i], this.h) + dot(this.U[i], x) + this.bias[i]); this.h = h2; return h2; }
}
const feat = (h: number[]): number[] => [...h, 1];
function classifyAcc(trainX: number[][], trainY: number[], testX: number[][], testY: number[]): number { const w = ridge(trainX, trainY, 0.1); let c = 0; for (let i = 0; i < testX.length; i++) if (Math.sign(dot(w, testX[i])) === testY[i]) c++; return c / testX.length; }

// ===== Butlin et al. 2023 indicators =====
function rpt1(): Item { // algorithmic recurrence: delayed recall over 6 noisy steps
  const run = (abl: string) => (r: Rng): number => { const res = new Reservoir(40, 1, r, abl === "norec" ? 0 : 0.95);
    const make = (N: number): [number[][], number[]] => { const X: number[][] = [], Y: number[] = []; for (let k = 0; k < N; k++) { res.reset(); const s = r() < 0.5 ? -1 : 1; let h = res.step([s]); for (let t = 0; t < 6; t++) h = res.step([gauss(r) * 0.3]); X.push(feat(h)); Y.push(s); } return [X, Y]; };
    const [a, b] = make(300); const [c, d] = make(200); return classifyAcc(a, abl === "shuffle" ? shuffle(b, r) : b, c, d); };
  const full = runSeeds(run("full"), 1);
  return item("RPT-1", "Butlin", "Algorithmic recurrence", "delayed-recall accuracy", "recurrent reservoir (ρ=0.95) + ridge readout",
    [compare("recurrence ablated (W=0)", full, runSeeds(run("norec"), 1)), compare("random control: shuffled labels", full, runSeeds(run("shuffle"), 1))]);
}
function rpt2(): Item { // integrated perceptual representations: XOR binding of two channels
  const run = (abl: string) => (r: Rng): number => { const blk = abl === "split"; const res = new Reservoir(40, 2, r, 0.8, blk ? (i, j) => (i < 20) === (j < 20) : undefined, blk ? (i, k) => (i < 20) === (k === 0) : undefined);
    const make = (N: number): [number[][], number[]] => { const X: number[][] = [], Y: number[] = []; for (let k = 0; k < N; k++) { res.reset(); const a = r() < 0.5 ? -1 : 1, b = r() < 0.5 ? -1 : 1; let h: number[] = []; for (let t = 0; t < 3; t++) h = res.step([a + gauss(r) * 0.2, b + gauss(r) * 0.2]); X.push(feat(h)); Y.push(a * b); } return [X, Y]; };
    const [a, b] = make(300); const [c, d] = make(200); return classifyAcc(a, abl === "shuffle" ? shuffle(b, r) : b, c, d); };
  const full = runSeeds(run("full"), 2);
  return item("RPT-2", "Butlin", "Integrated perceptual representations", "feature-binding (XOR) accuracy", "mixed recurrent representation of two channels",
    [compare("ablation: channels segregated (block-diagonal)", full, runSeeds(run("split"), 2)), compare("random control: shuffled labels", full, runSeeds(run("shuffle"), 2))]);
}
// specialist modules: module m is tuned to modality m (template matching on its own channel)
function modulesOut(x: number[][], perm: number[] | null): number[] { return [0, 1, 2].map((m) => { const src = perm ? x[perm[m]] : x[m]; const tpl = [1, -1, 1, -1].map((v, i) => v * (m + 1 === 3 && i > 1 ? -1 : 1)); return dot(src, tpl) / 4; }); }
function gwt1(): Item { // specialization: lesioning module m selectively hurts task m
  const run = (ctrl: boolean) => (r: Rng): number => { const perm = ctrl ? null : null; let own = 0, cross = 0; const N = 200;
    for (let m = 0; m < 3; m++) { let accOwn = 0, accCross = 0;
      for (let k = 0; k < N; k++) { const lab = [0, 1, 2].map(() => (r() < 0.5 ? -1 : 1)); const x = lab.map((l, mm) => { const tpl = [1, -1, 1, -1].map((v, i) => v * (mm + 1 === 3 && i > 1 ? -1 : 1)); return tpl.map((v) => v * l + gauss(r) * 0.8); });
        let out: number[];
        if (ctrl) { // control: one undifferentiated module pool, every unit reads a random mixture of channels
          const mix = [0, 1, 2].map(() => [r(), r(), r()]); out = [0, 1, 2].map((j) => { const tpl = [1, -1, 1, -1].map((v, i) => v * (j + 1 === 3 && i > 1 ? -1 : 1)); return mix[j].reduce((s, w, c) => s + w * dot(x[c], tpl) / 4, 0); }); }
        else out = modulesOut(x, perm);
        const les = out.slice(); les[m] = 0; // lesion module m
        accOwn += (Math.sign(les[m]) === lab[m] ? 1 : 0) - (Math.sign(out[m]) === lab[m] ? 1 : 0);
        const o2 = (m + 1) % 3; accCross += (Math.sign(les[o2]) === lab[o2] ? 1 : 0) - (Math.sign(out[o2]) === lab[o2] ? 1 : 0); }
      own += -accOwn / N; cross += -accCross / N; }
    return (own - cross) / 3; };
  const full = runSeeds(run(false), 3);
  // causal ablation: remove modular wiring -> mixture pool
  return item("GWT-1", "Butlin", "Specialized parallel modules", "selective lesion deficit (own − cross)", "3 modality-tuned specialist modules",
    [compare("random control: unspecialized mixed pool", full, runSeeds(run(true), 3))]);
}
function gwt2(): Item { // limited-capacity workspace with salience competition
  const run = (mode: string) => (r: Rng): number => { let c = 0; const N = 300; for (let k = 0; k < N; k++) { const rel = Math.floor(r() * 4); const lab = r() < 0.5 ? -1 : 1;
      const sig = [0, 1, 2, 3].map((m) => m === rel ? lab * 2 + gauss(r) * 0.5 : (r() < 0.5 ? -1 : 1) * 0.9 + gauss(r) * 0.5);
      const sal = sig.map((s) => Math.abs(s)); let ws: number;
      if (mode === "full") ws = sig[sal.indexOf(Math.max(...sal))]; else if (mode === "nobottleneck") ws = mean(sig); else ws = sig[Math.floor(r() * 4)];
      if (Math.sign(ws) === lab) c++; } return c / N; };
  const full = runSeeds(run("full"), 4);
  return item("GWT-2", "Butlin", "Limited-capacity workspace with selection", "action accuracy amid distractors", "1-slot workspace, salience competition",
    [compare("ablation: no bottleneck (average all modules)", full, runSeeds(run("nobottleneck"), 4)), compare("random control: random module enters workspace", full, runSeeds(run("random"), 4))]);
}
function gwt3(): Item { // global broadcast: module B acts on info only module A perceives
  const run = (mode: string) => (r: Rng): number => { let c = 0; const N = 300; for (let k = 0; k < N; k++) { const cue = r() < 0.5 ? -1 : 1; const aOut = cue + gauss(r) * 0.4;
      const bcast = mode === "full" ? aOut : mode === "off" ? 0 : gauss(r); const bAct = Math.sign(bcast + gauss(r) * 0.05) || (r() < 0.5 ? 1 : -1); if (bAct === cue) c++; } return c / N; };
  const full = runSeeds(run("full"), 5);
  return item("GWT-3", "Butlin", "Global broadcast", "accuracy of a module that only receives broadcast", "workspace content broadcast to all modules",
    [compare("ablation: broadcast cut", full, runSeeds(run("off"), 5)), compare("random control: random broadcast", full, runSeeds(run("rand"), 5))]);
}
function gwt4(): Item { // state-dependent attention for sequential querying
  const run = (mode: string) => (r: Rng): number => { let c = 0; const N = 300; for (let k = 0; k < N; k++) { const v = [0, 1, 2].map(() => (r() < 0.5 ? -1 : 1)); const target = v[0] > 0 ? v[1] : v[2];
      const read1 = v[0] + gauss(r) * 0.3; let q: number; if (mode === "full") q = read1 > 0 ? 1 : 2; else if (mode === "fixed") q = 1; else q = 1 + Math.floor(r() * 2);
      if (Math.sign(v[q] + gauss(r) * 0.3) === target) c++; } return c / N; };
  const full = runSeeds(run("full"), 6);
  return item("GWT-4", "Butlin", "State-dependent attention (sequential queries)", "two-step query accuracy", "workspace state chooses the next module to query",
    [compare("ablation: fixed attention", full, runSeeds(run("fixed"), 6)), compare("random control: random attention", full, runSeeds(run("rand"), 6))]);
}
function protos(r: Rng, K: number, D: number): number[][] { return Array.from({ length: K }, () => Array.from({ length: D }, () => (r() < 0.5 ? -1 : 1))); }
function hot1(): Item { // generative top-down perception: iterative inference with learned prototypes
  const run = (mode: string) => (r: Rng): number => { const D = 16, K = 6; const P = protos(r, K, D);
    // learn prototypes from noisy samples (online mean)
    const L = P.map(() => new Array(D).fill(0)); for (let k = 0; k < 300; k++) { const c = Math.floor(r() * K); for (let i = 0; i < D; i++) L[c][i] += (P[c][i] + gauss(r) * 0.8 - L[c][i]) * 0.05; }
    const model = mode === "randprior" ? protos(r, K, D) : L; let err = 0; const N = 200;
    for (let k = 0; k < N; k++) { const c = Math.floor(r() * K); const x = P[c].map((v) => v + gauss(r) * 1.0); let est = x.slice();
      if (mode !== "bottomup") for (let it = 0; it < 5; it++) { const sims = model.map((p) => dot(p, est)); const mx = Math.max(...sims); const w = sims.map((s) => Math.exp((s - mx) * 0.5)); const z = w.reduce((a, b) => a + b, 0);
        const prior = new Array(D).fill(0); model.forEach((p, j) => p.forEach((v, i) => prior[i] += v * w[j] / z)); est = est.map((v, i) => 0.3 * x[i] + 0.7 * prior[i]); }
      err += P[c].reduce((s, v, i) => s + (v - est[i]) ** 2, 0) / D; } return -err / N; };
  const full = runSeeds(run("full"), 7);
  return item("HOT-1", "Butlin", "Generative, top-down / noisy perception", "−reconstruction MSE", "learned generative prototypes refine noisy input",
    [compare("ablation: bottom-up only", full, runSeeds(run("bottomup"), 7)), compare("random control: random generative prior", full, runSeeds(run("randprior"), 7))]);
}
function auroc(conf: number[], correct: boolean[]): number { let n1 = 0, n0 = 0, s = 0; const idx = conf.map((c, i) => [c, i]).sort((a, b) => a[0] - b[0]); idx.forEach(([, i], rank) => { if (correct[i]) { n1++; s += rank + 1; } else n0++; }); return n1 && n0 ? (s - n1 * (n1 + 1) / 2) / (n1 * n0) : 0.5; }
function firstOrder(r: Rng, N: number) { const out: { conf: number; ok: boolean; margin: number }[] = []; for (let k = 0; k < N; k++) { const lab = r() < 0.5 ? -1 : 1; const noise = 0.3 + r() * 2; const x = lab * 0.8 + gauss(r) * noise; const est = Math.sign(x) || 1;
    // second-order monitor: learned reliability = |x| scaled by estimated noise of the trial (observed via a second sample)
    const x2 = lab * 0.8 + gauss(r) * noise; const conf = Math.abs(x + x2) / (Math.abs(x - x2) + 0.3); out.push({ conf, ok: est === lab, margin: x }); } return out; }
function hot2(): Item { const run = (mode: string) => (r: Rng): number => { const t = firstOrder(r, 400); const conf = mode === "full" ? t.map((o) => o.conf) : mode === "const" ? t.map(() => 1) : shuffle(t.map((o) => o.conf), r); return auroc(conf, t.map((o) => o.ok)); };
  const full = runSeeds(run("full"), 8);
  return item("HOT-2", "Butlin", "Metacognitive monitoring", "type-2 AUROC", "second-order monitor estimates reliability from sample consistency",
    [compare("ablation: monitor removed (constant confidence)", full, runSeeds(run("const"), 8)), compare("random control: shuffled confidence", full, runSeeds(run("shuf"), 8))]); }
function hot3(): Item { const run = (mode: string) => (r: Rng): number => { const train = firstOrder(r, 300); const test = firstOrder(r, 300);
    // belief-guided policy: learn threshold that maximizes reward on train (opt-out pays 0.2)
    let best = 0, bestR = -1e9; for (const th of [0.2, 0.4, 0.6, 0.8, 1, 1.3, 1.6, 2, 2.5, 3]) { const R = train.reduce((s, o) => s + (o.conf < th ? 0.2 : o.ok ? 1 : -1), 0); if (R > bestR) { bestR = R; best = th; } }
    const optRate = train.filter((o) => o.conf < best).length / train.length;
    return test.reduce((s, o) => s + (mode === "full" ? (o.conf < best ? 0.2 : o.ok ? 1 : -1) : mode === "never" ? (o.ok ? 1 : -1) : (r() < optRate ? 0.2 : o.ok ? 1 : -1)), 0) / test.length; };
  const full = runSeeds(run("full"), 9);
  return item("HOT-3", "Butlin", "Agency guided by metacognitive belief", "reward per trial with opt-out", "confidence-gated action selection (learned threshold)",
    [compare("ablation: no metacognitive gating", full, runSeeds(run("never"), 9)), compare("random control: random opt-out at same rate", full, runSeeds(run("rand"), 9))]); }
function spearman(a: number[], b: number[]): number { const rk = (v: number[]) => { const o = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const rr = new Array(v.length); o.forEach(([, i], k) => rr[i] = k); return rr; }; const x = rk(a), y = rk(b); const mx = mean(x), my = mean(y); let s = 0, sx = 0, sy = 0; for (let i = 0; i < x.length; i++) { s += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; } return s / Math.sqrt(sx * sy); }
function hot4(): Item { const run = (mode: string) => (r: Rng): number => { const M = 64, k = 8; const C = Array.from({ length: M }, () => [r() * 2 - 1, r() * 2 - 1]);
    const enc = (p: number[]): number[] => { if (mode === "hash") { const rr = mulberry(Math.floor((p[0] + 2) * 1e6) ^ Math.floor((p[1] + 2) * 1e3)); const v = new Array(M).fill(0); for (let i = 0; i < k; i++) v[Math.floor(rr() * M)] = 1; return v; }
      const a = C.map((c) => Math.exp(-((c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2) / 0.08)); const th = a.slice().sort((x, y) => y - x)[k - 1]; return a.map((v) => (v >= th ? v : 0)); };
    const pts = Array.from({ length: 40 }, () => [r() * 1.6 - 0.8, r() * 1.6 - 0.8]); const E = pts.map(enc); const di: number[] = [], dr: number[] = [];
    for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d > 0.6) continue; di.push(d); const ni = Math.hypot(...E[i]) || 1, nj = Math.hypot(...E[j]) || 1; dr.push(1 - dot(E[i], E[j]) / (ni * nj)); }
    return spearman(di, dr); };
  const full = runSeeds(run("full"), 10);
  return item("HOT-4", "Butlin", "Sparse and smooth coding (quality space)", "Spearman ρ(stimulus distance, code distance)", "k-WTA sparse RBF population code (8 of 64 active)",
    [compare("random control: sparse random hash code", full, runSeeds(run("hash"), 10))]); }
// attention schema: Kalman model of own attention + hidden drift
let ASTU = 1; export function setASTU(v: number) { ASTU = v; }
let ASTM = 0.9, ASTG = 3, ASTA = 0.001; export function setAST(m: number, g: number, a = ASTA) { ASTM = m; ASTG = g; ASTA = a; }
function attnRunTrace(r: Rng, rec: number[]): number { return attnRun(r, "full", false, rec); }
function attnRun(r: Rng, mode: string, social: boolean, rec?: number[]): number { let a = 0, d = 0; let ea = 0, ed = 0; let P00 = 1, P01 = 0, P11 = 1; let err = 0; const T = 300; const Rn = 0.5, Qd = 0.0064; let infl = 1;
  const phi = mode === "randschema" ? r() * 0.5 : 0.98; const fa = social ? 0.9 : 1;
  for (let t = 0; t < T; t++) { const obs = a + gauss(r) * Math.sqrt(Rn);
    // schema update with observation (state [a, d])
    const S = P00 + Rn; const inn = obs - ea; infl = Math.max(1, ASTM * infl + (1 - ASTM) * inn * inn / S); /* schema monitors its own surprise (normalized innovation) */ const K0 = P00 / S, K1 = P01 / S; ea += K0 * inn; ed += K1 * inn; const n00 = (1 - K0) * P00, n01 = (1 - K0) * P01, n11 = P11 - K1 * P01; P00 = n00; P01 = n01; P11 = n11;
    let u = 0; if (!social) { u = mode === "noschema" ? -0.5 * obs : -(ea + (mode === "full" ? ASTU : 1) * ed); u = Math.max(-1, Math.min(1, u)); }
    if (social) err += mode === "noschema" ? (obs - a) ** 2 : (ea - a) ** 2;
    d = 0.98 * d + gauss(r) * 0.08; a = fa * a + u + d; if (!social) err += a * a; if (rec) rec.push(err);
    // schema predict: a' = fa*a + u + phi*d ; d' = phi*d
    ea = fa * ea + u + phi * ed; ed = phi * ed; const p00 = fa * fa * P00 + 2 * fa * phi * P01 + phi * phi * P11, p01 = fa * phi * P01 + phi * phi * P11, p11 = phi * phi * P11 + Qd; P00 = p00 + 1e-4 + ASTA * (infl - 1); P01 = p01; P11 = p11 + ASTG * Qd * (infl - 1); /* surprise inflates drift uncertainty and the schema's uncertainty about its own focus */ }
  return -err / T; }
function ast1(): Item { const run = (mode: string) => (r: Rng): number => attnRun(r, mode, false); const full = runSeeds(run("full"), 11);
  return item("AST-1", "Butlin", "Predictive model of attention (attention schema)", "−attention tracking error", "Kalman attention schema estimates focus + hidden drift, monitors its own surprise (NIS) to inflate both focus and drift uncertainty, and steers attention",
    [compare("ablation: schema removed (raw reactive control)", full, runSeeds(run("noschema"), 11)), compare("random control: random schema parameters", full, runSeeds(run("randschema"), 11))]); }
function pp1(): Item { const run = (mode: string) => (r: Rng): number => { const N = 600; const x: number[] = [0, 0]; for (let t = 2; t < N; t++) x.push(1.6 * x[t - 1] - 0.8 * x[t - 2] + gauss(r) * 0.3);
    const seq = mode === "shufftime" ? shuffle(x, r) : x; let w = [0, 0, 0]; for (let t = 2; t < N; t++) { const f = [seq[t - 1], seq[t - 2], 1]; const e = seq[t] - dot(w, f); if (mode !== "frozen") w = w.map((v, i) => v + 0.01 * e * f[i] / (1 + dot(f, f))); }
    let err = 0; for (let t = N - 200; t < N; t++) { const f = [x[t - 1], x[t - 2], 1]; err += (x[t] - dot(w, f)) ** 2; } return -err / 200; };
  const full = runSeeds(run("full"), 12);
  return item("PP-1", "Butlin", "Predictive coding input module", "−next-input prediction MSE", "prediction-error-driven (NLMS) sensory predictor",
    [compare("ablation: prediction errors not used (frozen)", full, runSeeds(run("frozen"), 12)), compare("random control: trained on time-shuffled input", full, runSeeds(run("shufftime"), 12))]); }
function ae1(): Item { const run = (mode: string) => (r: Rng): number => { let p = [0.8, 0.5, 0.2]; const Q = [0, 0, 0]; let tot = 0; const T = 600;
    for (let t = 0; t < T; t++) { if (t % 150 === 149) p = shuffle(p, r); let a: number; if (mode === "random") a = Math.floor(r() * 3); else { const z = Q.map((q) => Math.exp(q * 6)); const s = z.reduce((x, y) => x + y, 0); let u = r() * s; a = 0; while (u > z[a] && a < 2) { u -= z[a]; a++; } }
      const rew = r() < p[a] ? 1 : 0; tot += rew; const fb = mode === "shuffbf" ? (r() < 0.5 ? 1 : 0) : rew; Q[a] += 0.15 * (fb - Q[a]); } return tot / T; };
  const full = runSeeds(run("full"), 13);
  return item("AE-1", "Butlin", "Agency: learning from feedback to pursue goals", "reward rate under reversals", "Q-learning with softmax selection",
    [compare("ablation: feedback replaced by noise", full, runSeeds(run("shuffbf"), 13)), compare("random control: random policy", full, runSeeds(run("random"), 13))]); }
// embodiment / sensorimotor contingencies
function smRun(r: Rng, mode: string, measure: "reach" | "percept" | "adapt" | "plan"): number { const G = [[0.8 + r() * 0.6, (r() - 0.5) * 0.6], [(r() - 0.5) * 0.6, 0.8 + r() * 0.6]]; let Gh = [[0.1, 0], [0, 0.1]];
  let pos = [0, 0]; let err = 0; let cnt = 0; const T = 400;
  for (let t = 0; t < T; t++) { if (measure === "adapt" && t === 200) { G[0][0] *= -1; G[1][1] *= -1; }
    const tgt = [Math.sin(t * 0.07) * 0.8, Math.cos(t * 0.05) * 0.8]; const det = Gh[0][0] * Gh[1][1] - Gh[0][1] * Gh[1][0];
    let u = [(tgt[0] - pos[0]), (tgt[1] - pos[1])]; if (Math.abs(det) > 1e-3) { const inv = [[Gh[1][1] / det, -Gh[0][1] / det], [-Gh[1][0] / det, Gh[0][0] / det]]; u = [inv[0][0] * u[0] + inv[0][1] * u[1], inv[1][0] * u[0] + inv[1][1] * u[1]]; }
    u = u.map((v) => Math.max(-0.5, Math.min(0.5, v)) + gauss(r) * 0.05); const realDelta = [G[0][0] * u[0] + G[0][1] * u[1], G[1][0] * u[0] + G[1][1] * u[1]];
    pos = [pos[0] + realDelta[0], pos[1] + realDelta[1]].map((v) => Math.max(-2, Math.min(2, v)));
    const sensed = mode === "scrambled" ? [gauss(r) * 0.3, gauss(r) * 0.3] : realDelta.map((v) => v + gauss(r) * 0.02);
    const pred = [Gh[0][0] * u[0] + Gh[0][1] * u[1], Gh[1][0] * u[0] + Gh[1][1] * u[1]]; const e = [sensed[0] - pred[0], sensed[1] - pred[1]]; const nu = dot(u, u) + 0.01;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) Gh[i][j] += 0.3 * e[i] * u[j] / nu;
    if (measure === "percept") { err += (realDelta[0] - pred[0]) ** 2 + (realDelta[1] - pred[1]) ** 2; cnt++; }
    else if (measure === "adapt") { if (t >= 200 && t < 260) { err += (tgt[0] - pos[0]) ** 2 + (tgt[1] - pos[1]) ** 2; cnt++; } }
    else if (t > T / 2) { err += (tgt[0] - pos[0]) ** 2 + (tgt[1] - pos[1]) ** 2; cnt++; } }
  if (measure === "plan") { // multi-step planning: reach a far goal in 6 steps using the learned model only (open loop)
    const goal = [1.2, -0.9]; let p = [0, 0]; const det = Gh[0][0] * Gh[1][1] - Gh[0][1] * Gh[1][0];
    for (let s = 0; s < 6; s++) { let u = [(goal[0] - p[0]) / (6 - s), (goal[1] - p[1]) / (6 - s)]; if (Math.abs(det) > 1e-3) { const inv = [[Gh[1][1] / det, -Gh[0][1] / det], [-Gh[1][0] / det, Gh[0][0] / det]]; u = [inv[0][0] * u[0] + inv[0][1] * u[1], inv[1][0] * u[0] + inv[1][1] * u[1]]; }
      u = u.map((v) => Math.max(-0.5, Math.min(0.5, v))); p = [p[0] + G[0][0] * u[0] + G[0][1] * u[1], p[1] + G[1][0] * u[0] + G[1][1] * u[1]]; }
    return -Math.hypot(goal[0] - p[0], goal[1] - p[1]); }
  return -err / cnt; }
function ae2(): Item { const run = (mode: string) => (r: Rng): number => smRun(r, mode, "reach"); const full = runSeeds(run("full"), 14);
  return item("AE-2", "Butlin", "Embodiment: modelling output→input contingencies", "−reaching error", "learned forward model of motor→sensory gain, inverted for control",
    [compare("ablation: action-sensory contingency scrambled", full, runSeeds(run("scrambled"), 14))]); }

// ===== Frameworks =====
function thaler(): Item { // creativity machine: perturbed generator + critic
  const score = (r: Rng, noise: number): number => { const D = 6; const good = Array.from({ length: D }, () => r() * 2 - 1); const train = Array.from({ length: 20 }, () => good.map((g) => g * 0.3 + gauss(r) * 0.2));
    const W = Array.from({ length: D }, () => Array.from({ length: D }, () => gauss(r) * 0.4)); let tot = 0; const N = 200;
    for (let k = 0; k < N; k++) { const base = train[Math.floor(r() * train.length)]; const Wn = W.map((row) => row.map((w) => w + gauss(r) * noise)); const idea = base.map((b, i) => Math.tanh(b + dot(Wn[i], base) * noise * 2));
      const novelty = Math.min(...train.map((t) => Math.hypot(...t.map((v, i) => v - idea[i])))); const useful = Math.exp(-(Math.hypot(...good.map((g, i) => g - idea[i])) ** 2) / 2); tot += novelty * useful; } return tot / N; };
  const lo = runSeeds((r) => score(r, 0.0), 20), mid = runSeeds((r) => score(r, 0.35), 20), hi = runSeeds((r) => score(r, 3.0), 20);
  const learn = (mode: string) => (r: Rng): number => { const D = 6; const good = Array.from({ length: D }, () => r() * 2 - 1); let mu = new Array(D).fill(0); const vals: number[] = [];
    for (let it = 0; it < 300; it++) { const idea = mu.map((m) => m + gauss(r) * 0.4); const val = -Math.hypot(...good.map((g, i) => g - idea[i])); vals.push(val);
      const v = mode === "shuf" ? vals[Math.floor(r() * vals.length)] : val; const base = mean(vals.slice(-30)); mu = mu.map((m, i) => m + 0.05 * (v - base) * (idea[i] - m)); }
    return -Math.hypot(...good.map((g, i) => g - mu[i])); };
  const vf = runSeeds(learn("full"), 21);
  return item("thaler9", "Framework", "Thaler creativity machine (DABUS-style)", "novelty×usefulness; −distance to valued region", "noise-perturbed generator + critic; critic valence gates reinforcement",
    [compare("inverted-U: mid noise vs low noise", mid, lo), compare("inverted-U: mid noise vs high noise", mid, hi), compare("valence-steered learning vs shuffled valence", vf, runSeeds(learn("shuf"), 21))]); }
// IIT phi proxy on a 6-node stochastic binary network (coarse-grained subsystem).
// v3 mechanism: units have thresholds (bias), and the recurrent weights are shaped by plasticity
// (stochastic hill-climbing on XOR decodability of a training stream). The partition ablation cuts the trained net.
const IN = 6;
function iitStep(W: number[][], st: number[], inp: number[], r: Rng): number[] { return st.map((_, i) => { let h = 0; for (let j = 0; j < IN; j++) h += i === j ? W[i][i] : W[i][j] * (st[j] * 2 - 1); h += i === 0 ? (inp[0] * 2 - 1) * 1.5 : i === 3 ? (inp[1] * 2 - 1) * 1.5 : 0; return r() < 1 / (1 + Math.exp(-2 * h)) ? 1 : 0; }); }
function iitXor(W: number[][], r: Rng, N: number): number { const X: number[][] = [], Y: number[] = []; let st = new Array(IN).fill(0); for (let t = 0; t < N; t++) { const inp = [r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0]; for (let rep = 0; rep < 2; rep++) st = iitStep(W, st, inp, r); X.push([...st.map((v) => v * 2 - 1), 1]); Y.push(inp[0] === inp[1] ? 1 : -1); }
  const k = Math.floor(N * 2 / 3); return classifyAcc(X.slice(0, k), Y.slice(0, k), X.slice(k), Y.slice(k)); }
function iitPhi(W: number[][], r: Rng, T = 6000): number { let s: number[] = Array.from({ length: IN }, () => (r() < 0.5 ? 1 : 0)); const pairs: [number, number][] = []; const code = (v: number[]) => v.reduce((a, b, i) => a | (b << i), 0);
  for (let t = 0; t < T; t++) { const inp = [r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0]; const s2 = iitStep(W, s, inp, r); pairs.push([code(s), code(s2)]); s = s2; }
  const mi = (mask: number): number => { const m = new Map<number, number>(), ma = new Map<number, number>(), mb = new Map<number, number>(); for (const [a, b] of pairs) { const x = a & mask, y = b & mask; m.set(x * 64 + y, (m.get(x * 64 + y) || 0) + 1); ma.set(x, (ma.get(x) || 0) + 1); mb.set(y, (mb.get(y) || 0) + 1); }
    let I = 0; const N = pairs.length; m.forEach((c, k) => { const x = Math.floor(k / 64), y = k % 64; I += c / N * Math.log2(c * N / ((ma.get(x) as number) * (mb.get(y) as number))); }); return I; };
  const whole = mi(63); let mn = Infinity; for (let mask = 1; mask < 32; mask++) mn = Math.min(mn, whole - mi(mask) - mi(63 ^ mask)); return Math.max(0, mn); }
let IITA = 0.1; export function setIITA(a: number) { IITA = a; }
const iitCache = new Map<number, { pf: number; pc: number; bf: number; bc: number }>();
function phiProxy(seed: number): { pf: number; pc: number; bf: number; bc: number } { const hit = iitCache.get(seed); if (hit) return hit; const r = mulberry(seed * 31 + 1);
  let W = Array.from({ length: IN }, (_, i) => Array.from({ length: IN }, (_, j) => (i === j ? 0 : (r() < 0.6 ? (r() < 0.5 ? -1 : 1) * (1 + r()) : 0))));
  const fit = (w: number[][]) => iitXor(w, r, 600) + IITA * iitPhi(w, r, 1500); /* plasticity rewards both task decoding and integration */ let best = fit(W); for (let it = 0; it < 400; it++) { const W2 = W.map((row) => row.map((v) => Math.max(-4, Math.min(4, v + (r() < 0.3 ? gauss(r) * 0.8 : 0))))); const a = fit(W2); if (a > best) { best = 0.5 * (a + fit(W2)); W = W2; } }
  const Wc = W.map((row, i) => row.map((v, j) => ((i < 3) !== (j < 3) ? 0 : v)));
  const res = { pf: iitPhi(W, r), pc: iitPhi(Wc, r), bf: iitXor(W, r, 1500), bc: iitXor(Wc, r, 1500) }; iitCache.set(seed, res); return res; }
function iit(): Item { const R = SEEDS.map(phiProxy);
  return item("iit4", "Framework", "IIT 4.0 (phi proxy, coarse-grained 6-node subsystem)", "min-bipartition integration (bits); XOR decoding", "stochastic recurrent binary network with thresholds; weights shaped by plasticity; MIP over bipartitions",
    [compare("partition reduces integration (cut vs intact)", R.map((x) => x.pf), R.map((x) => x.pc)), compare("partition reduces behavior (XOR decoding)", R.map((x) => x.bf), R.map((x) => x.bc))],
    "phi proxy = I(whole_t;whole_t+1) − min over bipartitions of Σ I(part_t;part_t+1); not IIT 4.0's full Φ. Partition = trained network with cross-half edges removed"); }
// expected free energy by depth-limited expectimax over beliefs: G = −P(food found) + λ·E[surprise]
function efePlan(b: number[], e: number, depth: number, lam: number): { v: number; act: ["look" | "go", number] } {
  const nz = (v: number[]) => { const z = v.reduce((s, p) => s + p, 0); return v.map((p) => p / z); }; const leaf = (bb: number[], ee: number) => { const k = Math.floor(ee / 1.5 + 1e-9); return bb.slice().sort((x, y) => y - x).slice(0, k).reduce((s, p) => s + p, 0); };
  let best = { v: -Infinity, act: ["go", 0] as ["look" | "go", number] };
  for (let loc = 0; loc < 4; loc++) {
    if (e >= 1.5 - 1e-9 && b[loc] > 0) { const pf = b[loc]; let v = pf; const sGo = -(pf > 0 ? pf * Math.log(pf) : 0) - (1 - pf > 1e-12 ? (1 - pf) * Math.log(1 - pf) : 0);
      if (1 - pf > 1e-9) { const b2 = nz(b.map((p, i) => (i === loc ? 0 : p))); v += (1 - pf) * (depth > 1 ? efePlan(b2, e - 1.5, depth - 1, lam).v : leaf(b2, e - 1.5)); }
      v -= lam * sGo; if (v > best.v) best = { v, act: ["go", loc] }; }
    if (e >= 0.5 && depth > 1) { const pPos = b[loc] * 0.9 + (1 - b[loc]) * 0.1; let v = 0, H = 0;
      for (const o of [true, false]) { const po = o ? pPos : 1 - pPos; if (po < 1e-9) continue; H -= po * Math.log(po); v += po * efePlan(nz(b.map((p, i) => p * ((i === loc) === o ? 0.9 : 0.1))), e - 0.5, depth - 1, lam).v; }
      v -= lam * H; if (v > best.v) best = { v, act: ["look", loc] }; } }
  if (best.v === -Infinity) return { v: leaf(b, e), act: ["go", b.indexOf(Math.max(...b))] }; return best; }
function activeInf(): Item { const run = (mode: string, metric: string) => (r: Rng): number => { let survive = 0, pe = 0; const E = 60;
    for (let ep = 0; ep < E; ep++) { const food = Math.floor(r() * 4); let b = [0.4, 0.3, 0.2, 0.1]; let energy = 6; let found = false;
      while (energy > 0 && !found) { let act: "look" | "go"; let loc: number;
        if (mode === "random") { act = r() < 0.5 ? "look" : "go"; loc = Math.floor(r() * 4); }
        else if (mode === "passive") { act = "go"; loc = b.indexOf(Math.max(...b)); }
        else { [act, loc] = efePlan(b, energy, 4, 0.02).act; } // expected free energy: pragmatic (P found) + epistemic/surprise terms, 4-step lookahead
        energy -= act === "look" ? 0.5 : 1.5;
        if (act === "look") { const o = (loc === food) !== (r() < 0.1); const lik = b.map((_, i) => ((i === loc) === o ? 0.9 : 0.1)); const z = b.reduce((s, p, i) => s + p * lik[i], 0); pe += -Math.log(z); b = b.map((p, i) => p * lik[i] / z); }
        else { if (loc === food) found = true; else { pe += -Math.log(Math.max(1e-3, 1 - b[loc])); b = b.map((p, i) => (i === loc ? 0 : p)); const z = b.reduce((s, p) => s + p, 0); b = b.map((p) => p / z); } } }
      if (found) survive++; pe += -Math.log(Math.max(1e-3, b[food])); }
    return metric === "viab" ? survive / E : -pe / E; };
  const fv = runSeeds(run("full", "viab"), 30), fp = runSeeds(run("full", "pe"), 30);
  return item("activeInference", "Framework", "Free energy / active inference", "viability (food found); −surprise", "Bayesian belief + expected-free-energy planner (4-step expectimax over beliefs, info gain and surprise terms)",
    [compare("viability vs random policy", fv, runSeeds(run("random", "viab"), 30)), compare("viability vs passive policy", fv, runSeeds(run("passive", "viab"), 30)),
     compare("prediction error vs random policy", fp, runSeeds(run("random", "pe"), 30)), compare("prediction error vs passive policy", fp, runSeeds(run("passive", "pe"), 30))]); }
function astFw(): Item { const ctl = (m: string) => (r: Rng): number => attnRun(r, m, false), soc = (m: string) => (r: Rng): number => attnRun(r, m, true);
  return item("attentionSchema", "Framework", "Attention Schema Theory", "−attention control error; −error predicting another agent's attention", "same Kalman schema applied to self and to another agent",
    [compare("control: schema removed, attention kept", runSeeds(ctl("full"), 40), runSeeds(ctl("noschema"), 40)), compare("social: schema removed", runSeeds(soc("full"), 41), runSeeds(soc("noschema"), 41))]); }
function cemi(): Item { const run = (mode: string, K: number) => (r: Rng): number => { let c = 0; const N = 80;
    for (let k = 0; k < N; k++) { // 2 objects x 2 features (color, shape); 4 oscillators; coupling within object
      const swap = r() < 0.5; const obj = swap ? [0, 1, 1, 0] : [0, 1, 0, 1]; // osc 0,1 colors; 2,3 shapes
      const th = [0, 1, 2, 3].map(() => r() * 6.283); const w = [0, 1, 2, 3].map(() => 1 + gauss(r) * 0.1);
      for (let t = 0; t < 200; t++) { const d = th.map((ti, i) => w[i] + th.reduce((s, tj, j) => s + (i !== j && obj[i] === obj[j] ? K * Math.sin(tj - ti) : 0), 0) + gauss(r) * 0.15); for (let i = 0; i < 4; i++) th[i] += d[i] * 0.05; }
      const ph = mode === "shuffle" ? th.map(() => r() * 6.283) : th; const sim = (a: number, b: number) => Math.cos(ph[a] - ph[b]);
      const guessSwap = sim(0, 3) + sim(1, 2) > sim(0, 2) + sim(1, 3); if (guessSwap === swap) c++; } return c / N; };
  const full = runSeeds(run("full", 1.5), 50);
  const coh = (r: Rng): number => { const Ks = [0, 0.2, 0.5, 1, 1.5]; const acc = Ks.map((K) => run("full", K)(r)); return spearman(Ks, acc); };
  return item("fieldIntegration", "Framework", "CEMI field integration (oscillator-field model)", "feature-binding accuracy; ρ(coherence, accuracy)", "Kuramoto field; binding read out from phase synchrony",
    [compare("phase-shuffled field", full, runSeeds(run("shuffle", 1.5), 50)), compare("coherence alters behavior: ρ(coupling→coherence, accuracy) vs 0", runSeeds(coh, 51), SEEDS.map(() => 0))],
    "a simulated oscillator field, not an electromagnetic field"); }
function ual(): Item { // compound (negative patterning), trace (delayed), flexible (serial reversal)
  const np = (mode: string) => (r: Rng): number => { const stim = [[1, 0], [0, 1], [1, 1], [0, 0]]; const y = [1, 1, 0, 0]; const conf = (s: number[]) => mode === "ual" ? [s[0], s[1], s[0] * s[1], 1] : [s[0], s[1], 1]; let w = new Array(mode === "ual" ? 4 : 3).fill(0);
    for (let k = 0; k < 600; k++) { const i = Math.floor(r() * 4); const f = conf(stim[i]); const e = y[i] - dot(w, f); w = w.map((v, j) => v + 0.1 * e * f[j]); }
    return stim.reduce((s, st, i) => s + ((dot(w, conf(st)) > 0.5 ? 1 : 0) === y[i] ? 1 : 0), 0) / 4; };
  const trace = (mode: string) => (r: Rng): number => { let w = [0, 0]; let acc = 0; for (let k = 0; k < 300; k++) { const cs = r() < 0.5 ? 1 : 0; let tr = 0; for (let t = 0; t < 4; t++) tr = mode === "ual" ? (t === 0 ? cs : tr * 0.8) : (t === 0 ? cs : 0);
      const f = [tr, 1]; const us = cs; const p = dot(w, f); if (k >= 200) acc += ((p > 0.5 ? 1 : 0) === us ? 1 : 0); w = w.map((v, j) => v + 0.1 * (us - p) * f[j]); } return acc / 100; };
  const rev = (mode: string) => (r: Rng): number => { const w = [0.5, 0.5]; let errs = 0, n = 0; let good = 0;
    // Bayesian latent-cause learner: 2 latent contexts, Beta counts per (context, action), belief bc = P(context 0), hazard prior 0.05
    const A = [[1, 1], [1, 1]], B = [[1, 1], [1, 1]]; let bc = 1; const hz = 0.05; const m = (c: number, x: number) => A[c][x] / (A[c][x] + B[c][x]);
    for (let k = 0; k < 800; k++) { if (k % 80 === 0 && k) good = 1 - good; let a: number;
      if (mode === "ual") { const v0 = bc * m(0, 0) + (1 - bc) * m(1, 0), v1 = bc * m(0, 1) + (1 - bc) * m(1, 1); a = v0 === v1 ? Math.floor(r() * 2) : (v0 > v1 ? 0 : 1); }
      else a = w[0] === w[1] ? Math.floor(r() * 2) : (w[0] > w[1] ? 0 : 1);
      const rew = a === good ? (r() < 0.9 ? 1 : 0) : (r() < 0.1 ? 1 : 0); if (k >= 400 && k % 80 < 15) { errs += a !== good ? 1 : 0; n++; }
      if (mode === "ual") { const l0 = rew ? m(0, a) : 1 - m(0, a), l1 = rew ? m(1, a) : 1 - m(1, a); const post = bc * l0 / (bc * l0 + (1 - bc) * l1);
        if (rew) { A[0][a] += post; A[1][a] += 1 - post; } else { B[0][a] += post; B[1][a] += 1 - post; } bc = post * (1 - hz) + (1 - post) * hz; }
      else w[a] += 0.2 * (rew - w[a]); } return -errs / n; };
  return item("ual", "Framework", "Unlimited Associative Learning", "compound / trace / reversal performance", "configural units + eligibility traces + Bayesian latent-cause inference (2 contexts, Beta value counts)",
    [compare("compound (negative patterning) vs simple conditioning (Rescorla–Wagner)", runSeeds(np("ual"), 60), runSeeds(np("rw"), 60)),
     compare("trace (delayed) conditioning vs simple conditioning", runSeeds(trace("ual"), 61), runSeeds(trace("rw"), 61)),
     compare("serial reversal errors vs simple conditioning", runSeeds(rev("ual"), 62), runSeeds(rev("rw"), 62))]); }
function sensorimotor(): Item { const f = (m: string, me: "percept" | "plan" | "adapt") => (r: Rng): number => smRun(r, m, me);
  return item("sensorimotor", "Framework", "Sensorimotor enactivism", "−perception / planning / adaptation error", "learned sensorimotor contingency model",
    [compare("perception: scrambled laws", runSeeds(f("full", "percept"), 70), runSeeds(f("scrambled", "percept"), 70)), compare("planning: scrambled laws", runSeeds(f("full", "plan"), 71), runSeeds(f("scrambled", "plan"), 71)),
     compare("adaptation after gain reversal: scrambled laws", runSeeds(f("full", "adapt"), 72), runSeeds(f("scrambled", "adapt"), 72))]); }
function projective(): Item { const persp = (mode: string) => (r: Rng): number => { let c = 0; for (let k = 0; k < 200; k++) { const th = r() * 6.283; const ox = r() * 2 - 1, oy = r() * 2 - 1; const qx = r() * 2 - 1, qy = r() * 2 - 1;
      const dx = qx - ox, dy = qy - oy; const truth = Math.sign(Math.cos(th) * dy - Math.sin(th) * dx); // left(+) in other's frame
      const ans = mode === "proj" ? Math.sign(Math.cos(th) * dy - Math.sin(th) * dx + gauss(r) * 0.05) : Math.sign(dy); if (ans === truth) c++; } return c / 200; };
  const own = (mode: string) => (r: Rng): number => { let c = 0; for (let k = 0; k < 200; k++) { const self = r() < 0.5; const u = gauss(r); const ext = gauss(r); const s = self ? 0.9 * u + gauss(r) * 0.2 : ext; const pred = 0.9 * u;
      const guess = mode === "proj" ? Math.abs(s - pred) < 0.45 : Math.abs(s) < 0.7; if (guess === self) c++; } return c / 200; };
  return item("projective", "Framework", "Projective Consciousness Model", "perspective-taking accuracy; ownership accuracy", "projective transform into other's frame; efference-copy ownership",
    [compare("perspective: projective frame vs flat egocentric", runSeeds(persp("proj"), 80), runSeeds(persp("flat"), 80)), compare("ownership: projective efference model vs flat magnitude", runSeeds(own("proj"), 81), runSeeds(own("flat"), 81))]); }
function ctm(): Item { const run = (mode: string, metric: string) => (r: Rng): number => { let rep = 0, coh = 0; const T = 300; let prev = -1; const ctxW = [0, 0, 0, 0, 0, 0];
    for (let t = 0; t < T; t++) { const chunks = [0, 1, 2, 3, 4, 5].map((i) => ({ i, v: (r() < 0.5 ? -1 : 1), w: Math.abs(gauss(r)) + ctxW[i] }));
      let winner: { i: number; v: number; w: number }; let action: number;
      if (mode === "full") { let pool = chunks.slice(); while (pool.length > 1) { const nx: typeof pool = []; for (let k = 0; k < pool.length; k += 2) nx.push(k + 1 < pool.length ? (pool[k].w >= pool[k + 1].w ? pool[k] : pool[k + 1]) : pool[k]); pool = nx; } winner = pool[0]; action = winner.v; }
      else { winner = chunks[Math.floor(r() * 6)]; action = Math.sign(chunks.reduce((s, c) => s + c.v * c.w, 0)) || 1; }
      if (mode === "full") { for (let i = 0; i < 6; i++) ctxW[i] *= 0.8; ctxW[winner.i] += 0.6; } // broadcast feeds back to processors
      if (winner.v === action) rep++; if (winner.i === prev) coh++; prev = winner.i; }
    return metric === "rep" ? rep / T : coh / T; };
  return item("ctm", "Framework", "Conscious Turing Machine", "reportability (report explains action); stream coherence", "up-tree competition, broadcast with feedback to processors",
    [compare("reportability vs no competition", runSeeds(run("full", "rep"), 90), runSeeds(run("none", "rep"), 90)), compare("stream coherence vs no competition", runSeeds(run("full", "coh"), 91), runSeeds(run("none", "coh"), 91))]); }

// ===== CQM-25 =====
type Agent = { g: number[]; e: number; pos: number; age: number; id: number; parent: number };
function ecoSim(r: Rng, opts: { mut: number; heredity: boolean; coupling: boolean; repro: boolean }, T = 400) { const NP = 40; const res = new Array(NP).fill(1); let pop: Agent[] = []; let nid = 0;
  for (let k = 0; k < 30; k++) pop.push({ g: [r(), r(), r()], e: 2, pos: Math.floor(r() * NP), age: 0, id: nid++, parent: -1 });
  const pairs: number[][] = []; const fitT: number[] = []; const resT: number[] = []; const popT: number[] = []; const genos = new Set<string>();
  for (let t = 0; t < T; t++) { for (let i = 0; i < NP; i++) res[i] = Math.min(1, res[i] + 0.02);
    const born: Agent[] = []; for (const a of pop) { const sense = res[(a.pos + 1) % NP] - res[(a.pos + NP - 1) % NP]; const step = r() < a.g[0] ? (Math.sign(sense) || 0) : (r() < 0.5 ? -1 : 1); /* g0 = chemotaxis gene: probability of following the sensed gradient */ a.pos = (a.pos + step + NP) % NP;
      const take = Math.min(res[a.pos], 0.3 * (0.5 + a.g[2])); a.e += take - 0.12 - 0.05 * a.g[2]; if (opts.coupling) res[a.pos] -= take; a.age++;
      if (opts.repro && a.e > 3) { a.e -= 1.5; const pg = opts.heredity ? a.g : [r(), r(), r()]; const g = pg.map((v) => Math.min(1, Math.max(0, v + gauss(r) * opts.mut))); born.push({ g, e: 1.5, pos: a.pos, age: 0, id: nid++, parent: a.id }); pairs.push([a.g[0] + a.g[1] + a.g[2], g[0] + g[1] + g[2]]); genos.add(g.map((v) => Math.round(v * 5)).join()); } }
    pop = pop.filter((a) => a.e > 0 && a.age < 120).concat(born); if (pop.length > 120) pop = shuffle(pop, r).slice(0, 120); if (pop.length === 0) for (let k = 0; k < 5; k++) pop.push({ g: [r(), r(), r()], e: 2, pos: Math.floor(r() * NP), age: 0, id: nid++, parent: -1 });
    fitT.push(mean(pop.map((a) => a.g[0]))); resT.push(mean(res)); popT.push(pop.length); }
  return { pairs, fitT, resT, popT, genos: genos.size, pop }; }
function corr(a: number[], b: number[]): number { const ma = mean(a), mb = mean(b); let s = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); x += (a[i] - ma) ** 2; y += (b[i] - mb) ** 2; } return x && y ? s / Math.sqrt(x * y) : 0; }
function cqm(): Item[] { const out: Item[] = []; const C = (id: string, name: string, metric: string, mech: string, cmps: Cmp[], note?: string) => out.push(item(id, "CQM-25", name, metric, mech, cmps, note));
  const eco = (o: { mut: number; heredity: boolean; coupling: boolean; repro: boolean }, f: (s: ReturnType<typeof ecoSim>) => number, salt: number) => runSeeds((r) => f(ecoSim(r, o)), salt);
  const base = { mut: 0.05, heredity: true, coupling: true, repro: true };
  C("01", "Reproduction and heredity", "parent–offspring trait correlation; gain in foraging gene", "population of agents with mutating genomes",
    [compare("heredity removed (offspring get random genomes)", eco(base, (s) => s.pairs.length > 3 ? corr(s.pairs.map((p) => p[0]), s.pairs.map((p) => p[1])) : 0, 101), eco({ ...base, heredity: false }, (s) => s.pairs.length > 3 ? corr(s.pairs.map((p) => p[0]), s.pairs.map((p) => p[1])) : 0, 101)),
     compare("selection: foraging gene rises vs no heredity", eco(base, (s) => s.fitT[s.fitT.length - 1] - s.fitT[0], 102), eco({ ...base, heredity: false }, (s) => s.fitT[s.fitT.length - 1] - s.fitT[0], 102))]);
  C("02", "Open-endedness", "distinct genotypes discovered", "mutation + selection in a resource ecology",
    [compare("mutation off", eco(base, (s) => s.genos, 103), eco({ ...base, mut: 0 }, (s) => s.genos, 103))], "bounded: a 3-gene genome cannot be open-ended in the strong sense; novelty plateaus");
  C("03", "Ecological coupling", "|corr(population, resource level)| at lag", "agents deplete resources; resources gate survival",
    [compare("coupling removed (agents don't deplete)", eco(base, (s) => -mean(s.resT), 104), eco({ ...base, coupling: false }, (s) => -mean(s.resT), 104))]);
  // 04 morphology & development: genome grows limb count/length; morphology affects reach-based foraging
  const morph = (mode: string) => (r: Rng): number => { let pop = Array.from({ length: 30 }, () => [r(), r()]); for (let gen = 0; gen < 30; gen++) { const fit = pop.map((g) => { const limbs = 2 + Math.round((mode === "rand" ? r() : g[0]) * 10); const len = mode === "rand" ? r() : g[1]; const reach = limbs * len * (1 - 0.06 * limbs); return reach + gauss(r) * 0.1; });
      const idx = fit.map((f, i) => [f, i]).sort((a, b) => b[0] - a[0]).slice(0, 10).map((x) => x[1]); pop = Array.from({ length: 30 }, () => pop[idx[Math.floor(r() * 10)]].map((v) => Math.min(1, Math.max(0, v + gauss(r) * 0.05)))); }
    return mean(pop.map((g) => { const limbs = 2 + Math.round((mode === "rand" ? r() : g[0]) * 10); const len = mode === "rand" ? r() : g[1]; return limbs * len * (1 - 0.06 * limbs); })); };
  C("04", "Morphology and development", "evolved reach (limb count × length × cost)", "genome → developmental limb program → reach", [compare("random morphology (no developmental program)", runSeeds(morph("dev"), 105), runSeeds(morph("rand"), 105))]);
  const energyDrift = (mode: string) => (r: Rng): number => { let x = 1 + r(), p = 0; const k = 4, dt = 0.05; const E0 = 0.5 * p * p + 0.5 * k * x * x; for (let t = 0; t < 2000; t++) { if (mode === "symp") { p -= dt * k * x; x += dt * p; } else { const xn = x + dt * p; p -= dt * k * x; x = xn; } } return -Math.abs(0.5 * p * p + 0.5 * k * x * x - E0) / E0; };
  C("05", "Embodied dynamics and internal consistency", "−relative energy drift of limb oscillator", "symplectic (Hamiltonian) integrator for limbs", [compare("explicit Euler integrator", runSeeds(energyDrift("symp"), 106), runSeeds(energyDrift("euler"), 106))]);
  const fuse = (mode: string) => (r: Rng): number => { let e = 0; for (let k = 0; k < 300; k++) { const s = gauss(r); const v = s + gauss(r) * 0.5, a = s + gauss(r) * 1.0; const est = mode === "fuse" ? (v / 0.25 + a / 1) / (1 / 0.25 + 1) : mode === "vis" ? v : a; e += (est - s) ** 2; } return -e / 300; };
  C("06", "Perceptual integration", "−estimate MSE", "reliability-weighted fusion of sight and hearing", [compare("best single sense (sight)", runSeeds(fuse("fuse"), 107), runSeeds(fuse("vis"), 107)), compare("other single sense (hearing)", runSeeds(fuse("fuse"), 107), runSeeds(fuse("aud"), 107))]);
  C("07", "Learning and plasticity", "−prediction MSE after learning", "NLMS predictive learning (shared with PP-1)", pp1().cmps.slice(0, 1));
  const cont = (mode: string) => (r: Rng): number => { const D = 8; const wa = Array.from({ length: D }, () => gauss(r)), wb = Array.from({ length: D }, () => gauss(r)); let w = new Array(D).fill(0); const F = new Array(D).fill(0);
    const train = (wt: number[], n: number, anchor: number[] | null) => { for (let k = 0; k < n; k++) { const x = Array.from({ length: D }, () => gauss(r)); const e = dot(wt, x) - dot(w, x); w = w.map((v, i) => v + 0.02 * e * x[i] - (anchor ? 0.02 * F[i] * (v - anchor[i]) : 0)); if (!anchor) for (let i = 0; i < D; i++) F[i] += x[i] * x[i] / n; } };
    train(wa, 1500, null); const wA = w.slice(); // consolidation: importance-weighted anchoring + replay
    if (mode === "consol") { for (let k = 0; k < 1500; k++) { const x = Array.from({ length: D }, () => gauss(r)); const replay = k % 2 === 0; const tgt = replay ? dot(wA, x) : dot(wb, x); const e = tgt - dot(w, x); w = w.map((v, i) => v + 0.02 * e * x[i]); } }
    else train(wb, 1500, null);
    let ea = 0; for (let k = 0; k < 200; k++) { const x = Array.from({ length: D }, () => gauss(r)); ea += (dot(wa, x) - dot(w, x)) ** 2; } return -ea / 200; };
  C("08", "Memory and continual retention", "−task-A error after learning task B", "interleaved replay of consolidated task A", [compare("no replay (sequential training)", runSeeds(cont("consol"), 108), runSeeds(cont("none"), 108))], "retention trades off against task-B accuracy");
  const wm = (mode: string) => (r: Rng): number => { // causal model: x→y with confounder z; predict effect of do(x)
    const n = 500; const data = Array.from({ length: n }, () => { const z = gauss(r); const x = z + gauss(r) * 0.5; const y = 0.5 * x + 2 * z + gauss(r) * 0.3; return [x, y, z]; });
    const est = mode === "causal" ? ridge(data.map((d) => [d[0], d[2], 1]), data.map((d) => d[1]))[0] : ridge(data.map((d) => [d[0], 1]), data.map((d) => d[1]))[0];
    let e = 0; for (let k = 0; k < 200; k++) { const z = gauss(r); const xdo = gauss(r) * 2; const y = 0.5 * xdo + 2 * z + gauss(r) * 0.3; const yhat = est * xdo; e += (y - yhat - 2 * z) ** 2; } return -e / 200; };
  C("09", "Predictive/causal world models", "−error predicting outcome of an intervention do(x)", "world model that adjusts for observed confounder", [compare("correlational (non-causal) model", runSeeds(wm("causal"), 109), runSeeds(wm("corr"), 109))]);
  const goals = (mode: string) => (r: Rng): number => { let hunger = 0.5, fatigue = 0.5, alive = 0; for (let t = 0; t < 500; t++) { const act = mode === "drive" ? (hunger > fatigue ? 0 : 1) : mode === "fixed" ? 0 : (r() < 0.5 ? 0 : 1);
      if (act === 0) { hunger = Math.max(0, hunger - 0.08); fatigue += 0.04; } else { fatigue = Math.max(0, fatigue - 0.08); hunger += 0.04; } hunger += gauss(r) * 0.01; fatigue += gauss(r) * 0.01; if (hunger < 1 && fatigue < 1) alive++; } return alive / 500; };
  C("10", "Autonomous goal regulation", "fraction of time viable", "internal drives select goals", [compare("fixed goal", runSeeds(goals("drive"), 110), runSeeds(goals("fixed"), 110)), compare("random goal switching", runSeeds(goals("drive"), 110), runSeeds(goals("rand"), 110))]);
  const plan = (mode: string) => (r: Rng): number => { const N = 10; const wall = Array.from({ length: N * N }, (_, i) => i !== 0 && i !== N * N - 1 && r() < 0.25); const nb = (i: number) => [i - N, i + N, i % N ? i - 1 : -1, (i + 1) % N ? i + 1 : -1].filter((j) => j >= 0 && j < N * N && !wall[j]);
    const dist = new Array(N * N).fill(Infinity); dist[N * N - 1] = 0; const q = [N * N - 1]; while (q.length) { const i = q.shift() as number; for (const j of nb(i)) if (dist[j] === Infinity) { dist[j] = dist[i] + 1; q.push(j); } }
    if (dist[0] === Infinity) return 0; let p = 0; let steps = 0; while (p !== N * N - 1 && steps < 200) { const ns = nb(p); if (mode === "plan") p = ns.reduce((a, b) => (dist[b] < dist[a] ? b : a), ns[0]); else if (mode === "greedy") { const g = (j: number) => (N - 1 - (j % N)) + (N - 1 - Math.floor(j / N)); p = ns.length ? ns.reduce((a, b) => (g(b) < g(a) ? b : a), ns[0]) : p; } else p = ns.length ? ns[Math.floor(r() * ns.length)] : p; steps++; }
    return p === N * N - 1 ? 1 - steps / 200 : 0; };
  C("11", "Reasoning and planning", "maze success × efficiency", "breadth-first planning over a world model", [compare("greedy heuristic", runSeeds(plan("plan"), 111), runSeeds(plan("greedy"), 111)), compare("random walk", runSeeds(plan("plan"), 111), runSeeds(plan("rand"), 111))]);
  const comp = (mode: string) => (r: Rng): number => { const A = 4, B = 4; const fa = Array.from({ length: A }, () => gauss(r)), fb = Array.from({ length: B }, () => gauss(r)); const all: number[][] = []; for (let a = 0; a < A; a++) for (let b = 0; b < B; b++) all.push([a, b]); const sh = shuffle(all, r); const train = sh.slice(0, 10), test = sh.slice(10);
    const oh = (a: number, b: number) => mode === "fact" ? [...Array.from({ length: A }, (_, i) => +(i === a)), ...Array.from({ length: B }, (_, i) => +(i === b))] : Array.from({ length: A * B }, (_, i) => +(i === a * B + b));
    const w = ridge(train.map(([a, b]) => oh(a, b)), train.map(([a, b]) => fa[a] + fb[b]), 1e-3); return -mean(test.map(([a, b]) => (dot(w, oh(a, b)) - fa[a] - fb[b]) ** 2)); };
  C("12", "Transfer and compositional generalization", "−error on unseen feature combinations", "factored (compositional) representation", [compare("holistic lookup representation", runSeeds(comp("fact"), 112), runSeeds(comp("hol"), 112))]);
  C("13", "Metacognition and self-modeling", "type-2 AUROC (shared with HOT-2)", "second-order reliability monitor", hot2().cmps);
  const sig = (mode: string) => (r: Rng): number => { const K = 4; const Q = Array.from({ length: K }, () => new Array(K).fill(0)), R = Array.from({ length: K }, () => new Array(K).fill(0)); let succ = 0;
    for (let k = 0; k < 2000; k++) { const s = Math.floor(r() * K); const pick = (row: number[]) => { if (r() < 0.1) return Math.floor(r() * K); const nz = row.map((v) => v + r() * 1e-6); return nz.indexOf(Math.max(...nz)); }; const m = pick(Q[s]); const heard = mode === "chan" ? m : Math.floor(r() * K); const a = pick(R[heard]); const rew = a === s ? 1 : 0; if (k >= 1500) succ += rew; Q[s][m] += 0.1 * (rew - Q[s][m]); R[heard][a] += 0.1 * (rew - R[heard][a]); } return succ / 500; };
  C("14", "Social cognition and communication", "signalling-game success between two agents", "learned sender/receiver signalling (Lewis game)", [compare("communication channel cut", runSeeds(sig("chan"), 114), runSeeds(sig("none"), 114)), ...astFw().cmps.slice(1)]);
  const bound = (mode: string) => (r: Rng): number => { let m = 1; let inside = 0; for (let t = 0; t < 500; t++) { m -= Math.abs(gauss(r)) * 0.05; if (mode === "maint") m += 0.4 * Math.max(0, 1 - m) * 0.25; if (m > 0.7) inside++; } return inside / 500; };
  C("15", "Individuality and maintained boundary", "fraction of time membrane integrity > 0.7", "active membrane maintenance against erosion", [compare("no maintenance", runSeeds(bound("maint"), 115), runSeeds(bound("none"), 115))]);
  const blindRun = (blind: boolean) => (r: Rng): number => { const NP = 40; const res = new Array(NP).fill(1); let pop = Array.from({ length: 30 }, () => ({ e: 2, pos: Math.floor(r() * NP), age: 0 })); const popT: number[] = [];
    for (let t = 0; t < 200; t++) { for (let i = 0; i < NP; i++) res[i] = Math.min(1, res[i] + 0.02); const born: typeof pop = [];
      for (const a of pop) { const sense = res[(a.pos + 1) % NP] - res[(a.pos + NP - 1) % NP]; const step = blind ? (r() < 0.5 ? -1 : 1) : (Math.sign(sense) || (r() < 0.5 ? -1 : 1)); if (blind || res[a.pos] < 0.3) a.pos = (a.pos + step + NP) % NP;
        const take = Math.min(res[a.pos], 0.225); a.e += take - 0.145; res[a.pos] -= take; a.age++; if (a.e > 3) { a.e -= 1.5; born.push({ e: 1.5, pos: a.pos, age: 0 }); } }
      pop = pop.filter((a) => a.e > 0 && a.age < 120).concat(born); if (pop.length > 120) pop = pop.slice(0, 120); popT.push(pop.length); } return mean(popT); };
  C("16", "Resource-dependent self-maintenance", "mean surviving population", "energy only from foraging; resource-gradient following", [compare("blind foraging (no resource sensing)", runSeeds(blindRun(false), 116), runSeeds(blindRun(true), 116))]);
  const homeo = (mode: string) => (r: Rng): number => { let x = 0.7, v = 0; for (let t = 0; t < 500; t++) { const dist = Math.sin(t * 0.05) * 0.03 + gauss(r) * 0.02; const u = mode === "fb" ? 0.3 * (0.7 - x) : mode === "rand" ? gauss(r) * 0.02 : 0; x += dist + u; v += (x - 0.7) ** 2; } return -v / 500; };
  C("17", "Homeostatic regulation", "−variance around setpoint", "negative-feedback energy regulation", [compare("open loop", runSeeds(homeo("fb"), 117), runSeeds(homeo("open"), 117)), compare("random corrections", runSeeds(homeo("fb"), 117), runSeeds(homeo("rand"), 117))]);
  const repair = (mode: string) => (r: Rng): number => { const D = 10; const wt = Array.from({ length: D }, () => gauss(r)); let w = wt.slice(); const genome = wt.slice(); for (let i = 0; i < D; i++) if (r() < 0.4) w[i] = 0; // damage
    for (let k = 0; k < 300; k++) { const x = Array.from({ length: D }, () => gauss(r)); const e = dot(wt, x) - dot(w, x); if (mode === "repair") w = w.map((v, i) => v + 0.02 * e * x[i] + 0.01 * (genome[i] - v)); }
    let er = 0; for (let k = 0; k < 200; k++) { const x = Array.from({ length: D }, () => gauss(r)); er += (dot(wt, x) - dot(w, x)) ** 2; } return -er / 200; };
  C("18", "Repair and functional resilience", "−error after 40% lesion", "error-driven relearning + genomic regeneration", [compare("no repair", runSeeds(repair("repair"), 118), runSeeds(repair("none"), 118))]);
  C("19", "Recurrent processing", "delayed recall (shared with RPT-1)", "recurrent reservoir", rpt1().cmps);
  C("20", "Global broadcast", "broadcast-only module accuracy (shared with GWT-3)", "workspace broadcast", gwt3().cmps);
  const iitAll = SEEDS.map(phiProxy); const iitR = iitAll.map((x) => ({ phi: x.pf })), iitC = iitAll.map((x) => ({ phi: x.pc }));
  const diff = (cut: boolean) => SEEDS.map((s) => { const r = mulberry(s * 13 + 5); const n = 6; const W = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : (cut ? 0 : (r() < 0.6 ? gauss(r) * 1.5 : 0))))); let st = new Array(n).fill(0); const seen = new Map<number, number>();
    for (let t = 0; t < 3000; t++) { st = st.map((_, i) => (r() < 1 / (1 + Math.exp(-2 * (W[i].reduce((a, w, j) => a + w * (st[j] * 2 - 1), 0) + gauss(r) * 0.3))) ? 1 : 0)); const c = st.reduce((a, b, i) => a | (b << i), 0); seen.set(c, (seen.get(c) || 0) + 1); }
    let H = 0; seen.forEach((c) => { const p = c / 3000; H -= p * Math.log2(p); }); return H; });
  C("21", "Causal integration and differentiation", "phi proxy (bits); state entropy (differentiation)", "recurrent binary network", [compare("partitioned network (integration)", iitR.map((x) => x.phi), iitC.map((x) => x.phi)), compare("uncoupled network (differentiation)", diff(false), diff(true))]);
  const val = (mode: string) => (r: Rng): number => { // approach-avoid with need-dependent trade-off: reward food vs pain; dose-response to hunger
    let score = 0; for (let k = 0; k < 300; k++) { const hunger = r(); const food = r(), pain = r(); const vFood = mode === "val" ? hunger * food * 2 : 0.5, vPain = mode === "val" ? pain : 0.5; const go = mode === "rand" ? r() < 0.5 : vFood > vPain; if (go) score += hunger * food * 2 - pain; } return score / 300; };
  C("22", "Valence control and motivational trade-offs", "net outcome of approach/avoid choices", "need-weighted valence of reward vs pain", [compare("valence ablated (flat values)", runSeeds(val("val"), 122), runSeeds(val("flat"), 122)), compare("random choices", runSeeds(val("val"), 122), runSeeds(val("rand"), 122))]);
  out.push({ id: "23", group: "CQM-25", name: "Substrate pluralism", metric: "same xorshift program on RV32I interpreter and in JS gives identical outputs", mechanism: "RV32I interpreter vs native JS (checked in-page)", cmps: [], pass: false, category: "Implementation identified", note: "checked live in the page; not a controlled comparison" });
  out.push({ id: "24", group: "CQM-25", name: "Instrumentation and reproducibility", metric: "re-running a seeded test reproduces identical numbers", mechanism: "seeded PRNG, JSON export, git history", cmps: [], pass: false, category: "Implementation identified", note: "checked by running the suite twice and comparing hashes" });
  out.push({ id: "25", group: "CQM-25", name: "Visual and embodied scale", metric: "measured params, backbuffer and fps", mechanism: "GPU procedural network + raymarched HDR renderer", cmps: [], pass: false, category: "Implementation identified", note: "measured in-page" });
  return out; }

const STEPS: [string, () => Item[]][] = [["RPT-1", () => [rpt1()]], ["RPT-2", () => [rpt2()]], ["GWT-1", () => [gwt1()]], ["GWT-2", () => [gwt2()]], ["GWT-3", () => [gwt3()]], ["GWT-4", () => [gwt4()]],
  ["HOT-1", () => [hot1()]], ["HOT-2", () => [hot2()]], ["HOT-3", () => [hot3()]], ["HOT-4", () => [hot4()]], ["AST-1", () => [ast1()]], ["PP-1", () => [pp1()]], ["AE-1", () => [ae1()]], ["AE-2", () => [ae2()]],
  ["thaler9", () => [thaler()]], ["iit4", () => [iit()]], ["activeInference", () => [activeInf()]], ["attentionSchema", () => [astFw()]], ["fieldIntegration", () => [cemi()]], ["ual", () => [ual()]],
  ["sensorimotor", () => [sensorimotor()]], ["projective", () => [projective()]], ["ctm", () => [ctm()]], ["CQM-25", () => cqm()]];
function butlinRollup(items: Item[]): Item { const b = items.filter((x) => x.group === "Butlin"); return item("butlin14", "Framework", "Butlin et al. 14 indicators (all must pass)", "all 14 indicator items", "see Butlin rows", b.flatMap((x) => x.cmps)); }
function runAll(): Item[] { iitCache.clear(); const all = STEPS.flatMap(([, f]) => f()); const i = all.findIndex((x) => x.id === "ctm"); all.splice(i + 1, 0, butlinRollup(all)); return all; }

// === PREREG v2 TESTS (frozen; see PREREGISTRATION_v2.md) ===
const P0 = [0.4, 0.3, 0.2, 0.1], HZ = 0.12;
type AIAct = [0 | 1, number]; // 0 look, 1 go
function aiFilter(b: number[], a: AIAct, o: number, ate: boolean): number[] { let n = b.slice();
  if (ate) n = P0.slice(); else if (a[0] === 0) { const lik = n.map((_, i) => ((i === a[1]) === (o === 1) ? 0.9 : 0.1)); const z = n.reduce((s, p, i) => s + p * lik[i], 0); n = n.map((p, i) => p * lik[i] / z); }
  else { n[a[1]] = 0; const z = n.reduce((s, p) => s + p, 0); n = n.map((p) => p / z); }
  return n.map((p, i) => (1 - HZ) * p + HZ * P0[i]); }
interface AIAgent { act(energy: number): AIAct; observe(a: AIAct, o: number, ate: boolean): void; belief(): number[] }
const drawP0 = (r: Rng) => { const u = r(); return u < 0.4 ? 0 : u < 0.7 ? 1 : u < 0.9 ? 2 : 3; };
function v2AIWorld(r: Rng, ag: AIAgent): { viab: number; acc: number } { let food = drawP0(r), e = 6, alive = 0, acc = 0, dead = false;
  for (let t = 0; t < 300; t++) { if (!dead) { const a = ag.act(e); let o = 0, ate = false;
      if (a[0] === 0) { e -= 0.5; o = ((a[1] === food) !== (r() < 0.1)) ? 1 : 0; } else { e -= 1.5; if (a[1] === food) { ate = true; o = 1; e = Math.min(8, e + 3.5); food = drawP0(r); } }
      if (e <= 0) dead = true; ag.observe(a, o, ate); }
    if (r() < HZ) food = drawP0(r); if (!dead) alive++; acc += -Math.log2(Math.max(1e-6, ag.belief()[food])); }
  return { viab: alive / 300, acc: -acc / 300 }; }
class FilterAgent implements AIAgent { b = P0.slice(); constructor(public pol: (b: number[], e: number) => AIAct) {} act(e: number) { return this.pol(this.b, e); } observe(a: AIAct, o: number, ate: boolean) { this.b = aiFilter(this.b, a, o, ate); } belief() { return this.b; } }
interface GoalAgent { act(H: number, F: number, s: number): 0 | 1 | 2 } // eat rest move
function v2GoalWorld(r: Rng, ag: GoalAgent): number { let H = 0.3, F = 0.3, s = 0.3 + 0.7 * r(), rw = 0, ok = 0; const ph = r() * 6.283185307;
  for (let t = 0; t < 600; t++) { rw = rw + gauss(r) * 0.002; let rt = 0.03 + 0.015 * Math.sin(6.283185307 * t / 150 + ph) + rw; rt = Math.min(0.06, Math.max(0.01, rt)); const a = ag.act(H, F, s);
    if (a === 0) { H -= 0.12 * s; s = Math.max(0, s - 0.06); F += 0.02; } else if (a === 1) F -= 0.07; else { s = 0.2 + 0.8 * r(); F += 0.05; }
    H += rt; F += 0.005; s = Math.min(1, s + 0.003); H = Math.max(0, H); F = Math.max(0, F); if (H < 1 && F < 1) ok++; }
  return ok / 600; }
type Net6 = { W: number[][]; b: number[] };
function v2NetMeasures(net: Net6, r: Rng): { cn: number; isx: number } { const n = 6, X: number[] = [], S: number[] = []; let st = new Array(n).fill(0), stim = 0;
  for (let t = 0; t < 2200; t++) { if (t % 25 === 0) stim = Math.floor(r() * 8); const inp = [0, 0, 0, 0, 0, 0]; inp[0] = (stim & 1 ? 1 : -1); inp[2] = (stim & 2 ? 1 : -1); inp[4] = (stim & 4 ? 1 : -1);
    st = st.map((_, i) => { let h = net.b[i] + inp[i]; for (let j = 0; j < n; j++) h += net.W[i][j] * (st[j] * 2 - 1); return r() < 1 / (1 + Math.exp(-2 * h)) ? 1 : 0; });
    if (t >= 200) { X.push(st.reduce((a, v, i) => a | (v << i), 0)); S.push(stim); } }
  const Hm = (keys: number[]) => { const m = new Map<number, number>(); keys.forEach((k) => m.set(k, (m.get(k) || 0) + 1)); let h = 0; m.forEach((c) => { const p = c / keys.length; h -= p * Math.log2(p); }); return h; };
  const HX = Hm(X); let cn = 0;
  for (let k = 1; k <= 3; k++) { let sum = 0, cnt = 0; for (let m = 0; m < 64; m++) { if (popc(m) !== k) continue; sum += Hm(X.map((x) => x & m)); cnt++; } cn += sum / cnt - (k / 6) * HX; }
  let hxs = 0; for (let s = 0; s < 8; s++) { const xs = X.filter((_, i) => S[i] === s); if (xs.length) hxs += xs.length / X.length * Hm(xs); }
  return { cn, isx: HX - hxs }; }
function popc(m: number) { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; }
function v2Tests(mk: { ai: (r: Rng) => AIAgent; goal: (r: Rng) => GoalAgent; net: (seed: number) => Net6 }): Item[] {
  const AI = (f: (r: Rng) => AIAgent, k: "viab" | "acc") => runSeeds((r) => v2AIWorld(r, f(r))[k], 201);
  const passive = () => new FilterAgent((b) => [1, b.indexOf(Math.max(...b))]); const rnd = (r: Rng) => new FilterAgent(() => [r() < 0.5 ? 0 : 1, Math.floor(r() * 4)]);
  const fv = AI(mk.ai, "viab"), fa = AI(mk.ai, "acc");
  const ai = item("v2-AI", "Prereg v2", "Active inference, nonstationary depleting world", "viability; −belief surprise (bits)", "", [compare("viability vs passive policy", fv, AI(passive, "viab")), compare("viability vs random policy", fv, AI(rnd, "viab")), compare("belief accuracy vs passive policy", fa, AI(passive, "acc")), compare("belief accuracy vs random policy", fa, AI(rnd, "acc"))]);
  const G = (f: (r: Rng) => GoalAgent) => runSeeds((r) => v2GoalWorld(r, f(r)), 210); const gf = G(mk.goal);
  const g = item("v2-10", "Prereg v2", "Autonomous goal regulation, drifting needs + depletion", "fraction of time viable", "", [compare("fixed goal (always eat)", gf, G(() => ({ act: () => 0 }))), compare("random goal switching", gf, G((r) => ({ act: () => Math.floor(r() * 3) as 0 | 1 | 2 })))]);
  const nets = SEEDS.map((s) => mk.net(s)); const M = (f: (k: number) => Net6) => SEEDS.map((s, k) => v2NetMeasures(f(k), mulberry(s * 17 + 221)));
  const full = M((k) => nets[k]), unc = M((k) => ({ W: nets[k].W.map((row) => row.map(() => 0)), b: nets[k].b })), rc = M((k) => { const r = mulberry(SEEDS[k] * 19 + 7); return { W: nets[k].W.map((row, i) => row.map((_, j) => (i !== j && r() < 0.6 ? gauss(r) * 1.5 : 0))), b: nets[k].b }; });
  const n = item("v2-21", "Prereg v2", "Neural complexity (TSE) and stimulus differentiation", "C_N (bits); I(S;X) (bits)", "", [compare("uncoupled network (C_N)", full.map((x) => x.cn), unc.map((x) => x.cn)), compare("random coupled network (C_N)", full.map((x) => x.cn), rc.map((x) => x.cn)), compare("random coupled network (I(S;X))", full.map((x) => x.isx), rc.map((x) => x.isx))]);
  return [ai, g, n]; }
// === END PREREG v2 TESTS ===

// ---- creature agents for prereg v2 (mechanisms; free to iterate) ----
let AID = 4, AIK = 3.5, AIL = 1; export function setAI(d: number, k: number, l = 0) { AID = d; AIK = k; AIL = l; }
const entB = (b: number[]) => -b.reduce((s, p) => s + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
function aiPlan(b: number[], e: number, d: number): { v: number; a: AIAct } { let best = { v: -Infinity, a: [1, 0] as AIAct };
  for (let i = 0; i < 4; i++) { // go
    const pf = b[i]; const eh = Math.min(8, e - 1.5 + 3.5), em = e - 1.5;
    const vh = eh <= 0 ? -20 : d > 1 ? aiPlan(aiFilter(b, [1, i], 1, true), eh, d - 1).v : eh;
    const vm = em <= 0 ? -20 : d > 1 ? aiPlan(aiFilter(b, [1, i], 0, false), em, d - 1).v : em + AIK * Math.max(...b.map((p, j) => (j === i ? 0 : p)));
    const v = pf * vh + (1 - pf) * vm; if (v > best.v) best = { v, a: [1, i] }; }
  for (let i = 0; i < 4; i++) { const el = e - 0.5; if (el <= 0) continue; let v = 0; const pPos = b[i] * 0.9 + (1 - b[i]) * 0.1;
    for (const o of [1, 0]) { const po = o ? pPos : 1 - pPos; const nb = aiFilter(b, [0, i], o, false); v += po * AIL * (entB(b) - entB(nb)); v += po * (d > 1 ? aiPlan(nb, el, d - 1).v : el + AIK * Math.max(...nb)); }
    if (v > best.v) best = { v, a: [0, i] }; }
  return best; }
class CreatureAI implements AIAgent { b = P0.slice(); act(e: number): AIAct { return aiPlan(this.b, e, AID).a; } observe(a: AIAct, o: number, ate: boolean) { this.b = aiFilter(this.b, a, o, ate); } belief() { return this.b; } }
class CreatureGoal implements GoalAgent { pH = -1; rate = 0.03; last = -1; act(H: number, F: number, s: number): 0 | 1 | 2 {
    if (this.pH >= 0) { const dh = H - this.pH + (this.last === 0 ? 0.12 * Math.min(1, s + 0.06) : 0); if (H > 0 && this.pH > 0) this.rate = 0.9 * this.rate + 0.1 * Math.max(0.005, dh); }
    const sim = (a: number, h: number, f: number, ss: number) => { if (a === 0) { h -= 0.12 * ss; ss = Math.max(0, ss - 0.06); f += 0.02; } else if (a === 1) f -= 0.07; else { ss = 0.6; f += 0.05; } return [Math.max(0, h + this.rate), Math.max(0, f + 0.005), ss]; };
    const cost = (h: number, f: number) => Math.exp(6 * (h - 0.8)) + Math.exp(6 * (f - 0.8));
    const val = (h: number, f: number, ss: number, d: number): number => { if (d === 0) return cost(h, f); let m = Infinity; for (let a = 0; a < 3; a++) { const [h2, f2, s2] = sim(a, h, f, ss); m = Math.min(m, cost(h2, f2) + 0.95 * val(h2, f2, s2, d - 1)); } return m; };
    let best = 0, bv = Infinity; for (let a = 0; a < 3; a++) { const [h2, f2, s2] = sim(a, H, F, s); const v = cost(h2, f2) + 0.95 * val(h2, f2, s2, 3); if (v < bv) { bv = v; best = a; } }
    this.pH = H; this.last = best; return best as 0 | 1 | 2; } }
function creatureNet(seed: number): Net6 { const r = mulberry(seed * 101 + 9); const mask = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => i !== j && r() < 0.6));
  let W = mask.map((row) => row.map((m) => (m ? gauss(r) * 0.5 : 0))); const b = new Array(6).fill(0);
  const score = (w: number[][]) => { let s = 0; for (let k = 0; k < 2; k++) { const m = v2NetMeasures({ W: w, b }, mulberry(seed * 977 + k * 31 + 3)); s += m.cn + m.isx; } return s / 2; };
  let sc = score(W); for (let it = 0; it < 150; it++) { const W2 = W.map((row, i) => row.map((v, j) => (mask[i][j] && r() < 0.3 ? Math.max(-3, Math.min(3, v + gauss(r) * 0.5)) : v))); const s2 = score(W2); if (s2 > sc) { W = W2; sc = s2; } }
  return { W, b }; }
function runV2(): Item[] { const its = v2Tests({ ai: () => new CreatureAI(), goal: () => new CreatureGoal(), net: creatureNet });
  its[0].mechanism = "hazard-aware Bayesian filter + 4-step expectimax over (belief, energy) with value of information"; its[1].mechanism = "online hunger-rate estimate + 4-step model-predictive drive minimisation (eat/rest/move)"; its[2].mechanism = "couplings shaped by developmental hill-climbing on own stimulus stream (separate RNG) for C_N + I(S;X)"; return its; }
// --- RV32I interpreter running encoded machine code (xorshift32 + phase integrator) ---
const RR = (f7: number, rs2: number, rs1: number, f3: number, rd: number): number => ((f7 << 25) | (rs2 << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | 0x33) >>> 0;
const II = (imm: number, rs1: number, f3: number, rd: number, op: number): number => (((imm & 0xfff) << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | op) >>> 0;
const SS = (imm: number, rs2: number, rs1: number): number => ((((imm >> 5) & 0x7f) << 25) | (rs2 << 20) | (rs1 << 15) | (2 << 12) | ((imm & 31) << 7) | 0x23) >>> 0;
const JJ = (imm: number, rd: number): number => ((((imm >> 20) & 1) << 31) | (((imm >> 1) & 0x3ff) << 21) | (((imm >> 11) & 1) << 20) | (((imm >> 12) & 0xff) << 12) | (rd << 7) | 0x6f) >>> 0;
const PROGRAM: [number, string][] = [[II(256, 0, 2, 12, 0x03), "lw   x12, 256(x0)   # speed from host"], [II(13, 10, 1, 5, 0x13), "slli x5, x10, 13"], [RR(0, 5, 10, 4, 10), "xor  x10, x10, x5"], [II(17, 10, 5, 5, 0x13), "srli x5, x10, 17"],
  [RR(0, 5, 10, 4, 10), "xor  x10, x10, x5"], [II(5, 10, 1, 5, 0x13), "slli x5, x10, 5"], [RR(0, 5, 10, 4, 10), "xor  x10, x10, x5   # xorshift32"], [RR(0, 12, 11, 0, 11), "add  x11, x11, x12  # phase += speed"],
  [SS(260, 11, 0), "sw   x11, 260(x0)   # phase out"], [SS(264, 10, 0), "sw   x10, 264(x0)   # mutation out"], [II(1, 14, 0, 14, 0x13), "addi x14, x14, 1    # cycles"], [JJ(-44, 0), "jal  x0, -44        # loop"]];
class RV { x = new Int32Array(32); pc = 0; mem = new DataView(new ArrayBuffer(512)); steps = 0;
  constructor(prog: number[] = PROGRAM.map((p) => p[0])) { prog.forEach((w, k) => this.mem.setUint32(k * 4, w, true)); }
  step(): void { const ins = this.mem.getUint32(this.pc, true); const op = ins & 0x7f, rd = (ins >> 7) & 31, f3 = (ins >> 12) & 7, rs1 = (ins >> 15) & 31, rs2 = (ins >> 20) & 31, f7 = ins >>> 25, imm = ins >> 20; const x = this.x; let nx = this.pc + 4, v = 0, w = true;
    if (op === 0x13) { const sh = imm & 31; v = f3 === 0 ? x[rs1] + imm : f3 === 1 ? x[rs1] << sh : f3 === 4 ? x[rs1] ^ imm : f3 === 5 ? ((f7 & 0x20) ? x[rs1] >> sh : x[rs1] >>> sh) : f3 === 6 ? x[rs1] | imm : x[rs1] & imm; }
    else if (op === 0x33 && f7 === 1 && f3 === 0) v = Math.imul(x[rs1], x[rs2]); /* RV32M mul */
    else if (op === 0x37) v = ins & 0xfffff000; /* lui */
    else if (op === 0x33) v = f3 === 0 ? ((f7 & 0x20) ? x[rs1] - x[rs2] : x[rs1] + x[rs2]) : f3 === 4 ? x[rs1] ^ x[rs2] : f3 === 1 ? x[rs1] << (x[rs2] & 31) : f3 === 6 ? x[rs1] | x[rs2] : x[rs1] & x[rs2];
    else if (op === 0x03) v = this.mem.getInt32((x[rs1] + imm) & 508, true);
    else if (op === 0x23) { const im = ((ins >> 25) << 5) | ((ins >> 7) & 31); this.mem.setInt32((x[rs1] + im) & 508, x[rs2], true); w = false; }
    else if (op === 0x6f) { const im = (((ins >> 31) & 1) ? -1048576 : 0) | (((ins >> 12) & 0xff) << 12) | (((ins >> 20) & 1) << 11) | (((ins >> 21) & 0x3ff) << 1); v = this.pc + 4; nx = this.pc + im; } else w = false;
    if (w && rd) x[rd] = v | 0; this.pc = nx & 511; this.steps++; } }
// ---- limb physics (shared by the Page body and V2.1-25): damped Hamiltonian chain node, symplectic Euler ----
function limbNodeStep(x: Float64Array, p: Float64Array, k0: number, T3: number[], dt: number, energy: number, ck: number): void {
  for (let d = 0; d < 3; d++) { const k = k0 + d; p[k] += dt * (-(7 + 3 * energy) * (x[k] - T3[d]) - 1.8 * p[k]); x[k] += dt * p[k] * 4 * ck; } }

// === PREREG v2.1 TESTS (frozen; see PREREGISTRATION_v2.1.md) ===
const LUI = (imm20: number, rd: number): number => (((imm20 & 0xfffff) << 12) | (rd << 7) | 0x37) >>> 0;
const HH_PROG: number[] = [II(256, 0, 2, 10, 0x03), II(16, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), LUI(0x7feb3, 6), II(0x52d, 6, 0, 6, 0x13), RR(1, 6, 10, 0, 10),
  II(15, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), LUI(0x846ca, 6), II(0x68b, 6, 0, 6, 0x13), RR(1, 6, 10, 0, 10), II(16, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), SS(264, 10, 0), JJ(0, 0)];
const XS_PROG: number[] = [II(256, 0, 2, 10, 0x03), II(13, 10, 1, 5, 0x13), RR(0, 5, 10, 4, 10), II(17, 10, 5, 5, 0x13), RR(0, 5, 10, 4, 10), II(5, 10, 1, 5, 0x13), RR(0, 5, 10, 4, 10), SS(264, 10, 0), JJ(0, 0)];
function hhJS(x: number): number { x = x >>> 0; x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0; x ^= x >>> 16; return x >>> 0; }
function rvRun(prog: number[], u: number): number { const m = new RV(prog); m.mem.setUint32(256, u >>> 0, true); for (let i = 0; i < prog.length; i++) m.step(); return m.mem.getUint32(264, true); }
function v21Inputs(seed: number): number[] { const r = mulberry(seed * 4099 + 23); return Array.from({ length: 256 }, () => (r() * 4294967296) >>> 0); }
const agree = (a: number[], b: number[]) => a.filter((v, i) => v === b[i]).length / a.length;
type GpuRecord = { renderer: string; hhGpu: Record<string, number[]>; xsGpu: Record<string, number[]>; detailFull: number[]; detailReduced: number[] };
let GPUREC: GpuRecord | null = null; export function setGpuRecord(g: GpuRecord | null) { GPUREC = g; }
function limbPR(seed: number, nCh: number, nNodes: number): number { const r = mulberry(seed * 613 + 25); const drv = new Array(8).fill(0); const dim = nCh * nNodes * 3;
  const L = Array.from({ length: nCh }, (_, l) => { const a = (l / nCh) * 6.283; const x = new Float64Array(nNodes * 3), p = new Float64Array(nNodes * 3); for (let s = 0; s < nNodes; s++) { x[s * 3] = Math.cos(a) * 0.4 * (1 + s * 0.2); x[s * 3 + 1] = -0.2; x[s * 3 + 2] = Math.sin(a) * 0.4 * (1 + s * 0.2); } return { a, x, p }; });
  const X: number[][] = []; let t = 0; const dt = 1 / 60;
  for (let step = 0; step < 600; step++) { t += dt; for (let c = 0; c < 8; c++) drv[c] = 0.95 * drv[c] + gauss(r) * 0.3;
    L.forEach((Lc, l) => { const reach = 0.5 + 0.25 * Math.tanh(drv[l % 8]); for (let s = 0; s < nNodes; s++) { const u = (s + 1) / nNodes; const sw = Math.sin(t * 1.7 + l * 0.8 + u * 3) * 0.3 * u + 0.3 * u * Math.tanh(drv[(l + 3) % 8]);
      const T3 = [Math.cos(Lc.a + sw) * (0.35 + u * reach), -0.25 + Math.sin(t + l + u * 2) * 0.15 * u + 0.3 * u * u * Math.tanh(drv[(l + 5) % 8]), Math.sin(Lc.a + sw) * (0.35 + u * reach)]; limbNodeStep(Lc.x, Lc.p, s * 3, T3, dt, 0.5, 1); } });
    if (step >= 100) X.push(L.flatMap((Lc) => Array.from(Lc.x))); }
  const n = X.length, mu = new Array(dim).fill(0); X.forEach((row) => row.forEach((v, i) => (mu[i] += v / n)));
  const C = Array.from({ length: dim }, () => new Array(dim).fill(0)); X.forEach((row) => { for (let i = 0; i < dim; i++) { const a = row[i] - mu[i]; for (let j = i; j < dim; j++) C[i][j] += a * (row[j] - mu[j]) / n; } });
  let tr = 0, f2 = 0; for (let i = 0; i < dim; i++) { tr += C[i][i]; for (let j = i; j < dim; j++) f2 += (i === j ? 1 : 2) * C[i][j] * C[i][j]; } return tr * tr / f2; }
function v21Tests(): Item[] {
  const hhRef = SEEDS.map((s) => v21Inputs(s).map(hhJS));
  const rvFull = SEEDS.map((s, k) => agree(v21Inputs(s).map((u) => rvRun(HH_PROG, u)), hhRef[k])), rvMis = SEEDS.map((s, k) => agree(v21Inputs(s).map((u) => rvRun(XS_PROG, u)), hhRef[k]));
  const cm23 = [compare("RV32I vs JS: mismatched-substrate control (RV32I running xorshift)", rvFull, rvMis)];
  let note23 = `RV32I all-seeds exact: ${rvFull.every((v) => v === 1)}`;
  if (GPUREC) { const gF = SEEDS.map((s, k) => agree(GPUREC!.hhGpu[s], hhRef[k])), gM = SEEDS.map((s, k) => agree(GPUREC!.xsGpu[s], hhRef[k])); cm23.push(compare("GPU vs JS: mismatched-substrate control (GPU running xorshift)", gF, gM)); note23 += `; GPU all-seeds exact: ${gF.every((v) => v === 1)} (${GPUREC.renderer})`; if (!gF.every((v) => v === 1)) cm23.push({ control: "requirement: every GPU seed exact", full: 0, ctrl: 1, d: 0, t: 0, pass: false }); }
  else cm23.push({ control: "GPU vs JS: no browser GPU record available", full: NaN, ctrl: NaN, d: 0, t: 0, pass: false });
  if (!rvFull.every((v) => v === 1)) cm23.push({ control: "requirement: every RV32I seed exact", full: 0, ctrl: 1, d: 0, t: 0, pass: false });
  const i23 = item("v2.1-23", "Prereg v2.1", "Substrate pluralism: weight hash on RV32I, GPU and JS", "bit-identical agreement with JS reference (256 outputs/seed)", "same hh() on RV32I(+M) machine code, GLSL uint shader, JS Math.imul", cm23, note23);
  const trace = (seed: number): number[] => { const out: number[] = []; const ag = new CreatureAI(); const rA = mulberry(seed * 7919 + 201); let k = 0;
    const wrap: AIAgent = { act: (e) => ag.act(e), observe: (a, o, ate) => { ag.observe(a, o, ate); if (k++ % 5 === 0 && out.length < 32) out.push(entB(ag.belief())); }, belief: () => ag.belief() }; v2AIWorld(rA, wrap);
    const rB = mulberry(seed * 7919 + 11); const errs: number[] = []; attnRunTrace(rB, errs); for (let i = 0; i < 30; i++) out.push(errs[i * 10]); return out; }; /* erratum: prereg text says 32 AST checkpoints every 10 steps, but the task has 300 steps, so 30 are taken; AI checkpoints stop when the agent dies */
  const bits = (a: number[], b: number[]) => { const f = new Float64Array(1), g = new BigUint64Array(f.buffer); let m = 0; const n = Math.max(a.length, b.length); for (let i = 0; i < Math.min(a.length, b.length); i++) { f[0] = a[i]; const x = g[0]; f[0] = b[i]; if (x === g[0]) m++; } return m / n; };
  const same = SEEDS.map((s) => bits(trace(s), trace(s))), pert = SEEDS.map((s) => bits(trace(s), trace(s + 1)));
  const i24 = item("v2.1-24", "Prereg v2.1", "Reproducibility: bit-identity of instrumented runs", "fraction of 64 Float64 checkpoints bit-identical between two runs", "seeded mulberry32 streams, no wall-clock or global state in the agents", [compare("perturbed-seed control (seed+1)", same, pert)], "cross-process results.json SHA-256 check is run by repro.sh and reported alongside");
  const prF = SEEDS.map((s) => limbPR(s, 8, 6)), prR = SEEDS.map((s) => limbPR(s, 2, 3));
  const cm25 = [compare("reduced-scale body (2 chains × 3 nodes): participation ratio", prF, prR)];
  if (GPUREC) cm25.push(compare("reduced-scale render (body ellipsoid only): Sobel detail", GPUREC.detailFull, GPUREC.detailReduced)); else cm25.push({ control: "render detail: no browser GPU record available", full: NaN, ctrl: NaN, d: 0, t: 0, pass: false });
  const i25 = item("v2.1-25", "Prereg v2.1", "Visual and embodied scale", "body participation ratio; rendered Sobel detail", "8×6-node Hamiltonian limb chains; full SDF scene (shell, limbs, spines, fin, eyes, inner organs)", cm25, GPUREC ? `render measured on ${GPUREC.renderer}` : undefined);
  return [i23, i24, i25]; }
// === END PREREG v2.1 TESTS ===

// ---- creature mechanisms for v2.2 (iterable; logged in HARNESS_CHANGES.md) ----
function modInv32(a: number): number { let x = a >>> 0; for (let i = 0; i < 5; i++) x = Math.imul(x, (2 - Math.imul(a, x)) >>> 0) >>> 0; return x >>> 0; }
const HHI1 = modInv32(0x7feb352d), HHI2 = modInv32(0x846ca68b);
function hhInv(y: number): number { y = y >>> 0; y ^= y >>> 16; y = Math.imul(y, HHI2) >>> 0; y ^= (y >>> 15) ^ (y >>> 30); y = Math.imul(y, HHI1) >>> 0; y ^= y >>> 16; return y >>> 0; }
function sha256(msg: Uint8Array): Uint8Array { const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]); const L = msg.length, n = ((L + 9 + 63) >> 6) << 6; const b = new Uint8Array(n); b.set(msg); b[L] = 0x80; const bits = L * 8; for (let i = 0; i < 4; i++) b[n - 1 - i] = (bits >>> (8 * i)) & 255;
  const W = new Uint32Array(64); const ro = (x: number, k: number) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) { for (let i = 0; i < 16; i++) W[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) { const s0 = ro(W[i - 15], 7) ^ ro(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = ro(W[i - 2], 17) ^ ro(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0; }
    let [a, bb, c, d, e, f, g, h] = H; for (let i = 0; i < 64; i++) { const S1 = ro(e, 6) ^ ro(e, 11) ^ ro(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) >>> 0, S0 = ro(a, 2) ^ ro(a, 13) ^ ro(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0; }
    H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h; }
  const out = new Uint8Array(32); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) out[4 * i + j] = (H[i] >>> (24 - 8 * j)) & 255; return out; }
const utf8 = (s: string) => new Uint8Array(Array.from(s).map((c) => c.charCodeAt(0) & 255)); const hex = (u: Uint8Array) => Array.from(u).map((x) => x.toString(16).padStart(2, "0")).join("");
const cat = (a: Uint8Array, b: Uint8Array) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
// interoception: efference copy of the activity schedule + online food-rate estimate
function interoForecast(Eh: number[], t: number, phi: number, foodRate: number): number { let f = Eh[t]; for (let k = 0; k < 20; k++) f -= 0.02 + 0.01 * Math.sin(6.283185307 * (t + k) / 37 + phi); return f + 20 * 0.3 * foodRate; }
// immune: procedural weights are self-verifying; suspicion = deviation from regenerated weight
const immuneScore = (w: number, s: number, i: number) => Math.abs(w - (hhJS(s * 4096 + i) / 4294967296 * 2 - 1));
let CIRK = 0.1; // circadian light coupling (phase-response curve gain)
const sdPrior = (prev: number, o: number) => { const vp = 0.01, vo = 0.25, w1 = 0.7 * Math.exp(-((o - prev) ** 2) / (2 * (vp + vo))) / Math.sqrt(vp + vo), w0 = 0.3 * 0.5 * 1; /* uniform prior density 0.5 on [-1,1] (approx. likelihood marginal) */ const m1 = (prev * vo + o * vp) / (vp + vo); const p1 = w1 / (w1 + w0); return p1 * m1 + (1 - p1) * Math.max(-1, Math.min(1, o)); };

// === PREREG v2.2 TESTS (frozen; see preregistrations/v2.2.md) ===
const v22seeds = (b: number) => Array.from({ length: 16 }, (_, k) => b + k);
function v22Tests(): Item[] { const P = "Prereg v2.2"; const out: Item[] = [];
  { const cm: Cmp[] = []; for (const B of [2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]) { const f = (m: string) => v22seeds(B).map((s) => -Math.log10(-attnRun(mulberry(s * 7919 + 11), m, false) + 1e-6)); const F = f("full"); cm.push(compare(`base ${B}: ablation (noschema)`, F, f("noschema")), compare(`base ${B}: random schema`, F, f("randschema"))); }
    out.push(item("AST-1R", P, "Attention schema on held-out seed sets (tail-robust)", "−log10 mean squared attention error", "Kalman attention schema with NIS self-monitoring (same as AST-1)", cm)); }
  { const run = (pers: boolean) => SEEDS.map((s) => { const r = mulberry(s * 211 + 3); const phi = r() * 6.283185307; const E = [1]; for (let t = 0; t < 400; t++) E.push(E[t] - (0.02 + 0.01 * Math.sin(6.283185307 * t / 37 + phi)) + (r() < 0.05 ? 0.3 : 0));
      let se = 0, n = 0; for (let t = 50; t < 380; t++) { let jumps = 0; for (let k = 1; k <= t; k++) { const exp = E[k - 1] - (0.02 + 0.01 * Math.sin(6.283185307 * (k - 1) / 37 + phi)); if (E[k] - exp > 0.15) jumps++; } const fc = pers ? E[t] : interoForecast(E, t, phi, jumps / t); se += (fc - E[t + 20]) ** 2; n++; } return -se / n; });
    out.push(item("RM-10", P, "Interoceptive prediction of energy (roadmap 10)", "−MSE of 20-step energy forecast", "efference copy of the activity schedule + online food-rate estimate", [compare("persistence forecast", run(false), run(true))])); }
  { const run = (rand: boolean) => SEEDS.map((s) => { const r = mulberry(s * 223 + 5); const w = Array.from({ length: 4096 }, (_, i) => hhJS(s * 4096 + i) / 4294967296 * 2 - 1); const bad = new Set<number>(); while (bad.size < 64) bad.add(Math.floor(r() * 4096)); bad.forEach((i) => { w[i] = r() * 2 - 1; });
      const sc = w.map((x, i) => rand ? r() : immuneScore(x, s, i)); return auroc(sc, w.map((_, i) => bad.has(i))); });
    const F = run(false); const it = item("RM-27", P, "Immune-like detection of corrupted weights (roadmap 27)", "AUROC", "regeneration check of procedural hash weights", [compare("random detector", F, run(true))]); if (mean(F) < 0.9) { it.pass = false; it.note = "requirement mean AUROC ≥ 0.9 failed"; } out.push(it); }
  { const run = (light: boolean, rec?: number[]) => SEEDS.map((s, si) => { const r = mulberry(s * 227 + 7); const tau = 22 + 4 * r(); let th = r() * 6.283185307; let cx = 0, cy = 0, p960 = 0;
      for (let t = 0; t < 1200; t++) { const L = light && t < 960 && (t % 24) < 12 ? 1 : 0; th += 6.283185307 / tau - CIRK * L * Math.sin(th) + gauss(r) * 0.02; const rel = th - 6.283185307 * (t + 1) / 24;
        if (t >= 480 && t < 960) { cx += Math.cos(rel); cy += Math.sin(rel); } if (t === 959) p960 = rel; if (t === 1199 && rec) rec[si] = Math.abs(rel - p960); } return Math.hypot(cx, cy) / 480; });
    const drift: number[] = []; const F = run(true, drift); const it = item("RM-28", P, "Circadian entrainment (roadmap 28)", "phase-locking value to 24-step light cycle", "phase oscillator with light phase-response coupling", [compare("light input removed", F, run(false))]);
    const nd = drift.filter((x) => x > 0.3).length; it.note = `free-run drift > 0.3 rad in ${nd}/16 seeds`; if (nd < 15) it.pass = false; out.push(it); }
  { const run = (inv: boolean) => SEEDS.map((s) => { const x0 = v21Inputs(s); const fw = x0.map((x) => { for (let k = 0; k < 16; k++) x = hhJS(x); return x; }); const bw = fw.map((y) => { for (let k = 0; k < 16; k++) y = inv ? hhInv(y) : hhJS(y); return y; }); return agree(bw, x0); });
    const F = run(true); const it = item("RM-46", P, "Reversible computing core (roadmap 46)", "fraction of states restored bit-exactly", "exact inverse of the weight hash (modular inverses + xorshift inversion)", [compare("backward = more forward rounds", F, run(false))]); if (F.some((v) => v !== 1)) it.pass = false; out.push(it); }
  { const run = (chain: boolean) => SEEDS.map((s) => { const r = mulberry(s * 31 + 7); const G: Uint8Array[] = [Uint8Array.from({ length: 64 }, () => Math.floor(r() * 256))]; for (let k = 1; k < 64; k++) { const g = G[k - 1].slice(); const m = 1 + Math.floor(r() * 3); for (let j = 0; j < m; j++) { const bi = Math.floor(r() * 512); g[bi >> 3] ^= 1 << (bi & 7); } G.push(g); }
      const root = sha256(utf8("seed:" + s)); const mk = (gs: Uint8Array[]) => { const h: Uint8Array[] = []; let p = root; for (const g of gs) { const x = chain ? sha256(cat(p, g)) : sha256(g); h.push(x); p = x; } return h; }; const Hs = mk(G); const head = hex(Hs[63]);
      let det = 0; for (let tr = 0; tr < 100; tr++) { const k = Math.floor(r() * 64), bi = Math.floor(r() * 512); const G2 = G.map((g) => g.slice()); G2[k][bi >> 3] ^= 1 << (bi & 7); const H2 = Hs.slice(); H2[k] = chain ? sha256(cat(k ? Hs[k - 1] : root, G2[k])) : sha256(G2[k]);
        let bad = false; if (chain) { let p = root; for (let j = 0; j < 64; j++) { const x = sha256(cat(p, G2[j])); if (hex(x) !== hex(H2[j])) bad = true; p = x; } if (hex(p) !== head) bad = true; } else { for (let j = 0; j < 64; j++) if (hex(sha256(G2[j])) !== hex(H2[j])) bad = true; } if (bad) det++; } return det / 100; });
    const F = run(true); const it = item("RM-47", P, "Cryptographic lineage provenance (roadmap 47)", "tamper detection rate", "SHA-256 hash chain from seed to head", [compare("unchained per-record hashes", F, run(false))]); if (F.some((v) => v !== 1)) it.pass = false; out.push(it); }
  { const run = (sh: boolean) => SEEDS.map((s) => { const r = mulberry(s * 229 + 9); const t = firstOrder(r, 400); const c = sh ? shuffle(t.map((o) => o.conf), r) : t.map((o) => o.conf); return auroc(c, t.map((o) => o.ok)); });
    const F = run(false); const it = item("RM-61", P, "Metacognitive confidence reporting (roadmap 61)", "confidence–accuracy AUROC", "second-order reliability monitor (HOT-2)", [compare("shuffled confidence", F, run(true))]); if (mean(F) < 0.7) it.pass = false; out.push(it); }
  { const run = (mem: boolean, metric: "bias" | "mse") => SEEDS.map((s) => { const r = mulberry(s * 233 + 11); let sp = r() * 2 - 1, ep = 0; const xs: number[] = [], ys: number[] = []; let se = 0;
      for (let t = 0; t < 300; t++) { const st = r() < 0.7 ? Math.max(-1, Math.min(1, sp + gauss(r) * 0.1)) : r() * 2 - 1; const o = st + gauss(r) * 0.5; const e = mem && t > 0 ? sdPrior(ep, o) : o; if (t > 0) { xs.push(sp - st); ys.push(e - st); } se += (e - st) ** 2; sp = st; ep = e; }
      if (metric === "mse") return -se / 300; const mx = mean(xs), my = mean(ys); let a = 0, b = 0; for (let i = 0; i < xs.length; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) ** 2; } return a / b; });
    out.push(item("RM-69", P, "Serial dependence in perception (roadmap 69)", "serial bias slope; −MSE", "Bayesian persistence prior (mixture: stay vs new stimulus)", [compare("memoryless perceiver (bias)", run(true, "bias"), run(false, "bias")), compare("memoryless perceiver (−MSE)", run(true, "mse"), run(false, "mse"))])); }
  { const run = (scalar: boolean) => SEEDS.map((s) => { const r = mulberry(s * 239 + 13); const sdI = (I: number) => { const x = Array.from({ length: 40 }, () => scalar ? I * (1 + 0.15 * gauss(r)) : I + 2 * gauss(r)); return sd(x); }; const a = sdI(10); sdI(20); sdI(40); return sdI(80) / a; });
    const F = run(true); const it = item("RM-79", P, "Temporal interval timing (roadmap 79)", "SD(80)/SD(10)", "pacemaker–accumulator with per-trial rate variability", [compare("additive-noise timer", F, run(false))]); if (mean(F) < 4 || mean(F) > 16) it.pass = false; out.push(it); }
  { const run = (adapt: boolean, m: "dec" | "rec") => SEEDS.map((s) => { const r = mulberry(s * 241 + 17); let wA = 1; const R: number[] = []; for (let k = 0; k < 20; k++) { R.push(wA + gauss(r) * 0.05); if (adapt) wA *= 0.85; } const RB = 1 + gauss(r) * 0.05; return m === "dec" ? R[0] - R[19] : RB - R[19]; });
    out.push(item("RM-80", P, "Habituation and dishabituation (roadmap 80)", "decrement; recovery to novel", "stimulus-specific synaptic depression", [compare("non-adaptive unit (decrement)", run(true, "dec"), run(false, "dec")), compare("non-adaptive unit (recovery)", run(true, "rec"), run(false, "rec"))])); }
  { const run = (rw: boolean) => SEEDS.map((s) => { const r = mulberry(s * 251 + 19); const al = 0.1 + 0.2 * r(); const V: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }; const trial = (cs: string[]) => { const lam = r() < 0.9 ? 1 : 0; const tot = cs.reduce((a, c) => a + V[c], 0); for (const c of cs) V[c] += al * (lam - (rw ? tot : V[c])); };
      for (let k = 0; k < 30; k++) trial(["A"]); for (let k = 0; k < 30; k++) trial(["A", "B"]); for (let k = 0; k < 30; k++) trial(["C", "D"]); return V.D - V.B; });
    out.push(item("RM-81", P, "Classical conditioning with blocking (roadmap 81)", "blocking index V_D − V_B", "Rescorla–Wagner shared prediction error", [compare("associative-only learner", run(true), run(false))])); }
  return out; }
// === END PREREG v2.2 TESTS ===

// ---- live organs (round 8): roadmap mechanisms wired into the rendered creature's loop (src/app.tsx) ----
class Organs { th: number; tau: number; r: Rng; ab: Set<string>; hab = new Map<string, number>(); root: Uint8Array; genome: Uint8Array; G: Uint8Array[] = []; H: Uint8Array[] = []; arousal = 0.5;
  constructor(seed: number, ablate: string[] = []) { this.r = mulberry(seed * 227 + 7); this.tau = 22 + 4 * this.r(); this.th = this.r() * 6.283185307; this.ab = new Set(ablate); this.root = sha256(utf8("seed:" + seed)); const g = mulberry(seed * 31 + 7); this.genome = Uint8Array.from({ length: 64 }, () => Math.floor(g() * 256)); }
  /* circadian: one organ step per frame; light from the scene's day/night cycle; returns arousal in [0,1] */
  circ(light: number): number { this.th += 6.283185307 / this.tau - (this.ab.has("circ") ? 0 : CIRK) * light * Math.sin(this.th) + gauss(this.r) * 0.02; this.arousal = 0.5 + 0.5 * Math.cos(this.th); return this.arousal; }
  /* habituation: stimulus-specific synaptic depression; slow recovery each frame */
  poke(stim: string): number { const w = this.hab.get(stim) ?? 1; if (!this.ab.has("hab")) this.hab.set(stim, w * 0.85); return w; }
  recover(): void { this.hab.forEach((w, k) => this.hab.set(k, w + (1 - w) * 0.002)); }
  /* lineage: the RV32I core's mutation word mutates the genome; every generation is appended to a SHA-256 chain */
  mutate(word: number): void { const g = this.genome.slice(); const m = 1 + (word & 3) % 3; for (let j = 0; j < m; j++) { const bi = (word >>> (2 + 9 * j)) & 511; g[bi >> 3] ^= 1 << (bi & 7); } this.genome = g; const p = this.H.length ? this.H[this.H.length - 1] : this.root; this.G.push(g); this.H.push(this.ab.has("chain") ? sha256(g) : sha256(cat(p, g))); }
  head(): string { return this.H.length ? hex(this.H[this.H.length - 1]) : hex(this.root); }
  verify(G: Uint8Array[], H: Uint8Array[], head: string): boolean { if (this.ab.has("chain")) { for (let j = 0; j < G.length; j++) if (hex(sha256(G[j])) !== hex(H[j])) return false; return true; } let p = this.root; for (let j = 0; j < G.length; j++) { const x = sha256(cat(p, G[j])); if (hex(x) !== hex(H[j])) return false; p = x; } return hex(p) === head; }
  /* tamper audit: flip one bit in a random generation; adversary recomputes that record's own hash field */
  tamperAudit(n: number, r: Rng): number { if (this.G.length < 2) return 0; const head = this.head(); let det = 0; for (let tr = 0; tr < n; tr++) { const k = Math.floor(r() * this.G.length), bi = Math.floor(r() * 512); const G2 = this.G.map((g) => g.slice()); G2[k][bi >> 3] ^= 1 << (bi & 7); const H2 = this.H.slice();
      H2[k] = this.ab.has("chain") ? sha256(G2[k]) : sha256(cat(k ? this.H[k - 1] : this.root, G2[k])); if (!this.verify(G2, H2, head)) det++; } return det / n; } }
// ===================== Creature #1 v3: GPU brain, HDR raymarched body, evaluation panel =====================
// --- entropy + Moonlab-style 2-qubit state vector with CHSH-gated randomness (TypeScript port, not Moonlab itself) ---
function osU32(): number { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0]; }
class QSim { re = new Float64Array(4); im = new Float64Array(4);
  reset(): void { this.re.fill(0); this.im.fill(0); this.re[0] = 1; }
  ry(q: number, t: number): void { const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q; for (let i = 0; i < 4; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = c * a - s * b; this.re[j] = s * a + c * b; this.im[i] = c * ai - s * bi; this.im[j] = s * ai + c * bi; } }
  h(q: number): void { const s = Math.SQRT1_2, m = 1 << q; for (let i = 0; i < 4; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = s * (a + b); this.re[j] = s * (a - b); this.im[i] = s * (ai + bi); this.im[j] = s * (ai - bi); } }
  cx(): void { let x = this.re[1]; this.re[1] = this.re[3]; this.re[3] = x; x = this.im[1]; this.im[1] = this.im[3]; this.im[3] = x; }
  probs(): number[] { return [0, 1, 2, 3].map((k) => this.re[k] ** 2 + this.im[k] ** 2); }
  measure(u: number): number { const p = this.probs(); let k = 0; for (; k < 3; k++) { u -= p[k]; if (u < 0) break; } return k; } }
function chsh(shots: number): number { const q = new QSim(); const A = [0, Math.PI / 2], B = [Math.PI / 4, -Math.PI / 4]; let S = 0;
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) { let e = 0; for (let s = 0; s < shots; s++) { q.reset(); q.h(0); q.cx(); q.ry(0, -A[x]); q.ry(1, -B[y]); const k = q.measure(osU32() / 4294967296); e += ((k & 1) ^ (k >> 1)) ? -1 : 1; } e /= shots; S += x && y ? -e : e; } return Math.abs(S); }

function substrateCheck(): { ok: boolean; n: number } { const rv = new RV(); rv.x[10] = 0x1234567; let js = 0x1234567 | 0; let ok = true; const n = 500;
  for (let k = 0; k < n; k++) { for (let i = 0; i < PROGRAM.length; i++) rv.step(); js ^= js << 13; js ^= js >>> 17; js ^= js << 5; if ((rv.mem.getInt32(264, true) | 0) !== (js | 0)) ok = false; } return { ok, n }; }

// --- reverse-mode autodiff tape: trains the readout of the GPU network online ---
class Tn { v: Float32Array; g: Float32Array; back: (() => void) | null = null; par: Tn[] = []; constructor(n: number) { this.v = new Float32Array(n); this.g = new Float32Array(n); } }
function linT(x: Tn, W: Tn, b: Tn, ni: number, no: number): Tn { const y = new Tn(no); for (let o = 0; o < no; o++) { let s = b.v[o]; const off = o * ni; for (let i = 0; i < ni; i++) s += W.v[off + i] * x.v[i]; y.v[o] = s; }
  y.par = [x, W, b]; y.back = () => { for (let o = 0; o < no; o++) { const g = y.g[o]; if (!g) continue; b.g[o] += g; const off = o * ni; for (let i = 0; i < ni; i++) { W.g[off + i] += g * x.v[i]; x.g[i] += g * W.v[off + i]; } } }; return y; }
function tanhTn(x: Tn): Tn { const y = new Tn(x.v.length); for (let i = 0; i < y.v.length; i++) y.v[i] = Math.tanh(x.v[i]); y.par = [x]; y.back = () => { for (let i = 0; i < y.v.length; i++) x.g[i] += y.g[i] * (1 - y.v[i] ** 2); }; return y; }
function mseTn(x: Tn, t: number[]): Tn { const y = new Tn(1); let s = 0; for (let i = 0; i < t.length; i++) s += (x.v[i] - t[i]) ** 2; y.v[0] = s / t.length; y.par = [x]; y.back = () => { for (let i = 0; i < t.length; i++) x.g[i] += y.g[0] * 2 * (x.v[i] - t[i]) / t.length; }; return y; }
function backwardTn(root: Tn): void { const ord: Tn[] = []; const seen = new Set<Tn>(); const vis = (t: Tn): void => { if (seen.has(t)) return; seen.add(t); t.par.forEach(vis); ord.push(t); }; vis(root); root.g[0] = 1; for (let i = ord.length - 1; i >= 0; i--) { const b = ord[i].back; if (b) b(); } }

// --- GPU parameter engine: 4 dense tanh layers of 5000x5000 procedural weights = 100,000,000 inference weights ---
const NN = 5000, NL = 4, NOUT = 8;
const HASH_GLSL = `uint hh(uint x){x^=x>>16;x*=0x7feb352du;x^=x>>15;x*=0x846ca68bu;x^=x>>16;return x;}`;
const HASH_WGSL = `fn hh(xi:u32)->u32{var x=xi;x^=x>>16u;x*=0x7feb352du;x^=x>>15u;x*=0x846ca68bu;x^=x>>16u;return x;}`;
// fwd: y[o] = tanh(0.0245·Σ_i w(l,o,i)·x[i] + add[o]) for o < rows (else 0).  bwd: y[i] = Σ_{o<rows} w(l,o,i)·g[o]  (exact transpose, for LoRA backprop)
type Engine = { kind: string; info: string; fwd: (l: number, x: Float32Array, rows: number, add: Float32Array) => Promise<Float32Array>; bwd: (l: number, g: Float32Array, rows: number) => Promise<Float32Array> };
async function makeWebGPU(): Promise<Engine | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any; if (!nav.gpu) return null; const ad = await nav.gpu.requestAdapter(); if (!ad) return null; const dev = await ad.requestDevice();
  const code = `${HASH_WGSL}
@group(0) @binding(0) var<storage,read> xin: array<f32>; @group(0) @binding(1) var<storage,read_write> yout: array<f32>; @group(0) @binding(2) var<uniform> P: vec4<u32>; @group(0) @binding(3) var<storage,read> addv: array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3<u32>) { let o = id.x; if (o >= ${NN}u) { return; } var s = 0.0;
  if (P.w == 0u) { if (o >= P.y) { yout[o] = 0.0; return; } let base = P.x * ${NN}u * ${NN}u + o * ${NN}u;
    for (var i = 0u; i < ${NN}u; i++) { let w = f32(hh(base + i) ^ P.z) * 2.3283064e-10 * 2.0 - 1.0; s += w * xin[i]; } yout[o] = tanh(s * 0.0245 + addv[o]); }
  else { let base = P.x * ${NN}u * ${NN}u + o; for (var r = 0u; r < P.y; r++) { let w = f32(hh(base + r * ${NN}u) ^ P.z) * 2.3283064e-10 * 2.0 - 1.0; s += w * xin[r]; } yout[o] = s; } }`;
  const pipe = dev.createComputePipeline({ layout: "auto", compute: { module: dev.createShaderModule({ code }), entryPoint: "main" } });
  const mk = (): unknown => dev.createBuffer({ size: NN * 4, usage: 0x80 | 0x8 | 0x4 }); const bin = mk(), bout = mk(), badd = mk();
  const ub = dev.createBuffer({ size: 16, usage: 0x40 | 0x8 }); const rb = dev.createBuffer({ size: NN * 4, usage: 0x1 | 0x8 });
  const bg = dev.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: bin } }, { binding: 1, resource: { buffer: bout } }, { binding: 2, resource: { buffer: ub } }, { binding: 3, resource: { buffer: badd } }] });
  const call = async (l: number, x: Float32Array, rows: number, add: Float32Array | null, mode: number): Promise<Float32Array> => {
    dev.queue.writeBuffer(bin, 0, x); if (add) dev.queue.writeBuffer(badd, 0, add); dev.queue.writeBuffer(ub, 0, new Uint32Array([l, rows, 0x9e3779b9, mode]));
    const enc = dev.createCommandEncoder(); const p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(Math.ceil(NN / 64)); p.end();
    enc.copyBufferToBuffer(bout, 0, rb, 0, NN * 4); dev.queue.submit([enc.finish()]); await rb.mapAsync(1); const out = new Float32Array(rb.getMappedRange().slice(0)); rb.unmap(); return out; };
  return { kind: "WebGPU compute", info: ad.info ? String(ad.info.vendor || "") + " " + String(ad.info.architecture || "") : "", fwd: (l, x, rows, add) => call(l, x, rows, add, 0), bwd: (l, g, rows) => call(l, g, rows, null, 1) };
}
function makeWebGL2Engine(): Engine | null { const c = document.createElement("canvas"); c.width = NN; c.height = 1; const gl = c.getContext("webgl2"); if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
  const vs = `#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const fs = `#version 300 es\nprecision highp float; precision highp int; uniform highp sampler2D X; uniform highp sampler2D A; uniform uint L; uniform int rows; uniform int mode; out vec4 o; ${HASH_GLSL}
void main(){ int oi = int(gl_FragCoord.x); float s = 0.;
  if (mode == 0) { if (oi >= rows) { o = vec4(0.); return; } uint base = L*${NN}u*${NN}u + uint(oi)*${NN}u;
    for (int i = 0; i < ${NN}; i++) { float w = float(hh(base + uint(i)) ^ 0x9e3779b9u) * 2.3283064e-10 * 2.0 - 1.0; s += w * texelFetch(X, ivec2(i,0), 0).r; } o = vec4(tanh(s*0.0245 + texelFetch(A, ivec2(oi,0), 0).r),0.,0.,1.); }
  else { uint base = L*${NN}u*${NN}u + uint(oi); for (int r = 0; r < ${NN}; r++) { if (r >= rows) break; float w = float(hh(base + uint(r)*${NN}u) ^ 0x9e3779b9u) * 2.3283064e-10 * 2.0 - 1.0; s += w * texelFetch(X, ivec2(r,0), 0).r; } o = vec4(s,0.,0.,1.); } }`;
  const prog = linkProg(gl, vs, fs); if (!prog) return null; quad(gl, prog);
  const mkT = (): WebGLTexture => { const t = gl.createTexture() as WebGLTexture; gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, NN, 1, 0, gl.RGBA, gl.FLOAT, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); return t; };
  const tx = mkT(), ta = mkT(), to = mkT(); const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, to, 0);
  const up = new Float32Array(NN * 4); const rd = new Float32Array(NN * 4);
  const upl = (t: WebGLTexture, v: Float32Array): void => { for (let i = 0; i < NN; i++) up[i * 4] = v[i]; gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NN, 1, gl.RGBA, gl.FLOAT, up); };
  const call = async (l: number, x: Float32Array, rows: number, add: Float32Array | null, mode: number): Promise<Float32Array> => {
    upl(tx, x); if (add) upl(ta, add); gl.useProgram(prog); gl.viewport(0, 0, NN, 1); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(gl.getUniformLocation(prog, "X"), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ta); gl.uniform1i(gl.getUniformLocation(prog, "A"), 1); gl.activeTexture(gl.TEXTURE0);
    gl.uniform1ui(gl.getUniformLocation(prog, "L"), l); gl.uniform1i(gl.getUniformLocation(prog, "rows"), rows); gl.uniform1i(gl.getUniformLocation(prog, "mode"), mode); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.readPixels(0, 0, NN, 1, gl.RGBA, gl.FLOAT, rd); const out = new Float32Array(NN); for (let i = 0; i < NN; i++) out[i] = rd[i * 4]; return out; };
  return { kind: "WebGL2 fragment-shader fallback", info: String(gl.getParameter(gl.RENDERER)), fwd: (l, x, rows, add) => call(l, x, rows, add, 0), bwd: (l, g, rows) => call(l, g, rows, null, 1) }; }
// --- LoRA adapters into all 4 body layers: W_l + A_l·B_l, rank 16. Exact backprop through the procedural weights via the transpose kernel ---
const RK = 16;
class Lora { A: Float32Array[]; B: Float32Array[]; constructor() { this.A = Array.from({ length: NL }, () => new Float32Array(NN * RK)); this.B = Array.from({ length: NL }, () => { const b = new Float32Array(RK * NN); for (let i = 0; i < b.length; i++) b[i] = ((osU32() / 4294967296) * 2 - 1) * 0.02; return b; }); }
  count(): number { return NL * 2 * NN * RK; }
  z(l: number, h: Float32Array): Float32Array { const z = new Float32Array(RK), B = this.B[l]; for (let k = 0; k < RK; k++) { let s = 0; const off = k * NN; for (let i = 0; i < NN; i++) s += B[off + i] * h[i]; z[k] = s; } return z; }
  add(l: number, z: Float32Array, rows: number): Float32Array { const a = new Float32Array(NN), A = this.A[l]; for (let o = 0; o < rows; o++) { let s = 0; const off = o * RK; for (let k = 0; k < RK; k++) s += A[off + k] * z[k]; a[o] = s; } return a; } }
function linkProg(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null { const mk = (t: number, s: string): WebGLShader | null => { const sh = gl.createShader(t); if (!sh) return null; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; } return sh; };
  const a = mk(gl.VERTEX_SHADER, vs), b = mk(gl.FRAGMENT_SHADER, fs); if (!a || !b) return null; const p = gl.createProgram(); if (!p) return null; gl.attachShader(p, a); gl.attachShader(p, b); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; } return p; }
function quad(gl: WebGL2RenderingContext, _p: WebGLProgram): void { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); }

// --- HDR renderer: raymarched SDF body, iridescent thin-film + subsurface skin, bloom, ACES, chromatic aberration ---
const VS = `#version 300 es\nin vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;
const SCENE_FS = `#version 300 es
precision highp float; precision highp int; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T; uniform vec3 Lp[48]; uniform vec4 N; uniform vec4 N2; uniform vec4 Q; uniform vec2 M; uniform float calm; uniform vec4 W4;
uniform highp sampler2D ACT; uniform uint RG[16]; uniform vec4 QP; uniform float EN; uniform float WS; uniform vec4 CUT; uniform float SIG;
// Body plan: short asymmetric hollow shell (cutaway) with spines, membrane fin, red eye cluster and limbs outside;
// inside: 4 nested activation shells (real 100M-net activations), a second brain lobe, RV32I register die, 2-qubit core, energy organ, signal fibers.
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float cap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float capH(vec3 p, vec3 a, vec3 b){ vec3 pa=p-a, ba=b-a; return clamp(dot(pa,ba)/dot(ba,ba),0.,1.); }
float box(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
vec3 rot4(vec3 p){ vec4 q=vec4(p, W4.x); float c=cos(W4.y), s=sin(W4.y); q.xw=mat2(c,-s,s,c)*q.xw; c=cos(W4.z); s=sin(W4.z); q.yw=mat2(c,-s,s,c)*q.yw; return q.xyz/(1.6-q.w*.35); }
const vec3 C0=vec3(0.,.02,0.), C2=vec3(.2,.13,-.07), CPU=vec3(-.15,-.13,.04), QA=vec3(.05,-.17,.12), QB=vec3(.12,-.15,.07), ORG=vec3(-.13,.1,-.13);
float body(vec3 p){ vec3 bp=rot4(p)*1.6; float n=sin(bp.x*9.+T*.5*(1.-calm*.6))*sin(bp.y*7.-T*.4)*sin(bp.z*8.+T*.3);
  float d=length(p*vec3(1.,1.12,.95))-(.36+.03*N.x); d=smin(d, length(p-vec3(.21,.12,-.07))-.22, .1); d=smin(d, length(p-vec3(-.17,-.11,.1))-.19, .1); d=smin(d, length(p-vec3(.02,-.2,-.12))-.15, .08);
  return d + n*(.018+.025*N.y); }
float shellD(vec3 p){ float d=abs(body(p))-.018; float cut=dot(p,CUT.xyz)-CUT.w; return max(d, cut); }
vec2 opU(vec2 a, vec2 b){ return a.x<b.x?a:b; }
vec2 outer(vec3 p){ vec2 r=vec2(shellD(p),0.);
  // limbs: 5 of the 8 simulated chains, shortened and of unequal thickness
  float dl=1e9; for(int l=0;l<8;l++){ if(l==2||l==5||l==7) continue; float th=.03+.012*float(l%3); for(int s=0;s<5;s++){ int k=l*6+s; vec3 a=Lp[k]*.62, b=Lp[k+1]*.62; dl=smin(dl, cap(p,a,b, th*(1.-float(s)/6.)+.006), .05); } } r=opU(r, vec2(dl,1.));
  // dorsal spines, unequal
  float ds=1e9; for(int i=0;i<7;i++){ float a=-.9+float(i)*.32; vec3 b=vec3(sin(a)*.3, .26+.04*sin(float(i)*2.1), cos(a)*.18-.05); vec3 tip=b+normalize(b-vec3(0.,-.1,0.))*(.12+.1*fract(sin(float(i)*12.9)*437.))+vec3(0.,.02*sin(T*.6+float(i)),0.); ds=min(ds, cap(p,b,tip,.012*(1.+float(i%2)))); } r=opU(r, vec2(ds,1.));
  // membrane fin between two limbs (thin, perforated)
  vec3 q=p-vec3(-.34,.02,-.05); float dm=max(abs(q.z+.15*q.x*q.x)-.004, length(q.xy)-.2); dm=max(dm, -(length(fract(q.xy*16.)-.5)-.18)); r=opU(r, vec2(dm,3.));
  // eye cluster: 7 red eyes of different sizes on the right-front
  float de=1e9; for(int e=0;e<7;e++){ float a=float(e)*2.4; vec3 c=vec3(.26+.05*cos(a), .05+.07*sin(a), .26+.03*cos(a*1.7)); de=min(de, length(p-c)-(.02+.012*fract(float(e)*.37))); } r=opU(r, vec2(de,2.));
  return r; }
vec2 inner(vec3 p){ vec3 q=p-C0; float rr=length(q); vec2 r=vec2(1e9,0.);
  for(int l=0;l<4;l++){ float R0=.07+.032*float(l); float d=abs(rr-R0)-.004; vec3 g=abs(fract(q*28.)-.5); d=max(d, -(min(g.x,min(g.y,g.z))-.12)); r=opU(r, vec2(d,10.+float(l))); }
  r=opU(r, vec2(length(p-C2)-.06+.006*sin(p.x*70.)*sin(p.y*60.), 20.));
  r=opU(r, vec2(box(p-CPU, vec3(.07,.012,.045)), 21.));
  r=opU(r, vec2(min(length(p-QA), length(p-QB))-.026, 22.));
  r=opU(r, vec2(length((p-ORG)*vec3(1.,1.3,1.))-(.05+.012*EN*sin(T*1.6)), 23.));
  float df=1e9; df=min(df, cap(p,C0,C2,.006)); df=min(df, cap(p,C0,CPU,.006)); df=min(df, cap(p,C0,(QA+QB)*.5,.006)); df=min(df, cap(p,C0,ORG,.006)); df=min(df, cap(p,C0,vec3(.26,.05,.26),.005)); r=opU(r, vec2(df,24.));
  return r; }
vec2 map(vec3 p){ return opU(outer(p), inner(p)); }
vec3 nrm(vec3 p){ vec2 e=vec2(.0012,0); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
vec3 film(float c, float th){ vec3 l=vec3(650.,530.,440.); return .5+.5*cos(6.2832*(2.*1.33*th*c)/l); }
vec3 hue(float h){ return .5+.5*cos(6.2832*(h+vec3(0.,.33,.67))); }
float act(int l, vec3 q){ float u=atan(q.z,q.x)/6.2832+.5, v=acos(clamp(q.y/max(length(q),1e-4),-1.,1.))/3.1416; return texelFetch(ACT, ivec2(clamp(int(u*100.),0,99), l*50+clamp(int(v*50.),0,49)), 0).r; }
vec3 shade(vec3 p, vec3 rd, float id, out float alpha){ vec3 n=nrm(p), v=-rd, L=normalize(vec3(.5,.8,.4)); float c=max(dot(n,v),0.), dif=max(dot(n,L),0.), fr=pow(1.-c,3.); float spec=pow(max(dot(reflect(-L,n),v),0.),60.); alpha=1.;
  if(id<.5){ // hollow shell: moss base, iridescent thin film, neon glitch bands, fresnel transparency
    vec3 moss=vec3(.05,.16,.04); vec3 ir=film(c, 260.+240.*N.w); float band=step(.86, fract(p.y*14.+floor(T*.5)*.37))*(1.-calm);
    alpha=mix(.06,.5,fr); return moss*(.15+.6*dif)+ir*fr*.55+hue(p.y*2.+T*.03)*band*.5+spec*vec3(.9)+vec3(1.,.15,.1)*N2.x*.6; }
  if(id<1.5){ float tip=smoothstep(.35,.0,length(p)-.42); vec3 base=mix(vec3(.003,.003,.004),vec3(.05,.16,.04),smoothstep(.2,.5,length(p))); return base*(.25+dif)+film(c,300.+200.*sin(p.y*9.))*fr*.7+hue(length(p)*3.+T*.02)*(1.-tip)*.35*(1.-calm*.5)+spec*vec3(.6); }
  if(id<2.5){ vec3 look=normalize(vec3(M*.6,1.)); float pupil=smoothstep(.85,.97,dot(n,look)); return mix(vec3(1.6,.05,.03)*(1.+Q.x), vec3(0.), pupil)+vec3(2.)*spec; }
  if(id<3.5){ alpha=.55; return film(c,200.+300.*N.z)*.9+vec3(.9,.35,.05)*.2; }
  if(id<14.){ int l=int(id-10.+.5); float a=act(l, p-C0); return hue(.6+a*.35+float(l)*.08)*(.15+1.6*abs(a))*(1.-.4*calm); }
  if(id<20.5) return vec3(.5,.2,.6)*(.2+dif)+vec3(.9,.3,1.)*.5*abs(N.z)*(.5+.5*sin(p.x*80.+p.y*70.));
  if(id<21.5){ vec2 cell=(p.xz-CPU.xz)/vec2(.14,.09)+.5; int ci=clamp(int(cell.x*8.),0,7)+8*clamp(int(cell.y*2.),0,1); uint w=RG[ci]; int bit=clamp(int(fract(cell.x*8.)*4.)+4*int(fract(cell.y*2.)*2.),0,7);
    float on=float((w>>uint(bit*4+int(fract(cell.y*8.)*1.)))&1u); return n.y>.5 ? mix(vec3(.02,.03,.02), vec3(.1,1.4,.3), on) : vec3(.03)*(.3+dif); }
  if(id<22.5){ vec3 b=normalize(vec3(QP.y-QP.z, QP.x-QP.w, QP.y+QP.z-.5)); float ax=pow(max(dot(n,b),0.),20.); return vec3(.2,.5,1.4)*(.3+dif)+vec3(1.4,1.2,.3)*ax*2.; }
  if(id<23.5) return vec3(.15,.8,.12)*(.2+1.2*EN)+vec3(1.,.4,.05)*fr;
  float s=.5+.5*sin(length(p-C0)*60.-T*SIG); return vec3(1.,.45,.05)*(.1+1.6*s*s); }
void main(){ vec2 q=(uv*R*2.-R)/R.y; float yaw=M.x*.7+T*.05*(1.-calm*.7), pit=M.y*.4; vec3 ro=vec3(sin(yaw)*1.55, pit+.1, cos(yaw)*1.55); vec3 f=normalize(-ro), r=normalize(cross(vec3(0,1,0),f)), u=cross(f,r);
  vec3 rd=normalize(f*1.6+r*q.x+u*q.y);
  vec3 bg=vec3(.004,.002,.006)+.012*vec3(.05,.2,.05)*(1.-length(q)*.5);
  // orange spores drifting in the dark
  vec2 sg=q*9.+vec2(0.,T*.05); vec2 cid=floor(sg); float hsh=fract(sin(dot(cid,vec2(12.9,78.2)))*43758.5); if(hsh>.86){ vec2 c=fract(sg)-.5-.3*vec2(sin(hsh*40.),cos(hsh*30.)); bg+=vec3(1.2,.4,.04)*smoothstep(.06,0.,length(c))*(.4+.6*hsh); }
  vec3 acc=vec3(0.); float tr=1.; float t=0.; int layers=0;
  for(int i=0;i<110;i++){ vec3 p=ro+rd*t; vec2 h=map(p); if(t>4.) break;
    if(h.x<.0012){ float a; vec3 c=shade(p,rd,h.y,a); acc+=tr*a*c; tr*=1.-a; layers++; if(tr<.03||layers>4) break; t+=.03; continue; }
    t+=max(h.x*.8,.002); }
  vec3 col=acc+tr*bg; o=vec4(col,1.); }`;
const BRIGHT_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; void main(){ vec3 c=texture(S,uv).rgb; o=vec4(max(c-vec3(.9),0.),1.); }`;
const BLUR_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform vec2 D; void main(){ vec3 c=texture(S,uv).rgb*.227; float w[4]=float[](.194,.121,.054,.016); for(int i=1;i<5;i++){ c+=(texture(S,uv+D*float(i)).rgb+texture(S,uv-D*float(i)).rgb)*w[i-1]; } o=vec4(c,1.); }`;
const COMP_FS = `#version 300 es\nprecision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform sampler2D B; uniform float ca; uniform float bloom; uniform float expo;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
void main(){ vec2 d=(uv-.5)*ca; vec3 c=vec3(texture(S,uv+d).r, texture(S,uv).g, texture(S,uv-d).b); c+=texture(B,uv).rgb*bloom; c=aces(c*expo); c=pow(c,vec3(1./2.2)); float vg=1.-.35*dot(uv-.5,uv-.5)*2.; o=vec4(c*vg,1.); }`;
type RT = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };
function mkRT(gl: WebGL2RenderingContext, w: number, h: number): RT { const tex = gl.createTexture() as WebGLTexture; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer() as WebGLFramebuffer; gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); return { fb, tex, w, h }; }

type Hud = { arousal?: number; light?: number; gens?: number; head?: string; loraSteps: number; loraLoss: number; backend: string; gpu: string; inferParams: number; rowsActive: number; learned: number; fps: number; passHz: number; bw: number; bh: number; scale: number; loss: number[]; energy: number; integrity: number; conf: number; ws: string; att: number; probs: number[]; S: number; regs: number[]; pc: number; steps: number; saved: string; mood: string };
const MODS = ["gaze", "sound", "hunger", "novelty"];
const MOODS = ["|00> drift", "|01> hunt", "|10> recoil", "|11> elsewhere"];
const fmt = (n: number): string => n.toLocaleString("en-US");

export default function Creature() {
  const theme = useGrokTheme();
  const cv = useRef<HTMLCanvasElement>(null);
  const LTQ = new URLSearchParams(typeof location !== "undefined" ? location.search : ""); const LIVE = LTQ.get("livetest") === "1"; const [started, setStarted] = useState(LIVE); const [calm, setCalm] = useState(false); const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null); const [glErr, setGlErr] = useState("");
  const [evalItems, setEvalItems] = useState<Item[]>([]); const [evalRun, setEvalRun] = useState(""); const [showJson, setShowJson] = useState(false); const [jsonUrl, setJsonUrl] = useState("");
  const ctl = useRef({ calm: false, muted: false, power: [0, 0, 0, 0] as number[], sound: false, damage: 0 });
  ctl.current.calm = calm; ctl.current.muted = muted;
  const audio = useRef<{ master: GainNode } | null>(null);
  const hudRef = useRef<Hud | null>(null);
  useEffect(() => { if (audio.current) audio.current.master.gain.value = muted ? 0 : 0.12; }, [muted]);

  useEffect(() => {
    if (!started) return; const canvas = cv.current; if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false }); if (!gl || !gl.getExtension("EXT_color_buffer_float")) { setGlErr("WebGL2 with float render targets is not available in this browser, so the body cannot render."); return; }
    const progs = { scene: linkProg(gl, VS, SCENE_FS), bright: linkProg(gl, VS, BRIGHT_FS), blur: linkProg(gl, VS, BLUR_FS), comp: linkProg(gl, VS, COMP_FS) };
    if (!progs.scene || !progs.bright || !progs.blur || !progs.comp) { setGlErr("A shader failed to compile on this GPU."); return; }
    quad(gl, progs.scene);
    const actTex = gl.createTexture() as WebGLTexture; gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 100, 200, 0, gl.RED, gl.FLOAT, new Float32Array(20000)); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.activeTexture(gl.TEXTURE0); let actShown: Float32Array[] = [];
    let alive = true; let engine: Engine | null = null; let busy = false; let passes = 0, passT = performance.now(), passHz = 0; let rows = NN;
    void (async () => { try { engine = await makeWebGPU(); } catch { engine = null; } if (!engine) engine = makeWebGL2Engine(); })();
    // learned readout 5000 -> 8 (trained by the autodiff tape), persisted
    const Wr = new Tn(NN * NOUT), br = new Tn(NOUT); for (let i = 0; i < Wr.v.length; i++) Wr.v[i] = ((osU32() / 4294967296) * 2 - 1) * 0.02; let saved = "new life";
    try { const s = localStorage.getItem("creature1.v2.readout"); if (s) { const b = atob(s); const f = new Float32Array(new Uint8Array(Array.from(b, (c) => c.charCodeAt(0))).buffer); if (f.length === Wr.v.length + NOUT) { Wr.v.set(f.subarray(0, Wr.v.length)); br.v.set(f.subarray(Wr.v.length)); saved = "resumed learned readout from a previous visit"; } } } catch { saved = "storage unavailable; this session only"; }
    const save = (): void => { try { const f = new Float32Array(Wr.v.length + NOUT); f.set(Wr.v); f.set(br.v, Wr.v.length); const u = new Uint8Array(f.buffer); let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...Array.from(u.subarray(i, i + 8192))); localStorage.setItem("creature1.v2.readout", btoa(s)); saved = "learned readout saved " + new Date().toLocaleTimeString(); } catch { /* sandbox */ } };
    let feat: Float32Array = new Float32Array(NN); let out: Float32Array = new Float32Array(NOUT); let lastPredT: Tn | null = null; const lossH: number[] = []; const lora = new Lora(); let layerActs: Float32Array[] = []; let loraLoss = 0, loraSteps = 0; let passMs = 0; let lastTarget: number[] = [0, 0, 0, 0];
    const proj = Array.from({ length: NN }, (_, i) => [i % 24, ((Math.imul(i + 1, 2654435761) >>> 0) % 2) ? 1 : -1]);
    // body, metabolism, workspace, attention schema, metacognition
    const limbs = Array.from({ length: 8 }, (_, l) => ({ a: (l / 8) * 6.283, x: new Float64Array(18), p: new Float64Array(18) }));
    for (const L of limbs) for (let s = 0; s < 6; s++) { L.x[s * 3] = Math.cos(L.a) * 0.4 * (1 + s * 0.2); L.x[s * 3 + 1] = -0.2; L.x[s * 3 + 2] = Math.sin(L.a) * 0.4 * (1 + s * 0.2); }
    let energy = 0.8, integrity = 1, conf = 0.5, t = 0; const att = { ea: 0, ed: 0, P: 1 }; let wsIdx = 0; let curiosity = 0;
    const qs = new QSim(); let S = chsh(160); let collapsed = -1, collapseT = 0; let mood = 0;
    const rv = new RV(); rv.x[10] = osU32() | 1;
    const ABL = (LTQ.get("ablate") || "").split(",").filter(Boolean); const organs = new Organs(Number(LTQ.get("seed")) || (osU32() % 100000), ABL); (window as any).__organs = organs; let frame = 0, startle = 0, arousal = 0.5, light = 0; const LR: { R: number; ar: number; th: number }[] = []; const FR = Number(LTQ.get("frames")) || 480;
    const m = { x: 0, y: 0, vx: 0, vy: 0, in: false, click: 0 };
    const onMove = (e: PointerEvent): void => { const r = canvas.getBoundingClientRect(); const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1); m.vx = nx - m.x; m.vy = ny - m.y; m.x = nx; m.y = ny; m.in = true; };
    const onLeave = (): void => { m.in = false; }; const onDown = (): void => { m.click = 1; startle = Math.max(startle, organs.poke((m.x > 0 ? "R" : "L") + (m.y > 0 ? "U" : "D"))); /* habituation organ */ };
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave); canvas.addEventListener("pointerdown", onDown);
    let A: { ac: AudioContext; master: GainNode; shep: { o: OscillatorNode; g: GainNode }[]; bl: OscillatorNode; br: OscillatorNode; voice: OscillatorNode; f1: BiquadFilterNode; pan: PannerNode; an: AnalyserNode | null } | null = null;
    if (ctl.current.sound) { try { const ac = new AudioContext(); const master = ac.createGain(); master.gain.value = ctl.current.muted ? 0 : 0.12; const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      const shep = Array.from({ length: 8 }, () => { const o = ac.createOscillator(); const g = ac.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start(); return { o, g }; });
      const mg = ac.createChannelMerger(2); const bl = ac.createOscillator(), brr = ac.createOscillator(); const bg = ac.createGain(); bg.gain.value = 0.2; bl.frequency.value = 110; brr.frequency.value = 116; bl.connect(mg, 0, 0); brr.connect(mg, 0, 1); mg.connect(bg); bg.connect(master); bl.start(); brr.start();
      const voice = ac.createOscillator(); voice.type = "sawtooth"; const f1 = ac.createBiquadFilter(); f1.type = "bandpass"; f1.Q.value = 10; const vg = ac.createGain(); vg.gain.value = 0.25; const pan = ac.createPanner(); pan.panningModel = "HRTF"; pan.positionZ.value = -1.5; voice.connect(f1); f1.connect(vg); vg.connect(pan); pan.connect(master); voice.start();
      A = { ac, master, shep, bl, br: brr, voice, f1, pan, an: null }; audio.current = { master }; } catch { A = null; } }
    (window as unknown as { __c1mic?: () => void }).__c1mic = () => { if (!A) return; const a = A; void navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => { const an = a.ac.createAnalyser(); an.fftSize = 512; a.ac.createMediaStreamSource(st).connect(an); a.an = an; }).catch(() => undefined); };
    // render targets with adaptive resolution (backbuffer capped at 3840 px wide)
    let scale = Math.min(2, devicePixelRatio || 1); let rts: RT[] = []; let bw = 0, bh = 0; const fpsH: number[] = [];
    const resize = (): void => { const cw = canvas.clientWidth, ch = canvas.clientHeight; const s = Math.min(scale, 3840 / Math.max(1, cw)); bw = Math.max(64, Math.floor(cw * s)); bh = Math.max(64, Math.floor(ch * s)); canvas.width = bw; canvas.height = bh;
      rts = [mkRT(gl, bw, bh), mkRT(gl, bw >> 2, bh >> 2), mkRT(gl, bw >> 2, bh >> 2)]; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    const U = (p: WebGLProgram, n: string): WebGLUniformLocation | null => gl.getUniformLocation(p, n);
    const lpArr = new Float32Array(48 * 3);
    let raf = 0, prev = performance.now(), lastHud = 0, lastSave = performance.now(), lastAdapt = performance.now();
    const loop = (now: number): void => { if (!alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - prev) / 1000); fpsH.push((now - prev) / 1000); prev = now; /* raw frame time: v2 pushed the clamped dt, which overstated fps */ if (fpsH.length > 60) fpsH.shift(); const C = ctl.current; const ck = C.calm ? 0.4 : 1; t += dt * ck;
      const fps = fpsH.length / fpsH.reduce((a, b) => a + b, 0);
      if (now - lastAdapt > 1500 && fpsH.length > 30) { lastAdapt = now; const ns = fps < 40 ? Math.max(0.5, scale * 0.8) : fps > 57 ? Math.min(Math.min(4, (devicePixelRatio || 1) * 2), scale * 1.15) : scale; if (Math.abs(ns - scale) > 0.02) { scale = ns; resize(); } }
      let mic = 0; if (A && A.an) { const b = new Uint8Array(A.an.fftSize); A.an.getByteTimeDomainData(b); let s = 0; for (const v of b) s += (v - 128) ** 2; mic = Math.min(1, Math.sqrt(s / b.length) / 30); }
      const gx = m.in ? m.x : Math.sin(t * 0.21) * 0.6, gy = m.in ? m.y : Math.cos(t * 0.13) * 0.4;
      // RV32I core: 8 loop iterations per frame
      rv.mem.setInt32(256, Math.floor(1 + 600 * Math.hypot(m.vx, m.vy)), true); for (let i = 0; i < PROGRAM.length * 8; i++) rv.step(); const phase = rv.mem.getInt32(260, true) * 0.002, mut = rv.mem.getUint32(264, true);
      frame++; light = (frame % 24) < 12 ? 1 : 0; arousal = organs.circ(light); organs.recover(); startle *= 0.8; if (frame % 30 === 0) organs.mutate(mut); /* live organs: circadian, habituation, lineage */
      // attention schema (Kalman model of where its own attention is; noisy observation = gaze)
      { const obs = gx + (((mut >>> 8) & 255) / 255 - 0.5) * 0.3; const Kg = att.P / (att.P + 0.3); att.ea += Kg * (obs - att.ea) + att.ed; att.ed = 0.95 * att.ed + 0.05 * Kg * (obs - att.ea); att.P = (1 - Kg) * att.P + 0.02; }
      // workspace: 4 modules compete by salience, winner broadcast
      const salience = [Math.hypot(m.vx, m.vy) * 40 + (m.in ? 0.3 : 0), mic * 2, Math.max(0, 0.6 - energy) * 3, curiosity * 8];
      wsIdx = salience.indexOf(Math.max(...salience));
      const senses = [gx, gy, m.vx * 20, m.vy * 20, m.click, mic, energy * 2 - 1, integrity * 2 - 1, conf, curiosity * 4, ...qs.probs(), Math.sin(phase), Math.cos(phase), wsIdx / 3, att.ea, att.ed * 10, Math.sin(t * 0.3), Math.cos(t * 0.17), ((mut >>> 4) & 255) / 128 - 1, C.power[0] > 0 ? 1 : 0, C.power[1] > 0 ? 1 : 0];
      // GPU brain: asynchronous forward pass of the 100M procedural network; readout learns online
      if (engine && !busy) { busy = true; const x = new Float32Array(NN); for (let i = 0; i < NN; i++) x[i] = senses[proj[i][0]] * proj[i][1] * (1 - C.damage * ((i * 7919) % 100 < 40 ? 1 : 0));
        const eng = engine; const tgt = lastTarget.slice(); const pStart = performance.now(); void (async () => { const hs: Float32Array[] = [x]; const zs: Float32Array[] = []; const ro = (l: number): number => (l === NL - 1 ? NN : rows);
          for (let l = 0; l < NL; l++) { const z = lora.z(l, hs[l]); zs.push(z); hs.push(await eng.fwd(l, hs[l], ro(l), lora.add(l, z, ro(l)))); }
          feat = hs[NL]; layerActs = hs.slice(1);
          // LoRA training: exact gradient of the readout loss through all 4 layers (transpose kernel on the GPU for W_lᵀδ)
          let g: Float32Array = new Float32Array(NN); { const pr = new Float32Array(NOUT); for (let o = 0; o < NOUT; o++) { let s = br.v[o]; const off = o * NN; for (let i = 0; i < NN; i++) s += Wr.v[off + i] * feat[i]; pr[o] = Math.tanh(s); }
            let L = 0; for (let o = 0; o < tgt.length; o++) { const e = pr[o] - tgt[o]; L += e * e / tgt.length; const gp = 2 * e / tgt.length * (1 - pr[o] * pr[o]); const off = o * NN; for (let i = 0; i < NN; i++) g[i] += gp * Wr.v[off + i]; } loraLoss = L; }
          const lr = 0.002 * (0.3 + energy);
          for (let l = NL - 1; l >= 0; l--) { const h = hs[l + 1], R = ro(l); const d = new Float32Array(NN); for (let o = 0; o < R; o++) d[o] = g[o] * (1 - h[o] * h[o]);
            const A = lora.A[l], B = lora.B[l], z = zs[l]; const at = new Float32Array(RK); for (let o = 0; o < R; o++) { const dv = d[o]; if (!dv) continue; const off = o * RK; for (let k = 0; k < RK; k++) at[k] += A[off + k] * dv; }
            let gn: Float32Array | null = l > 0 ? await eng.bwd(l, d, R) : null; if (gn) { for (let i = 0; i < NN; i++) { let s = 0; for (let k = 0; k < RK; k++) s += B[k * NN + i] * at[k]; gn[i] = gn[i] * 0.0245 + s; } }
            const cl = (v: number): number => Math.max(-0.05, Math.min(0.05, v)); const hp = hs[l];
            for (let o = 0; o < R; o++) { const dv = d[o]; if (!dv) continue; const off = o * RK; for (let k = 0; k < RK; k++) A[off + k] -= lr * cl(dv * z[k]); }
            for (let k = 0; k < RK; k++) { const ak = at[k]; if (!ak) continue; const off = k * NN; for (let i = 0; i < NN; i++) B[off + i] -= lr * cl(ak * hp[i]); }
            if (gn) g = gn; }
          loraSteps++; passes++; const pd = performance.now() - pStart; passMs = passMs ? passMs * 0.7 + pd * 0.3 : pd; })().catch(() => { /* lost GPU */ }).finally(() => { busy = false; }); }
      if (now - passT > 1000) { passHz = passMs ? 1000 / passMs : 0; passes = 0; passT = now; /* from measured pass duration (forward + LoRA backward) */ if (passHz < 2 && rows > 1250) rows = Math.floor(rows * 0.75); else if (passHz > 20 && rows < NN) rows = Math.min(NN, Math.floor(rows * 1.25)); }
      const target = [gx, gy, energy * 2 - 1, integrity * 2 - 1]; lastTarget = target;
      if (lastPredT) { const Ls = mseTn(lastPredT, target); backwardTn(Ls); const lr = 0.0006 * (0.3 + energy) * (integrity > 0.3 ? 1 : 0.3); for (const P of [Wr, br]) { for (let k = 0; k < P.v.length; k++) P.v[k] -= lr * Math.max(-1, Math.min(1, P.g[k])); P.g.fill(0); }
        curiosity = curiosity * 0.95 + Ls.v[0] * 0.05; conf = conf * 0.95 + 0.05 * Math.exp(-Ls.v[0] * 4); lossH.push(Ls.v[0]); if (lossH.length > 120) lossH.shift(); }
      const xin = new Tn(NN); xin.v.set(feat); const pred = tanhTn(linT(xin, Wr, br, NN, NOUT)); lastPredT = pred; out = pred.v;
      // metabolism, homeostasis, damage & repair
      const activity = Math.abs(out[4]) * 0.4 + C.power.reduce((a, b) => a + (b > 0 ? 0.5 : 0), 0) + m.click;
      energy = Math.max(0, Math.min(1, energy + dt * (0.03 * (1 - activity) - 0.03 * activity + 0.03 * (0.7 - energy))));
      if (C.damage > 0) { integrity = Math.max(0, integrity - dt * 0.4); C.damage = Math.max(0, C.damage - dt * 0.05 * energy); } else integrity = Math.min(1, integrity + dt * 0.05 * energy);
      // quantum mood
      qs.reset(); qs.ry(0, (out[5] + 1) * 1.57 + curiosity * 2); qs.ry(1, (out[6] + 1) * 1.57 * energy + m.click); qs.cx(); const probs = qs.probs();
      if (collapseT > 0) collapseT -= dt; else collapsed = -1; if (m.click && collapsed < 0) { collapsed = qs.measure(osU32() / 4294967296); collapseT = 2.5; }
      { const am = probs.indexOf(Math.max(...probs)); mood = collapsed >= 0 ? collapsed : probs[am] > probs[mood] + 0.08 ? am : mood; }
      if (Math.floor(now / 30000) !== Math.floor((now - dt * 1000) / 30000)) S = chsh(160);
      // limbs: damped Hamiltonian chains, symplectic Euler, driven by network outputs and the broadcast module
      for (let l = 0; l < 8; l++) { const L = limbs[l]; const reach = (0.5 + 0.25 * out[l % NOUT] + 0.15 * Math.sin(t * 1.3 + l + phase)) * (0.4 + 0.6 * integrity) * (C.power[0] > 0 ? 1.4 : 1) * (ABL.includes("circbody") ? 1 : 0.7 + 0.6 * arousal) * (1 + 1.2 * startle);
        for (let s = 0; s < 6; s++) { const u = (s + 1) / 6; const sw = Math.sin(t * 1.7 + l * 0.8 + u * 3) * 0.3 * u + (wsIdx === 0 ? 0.3 * u : 0) * Math.sign(gx - Math.cos(L.a));
          const tx = Math.cos(L.a + sw) * (0.35 + u * reach) + gx * u * u * (mood === 1 ? 0.5 : 0.2), ty = -0.25 + Math.sin(t + l + u * 2) * 0.15 * u + gy * u * u * 0.3 - (C.power[2] > 0 ? 0.3 * u : 0), tz = Math.sin(L.a + sw) * (0.35 + u * reach);
          limbNodeStep(L.x, L.p, s * 3, [tx, ty, tz], dt, energy, ck); /* shared with V2.1-25 scale test */ }
        lpArr.set([0, 0, 0], (l * 6) * 3); for (let s = 0; s < 5; s++) lpArr.set([L.x[s * 3], L.x[s * 3 + 1], L.x[s * 3 + 2]], (l * 6 + s + 1) * 3); }
      if (LIVE) LR.push({ R: limbs.reduce((a, L) => a + Math.hypot(L.x[15], L.x[17]), 0) / 8, ar: arousal, th: organs.th });
      if (LIVE) { const poke = (fx: number, fy: number): void => { const r = canvas.getBoundingClientRect(); const o = { clientX: r.left + fx * r.width, clientY: r.top + fy * r.height }; canvas.dispatchEvent(new PointerEvent("pointermove", o)); canvas.dispatchEvent(new PointerEvent("pointerdown", o)); };
        if (frame >= 40 && frame <= 116 && (frame - 40) % 4 === 0) poke(0.75, 0.25); if (frame === 124) poke(0.25, 0.75);
        if (frame === FR) { const ta = organs.tamperAudit(100, mulberry((Number(LTQ.get("seed")) || 0) * 53 + 1)); const el = document.createElement("pre"); el.id = "livetest"; el.textContent = JSON.stringify({ R: LR.map((x) => +x.R.toFixed(5)), ar: LR.map((x) => +x.ar.toFixed(4)), th: LR.map((x) => +x.th.toFixed(4)), tamper: ta, gens: organs.G.length, head: organs.head() }); document.body.appendChild(el); } }
      for (let k = 0; k < 4; k++) C.power[k] = Math.max(0, C.power[k] - dt);
      if (A) { const ac = A.ac; const sp = (t * 0.03 * (C.power[1] > 0 ? -3 : 1) + out[7] * 0.2) % 1; const ph = sp < 0 ? sp + 1 : sp;
        A.shep.forEach((s, k) => { const f = 30 * Math.pow(2, k + ph); const lg = Math.log2(f / 300); s.o.frequency.setTargetAtTime(f, ac.currentTime, 0.05); s.g.gain.setTargetAtTime(Math.exp(-lg * lg / 2.5) * 0.05 * (0.4 + energy), ac.currentTime, 0.1); });
        A.br.frequency.setTargetAtTime(114 + 4 * out[3] + curiosity * 15, ac.currentTime, 0.3); A.voice.frequency.setTargetAtTime(70 + 40 * (out[2] + 1) + mic * 50, ac.currentTime, 0.2); A.f1.frequency.setTargetAtTime(400 + 900 * (out[1] + 1), ac.currentTime, 0.15);
        A.pan.positionX.setTargetAtTime(Math.sin(t * 0.15) * 1.2, ac.currentTime, 0.5); }
      if (now - lastSave > 20000) { save(); lastSave = now; }
      m.click = 0; m.vx *= 0.8; m.vy *= 0.8;
      // ---- render ----
      const sp = progs.scene as WebGLProgram; gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fb); gl.viewport(0, 0, bw, bh); gl.useProgram(sp);
      gl.uniform2f(U(sp, "R"), bw, bh); gl.uniform1f(U(sp, "T"), t); gl.uniform3fv(U(sp, "Lp"), lpArr); gl.uniform4f(U(sp, "N"), out[0], out[1], out[2], out[3]); gl.uniform4f(U(sp, "N2"), integrity < 0.7 ? 1 - integrity : 0, C.calm ? 0 : Math.max(0, out[4]) * 0.5, 0, wsIdx === 1 ? 1 : 0.2);
      gl.uniform4f(U(sp, "Q"), collapsed >= 0 ? 1 : probs[3], probs[1] + (C.power[3] > 0 ? 1 : 0), 0, 0); gl.uniform2f(U(sp, "M"), att.ea, gy); gl.uniform1f(U(sp, "calm"), C.calm ? 1 : 0);
      gl.uniform4f(U(sp, "W4"), 0.3 * out[5], t * 0.11 * ck + (C.power[0] > 0 ? t * 0.5 : 0), t * 0.07 * ck + out[6] * 0.5, 0); if (layerActs.length === NL && layerActs !== actShown) { actShown = layerActs; const a = new Float32Array(100 * 200); for (let l = 0; l < NL; l++) a.set(layerActs[l].subarray(0, 5000), l * 5000); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 100, 200, gl.RED, gl.FLOAT, a); }
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, actTex); gl.uniform1i(U(sp, "ACT"), 2); gl.activeTexture(gl.TEXTURE0);
      gl.uniform1uiv(U(sp, "RG"), new Uint32Array(Array.from(rv.x.slice(0, 16), (v) => v >>> 0))); gl.uniform4f(U(sp, "QP"), probs[0], probs[1], probs[2], probs[3]); gl.uniform1f(U(sp, "EN"), energy); gl.uniform1f(U(sp, "WS"), wsIdx);
      { const yaw = att.ea * 0.7 + t * 0.05 * (C.calm ? 0.3 : 1) + 0.6; const nx = Math.sin(yaw), nz = Math.cos(yaw), ny = 0.25, nl = Math.hypot(nx, ny, nz); gl.uniform4f(U(sp, "CUT"), nx / nl, ny / nl, nz / nl, 0.04 + 0.08 * Math.sin(t * 0.1)); }
      gl.uniform1f(U(sp, "SIG"), (4 + 6 * Math.min(1, passHz / 2)) * (C.calm ? 0.5 : 1)); /* fiber pulse ≤ 10 rad/s = 1.6 Hz at any pixel, below the 3 Hz limit */
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      const bp = progs.bright as WebGLProgram, bl = progs.blur as WebGLProgram, cp = progs.comp as WebGLProgram;
      gl.bindFramebuffer(gl.FRAMEBUFFER, rts[1].fb); gl.viewport(0, 0, rts[1].w, rts[1].h); gl.useProgram(bp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rts[0].tex); gl.uniform1i(U(bp, "S"), 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(bl); for (const [src, dst, dx, dy] of [[1, 2, 1, 0], [2, 1, 0, 1], [1, 2, 2, 0], [2, 1, 0, 2]] as const) { gl.bindFramebuffer(gl.FRAMEBUFFER, rts[dst].fb); gl.bindTexture(gl.TEXTURE_2D, rts[src].tex); gl.uniform1i(U(bl, "S"), 0); gl.uniform2f(U(bl, "D"), dx / rts[1].w, dy / rts[1].h); gl.drawArrays(gl.TRIANGLES, 0, 6); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, bw, bh); gl.useProgram(cp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rts[0].tex); gl.uniform1i(U(cp, "S"), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rts[1].tex); gl.uniform1i(U(cp, "B"), 1);
      gl.uniform1f(U(cp, "ca"), C.calm ? 0.002 : 0.006 + 0.02 * curiosity + (C.power[3] > 0 ? 0.012 : 0)); gl.uniform1f(U(cp, "bloom"), C.calm ? 0.5 : 1.1 + 0.6 * Math.max(0, out[3])); gl.uniform1f(U(cp, "expo"), 1.1 + 0.3 * energy); gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (now - lastHud > 250) { lastHud = now; const h: Hud = { backend: engine ? engine.kind : "starting…", gpu: engine ? engine.info : "", inferParams: (NL - 1) * rows * NN + NN * NN, rowsActive: rows, learned: NN * NOUT + NOUT + lora.count(), loraSteps, loraLoss, fps, passHz, bw, bh, scale, loss: lossH.slice(), energy, integrity, conf,
        arousal, light, gens: organs.G.length, head: organs.head(), ws: MODS[wsIdx], att: att.ea, probs, S, regs: Array.from(rv.x.slice(0, 16)), pc: rv.pc, steps: rv.steps, saved, mood: collapsed >= 0 ? "collapsed → " + MOODS[collapsed] : "superposed, leaning " + MOODS[mood] }; hudRef.current = h; setHud(h); } };
    const onKey = (e: globalThis.KeyboardEvent): void => { const k = "1234".indexOf(e.key); if (k >= 0) ctl.current.power[k] = 3; };
    window.addEventListener("keydown", onKey); raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); save(); window.removeEventListener("keydown", onKey); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("pointerdown", onDown); if (A) void A.ac.close(); audio.current = null; };
  }, [started]);

  const runEval = (): void => { setEvalItems([]); const acc: Item[] = []; let i = 0; const t0 = performance.now(); const STEPS2: [string, () => Item[]][] = [...STEPS, ["Prereg v2", runV2], ["Prereg v2.1", v21Tests]];
    const next = (): void => { if (i < STEPS2.length) { setEvalRun(`running ${STEPS2[i][0]} (${i + 1}/${STEPS2.length})…`); const f = STEPS2[i][1]; setTimeout(() => { acc.push(...f()); i++; setEvalItems(acc.slice()); next(); }, 10); return; }
      const ci = acc.findIndex((x) => x.id === "ctm"); acc.splice(ci + 1, 0, butlinRollup(acc));
      const sc = substrateCheck(); const a1 = JSON.stringify(rpt1()), a2 = JSON.stringify(rpt1()); const h = hudRef.current;
      for (const it of acc) { if (it.id === "23") it.note = `RV32I machine code vs native JS xorshift32: ${sc.n} outputs ${sc.ok ? "identical" : "MISMATCH"}`; if (it.id === "24") it.note = `RPT-1 re-run with same seeds: ${a1 === a2 ? "bit-identical" : "DIFFERENT"}`;
        if (it.id === "25") it.note = h ? `${fmt(h.inferParams)} inference weights (${h.backend}), ${h.bw}×${h.bh} HDR backbuffer, ${h.fps.toFixed(0)} fps, ${h.passHz.toFixed(1)} brain passes/s` : "start the creature to measure"; }
      setEvalItems(acc.slice()); setEvalRun(`done in ${((performance.now() - t0) / 1000).toFixed(1)} s · 16 seeds per condition`);
      try { const blob = new Blob([JSON.stringify({ disclaimer: "Functional indicator tests on the creature's core mechanisms in seeded toy tasks. Not evidence of consciousness. No aggregate score.", criteria: "pass iff Cohen's d >= 0.8 and Welch t >= 2.75 vs every control, 16 seeds", items: acc }, null, 1)], { type: "application/json" }); setJsonUrl(URL.createObjectURL(blob)); } catch { setJsonUrl(""); } };
    next(); };

  const mono = { fontFamily: theme.font.mono, fontSize: 11, lineHeight: "15px", color: theme.text.secondary } as const;
  const panel = { border: `1px solid ${theme.border.default}`, borderRadius: 12, padding: 12, minWidth: 0 } as const;
  const h = (s: string) => <div style={{ fontSize: 12, fontWeight: 600, color: theme.text.primary, marginBottom: 6 }}>{s}</div>;
  const spark = (a: number[]) => { const mx = Math.max(1e-6, ...a); return <svg width="100%" height="36" viewBox="0 0 120 36" preserveAspectRatio="none"><polyline fill="none" stroke={theme.dataviz.categorical[0]} strokeWidth="1.5" points={a.map((v, i) => `${(i / Math.max(1, a.length - 1)) * 120},${34 - (v / mx) * 32}`).join(" ")} /></svg>; };
  const fx = (v: number): string => (Number.isFinite(v) ? (Math.abs(v) >= 1000 ? v.toExponential(1) : v.toFixed(2)) : "∞");
  const ok = theme.dataviz.categorical[2], bad = theme.dataviz.categorical[1];
  const row = (it: Item) => <div key={it.id + it.group} style={{ borderTop: `1px solid ${theme.border.default}`, padding: "6px 0" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}><span style={{ fontFamily: theme.font.mono, fontSize: 11, fontWeight: 700, color: it.category === "Implementation identified" ? theme.text.secondary : it.pass ? ok : bad, minWidth: 40 }}>{it.category === "Implementation identified" ? "IMPL" : it.pass ? "PASS" : "FAIL"}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{it.id} · {it.name}</span>{it.group === "CQM-25" && <span style={{ ...mono }}>[{it.category}]</span>}</div>
    <div style={mono}>{it.metric} · {it.mechanism}{it.note ? ` · ${it.note}` : ""}</div>
    {it.cmps.map((c, k) => <div key={k} style={{ ...mono, paddingLeft: 48 }}>{c.pass ? "✓" : "✗"} vs {c.control}: full {fx(c.full)} vs {fx(c.ctrl)} · d={fx(c.d)} · t={fx(c.t)}</div>)}</div>;
  const groups: [string, string][] = [["Butlin", "(a) Butlin et al. 14 indicators"], ["Framework", "(b) 10 frameworks and their falsifiers"], ["CQM-25", "(c) CQM-25 dimensions"], ["Prereg v2", "(d) Pre-registration v2: new non-ceiling tests for active inference, CQM-10, CQM-21 (v1 results above stay as they are)"], ["Prereg v2.1", "(e) Pre-registration v2.1: substrate pluralism, reproducibility, scale (the GPU comparisons need a GPU record from measure_gpu.ts; without one they show as failed in the page)"]];
  const RN = ["zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2", "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5"];
  return (
    <div style={{ color: theme.text.primary, fontFamily: theme.font.family, display: "flex", flexDirection: "column", gap: 12, padding: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 600 }}>Creature #1 · v3</div>
      <div style={{ color: theme.text.secondary, fontSize: 13 }}>A promptless artificial organism. Its brain is a 4-layer, 100,000,000-weight network evaluated on the GPU every pass, with weights regenerated procedurally from a seed instead of stored. Rank-16 LoRA adapters inside all four layers plus a readout (680,008 parameters) learn online through reverse-mode autodiff. The body is a raymarched signed-distance creature rendered in HDR, and every visual and sound parameter comes from network state. The Evaluate panel runs seeded experiments against ablations and controls.</div>
      {!started ? (
        <div style={{ ...panel, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Photosensitivity note: read before it wakes</div>
          <div style={{ fontSize: 13, color: theme.text.secondary }}>This contains slow color shifts, bloom glow, chromatic fringing, moving iridescent surfaces, and Shepard, binaural and spatial audio. Nothing strobes or flashes, and all brightness changes are smooth and slower than 3 Hz. Calm mode slows motion and reduces glow and fringing. Mute is always visible. If you are sensitive to moving patterns, start in calm mode or skip it. Audio works best on headphones at low volume.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="primary" label="Wake it (with sound)" onClick={() => { ctl.current.sound = true; setStarted(true); }} />
            <Button label="Wake it silently" onClick={() => { ctl.current.sound = false; setStarted(true); }} />
            <Toggle label="Start in calm mode" value={calm} onChange={setCalm} />
          </div>
        </div>) : (
        <Fragment>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Button label="1 Reach" onClick={() => { ctl.current.power[0] = 3; }} /><Button label="2 Reverse Shepard" onClick={() => { ctl.current.power[1] = 3; }} /><Button label="3 Crouch" onClick={() => { ctl.current.power[2] = 3; }} /><Button label="4 Shimmer" onClick={() => { ctl.current.power[3] = 3; }} />
            <Toggle label="Calm mode" value={calm} onChange={setCalm} /><Toggle label="Mute" value={muted} onChange={setMuted} />
            <Button label="Let it hear (mic)" onClick={() => { const f = (window as unknown as { __c1mic?: () => void }).__c1mic; if (f) f(); }} />
            <Button label="Injure it (silences 40% of brain inputs)" onClick={() => { ctl.current.damage = 1; }} />
            <Button label="Forget learned readout" onClick={() => { try { localStorage.removeItem("creature1.v2.readout"); } catch { /* none */ } }} />
          </div>
          {glErr ? <div style={{ ...panel, color: theme.text.secondary }}>{glErr}</div> : <canvas ref={cv} style={{ width: "100%", height: 600, borderRadius: 12, background: "#020104", cursor: "crosshair", touchAction: "none" }} />}
          {hud && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            <div style={panel}>{h("Parameter engine (measured)")}<div style={mono}>backend: {hud.backend} {hud.gpu}<br />inference weights used per pass: {fmt(hud.inferParams)}{hud.rowsActive < NN ? ` (adaptive: ${fmt(hud.rowsActive)}/${fmt(NN)} rows in layers 1–3)` : " (all 4×5000×5000)"}<br />weights: procedural hash(seed, layer, row, col), not stored, fp32 math<br />updated by learning: {fmt(hud.learned)} = 40,008 readout + {fmt(hud.learned - 40008)} LoRA (rank 16 into all 4 layers)<br />LoRA steps {fmt(hud.loraSteps)} · loss {hud.loraLoss.toFixed(3)} · effective weights W+AB per pass also add {fmt(NL * 2 * NN * RK)} adapter MACs<br />brain passes/s: {hud.passHz.toFixed(1)} · render {hud.fps.toFixed(0)} fps<br />backbuffer {hud.bw}×{hud.bh} RGBA16F (scale {hud.scale.toFixed(2)})</div></div>
            <div style={panel}>{h("Life signs")}<div style={mono}>energy {(hud.energy * 100).toFixed(0)}% · integrity {(hud.integrity * 100).toFixed(0)}%<br />confidence (metacognitive) {hud.conf.toFixed(2)}<br />organs: arousal {(hud.arousal ?? 0).toFixed(2)} ({hud.light ? "day" : "night"}) · lineage {hud.gens ?? 0} gens, head {String(hud.head ?? "").slice(0, 10)}<br />workspace broadcast: {hud.ws} · attention schema x̂ {hud.att.toFixed(2)}<br />mood {hud.mood}<br />{hud.saved}</div>{h("Surprise loss (online autodiff)")}{spark(hud.loss)}</div>
            <div style={panel}>{h("Quantum mood (2-qubit state vector, port)")}<div style={mono}>{hud.probs.map((p, i) => <div key={i}>{MOODS[i].padEnd(14, " ")} {"█".repeat(Math.round(p * 20))} {p.toFixed(3)}</div>)}CHSH S = {hud.S.toFixed(3)} (classical ≤ 2)</div></div>
            <div style={panel}>{h(`RV32I · pc=0x${hud.pc.toString(16)} · ${fmt(hud.steps)} instr`)}<div style={{ ...mono, display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>{hud.regs.map((r, i) => <div key={i}>x{i} {RN[i].padEnd(4, " ")} {(r >>> 0).toString(16).padStart(8, "0")}</div>)}</div></div>
          </div>}
        </Fragment>)}
      <div style={panel}>
        {h("Evaluate")}
        <div style={{ fontSize: 12, color: theme.text.secondary, marginBottom: 8 }}>These are functional indicator tests of the creature's core mechanisms, run in small seeded tasks. They are not evidence of consciousness, and no aggregate consciousness score is computed. Criteria were fixed before the first run: an item passes only if, against every control, Cohen's d ≥ 0.8 and Welch t ≥ 2.75 over 16 seeds. Failures are shown as they came out.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><Button variant="primary" label="Run all experiments" onClick={runEval} />
          {jsonUrl && <a href={jsonUrl} download="creature1-eval.json" style={{ color: theme.text.primary, fontSize: 12 }}>Download JSON</a>}
          {evalItems.length > 0 && <Button label={showJson ? "Hide JSON" : "Show JSON"} onClick={() => setShowJson(!showJson)} />}<span style={mono}>{evalRun}</span></div>
        {groups.map(([g, title]) => { const its = evalItems.filter((x) => x.group === g); return its.length ? <div key={g} style={{ marginTop: 10 }}>{h(title + ` · ${its.filter((x) => x.pass).length} pass / ${its.filter((x) => !x.pass && x.category !== "Implementation identified").length} fail${g === "CQM-25" ? ` / ${its.filter((x) => x.category === "Implementation identified").length} implementation-only` : ""}`)}{its.map(row)}</div> : null; })}
        {showJson && <pre style={{ ...mono, whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>{JSON.stringify(evalItems, null, 1)}</pre>}
      </div>
      <div style={panel}>{h("Wiring map")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{`Senses → 26 features: gaze, cursor velocity, click, mic level, energy, integrity, confidence, curiosity, qubit probabilities, RV32I phase, workspace winner, attention-schema state, keys. These are projected to 5000 inputs.
GPU brain: four dense tanh layers of 5000×5000 = 100,000,000 weights, w = hash(seed, layer, row, col), computed in a WebGPU compute shader (or a WebGL2 fragment shader). If the GPU is slow, layers 1–3 evaluate fewer rows, and the count shown is the true one.
Learning: 680,008 parameters. Rank-16 LoRA adapters (A·B) on all four 5000×5000 layers (640,000 params) are trained once per brain pass by exact backprop through the procedural weights (a GPU transpose kernel computes Wᵀδ). The 5000→8 tanh readout (40,008 params) is trained every frame by the reverse-mode autodiff tape to predict the next [gaze x, gaze y, energy, integrity]. The loss is surprise and drives curiosity; confidence comes from recent loss.
Outputs 0–3 → body radius, surface noise, skin hue, thin-film thickness, bloom; 4 → banding; 5–6 → qubit angles and 4D rotation; 7 → Shepard drift; 0–7 → limb reach.
Workspace: gaze, sound, hunger and novelty modules compete by salience. The winner is broadcast (gaze bends the limbs, sound lights the background).
Attention schema: a Kalman model of its own attention aims the eyes and the camera.
Metabolism: energy drains with activity and recovers toward a 0.7 setpoint. Injury silences 40% of brain inputs; integrity falls, then repairs at a rate scaled by energy.
Limbs: damped Hamiltonian chains integrated with symplectic Euler and fed to the SDF as capsules. The body SDF is 4D-rotated (xw, yw) before projection.
Body: a short, asymmetric, hollow shell (SDF shell 0.036 thick, fresnel transparency, a slowly rotating section cut) with unequal spines, a perforated membrane fin, a cluster of 7 red eyes and 5 limbs from the physics chains. Inside, all driven by live state: 4 nested shells colored by the actual activations of the 4 network layers (5000 units each, texture updated every brain pass), a second brain lobe (readout output), an RV32I die whose cells light from the live register bits, a 2-qubit core whose glowing axis follows the state-vector probabilities, an energy organ that swells with metabolism, and fibers whose pulse speed follows brain passes/s (≤1.6 Hz at any pixel). Orange spores drift in the dark.
Renderer: raymarched SDF → RGBA16F HDR → bright pass → 4× separable blur → ACES tone map + chromatic aberration + vignette. The backbuffer adapts between 0.5× and 4× DPR, capped at 3840 px wide.
RV32I: encoded machine code (xorshift32 + phase) runs 96 instructions per frame and sets limb phase.`}</div></div>
      <div style={panel}>{h("Prior-art check (quick search, Oct 2026; novel means not found, not proven)")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{"LoRA on a seed-regenerated random backbone | Established | closest: LottaLoRA, arXiv 2604.08749\nIn-browser WebGPU LoRA backward | Established | closest: Emberglass (GitHub maceip)\nHash weights recomputed per MAC in-shader + exact transpose kernel so LoRA trains through them live (WebGPU and WebGL2) | New combination | closest: the two above\nExecutable Butlin harness with ablations | Established | closest: tlcdv/the_consciousness_ai; symthaea\nPreregistered d and t vs every control across Butlin 14 + 10 frameworks + CQM-25, no aggregate score | New combination | closest: the above\nAttention schema that inflates its own uncertainty from its surprise (NIS) | New combination | closest: adaptive-inflation EnKF (arXiv 1507.08319, 2604.17343)\nBayesian latent-cause reversal learning | Established | closest: latent-cause models (Gershman et al.)\nExpected-free-energy expectimax over beliefs | Established | closest: active-inference literature\nPlasticity-shaped thresholded binary net scored on a phi proxy and partition-sensitive behavior | New combination | closest: none found\nHollow cutaway raymarched creature showing live 100M-net activations, RV32I registers and a qubit core | Novel as far as found | closest: arogozhnikov/3d_nn; tobis.vision Critters"}</div></div>
      <div style={panel}>{h("What runs here vs what is ported")}<div style={{ ...mono, whiteSpace: "pre-wrap" }}>{`Runs here for real: the 100M-weight GPU forward pass (procedural weights; about 100M multiply-adds per pass), the online autodiff readout, the HDR raymarcher and bloom, the RV32I interpreter, the 2-qubit simulator and CHSH test, every evaluation experiment, Web Audio and localStorage.
Ported (TypeScript re-implementations, not the originals): Eshkol-style reverse-mode AD; Moonlab-style state vector and Bell-gated randomness. Neither Eshkol's WASM VM nor Moonlab's C library is executed, because a Page cannot load them.
Stand-in: crypto.getRandomValues replaces Moonlab's hardware entropy.
Not done: the 100M base weights stay fixed (procedural); 680,008 parameters learn (0.68% of the body). Adapters are session-only (not saved); the readout is saved. fp16 is used for render targets only.`}</div></div>
    </div>
  );
}
