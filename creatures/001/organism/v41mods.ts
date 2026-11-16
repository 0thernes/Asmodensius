// v4.1 Phase 2 specialist mechanisms, applied as prototype wrappers so the frozen organism.ts (bc6ad6a) stays byte-identical.
// Off unless M41J is set; with M41J unset applyM41 returns without touching anything, so every existing run is unchanged.
// M41J keys (all dev-only, see specialists/<ITEM>/README-v41.md):
//   ae1: id or [ids] (1-10), ae1K gain          AE1: extra RPE-driven value mechanisms; every one is cut by rpeLesion
//   h3: id or [ids] (11-20), h3K gain           HOT-3 st11-st20: routes from self-trained confidence (confDev) to non-LC targets
//   c10h: [[id,K],...], c10gate: 0|1, c10gS (gate scale, default 0.1)        CQM10 hybrids: satiety gate = min over component gates; c10gate scales it down while volU is high
//   rpX: [ids], rpG: 0|1                        RPT2R hybrids: several binding hubs at once (separate state); rpG = RPT1 guard
//   e2: id or [ids] (11-13), e2K gain                   AE2 hybrids: motor babbling in natural life (+ body-model surprise -> NE / contingency -> DA)
// No Math.random: the extra randomness (babbling) uses its own seeded stream, so the creature's own RNG is untouched.
import { Organism, M50, MT, R0, RN, SITES, mulberry } from "./organism";
type C = Record<string, any>;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ids = (v: any): number[] => (v === undefined ? [] : Array.isArray(v) ? v.map(Number) : [Number(v)]);
export function applyM41(spec: string | undefined): C | null {
  if (!spec) return null; const c: C = JSON.parse(spec); const P: any = Organism.prototype;
  const A1 = ids(c.ae1), H3 = ids(c.h3), K1 = c.ae1K ?? 1, K3 = c.h3K ?? 1, KE = c.e2K ?? 1, E2L = ids(c.e2), E2 = E2L.length;
  for (const v of A1) if (!(v >= 1 && v <= 10)) throw new Error("ae1 id " + v); for (const v of H3) if (!(v >= 11 && v <= 20)) throw new Error("h3 id " + v);
  const has = (L: number[], v: number) => L.includes(v);
  const step0 = P.step;
  P.step = function (this: any) {
    const g = this, w = g.wSite as Float32Array, f0 = g.foraged, r0 = g.rewards; const w0 = A1.length || H3.length ? Float32Array.from(w) : null;
    const dv = H3.length ? (g.mind?.confDev?.() ?? 0) : 0; let thr0 = NaN;
    if (has(H3, 16)) { thr0 = MT.ignThr; MT.ignThr = thr0 * cl(1 + K3 * 2 * dv, 0.5, 1.5); } /* st16: unsure -> lower ignition threshold (more broadcast) */
    let bab = 0; if (E2 && g.learn && g.stage === 0 && g.mind && g.mind.efference === 0) { const R = (g.v41br ??= mulberry(((g.o?.seed ?? 1) * 7717 + 5) >>> 0)); if (R() < 0.1) { bab = 0.4 * (2 * R() - 1); g.mind.arm = 0; g.mind.efference = bab; g.v41bg = g.mind.gHat; } }
    try { step0.call(this); } finally { if (!Number.isNaN(thr0)) MT.ignThr = thr0; }
    if (bab !== 0) post2(g, bab);
    if (H3.length) tick3(g, dv);
    if (g.foraged > f0 && w0) { const k = g.choices[g.choices.length - 1]; if (k >= 0) { const rew = g.rewards > r0 ? 1 : 0, rpe = rew - w0[k], dw = w[k] - w0[k];
      if (A1.length && g.learn && !g.o.rpeLesion) for (const v of A1) ae1(g, v, k, rew, rpe); if (H3.length && g.learn) for (const v of H3) h3(g, v, k, rew, dw, dv);
      for (let j = 0; j < SITES; j++) w[j] = cl(w[j]); } } };
  // ---------------- AE1 v01-v10 ----------------
  function ae1(g: any, v: number, k: number, rew: number, rpe: number) { const w = g.wSite as Float32Array, K = K1;
    if (v === 1) w[k] += K * 0.5 * Math.abs(rpe) * rpe; /* v01 Pearce-Hall: extra update scaled by this trial's unsigned RPE (Pearce & Hall 1980) */
    else if (v === 2) { if (rpe < 0) w[k] += K * 0.1 * rpe; } /* v02 DA-dip extinction channel: negative RPEs learn faster (Frank et al. 2004; Bouton 2004) */
    else if (v === 3) { const B: any[] = (g.v41b3 ??= []); B.push({ k, r: rew, p: Math.abs(rpe) }); if (B.length > 30) B.shift(); let bi = 0; for (let i = 1; i < B.length; i++) if (B[i].p > B[bi].p) bi = i; const e = B[bi]; w[e.k] += K * 0.05 * (e.r - w[e.k]); e.p *= 0.5; } /* v03 replay prioritised by |RPE| (Mattar & Daw 2018; Schaul et al. 2016) */
    else if (v === 4) { const T = (g.v41t4 ??= new Float64Array(SITES)); for (let j = 0; j < SITES; j++) T[j] *= 0.6; T[k] += 1; for (let j = 0; j < SITES; j++) if (j !== k) w[j] += K * 0.05 * rpe * T[j]; } /* v04 eligibility trace over recent choices (Sutton & Barto 1998 TD(lambda)) */
    else if (v === 5) g.nm.ACh.E += K * 0.3 * Math.abs(rpe); /* v05 surprise-gated ACh (Hasselmo 1999; Yu & Dayan 2005): ACh multiplies the next value updates */
    else if (v === 6) w[k] += K * 2 * (g.volU ?? 0) * rpe; /* v06 learning rate from unexpected uncertainty (Behrens et al. 2007) */
    else if (v === 7) { const F = (g.v41f7 ??= Float64Array.from(w)); F[k] += 0.4 * (rew - F[k]); w[k] += K * 0.15 * (F[k] - w[k]); } /* v07 dual fast/slow value stores (McClelland et al. 1995; Collins & Frank 2012 working-memory RL) */
    else if (v === 8) { if (Math.abs(rpe) > 0.5) { const f = cl(1 - K * 0.3 * Math.abs(rpe), 0.3, 1); for (const [a, b] of [["bA", "bB"], ["rA", "rB"]]) { g[a][k] = 1 + (g[a][k] - 1) * f; g[b][k] = 1 + (g[b][k] - 1) * f; } } } /* v08 change-point forgetting of the chosen site's Beta belief on a large RPE (Adams & MacKay 2007; Nassar et al. 2010): targets the stale-posterior drag of B2 */
    else if (v === 9) { g.v41m9 = (g.v41m9 ?? 0) + 0.2 * (rpe - (g.v41m9 ?? 0)); if (g.v41m9 < -0.25) { let mu = 0, n = 0; for (let j = 0; j < SITES; j++) if (g.access[j]) { mu += w[j]; n++; } mu /= Math.max(1, n); for (let j = 0; j < SITES; j++) { w[j] += K * 0.3 * (mu - w[j]); for (const a of ["bA", "bB", "rA", "rB"]) g[a][j] = 1 + (g[a][j] - 1) * 0.7; } g.v41m9 = 0; } } /* v09 global contingency-change detector: a run of negative RPEs resets all values toward their mean (Gershman et al. 2010 latent cause, simple form) */
    else if (v === 10) { const G = (g.v41G ??= new Float64Array(SITES).fill(1)), N = (g.v41N ??= new Float64Array(SITES).fill(1)); G[k] = cl(G[k] + 0.1 * G[k] * rpe, 0.1, 3); N[k] = cl(N[k] - 0.1 * N[k] * rpe, 0.1, 3); w[k] += K * 0.02 * (G[k] - N[k]); } /* v10 striatal D1/D2 opponent actors (Collins & Frank 2014 OpAL) */ }
  // ---------------- HOT-3 st11-st20 (confidence routes that avoid the LC) ----------------
  function h3(g: any, v: number, k: number, rew: number, dw: number, dv: number) { const w = g.wSite as Float32Array, K = K3, u = cl(-4 * dv, -1, 1); /* u > 0: less sure than usual */
    if (v === 11) w[k] += K * 0.5 * u * dw; /* st11 per-site learning rate: an unsure choice's own update is scaled up (Meyniel & Dehaene 2017) */
    else if (v === 12) { const B: any[] = (g.v41b12 ??= []); if (u > 0) B.push({ k, r: rew, p: u }); if (B.length > 20) B.shift(); if (B.length) { let bi = 0; for (let i = 1; i < B.length; i++) if (B[i].p > B[bi].p) bi = i; const e = B[bi]; w[e.k] += K * 0.04 * (e.r - w[e.k]); e.p *= 0.5; } } /* st12 replay priority from low confidence */
    else if (v === 15) {} /* st15 forage abort = existing scCF flag (set in M50J); nothing here */
    else if (v === 17) g.nm.ACh.E += K * 0.2 * Math.max(0, u); /* st17 basal-forebrain ACh precision: unsure -> more ACh (expected uncertainty) */
    else if (v === 19) g.nm.DA.E = Math.max(0, g.nm.DA.E - K * 0.05 * u); /* st19 VTA vigour: confident -> tonic DA up, unsure -> down (Niv et al. 2007) */
    else if (v === 20) { const x = cl(K * u, -0.5, 1); g.bA[k] = Math.max(1, g.bA[k] + x * rew); g.bB[k] = Math.max(1, g.bB[k] + x * (1 - rew)); } /* st20 confidence-gated belief store: unsure outcomes count more in the Beta belief, sure ones less */ }
  function tick3(g: any, dv: number) { const K = K3, u = cl(-4 * dv, -1, 1);
    if (has(H3, 14) && g.stage === 0) g.S = cl(g.S + K * 0.0004 * Math.max(0, u)); /* st14 sleep pressure: sustained low confidence adds adenosine (sleep need after uncertain learning; Tononi & Cirelli 2014) */
    if (has(H3, 18)) g.cortisol = cl((g.cortisol ?? 0) + K * 0.004 * u); /* st18 HPA route: low confidence raises cortisol, high lowers it (uncertainty as stressor; de Berker et al. 2016) */ }
  if (has(H3, 13)) { const ch0 = P.choose; P.choose = function (this: any, da: number) { const dv = this.mind?.confDev?.() ?? 0, u = cl(-4 * dv, 0, 1) * K3; if (u <= 0) return ch0.call(this, da);
      const w = this.wSite as Float32Array, s = Float32Array.from(w); let mu = 0, n = 0; for (let j = 0; j < SITES; j++) if (this.access[j]) { mu += w[j]; n++; } mu /= Math.max(1, n); for (let j = 0; j < SITES; j++) w[j] += 0.5 * u * (mu - w[j]);
      try { return ch0.call(this, da); } finally { w.set(s); } }; } /* st13 exploration temperature: unsure -> values look flatter at the moment of choice (Daw et al. 2006 directed/random exploration) */
  // ---------------- CQM10 hybrids ----------------
  if (c.c10h) { const L: [number, number][] = c.c10h, gate = +(c.c10gate ?? 0), cg0 = P.c10G; P.c10G = function (this: any) { const v0 = M50.c10, k0 = M50.c10K; let x = 1;
      try { for (const [id, K] of L) { M50.c10 = id; M50.c10K = K; x = Math.min(x, cg0.call(this)); } } finally { M50.c10 = v0; M50.c10K = k0; }
      if (gate) x = 1 - (1 - x) * cl(1 - (this.volU ?? 0) / (c.c10gS ?? 0.1)); return x; }; } /* gate: satiety relaxes while unexpected uncertainty is high, so re-learning after a reversal is not starved of samples */
  // ---------------- RPT2R hybrids ----------------
  if (c.rpX || c.rpG) { const L = ids(c.rpX), guard = +(c.rpG ?? 0), rp0 = P.rp2Step; P.rp2Step = function (this: any, ext: Float32Array | Float64Array) { const W: any = this, c0 = R0.CTX, n = RN.CTX;
      const before = guard ? Float64Array.from(ext.subarray(c0, c0 + n)) : null;
      if (L.length) { const v0 = M50.rp2; const st = (W.v41rp ??= {}); try { for (const id of L) { for (const key of Object.keys(W)) if (/^rp[A-Z]/.test(key)) delete W[key]; Object.assign(W, st[id] ?? {}); M50.rp2 = id; rp0.call(this, ext); const keep: any = {}; for (const key of Object.keys(W)) if (/^rp[A-Z]/.test(key)) keep[key] = W[key]; st[id] = keep; } } finally { M50.rp2 = v0; } }
      else rp0.call(this, ext);
      if (before) { /* RPT1 guard: remove the part of the hub's cortical drive that lies along the current recurrent cortical pattern, so the hub adds binding without overwriting the recurrent CTX state */ let dr = 0, rr = 0; const r = new Float64Array(n); for (let i = 0; i < n; i++) { r[i] = this.rate[c0 + i] - this.rateAvg[c0 + i]; rr += r[i] * r[i]; dr += (ext[c0 + i] - before[i]) * r[i]; } if (rr > 1e-9) for (let i = 0; i < n; i++) ext[c0 + i] -= guard * (dr / rr) * r[i]; } }; }
  // ---------------- AE2 hybrids ----------------
  function post2(g: any, H: number) { const m = g.mind; const B: any = m; if (B.bmP === undefined) return; /* body model ablated (scBM 0): no coupling */
    const inn = m.dArmObs - (g.v41bg ?? m.gHat) * H, z = (inn * inn) / (H * H * B.bmP + B.bmR + 1e-9); g.v41z = z;
    if (has(E2L, 12)) g.nm.NE.E += KE * 0.05 * cl(z / 9); /* h12: unexpected body feedback (innovation outside the model's own uncertainty) -> LC arousal (Blakemore et al. 1998) */
    if (has(E2L, 13)) g.nm.DA.E += KE * 0.02 * cl(B.bmC ?? 0); /* h13: sensed self-contingency (agency) -> tonic DA / vigour (Redgrave & Gurney 2006) */ }
  return c; }
