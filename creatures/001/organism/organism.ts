// ===== Creature 001 organism v3.0: one coupled, deterministic, seedable living-system simulation =====
// Runs headless in node (tests) and in the browser (app.tsx drives rendering + inspector from this state only).
// 1 tick = 1 simulated minute. Spiking substeps inside each tick. Every number labelled "illustrative" in
// SYSTEMS_DESIGN.md is a modelling choice, not a measured biological constant.
export type Rng = () => number;
export function mulberry(seed: number): Rng { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (x: number, a = 0, b = 1): number => (x < a ? a : x > b ? b : x);
const sig = (x: number): number => 1 / (1 + Math.exp(-x));

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
export class Q3 { re = new Float64Array(8); im = new Float64Array(8); constructor() { this.re[0] = 1; }
  reset(): void { this.re.fill(0); this.im.fill(0); this.re[0] = 1; }
  ry(q: number, t: number): void { const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q; for (let i = 0; i < 8; i++) if (!(i & m)) { const j = i | m; const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j]; this.re[i] = c * a - s * b; this.re[j] = s * a + c * b; this.im[i] = c * ai - s * bi; this.im[j] = s * ai + c * bi; } }
  rz(q: number, t: number): void { const m = 1 << q; for (let i = 0; i < 8; i++) { const ph = (i & m) ? t / 2 : -t / 2; const c = Math.cos(ph), s = Math.sin(ph); const a = this.re[i], b = this.im[i]; this.re[i] = a * c - b * s; this.im[i] = a * s + b * c; } }
  cx(c: number, t: number): void { const mc = 1 << c, mt = 1 << t; for (let i = 0; i < 8; i++) if ((i & mc) && !(i & mt)) { const j = i | mt; let x = this.re[i]; this.re[i] = this.re[j]; this.re[j] = x; x = this.im[i]; this.im[i] = this.im[j]; this.im[j] = x; } }
  probs(): number[] { const p: number[] = []; for (let k = 0; k < 8; k++) p.push(this.re[k] ** 2 + this.im[k] ** 2); return p; }
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

// ---------------- options: lesions, clamps, conditions ----------------
export type Opts = { seed: number; entropy?: "seeded" | "crypto"; noise?: "quantum" | "classical"; starve?: boolean; vagotomy?: boolean; scnLesion?: boolean; insulaLesion?: boolean; kappaShuffle?: boolean;
  sympathectomy?: boolean; replay?: "full" | "none" | "nremOnly" | "remShuffle"; forceWake?: boolean; daClamp?: number; level?: number; leakyLedger?: boolean; access?: "half" | "all" };
export const SITES = 16; // 4 colours x 4 shapes; reward p = 0.05 + 0.25 cv[c] + 0.25 sv[s]
export const STAGES = ["WAKE", "N1", "N2", "N3", "REM"] as const;

export class Organism {
  o: Opts; r: Rng; ent: () => number; t = 0;
  // neurons
  v = new Float32Array(NNEU); th = new Float32Array(NNEU); spk = new Uint8Array(NNEU); rate = new Float32Array(NNEU); xTr = new Float32Array(NNEU); yTr = new Float32Array(NNEU);
  syn: Syn; out: number[][] = []; ext = new Float32Array(NNEU); regionRate: Record<string, number> = {};
  // plastic action values: hippocampal site cell -> striatal channel synapses (three-factor), cortical feature model (colour/shape)
  wSite = new Float32Array(SITES).fill(0.25); featC = new Float32Array(4).fill(0.15); featS = new Float32Array(4).fill(0.15); pTrue = new Float32Array(SITES); siteC = new Int8Array(SITES); siteS = new Int8Array(SITES);
  access = new Uint8Array(SITES); episodes: { k: number; r: number }[] = [];
  // metabolism (kJ); ledger
  gut = { glc: 4, fat: 2, prot: 1.5 }; blood = { glc: 3, ffa: 1, aa: 2, ket: 0.2, urea: 0 }; liverGly = 20; fat = 400; muscle = 120; brainGlc = 0.6; atp = 2; heat = 0; excreted = 0; eaten = 0; E0 = 0; leak = 0;
  // hormones / autonomic / heart
  insulin = 0.3; glucagon = 0.3; cortisol = 0.3; ghrelin = 0.3; leptin = 0.5; melatonin = 0; symp = 0.3; para = 0.4; hr = 70; perfusion = 1; pidI = 0; pidPrev = 0;
  // neuromodulators: vesicle pool P, extracellular E
  nm: Record<string, { P: number; E: number }> = { DA: { P: 1, E: 0.3 }, "5HT": { P: 1, E: 0.3 }, NE: { P: 1, E: 0.3 }, ACh: { P: 1, E: 0.3 }, Glu: { P: 1, E: 0.3 }, GABA: { P: 1, E: 0.3 }, eCB: { P: 0.5, E: 0.1 } };
  // sleep / circadian
  S = 0.4; scnPhase = 0 /* radians, 0 = midnight */; stage = 0; ultra = 0; awakeMin = 0; asleep = false; light = 1;
  // latent / curvature / interoception
  pc: Float64Array[] = []; z: number[][] = []; kappa = 0; kHist: number[] = []; liminal = 0; predErr = 0;
  // quantum
  q = new Q3(); qth = [0.5, 0.5, 0.5]; qOut = 0; qgtTrace = 0; berry = 0; health = new Health(2.5);
  // behaviour
  level = 1; foraged = 0; rewards = 0; lastChoice = -1; choices: number[] = []; brainUse = 0; learn = true; stim: Record<string, number> = {}; vagal = 0; ensRate = 0; motility = 0;
  hist: Record<string, number[]> = {}; events: string[] = [];
  constructor(o: Opts) { this.o = { noise: "quantum", replay: "full", entropy: "seeded", access: "half", ...o }; this.r = mulberry(o.seed * 7919 + 17);
    const er = mulberry(o.seed * 104729 + 3); this.ent = this.o.entropy === "crypto" && typeof crypto !== "undefined" ? (() => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; }) : er;
    const r = this.r; const pre: number[] = [], post: number[] = [], w: number[] = [], pl: number[] = []; const has = new Set<number>();
    for (const [a, b, p] of CP) for (let i = R0[a]; i < R0[a] + RN[a]; i++) for (let j = R0[b]; j < R0[b] + RN[b]; j++) { if (i === j) continue;
      let pp = p; if (a === b && b === "CTX" && has.has(j * NNEU + i)) pp = Math.min(1, p * 4); // reciprocal over-representation ~4x (Song et al. 2005)
      if (r() < pp) { has.add(i * NNEU + j); pre.push(i); post.push(j); const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35; w.push(INHIB(i) ? -ln * 1.6 : ln); pl.push(a === "CTX" && b === "CTX" && !INHIB(i) ? 1 : 0); } }
    this.syn = { pre: Int32Array.from(pre), post: Int32Array.from(post), w: Float32Array.from(w), plastic: Uint8Array.from(pl) };
    for (let i = 0; i < NNEU; i++) { this.out.push([]); this.th[i] = 1 + 0.1 * r(); } pre.forEach((p, s) => this.out[p].push(s));
    const cv = [0, 1, 2, 3].sort(() => r() - 0.5), sv = [0, 1, 2, 3].sort(() => r() - 0.5);
    for (let k = 0; k < SITES; k++) { const c = k & 3, s = k >> 2; this.siteC[k] = c; this.siteS[k] = s; this.pTrue[k] = 0.05 + 0.25 * cv[c] / 3 + 0.25 * sv[s] / 3; }
    // half the sites accessible on days 1-3 (a Latin pattern so every colour and shape is seen twice)
    for (let k = 0; k < SITES; k++) this.access[k] = this.o.access === "all" || ((this.siteC[k] + this.siteS[k]) & 1) === 0 ? 1 : 0;
    for (let k = 0; k < 3; k++) { const v = new Float64Array(12); for (let i = 0; i < 12; i++) v[i] = this.gauss(r) * 0.3; this.pc.push(v); }
    this.E0 = this.energy(); }
  gauss(r: Rng = this.r): number { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
  energy(): number { const g = this.gut, b = this.blood; return g.glc + g.fat + g.prot + b.glc + b.ffa + b.aa + b.ket + b.urea + this.liverGly + this.fat + this.muscle + this.brainGlc + this.atp + this.heat + this.excreted; }
  ledgerError(): number { return Math.abs(this.energy() - this.E0 - this.eaten) / (this.E0 + this.eaten); }
  paramCount(): { synapses: number; plasticSynapses: number; valueSynapses: number; kinetics: number; quantum: number; total: number } {
    const syn = this.syn.w.length, pl = this.syn.plastic.reduce((a, b) => a + b, 0), val = SITES + 8, kin = NNEU /* thresholds */ + 7 * 6 /* NM kinetics */ + 40 /* metabolic/hormone rate constants */ + 36 /* latent PCA */, q = 16 + 3;
    return { synapses: syn, plasticSynapses: pl, valueSynapses: val, kinetics: kin, quantum: q, total: syn + val + kin + q }; }
  // ---------- interventions (browser inspector + tests) ----------
  feed(kJ: number): void { const f = kJ / 2.2; this.gut.glc += 1.2 * f; this.gut.fat += 0.6 * f; this.gut.prot += 0.4 * f; this.eaten += kJ; this.events.push(`t${this.t} fed ${kJ.toFixed(1)} kJ`); }
  stimulate(reg: string, amt: number): void { this.stim[reg] = (this.stim[reg] || 0) + amt; }
  inject(nm: string, amt: number): void { if (this.nm[nm]) this.nm[nm].E += amt; }
  lesion(k: keyof Opts, v: unknown = true): void { (this.o as Record<string, unknown>)[k] = v; this.events.push(`t${this.t} ${k}=${String(v)}`); }
  // ---------- one-tick update of the whole organism ----------
  step(): void { const o = this.o, r = this.r; this.t++; const minute = this.t % 1440, hour = minute / 60;
    // circadian: lights 06-18; SCN entrains to light (phase-response), SCN lesion removes rhythm
    this.light = hour >= 6 && hour < 18 ? 1 : 0; this.scnPhase += 2 * Math.PI / 1440 + (this.light ? 0.002 * Math.sin(2 * Math.PI * minute / 1440 - this.scnPhase) : 0); // light phase-response entrainment
    const scnOut = o.scnLesion ? 0 : Math.cos(this.scnPhase - 2 * Math.PI * 14 / 24); // peaks ~14:00 when entrained
    this.melatonin += 0.05 * ((this.light ? 0 : 1) * (o.scnLesion ? 0.5 : clamp(0.5 - scnOut)) - this.melatonin);
    this.ultra = (this.ultra + 1 / 90) % 1; // ultradian ~90 min (BRAC)
    // sleep: two-process (S adenosine, C circadian) flip-flop
    const C = 0.25 * scnOut + 0.1 * Math.sin(2 * Math.PI * this.ultra) * (this.asleep ? 0 : 0.5);
    const drive = this.S - C + 0.15 * this.melatonin; const forced = o.forceWake || (this.stim.LC || 0) > 3;
    if (!this.asleep && drive > 0.62 && !forced) { this.asleep = true; this.ultra = 0; } else if (this.asleep && (drive < 0.2 || forced)) this.asleep = false;
    this.liminal = Math.exp(-((drive - (this.asleep ? 0.2 : 0.62)) ** 2) / 0.004);
    if (!this.asleep) this.stage = 0; else { const u = this.ultra; this.stage = u < 0.1 ? 1 : u < 0.3 ? 2 : u < 0.75 - 0.25 * clamp(0.6 - this.S) ? (this.S > 0.35 ? 3 : 2) : 4; }
    const awake = this.stage === 0, rem = this.stage === 4, n3 = this.stage === 3;
    // hormones
    const gutFill = this.gut.glc + this.gut.fat + this.gut.prot; const bg = this.blood.glc / 3; // ~1 = setpoint
    // allostatic setpoint anticipates morning activity; PID on glucose
    const set = 1 + 0.08 * scnOut; const e = bg - set; this.pidI = clamp(this.pidI + 0.002 * e, -0.5, 0.5); const dE = e - this.pidPrev; this.pidPrev = e;
    this.insulin += 0.1 * (clamp(0.3 + 1.5 * e + this.pidI + 3 * dE + 0.2 * this.para * (o.vagotomy ? 0.3 : 1)) - this.insulin);
    this.glucagon += 0.1 * (clamp(0.3 - 1.5 * e - this.pidI + 0.3 * this.symp) - this.glucagon);
    this.cortisol += 0.02 * (clamp(0.35 + 0.25 * (o.scnLesion ? 0 : Math.cos(2 * Math.PI * (hour - 7) / 24)) + 0.6 * clamp(0.85 - bg) + 0.2 * (forced ? 1 : 0)) - this.cortisol);
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
    add("SENS", 0.25 * wake * (0.5 + this.light)); add("THAL", (awake ? 0.35 : rem ? 0.3 : 0.08)); add("CTX", 0.2 + 0.15 * nmE("ACh") + (n3 ? 0.25 * (Math.sin(this.t * 2.1) > 0 ? 1 : -0.5) : 0));
    add("HIP", 0.1 + 0.3 * nmE("ACh")); add("STR", 0.1 + 0.3 * da); add("HYP", 0.4 + 0.5 * this.ghrelin + 0.5 * clamp(1 - bg) - 0.4 * this.vagal - 0.3 * this.leptin + 0.2 * this.insulin * 0);
    add("VTA", (0.35 + 0.05 * this.ghrelin) * prec * ATPf * clamp(brainF)); // K-ATP channels make DA neurons fuel-sensitive (Liss et al. 2005) add("RAPHE", (rem ? 0.05 : 0.2 + 0.25 * wake) * prec * ATPf + 0.1 * this.vagal);
    add("LC", rem ? 0 : 0.15 + 0.25 * wake + 0.3 * this.cortisol + 1.2 * kIn + 0.3 * this.predErr + (this.stim.LC || 0) * 0.3); add("BF", (awake || rem ? 0.5 : 0.08) * ATPf);
    add("INS", 0.1 + 0.8 * kIn + 0.3 * clamp(1 - bg) + 0.002 * Math.abs(this.hr - 70)); add("SCN", o.scnLesion ? 0 : 0.3 + 0.3 * scnOut); add("MOT", 0.1 * wake);
    add("ENS", 0.1 + 0.2 * gutFill / 4 + 0.3 * paraGut); for (const k in this.stim) if (R0[k] !== undefined && k !== "LC") add(k, this.stim[k] * 0.3);
    if (o.insulaLesion) add("INS", -5); if (o.scnLesion) add("SCN", -5);
    const exc = clamp(this.nm.Glu.P, 0.2, 1.2) * (1 - 0.5 * clamp(nmE("eCB"))) * (0.6 + 0.4 * brainF), inh = 0.6 + 0.6 * nmE("GABA") + 0.5 * this.S * 0;
    const ne = nmE("NE"), adenTh = 0.25 * this.S; // adenosine raises thresholds (A1 receptors)
    const SUB = 6; const cnt = new Float32Array(NNEU); const syn = this.syn; let nsp = 0;
    const inp = new Float32Array(NNEU);
    for (let s = 0; s < SUB; s++) { for (let i = 0; i < NNEU; i++) { const cortical = i >= R0.CTX && i < R0.CTX + 64; const g = cortical ? 1 + 0.5 * ne : 1;
        this.v[i] = 0.8 * this.v[i] + g * (ext[i] + inp[i]); inp[i] = 0; this.xTr[i] *= 0.7; this.yTr[i] *= 0.7;
        const thr = this.th[i] * (1 + (2 - 2 * clamp(ATPf, 0, 1)) * 0.5) + (cortical ? adenTh : 0); this.spk[i] = 0; if (this.v[i] > thr) { this.spk[i] = 1; this.v[i] = 0; cnt[i]++; nsp++; } }
      for (let i = 0; i < NNEU; i++) if (this.spk[i]) { for (const si of this.out[i]) { const w = syn.w[si]; inp[syn.post[si]] += w > 0 ? w * exc : w * inh; if (syn.plastic[si] && this.learn) syn.w[si] = clamp(w - 0.002 * this.yTr[syn.post[si]] * (0.5 + da), 0.01, 2); }
          for (const si of this.out[i]) void si; this.xTr[i] += 1; }
      for (let i = 0; i < NNEU; i++) if (this.spk[i] && i >= R0.CTX && i < R0.CTX + 52 && this.learn) { // STDP potentiation of incoming plastic synapses, DA-gated (three-factor)
          this.yTr[i] += 1; } }
    if (this.learn) for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && cnt[syn.post[si]] && this.xTr[syn.pre[si]] > 0.05) syn.w[si] = clamp(syn.w[si] + 0.003 * this.xTr[syn.pre[si]] * (0.5 + da) - 0.0005 * (syn.w[si] - 0.35), 0.01, 2);
    for (const [n] of REGIONS) { let s = 0; for (let i = R0[n]; i < R0[n] + RN[n]; i++) { s += cnt[i]; this.rate[i] = cnt[i] / SUB; } this.regionRate[n] = s / (RN[n] * SUB); }
    this.ensRate = this.regionRate.ENS;
    // neuromodulator kinetics: synthesis (precursor x ATP x enzyme), release (nucleus spikes x pool), Michaelis-Menten reuptake, degradation
    const R = this.regionRate; let synthCost = 0;
    const kin = (k: string, src: number, pre: number, ksyn: number, vmax: number, km: number, kdeg: number): void => { const m = this.nm[k]; const sy = ksyn * pre * clamp(ATPf) * (1 - m.P / 1.5); m.P += sy; synthCost += 0.002 * Math.max(0, sy);
      const rel = 0.25 * src * m.P; m.P -= rel; m.E += rel; const up = vmax * m.E / (km + m.E); m.E -= up + kdeg * m.E; m.P += 0.7 * up; m.E = Math.max(0, m.E); m.P = Math.max(0, m.P); };
    kin("DA", R.VTA, prec, 0.03, 0.1, 0.4, 0.03); kin("5HT", R.RAPHE, prec * (o.vagotomy ? 0.85 : 1), 0.03, 0.1, 0.4, 0.03); kin("NE", R.LC, this.nm.DA.P * 0.5 + 0.2 * prec, 0.03, 0.1, 0.4, 0.03);
    kin("ACh", R.BF, clamp(this.blood.glc / 3 + this.blood.ket), 0.04, 0.1, 0.4, 0.03); kin("Glu", R.CTX * 1.5, clamp(this.brainGlc / 0.6), 0.06, 0.5, 0.5, 0.02); kin("GABA", R.STR + R.CTX * 0.3, this.nm.Glu.P, 0.04, 0.4, 0.5, 0.02);
    kin("eCB", clamp(R.CTX * 3 - 0.3, 0, 2), clamp(this.blood.ffa), 0.02, 0.2, 0.3, 0.1); // endocannabinoids made on demand from membrane lipids (fatty acids)
    if (o.daClamp !== undefined) this.nm.DA.E = o.daClamp;
    // ---------- autonomic + heart ----------
    this.symp = clamp((o.sympathectomy ? 0.2 : 1) * (0.1 + 0.8 * R.LC + 0.4 * this.cortisol + 0.4 * clamp(0.8 - bg) + 0.2 * R.HYP));
    this.para = clamp(0.3 + 0.4 * (1 - wake) + 0.5 * this.vagal * 0.5 - 0.3 * R.LC);
    this.hr += 0.2 * (60 + 70 * this.symp - 25 * this.para - this.hr); this.perfusion = this.hr / 70;
    // ---------- action selection: spiking striatal race, value in hippocampal-site->striatal synapses ----------
    this.level = o.level ?? Math.max(1, Math.min(4, 1 + Math.floor(3 * clamp(nmE("ACh")) * clamp(ATPf) * brainF)));
    const hunger = R.HYP - 0.8 * this.vagal * 0.5; let decideSpikes = 0;
    if (awake && r() < clamp(3 * hunger - 0.1)) { const { k, sp } = this.choose(da); decideSpikes = sp; this.foraged++; this.lastChoice = k; this.choices.push(k);
      const got = r() < this.pTrue[k]; if (got && !o.starve) { this.feed(2.2); this.rewards++; }
      const rew = got && !o.starve ? 1 : 0; if (this.learn) { const rpe = rew - this.wSite[k]; this.nm.DA.E += 0.05 * Math.max(0, rpe) * prec; this.wSite[k] += 0.01 * rpe * (0.5 + nmE("ACh")); // slow striatal learning; hippocampus stores the episode (complementary learning systems)
        if (r() < 0.3 + 0.6 * nmE("ACh")) { this.episodes.push({ k, r: rew }); if (this.episodes.length > 200) this.episodes.shift(); } } }
    // ---------- sleep replay (NREM: consolidation) and dreams (REM: generative recombination) ----------
    if (this.learn && o.replay !== "none" && !awake && this.episodes.length) { const E = this.episodes;
      if ((n3 || this.stage === 2) && r() < 0.5 + 0.3 * this.liminal) { for (let j = 0; j < 4; j++) { const ep = E[Math.floor(E.length * r())]; const k = ep.k;
          this.wSite[k] += 0.04 * (ep.r - this.wSite[k]); const pred = this.featC[this.siteC[k]] + this.featS[this.siteS[k]]; const d = ep.r - pred; this.featC[this.siteC[k]] += 0.08 * d; this.featS[this.siteS[k]] += 0.08 * d;
          for (let i = R0.HIP + 2 * k; i < R0.HIP + 2 * k + 2; i++) this.v[i] += 1; } }
      if (rem && o.replay !== "nremOnly" && r() < 0.9) { const a = E[Math.floor(r() * E.length)], b = E[Math.floor(r() * E.length)]; const c = this.siteC[a.k], s = this.siteS[b.k]; const k = s * 4 + c;
        const vhat = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[c] + this.featS[s]); if (!this.access[k]) this.wSite[k] += 0.25 * (vhat - this.wSite[k]); } }
    // ---------- latent state (online Oja PCA of 12 region rates), liminality, thought curvature ----------
    const x = REGIONS.slice(0, 12).map(([n]) => this.regionRate[n]); this.pcaUpdate(x); const zt = this.pc.map((p) => p.reduce((s, w, i) => s + w * x[i], 0)); this.z.push(zt); if (this.z.length > 60) this.z.shift();
    if (this.z.length >= 3) { const n = this.z.length; const a = this.z[n - 3], b = this.z[n - 2], c = this.z[n - 1]; const v1 = b.map((q, i) => q - a[i]), v2 = c.map((q, i) => q - b[i]);
      const n1 = Math.hypot(...v1), n2 = Math.hypot(...v2); const cos = n1 * n2 > 1e-9 ? v1.reduce((s, q, i) => s + q * v2[i], 0) / (n1 * n2) : 1; const k = Math.acos(clamp(cos, -1, 1)) / Math.max(0.02, (n1 + n2) / 2);
      this.kappa = clamp(k / 60); this.kHist.push(this.kappa); if (this.kHist.length > 1440) this.kHist.shift(); }
    // ---------- quantum layer: angles set by neuromodulators; measurement feeds striatal noise sign; QGT trace scales noise ----------
    this.qth = [Math.PI * clamp(da), Math.PI * clamp(nmE("5HT")), Math.PI * clamp(ne)]; this.q.prepare(this.qth); this.qOut = this.q.measure(this.ent()); this.health.push(this.qOut);
    if (this.t % 10 === 0) { const Q = qgt(this.qth); this.qgtTrace = Q.trace; this.berry = Q.berry[0][1]; }
    // ---------- metabolism with exact energy ledger (kJ) ----------
    this.brainUse = 0; const mv = (from: number, frac: number): number => Math.max(0, Math.min(from, from * frac));
    // absorption gut -> blood (ENS/vagal motility)
    let f = mv(this.gut.glc, 0.06 * this.motility); this.gut.glc -= f; this.blood.glc += f; f = mv(this.gut.fat, 0.025 * this.motility); this.gut.fat -= f; this.blood.ffa += f; f = mv(this.gut.prot, 0.035 * this.motility); this.gut.prot -= f; this.blood.aa += f;
    // liver: glycogen in/out, lipogenesis, ketogenesis, gluconeogenesis (+urea); adipose lipolysis; muscle protein turnover
    f = mv(this.blood.glc, 0.03 * this.insulin * (1 - this.liverGly / 60)); this.blood.glc -= f; this.liverGly += 0.95 * f; this.heat += 0.05 * f;
    f = mv(this.liverGly, 0.004 * this.glucagon + 0.002 * this.symp); this.liverGly -= f; this.blood.glc += f;
    f = mv(this.blood.glc, 0.01 * clamp(this.insulin - 0.4) * clamp(this.liverGly / 50)); this.blood.glc -= f; this.fat += 0.8 * f; this.heat += 0.2 * f;
    f = mv(this.fat, 0.00012 * (this.glucagon + this.symp + this.cortisol * 0.5) * (1 - 0.7 * this.insulin)); this.fat -= f; this.blood.ffa += 0.9 * f; this.blood.glc += 0.1 * f /* glycerol -> gluconeogenesis */; f = mv(this.blood.ffa, 0.01 * this.insulin); this.blood.ffa -= f; this.fat += f;
    f = mv(this.blood.ffa, 0.02 * clamp(0.5 - this.insulin)); this.blood.ffa -= f; this.blood.ket += 0.8 * f; this.heat += 0.2 * f;
    f = mv(this.blood.aa, 0.004 * (this.glucagon + this.cortisol)); this.blood.aa -= f; this.blood.glc += 0.75 * f; this.blood.urea += 0.1 * f; this.heat += 0.15 * f;
    f = mv(this.muscle, 0.00015 * this.cortisol * (1 - this.insulin)); this.muscle -= f; this.blood.aa += f; f = mv(this.blood.aa, 0.005 * this.insulin * clamp(this.blood.aa - 1, 0, 1)); this.blood.aa -= f; this.muscle += f;
    f = mv(this.blood.urea, 0.01); this.blood.urea -= f; this.excreted += f; f = mv(this.blood.ket, 0.003); this.blood.ket -= f; this.excreted += f; // renal urea + ketone loss
    // circulation: blood -> brain glucose by perfusion-limited transport
    f = Math.max(0, 0.3 * this.perfusion * (this.blood.glc / 3 - this.brainGlc / 0.6)); f = Math.min(f, this.blood.glc); this.blood.glc -= f; this.brainGlc += f;
    // ATP demand (kJ/min): basal, brain (per spike, x intelligence level), decision spikes, heart, motor, NM synthesis, forced wake
    const brainD = 0.004 + 0.000012 * nsp * (0.6 + 0.4 * this.level) + 0.00003 * decideSpikes * this.level + synthCost; const bodyD = 0.006 + 0.00006 * this.hr + (decideSpikes > 0 ? 0.004 : 0) + (forced ? 0.003 : 0);
    this.brainUse = brainD; let need = brainD + bodyD; this.atp -= need; this.heat += need; this.lastChoice = -1;
    // oxidative phosphorylation: substrates -> ATP (40%) + heat (60%), brain uses glucose then ketones, body uses FFA then glucose then ketones
    const refill = Math.max(0, 2 - this.atp) * 0.5; let got = 0; const ox = (take: (x: number) => number): void => { if (got >= refill) return; const want = (refill - got) / 0.4; const s = take(want); got += 0.4 * s; this.atp += 0.4 * s; this.heat += 0.6 * s; };
    ox((w) => { const s = Math.min(w * 0.4, this.brainGlc); this.brainGlc -= s; return s; }); ox((w) => { const s = Math.min(w * 0.3, this.blood.ket); this.blood.ket -= s; return s; }); ox((w) => { const s = Math.min(w * 0.5, this.blood.ket); this.blood.ket -= s; return s; });
    ox((w) => { const s = Math.min(w, this.blood.ffa); this.blood.ffa -= s; return s; }); ox((w) => { const s = Math.min(w, this.blood.glc * 0.5); this.blood.glc -= s; return s; }); ox((w) => { const s = Math.min(w, this.blood.ket); this.blood.ket -= s; return s; });
    if (o.leakyLedger) { this.heat -= 0.05 * need; this.leak++; } // negative control: deliberately broken accounting
    // adenosine (process S): rises with brain ATP turnover awake, cleared in sleep (fastest in N3)
    this.S = clamp(this.S + (awake ? 0.0008 * (brainD / 0.0075) : -(n3 ? 0.004 : 0.0022) * this.S));
    for (const k in this.stim) { this.stim[k] *= 0.9; if (this.stim[k] < 0.01) delete this.stim[k]; }
    this.predErr *= 0.9;
    if (this.t % 2 === 0) this.record(); }
  // spiking race between striatal channels; noise from quantum (Born-rule) or classical source, amplitude set by tonic DA
  choose(da: number): { k: number; sp: number } { const W = 3 + 5 * (this.level - 1); const sig = 0.35 * (0.2 + 2 * clamp(da)) * (1 + 0.2 * this.qgtTrace); const cnt = new Float32Array(SITES), v = new Float32Array(SITES); let sp = 0;
    const adenNoise = 1.0 * Math.max(0, this.S - 0.5);
    for (let s = 0; s < W; s++) for (let k = 0; k < SITES; k++) { if (!this.access[k]) continue; let n: number;
      if (this.o.noise === "quantum") { const u = this.q.measure(this.ent()); const u2 = this.ent(); n = (((u & 1) ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; } else { const u2 = this.ent(); n = ((this.ent() < 0.5 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2)))) * 0.8; }
      v[k] = 0.6 * v[k] + 1.6 * (this.wSite[k] - 0.2) + sig * n + adenNoise * this.gauss(); if (v[k] > 1.0) { cnt[k]++; v[k] = 0; sp++; } }
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
  view(): Record<string, number> { const R = this.regionRate; return { DA: this.nm.DA.E, SER: this.nm["5HT"].E, NE: this.nm.NE.E, ACh: this.nm.ACh.E, eCB: this.nm.eCB.E, atp: this.atp, glc: this.blood.glc, fat: this.fat, hr: this.hr, stage: this.stage, S: this.S, kappa: this.kappa, liminal: this.liminal, level: this.level, light: this.light, ctx: R.CTX, hip: R.HIP, str: R.STR, mot: R.MOT, ens: R.ENS, q: this.qOut, gut: this.gut.glc + this.gut.fat + this.gut.prot, symp: this.symp, para: this.para }; }
}
