// ===== Creature 001 organism v3.2 (v3.0 core + v3.1 Mind layer + v3.2 decision/replay fixes): one coupled, deterministic, seedable living-system simulation =====
// Runs headless in node (tests) and in the browser (app.tsx drives rendering + inspector from this state only).
// 1 tick = 1 simulated minute. Spiking substeps inside each tick. Every number labelled "illustrative" in
// SYSTEMS_DESIGN.md is a modelling choice, not a measured biological constant.
export type Rng = (() => number) & { getState?: () => number; setState?: (a: number) => void };
export function mulberry(seed: number): Rng { let a = seed >>> 0; const f: Rng = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; f.getState = () => a; f.setState = (x: number) => { a = x >>> 0; }; return f; } // v3.6: state accessors for snapshot()/restore()
const clamp = (x: number, a = 0, b = 1): number => (x < a ? a : x > b ? b : x);
const sig = (x: number): number => 1 / (1 + Math.exp(-x));
export function digamma(x: number): number { let r = 0; while (x < 6) { r -= 1 / x; x += 1; } const f = 1 / (x * x); return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132)))); }
/** v3.6: I(y; p) for y ~ Bernoulli(p), p ~ Beta(a, b): H[Bern(mean)] - E_p H[Bern(p)] (nats) */
export function betaIG(a: number, b: number): number { const n = a + b, m = a / n; const H = -(m * Math.log(m) + (1 - m) * Math.log(1 - m)); const EH = -(m * (digamma(a + 1) - digamma(n + 1)) + (1 - m) * (digamma(b + 1) - digamma(n + 1))); return Math.max(0, H - EH); }
const IG0 = betaIG(1, 1);

// ---------------- regions (central nervous system) + enteric nervous system ----------------
export const REGIONS = [["SENS", 16], ["THAL", 16], ["CTX", 64], ["HIP", 32], ["STR", 32], ["HYP", 16], ["VTA", 6], ["RAPHE", 6], ["LC", 6], ["BF", 6], ["INS", 8], ["SCN", 8], ["MOT", 8], ["ENS", 48]] as const;
export type Region = typeof REGIONS[number][0];
export const R0: Record<string, number> = {}; export const RN: Record<string, number> = {};
{ let o = 0; for (const [n, k] of REGIONS) { R0[n] = o; RN[n] = k; o += k; } }
export const NNEU = REGIONS.reduce((s, r) => s + r[1], 0);
const INHIB = (i: number): boolean => (i >= R0.CTX + 52 && i < R0.CTX + 64) || (i >= R0.STR && i < R0.STR + RN.STR) || (i >= R0.ENS + 36 && i < R0.ENS + 48); // cortical interneurons, striatal MSNs (GABAergic), ENS inhibitory motor neurons
// region->region connection probability (illustrative; sparsity in the FlyWire range ~1e-3..1e-1 within neuropils, see design doc)
const CP: [Region, Region, number][] = [["SENS", "THAL", 0.25], ["THAL", "CTX", 0.12], ["CTX", "THAL", 0.06], ["CTX", "CTX", 0.1], ["CTX", "HIP", 0.06], ["HIP", "CTX", 0.06], ["HIP", "HIP", 0.05],
  ["CTX", "STR", 0.08], ["STR", "MOT", 0.15], ["CTX", "MOT", 0.05], ["HYP", "VTA", 0.2], ["HYP", "LC", 0.15], ["HYP", "HYP", 0.1], ["INS", "LC", 0.25], ["INS", "CTX", 0.06], ["INS", "HYP", 0.15],
  ["VTA", "STR", 0.1], ["LC", "CTX", 0.08], ["RAPHE", "CTX", 0.05], ["BF", "CTX", 0.06], ["BF", "HIP", 0.1], ["SCN", "HYP", 0.25], ["SCN", "RAPHE", 0.15], ["CTX", "INS", 0.06], ["ENS", "ENS", 0.12], ["ENS", "HYP", 0.05]];
export type Syn = { pre: Int32Array; post: Int32Array; w: Float32Array; plastic: Uint8Array };

// ---------------- quantum layer: 3-qubit state vector (port of the Moonlab gate idea; Born-rule sampling) ----------------
// v3.6 snapshot codec: typed arrays -> {__ta, v}; PRNG closures -> {__rng}; other functions and back-references skipped
const TA: Record<string, any> = { Float32Array, Float64Array, Int32Array, Uint8Array, Uint32Array, Int8Array, Uint16Array, Int16Array };
function snapEnc(x: any, skip: Set<string>): unknown { if (x === null || typeof x !== "object") return typeof x === "function" ? (x.getState ? { __rng: x.getState() } : undefined) : x;
  if (ArrayBuffer.isView(x)) return { __ta: x.constructor.name, v: Array.from(x as any) }; if (Array.isArray(x)) return x.map((e) => snapEnc(e, skip));
  const o: Record<string, unknown> = {}; for (const k of Object.keys(x)) { if (skip.has(k)) continue; const v = x[k]; if (typeof v === "function" && !v.getState) continue; o[k] = snapEnc(v, skip); } return o; }
function snapVal(cur: any, v: any, skip: Set<string>): any { if (v === null || typeof v !== "object") return v; if (v.__rng !== undefined) { if (typeof cur === "function" && cur.setState) { cur.setState(v.__rng); return cur; } const f = mulberry(0); f.setState!(v.__rng); return f; }
  if (v.__ta) { const T = TA[v.__ta]; if (cur && cur.constructor === T && cur.length === v.v.length) { cur.set(v.v); return cur; } return T.from(v.v); }
  if (Array.isArray(v)) { if (Array.isArray(cur)) { const out = v.map((e, i) => snapVal(cur[i], e, skip)); cur.length = 0; cur.push(...out); return cur; } return v.map((e) => snapVal(undefined, e, skip)); }
  if (cur && typeof cur === "object" && !Array.isArray(cur) && !ArrayBuffer.isView(cur)) { snapDec(cur, v, skip); return cur; } const o: any = {}; for (const k of Object.keys(v)) o[k] = snapVal(undefined, v[k], skip); return o; }
function snapDec(target: any, st: any, skip: Set<string>): void { for (const k of Object.keys(st)) { if (skip.has(k)) continue; target[k] = snapVal(target[k], st[k], skip); } }
export class Q3 { re = new Float64Array(8); im = new Float64Array(8); ext: number[] | null = null /* v3.6: probabilities supplied by an external statevector backend */; constructor() { this.re[0] = 1; }
  reset(): void { this.re.fill(0); this.im.fill(0); this.re[0] = 1; this.ext = null; }
  ry(q: number, t: number): void { const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q; for (let i = 0; i < 8; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = c * a - s * b; this.re[j] = s * a + c * b; this.im[i] = c * ai - s * bi; this.im[j] = s * ai + c * bi; } }
  rz(q: number, t: number): void { const m = 1 << q; for (let i = 0; i < 8; i++) { const ph = (i & m) ? t / 2 : -t / 2; const c = Math.cos(ph), s = Math.sin(ph); const a = this.re[i], b = this.im[i]; this.re[i] = a * c - b * s; this.im[i] = a * s + b * c; } }
  cx(c: number, t: number): void { const mc = 1 << c, mt = 1 << t; for (let i = 0; i < 8; i++) if ((i & mc) && !(i & mt)) { const j = i | mt; let x = this.re[i]; this.re[i] = this.re[j]; this.re[j] = x; x = this.im[i]; this.im[i] = this.im[j]; this.im[j] = x; } }
  probs(): number[] { if (this.ext) return this.ext.slice(); const p: number[] = []; for (let k = 0; k < 8; k++) p.push(this.re[k] ** 2 + this.im[k] ** 2); return p; }
  measure(u: number): number { const p = this.probs(); let k = 0; for (; k < 7; k++) { u -= p[k]; if (u < 0) break; } return k; }
  prepare(th: number[]): void { this.reset(); for (let q = 0; q < 3; q++) this.ry(q, th[q]); this.cx(0, 1); this.cx(1, 2); for (let q = 0; q < 3; q++) this.rz(q, th[q] * 0.7); } }
// Quantum geometric tensor of |psi(theta)> by central differences: Q_ij = <d_i psi|d_j psi> - <d_i psi|psi><psi|d_j psi>.
// Re Q = Fubini-Study metric, -2 Im Q = Berry curvature (definitions as in tsotchke/quantum_geometric_tensor; this is a small TS port of the definition, not that library).
export function qgt(th: number[]): { g: number[][]; berry: number[][]; trace: number } {
  const st = (t: number[]): [Float64Array, Float64Array] => { const q = new Q3(); q.prepare(t); return [q.re.slice(), q.im.slice()]; };
  const h = 1e-4; const [r0, i0] = st(th); const dR: Float64Array[] = [], dI: Float64Array[] = [];
  for (let a = 0; a < 3; a++) { const tp = th.slice(), tm = th.slice(); tp[a] += h; tm[a] -= h; const [rp, ip] = st(tp), [rm, im] = st(tm); dR.push(rp.map((v, k) => (v - rm[k]) / (2 * h))); dI.push(ip.map((v, k) => (v - im[k]) / (2 * h))); }
  const ip = (ar: Float64Array, ai: Float64Array, br: Float64Array, bi: Float64Array): [number, number] => { let re = 0, imv = 0; for (let k = 0; k < 8; k++) { re += ar[k] * br[k] + ai[k] * bi[k]; imv += ar[k] * bi[k] - ai[k] * br[k]; } return [re, imv]; };
  const g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], berry = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const [xr, xi] = ip(dR[a], dI[a], dR[b], dI[b]); const [ar, ai] = ip(dR[a], dI[a], r0, i0); const [br, bi] = ip(r0, i0, dR[b], dI[b]);
    const cr = ar * br - ai * bi, ci = ar * bi + ai * br; g[a][b] = xr - cr; berry[a][b] = -2 * (xi - ci); }
  return { g, berry, trace: g[0][0] + g[1][1] + g[2][2] }; }
// NIST SP 800-90B continuous health tests (repetition count + adaptive proportion), cutoff formulas ported from tsotchke/quantum_rng src/health/health_tests.c
export class Health { rctCut: number; aptCut: number; W = 512; last = -1; run = 0; win: number[] = []; fails = 0; n = 0;
  constructor(minEntropy: number) { this.rctCut = Math.ceil(1 + 30 / minEntropy); const p = Math.pow(2, -minEntropy); const z = 5.0; /* ~2^-30 false alarm */ this.aptCut = Math.ceil(this.W * p + z * Math.sqrt(this.W * p * (1 - p)) + 0.5); }
  push(s: number): void { this.n++; if (s === this.last) { this.run++; if (this.run >= this.rctCut) { this.fails++; this.run = 1; } } else { this.last = s; this.run = 1; }
    this.win.push(s); if (this.win.length === this.W) { const c = this.win.filter((x) => x === this.win[0]).length; if (c >= this.aptCut) this.fails++; this.win = []; } } }

// ---------------- v3.1 Mind layer: workspace, attention, metacognition, prediction, agency, binding, planning ----------------
// Operates on the spiking CNS every tick (reads CTX module rates, NE/ACh/DA, adenosine), writes back neural drive (broadcast -> HIP,
// attention -> thalamic gain, top-down -> THAL, motor -> MOT), LC bursts (ignition, prediction error) and an ATP cost. Each mechanism has a lesion.
export const NMOD = 4, MW = 13; // 4 cortical modules x 13 excitatory neurons (CTX 0..51); CTX 52..63 are interneurons
const msoftmax = (z: number[], beta = 1): number[] => { const m = Math.max(...z); const e = z.map((v) => Math.exp(beta * (v - m))); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
const margmax = (a: ArrayLike<number>): number => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };
const mdot = (w: Float64Array, x: ArrayLike<number>, off = 0): number => { let s = 0; for (let i = 0; i < x.length; i++) s += w[off + i] * x[i]; return s + w[off + x.length]; };
// linear softmax readout with delta rule (cross-entropy gradient)
export class Lin { W: Float64Array; constructor(public nOut: number, public nIn: number) { this.W = new Float64Array(nOut * (nIn + 1)); }
  out(x: ArrayLike<number>): number[] { const z: number[] = []; for (let k = 0; k < this.nOut; k++) z.push(mdot(this.W, x, k * (this.nIn + 1))); return z; }
  learn(x: ArrayLike<number>, target: number, lr: number, beta = 3): void { const p = msoftmax(this.out(x), beta); for (let k = 0; k < this.nOut; k++) { const g = (k === target ? 1 : 0) - p[k]; const o = k * (this.nIn + 1); for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i]; this.W[o + this.nIn] += lr * g; } }
  regress(x: ArrayLike<number>, y: number[], lr: number): void { const z = this.out(x); let n = 1; for (let i = 0; i < x.length; i++) n += x[i] * x[i]; for (let k = 0; k < this.nOut; k++) { const g = (y[k] - z[k]) / n; const o = k * (this.nIn + 1); for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i]; this.W[o + this.nIn] += lr * g; } } }
/** v3.5: recursive least squares (exponentially forgetting) for the insula's causal glucose model: converges to the least-squares solution instead of NLMS's noisy steps */
export class RLS { w: Float64Array; P: Float64Array; n: number; constructor(nIn: number, public lam: number) { this.n = nIn + 1; this.w = new Float64Array(this.n); this.P = new Float64Array(this.n * this.n); for (let i = 0; i < this.n; i++) this.P[i * this.n + i] = 100; }
  out(x: ArrayLike<number>): number { let z = this.w[this.n - 1]; for (let i = 0; i < this.n - 1; i++) z += this.w[i] * x[i]; return z; }
  fit(x: ArrayLike<number>, y: number): void { const n = this.n, u = new Float64Array(n); for (let i = 0; i < n - 1; i++) u[i] = x[i]; u[n - 1] = 1; const Pu = new Float64Array(n); let den = this.lam; for (let i = 0; i < n; i++) { let a = 0; for (let j = 0; j < n; j++) a += this.P[i * n + j] * u[j]; Pu[i] = a; den += u[i] * a; } const e = y - this.out(x); for (let i = 0; i < n; i++) this.w[i] += (Pu[i] / den) * e; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) this.P[i * n + j] = (this.P[i * n + j] - (Pu[i] * Pu[j]) / den) / this.lam; } }
// Kalman attention schema over [focus, drift] (shared for self and for modelling another agent)
export class Kal { x = [0, 0]; P = [[1, 0], [0, 1]]; adapt = 0; constructor(public q = 0.002, public qd = 0.0004, public r = 0.09) {}
  predict(u = 0): number { const [p, d] = this.x; this.x = [p + d + u, d]; const P = this.P; this.P = [[P[0][0] + 2 * P[0][1] + P[1][1] + this.q, P[0][1] + P[1][1]], [P[0][1] + P[1][1], P[1][1] + this.qd]]; return this.x[0]; }
  update(z: number): number { const S = this.P[0][0] + this.r; const nis = (z - this.x[0]) ** 2 / S; const infl = nis > 6 ? 3 : 1; /* surprise (NIS) inflates uncertainty */ this.P[0][0] *= infl; this.P[1][1] *= infl;
    const S2 = this.P[0][0] + this.r, K0 = this.P[0][0] / S2, K1 = this.P[0][1] / S2, e = z - this.x[0]; this.x = [this.x[0] + K0 * e, this.x[1] + K1 * e];
    const P = this.P; this.P = [[(1 - K0) * P[0][0], (1 - K0) * P[0][1]], [P[1][0] - K1 * P[0][0], P[1][1] - K1 * P[0][1]]];
    if (this.adapt > 0) { /* v3.6: innovation-based adaptive estimation of the noise covariances (covariance matching; Mehra 1972, Mohamed & Schwarz 1999): the schema learns how noisy its own attention and self-observation are */ const a = this.adapt; this.r = Math.max(0.005, (1 - a) * this.r + a * (e * e - S + this.r)); this.q = Math.max(1e-5, (1 - a) * this.q + a * (K0 * e) ** 2); this.qd = Math.max(1e-7, (1 - a) * this.qd + a * (K1 * e) ** 2); }
    return nis; } }
