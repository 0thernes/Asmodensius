// Minimal headless dome biosphere (BIOSPHERE.md v0.1). A 2-D disk "dome floor" with a nutrient grid that regrows under a
// day/night light cycle, hosting any CreatureLab that implements body/sense/act/exchange/ledger. Matter/energy is conserved:
// sum(patch food) + sum(creature energy) changes only by photosynthetic input (logged) -> worldLedgerError.
import type { CreatureLab } from "../interface";
import { mulberry } from "../rng";
import { BASE_WORLD, KICK_PARTS, PAYOFF, type WorldDials, type CreatureDials, type DiceSource, seededDice } from "./god";
export type DomeConfig = { radius: number; cell: number; foodCap: number; growth: number; seed: number; touchRadius: number };
export const DEFAULT_DOME: DomeConfig = { radius: 12, cell: 1, foodCap: 30, growth: 0.004, seed: 1, touchRadius: 1.2 };
export type Inhabitant = { dials?: CreatureDials; id: string; species?: string; c: CreatureLab; x: number; y: number; heading: number; path: number; eaten0: number };
export class Dome {
  cfg: DomeConfig; dials: WorldDials = { ...BASE_WORLD }; dice: DiceSource; kicks = 0; detritus = 0; parasiteBiomass = 0; recycled = 0; games = 0; coop = 0; windDir = 0; teleports = 0; lr = 30; rewardWindow = 15; grazerEat = 0.03; grazerBiomass = 0; grazerHeat = 0; localFoodAcc = 0; grazersXY: { x: number; y: number }[] = []; learn = new Map<string, { w: number; base: number; daBase: number; pend?: { c: boolean; p: number; acc?: number; k?: number } }>(); coopLog: number[] = []; n: number; patches: { food: number }[]; t = 0; grown = 0; r: () => number; pop: Inhabitant[] = []; E0 = 0;
  constructor(cfg: Partial<DomeConfig> = {}, dials: Partial<WorldDials> = {}) { this.cfg = { ...DEFAULT_DOME, ...cfg }; this.dials = { ...BASE_WORLD, ...dials }; this.dice = seededDice(this.cfg.seed + 101); this.r = mulberry(this.cfg.seed); this.n = Math.ceil((2 * this.cfg.radius) / this.cfg.cell);
    this.patches = Array.from({ length: this.n * this.n }, (_, i) => ({ food: this.inside(i) ? this.cfg.foodCap * this.dials.foodCapScale * (0.5 + 0.5 * this.r()) : 0 })); }
  private inside(i: number) { const x = (i % this.n + 0.5) * this.cfg.cell - this.cfg.radius, y = (Math.floor(i / this.n) + 0.5) * this.cfg.cell - this.cfg.radius; return x * x + y * y <= this.cfg.radius ** 2; }
  cellAt(x: number, y: number) { const i = Math.min(this.n - 1, Math.max(0, Math.floor((x + this.cfg.radius) / this.cfg.cell))), j = Math.min(this.n - 1, Math.max(0, Math.floor((y + this.cfg.radius) / this.cfg.cell))); return this.patches[j * this.n + i]; }
  light() { const m = this.t % 1440; return Math.max(0, Math.sin(((m - 360) / 1440) * 2 * Math.PI)); } // same 1 tick = 1 min clock as creature 001's SCN; dawn 06:00
  add(id: string, c: CreatureLab, dials?: CreatureDials) { if (!c.body || !c.act || !c.exchange || !c.ledger) throw new Error(`${id} lacks the biosphere body interface`);
    const a = this.r() * 2 * Math.PI, d = Math.sqrt(this.r()) * this.cfg.radius * 0.8; this.pop.push({ id, species: c.creatureId, c, x: d * Math.cos(a), y: d * Math.sin(a), heading: this.r() * 2 * Math.PI, path: 0, eaten0: c.ledger().intake, dials }); if (dials?.rewireFrac) c.rewire!(dials.rewireFrac, this.dice.next); this.E0 = this.total(); }
  total() { return this.patches.reduce((s, p) => s + p.food, 0) + this.pop.reduce((s, h) => s + h.c.ledger!().energy, 0) + this.detritus + this.parasiteBiomass + this.grazerBiomass + this.grazerHeat; }
  coopProb(id: string) { const L = this.learn.get(id); return L ? 1 / (1 + Math.exp(-L.w)) : NaN; }
  patchFood() { return this.patches.reduce((s, p) => s + p.food, 0); }
  step() { this.t++; const L = this.light();
    for (let i = 0; i < this.patches.length; i++) { const p = this.patches[i]; if (!this.inside(i)) continue; const g = Math.max(0, this.cfg.growth * this.dials.growthScale * L * (this.cfg.foodCap * this.dials.foodCapScale - p.food)); p.food += g; this.grown += g; }
    for (const h of this.pop) { const patch = this.cellAt(h.x, h.y); let touch = 0; for (const o of this.pop) if (o !== h && Math.hypot(o.x - h.x, o.y - h.y) < this.cfg.touchRadius) touch++;
      h.c.sense!({ light: L, foodHere: patch.food, temperature: 20 + 5 * L, touch, t: this.t }); h.c.exchange!({ foodPatch: patch }); const D = this.dials, cd = h.dials;
      if (D.toxicity) h.c.harm!(D.toxicity); if (D.electric) h.c.stimulate(D.electric.part, D.electric.amount); if (D.sensoryLoad) h.c.stimulate("SENS", D.sensoryLoad);
      if (D.quantumKicks && this.dice.next() < D.quantumKicks) { h.c.stimulate(KICK_PARTS[Math.floor(this.dice.next() * KICK_PARTS.length)], 3 * this.dice.next()); this.kicks++; }
      if (cd?.modShift) h.c.shiftModulator!(cd.modShift.name, cd.modShift.perTick);
      if (D.sensoryLinesR) h.c.senseLines!(Array.from({ length: 16 }, () => D.sensoryLinesR * this.dice.next()));
      if (D.temperature !== 20) h.c.work!(0.0005 * Math.abs(D.temperature - 20));
      if (D.o2 < 0.21) h.c.work!((0.01 * (0.21 - D.o2)) / 0.21);
      if (D.co2 > 0.0004) h.c.stimulate("LC", (0.5 * D.co2) / 0.04);
      if (D.radiation) { h.c.harm!(D.radiation); h.c.rewire!(D.radiation, this.dice.next); }
      if (D.parasites) this.parasiteBiomass += h.c.drain!(D.parasites);
      if (D.ph !== 7) this.detritus += h.c.drain!(0.004 * Math.abs(D.ph - 7));
      this.localFoodAcc += patch.food / this.pop.length;
      if (!this.rewardPhasic) this.learnTick(h);
      { const k = D.timeWarp !== 1 && Math.hypot(h.x, h.y) < D.timeWarpR ? D.timeWarp : 1; if (k > 0) h.c.step(k); this.warpTicks += k; }
      if (this.rewardPhasic) this.learnTick(h); // v0.6 phasic mode: read DA after the creature has stepped on the payoff burst
      const a = h.c.act!(); if (Number.isFinite(a.heading)) h.heading = a.heading; else h.heading += 0.3 * (this.r() - 0.5);
      const sp = (a.speed * h.c.body!().maxSpeed) / Math.sqrt(this.dials.gravity); if (sp > 0) h.c.work!(0.002 * this.dials.gravity * h.c.body!().mass * sp); let nx = h.x + sp * Math.cos(h.heading), ny = h.y + sp * Math.sin(h.heading); const R = this.cfg.radius - 0.5;
      if (nx * nx + ny * ny > R * R) { h.heading += Math.PI; const k = R / Math.hypot(nx, ny); nx *= k; ny *= k; } if (this.dials.wind) { nx += this.dials.wind * Math.cos(this.windDir); ny += this.dials.wind * Math.sin(this.windDir); const k = Math.hypot(nx, ny); if (k > R) { nx *= R / k; ny *= R / k; } }
      if (this.dials.singularity) { const r = Math.max(0.3, Math.hypot(nx, ny)); const pull = Math.min(r, this.dials.singularity / r); nx -= (pull * nx) / r; ny -= (pull * ny) / r;
        if (Math.hypot(nx, ny) < 0.7) { const a2 = this.dice.next() * 2 * Math.PI, d2 = Math.sqrt(this.dice.next()) * R; nx = d2 * Math.cos(a2); ny = d2 * Math.sin(a2); this.teleports++; } }
      h.path += Math.hypot(nx - h.x, ny - h.y); h.x = nx; h.y = ny;
      if (this.dials.recycling) this.detritus += h.c.takeWaste!(); }
    if (this.dials.wind) this.windDir += 0.05 * (this.dice.next() - 0.5);
    if (this.dials.grazers) this.stepGrazers();
    if (this.dials.recycling && this.detritus > 0) { const occ = this.pop.map((h) => this.cellAt(h.x, h.y)); const amt = this.dials.recycling * this.detritus; for (const p of occ) p.food += amt / occ.length; this.detritus -= amt; this.recycled += amt; }
    if (this.dials.game !== "none" && this.t % 60 === 0) this.playGames(); }
  // ecology: grazers random-walk, eat 0.03 kJ/tick from their cell into biomass, respire 1 %/tick of biomass to heat, and shed 0.2 %/tick as detritus
  private stepGrazers() { const R = this.cfg.radius - 0.5; while (this.grazersXY.length < this.dials.grazers) { const a = this.r() * 6.283, d = Math.sqrt(this.r()) * R; this.grazersXY.push({ x: d * Math.cos(a), y: d * Math.sin(a) }); }
    for (const g of this.grazersXY) { g.x += 0.2 * (this.r() - 0.5); g.y += 0.2 * (this.r() - 0.5); const k = Math.hypot(g.x, g.y); if (k > R) { g.x *= R / k; g.y *= R / k; } const p = this.cellAt(g.x, g.y), e = Math.min(this.grazerEat, p.food); p.food -= e; this.grazerBiomass += e; }
    const resp = 0.01 * this.grazerBiomass, shed = 0.002 * this.grazerBiomass; this.grazerBiomass -= resp + shed; this.grazerHeat += resp; this.detritus += shed;
    if (this.dials.recycling && this.dials.recycling > 0 && this.grazersXY.length) { /* decomposers also return grazer litter where grazers are */ } }
  warpTicks = 0; rewardPhasic = false;
  private learnTick(h: Inhabitant) { const L2 = this.learn.get(h.id); if (L2?.pend) { const P2 = L2.pend; P2.acc = (P2.acc ?? 0) + h.c.metrics().DA; P2.k = (P2.k ?? 0) + 1; if (P2.k >= this.rewardWindow) { const delta = P2.acc / P2.k - L2.daBase; const g = P2.c ? 1 - P2.p : -P2.p; L2.w = Math.max(-6, Math.min(6, L2.w + this.lr * delta * g)); L2.pend = undefined; } } // REINFORCE on the creature's own DA response over the 15 ticks after the payoff burst
    else if (L2) L2.daBase += 0.02 * (h.c.metrics().DA - L2.daBase); }
  private pairs(): [Inhabitant, Inhabitant][] { const out: [Inhabitant, Inhabitant][] = [];
    if (this.dials.oneShot) { const s = this.pop.slice(); for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(this.dice.next() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } for (let i = 0; i + 1 < s.length; i += 2) out.push([s[i], s[i + 1]]); return out; }
    for (let i = 0; i < this.pop.length; i++) for (let j = i + 1; j < this.pop.length; j++) { const a = this.pop[i], b = this.pop[j]; if (Math.hypot(a.x - b.x, a.y - b.y) <= this.cfg.touchRadius) out.push([a, b]); } return out; }
  private playGames() { const P = PAYOFF[this.dials.game as "pd" | "stag"];
    for (const [a, b] of this.pairs()) {
      // strategy read from the creature's own state: cooperate when dopamine is above 0.25 (reward-expectant), else defect
      const pick = (h: Inhabitant) => { if (this.dials.gameStrategy !== "learned") return h.c.metrics().DA > 0.25 ? "C" : "D"; const L = this.learn.get(h.id) ?? this.learn.set(h.id, { w: 0, base: 0, daBase: h.c.metrics().DA }).get(h.id)!; const p = 1 / (1 + Math.exp(-L.w)); const c = this.dice.next() < p; L.pend = { c, p }; this.coopLog.push(p); return c ? "C" : "D"; };
      const sa = pick(a), sb = pick(b); const pay = (P as any)[sa + sb] as number[]; const patch = this.cellAt(a.x, a.y);
      const want = pay[0] + pay[1]; if (patch.food < want) { if (this.dials.gameStrategy === "learned") { const A = this.learn.get(a.id), B = this.learn.get(b.id); if (A) A.pend = undefined; if (B) B.pend = undefined; } continue; } patch.food -= want; a.c.give!(pay[0]); b.c.give!(pay[1]); if (this.dials.gameStrategy === "learned") { a.c.stimulate("VTA", 0.5 * pay[0]); b.c.stimulate("VTA", 0.5 * pay[1]); } /* payoff reaches the brain as a dopamine burst; the strategy learns from the measured DA response */ this.games++; if (sa === "C") this.coop++; if (sb === "C") this.coop++; } }
  speciesStats() { const S: Record<string, { n: number; eaten: number; stores: number; integrity: number }> = {}; for (const h of this.pop) { const k = h.species ?? h.c.creatureId, m = h.c.metrics(); const r = (S[k] ??= { n: 0, eaten: 0, stores: 0, integrity: 0 }); r.n++; r.eaten += m.eaten; r.stores += m.stores; r.integrity += m.integrity / 1; }
    for (const r of Object.values(S)) { r.stores /= r.n; r.integrity /= r.n; } return S; }
  ledger() { const tot = this.total(); return { total: tot, start: this.E0, grown: this.grown, worldLedgerError: Math.abs(tot - this.E0 - this.grown) / this.E0 }; }
  snapshot() { return { t: this.t, cfg: this.cfg, grown: this.grown, patches: this.patches.map((p) => +p.food.toFixed(4)), pop: this.pop.map((h) => ({ id: h.id, x: h.x, y: h.y, heading: h.heading, path: h.path, ledger: h.c.ledger!(), seed: h.c.seed })) }; }
}
