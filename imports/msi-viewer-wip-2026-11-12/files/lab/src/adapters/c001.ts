// Read-only adapter for creature 001 (imports organism.ts, never modifies it).
import { Organism, REGIONS, R0, RN, NNEU, MW, CE, CX, mulberry } from "../../../creatures/001/organism/organism";
import { Affect } from "../../../creatures/001/organism/affect";
import { mutateGenome } from "../../../creatures/001/organism/develop";
import { EmbodiedOntogeny, type InheritedOntogenyPack } from "../../../creatures/001/organism/embodied_ontogeny";
import type { CreatureLab, Part, Coupling, Vec, BodySpec, WorldSense, Action, Exchange, CreatureVisualState, CouplingWeight } from "../interface";
const NM = ["DA", "5HT", "NE", "ACh", "Glu", "GABA", "eCB"];

// Fixed zero-bias anatomical cortical ring basis over the CE = 4*MW excitatory cortical neurons.
// Derived purely from canonical unscrambled module/position geometry (sum_u G_tilde[u, i] = 1 => uniform rate sums to exact 0).
const RING_BX = new Float64Array(CE);
const RING_BY = new Float64Array(CE);
{
  const sig2 = 2 * CX.tcSig * CX.tcSig;
  for (let i = 0; i < 16; i++) {
    const m = i >> 2;
    const j = i & 3;
    const gCol = new Float64Array(MW);
    let colSum = 0;
    for (let n = 0; n < MW; n++) {
      const pos = (3 * n) / Math.max(1, MW - 1);
      const g = Math.exp(-((pos - j) * (pos - j)) / sig2);
      gCol[n] = g;
      colSum += g;
    }
    const ang = (2 * Math.PI * i) / 16;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let n = 0; n < MW; n++) {
      const w = gCol[n] / Math.max(1e-12, colSum);
      RING_BX[m * MW + n] += w * ca;
      RING_BY[m * MW + n] += w * sa;
    }
  }
}
const regionOf = (i: number) => { for (const [r] of REGIONS) if (i >= R0[r] && i < R0[r] + RN[r]) return r; return "?"; };
// per-neuron arrays that make up the full dynamical state of a neuron (spiking + adaptation + traces)
const NEU = ["v", "spk", "rate", "xTr", "yTr", "nmda", "thA", "rateAvg", "th", "tau"] as const;
export type StateMode = "slow" | "full";
export class Creature001 implements CreatureLab {
  readonly creatureId = "001"; o: Organism; private edges = new Map<string, number[]>(); private nChoices = 0; private lastSite = -1;
  private chemoPopX = 0; private chemoPopY = 0; private shamPerm: Int32Array | null = null;
  constructor(readonly seed: number, readonly opts: Record<string, unknown> = {}) {
    const pp = opts.parentPersona as any;
    this.o = new Organism({
      seed,
      ...opts,
      ...(pp ? { persona: Affect.birth(mulberry(seed * 4049 + 7), pp) } : {}),
      ...(opts.parentDevGenome ? { develop: true, devGenome: mutateGenome(opts.parentDevGenome as Float32Array, mulberry(seed * 4073 + 3)) } : {}),
      ...(opts.parentEpigenetics ? { inheritedEpi: opts.parentEpigenetics as number[] } : {}),
      ...(opts.parentGermline ? { inheritedGermline: opts.parentGermline as number[] } : {}),
      ...(opts.parentSomaGene !== undefined ? { inheritedSoma: opts.parentSomaGene as number } : {}),
      ...(opts.parentOntogeny ? { inheritedOntogeny: opts.parentOntogeny as InheritedOntogenyPack } : {}),
      ...(opts.parentHeptarch ? { inheritedHeptarch: opts.parentHeptarch as number[] } : {}),
    } as any); /* v4.0+/v5.0: inherited personality, developmental genome, transgenerational epigenetic chromatin marks, dream-seeded germline, soma-allocation, embodied ontogeny & HEPTARCH temperament */
    const s = this.o.syn; for (let k = 0; k < s.pre.length; k++) { const id = `${regionOf(s.pre[k])}->${regionOf(s.post[k])}`; (this.edges.get(id) ?? this.edges.set(id, []).get(id)!).push(k); }
    if (opts.shamReadout) {
      const perm = Int32Array.from({ length: CE }, (_, idx) => idx);
      const sr = mulberry(seed * 9137 + 29);
      for (let i = CE - 1; i > 0; i--) {
        const j = Math.floor(sr() * (i + 1));
        const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
      }
      this.shamPerm = perm;
    }
  }
  parts(): Part[] {
    const base: Part[] = [
      ...REGIONS.map(([r, n]) => ({ id: r, kind: "region" as const, size: n })),
      ...NM.map((m) => ({ id: "nm:" + m, kind: "modulator" as const, size: 2 })),
      { id: "body", kind: "organ", size: 6 },
      { id: "value", kind: "module", size: 16 },
    ];
    if (this.o.csf) {
      base.push({ id: "chemoton", kind: "module", size: 6 }, { id: "shell", kind: "module", size: 4 });
    }
    return base;
  }
  couplings(): Coupling[] { return [...this.edges].map(([id, ks]) => { const [from, to] = id.split("->"); return { id, from, to, n: ks.length }; }); }
  hasCoupling(id: string) { return this.edges.has(id); }
  step(n = 1) { for (let i = 0; i < n; i++) { this.o.step(); if (this.o.choices.length > this.nChoices) { this.nChoices = this.o.choices.length; this.lastSite = this.o.choices[this.nChoices - 1]; } else this.lastSite = -1; } }
  t() { return this.o.t; }
  snapshot() { return { org: (this.o as any).snapshot(), nChoices: this.nChoices, lastSite: this.lastSite, chemoPopX: this.chemoPopX, chemoPopY: this.chemoPopY }; }
  restore(s: any) { (this.o as any).restore(s.org); this.nChoices = s.nChoices; this.lastSite = s.lastSite; this.chemoPopX = s.chemoPopX ?? 0; this.chemoPopY = s.chemoPopY ?? 0; }
  setLight(x: number | null) { (this.o as any).setLight(x); }
  readState(part: string, mode: StateMode = "slow"): Float64Array { const o = this.o as any;
    if (part.startsWith("nm:")) { const m = o.nm[part.slice(3)]; return Float64Array.from([m.P, m.E]); }
    if (part === "body") return Float64Array.from([o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp]);
    if (part === "value") return Float64Array.from(o.wSite);
    if (part === "chemoton" && o.csf) {
      const ch = o.csf.chemoton;
      return Float64Array.from([ch.z1, ch.z2, ch.conc[1], ch.conc[2], ch.conc[3], ch.conc[4]]);
    }
    if (part === "shell" && o.csf) {
      const hy = o.csf.hydrostat;
      return Float64Array.from([hy.catchSoftness, hy.somaticBioelectricField[0], hy.somaticBioelectricField[1], hy.somaticBioelectricField[2]]);
    }
    if (part === "regionRates") return Float64Array.from(REGIONS.map(([r]) => o.regionRate[r] ?? 0)); // v0.5: smoothed per-region firing rates (what HYP hunger is computed from)
    if (part === "rateAvg") { const out: number[] = []; for (const r of ["HYP", "CTX", "STR", "MOT", "INS"]) for (let i = R0[r]; i < R0[r] + RN[r]; i++) out.push(o.rateAvg[i]); return Float64Array.from(out); } // v0.5: slow per-neuron rates
    const a = R0[part], n = RN[part];
    if (mode === "slow") { const x = new Float64Array(2 * n); for (let i = 0; i < n; i++) { x[i] = o.rate[a + i]; x[n + i] = o.v[a + i]; } return x; }
    // full: every per-neuron array, plus plasticity: incoming synaptic weights and e-prop eligibility traces
    const inc = this.incoming(part); const out: number[] = [];
    for (const k of NEU) for (let i = 0; i < n; i++) out.push(o[k][a + i]);
    for (const s of inc) out.push(o.syn.w[s]);
    for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) out.push(o[k][i]);
    return Float64Array.from(out); }
  writeState(part: string, x: Vec, mode: StateMode = "slow") { const o = this.o as any;
    if (part.startsWith("nm:")) { const m = o.nm[part.slice(3)]; m.P = x[0]; m.E = x[1]; return; }
    if (part === "body") { [o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp] = Array.from(x); return; }
    if (part === "value") { for (let k = 0; k < x.length; k++) o.wSite[k] = x[k]; return; }
    if (part === "chemoton" && o.csf) {
      const ch = o.csf.chemoton;
      ch.z1 = Math.max(1e-6, x[0] ?? ch.z1);
      ch.z2 = Math.max(1e-6, x[1] ?? ch.z2);
      for (let idx = 0; idx < 4; idx++) {
        if (x[2 + idx] !== undefined) ch.conc[1 + idx] = Math.max(1e-6, x[2 + idx]);
      }
      ch.autocatA = ch.conc[1] + ch.conc[2];
      ch.membraneM = ch.conc[3];
      ch.templateV = ch.conc[4];
      return;
    }
    if (part === "shell" && o.csf) {
      const hy = o.csf.hydrostat;
      hy.setCatchSoftening(x[0] ?? hy.catchSoftness);
      for (let idx = 0; idx < 3; idx++) {
        if (x[1 + idx] !== undefined) hy.somaticBioelectricField[idx] = x[1 + idx];
      }
      return;
    }
    const a = R0[part], n = RN[part];
    if (mode === "slow") { for (let i = 0; i < n; i++) { o.rate[a + i] = x[i]; o.v[a + i] = x[n + i]; } return; }
    let j = 0; for (const k of NEU) for (let i = 0; i < n; i++) o[k][a + i] = x[j++];
    const inc = this.incoming(part); if (x.length !== NEU.length * n + inc.length + 8 * n) throw new Error(`full state size mismatch for ${part}: donor wiring differs (seed-specific connectome); use mode "slow" across seeds`);
    for (const s of inc) o.syn.w[s] = x[j++]; for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) o[k][i] = x[j++]; }
  private incoming(part: string) { const a = R0[part], n = RN[part], p = this.o.syn.post, r: number[] = []; for (let s = 0; s < p.length; s++) if (p[s] >= a && p[s] < a + n) r.push(s); return r; }
  allParts() {
    const base = [...REGIONS.map(([r]) => r), ...NM.map((m) => "nm:" + m), "body", "value"];
    if (this.o.csf) base.push("chemoton", "shell");
    return base;
  }
  motor() { return this.readState("MOT").subarray(0, RN.MOT).slice(); }
  metrics() { const o = this.o; return { foraged: o.foraged, rewards: o.rewards, asleep: o.asleep ? 1 : 0, DA: o.nm.DA.E, NE: o.nm.NE.E, glc: o.blood.glc, hr: o.hr, kappa: o.kappa, qgtTrace: o.qgtTrace, motRate: o.regionRate.MOT ?? 0, ctxRate: o.regionRate.CTX ?? 0, forageNow: this.lastSite >= 0 ? 1 : 0, energy: o.energy(), ledgerError: o.ledgerError(), stores: o.fat + o.liverGly + o.muscle, integrity: o.integrity, atp: o.atp, eaten: o.eaten, ignitions: (o.mind as any).ignitions, hunger: o.regionRate.HYP ?? 0, vagal: o.vagal }; }
  lesionCoupling(id: string, gain: number) { const ks = this.edges.get(id); if (!ks) throw new Error(`creature 001 has no coupling ${id}`); for (const k of ks) this.o.mask[k] = gain; }
  lesionFlag(flag: string, on: boolean) { this.o.lesion(flag as any, on); }
  stimulate(part: string, amount: number) { this.o.stimulate(part, amount); }
  feed(a: number) { this.o.feed(a); }
  clone() { return new Creature001(this.seed, this.opts); }
  spikes() { return this.o.spk.slice(); }
  routing() { const m = this.o.mind as any; return { winner: m.win, phases: m.phase.slice(), ignitions: m.ignitions }; }
  noiseSample() { return this.o.qOut; } noiseBits() { return 3; }
  // biosphere body
  body(): BodySpec {
    const mass = this.o.eoOut ? this.o.eoOut.bodyMass : 1;
    const sprint = this.o.eoOut ? this.o.eoOut.sprintSpeedMul : 1;
    return { radius: 0.5 * Math.cbrt(mass), mass, maxSpeed: 0.6 * sprint, habitat: ["water", "land"] };
  }
  private shuffledSensQueue: WorldSense[] = [];
  sense(w: WorldSense) {
    const effW = this.opts.shuffleSensoryStream
      ? (() => {
          this.shuffledSensQueue.push({ ...w });
          if (this.shuffledSensQueue.length <= 24) return { ...w, foodPlumeAngle: ((w.t * 2.39996) % (2 * Math.PI)) - Math.PI, hazardGradAngle: ((w.t * 1.71828) % (2 * Math.PI)) - Math.PI };
          const idx = (w.t * 13 + 7) % (this.shuffledSensQueue.length - 8);
          const pick = this.shuffledSensQueue[idx];
          if (this.shuffledSensQueue.length > 96) this.shuffledSensQueue.shift();
          return pick;
        })()
      : w;
    this.o.ambientTemp = effW.temperature;
    this.o.touchCount = effW.touch;
    if (effW.touch > 0) this.o.stimulate("INS", 0.2 * effW.touch);
    this.o.envHazard = effW.hazardHere ?? 0;
    this.o.envHazardAngle = effW.hazardGradAngle ?? NaN;
    if (this.opts.spatialChemotaxis) {
      for (let i = 0; i < 16; i++) this.o.sens[i] *= 0.25;
      const plumeMag = effW.foodPlumeMag ?? 0;
      const plumeAng = effW.foodPlumeAngle ?? NaN;
      if (plumeMag > 0.015 && Number.isFinite(plumeAng)) {
        const amp = Math.min(3.8, 1.15 + 0.95 * Math.min(3.0, plumeMag));
        for (let i = 0; i < 16; i++) {
          const c = Math.cos((2 * Math.PI * i) / 16 - plumeAng);
          if (c > 0) this.o.sens[i] = Math.min(4.2, this.o.sens[i] + amp * c * c);
        }
      }
      if (this.o.envHazard > 0.02 && !this.o.o.aversiveLesion) {
        this.o.stimulate("LC", 2.6 * this.o.envHazard);
        this.o.stimulate("INS", 2.2 * this.o.envHazard);
        if (Number.isFinite(this.o.envHazardAngle)) {
          const escAng = this.o.envHazardAngle + Math.PI;
          const escAmp = Math.min(4.8, 2.0 + 6.0 * this.o.envHazard);
          for (let i = 0; i < 16; i++) {
            const cEsc = Math.cos((2 * Math.PI * i) / 16 - escAng);
            this.o.sens[i] = Math.max(0, this.o.sens[i] * 0.08) + (cEsc > 0 ? escAmp * cEsc * cEsc : 0);
          }
        }
      }
    }
  }
  alive() { return !this.o.dead; }
  canSqueezeCrevice(apertureFrac = 0.55) { return this.o.canSqueezeCrevice(apertureFrac); }
  genes() { return this.o.o.genes ? this.o.o.genes.slice() : null; }
  exchange(e: Exchange) { (this.o.o as any).pool = e.foodPatch; } // the organism's own forage draws (2.2 kJ) now come out of the world patch under its body
  private nb: { id: string; dx: number; dy: number }[] = [];
  meet(id: string) { const a = this.o.affect; if (a) a.meet(id, a.feltValence()); }
  neighbors(nb: { id: string; dx: number; dy: number; x?: number; y?: number; heading?: number }[]) {
    this.nb = nb;
    this.o.localPeerCount = nb.length;
    if (this.o.cp && nb.length > 0) {
      const p = nb[0];
      if (p.heading !== undefined && Number.isFinite(p.heading)) {
        this.o.cp.observePeerGaze(p.x ?? p.dx, p.y ?? p.dy, p.heading, 10, this.o.cpOff);
      }
    }
  }
  persona() { return this.o.affect ? { ...this.o.affect.persona } as Record<string, number> : null; }
  epigenetics() { return this.o.fa ? Array.from(this.o.fa.exportEpigenetics()) : null; }
  germline() { return this.o.ni ? Array.from(this.o.ni.germlineBias) : null; }
  somaGene() { return this.o.ls ? this.o.ls.somaAllocGene : null; }
  emitSignal(costKJ = 0.04) { return this.o.emitHonestSignal(costKJ); }
  receiveSignal(site: number, conf: number, paidKJ: number) { this.o.receivePeerSignal(site, conf, paidKJ); }
  maternalProvision(wantKJ: number, requireCytokinesis = false) { return this.o.transferMaternalEnergy(wantKJ, requireCytokinesis); }
  recordLocomotion(workKJ: number, speed: number) { this.o.lastLocoWork += workKJ; this.o.lastLocoSpeed = Math.max(this.o.lastLocoSpeed, speed); }
  attachSandbox(mark: (site: number) => boolean) { (this.o as any).domeSandbox = (q: any) => q.hook === "mark" && mark(q.arg); }
  readMarks(m: Float32Array) { if ((this.o as any).neo) (this.o as any).marks.set(m); }
  v40State() { return (this.o as any).v40State(); }
  apexState() { return (this.o as any).apexState(); }
  heptarchTraits() { return this.o.heptarch ? Array.from(this.o.heptarch.heritableTraits) : null; }
  devGenome() { return (this.o as any).devGenome as Float32Array | null; }
  affectState() { return this.o.affectState(); }
  /** v5.1 read-only render hook: copies live body/brain state; never mutates the organism (docs/VISUALS.md). */
  visualState(): CreatureVisualState {
    const o = this.o as any;
    const r3 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1000) / 1000 : 0);
    const hy = o.csf ? o.csf.hydrostat : null;
    let shell: number[] | null = null, limbAnchors: number[] | null = null, limbLengths: number[] | null = null, strainKJ = 0, catchSoftness = 0;
    if (hy) {
      let cx = 0, cy = 0;
      for (let i = 0; i < hy.nNodes; i++) { cx += hy.px[i]; cy += hy.py[i]; }
      cx /= hy.nNodes; cy /= hy.nNodes;
      shell = [];
      for (let i = 0; i < hy.nNodes; i++) shell.push(r3(hy.px[i] - cx), r3(hy.py[i] - cy));
      limbAnchors = Array.from(hy.limbAnchors as Int32Array);
      limbLengths = Array.from(hy.limbPermMap as Int32Array).map((k: number) => r3(hy.limbRestLengths[k]));
      strainKJ = r3(hy.elasticKJ + hy.kineticKJ);
      catchSoftness = r3(hy.catchSoftness);
    }
    const ch = o.csf ? o.csf.chemoton : null;
    const hp = o.heptarchOut;
    return {
      hr: r3(o.hr), atpFrac: r3(Math.max(0, Math.min(1.5, o.atp / 2))), hunger: r3(o.regionRate.HYP ?? 0),
      mass: r3(o.eoOut ? o.eoOut.bodyMass : 1), radius: r3(this.body().radius),
      shell, limbAnchors, limbLengths, catchSoftness, strainKJ,
      bioField: hy ? Array.from(hy.somaticBioelectricField as Float64Array).slice(0, 4).map(r3) : [],
      chemoton: ch ? { a: r3(ch.autocatA), membrane: r3(ch.membraneM), template: r3(ch.templateV) } : null,
      mode: hp ? String(hp.mode) : null, seat: hp ? String(hp.dominantSeat) : null,
      regions: REGIONS.map(([r]) => r3(o.regionRate[r] ?? 0)),
    };
  }
  /** v5.1 weight-space readout: per named coupling, statistics of the live synaptic weights and the current lesion gain. */
  couplingWeights(): CouplingWeight[] {
    const w = this.o.syn.w, mask = this.o.mask;
    return [...this.edges].map(([id, ks]) => {
      const [from, to] = id.split("->");
      let s = 0, s2 = 0, mn = Infinity, mx = -Infinity, g = 0;
      for (const k of ks) { const x = w[k]; s += x; s2 += x * x; if (x < mn) mn = x; if (x > mx) mx = x; g += mask[k]; }
      const n = ks.length, mean = n ? s / n : 0;
      return { id, from, to, n, meanW: mean, sdW: n ? Math.sqrt(Math.max(0, s2 / n - mean * mean)) : 0, minW: n ? mn : 0, maxW: n ? mx : 0, gain: n ? g / n : 1 };
    });
  }
  /** v4.0: when not heading to a food site, steer toward the most-liked or away from the most-disliked nearby creature */
  private socialHeading(): number { const a = this.o.affect; if (!a || !this.nb.length) return NaN; let best = 0, hd = NaN; for (const n of this.nb) { const s = a.stance(n.id); if (Math.abs(s) > Math.abs(best) && Math.abs(s) > 0.05) { best = s; hd = Math.atan2(n.dy, n.dx) + (s < 0 ? Math.PI : 0); } } return hd; }
  act(): Action {
    if (this.opts.passiveBody) return { heading: NaN, speed: 0, forage: false, site: -1 };
    const site = this.lastSite;
    const locoImp = (this.o.lsOut ? this.o.lsOut.locoImpairment : 1) * (this.o.eoOut ? this.o.eoOut.locoEfficiencyMul : 1);
    const bs = site < 0 && this.o.o.gwLesion && this.o.cpOut && this.o.cpOut.blindsightHeading >= 0 ? this.o.cpOut.blindsightHeading : -1;
    const plumeHd = this.o.eoOut && Number.isFinite(this.o.eoOut.plumeHeading) ? this.o.eoOut.plumeHeading : NaN;
    let hd = site >= 0 ? (site / 16) * 2 * Math.PI : bs >= 0 ? (bs / 16) * 2 * Math.PI : Number.isFinite(plumeHd) ? plumeHd : this.socialHeading();
    let extraSpd = 0;
    if (this.opts.spatialChemotaxis && !this.o.asleep) {
      // Pure spiking neural population-vector readout over the CE = 4*MW excitatory cortical neurons:
      // SENS[0..15] -> THAL[0..15] -> CTX_E[0..CE-1] -> fixed zero-bias ring basis (RING_BX, RING_BY).
      let vx = 0, vy = 0;
      const perm = this.shamPerm;
      for (let u = 0; u < CE; u++) {
        const r = this.o.rate[R0.CTX + u];
        const bIdx = perm ? perm[u] : u;
        vx += r * RING_BX[bIdx];
        vy += r * RING_BY[bIdx];
      }
      this.chemoPopX = 0.55 * this.chemoPopX + 0.45 * vx;
      this.chemoPopY = 0.55 * this.chemoPopY + 0.45 * vy;
      const popMag = Math.hypot(this.chemoPopX, this.chemoPopY);
      if (popMag > 1e-4) {
        hd = Math.atan2(this.chemoPopY, this.chemoPopX);
      }
      const pagAlarm = this.o.o.pagLesion
        ? 0
        : 0.45 * Math.max(0, (this.o.regionRate.LC ?? 0) + (this.o.regionRate.INS ?? 0) - 0.30);
      extraSpd = Math.min(0.58, 1.35 * popMag + pagAlarm);
    }
    if (Number.isFinite(hd)) this.o.lastHeading = hd;
    const levy = this.o.eoOut ? Math.min(1.6, 0.8 + 0.2 * this.o.eoOut.levyStepMul) : 1;
    return { heading: hd, speed: Math.min(1, (4 * (this.o.regionRate.MOT ?? 0) + (bs >= 0 ? 0.35 : 0) + extraSpd) * levy) * locoImp * (this.o.asleep ? 0 : 1), forage: site >= 0, site };
  }
  harm(x: number) { this.o.damage(x); }
  work(kJ: number) { const o = this.o; const w = Math.min(kJ, Math.max(0, o.atp)); o.atp -= w; o.heat += w; }
  shiftModulator(name: string, d: number) { const m = this.o.nm[name]; if (!m) throw new Error(`no modulator ${name}`); m.E = Math.max(0, m.E + d); }
  rewire(frac: number, rnd: () => number) { let n = 0; for (let k = 0; k < this.o.mask.length; k++) if (rnd() < frac) { this.o.mask[k] = 0; n++; } return n; }
  senseLines(x: number[]) { for (let i = 0; i < 16; i++) this.o.sens[i] = x[i % x.length]; }
  drain(kJ: number) {
    const o = this.o;
    const gCap = kJ > 5 ? Math.max(0, o.blood.glc - 1.5) : Math.max(0, o.blood.glc);
    const dG = Math.min(kJ, gCap);
    const dF = Math.min(Math.max(0, kJ - dG), Math.max(0, o.fat));
    const d = dG + dF;
    o.blood.glc -= dG;
    o.fat -= dF;
    o.eaten -= d;
    return d;
  }
  give(kJ: number) { if (kJ > 0) this.o.feed(kJ); }
  takeWaste() { const o = this.o; const w = o.excreted; o.excreted = 0; o.eaten -= w; return w; } // waste leaves the body: booked as negative intake so the internal ledger stays exact
  ledger() { return { energy: this.o.energy(), intake: this.o.eaten, error: this.o.ledgerError() }; }
}
export const make001 = (seed: number, opts?: Record<string, unknown>) => new Creature001(seed, opts);
export const spawn001 = (seed: number, parent?: CreatureLab, baseOpts: Record<string, unknown> = {}, mate?: CreatureLab) => {
  const pO = (parent as any)?.o as Organism | undefined;
  const mO = (mate as any)?.o as Organism | undefined;
  const parentOntogeny = pO?.eo ? EmbodiedOntogeny.recombineOffspring(pO.eo, mO?.eo ?? null, pO.wAv, mO?.wAv ?? null, seed, !!baseOpts.ontogeny, pO.eoOff) : undefined;
  const mutSig = typeof baseOpts.mutateGenesSigma === "number" ? (baseOpts.mutateGenesSigma as number) : 0;
  const parentGenes = parent?.genes?.() ?? null;
  const childGenes = parentGenes
    ? parentGenes.map((g, i) => {
        if (mutSig <= 0) return g;
        const rng = mulberry(seed * 8831 + i * 97 + 13);
        const u = Math.max(1e-12, rng()), v = rng();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return Math.max(0.25, Math.min(2.5, g * Math.exp(mutSig * z)));
      })
    : undefined;
  return new Creature001(seed, {
    ...baseOpts,
    ...(childGenes ? { genes: childGenes } : {}),
    ...(parent ? {
      parentPersona: parent.persona?.() ?? undefined,
      parentDevGenome: (parent as any).devGenome?.() ?? undefined,
      parentEpigenetics: parent.epigenetics?.() ?? undefined,
      parentGermline: parent.germline?.() ?? undefined,
      parentSomaGene: (parent as any).somaGene?.() !== null && (parent as any).somaGene?.() !== undefined ? Math.max(0.2, Math.min(0.9, ((parent as any).somaGene() as number) + (mulberry(seed * 7901 + 19)() - 0.5) * 0.06)) : undefined,
      parentOntogeny,
      parentHeptarch: (parent as any).heptarchTraits?.() ? ((parent as any).heptarchTraits() as number[]).map((w, i) => Math.max(0.7, Math.min(1.3, w + (mulberry(seed * 6151 + i)() - 0.5) * 0.05))) : undefined,
    } : {}),
  });
};
export const N001 = NNEU;