export class Mind {
  rate: Float64Array[] = []; amp = [0, 0, 0, 0]; ampPrev = [0, 0, 0, 0]; post: number[][] = []; cls: Lin[] = []; sal = [0, 0, 0, 0];
  win = -1; ign = 0; ignitions = 0; bc = new Float64Array(8); bcOut = new Float64Array(8); att = [1, 1, 1, 1]; Wq = new Float64Array(4 * 4 * 4); lastQ: [number, number, number] | null = null;
  act = new Lin(4, 8); recv = new Lin(4, 8); rep = new Lin(4, 8); assoc = new Lin(4, 26); meta = new Float64Array(5); conf = 0.5; margin = 0; lastAct = -1; action = -1; actP: number[] = [0.25, 0.25, 0.25, 0.25];
  proto: number[][][] = []; recon: Lin[] = []; percept: number[][] = []; td = new Float64Array(16);
  pp = new Lin(16, 65); pred = new Float64Array(16); ppMean = new Float64Array(16); ppErr = 0; ctxPrev = new Float64Array(65);
  af = 0; afTarget = 0; drift = 0; afObs = 0; kal = new Kal(); other = new Kal(); afErr = 0; astU = 0;
  phase = [0, 1.5, 3, 4.5]; K = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; co = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; mAvg = [0, 0, 0, 0]; plv: { c: number; s: number }[][] = [];
  wv = new Float64Array(53); el = new Float64Array(53); V = 0; Vprev = 0; tdErr = 0;
  arm = 0; gTrue = 1; gHat = 1; efference = 0; dArmPred = 0; dArmObs = 0; push = 0; motor = 0;
  intero = new Lin(1, 5); interoBuf: { x: number[]; at: number }[] = []; glcPred = 0;
  // v3.5: reward is a setter so the actor knows a reward event happened (policy-gradient credit to the last decision)
  _rew = 0; rewSet = false; get rew(): number { return this._rew; } set rew(v: number) { this._rew = v; this.rewSet = true; }
  meta2 = new Float64Array(8); confF: number[] = [0, 0, 0, 0, 0, 0, 0, 1]; pgX: Float64Array | null = null; pgA = -1; pgP: number[] = [0.25, 0.25, 0.25, 0.25]; rbar = 0; pbar = [0.25, 0.25, 0.25, 0.25]; interoBuf2: { x: number[]; at: number; g0: number }[] = []; rls = new RLS(5, M35.rlsLam); reVar = [0.1, 0.1, 0.1, 0.1];
  tdA = [0, 0, 0, 0]; tdB = [0, 0, 0, 0]; pr2L = [0, 0, 0, 0] /* v3.7 confidence-gated top-down precision */; meta3 = new Float64Array(10) /* v3.7 monitor weights (adds workspace ignition) */; tdW = [0.5, 0.5, 0.5, 0.5]; buL: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; tdL: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; // v3.6 learned top-down precision
  cost = 0; prevC = -1; epi: { x: number[]; y: number }[] = []; replays = 0; g: Organism | null = null; Tm = new Int16Array(64).fill(-1); Qmf = new Float64Array(64); sweeps = 0;
  constructor(r: () => number) { for (let m = 0; m < NMOD; m++) { this.rate.push(new Float64Array(MW)); this.post.push([0.25, 0.25, 0.25, 0.25]); this.cls.push(new Lin(4, MW)); this.recon.push(new Lin(4, MW)); this.proto.push([0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((j) => (j === k ? 0.5 : 0.1)))); this.percept.push([0, 0, 0, 0]); this.plv.push([0, 1, 2, 3].map(() => ({ c: 0, s: 0 }))); }
    for (let i = 0; i < this.meta.length; i++) this.meta[i] = 0; void r; }
  // one tick: called by Organism.step after the spiking substeps
  step(g: Organism): void { this.g = g; const o = g.o, ne = g.nm.NE.E, ach = g.nm.ACh.E; this.cost = 0; const v35 = ge35(o.mind ?? MIND_DEFAULT), v36 = ge36(o.mind ?? MIND_DEFAULT);
    // v3.5 actor: a reward event credits the previous decision (REINFORCE with a running-average baseline; Williams 1992), so action mappings are learned from outcomes, not only from labels
    if (v35 && this.rewSet && this.pgX && this.pgA >= 0 && g.learn) { const adv = this._rew - this.rbar; this.rbar += 0.05 * (this._rew - this.rbar); const W = this.act.W, n = this.act.nIn + 1;
      for (let k = 0; k < 4; k++) this.pbar[k] += 0.02 * (this.pgP[k] - this.pbar[k]); const Lb = this.pgP.reduce((a, p, j) => a + p * Math.log(this.pbar[j] + 1e-9), 0); for (let k = 0; k < 4; k++) { const gk = M35.pgLr * adv * ((k === this.pgA ? 1 : 0) - this.pgP[k]) - M35.entK * this.pgP[k] * (Math.log(this.pbar[k] + 1e-9) - Lb); /* marginal-entropy (action-diversity) regulariser: penalises collapse onto one stimulus-independent action without flattening stimulus-specific choices */ for (let i = 0; i < 8; i++) W[k * n + i] += gk * this.pgX[i]; W[k * n + 8] += gk; } }
    this.rewSet = false;
    const c34 = o.cortex !== "v31"; for (let m = 0; m < NMOD; m++) this.ampPrev[m] = this.amp[m]; // v3.4: previous-tick amplitude (onset salience)
    for (let m = 0; m < NMOD; m++) { let s = 0; for (let j = 0; j < MW; j++) { const ix = R0.CTX + m * MW + j, v = g.rate[ix]; this.rate[m][j] = c34 ? CX.norm * (v - g.rateAvg[ix]) : v; s += v; } this.amp[m] = s / MW; // v3.4: readouts see adaptation-normalised rates
      this.post[m] = msoftmax(this.cls[m].out(this.rate[m]), 3);
      // perception: bottom-up linear reconstruction of the 4 sensory lines; top-down: precision-weighted generative prototype (HOT-1)
      const bu = this.recon[m].out(this.rate[m]); const pm = this.post[m]; const tdv = [0, 1, 2, 3].map((j) => pm.reduce((a, p, k) => a + p * this.proto[m][k][j], 0)); const pr = Math.max(...pm);
      if (v35 && !o.topdownLesion) { /* v3.5: precision-weighted generative top-down: sharpened posterior selects the learned prototype; weight = posterior precision */ const lg = this.cls[m].out(this.rate[m]); const ps0 = msoftmax(lg, M35.tdBeta); const s2 = Math.max(0.01, M35.tdS * this.reVar[m]); const ll = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a, q, j) => a + (bu[j] - q) ** 2, 0) / (2 * s2)); const mx = Math.max(...ll); const ez = ll.map((v) => Math.exp(v - mx)); const zs = ez.reduce((a, v) => a + v, 0); const ps = ez.map((v) => v / zs); /* Bayesian fusion: cortical class prior x Gaussian likelihood of the bottom-up reconstruction under each learned prototype, noise variance = learned recon error */ const pr2 = Math.max(...ps); for (let j = 0; j < 4; j++) tdv[j] = ps.reduce((a, p, k) => a + p * this.proto[m][k][j], 0); const v37t = is37(o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0; if (v37t) this.pr2L[m] = pr2; const w = v37t ? 1 / (1 + Math.exp(-(this.tdA[m] + this.tdB[m] * (pr2 - 0.5) * 4))) /* v3.7: top-down precision is a learned function of posterior confidence (a sharp posterior means the prototype is a reliable prediction; Feldman & Friston 2010 precision as confidence) */ : v36 ? Math.max(0, Math.min(1, this.tdW[m])) : Math.min(1, M35.tdGain * pr2); this.percept[m] = bu.map((b, j) => (1 - w) * b + w * tdv[j]); if (is39(o.mind ?? MIND_DEFAULT) && M39.tdIter > 0) for (let it = 0; it < M39.tdIter; it++) { /* v3.9: recurrent settling (predictive-coding inference iterates bottom-up/top-down exchange; Rao & Ballard 1999): the class posterior is re-evaluated on the current fused percept, the prototype re-selected and re-fused */ const l2 = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a2, q, j) => a2 + (this.percept[m][j] - q) ** 2, 0) / (2 * s2)); const m2 = Math.max(...l2); const e2 = l2.map((v) => Math.exp(v - m2)); const z2 = e2.reduce((a2, v) => a2 + v, 0); for (let j = 0; j < 4; j++) tdv[j] = e2.reduce((a2, v, k) => a2 + (v / z2) * this.proto[m][k][j], 0); this.percept[m] = bu.map((b2, j) => (1 - w) * b2 + w * tdv[j]); } if (v36) { this.buL[m] = bu.slice(); this.tdL[m] = tdv.slice(); } /* v3.6: the top-down weight is a learned precision (below, in teach) */ }
      else this.percept[m] = o.topdownLesion ? bu : bu.map((b, j) => (1 - pr) * b + pr * tdv[j]); for (let j = 0; j < 4; j++) this.td[m * 4 + j] = o.topdownLesion ? 0 : 0.25 * pr * tdv[j]; }
    // global workspace: salience competition, NE lowers the ignition threshold, incumbent hysteresis; 1 slot
    const mt = c34 ? MT : MT31; const thr = mt.ignThr * (1.3 - 0.6 * Math.min(1, ne)); let best = -1, bs = 0; // v3.4: workspace constants re-tuned on seeds 2000+ (v3.1 values kept for cortex "v31")
    const thc = [0, 0, 0, 0]; if (v35) for (let m = 0; m < NMOD; m++) { /* v3.5: salience = thalamic input contrast (pulvinar-like bottom-up salience: peak minus mean of the module's 4 relay lines), not the adaptation-normalised cortical amplitude */ let mx = 0, sm = 0; for (let j = 0; j < 4; j++) { const v = M35.salSens ? g.rate[R0.SENS + m * 4 + j] : g.rate[R0.THAL + m * 4 + j]; mx = Math.max(mx, v); sm += v; } thc[m] = M35.salK * (mx - sm / 4); }
    for (let m = 0; m < NMOD; m++) { this.sal[m] = Math.max(0, (v35 ? thc[m] : this.amp[m]) - mt.ampBase * this.ampPrev[m]) * this.att[m] * (mt.salOff + Math.max(...this.post[m])) ** mt.confExp * (m === this.win ? mt.hyst : 1); if (this.sal[m] > bs) { bs = this.sal[m]; best = m; } }
    const prevWin = this.win; this.bc.fill(0);
    if (o.gwLesion) { this.win = -1; for (let m = 0; m < NMOD; m++) for (let k = 0; k < 4; k++) this.bc[4 + k] += this.post[m][k] / NMOD; this.bc.fill(0.25, 0, 4); }
    else if (bs > thr) { this.win = best; this.bc[best] = 1; for (let k = 0; k < 4; k++) this.bc[4 + k] = this.post[best][k]; } else this.win = -1;
    if (prevWin >= 0 && this.win >= 0 && this.win !== prevWin) this.lastQ = [prevWin, this.prevC, this.win]; this.prevC = this.win >= 0 ? margmax(this.post[this.win]) : -1;
    this.ign = this.win >= 0 && this.win !== prevWin ? 1 : 0; this.ignitions += this.ign; if (this.ign) { g.predErr += 0.15; this.cost += 0.0004; } // ignition: LC burst + metabolic cost
    for (let i = 0; i < 8; i++) this.bcOut[i] = o.bcLesion ? 0 : this.bc[i];
    // state-dependent attention: workspace content (winner module, its class) sets thalamic gain of other modules next tick (learned by RPE)
    this.att = [1, 1, 1, 1]; if (!o.seqLesion && this.win >= 0) { const c = margmax(this.post[this.win]); for (let m = 0; m < NMOD; m++) if (m !== this.win) this.att[m] = 1 + 2 * Math.max(0, this.Wq[(this.win * 4 + c) * 4 + m]); }
    // action readout from workspace content; stochastic selection with DA-set temperature
    const z = this.act.out(this.bc); this.actP = msoftmax(z, 2 + 6 * Math.min(1, g.nm.DA.E + 0.2)); const srt = this.actP.slice().sort((a, b) => b - a); this.margin = srt[0] - srt[1];
    this.lastAct = this.action; let u = g.r(); let a = 0; for (; a < 3; a++) { u -= this.actP[a]; if (u < 0) break; } this.action = a;
    // metacognition: second-order monitor on margin, consistency, NE, adenosine
    if (v35) { /* v3.5 higher-order monitor: reads first-order states (chosen-action probability, margin, winner posterior, evidence amplitude, greedy flag, NE, adenosine) */ const wm = this.win >= 0 ? this.win : margmax(this.amp); this.confF = [this.actP[this.action], this.margin, Math.max(...this.post[wm]), 4 * this.amp[wm], this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1]; if (is37(o.mind ?? MIND_DEFAULT)) { this.confF = this.confF.concat([this.win >= 0 ? 1 : 0]); if (is39(o.mind ?? MIND_DEFAULT) && M39.evQ > 0) { const sv = Array.from(g.sens.slice(wm * 4, wm * 4 + 4)).sort((x, y) => y - x); this.confF.push(M39.evQ * (sv[0] - sv[1])); } /* v3.9: the monitor also reads early sensory evidence strength (top-minus-second line in the winning module), a first-order quality cue that metacognition uses (Fleming & Daw 2017 second-order model) */ /* v3.7: the monitor also reads whether the content reached the workspace (no ignition = no access = guess; Dehaene 2014) */ this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta3[i], 0))); } else this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta2[i], 0))); }
    else { const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1]; this.conf = 1 / (1 + Math.exp(-f.reduce((s, v, i) => s + v * this.meta[i], 0))); }
    if (v35 && this.win >= 0) { this.pgX = Float64Array.from(this.bc); this.pgA = this.action; this.pgP = this.actP.slice(); }
    // predictive coding: predict this tick's sensory lines from last tick's cortex; error -> LC
    for (let i = 0; i < 16; i++) { this.ppMean[i] += 0.05 * (g.sens[i] - this.ppMean[i]); } const P = o.ppLesion ? Array.from(this.ppMean) : this.pp.out(this.ctxPrev); let e = 0; for (let i = 0; i < 16; i++) { this.pred[i] = P[i]; e += (g.sens[i] - P[i]) ** 2; } this.ppErr = e / 16;
    if (!o.ppLesion && !o.ppFreeze && g.learn) this.pp.regress(this.ctxPrev, Array.from(g.sens), 0.5); g.predErr += 0.3 * Math.min(1, this.ppErr);
    for (let i = 0; i < 64; i++) this.ctxPrev[i] = g.rate[R0.CTX + i]; this.ctxPrev[64] = 0;
    // attention schema (self): true focus drifts with NE-scaled noise; noisy self-observation; Kalman schema estimates focus+drift and steers
    this.drift += 0.004 * g.gauss() - 0.002 * this.drift; this.af += this.astU + this.drift + 0.03 * (0.5 + ne) * g.gauss(); this.afObs = this.af + 0.3 * g.gauss();
    this.kal.adapt = v36 && !o.astLesion ? M36.akA : 0; this.kal.predict(this.astU); this.kal.update(this.afObs); this.astU = o.astLesion ? -0.5 * (this.afObs - this.afTarget) : -(this.kal.x[0] - this.afTarget) - this.kal.x[1]; this.afErr = (this.af - this.afTarget) ** 2;
    // binding field: module oscillators (Kuramoto), coupling learned fast from co-activation fluctuations, ACh gain
    for (let m = 0; m < NMOD; m++) this.mAvg[m] += 0.1 * (this.amp[m] - this.mAvg[m]);
    for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) { this.co[m][n] += 0.25 * ((this.amp[m] - this.mAvg[m]) * (this.amp[n] - this.mAvg[n]) - this.co[m][n]); this.K[m][n] = o.fieldLesion || m === n ? 0 : 40 * Math.max(0, this.co[m][n]) / (0.002 + Math.sqrt(Math.abs(this.co[m][m] * this.co[n][n]))) * (0.5 + ach) * 0.05; }
    for (let s = 0; s < 10; s++) { const d = [0, 0, 0, 0]; for (let m = 0; m < NMOD; m++) { d[m] = 0.6 + 0.05 * m + 0.15 * g.gauss(); for (let n = 0; n < NMOD; n++) d[m] += this.K[m][n] * Math.sin(this.phase[n] - this.phase[m]); } for (let m = 0; m < NMOD; m++) this.phase[m] += 0.1 * d[m]; }
    for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) { const dp = this.phase[m] - this.phase[n]; const P2 = this.plv[m][n]; P2.c += 0.2 * (Math.cos(dp) - P2.c); P2.s += 0.2 * (Math.sin(dp) - P2.s); }
    // TD value with eligibility traces over cortical module neurons (UAL); TD error -> DA
    const xv: number[] = []; for (let m = 0; m < NMOD; m++) for (let j = 0; j < MW; j++) xv.push(this.rate[m][j]); this.Vprev = this.V; this.V = mdot(this.wv, xv); this.tdErr = this.rew + 0.9 * this.V - this.Vprev;
    if (g.learn) { let nn = 1; for (let i = 0; i < 53; i++) nn += this.el[i] * this.el[i]; const lr = (v35 ? M35.ualLr : 0.3) * Math.max(-1, Math.min(1, this.tdErr)) / nn; for (let i = 0; i < 53; i++) this.wv[i] += lr * this.el[i]; } // normalised TD (NLMS) step; v3.1 tuning fix: the unnormalised step diverged on seeds 2000+ g.nm.DA.E += 0.05 * Math.max(0, this.tdErr);
    const lam = o.traceLesion ? 0 : v35 ? M35.ualLam : 0.8; for (let i = 0; i < 52; i++) this.el[i] = lam * this.el[i] + xv[i]; this.el[52] = lam * this.el[52] + 1; this._rew = 0;
    // body: arm moved by motor command (efference copy) with unknown gain; external pushes; forward model learned (NLMS) and inverted
    this.dArmPred = o.efferenceLesion ? 0 : (o.fwdLesion ? 1 : this.gHat) * this.efference; const dA = this.gTrue * this.efference + this.push; this.arm = Math.max(-2, Math.min(2, this.arm + dA)); this.dArmObs = dA + 0.02 * g.gauss();
    if (!o.efferenceLesion && !o.fwdLesion && g.learn && Math.abs(this.efference) > 1e-3 && this.push === 0) this.gHat += 0.5 * (this.dArmObs - this.gHat * this.efference) * this.efference / (this.efference ** 2 + 0.01);
    this.motor = Math.abs(this.efference); this.efference = 0; this.push = 0;
    // interoceptive causal model: predict blood glucose 30 min ahead from current physiology (insula); trained online
    const xi = [g.blood.glc / 3, g.gut.glc / 5, g.insulin, g.glucagon, g.motility];
    if (v35) { /* v3.5: the causal model predicts the CHANGE in glucose over 30 min from gut load and hormones (residual on persistence) */ this.glcPred = g.blood.glc + 3 * this.rls.out(xi); this.interoBuf2.push({ x: xi, at: g.t + 30, g0: g.blood.glc }); while (this.interoBuf2.length && this.interoBuf2[0].at <= g.t) { const b = this.interoBuf2.shift() as { x: number[]; at: number; g0: number }; if (g.learn) this.rls.fit(b.x, (g.blood.glc - b.g0) / 3); } } else {
    this.glcPred = 3 * this.intero.out(xi)[0]; this.interoBuf.push({ x: xi, at: g.t + 30 }); while (this.interoBuf.length && this.interoBuf[0].at <= g.t) { const b = this.interoBuf.shift() as { x: number[]; at: number }; if (g.learn) this.intero.regress(b.x, [g.blood.glc / 3], 0.3); } }
    // hippocampal replay of stored action episodes into the action readout (awake ripples: 1/tick; NREM: 6/tick); lesioned with o.replay = "none"
    if (g.learn && o.replay !== "none" && this.epi.length) { const n = g.stage === 0 ? 1 : g.stage >= 2 && g.stage <= 3 ? 6 : 0; for (let k = 0; k < n; k++) { const e = this.epi[Math.floor(g.r() * this.epi.length)]; this.act.learn(e.x, e.y, 0.05); this.replays++; } this.cost += 0.00001 * n; }
    this.cost += 0.00002 * (this.ign + 1); }
  // ---- task-facing learning signals (feedback, as a trainer or the world would give) ----
  teach(m: number, label: number, clean?: number[]): void { if (this.g && this.g.o.eprop) this.g.epropLearn(m, label, clean ?? [0, 1, 2, 3].map((j) => (j === label ? 1 : 0))); const lr = 0.08 * (0.5 + 0.5 * Math.min(1, (this.g ? this.g.nm.ACh.E : 0.3))); this.cls[m].learn(this.rate[m], label, lr); const x = clean ?? [0, 1, 2, 3].map((j) => (j === label ? 1 : 0));
    { const bu0 = this.recon[m].out(this.rate[m]); let e2 = 0; for (let j = 0; j < 4; j++) e2 += (x[j] - bu0[j]) ** 2; this.reVar[m] += 0.05 * (e2 / 4 - this.reVar[m]); }
    if (this.g && ge36(this.g.o.mind ?? MIND_DEFAULT) && !this.g.o.topdownLesion) { /* v3.6: learned top-down precision: the weight given to the generative prediction is fitted (normalised LMS) to how well prediction vs bottom-up evidence matched the teaching signal */ let num = 0, den = 1e-3; for (let j = 0; j < 4; j++) { const dlt = this.tdL[m][j] - this.buL[m][j]; num += (x[j] - this.percept[m][j]) * dlt; den += dlt * dlt; } this.tdW[m] = Math.max(0, Math.min(1, this.tdW[m] + M36.tdLr * num / den));
      if (is37(this.g.o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0) { const z = this.tdA[m] + this.tdB[m] * (this.pr2L[m] - 0.5) * 4, wv = 1 / (1 + Math.exp(-z)), gz = num / den * wv * (1 - wv); this.tdA[m] += M37.tdLr2 * gz; this.tdB[m] += M37.tdLr2 * gz * (this.pr2L[m] - 0.5) * 4; } }
    this.recon[m].regress(this.rate[m], x, 0.2); for (let j = 0; j < 4; j++) this.proto[m][label][j] += 0.1 * (x[j] - this.proto[m][label][j]); }
  teachAction(label: number, lr = 0.15): void { this.act.learn(this.bc, label, lr); this.epi.push({ x: Array.from(this.bc), y: label }); if (this.epi.length > 300) this.epi.shift(); }
  teachRecv(label: number): void { this.recv.learn(this.bcOut, label, 0.15); }
  teachReport(): void { this.rep.learn(this.bcOut, this.action, 0.15); }
  teachConf(correct: boolean): void { if (this.g && ge35(this.g.o.mind ?? MIND_DEFAULT)) { const e = (correct ? 1 : 0) - this.conf; let nn = 1; for (const v of this.confF) nn += v * v; if (this.confF.length >= 9) { for (let i = 0; i < this.confF.length; i++) this.meta3[i] += M35.confLr * e * this.confF[i] / nn * 4; return; } for (let i = 0; i < 8; i++) this.meta2[i] += M35.confLr * e * this.confF[i] / nn * 4; return; } const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, (this.g ? this.g.nm.NE.E : 0.3), (this.g ? this.g.S : 0.4), 1]; const e = (correct ? 1 : 0) - this.conf; for (let i = 0; i < 5; i++) this.meta[i] += 0.3 * e * f[i]; }
  rewardQuery(r: number): void { if (!this.lastQ) return; const [w, c, m] = this.lastQ; const i = (w * 4 + c) * 4 + m; this.Wq[i] += 0.2 * (r - this.Wq[i]); }
  // model-based planning over a learned transition model (hippocampal sweeps); sweeps scale with intelligence level; model-free Q as the lesion control
  observe(s: number, a: number, s2: number, r: number): void { this.Tm[s * 4 + a] = s2; const i = s * 4 + a; let mx = 0; for (let b = 0; b < 4; b++) mx = Math.max(mx, this.Qmf[s2 * 4 + b]); this.Qmf[i] += 0.3 * (r + 0.9 * mx - this.Qmf[i]); }
  plan(s: number, goal: number, level: number, modelFree: boolean, r: () => number): number { const tie = (q: number[]): number => { const m = Math.max(...q); const c = q.map((v, k) => (v >= m - 1e-9 ? k : -1)).filter((k) => k >= 0); return c[Math.floor(r() * c.length)]; };
    if (modelFree) return tie([0, 1, 2, 3].map((a) => this.Qmf[s * 4 + a]));
    const V = new Float64Array(16); this.sweeps = 3 * level; for (let k = 0; k < this.sweeps; k++) for (let x = 0; x < 16; x++) { if (x === goal) { V[x] = 1; continue; } let m = 0; for (let a = 0; a < 4; a++) { const y = this.Tm[x * 4 + a]; if (y >= 0) m = Math.max(m, 0.9 * V[y]); } V[x] = m; }
    this.cost += 0.00001 * this.sweeps * 16; return tie([0, 1, 2, 3].map((a) => { const y = this.Tm[s * 4 + a]; return y < 0 ? 0.05 : y === goal ? 1 : 0.9 * V[y]; })); }
  nParams(): number { let n = this.Wq.length + this.wv.length + this.meta.length + this.Qmf.length + this.Tm.length + 3 * 4 * 16; for (const l of [this.act, this.recv, this.rep, this.assoc, this.pp, ...this.cls, ...this.recon]) n += l.W.length; return n; }
  recvOut(): number { return margmax(this.recv.out(this.bcOut)); }
  repOut(): number { return margmax(this.rep.out(this.bcOut)); }
  binding(m: number, n: number): number { const p = this.plv[m][n]; return Math.hypot(p.c, p.s); }
}

