// Creature template (v0.7): the minimum a creatures/NNN creature must implement to join the shared lab and the dome.
// It is a deliberately small but real spiking creature (LIF neurons, DA modulator, glucose store, foraging, sleep pressure),
// so the conformance suite is exercised end to end. Copy this file (scaffold.ts does it), keep the CreatureLab surface,
// and replace the brain/body with your own. No tokens, no prompts, no LLM.
import type { CreatureLab, Part, Coupling, Vec, BodySpec, WorldSense, Action, Exchange, CreatureVisualState, CouplingWeight } from "../src/interface";
import { mulberry } from "../src/rng";
export const TEMPLATE_REGIONS: [string, number][] = [["SENS", 16], ["CORE", 48], ["MOT", 16], ["VTA", 8]];
export class TemplateCreature implements CreatureLab {
  readonly creatureId: string; private r: () => number; private off: Record<string, number> = {}; private n = 0;
  private v: Float64Array; private rate: Float64Array; private spk: Uint8Array; private drive: Float64Array; private W: Float64Array; private pre: Int32Array; private post: Int32Array; private region: string[];
  private gain: Record<string, number> = {}; private tt = 0; private DA = 0.2; private NE = 0.1;
  private stores = 500; private heat = 0; private waste = 0; private intake = 0; private eaten = 0; private E0 = 500; private integrity = 1; private pressure = 0; private asleep = 0; private pool: { food: number } | null = null; private lastSense: WorldSense | null = null; private lines: number[] | null = null;
  constructor(readonly seed: number, readonly opts: Record<string, unknown> = {}, id = "template") { this.creatureId = id; this.r = mulberry(seed);
    for (const [g, k] of TEMPLATE_REGIONS) { this.off[g] = this.n; this.n += k; } this.region = []; for (const [g, k] of TEMPLATE_REGIONS) for (let i = 0; i < k; i++) this.region.push(g);
    this.v = new Float64Array(this.n); this.rate = new Float64Array(this.n); this.spk = new Uint8Array(this.n); this.drive = new Float64Array(this.n);
    const E: [number, number, number][] = []; const link = (a: string, b: string, p: number, w: number) => { for (let i = 0; i < this.size(a); i++) for (let j = 0; j < this.size(b); j++) if (this.r() < p) E.push([this.off[a] + i, this.off[b] + j, w * (0.5 + this.r())]); this.gain[`${a}->${b}`] = 1; };
    link("SENS", "CORE", 0.3, 0.5); link("CORE", "CORE", 0.1, 0.15); link("CORE", "MOT", 0.3, 0.4); link("MOT", "CORE", 0.1, 0.2); link("CORE", "VTA", 0.2, 0.3);
    this.pre = Int32Array.from(E.map((e) => e[0])); this.post = Int32Array.from(E.map((e) => e[1])); this.W = Float64Array.from(E.map((e) => e[2])); }
  private size(g: string) { return TEMPLATE_REGIONS.find((x) => x[0] === g)![1]; }
  private cid(i: number) { return `${this.region[this.pre[i]]}->${this.region[this.post[i]]}`; }
  parts(): Part[] { return [...TEMPLATE_REGIONS.map(([id, size]) => ({ id, kind: "region" as const, size })), { id: "nm:DA", kind: "modulator", size: 1 }, { id: "body", kind: "organ", size: 4 }]; }
  couplings(): Coupling[] { const c: Record<string, number> = {}; for (let i = 0; i < this.W.length; i++) c[this.cid(i)] = (c[this.cid(i)] ?? 0) + 1; return Object.keys(this.gain).map((id) => ({ id, from: id.split("->")[0], to: id.split("->")[1], n: c[id] ?? 0 })); }
  hasCoupling(id: string) { return id in this.gain; }
  t() { return this.tt; }
  step(k = 1) { for (let s = 0; s < k; s++) this.tick(); }
  private tick() { this.tt++; const n = this.n, I = new Float64Array(n); const hunger = Math.max(0, 1 - this.stores / 600);
    const L = this.lastSense; for (let i = 0; i < this.size("SENS"); i++) I[this.off.SENS + i] += 0.3 * (this.lines ? this.lines[i % this.lines.length] : 0) + (L ? 0.08 * L.light + 0.02 * Math.min(10, L.foodHere) * (i < 8 ? 1 : 0) : 0) + 0.2 * hunger + 0.22;
    for (let e = 0; e < this.W.length; e++) if (this.spk[this.pre[e]]) I[this.post[e]] += this.W[e] * (this.gain[this.cid(e)] ?? 1);
    let fired = 0; for (let i = 0; i < n; i++) { const noise = 0.4 * (this.r() - 0.5); this.v[i] += 0.2 * (-this.v[i]) + I[i] + this.drive[i] + noise + (this.asleep ? -0.05 : 0) + 0.3 * (this.DA - 0.2) * (this.region[i] === "MOT" ? 1 : 0);
      this.drive[i] *= 0.7; const sp = this.v[i] > 1 ? 1 : 0; if (sp) { this.v[i] = 0; fired++; } this.spk[i] = sp; this.rate[i] += 0.05 * (sp - this.rate[i]); }
    let vta = 0; for (let i = 0; i < this.size("VTA"); i++) vta += this.rate[this.off.VTA + i]; this.DA += 0.1 * (0.2 + vta / this.size("VTA") - this.DA);
    const cost = Math.min(this.stores, 0.05 + 0.0005 * fired); this.stores -= cost; this.heat += cost; // metabolism: stores -> heat, never created
    this.pressure += this.asleep ? -0.004 : 0.002; if (this.pressure > 1) this.asleep = 1; if (this.pressure < 0.2) this.asleep = 0;
    if (!this.asleep && this.pool && hunger > 0.05 && this.pool.food > 0.5) { const x = Math.min(1, this.pool.food); this.pool.food -= x; this.stores += 0.9 * x; this.waste += 0.1 * x; this.intake += x; this.eaten += x; } }
  private sl(part: string) { if (part === "nm:DA") return [this.DA]; if (part === "body") return [this.stores, this.heat, this.waste, this.integrity]; const o = this.off[part]; if (o === undefined) throw new Error("unknown part " + part); return [o, o + this.size(part)]; }
  readState(part: string, mode: "slow" | "full" = "slow"): Float64Array { const s = this.sl(part); if (part === "nm:DA" || part === "body") return Float64Array.from(s);
    const [a, b] = s, out: number[] = [...this.v.slice(a, b), ...this.rate.slice(a, b)]; if (mode === "full") { for (let e = 0; e < this.W.length; e++) if (this.post[e] >= a && this.post[e] < b) out.push(this.W[e]); } return Float64Array.from(out); }
  writeState(part: string, x: Vec, mode: "slow" | "full" = "slow") { if (part === "nm:DA") { this.DA = x[0]; return; } if (part === "body") { const nextStores = Math.max(0, Math.min(this.stores + this.heat, x[0] ?? this.stores)); this.heat += this.stores - nextStores; this.stores = nextStores; if (x[3] !== undefined) this.integrity = Math.max(0, Math.min(1, x[3])); return; }
    const [a, b] = this.sl(part), k = b - a; for (let i = 0; i < k; i++) { this.v[a + i] = x[i]; this.rate[a + i] = x[k + i]; } if (mode === "full") { let j = 2 * k; for (let e = 0; e < this.W.length; e++) if (this.post[e] >= a && this.post[e] < b) this.W[e] = x[j++]; } }
  motor() { const o = this.off.MOT; return this.rate.slice(o, o + this.size("MOT")); }
  metrics() { const reg = (g: string) => { const o = this.off[g]; let s = 0; for (let i = 0; i < this.size(g); i++) s += this.rate[o + i]; return s / this.size(g); };
    return { eaten: this.eaten, stores: this.stores, integrity: this.integrity, asleep: this.asleep, DA: this.DA, NE: this.NE, glc: this.stores / 150, ledgerError: this.ledger().error, ctxRate: reg("CORE"), motRate: reg("MOT"), hunger: Math.max(0, 1 - this.stores / 600) }; }
  lesionCoupling(id: string, g: number) { if (!(id in this.gain)) throw new Error("unknown coupling " + id); this.gain[id] = g; }
  stimulate(part: string, amount: number) { const o = this.off[part]; if (o === undefined) return; for (let i = 0; i < this.size(part); i++) this.drive[o + i] += amount * 0.3; } // unknown part: no-op (contract)
  clone() { return new TemplateCreature(this.seed, this.opts, this.creatureId); }
  spikes() { return this.spk.slice(); }
  body(): BodySpec { return { radius: 0.4, mass: 0.6, maxSpeed: 0.5, habitat: ["land"] }; }
  sense(w: WorldSense) { this.lastSense = w; }
  exchange(e: Exchange) { this.pool = e.foodPatch; }
  act(): Action { const m = this.motor(); let best = -1, bi = 0; for (let i = 0; i < m.length; i++) if (m[i] > best) { best = m[i]; bi = i; } const sp = this.asleep ? 0 : Math.min(1, 3 * best);
    return { heading: (bi / m.length) * 2 * Math.PI, speed: sp, forage: !this.asleep, site: bi }; }
  ledger() { const energy = this.stores + this.heat + this.waste; return { energy, intake: this.intake, error: Math.abs(this.E0 + this.intake - energy) / this.E0 }; }
  harm(x: number) { this.integrity = Math.max(0, this.integrity - x); }
  work(kJ: number) { const w = Math.min(this.stores, kJ); this.stores -= w; this.heat += w; }
  shiftModulator(name: string, d: number) { if (name === "DA") this.DA = Math.max(0, this.DA + d); if (name === "NE") this.NE = Math.max(0, this.NE + d); }
  rewire(frac: number, rnd: () => number) { let c = 0; for (let e = 0; e < this.W.length; e++) if (rnd() < frac) { this.W[e] = 0; c++; } return c; }
  senseLines(x: number[]) { this.lines = x.slice(); }
  drain(kJ: number) { const d = Math.min(this.stores, kJ); this.stores -= d; this.intake -= d; return d; }
  give(kJ: number) { this.stores += kJ; this.intake += kJ; }
  takeWaste() { const w = this.waste; this.waste = 0; this.intake -= w; return w; }
  /** v5.1 read-only render hook (no shell physics in the template: shell = null, so the viewer draws a plain body). */
  visualState(): CreatureVisualState {
    const reg = (g: string) => { const o = this.off[g]; let s = 0; for (let i = 0; i < this.size(g); i++) s += this.rate[o + i]; return Math.round((s / this.size(g)) * 1000) / 1000; };
    return { hr: 0, atpFrac: Math.max(0, Math.min(1.5, this.stores / 500)), hunger: Math.max(0, 1 - this.stores / 600), mass: 0.6, radius: 0.4, shell: null, limbAnchors: null, limbLengths: null, catchSoftness: 0, strainKJ: 0, bioField: [], chemoton: null, mode: null, seat: null, regions: TEMPLATE_REGIONS.map(([g]) => reg(g)) };
  }
  couplingWeights(): CouplingWeight[] {
    const acc: Record<string, number[]> = {};
    for (let e = 0; e < this.W.length; e++) (acc[this.cid(e)] ??= []).push(this.W[e]);
    return Object.keys(this.gain).map((id) => { const xs = acc[id] ?? [], n = xs.length, m = n ? xs.reduce((a, b) => a + b, 0) / n : 0; return { id, from: id.split("->")[0], to: id.split("->")[1], n, meanW: m, sdW: n ? Math.sqrt(Math.max(0, xs.reduce((a, b) => a + b * b, 0) / n - m * m)) : 0, minW: n ? Math.min(...xs) : 0, maxW: n ? Math.max(...xs) : 0, gain: this.gain[id] }; });
  }
}
export const makeTemplate = (seed: number, opts: Record<string, unknown> = {}) => new TemplateCreature(seed, opts);
