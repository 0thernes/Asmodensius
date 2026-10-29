// Read-only adapter for creature 001 (imports organism.ts, never modifies it).
import { Organism, REGIONS, R0, RN } from "../../../creatures/001/organism/organism";
import type { CreatureLab, Part, Coupling, Vec } from "../interface";
const NM = ["DA", "5HT", "NE", "ACh", "Glu", "GABA", "eCB"];
const regionOf = (i: number) => { for (const [r] of REGIONS) if (i >= R0[r] && i < R0[r] + RN[r]) return r; return "?"; };
export class Creature001 implements CreatureLab {
  readonly creatureId = "001"; o: Organism; private edges = new Map<string, number[]>();
  constructor(readonly seed: number, readonly opts: Record<string, unknown> = {}) {
    this.o = new Organism({ seed, ...opts } as any);
    const s = this.o.syn; for (let k = 0; k < s.pre.length; k++) { const id = `${regionOf(s.pre[k])}->${regionOf(s.post[k])}`; (this.edges.get(id) ?? this.edges.set(id, []).get(id)!).push(k); }
  }
  parts(): Part[] { return [...REGIONS.map(([r, n]) => ({ id: r, kind: "region" as const, size: n })), ...NM.map((m) => ({ id: "nm:" + m, kind: "modulator" as const, size: 2 })), { id: "body", kind: "organ", size: 6 }]; }
  couplings(): Coupling[] { return [...this.edges].map(([id, ks]) => { const [from, to] = id.split("->"); return { id, from, to, n: ks.length }; }); }
  step(n = 1) { for (let i = 0; i < n; i++) this.o.step(); }
  t() { return this.o.t; }
  readState(part: string): Float64Array { const o = this.o;
    if (part.startsWith("nm:")) { const m = o.nm[part.slice(3)]; return Float64Array.from([m.P, m.E]); }
    if (part === "body") return Float64Array.from([o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp]);
    const a = R0[part], n = RN[part]; const x = new Float64Array(2 * n); for (let i = 0; i < n; i++) { x[i] = o.rate[a + i]; x[n + i] = o.v[a + i]; } return x; }
  writeState(part: string, x: Vec) { const o = this.o;
    if (part.startsWith("nm:")) { const m = o.nm[part.slice(3)]; m.P = x[0]; m.E = x[1]; return; }
    if (part === "body") { [o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp] = Array.from(x); return; }
    const a = R0[part], n = RN[part]; for (let i = 0; i < n; i++) { o.rate[a + i] = x[i]; o.v[a + i] = x[n + i]; } }
  motor() { return this.readState("MOT").subarray(0, RN.MOT).slice(); }
  metrics() { const o = this.o; return { foraged: o.foraged, rewards: o.rewards, asleep: o.asleep ? 1 : 0, DA: o.nm.DA.E, NE: o.nm.NE.E, glc: o.blood.glc, hr: o.hr, kappa: o.kappa, qgtTrace: o.qgtTrace, motRate: o.regionRate.MOT ?? 0, ctxRate: o.regionRate.CTX ?? 0 }; }
  lesionCoupling(id: string, gain: number) { for (const k of this.edges.get(id) ?? []) this.o.mask[k] = gain; }
  lesionFlag(flag: string, on: boolean) { this.o.lesion(flag as any, on); }
  stimulate(part: string, amount: number) { this.o.stimulate(part, amount); }
  feed(a: number) { this.o.feed(a); }
  clone() { return new Creature001(this.seed, this.opts); }
}
export const make001 = (seed: number, opts?: Record<string, unknown>) => new Creature001(seed, opts);