// v3.1 sensory-pathway constants (set on tuning seeds; frozen in prereg v3.1 §F)
export const TUNE = { thal: 0.1, ctxDrop: 0.35, st: 3, tc: 5, rec: 0.2, sensIn: 1.5, ltcAch: 1.5, ltcIn: 0.5, ltcNe: 0.5 };
export const MT31 = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 };
export const MT = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 }; // v3.4 workspace constants (tuned on seeds 2000..2015)
export const LTC_TAU0 = 1 / Math.log(1.25);
// v3.4 cortex constants (tuned on seeds 2000..2015 only; frozen in prereg v3.4 §F)
export const CX = { tc: 1.2, tcSig: 0.55, tcSum: 6.0, ffI: 0.3, eI: 0.5, iE: 0.6, rec0: 0.05, recMax: 1.6, nmdaK: 0.9, aP: 0.02, aM: 0.021, rho: 0.12, hEta: 0.02, vEta: 0.002, dev: 480, devAmp: 1.0, crit: 4, norm: 2.5, gluK: 3.0 };
// v3.4 learned LTC gates for CTX-E [log tau0, aACh, bIn, cNE] (e-prop on tuning seeds; frozen in prereg v3.4 §F). Initialised to the v3.3 hand-set values until training.
export const LTC_INIT = [Math.log(1 / Math.log(1.25)), 1.5, 0.5, 0.5]; // e-prop starting point = fixed-tau decay 0.8 per substep when gates are closed
// Frozen 2026-10-29: mean theta after train_eprop.ts 16 tuning seeds (2000-2015) x 3 epochs, eta 0.02 (results/v34_tuning/eprop_training.json). SD 0.099 0.021 0.054 0.009.
export const LTC_LEARNED = [1.3115, 1.4248, 0.4722, 0.5351];
// v3.5 Mind/decision constants (tuned on seeds 2000..2015 only; frozen in prereg v3.5 §F). V35TUNE env (JSON) overrides are for tuning runs only.
export const M35: Record<string, number> = { tdPrior: 0, tdS: 1, entK: 1, rlsLam: 0.9995, tdBeta: 8, tdGain: 0.5, confLr: 0.2, pgLr: 0.3, xW: 2, xP: 0.05, featIt: 4, salK: 1, orxK: 1.2, salSens: 1, remAll: 1, remLr: 0.25, lrBase: 0.1, lrVol: 0.4, efeK: 0.6, efeTau: 200, efeVis: 0.5, ualLr: 0.3, ualLam: 0.8, interoLr: 0.3 };
// v3.6 parameters, tuned on seeds 2000..2015 only (frozen in prereg v3.6 §F). akA=0 and dendK=0: adaptive Kalman and dendritic gating were tested in tuning and made AST-1 / RPT-2 worse, so they ship switched off. V36TUNE env (JSON) is for tuning runs only.
export const M36: Record<string, number> = { neK: 0.1, tdLr: 0.05, akA: 0, lcThr: 2, lcDecay: 0.95, dendK: 0, dendVh: 0.5, dendVs: 0.15, schLam: 2, schDecay: 0.995, efeK: 2, igTau: 300, fbW: 0.2, fbN: 2, slowK: 0, slowTau: 60, visK: 1.5 };
// v3.7 parameters, tuned on seeds 2000..2015 only (frozen in prereg v3.7 §F). V37TUNE env (JSON) is for tuning runs only.
export const M37: Record<string, number> = { slowK: 0.2, inhG: 10, dendK: 1, dendVh: 0.5, dendVs: 0.15, tdLr2: 0, bmW: 0, igTau: 300, dLr: 0.2, dTau: 240, depW: 1, fbW: 0.2, fbS: 1 };
declare const process: { env: Record<string, string | undefined> } | undefined;
export const M38: Record<string, number> = { efeC: 0.5, efeRef: 1, fK: 4, fSet: 400, thK: 1, thMin: 0.6, mMax: 180, fast: 1, ketSpare: 0, ketEx: 0.0008, ffaInh: 6, gngK: 2, protK: 2, ketK: 4 };
// v3.9 parameters (Round 20; tuned on pooled dev seeds 2000..2031 only, frozen in prereg v3.9). V39TUNE env (JSON) is for tuning runs only.
export const M39: Record<string, number> = { ketPS: 0.5, fCrit: 20, p3K: 3, mDeath: 60, lipE: 0.5, xsW: 0, xsSig: 0.5, tdIter: 0, evQ: 0, vK: 0 };
try { const e9 = typeof process !== "undefined" ? process.env.V39TUNE : undefined; if (e9) Object.assign(M39, JSON.parse(e9)); } catch { /* ignore */ }
try { const e = typeof process !== "undefined" ? process.env.V35TUNE : undefined; if (e) Object.assign(M35, JSON.parse(e)); const e6 = typeof process !== "undefined" ? process.env.V36TUNE : undefined; if (e6) Object.assign(M36, JSON.parse(e6)); const e7 = typeof process !== "undefined" ? process.env.V37TUNE : undefined; if (e7) Object.assign(M37, JSON.parse(e7)); const e8 = typeof process !== "undefined" ? process.env.V38TUNE : undefined; if (e8) Object.assign(M38, JSON.parse(e8)); } catch { /* browser */ }
// default Mind version: "v38" (Round 19); ORG_MIND=v37 reproduces v3.7; ORG_MIND=v36 reproduces v3.6 bit-for-bit; ORG_MIND=v35 reproduces v3.5 bit-for-bit; ORG_MIND=v34 (node) reproduces the v3.4 organism bit-for-bit. LTC stays OFF by default (opt-in via o.ltc; it hurt delayed recall in v3.3/v3.4).
export const MIND_DEFAULT: "v34" | "v35" | "v36" | "v37" | "v38" | "v39" | "v40" = (() => { try { const e = typeof process !== "undefined" ? process.env.ORG_MIND : undefined; return e === "v34" ? "v34" : e === "v35" ? "v35" : e === "v36" ? "v36" : e === "v37" ? "v37" : e === "v38" ? "v38" : e === "v39" ? "v39" : "v40"; } catch { return "v40"; } })(); // v4.0 branch: default Mind v40; ORG_MIND=v39 reproduces v3.9
/** v3.5 mechanisms stay on in v3.6 (v3.6 adds to them) */ export const ge35 = (m: string): boolean => m === "v35" || m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40";
/** v3.6 mechanisms stay on in v3.7 */ export const ge36 = (m: string): boolean => m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40"; /** v3.7 mechanisms stay on in v3.8 */ export const is37 = (m: string): boolean => m === "v37" || m === "v38" || m === "v39" || m === "v40"; export const is38 = (m: string): boolean => m === "v38" || m === "v39" || m === "v40"; /** v3.9 (Round 20) */ export const is39 = (m: string): boolean => m === "v39" || m === "v40"; /** v4.0 (DELARP consolidation) */ export const is40 = (m: string): boolean => m === "v40";
export const LTC_DEFAULT = false;
/** v4.0 parameters (dev-tuned on seeds 2000+ only; not frozen). uK: weight of the single uncertainty term; mK: blend of the Beta posterior mean into value; dreamC: pseudo-count a REM dream writes into an unexperienced option's belief; dreamLr: step toward the dreamt belief; tempSD: log-SD of per-individual temperament (curiosity gain) */
export const M40: Record<string, number> = { uK: 1.0, mK: 0.5, dreamC: 2, dreamLr: 0.25, tempSD: 0.25 };
try { const e40 = typeof process !== "undefined" ? process.env.V40TUNE : undefined; if (e40) Object.assign(M40, JSON.parse(e40)); } catch { /* browser */ }
const betaSD = (a: number, b: number): number => { const n = a + b, m = a / n; return Math.sqrt(m * (1 - m) / (n + 1)); }; const SD0 = betaSD(1, 1);
// ---------------- options: lesions, clamps, conditions ----------------
export type Opts = { seed: number; entropy?: "seeded" | "crypto"; noise?: "quantum" | "classical"; starve?: boolean; vagotomy?: boolean; scnLesion?: boolean; insulaLesion?: boolean; kappaShuffle?: boolean;
  sympathectomy?: boolean; replay?: "full" | "none" | "nremOnly" | "remShuffle"; forceWake?: boolean; daClamp?: number; level?: number; leakyLedger?: boolean; access?: "half" | "all";
  // v3.1 mechanism lesions / conditions
  recLesion?: boolean; mixLesion?: boolean; ctFbLesion?: boolean /* v3.6: cut all CTX->THAL synapses */; slowLesion?: boolean /* v3.6: remove the slow cortical NMDA current */; visceralLesion?: boolean /* v3.6: cut the visceral glucose afferent to INS */; topoScramble?: boolean; gwLesion?: boolean; bcLesion?: boolean; seqLesion?: boolean; topdownLesion?: boolean; astLesion?: boolean; ppLesion?: boolean; ppFreeze?: boolean;
  rpeLesion?: boolean; fwdLesion?: boolean; efeLesion?: boolean; fieldLesion?: boolean; traceLesion?: boolean; efferenceLesion?: boolean; repairLesion?: boolean; pidLesion?: boolean; fixedDrive?: boolean; aversiveLesion?: boolean;
  genes?: number[] /* [vtaGain, thrScale, forageGain, reach] each ~1 */; fat0?: number; deplete?: boolean; danger?: boolean; pool?: { food: number } /* shared ecological food pool */;
  // v3.2: set to "v30" to run the v3.0 decision/replay rules (for comparison only)
  decision?: "v32" | "v30"; ltc?: boolean | "learned" /* v3.3 liquid time-constant neurons; v3.4 "learned": CTX-E gates from e-prop training (LTC_LEARNED) */; tauScale?: number /* v3.3 robustness: multiplies every neuron's base time constant */;
  // v3.4 cortex: "v34" (default) = topographic TC fan + module E/I loops + STDP + homeostasis + NMDA-like recurrent persistence + developmental waves; "v31" reproduces the v3.1 cortex bit-for-bit
  cortex?: "v31" | "v34"; devLesion?: boolean; stdpLesion?: boolean; homeoLesion?: boolean; eiLesion?: boolean; nmdaLesion?: boolean; eprop?: boolean /* v3.4: run the e-prop gate learning online (training curriculum only) */;
  // v3.5: Mind/decision version ("v35" default; "v34" reproduces v3.4)
  mind?: "v34" | "v35" | "v36" | "v37" | "v38" | "v39" };
