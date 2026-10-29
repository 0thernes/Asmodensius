// Minimal headless dome biosphere (BIOSPHERE.md v0.1). A 2-D disk "dome floor" with a nutrient grid that regrows under a
// day/night light cycle, hosting any CreatureLab that implements body/sense/act/exchange/ledger. Matter/energy is conserved:
// sum(patch food) + sum(creature energy) changes only by photosynthetic input (logged) -> worldLedgerError.
import type { CreatureLab } from "../interface";
import { mulberry } from "../rng";
import { BASE_WORLD, KICK_PARTS, type WorldDials, type CreatureDials, type DiceSource, seededDice } from "./god";
export type DomeConfig = { radius: number; cell: number; foodCap: number; growth: number; seed: number; touchRadius: number };
export const DEFAULT_DOME: DomeConfig = { radius: 12, cell: 1, foodCap: 30, growth: 0.004, seed: 1, touchRadius: 1.2 };
export type Inhabitant = { dials?: CreatureDials; id: string; c: CreatureLab; x: number; y: number; heading: number; path: number; eaten0: number };
export class Dome {
  cfg: DomeConfig; dials: WorldDials = { ...BASE_WORLD }; dice: DiceSource; kicks = 0; n: number; patches: { food: number }[]; t = 0; grown = 0; r: () => number; pop: Inhabitant[] = []; E0 = 0;
  constructor(cfg: Partial<DomeConfig> = {}, dials: Partial<WorldDials> = {}) { this.cfg = { ...DEFAULT_DOME, ...cfg }; this.dials = { ...BASE_WORLD, ...dials }; this.dice = seededDice(this.cfg.seed + 101); this.r = mulberry(this.cfg.seed); this.n = Math.ceil((2 * this.cfg.radius) / this.cfg.cell);
    this.patches = Array.from({ length: this.n * this.n }, (_, i) => ({ food: this.inside(i) ? this.cfg.foodCap * this.dials.foodCapScale * (0.5 + 0.5 * this.r()) : 0 })); }
  private inside(i: number) { const x = (i % this.n + 0.5) * this.cfg.cell - this.cfg.radius, y = (Math.floor(i / this.n) + 0.5) * this.cfg.cell - this.cfg.radius; return x * x + y * y <= this.cfg.radius ** 2; }
  cellAt(x: number, y: number) { const i = Math.min(this.n - 1, Math.max(0, Math.floor((x + this.cfg.radius) / this.cfg.cell))), j = Math.min(this.n - 1, Math.max(0, Math.floor((y + this.cfg.radius) / this.cfg.cell))); return this.patches[j * this.n + i]; }
  light() { const m = this.t % 1440; return Math.max(0, Math.sin(((m - 360) / 1440) * 2 * Math.PI)); } // same 1 tick = 1 min clock as creature 001's SCN; dawn 06:00
  add(id: string, c: CreatureLab, dials?: CreatureDials) { if (!c.body || !c.act || !c.exchange || !c.ledger) throw new Error(`${id} lacks the biosphere body interface`);
    const a = this.r() * 2 * Math.PI, d = Math.sqrt(this.r()) * this.cfg.radius * 0.8; this.pop.push({ id, c, x: d * Math.cos(a), y: d * Math.sin(a), heading: this.r() * 2 * Math.PI, path: 0, eaten0: c.ledger().intake, dials }); if (dials?.rewireFrac) c.rewire!(dials.rewireFrac, this.dice.next); this.E0 = this.total(); }
  total() { return this.patches.reduce((s, p) => s + p.food, 0) + this.pop.reduce((s, h) => s + h.c.ledger!().energy, 0); }
  step() { this.t++; const L = this.light();
    for (let i = 0; i < this.patches.length; i++) { const p = this.patches[i]; if (!this.inside(i)) continue; const g = Math.max(0, this.cfg.growth * this.dials.growthScale * L * (this.cfg.foodCap * this.dials.foodCapScale - p.food)); p.food += g; this.grown += g; }
    for (const h of this.pop) { const patch = this.cellAt(h.x, h.y); let touch = 0; for (const o of this.pop) if (o !== h && Math.hypot(o.x - h.x, o.y - h.y) < this.cfg.touchRadius) touch++;
      h.c.sense!({ light: L, foodHere: patch.food, temperature: 20 + 5 * L, touch, t: this.t }); h.c.exchange!({ foodPatch: patch }); const D = this.dials, cd = h.dials;
      if (D.toxicity) h.c.harm!(D.toxicity); if (D.electric) h.c.stimulate(D.electric.part, D.electric.amount); if (D.sensoryLoad) h.c.stimulate("SENS", D.sensoryLoad);
      if (D.quantumKicks && this.dice.next() < D.quantumKicks) { h.c.stimulate(KICK_PARTS[Math.floor(this.dice.next() * KICK_PARTS.length)], 3 * this.dice.next()); this.kicks++; }
      if (cd?.modShift) h.c.shiftModulator!(cd.modShift.name, cd.modShift.perTick);
      h.c.step(1);
      const a = h.c.act!(); if (Number.isFinite(a.heading)) h.heading = a.heading; else h.heading += 0.3 * (this.r() - 0.5);
      const sp = (a.speed * h.c.body!().maxSpeed) / Math.sqrt(this.dials.gravity); if (sp > 0) h.c.work!(0.002 * this.dials.gravity * h.c.body!().mass * sp); let nx = h.x + sp * Math.cos(h.heading), ny = h.y + sp * Math.sin(h.heading); const R = this.cfg.radius - 0.5;
      if (nx * nx + ny * ny > R * R) { h.heading += Math.PI; const k = R / Math.hypot(nx, ny); nx *= k; ny *= k; } h.path += Math.hypot(nx - h.x, ny - h.y); h.x = nx; h.y = ny; } }
  ledger() { const tot = this.total(); return { total: tot, start: this.E0, grown: this.grown, worldLedgerError: Math.abs(tot - this.E0 - this.grown) / this.E0 }; }
  snapshot() { return { t: this.t, cfg: this.cfg, grown: this.grown, patches: this.patches.map((p) => +p.food.toFixed(4)), pop: this.pop.map((h) => ({ id: h.id, x: h.x, y: h.y, heading: h.heading, path: h.path, ledger: h.c.ledger!(), seed: h.c.seed })) }; }
}