export const SITES = 16; // 4 colours x 4 shapes; reward p = 0.05 + 0.25 cv[c] + 0.25 sv[s]
export const STAGES = ["WAKE", "N1", "N2", "N3", "REM"] as const;

export class Organism {
  o: Opts; r: Rng; ent: () => number; t = 0;
  // neurons
  v = new Float32Array(NNEU); tau = new Float32Array(NNEU).fill(1 / Math.log(1.25)); th = new Float32Array(NNEU); spk = new Uint8Array(NNEU); rate = new Float32Array(NNEU); xTr = new Float32Array(NNEU); yTr = new Float32Array(NNEU);
  syn: Syn; out: number[][] = []; ext = new Float32Array(NNEU); regionRate: Record<string, number> = {};
  // plastic action values: hippocampal site cell -> striatal channel synapses (three-factor), cortical feature model (colour/shape)
  wSite = new Float32Array(SITES).fill(0.25); featC = new Float32Array(4).fill(0.15); featS = new Float32Array(4).fill(0.15); pTrue = new Float32Array(SITES); siteC = new Int8Array(SITES); siteS = new Int8Array(SITES);
  access = new Uint8Array(SITES); episodes: { k: number; r: number; p: number }[] = [];
  // metabolism (kJ); ledger
  gut = { glc: 4, fat: 2, prot: 1.5 }; blood = { glc: 3, ffa: 1, aa: 2, ket: 0.2, urea: 0 }; liverGly = 20; fat = 400; muscle = 120; brainGlc = 0.6; atp = 2; heat = 0; excreted = 0; eaten = 0; E0 = 0; leak = 0;
  // hormones / autonomic / heart
  insulin = 0.3; glucagon = 0.3; cortisol = 0.3; ghrelin = 0.3; leptin = 0.5; melatonin = 0; symp = 0.3; para = 0.4; hr = 70; perfusion = 1; pidI = 0; pidPrev = 0;
  // neuromodulators: vesicle pool P, extracellular E
  nm: Record<string, { P: number; E: number }> = { DA: { P: 1, E: 0.3 }, "5HT": { P: 1, E: 0.3 }, NE: { P: 1, E: 0.3 }, ACh: { P: 1, E: 0.3 }, Glu: { P: 1, E: 0.3 }, GABA: { P: 1, E: 0.3 }, eCB: { P: 0.5, E: 0.1 } };
  // sleep / circadian
  S = 0.4; orx = 0; scnPhase = 0 /* radians, 0 = midnight */; stage = 0; ultra = 0; awakeMin = 0; asleep = false; light = 1;
  // latent / curvature / interoception
  pc: Float64Array[] = []; z: number[][] = []; kappa = 0; kHist: number[] = []; liminal = 0; predErr = 0;
  // quantum
  q = new Q3(); qth = [0.5, 0.5, 0.5]; qOut = 0; qgtTrace = 0; berry = 0; health = new Health(2.5);
  // behaviour
  level = 1; foraged = 0; rewards = 0; lastChoice = -1; choices: number[] = []; brainUse = 0; learn = true; stim: Record<string, number> = {}; vagal = 0; ensRate = 0; motility = 0;
  hist: Record<string, number[]> = {}; events: string[] = [];
  // v3.1: sensory lines (4 modalities x 4), synapse kinds + lesion mask, Mind layer, body integrity, ecology
  nmda = new Float32Array(NNEU); nmdaS = new Float32Array(NNEU) /* v3.6 slow cortical NMDA current */; modAct = new Float32Array(4) /* v3.7 module E activity for divisive inhibition */; dHat = new Float32Array(SITES) /* v3.7 believed depletion of each site */; dDelta = 0 /* v3.7 learned depletion strength */; pk: Uint8Array = new Uint8Array(0); thA = new Float32Array(NNEU); inn: number[][] = []; devSens = new Float32Array(16); rd: Rng = mulberry(1); rateAvg = new Float32Array(NNEU).fill(0.12);
  gate: number[] = LTC_LEARNED.slice(); elig = new Float64Array(NNEU * 4); eligT = new Float64Array(NNEU * 4); gHist: number[][] = []; // gate is reset to LTC_INIT in the constructor when o.eprop (training)
  sens = new Float32Array(16); kind: Uint8Array; mask: Float32Array; mind: Mind; integrity = 1; tissue = 10; damageTaken = 0; cogCost = 0; pBase = new Float32Array(SITES); depl = new Float32Array(SITES);
  danger = new Float32Array(SITES); wAv = new Float32Array(SITES); visits = new Float32Array(SITES); lastVisit = new Float32Array(SITES); vol = 0; assocPH = new Float32Array(SITES).fill(0.5);
  // v3.6: light input, dendritic NMDA buffer, latent-cause value map, schema statistics, Beta beliefs for expected information gain
  deathCause = ""; temper = -1; lightIn: number | null = null; photo: [number, number] = [6, 18]; dend = new Float32Array(NNEU); wAlt = new Float32Array(SITES).fill(0.25); lcLLR = 0; lcSwitches = 0; sN = new Float32Array(SITES); sR = new Float32Array(SITES); bA = new Float32Array(SITES).fill(1); bB = new Float32Array(SITES).fill(1); rule: ((asleep: boolean, drive: number, thrS: number, forced: boolean) => boolean) | null = null; qb: { prepare(th: number[]): void; probs(): number[] } | null = null; modLesion = [false, false, false, false]; dead = false; lowGlc = 0;
  constructor(o: Opts) { this.o = { noise: "quantum", replay: "full", entropy: "seeded", access: "half", ...o }; this.r = mulberry(o.seed * 7919 + 17); if (o.eprop) this.gate = LTC_INIT.slice();
    const er = mulberry(o.seed * 104729 + 3); this.ent = this.o.entropy === "crypto" && typeof crypto !== "undefined" ? (() => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; }) : er;
    const r = this.r; const pre: number[] = [], post: number[] = [], w: number[] = [], pl: number[] = []; const has = new Set<number>();
    for (const [a, b, p] of CP) for (let i = R0[a]; i < R0[a] + RN[a]; i++) for (let j = R0[b]; j < R0[b] + RN[b]; j++) { if (i === j) continue;
      let pp = p; if (a === b && b === "CTX" && has.has(j * NNEU + i)) pp = Math.min(1, p * 4); // reciprocal over-representation ~4x (Song et al. 2005)
      if (r() < pp) { has.add(i * NNEU + j); pre.push(i); post.push(j); const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35; w.push(INHIB(i) ? -ln * 1.6 : ln); pl.push(a === "CTX" && b === "CTX" && !INHIB(i) ? 1 : 0); } }
    // v3.1 topographic pathways (separate RNG stream so the v3.0 random wiring is unchanged): SENS line i -> THAL i; THAL modality m -> 3 neurons of CTX module m; within-module recurrence
    const ra = mulberry(o.seed * 31337 + 5); const kd: number[] = pre.map((p, k) => { const q = post[k]; const cx = (i: number) => i >= R0.CTX && i < R0.CTX + 52; return cx(p) && cx(q) ? (Math.floor((p - R0.CTX) / 13) === Math.floor((q - R0.CTX) / 13) ? 2 : 3) : 0; });
    for (let i = 0; i < 16; i++) { pre.push(R0.SENS + i); post.push(R0.THAL + i); w.push(TUNE.st); pl.push(0); kd.push(1); }
    const c34 = this.o.cortex !== "v31"; // v3.4: the v3.1 TC picks and recurrent synapses are still drawn (so the ra stream is unchanged) but only wired in the v3.1 cortex
    for (let i = 0; i < 16; i++) { const m = Math.floor(i / 4); for (let c = 0; c < 3; c++) { const mm = this.o.topoScramble ? Math.floor(ra() * 4) : m; const j = R0.CTX + mm * 13 + Math.floor(ra() * 13); if (!c34) { pre.push(R0.THAL + i); post.push(j); w.push(TUNE.tc); pl.push(0); kd.push(1); } } }
    for (let m = 0; m < 4; m++) for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (a !== b && ra() < 0.25) { if (!c34) { pre.push(R0.CTX + m * 13 + a); post.push(R0.CTX + m * 13 + b); w.push(TUNE.rec); pl.push(1); kd.push(2); } }
    const pkk: number[] = pre.map(() => 0);
    if (c34) { const rc = mulberry(o.seed * 7777 + 11); const E = (m: number, n: number): number => R0.CTX + m * 13 + n, I = (m: number, k: number): number => R0.CTX + 52 + 3 * m + k;
      const add = (a: number, b: number, ww: number, k: number, p2: number): void => { pre.push(a); post.push(b); w.push(ww); pl.push(0); kd.push(k); pkk.push(p2); };
      // (1) topographic thalamocortical fan: THAL line (m, j) -> every E neuron n of module m, Gaussian over preferred position 3n/12 (scrambled: random module + random positions)
      for (let i = 0; i < 16; i++) { const m = Math.floor(i / 4), j = i % 4; const mm = this.o.topoScramble ? Math.floor(rc() * 4) : m; const perm = Array.from({ length: 13 }, (_, n) => n); if (this.o.topoScramble) perm.sort(() => rc() - 0.5);
        for (let n = 0; n < 13; n++) { const pos = (3 * perm[n]) / 12; add(R0.THAL + i, E(mm, n), CX.tc * Math.exp(-((pos - j) ** 2) / (2 * CX.tcSig ** 2)) * (0.8 + 0.4 * rc()), 1, 1); }
        for (let k = 0; k < 3; k++) add(R0.THAL + i, I(mm, k), CX.ffI, 5, 0); } // feedforward inhibition
      for (let m = 0; m < 4; m++) { for (let n = 0; n < 13; n++) for (let k = 0; k < 3; k++) { add(E(m, n), I(m, k), CX.eI * (0.8 + 0.4 * rc()), 6, 0); add(I(m, k), E(m, n), -CX.iE * (0.8 + 0.4 * rc()), 7, 3); } // E/I loop; I->E plastic (Vogels 2011)
        for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (a !== b) add(E(m, a), E(m, b), CX.rec0 * (0.5 + rc()), 2, 2); }
      if (ge35(o.mind ?? MIND_DEFAULT)) { const rx = mulberry(o.seed * 6113 + 29); /* v3.5: sparse cross-module E->E synapses (kind 3) onto coincidence-detecting E cells: a cell fires strongly only when its own TC input and the cross input coincide -> conjunctive (mixed-selectivity) codes */
        for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) if (m !== n) for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (rx() < M35.xP) add(E(m, a), E(n, b), M35.xW * (0.5 + rx()), 3, 0); }
      if (is39(o.mind ?? MIND_DEFAULT) && M39.xsW > 0) { const rs = mulberry(o.seed * 3301 + 17); /* v3.9: patchy, target-specific long-range cortico-cortical axons (Gilbert & Wiesel 1989; Bosking 1997): each E cell of module m receives cross input from the cells of the paired module (0<->1, 2<->3) that prefer ONE randomly assigned position; with the soma-gated dendritic plateau this gives each cell a specific (own feature x partner feature) conjunction = random mixed selectivity (Rigotti et al. 2013) */
        for (let m = 0; m < 4; m++) for (let b = 0; b < 13; b++) { const n = m ^ 1, p = Math.floor(rs() * 4); for (let a = 0; a < 13; a++) { const ww = M39.xsW * Math.exp(-(((3 * a) / 12 - p) ** 2) / (2 * M39.xsSig ** 2)); if (ww > 0.02 * M39.xsW) add(E(n, a), E(m, b), ww, 3, 0); } } }
      const fbWe = is37(o.mind ?? MIND_DEFAULT) ? M37.fbW : M36.fbW; if (ge36(o.mind ?? MIND_DEFAULT) && fbWe > 0) { const rf = mulberry(o.seed * 9973 + 5); /* v3.6 (lab handoff R17 #1): L6-like corticothalamic feedback. Every E cell of module m projects to fbN relay lines of its own module's thalamic sector through the slow NMDA-like current: modulatory gain on the relay rather than fast drive (Sherman & Guillery 2002). CTX->THAL fan-out now exceeds THAL->CTX. */
        for (let m = 0; m < 4; m++) for (let n = 0; n < 13; n++) for (let k = 0; k < M36.fbN; k++) add(E(m, n), R0.THAL + m * 4 + Math.floor(rf() * 4), fbWe * (0.5 + rf()), 8, 2); } } // within-module recurrent, NMDA-like, STDP (assemblies)
    this.syn = { pre: Int32Array.from(pre), post: Int32Array.from(post), w: Float32Array.from(w), plastic: Uint8Array.from(pl) }; this.kind = Uint8Array.from(kd); this.pk = Uint8Array.from(pkk); this.rd = mulberry(o.seed * 4441 + 9); this.mask = new Float32Array(pre.length).fill(1); this.mind = new Mind(ra);
    for (let i = 0; i < NNEU; i++) { this.out.push([]); this.th[i] = 1 + 0.1 * r(); } pre.forEach((p, s) => this.out[p].push(s)); for (let i = 0; i < NNEU; i++) this.inn.push([]); post.forEach((q, s2) => { if (this.pk[s2]) this.inn[q].push(s2); });
    const cv = [0, 1, 2, 3].sort(() => r() - 0.5), sv = [0, 1, 2, 3].sort(() => r() - 0.5);
    for (let k = 0; k < SITES; k++) { const c = k & 3, s = k >> 2; this.siteC[k] = c; this.siteS[k] = s; this.pTrue[k] = 0.05 + 0.25 * cv[c] / 3 + 0.25 * sv[s] / 3; }
    // half the sites accessible on days 1-3 (a Latin pattern so every colour and shape is seen twice)
    for (let k = 0; k < SITES; k++) this.access[k] = this.o.access === "all" || ((this.siteC[k] + this.siteS[k]) & 1) === 0 ? 1 : 0;
    for (let k = 0; k < 3; k++) { const v = new Float64Array(12); for (let i = 0; i < 12; i++) v[i] = this.gauss(r) * 0.3; this.pc.push(v); }
    if (this.o.fat0 !== undefined) this.fat = this.o.fat0; const G = this.o.genes; if (G) { this.th = this.th.map((x) => x * G[1]); const reach = Math.max(0.1, Math.min(1, 0.5 * G[3])); for (let k = 0; k < SITES; k++) this.access[k] = ra() < reach ? 1 : 0; }
    for (let k = 0; k < SITES; k++) { this.pBase[k] = this.pTrue[k]; this.danger[k] = ra() < 0.5 ? 0.5 : 0; } this.applyMask(); this.E0 = this.energy(); }
  // lesion mask over synapses (kinds: 0 random, 1 topographic, 2 within-module recurrent, 3 cross-module cortical)
  applyMask(): void { const o = this.o; for (let k = 0; k < this.mask.length; k++) { const kd = this.kind[k]; let m = 1; if (o.recLesion && (kd === 2 || kd === 3)) m = 0; if (o.mixLesion && kd === 3) m = 0; if (o.ctFbLesion && (kd === 8 || (this.syn.pre[k] >= R0.CTX && this.syn.pre[k] < R0.CTX + RN.CTX && this.syn.post[k] >= R0.THAL && this.syn.post[k] < R0.THAL + RN.THAL))) m = 0; if (o.eiLesion && kd >= 5 && kd <= 7) m = 0; this.mask[k] = m; } }
  lesionModule(m: number, on = true): void { this.modLesion[m] = on; }
  damage(x: number): void { const d = Math.min(this.tissue, 10 * x); this.tissue -= d; this.blood.aa += d; this.integrity = this.tissue / 10; this.damageTaken += x; this.events.push(`t${this.t} damage ${x.toFixed(2)}`); }
  gauss(r: Rng = this.r): number { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
  energy(): number { const g = this.gut, b = this.blood; return g.glc + g.fat + g.prot + b.glc + b.ffa + b.aa + b.ket + b.urea + this.liverGly + this.fat + this.muscle + this.brainGlc + this.atp + this.heat + this.excreted + this.tissue; }
  ledgerError(): number { return Math.abs(this.energy() - this.E0 - this.eaten) / (this.E0 + this.eaten); }
  paramCount(): { synapses: number; plasticSynapses: number; valueSynapses: number; kinetics: number; quantum: number; total: number } {
    const syn = this.syn.w.length, pl = this.syn.plastic.reduce((a, b) => a + b, 0), val = SITES + 8 + this.mind.nParams(), kin = NNEU /* thresholds */ + 7 * 6 /* NM kinetics */ + 40 /* metabolic/hormone rate constants */ + 36 /* latent PCA */, q = 16 + 3;
    return { synapses: syn, plasticSynapses: pl, valueSynapses: val, kinetics: kin, quantum: q, total: syn + val + kin + q }; }
  // ---------- interventions (browser inspector + tests) ----------
  // ---- v3.6 steering API: light input, photoperiod, external quantum backend, rule engine, full-state snapshot/restore ----
  /** dome light in [0,1]; null returns to the internal photoperiod clock */ setLight(x: number | null): void { this.lightIn = x === null ? null : clamp(x); }
  setPhotoperiod(on: number, off: number): void { this.photo = [on, off]; }
  /** external statevector (e.g. Moonlab WASM): prepare(theta) then probs() of the 8 basis states; draws stay on the seeded stream, so runs stay deterministic */ setQuantumBackend(b: { prepare(th: number[]): void; probs(): number[] } | null): void { this.qb = b; }
  /** external sleep/wake flip-flop rule (e.g. an Eshkol program); must compute the same boolean as the built-in rule */ setRuleEngine(f: ((asleep: boolean, drive: number, thrS: number, forced: boolean) => boolean) | null): void { this.rule = f; }
  /** complete serialisable state (JSON-safe): every field incl. typed arrays, the Mind, and all PRNG states */ snapshot(): Record<string, unknown> { return snapEnc(this, new Set(["rule", "qb", "g"])) as Record<string, unknown>; }
  /** restore a snapshot into this instance (any seed); continuing then reproduces the original run exactly */ restore(st: Record<string, unknown>): void { snapDec(this, st, new Set(["rule", "qb", "g"])); }
  feed(kJ: number): void { const f = kJ / 2.2; this.gut.glc += 1.2 * f; this.gut.fat += 0.6 * f; this.gut.prot += 0.4 * f; this.eaten += kJ; this.events.push(`t${this.t} fed ${kJ.toFixed(1)} kJ`); }
  stimulate(reg: string, amt: number): void { this.stim[reg] = (this.stim[reg] || 0) + amt; }
  inject(nm: string, amt: number): void { if (this.nm[nm]) this.nm[nm].E += amt; }
  lesion(k: keyof Opts, v: unknown = true): void { (this.o as Record<string, unknown>)[k] = v; this.events.push(`t${this.t} ${k}=${String(v)}`); this.applyMask(); }
  // ---------- one-tick update of the whole organism ----------
  step(): void { const o = this.o, r = this.r; this.t++; const minute = this.t % 1440, hour = minute / 60;
    // circadian: lights 06-18; SCN entrains to light (phase-response), SCN lesion removes rhythm
    this.light = this.lightIn !== null ? clamp(this.lightIn) : hour >= this.photo[0] && hour < this.photo[1] ? 1 : 0; /* v3.6: external light input (dome) or photoperiod; graded light scales SCN entrainment and melatonin suppression */ this.scnPhase += 2 * Math.PI / 1440 + this.light * 0.002 * Math.sin(2 * Math.PI * minute / 1440 - this.scnPhase); // light phase-response entrainment
    const scnOut = o.scnLesion ? 0 : Math.cos(this.scnPhase - 2 * Math.PI * 14 / 24); // peaks ~14:00 when entrained
    this.melatonin += 0.05 * ((1 - this.light) * (o.scnLesion ? 0.5 : clamp(0.5 - scnOut)) - this.melatonin);
    this.ultra = (this.ultra + 1 / 90) % 1; // ultradian ~90 min (BRAC)
    // sleep: two-process (S adenosine, C circadian) flip-flop
    const C = 0.25 * scnOut + 0.1 * Math.sin(2 * Math.PI * this.ultra) * (this.asleep ? 0 : 0.5);
    const drive = this.S - C + 0.15 * this.melatonin - (ge36(o.mind ?? MIND_DEFAULT) ? M36.neK * Math.max(0, this.nm.NE.E - 0.3) : 0) /* v3.6: LC noradrenaline inhibits VLPO sleep-active neurons (Chou et al. 2002; Saper et al. 2005), opposing sleep onset */; const forced = o.forceWake || (this.stim.LC || 0) > 3;
    let thrS = 0.62; if (ge35(o.mind ?? MIND_DEFAULT)) { /* v3.5: orexin-like arousal: sustained sensory engagement (task stimulation) holds the sleep/wake flip-flop in wake (Saper et al. 2010); S keeps accumulating, so the debt is paid later */ let eng = 0; for (let i = 0; i < 16; i++) eng += this.sens[i]; this.orx += 0.02 * (Math.min(1, eng) - this.orx); thrS += M35.orxK * this.orx; }
    if (this.rule) { const was = this.asleep; this.asleep = this.rule(was, drive, thrS, forced); if (this.asleep && !was) this.ultra = 0; } /* v3.6: optional external rule engine (Eshkol program) for the flip-flop; must equal the TS rule */
    else if (!this.asleep && drive > thrS && !forced) { this.asleep = true; this.ultra = 0; } else if (this.asleep && (drive < 0.2 || forced)) this.asleep = false;
    this.liminal = Math.exp(-((drive - (this.asleep ? 0.2 : thrS)) ** 2) / 0.004);
    if (!this.asleep) this.stage = 0; else { const u = this.ultra; this.stage = u < 0.1 ? 1 : u < 0.3 ? 2 : u < 0.75 - 0.25 * clamp(0.6 - this.S) ? (this.S > 0.35 ? 3 : 2) : 4; }
    const awake = this.stage === 0, rem = this.stage === 4, n3 = this.stage === 3;
    // hormones
    const gutFill = this.gut.glc + this.gut.fat + this.gut.prot; const bg = this.blood.glc / 3; // ~1 = setpoint
    // allostatic setpoint anticipates morning activity; PID on glucose
    const set = 1 + 0.08 * scnOut; const e = bg - set; this.pidI = clamp(this.pidI + 0.002 * e, -0.5, 0.5); const dE = e - this.pidPrev; this.pidPrev = e;
    this.insulin += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 + 1.5 * e + this.pidI + 3 * dE + 0.2 * this.para * (o.vagotomy ? 0.3 : 1))) - this.insulin);
    this.glucagon += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 - 1.5 * e - this.pidI + 0.3 * this.symp)) - this.glucagon);
    this.cortisol += 0.02 * (clamp(0.35 + 0.25 * (o.scnLesion ? 0 : Math.cos(2 * Math.PI * (hour - 7) / 24)) + 0.6 * clamp(0.85 - bg) + 0.2 * (forced ? 1 : 0) + 0.4 * clamp(0.8 - this.integrity)) - this.cortisol); // tissue damage is a stressor
    this.ghrelin += 0.01 * (clamp(1 - gutFill / 6) - this.ghrelin); this.leptin = clamp(this.fat / 800);
    // ENS (myenteric) activity driven by gut contents and parasympathetic efferents; vagal afferent signals fill+nutrients to brainstem/hypothalamus
    const paraGut = o.vagotomy ? 0.1 : this.para; this.motility = clamp(0.2 + 0.5 * paraGut + 0.4 * this.ensRate - 0.3 * this.symp);
    this.vagal = o.vagotomy ? 0 : clamp(gutFill / 25 + 0.2 * this.ensRate);
    // ---------- neural tick ----------
    const ATPf = clamp(this.atp / 2, 0, 1.2); const brainF = clamp(this.brainGlc / 0.6 + 0.12 * this.blood.ket, 0, 1.3); // ketones partially substitute for glucose in brain
    const prec = clamp(this.blood.aa / 2, 0, 1.5); // tyrosine/tryptophan availability from blood amino acids
    const nmE = (k: string): number => this.nm[k].E; const da = o.daClamp !== undefined ? o.daClamp : nmE("DA");
    const kIn = o.insulaLesion ? 0 : o.kappaShuffle ? this.kHist[(this.t * 7919) % Math.max(1, this.kHist.length)] || 0 : this.kappa;
    const ext = this.ext; ext.fill(0); const add = (reg: string, x: number): void => { for (let i = R0[reg]; i < R0[reg] + RN[reg]; i++) ext[i] = x + 0.15 * this.gauss(); };
    const wake = awake ? 1 : 0;
    add("SENS", 0.08 * wake * (0.5 + this.light)); add("THAL", (awake ? TUNE.thal : rem ? 0.3 : 0.08)); add("CTX", 0.2 + 0.15 * nmE("ACh") + (n3 ? 0.25 * (Math.sin(this.t * 2.1) > 0 ? 1 : -0.5) : 0));
    for (let i = R0.CTX; i < R0.CTX + 52; i++) ext[i] -= TUNE.ctxDrop; // v3.1: excitatory cortex sits nearer threshold so topographic input can be expressed (v3.0 cortex was saturated)
    add("HIP", 0.1 + 0.3 * nmE("ACh")); add("STR", 0.1 + 0.3 * da); add("HYP", 0.4 + 0.5 * this.ghrelin + 0.5 * clamp(1 - bg) - 0.4 * this.vagal - 0.3 * this.leptin + 0.2 * this.insulin * 0);
    add("VTA", (0.35 + 0.05 * this.ghrelin) * prec * ATPf * clamp(brainF) * (o.genes ? o.genes[0] : 1)); // K-ATP channels make DA neurons fuel-sensitive (Liss et al. 2005)
    if (o.decision !== "v30") add("RAPHE", /* v3.2 BUG FIX: in v3.0 this call sat inside the comment above, so raphe had no drive (5-HT ~ 0) */ (rem ? 0.05 : 0.2 + 0.25 * wake) * prec * ATPf + 0.1 * this.vagal);
    add("LC", rem ? 0 : 0.15 + 0.25 * wake + 0.3 * this.cortisol + 1.2 * kIn + 0.3 * this.predErr + (this.stim.LC || 0) * 0.3); add("BF", (awake || rem ? 0.5 : 0.08) * ATPf);
    add("INS", 0.1 + 0.8 * kIn + 0.3 * clamp(1 - bg) + 0.002 * Math.abs(this.hr - 70)); add("SCN", o.scnLesion ? 0 : 0.3 + 0.3 * scnOut); add("MOT", 0.1 * wake);
    add("ENS", 0.1 + 0.2 * gutFill / 4 + 0.3 * paraGut); for (const k in this.stim) if (R0[k] !== undefined && k !== "LC") add(k, this.stim[k] * 0.3);
    if (ge36(o.mind ?? MIND_DEFAULT) && !o.visceralLesion && !o.insulaLesion) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M36.visK * (i % 2 ? 1 - bg : bg - 1); /* v3.6 (handoff #1 interoception): vagal/NTS-like visceral glucose afferent with opponent glucose-on / glucose-off INS cells (Craig 2002; glucose-sensing vagal afferents), signed so it does not saturate above setpoint */
    if (o.insulaLesion) add("INS", -5); if (o.scnLesion) add("SCN", -5);
    { const M = this.mind; const gate = awake ? 1 : rem ? 0.2 : 0.05; // thalamic sensory gating by sleep stage; attention gain per modality; top-down prediction into THAL; broadcast -> HIP; motor -> MOT; pain -> INS
      for (let i = 0; i < 16; i++) { ext[R0.SENS + i] += TUNE.sensIn * gate * this.sens[i] * M.att[i >> 2]; ext[R0.THAL + i] += M.td[i]; }
      if (o.cortex !== "v31" && this.t < CX.dev && !o.devLesion) { const rd = this.rd; this.devSens.fill(0); for (let m = 0; m < 4; m++) if (rd() < 0.5) { const p = 3 * rd(); for (let j = 0; j < 4; j++) this.devSens[m * 4 + j] = Math.exp(-((j - p) ** 2) / 0.5); }
        for (let i = 0; i < 16; i++) ext[R0.THAL + i] += CX.devAmp * this.devSens[i]; } // v3.4 developmental spontaneous waves injected at the thalamic relay (retinogeniculate-wave analogue, not sleep-gated), ticks 0..CX.dev-1
      for (let i = 0; i < 8; i++) ext[R0.HIP + 16 + i] += 0.6 * M.bcOut[i]; for (let i = 0; i < 8; i++) ext[R0.MOT + i] += 0.8 * M.motor;
      ext[R0.INS] += 2 * clamp(1 - this.integrity); for (let m = 0; m < 4; m++) if (this.modLesion[m]) for (let j = 0; j < 13; j++) ext[R0.CTX + m * 13 + j] = -5; }
    const exc = clamp(this.nm.Glu.P, 0.2, 1.2) * (1 - 0.5 * clamp(nmE("eCB"))) * (0.6 + 0.4 * brainF), inh = 0.6 + 0.6 * nmE("GABA") + 0.5 * this.S * 0;
    const ne = nmE("NE"), adenTh = 0.25 * this.S; // adenosine raises thresholds (A1 receptors)
    const SUB = 6; const cnt = new Float32Array(NNEU); const syn = this.syn; let nsp = 0;
    const inp = new Float32Array(NNEU);
    const c34 = o.cortex !== "v31", crit = this.t < CX.dev ? CX.crit : 1, plast = this.learn && c34, stdpOn = plast && !o.stdpLesion, homeo = plast && !o.homeoLesion, aMod = crit * clamp(nmE("ACh") / 0.3, 0, 1.5), pk = this.pk, nmK = CX.nmdaK;
    if (o.eprop) this.eligT.fill(0); const v36n = ge36(o.mind ?? MIND_DEFAULT) && c34 && M36.dendK > 0; const v37c = is37(o.mind ?? MIND_DEFAULT) && c34, slowKe = v37c ? M37.slowK : M36.slowK; const v36s = ge36(o.mind ?? MIND_DEFAULT) && c34 && !o.slowLesion && slowKe > 0, slowDec = Math.exp(-1 / (M36.slowTau * SUB)); const v37d = v37c && M37.dendK > 0; const sdiv = [1, 1, 1, 1]; /* v3.6 (handoff #2): within-module CTX->CTX assembly synapses also drive a slow NMDA-like current (tau slowTau ticks; NMDA decay ~50-100 ms, Wang 1999/2001) so evoked activity can reverberate */
    for (let s = 0; s < SUB; s++) { if (v36s && v37c) for (let m = 0; m < 4; m++) { let c = 0; for (let n = 0; n < 13; n++) c += this.spk[R0.CTX + m * 13 + n]; this.modAct[m] = 0.9 * this.modAct[m] + 0.1 * c / 13; sdiv[m] = 1 / (1 + M37.inhG * 13 * this.modAct[m]); } /* v3.7: inhibition-stabilised reverberation: the slow NMDA current is divided by the module's recent E activity (shunting feedback inhibition; Ozeki et al. 2009, Wang 2001) so it sustains activity without runaway */
      for (let i = 0; i < NNEU; i++) { const cortical = i >= R0.CTX && i < R0.CTX + 64; const g = cortical ? 1 + 0.5 * ne : 1;
        const I = ext[i] + inp[i] + (c34 ? this.nmda[i] : 0) + (v36s ? this.nmdaS[i] * (v37c && i >= R0.CTX && i < R0.CTX + 52 ? sdiv[Math.floor((i - R0.CTX) / 13)] : 1) : 0) + (v37d ? M37.dendK * this.dend[i] / (1 + Math.exp(-(this.v[i] - M37.dendVh) / M37.dendVs)) : 0) + (v36n ? M36.dendK * this.dend[i] / (1 + Math.exp(-(this.v[i] - M36.dendVh) / M36.dendVs)) : 0); if (c34) this.nmda[i] *= nmK; if (v36s) this.nmdaS[i] *= slowDec; if (v36n || v37d) this.dend[i] = 0; /* v3.6: cross-module input lands on NMDA-rich distal dendrites; Mg2+ block makes it count only when the cell is already depolarised by its own input (Jahr & Stevens 1990; Larkum 2013) -> conjunctive codes */
        // v3.3 (opt-in): spiking liquid time-constant neuron (Hasani et al. 2021 LTC; Yin, Corradi & Bohte 2023 LTC-SN; Vanhalle & Gielen 2025 sLTC):
        // conductance-like gating makes tau input-dependent (strong synaptic drive shortens tau) and neuromodulator-dependent (ACh lengthens cortical/hippocampal tau, NE shortens it)
        const ts = o.tauScale ?? 1; let dec = ts === 1 ? 0.8 : Math.exp(-1 / (LTC_TAU0 * ts)); if (o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + 52) { // v3.4 learned-gate LTC (CTX-E only): theta = [log tau0, aACh, bIn, cNE], learned by e-prop (Bellec et al. 2020) on tuning seeds, then frozen in LTC_LEARNED
          const th = this.gate, ach = nmE("ACh"), ai = Math.abs(inp[i]), fA = 1 + th[1] * ach, fI = 1 + th[2] * ai, fN = 1 + th[3] * ne; const tau = Math.max(0.5, ts * Math.exp(th[0]) * fA / (fI * fN)); dec = Math.exp(-1 / tau); this.tau[i] = tau;
          if (o.eprop) { const dd = (dec / (tau * tau)) * tau, drv = this.v[i] - g * I / 0.2, b = i * 4; const dT = [1, ach / fA, -ai / fI, -ne / fN]; // d tau/d theta_k / tau
            for (let k = 0; k < 4; k++) this.elig[b + k] = dec * this.elig[b + k] + dd * dT[k] * drv; } }
        else if (o.ltc) { const tau = ts * LTC_TAU0 * (1 + TUNE.ltcAch * (cortical || (i >= R0.HIP && i < R0.HIP + 32) ? nmE("ACh") : 0)) / ((1 + TUNE.ltcIn * Math.abs(inp[i])) * (1 + TUNE.ltcNe * (cortical ? ne : 0))); dec = Math.exp(-1 / tau); this.tau[i] = tau; }
        this.v[i] = dec * this.v[i] + g * I * (o.ltc || ts !== 1 ? (1 - dec) / 0.2 : 1); inp[i] = 0; this.xTr[i] *= 0.7; this.yTr[i] *= 0.7;
        const thr = this.th[i] * (1 + (2 - 2 * clamp(ATPf, 0, 1)) * 0.5) + (cortical ? adenTh : 0) + this.thA[i]; this.spk[i] = 0;
        if (o.eprop && o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + 52) { const psi = 0.3 * Math.max(0, 1 - Math.abs(this.v[i] - thr) / Math.max(0.1, thr)), b = i * 4; for (let k = 0; k < 4; k++) this.eligT[b + k] += psi * this.elig[b + k] / SUB; if (this.v[i] > thr) for (let k = 0; k < 4; k++) this.elig[b + k] = 0; } // e-prop eligibility: pseudo-derivative x d v/d theta (reset cuts the trace)
        if (this.v[i] > thr) { this.spk[i] = 1; this.v[i] = 0; cnt[i]++; nsp++; } }
      for (let i = 0; i < NNEU; i++) if (this.spk[i]) { for (const si of this.out[i]) { const w = syn.w[si] * this.mask[si]; const q = syn.post[si]; if (v36n && this.kind[si] === 3) { this.dend[q] += w * exc; continue; } if (v37d && this.kind[si] === 3) this.dend[q] += w * exc; /* v3.7: cross-module input ALSO drives an NMDA dendritic plateau that only counts when the soma is depolarised (added to, not diverted from, the somatic input) */
            if (c34 && pk[si]) { if (pk[si] === 2 && !o.nmdaLesion) { this.nmda[q] += w * exc * 0.35; if (v36s && this.kind[si] === 2) this.nmdaS[q] += w * exc * slowKe; else if (v36s && v37c && this.kind[si] === 8) this.nmdaS[q] += w * exc * slowKe * M37.fbS; /* v3.7: the corticothalamic loop also carries the slow NMDA component (L6 -> relay synapses are NMDA-rich; Sherman & Guillery 2002) */ } else inp[q] += w > 0 ? w * exc : w * inh; // v3.4: assembly synapses act through a slow NMDA-like current
              if (pk[si] === 3) { if (homeo) syn.w[si] = clamp(syn.w[si] - CX.vEta * crit * (this.xTr[q] - 2 * CX.rho * 2.8), -3 * CX.iE, 0); } // Vogels iSTDP (pre spike): |w| += eta (post trace - alpha)
              else if (stdpOn) syn.w[si] -= CX.aM * aMod * syn.w[si] * this.xTr[q]; // multiplicative STDP depression (post-before-pre)
              continue; }
            inp[q] += w > 0 ? w * exc : w * inh; if (syn.plastic[si] && this.learn) syn.w[si] = clamp(w - 0.002 * this.yTr[syn.post[si]] * (0.5 + da), 0.01, 2); }
          if (c34 && (stdpOn || homeo)) for (const si of this.inn[i]) { const pre2 = syn.pre[si]; if (pk[si] === 3) { if (homeo) syn.w[si] = Math.max(-3 * CX.iE, syn.w[si] - CX.vEta * crit * this.xTr[pre2]); } else if (stdpOn) syn.w[si] += CX.aP * aMod * syn.w[si] * this.xTr[pre2]; } // STDP potentiation (pre-before-post); iSTDP on post spike
          for (const si of this.out[i]) void si; this.xTr[i] += 1; }
      for (let i = 0; i < NNEU; i++) if (this.spk[i] && i >= R0.CTX && i < R0.CTX + 52 && this.learn) { // STDP potentiation of incoming plastic synapses, DA-gated (three-factor)
          this.yTr[i] += 1; } }
    if (this.learn) for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && cnt[syn.post[si]] && this.xTr[syn.pre[si]] > 0.05) syn.w[si] = clamp(syn.w[si] + 0.003 * this.xTr[syn.pre[si]] * (0.5 + da) - 0.0005 * (syn.w[si] - 0.35), 0.01, 2);
    for (const [n] of REGIONS) { let s = 0; for (let i = R0[n]; i < R0[n] + RN[n]; i++) { s += cnt[i]; this.rate[i] = cnt[i] / SUB; } this.regionRate[n] = s / (RN[n] * SUB); }
    if (c34) { for (let i = R0.CTX; i < R0.CTX + 64; i++) this.rateAvg[i] += 0.01 * (this.rate[i] - this.rateAvg[i]);
      if (stdpOn) { // competitive normalisation: each E neuron's TC input sum and each THAL line's TC output sum are held fixed (one Sinkhorn step per tick), recurrent input capped
        for (let i = R0.CTX; i < R0.CTX + 52; i++) { let sT = 0, sR = 0; for (const si of this.inn[i]) { if (pk[si] === 1) sT += syn.w[si]; else if (pk[si] === 2) sR += syn.w[si]; }
          for (const si of this.inn[i]) { if (pk[si] === 1 && sT > 0) syn.w[si] *= CX.tcSum / sT; else if (pk[si] === 2 && sR > CX.recMax) syn.w[si] *= CX.recMax / sR; } }
        for (let i = R0.THAL; i < R0.THAL + 16; i++) { let sO = 0, nO = 0; for (const si of this.out[i]) if (pk[si] === 1) { sO += syn.w[si]; nO++; } if (sO > 0) for (const si of this.out[i]) if (pk[si] === 1) syn.w[si] *= (nO * CX.tcSum / 4) / sO; } }
      if (homeo) for (let i = R0.CTX; i < R0.CTX + 52; i++) this.thA[i] = clamp(this.thA[i] + CX.hEta * crit * clamp(nmE("ACh") / 0.3, 0, 1) * (this.rate[i] - CX.rho), -0.3, 2); } // intrinsic homeostatic plasticity
    this.ensRate = this.regionRate.ENS; this.mind.step(this); this.cogCost = this.mind.cost;
    // neuromodulator kinetics: synthesis (precursor x ATP x enzyme), release (nucleus spikes x pool), Michaelis-Menten reuptake, degradation
    const R = this.regionRate; let synthCost = 0;
    const kin = (k: string, src: number, pre: number, ksyn: number, vmax: number, km: number, kdeg: number): void => { const m = this.nm[k]; const sy = ksyn * pre * clamp(ATPf) * (1 - m.P / 1.5); m.P += sy; synthCost += 0.002 * Math.max(0, sy);
      const rel = 0.25 * src * m.P; m.P -= rel; m.E += rel; const up = vmax * m.E / (km + m.E); m.E -= up + kdeg * m.E; m.P += 0.7 * up; m.E = Math.max(0, m.E); m.P = Math.max(0, m.P); };
    kin("DA", R.VTA, prec, 0.03, 0.1, 0.4, 0.03); kin("5HT", R.RAPHE, prec * (o.vagotomy ? 0.85 : 1), 0.03, 0.1, 0.4, 0.03); kin("NE", R.LC, this.nm.DA.P * 0.5 + 0.2 * prec, 0.03, 0.1, 0.4, 0.03);
    kin("ACh", R.BF, clamp(this.blood.glc / 3 + this.blood.ket), 0.04, 0.1, 0.4, 0.03); const ctxRel = R.CTX * (o.cortex !== "v31" ? CX.gluK : 1); // v3.4: release calibration so the sparser v3.4 cortex leaves the global Glu/GABA pools where v3.1 had them (tuned on seeds 2000..2002)
    kin("Glu", ctxRel * 1.5, clamp(this.brainGlc / 0.6), 0.06, 0.5, 0.5, 0.02); kin("GABA", R.STR + ctxRel * 0.3, this.nm.Glu.P, 0.04, 0.4, 0.5, 0.02);
    kin("eCB", clamp(R.CTX * 3 - 0.3, 0, 2), clamp(this.blood.ffa), 0.02, 0.2, 0.3, 0.1); // endocannabinoids made on demand from membrane lipids (fatty acids)
    if (o.daClamp !== undefined) this.nm.DA.E = o.daClamp;
    // ---------- autonomic + heart ----------
    this.symp = clamp((o.sympathectomy ? 0.2 : 1) * (0.1 + 0.8 * R.LC + 0.4 * this.cortisol + 0.4 * clamp(0.8 - bg) + 0.2 * R.HYP));
    this.para = clamp(0.3 + 0.4 * (1 - wake) + 0.5 * this.vagal * 0.5 - 0.3 * R.LC);
    this.hr += 0.2 * (60 + 70 * this.symp - 25 * this.para - this.hr); this.perfusion = this.hr / 70;
    // ---------- action selection: spiking striatal race, value in hippocampal-site->striatal synapses ----------
    this.level = o.level ?? Math.max(1, Math.min(4, 1 + Math.floor(3 * clamp(nmE("ACh")) * clamp(ATPf) * brainF)));
    const hunger = R.HYP - 0.8 * this.vagal * 0.5; let decideSpikes = 0;
    const v38e = is38(o.mind ?? MIND_DEFAULT); const fatDef = v38e ? clamp(1 - this.fat / M38.fSet) : 0; /* v3.8 energy budget: adiposity (leptin-like) deficit signal; fat below the defended set point lowers leptin, which disinhibits AgRP feeding drive and lowers thyroid-driven thermogenesis (Ahima et al. 1996; Leibel et al. 1995) */
    if (awake && !this.dead && r() < (o.fixedDrive ? 0.12 : clamp((3 * hunger - 0.1 + (v38e ? M38.fK * fatDef : 0)) * (o.genes ? o.genes[2] : 1)))) { const { k, sp } = this.choose(da); decideSpikes = sp; this.foraged++; this.lastChoice = k; this.choices.push(k);
      let got = r() < this.pTrue[k]; if (got && o.pool) { if (o.pool.food >= 2.2) o.pool.food -= 2.2; else got = false; } if (got && !o.starve) { this.feed(2.2); this.rewards++; }
      if (o.deplete && got) this.depl[k] = 1; this.visits[k]++; this.lastVisit[k] = this.t;
      if (o.danger && r() < this.danger[k]) { this.damage(0.08); this.predErr += 0.5; if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.3 * (1 - this.wAv[k]); } else if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.05 * (0 - this.wAv[k]);
      const rew = got && !o.starve ? 1 : 0; const v36d = ge36(o.mind ?? MIND_DEFAULT); const v37f = is37(o.mind ?? MIND_DEFAULT); if (v37f && this.learn && M37.dLr > 0) { /* v3.7 forward model of self-caused depletion: success at a site depletes it (efference copy of the own harvest); depletion strength is learned by regression of outcomes on believed depletion */ const pu = this.bA[k] / (this.bA[k] + this.bB[k]), dh = this.dHat[k]; if (dh > 0.05) { const e = rew - pu * (1 - this.dDelta * dh); this.dDelta = clamp(this.dDelta - M37.dLr * e * pu * dh, 0, 1); } }
      if (v36d && this.learn) { const dw = v37f ? 1 - this.dDelta * this.dHat[k] : 1; this.bA[k] += rew; this.bB[k] += (1 - rew) * dw; /* v3.7: a failure at a site believed depleted is weak evidence about its base rate */ } if (v37f && rew) this.dHat[k] = 1;
      if (v36d && this.learn && !o.rpeLesion) { /* v3.6 latent-cause inference (Gershman, Blei & Niv 2010; Wilson et al. 2014 OFC state): two value maps; a leaky log-likelihood ratio of outcomes under the stored vs the active map; crossing threshold swaps maps, so a reversed world is recognised rather than relearned */
        const pc = clamp(this.wSite[k], 0.02, 0.98), pa = clamp(this.wAlt[k], 0.02, 0.98); this.lcLLR = Math.max(-M36.lcThr, M36.lcDecay * this.lcLLR + Math.log(rew ? pa / pc : (1 - pa) / (1 - pc))); if (this.lcLLR > M36.lcThr) { const t2 = this.wAlt.slice(); this.wAlt.set(this.wSite); this.wSite.set(t2); this.lcLLR = 0; this.lcSwitches++; }
        for (let j = 0; j < SITES; j++) { this.sN[j] *= M36.schDecay; this.sR[j] *= M36.schDecay; } this.sN[k] += 1; this.sR[k] += rew; }
      if (this.learn && !o.rpeLesion) { const rpe = rew - this.wSite[k]; this.vol += 0.05 * (Math.abs(rpe) - this.vol); this.nm.DA.E += 0.05 * Math.max(0, rpe) * prec; const v35d = ge35(o.mind ?? MIND_DEFAULT); if (v35d) { /* v3.5: Pearce-Hall associability: per-site learning rate tracks recent unsigned RPE, so learning speeds up after reversals */ this.wSite[k] += (M35.lrBase + M35.lrVol * this.assocPH[k]) * rpe * (0.5 + nmE("ACh")); this.assocPH[k] = 0.7 * this.assocPH[k] + 0.3 * Math.abs(rpe); } else this.wSite[k] += 0.01 * rpe * (0.5 + nmE("ACh")); // slow striatal learning; hippocampus stores the episode (complementary learning systems)
        if (r() < 0.3 + 0.6 * nmE("ACh")) { this.episodes.push({ k, r: rew, p: Math.abs(rpe) }); if (this.episodes.length > 200) this.episodes.shift(); } } }
    // ---------- sleep replay (NREM: consolidation) and dreams (REM: generative recombination) ----------
    if (this.learn && !o.rpeLesion && o.replay !== "none" && !awake && this.episodes.length) { const E = this.episodes; const v32 = o.decision !== "v30"; let tot = 0; if (v32) for (const ep of E) tot += ep.p + 0.05;
      const pick = (): { k: number; r: number; p: number } => { if (!v32) return E[Math.floor(E.length * r())]; let u = r() * tot; for (const ep of E) { u -= ep.p + 0.05; if (u <= 0) return ep; } return E[E.length - 1]; }; // prioritised replay (Mattar & Daw 2018)
      if ((n3 || this.stage === 2) && r() < 0.5 + 0.3 * this.liminal) { for (let j = 0; j < 4; j++) { const ep = pick(); const k = ep.k;
          this.wSite[k] += 0.04 * (ep.r - this.wSite[k]); if (v32) ep.p *= 0.9; /* replayed memories lose priority */ const pred = this.featC[this.siteC[k]] + this.featS[this.siteS[k]]; const d = ep.r - pred; this.featC[this.siteC[k]] += 0.08 * d; this.featS[this.siteS[k]] += 0.08 * d;
          for (let i = R0.HIP + 2 * k; i < R0.HIP + 2 * k + 2; i++) this.v[i] += 1; }
        if (ge35(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < M35.featIt * 4; it++) { /* v3.5: NREM schema consolidation: extra passes fitting the colour+shape factor model to stored episodes */ const ep = E[Math.floor(r() * E.length)]; const k = ep.k; const d = ep.r - this.featC[this.siteC[k]] - this.featS[this.siteS[k]]; this.featC[this.siteC[k]] += 0.03 * d; this.featS[this.siteS[k]] += 0.03 * d; }
        if (ge36(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < 4; it++) { /* v3.6: schema extraction (Tse et al. 2007; McClelland 2013): the colour+shape factor model is fitted by weighted least squares (alternating, shrunk to the prior 0.15) to the hippocampus' per-site outcome statistics, not to single noisy episodes */
          for (let c = 0; c < 4; c++) { let nu = M36.schLam * 0.15, de = M36.schLam; for (let k = 0; k < SITES; k++) if (this.siteC[k] === c && this.sN[k] > 0) { nu += this.sR[k] - this.sN[k] * this.featS[this.siteS[k]]; de += this.sN[k]; } this.featC[c] = nu / de; }
          for (let c = 0; c < 4; c++) { let nu = M36.schLam * 0.15, de = M36.schLam; for (let k = 0; k < SITES; k++) if (this.siteS[k] === c && this.sN[k] > 0) { nu += this.sR[k] - this.sN[k] * this.featC[this.siteC[k]]; de += this.sN[k]; } this.featS[c] = nu / de; } } }
      if (rem && o.replay !== "nremOnly" && r() < 0.9) { const a = E[Math.floor(r() * E.length)], b = E[Math.floor(r() * E.length)]; const c = this.siteC[a.k], s = this.siteS[b.k]; const k = s * 4 + c;
        const vhat = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[c] + this.featS[s]); const v40r = is40(o.mind ?? MIND_DEFAULT); if (!this.access[k]) { if (v40r) this.dreamBelief(k, vhat); else this.wSite[k] += 0.25 * (vhat - this.wSite[k]); }
        if (ge35(o.mind ?? MIND_DEFAULT) && M35.remAll) for (let k2 = 0; k2 < SITES; k2++) if (!this.access[k2]) { /* v3.5: each dream recombines every unexperienced colour x shape pair */ const vh = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[this.siteC[k2]] + this.featS[this.siteS[k2]]); if (v40r) this.dreamBelief(k2, vh); /* v4.0: the dream writes a low-confidence BELIEF (mean vh, pseudo-count dreamC), never the learned value */ else this.wSite[k2] += M35.remLr * (vh - this.wSite[k2]); } } }
    if (n3 && this.learn && o.decision !== "v30") for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si]) syn.w[si] += 0.0005 * (0.35 - syn.w[si]); // synaptic homeostasis: N3 down-scaling (Tononi & Cirelli 2014)
    if (is37(o.mind ?? MIND_DEFAULT)) for (let k = 0; k < SITES; k++) this.dHat[k] = Math.max(0, this.dHat[k] - 1 / M37.dTau);
    if (ge36(o.mind ?? MIND_DEFAULT)) { const fg = Math.exp(-1 / (is37(o.mind ?? MIND_DEFAULT) ? M37.igTau : M36.igTau)); for (let k = 0; k < SITES; k++) { this.bA[k] = 1 + (this.bA[k] - 1) * fg; this.bB[k] = 1 + (this.bB[k] - 1) * fg; } } // v3.6: beliefs decay toward the prior (non-stationary world)
    for (let k = 0; k < SITES; k++) { if (this.depl[k] > 0) this.depl[k] = Math.max(0, this.depl[k] - 1 / 120); if (o.deplete) this.pTrue[k] = this.pBase[k] * (1 - 0.9 * this.depl[k]); }
    let repairATP = 0; if (!o.repairLesion && this.tissue < 10) { const f2 = Math.max(0, Math.min(10 - this.tissue, 0.01 * clamp(ATPf) * clamp(this.blood.aa - 0.3), this.blood.aa)); this.blood.aa -= f2; this.tissue += f2; repairATP = 0.5 * f2; } this.integrity = this.tissue / 10;
    // ---------- latent state (online Oja PCA of 12 region rates), liminality, thought curvature ----------
    const x = REGIONS.slice(0, 12).map(([n]) => this.regionRate[n]); this.pcaUpdate(x); const zt = this.pc.map((p) => p.reduce((s, w, i) => s + w * x[i], 0)); this.z.push(zt); if (this.z.length > 60) this.z.shift();
    if (this.z.length >= 3) { const n = this.z.length; const a = this.z[n - 3], b = this.z[n - 2], c = this.z[n - 1]; const v1 = b.map((q, i) => q - a[i]), v2 = c.map((q, i) => q - b[i]);
      const n1 = Math.hypot(...v1), n2 = Math.hypot(...v2); const cos = n1 * n2 > 1e-9 ? v1.reduce((s, q, i) => s + q * v2[i], 0) / (n1 * n2) : 1; const k = Math.acos(clamp(cos, -1, 1)) / Math.max(0.02, (n1 + n2) / 2);
      this.kappa = clamp(k / 60); this.kHist.push(this.kappa); if (this.kHist.length > 1440) this.kHist.shift(); }
    // ---------- quantum layer: angles set by neuromodulators; measurement feeds striatal noise sign; QGT trace scales noise ----------
    this.qth = [Math.PI * clamp(da), Math.PI * clamp(nmE("5HT")), Math.PI * clamp(ne)]; this.q.prepare(this.qth); if (this.qb) { this.qb.prepare(this.qth); this.q.ext = this.qb.probs(); } /* v3.6: optional external statevector backend (Moonlab WASM); measurement draws stay on the seeded stream */ this.qOut = this.q.measure(this.ent()); this.health.push(this.qOut);
    if (this.t % 10 === 0) { const Q = qgt(this.qth); this.qgtTrace = Q.trace; this.berry = Q.berry[0][1]; }
    // ---------- metabolism with exact energy ledger (kJ) ----------
    this.brainUse = 0; const mv = (from: number, frac: number): number => Math.max(0, Math.min(from, from * frac));
    // absorption gut -> blood (ENS/vagal motility)
    let f = mv(this.gut.glc, 0.06 * this.motility); this.gut.glc -= f; this.blood.glc += f; f = mv(this.gut.fat, 0.025 * this.motility); this.gut.fat -= f; this.blood.ffa += f; f = mv(this.gut.prot, 0.035 * this.motility); this.gut.prot -= f; this.blood.aa += f;
    // liver: glycogen in/out, lipogenesis, ketogenesis, gluconeogenesis (+urea); adipose lipolysis; muscle protein turnover
    f = mv(this.blood.glc, 0.03 * this.insulin * (1 - this.liverGly / 60)); this.blood.glc -= f; this.liverGly += 0.95 * f; this.heat += 0.05 * f;
    f = mv(this.liverGly, 0.004 * this.glucagon + 0.002 * this.symp); this.liverGly -= f; this.blood.glc += f;
    f = mv(this.blood.glc, 0.01 * clamp(this.insulin - 0.4) * clamp(this.liverGly / 50)); this.blood.glc -= f; this.fat += 0.8 * f; this.heat += 0.2 * f;
    f = mv(this.fat, 0.00012 * (this.glucagon + this.symp + this.cortisol * 0.5) * (1 - 0.7 * this.insulin) * (v38e && M38.fast ? clamp(1 - this.blood.ffa / M38.ffaInh) : 1) * (is39(o.mind ?? MIND_DEFAULT) && M39.lipE > 0 ? Math.min(4, Math.pow(M38.fSet / Math.max(this.fat, 10), M39.lipE)) : 1)); /* v3.9: fractional lipolysis rises as adipocytes shrink (ATGL/HSL induction in prolonged fasting), so fat can be mobilised to near exhaustion */ /* v3.8 fasting: FFA product inhibition of lipolysis (FFA re-esterification / ATGL feedback) so fat release tracks demand */ this.fat -= f; this.blood.ffa += 0.9 * f; this.blood.glc += 0.1 * f /* glycerol -> gluconeogenesis */; f = mv(this.blood.ffa, 0.01 * this.insulin); this.blood.ffa -= f; this.fat += f;
    f = mv(this.blood.ffa, 0.02 * clamp(0.5 - this.insulin) * (v38e && M38.fast ? 1 + M38.ketK * clamp(1 - this.liverGly / 5) : 1)); /* v3.8 fasting: glucagon-driven CPT1 disinhibition (malonyl-CoA falls) raises hepatic ketogenesis once glycogen is depleted */ this.blood.ffa -= f; this.blood.ket += 0.8 * f; this.heat += 0.2 * f;
    f = mv(this.blood.aa, 0.004 * (this.glucagon + this.cortisol) * (v38e && M38.fast ? 1 + M38.gngK * clamp(1 - this.liverGly / 5) : 1)); /* v3.8 fasting: glucagon/cortisol induction of hepatic PEPCK once glycogen is depleted raises gluconeogenic flux */ this.blood.aa -= f; this.blood.glc += 0.75 * f; this.blood.urea += 0.1 * f; this.heat += 0.15 * f;
    const v39e = is39(o.mind ?? MIND_DEFAULT); f = mv(this.muscle, 0.00015 * this.cortisol * (1 - this.insulin) * (v38e && M38.fast ? 1 + M38.protK * clamp(1 - this.liverGly / 5) : 1) * (v39e ? (1 / (1 + M39.ketPS * this.blood.ket)) * (this.fat < M39.fCrit ? M39.p3K : 1) : 1)); /* v3.9: ketone protein sparing in phase II (Sherwin 1975; Cahill 2006) and the phase-III rise in proteolysis once fat is exhausted */ /* v3.8 fasting: glucocorticoid-driven muscle proteolysis rises once glycogen is gone, supplying gluconeogenic amino acids (phase II of starvation) */ this.muscle -= f; this.blood.aa += f; const msat = is38(o.mind ?? MIND_DEFAULT) ? clamp((M38.mMax - this.muscle) / 60) : 1; f = mv(this.blood.aa, 0.005 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * msat); this.blood.aa -= f; this.muscle += f; if (msat < 1) { f = mv(this.blood.aa, 0.005 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * (1 - msat)); this.blood.aa -= f; this.blood.glc += 0.75 * f; this.blood.urea += 0.1 * f; this.heat += 0.15 * f; } /* v3.8: muscle protein accretion saturates near a set mass; surplus amino acids are deaminated (urea) and their carbon goes to gluconeogenesis */
    f = mv(this.blood.urea, 0.01); this.blood.urea -= f; this.excreted += f; f = mv(this.blood.ket, v38e && M38.fast ? M38.ketEx : 0.003); this.blood.ket -= f; /* v3.8 fasting: renal ketone reabsorption, urinary loss <10% of production */ this.excreted += f; // renal urea + ketone loss
    // circulation: blood -> brain glucose by perfusion-limited transport
    f = Math.max(0, 0.3 * this.perfusion * (this.blood.glc / 3 - this.brainGlc / 0.6)) / (v38e && M38.fast ? 1 + M38.ketSpare * this.blood.ket : 1); /* v3.8 fasting: ketone sparing of brain glucose uptake (MCT1 up, Owen 1967: ketones supply ~2/3 of brain fuel in prolonged fasting) */ f = Math.min(f, this.blood.glc); this.blood.glc -= f; this.brainGlc += f;
    // ATP demand (kJ/min): basal, brain (per spike, x intelligence level), decision spikes, heart, motor, NM synthesis, forced wake
    const thm = v38e ? Math.max(M38.thMin, 1 - M38.thK * fatDef) : 1; /* v3.8: adaptive thermogenesis: basal (non-signalling) brain and body costs and the cardiac cost scale down in proportion to the store deficit */ const brainD = 0.004 * thm + 0.000012 * nsp * (0.6 + 0.4 * this.level) + 0.00003 * decideSpikes * this.level + synthCost + this.cogCost; const bodyD = (0.006 + 0.00006 * this.hr) * thm + (decideSpikes > 0 ? 0.004 : 0) + (forced ? 0.003 : 0) + repairATP + 0.002 * this.mind.motor + (o.genes ? 0.003 * Math.max(0, o.genes[3] - 1) : 0);
    this.brainUse = brainD; let need = brainD + bodyD; this.atp -= need; this.heat += need; this.lastChoice = -1;
    // oxidative phosphorylation: substrates -> ATP (40%) + heat (60%), brain uses glucose then ketones, body uses FFA then glucose then ketones
    const refill = Math.max(0, 2 - this.atp) * 0.5; let got = 0; const ox = (take: (x: number) => number): void => { if (got >= refill) return; const want = (refill - got) / 0.4; const s = take(want); got += 0.4 * s; this.atp += 0.4 * s; this.heat += 0.6 * s; };
    const oxBG = (w: number): number => { const s = Math.min(w * 0.4, this.brainGlc); this.brainGlc -= s; return s; }, oxBK = (w: number): number => { const s = Math.min(w * (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0 ? Math.min(0.7, 0.3 + 0.05 * this.blood.ket) : 0.3), this.blood.ket); /* v3.9: ketone share of brain fuel rises with ketonaemia (MCT1 induction) up to ~2/3 (Owen 1967) */ this.blood.ket -= s; return s; }; if (v38e && M38.fast) { ox(oxBK); ox(oxBG); } else { ox(oxBG); ox(oxBK); } /* v3.8 fasting: brain oxidises available ketones before glucose (substrate competition; Owen 1967) */ ox((w) => { const s = Math.min(w * 0.5, this.blood.ket); this.blood.ket -= s; return s; });
    const oxF = (w: number): number => { const s = Math.min(w, this.blood.ffa); this.blood.ffa -= s; return s; }, oxG = (w: number): number => { const s = Math.min(w, this.blood.glc * 0.5); this.blood.glc -= s; return s; }, oxK = (w: number): number => { const s = Math.min(w, this.blood.ket); this.blood.ket -= s; return s; }; if (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0) { ox(oxF); ox(oxK); ox(oxG); } else { ox(oxF); ox(oxG); ox(oxK); } /* v3.9 (with protein sparing): Randle glucose-fatty acid cycle: muscle oxidises FFA and ketones before glucose in fasting */
    if (o.leakyLedger) { this.heat -= 0.05 * need; this.leak++; } // negative control: deliberately broken accounting
    // adenosine (process S): rises with brain ATP turnover awake, cleared in sleep (fastest in N3)
    this.S = clamp(this.S + (awake ? 0.0008 * (brainD / 0.0075) : -(n3 ? 0.004 : 0.0022) * this.S));
    if (this.blood.glc < 0.9 || this.atp < 1.0) this.lowGlc++; else this.lowGlc = 0; if (this.lowGlc > 120) { this.dead = true; this.deathCause = this.deathCause || "hypoglycaemia"; } if (is39(o.mind ?? MIND_DEFAULT) && M39.mDeath > 0 && this.muscle < M39.mDeath && !this.dead) { this.dead = true; this.deathCause = "protein depletion (organ failure)"; } /* v3.9: death from loss of structural protein (cardiac/respiratory muscle), the terminal event of phase-III starvation */ // death: 2 h of hypoglycaemia / ATP failure
    for (const k in this.stim) { this.stim[k] *= 0.9; if (this.stim[k] < 0.01) delete this.stim[k]; }
    this.predErr *= 0.9;
    if (this.t % 2 === 0) this.record(); }
  // spiking race between striatal channels; noise from quantum (Born-rule) or classical source, amplitude set by tonic DA
  /** v4.0 REM: move an unexperienced option's Beta belief toward a dreamt mean vh with low confidence (pseudo-count dreamC). Value (wSite) is untouched; the dream raises or lowers expected reward AND keeps uncertainty high, so novelty flows through the single uncertainty term */
  dreamBelief(k: number, vh: number): void { const c = M40.dreamC, lr = M40.dreamLr; this.bA[k] += lr * (1 + c * vh - this.bA[k]); this.bB[k] += lr * (1 + c * (1 - vh) - this.bB[k]); }
  /** v4.0 individual temperament: log-normal curiosity gain drawn at first choice. With noise "quantum" the draw comes from the creature's own Q3 Born-rule measurements (the quantum layer as a source of individual variation); otherwise from a seed stream */
  birthTemper(): number { let u1: number, u2: number; if (this.o.noise === "quantum") { u1 = (this.q.measure(this.ent()) + this.ent()) / 8; u2 = this.ent(); } else { const rr = mulberry(this.o.seed * 7919 + 40); u1 = rr(); u2 = rr(); } const g = Math.sqrt(-2 * Math.log(Math.max(1e-12, u1))) * Math.cos(2 * Math.PI * u2); return Math.exp(M40.tempSD * g); }
  choose(da: number): { k: number; sp: number } { const W = 3 + 5 * (this.level - 1); const sig = 0.35 * (0.2 + 2 * clamp(da)) * (1 + 0.2 * this.qgtTrace); const cnt = new Float32Array(SITES), v = new Float32Array(SITES); let sp = 0;
    const v32 = this.o.decision !== "v30"; const keep = v32 ? 1 - 0.4 / this.level : 0.6, gain = (1 - keep) / 0.4; // v3.2: integration time constant grows with level
    const v40 = is40(this.o.mind ?? MIND_DEFAULT); let sdMu = 0; if (v40) { if (this.temper < 0) this.temper = this.birthTemper(); let na = 0; for (let k = 0; k < SITES; k++) if (this.access[k]) { sdMu += betaSD(this.bA[k], this.bB[k]); na++; } sdMu /= Math.max(1, na); } const uGate = 0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E); /* v4.0: ACh = expected uncertainty, NE = unexpected uncertainty (Yu & Dayan 2005) gate the single uncertainty term */
    const drive = new Float32Array(SITES); const beta = this.o.efeLesion ? 0 : (ge35(this.o.mind ?? MIND_DEFAULT) ? M35.efeK : 2.0 * this.vol) * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E)); // v3.5: epistemic weight no longer collapses with low volatility
    let igM = 0; if (is38(this.o.mind ?? MIND_DEFAULT) && M38.efeC > 0) { let na = 0, mn = Infinity; for (let k = 0; k < SITES; k++) if (this.access[k]) { const ig = betaIG(this.bA[k], this.bB[k]); igM += ig; na++; mn = Math.min(mn, ig); } igM = M38.efeC * (M38.efeRef ? (na ? mn : 0) : igM / Math.max(1, na)); } /* v3.8: centred epistemic value: information gain enters relative to the mean over available options (reference-dependent value coding; Louie & Glimcher 2012), so a uniform uncertainty bonus cannot saturate the evidence race */
    let wMu = 0; if (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0) { let na = 0; for (let k = 0; k < SITES; k++) if (this.access[k]) { wMu += this.wSite[k]; na++; } wMu /= Math.max(1, na); } /* v3.9: D1-pathway gain on learned value differences, centred on the mean of available options (Collins & Frank 2014 OpAL; centring keeps a uniform value from saturating the race) */
    for (let k = 0; k < SITES; k++) { let w = this.wSite[k] + (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0 ? M39.vK * (this.wSite[k] - wMu) : 0); if (v32 && this.level >= 3) w += 0.5 * (clamp(this.featC[this.siteC[k]] + this.featS[this.siteS[k]]) - w); // deliberation: model-based feature prior
      w -= (1 + this.cortisol) * this.wAv[k] * clamp(1.2 - 0.6 * this.ghrelin); // learned aversive value traded against hunger
      w += v40 ? (this.o.efeLesion ? 0 : M40.uK * this.temper * uGate * (betaSD(this.bA[k], this.bB[k]) - sdMu) / SD0) /* v4.0: ONE value-plus-uncertainty term replaces the v3.5 time-since-visit, v3.6 info-gain, v3.8 centring and v3.9 vK drives: centred posterior SD (directed exploration; Wilson et al. 2014), scaled by an individual temperament */ : ge36(this.o.mind ?? MIND_DEFAULT) ? (this.o.efeLesion ? 0 : M36.efeK * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E)) * (betaIG(this.bA[k], this.bB[k]) - igM) / IG0) /* v3.6: expected information gain (mutual information between the next outcome and the site's reward probability under its Beta belief) = epistemic part of expected free energy (Friston et al. 2015) */ : ge35(this.o.mind ?? MIND_DEFAULT) ? beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / M35.efeTau)) / Math.pow(1 + this.visits[k], M35.efeVis) /* v3.5: uncertainty about a site regrows with time since the last look (non-stationary world); visit-count discount exponent efeVis */ : beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / 200)) / Math.sqrt(1 + this.visits[k]); if (is37(this.o.mind ?? MIND_DEFAULT)) { const avail = 1 - M37.depW * this.dDelta * this.dHat[k]; if (!this.o.rpeLesion) w += (v40 ? M40.mK : M37.bmW) * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]); /* v3.7 expected free energy: pragmatic value = posterior-mean reward under the Beta belief, blended with the striatal value; both pragmatic and epistemic terms scaled by the believed availability of the site (depletion forward model) */ w = (w - 0.2) * avail + 0.2; } drive[k] = w; } // epistemic value
    const adenNoise = 1.0 * Math.max(0, this.S - 0.5); const v36q = ge36(this.o.mind ?? MIND_DEFAULT);
    for (let s = 0; s < W; s++) for (let k = 0; k < SITES; k++) { if (!this.access[k]) continue; let n: number;
      if (this.o.noise === "quantum" && v36q) { /* v3.6: von Neumann debiasing of the Born-rule bit (pairs 01 -> 0, 10 -> 1, 00/11 discarded): the sign is exactly unbiased whatever the qubit bias; after 8 failed pairs fall back to the seeded stream */ let bit = -1; for (let tr = 0; tr < 8 && bit < 0; tr++) { const b1 = this.q.measure(this.ent()) & 1, b2 = this.q.measure(this.ent()) & 1; if (b1 !== b2) bit = b1; } if (bit < 0) bit = this.ent() < 0.5 ? 1 : 0; const u2 = this.ent(); n = ((bit ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; }
      else if (this.o.noise === "quantum") { const u = this.q.measure(this.ent()); const u2 = this.ent(); n = (((u & 1) ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; } else { const u2 = this.ent(); n = ((this.ent() < 0.5 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; }
      v[k] = keep * v[k] + gain * (1.6 * (drive[k] - 0.2) + sig * n + adenNoise * this.gauss()); if (v[k] > 1.0) { cnt[k]++; v[k] = 0; sp++; } }
    let best = -1, bv = -1e9; for (let k = 0; k < SITES; k++) if (this.access[k]) { const s = cnt[k] + 0.01 * v[k]; if (s > bv) { bv = s; best = k; } } return { k: best, sp }; }
  pcaUpdate(x: number[]): void { const m = x; for (let p = 0; p < 3; p++) { const w = this.pc[p]; let y = 0; for (let i = 0; i < 12; i++) y += w[i] * m[i]; for (let i = 0; i < 12; i++) { let rec = 0; for (let q = 0; q <= p; q++) { let yq = 0; for (let j = 0; j < 12; j++) yq += this.pc[q][j] * m[j]; rec += yq * this.pc[q][i]; } w[i] += 0.002 * y * (m[i] - rec); } } }
  record(): void { const h = this.hist; const put = (k: string, v: number): void => { (h[k] = h[k] || []).push(v); if (h[k].length > 720) h[k].shift(); };
    put("DA", this.nm.DA.E); put("5HT", this.nm["5HT"].E); put("NE", this.nm.NE.E); put("ACh", this.nm.ACh.E); put("Glu", this.nm.Glu.P); put("GABA", this.nm.GABA.E); put("eCB", this.nm.eCB.E);
    put("glc", this.blood.glc); put("ffa", this.blood.ffa); put("ket", this.blood.ket); put("aa", this.blood.aa); put("atp", this.atp); put("fat", this.fat); put("glycogen", this.liverGly); put("hr", this.hr);
    put("insulin", this.insulin); put("glucagon", this.glucagon); put("cortisol", this.cortisol); put("ghrelin", this.ghrelin); put("melatonin", this.melatonin); put("S", this.S); put("stage", this.stage);
    put("kappa", this.kappa); put("liminal", this.liminal); put("level", this.level); put("qgt", this.qgtTrace); put("symp", this.symp); put("para", this.para); put("ledgerErr", this.ledgerError());
    for (const [n] of REGIONS) put("r_" + n, this.regionRate[n]); }
  run(ticks: number): void { for (let i = 0; i < ticks; i++) this.step(); }
  // probe: n choices (trained = sites accessible on days 1-3, novel = never accessible) with learning frozen; returns mean true reward probability of chosen sites (expected reward)
  probe(n: number, set: "trained" | "all" | "novel" = "trained"): { ev: number; entropy: number } { const save = this.learn; this.learn = false; const acc = this.access.slice(); if (set === "all") this.access.fill(1); if (set === "novel") for (let k = 0; k < SITES; k++) this.access[k] = acc[k] ? 0 : 1;
    const da = this.o.daClamp !== undefined ? this.o.daClamp : this.nm.DA.E; let s = 0; const c = new Array(SITES).fill(0); for (let i = 0; i < n; i++) { const { k } = this.choose(da); s += this.pTrue[k]; c[k]++; }
    this.access = acc; this.learn = save; let H = 0; for (const x of c) if (x) { const p = x / n; H -= p * Math.log2(p); } return { ev: s / n, entropy: H }; }
  hash(): string { let h = 2166136261; const mix = (x: number): void => { const b = new Float64Array([x]); const u = new Uint32Array(b.buffer); for (const w of u) { h ^= w; h = Math.imul(h, 16777619) >>> 0; } };
    mix(this.energy()); mix(this.nm.DA.E); mix(this.S); for (const w of this.wSite) mix(w); for (let i = 0; i < this.syn.w.length; i += 97) mix(this.syn.w[i]); return (h >>> 0).toString(16); }
  // compact read-out used by the renderer (visuals read ONLY this)
  // v3.4 e-prop gate update (training curriculum only): learning signal = readout error fed back through the Mind's own readout weights (symmetric e-prop), applied to the shared CTX-E gate theta
  epropLearn(m: number, label: number, x: number[], eta = 0.02): void { const M = this.mind, cls = M.cls[m], rec = M.recon[m], xin = M.rate[m]; const p = msoftmax(cls.out(xin), 3), z = rec.out(xin); let nn = 1; for (const v of xin) nn += v * v;
    const gsum = [0, 0, 0, 0]; for (let j = 0; j < MW; j++) { let L = 0; for (let k = 0; k < 4; k++) L += 3 * ((k === label ? 1 : 0) - p[k]) * cls.W[k * (cls.nIn + 1) + j] + ((x[k] - z[k]) / nn) * rec.W[k * (rec.nIn + 1) + j]; const b = (R0.CTX + m * MW + j) * 4; for (let k = 0; k < 4; k++) gsum[k] += L * CX.norm * this.eligT[b + k]; }
    for (let k = 0; k < 4; k++) this.gate[k] += eta * clamp(gsum[k], -1, 1); this.gate[0] = clamp(this.gate[0], Math.log(1.5), Math.log(40)); for (let k = 1; k < 4; k++) this.gate[k] = clamp(this.gate[k], 0, 5); this.gHist.push(this.gate.slice()); }
  rateAvgMod(m: number): number { let s = 0; for (let j = 0; j < MW; j++) s += this.rateAvg[R0.CTX + m * MW + j]; return s / MW; }
  view(): Record<string, number> { const R = this.regionRate; return { DA: this.nm.DA.E, SER: this.nm["5HT"].E, NE: this.nm.NE.E, ACh: this.nm.ACh.E, eCB: this.nm.eCB.E, atp: this.atp, glc: this.blood.glc, fat: this.fat, hr: this.hr, stage: this.stage, S: this.S, kappa: this.kappa, liminal: this.liminal, level: this.level, light: this.light, ctx: R.CTX, hip: R.HIP, str: R.STR, mot: R.MOT, ens: R.ENS, q: this.qOut, gut: this.gut.glc + this.gut.fat + this.gut.prot, symp: this.symp, para: this.para }; }
}
