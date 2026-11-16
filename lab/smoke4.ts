// v0.4 preregistered dial battery (lab/preregistrations/DIALS-v1.md). Unpaired Welch t + pooled Cohen's d, treated vs control,
// over SEEDS (argv[3] = "test" -> 1000..1015, "dev" -> 2000..2005). Dice dials: Welch on |treated - control| vs |sham - control|.
import { make001, Dome, welch, cohenD, spearman } from "./src/index";
import { BASE_CREATURE, birthOpts, seededDice, PRESETS, LADDER, type WorldDials, type CreatureDials } from "./src/biosphere/god";
import { writeFileSync, mkdirSync } from "fs";
const SEEDS = process.argv[3] === "test" ? Array.from({ length: 16 }, (_, i) => 1000 + i) : Array.from({ length: 6 }, (_, i) => 500 + i) /* v4.1: dev seeds moved out of 1000+ (SEEDS.md) */;
const TICKS = 1440; const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const END = ["eaten", "integrity", "stores", "foraged", "rewards", "ignitions"];
function life(seed: number, wd: Partial<WorldDials>, cd: Partial<CreatureDials>, metric: string, n = 1, cfg: any = {}) {
  const d = new Dome({ seed, ...cfg }, wd); const cs: any[] = []; const logs: string[] = [];
  for (let k = 0; k < n; k++) { const c2 = { ...BASE_CREATURE, ...cd }; const { opts, log } = birthOpts(c2, seededDice(seed + 7919 * k)); logs.push(...log); const c = make001(seed + 100000 * k, opts); d.add("x" + k, c, c2); cs.push(c); }
  let acc = 0; for (let t = 0; t < TICKS; t++) { d.step(); if (!END.includes(metric) && !["path", "patchFood", "popEaten"].includes(metric)) acc += cs[0].metrics()[metric]; }
  const m = cs[0].metrics();
  const v = metric === "path" ? d.pop[0].path : metric === "patchFood" ? d.patchFood() : metric === "popEaten" ? cs.reduce((s, c) => s + c.metrics().eaten, 0) : END.includes(metric) ? m[metric] : acc / TICKS;
  return { v, log: logs, wl: d.ledger().worldLedgerError, cl: Math.max(...cs.map((c) => c.metrics().ledgerError)), extra: { games: d.games, coop: d.coop, recycled: d.recycled, parasite: d.parasiteBiomass } };
}
type Dial = { id: string; wd?: Partial<WorldDials>; cd?: Partial<CreatureDials>; metric: string; dir: 1 | -1 | 0; n?: number; cfg?: any; ctlWd?: Partial<WorldDials> };
export const DIALS: Dial[] = [
  { id: "food: barren", wd: { foodCapScale: 0.05, growthScale: 0.05 }, metric: "eaten", dir: -1 },
  { id: "toxicity 0.003", wd: { toxicity: 0.003 }, metric: "integrity", dir: -1 },
  { id: "gravity x3", wd: { gravity: 3 }, metric: "path", dir: -1 },
  { id: "electrical VTA 1.0", wd: { electric: { part: "VTA", amount: 1 } }, metric: "DA", dir: 1 },
  { id: "sensory hyper-stim 2.0 (original)", wd: { sensoryLoad: 2 }, metric: "asleep", dir: -1 },
  { id: "quantum kicks p=0.2 (dice)", wd: { quantumKicks: 0.2 }, metric: "ctxRate", dir: 0 },
  { id: "preset hell", wd: PRESETS.hell, metric: "integrity", dir: -1 },
  { id: "preset utopia", wd: PRESETS.utopia, metric: "path", dir: 1 },
  { id: "NE +0.01/tick -> asleep (original)", cd: { modShift: { name: "NE", perTick: 0.01 } }, metric: "asleep", dir: -1 },
  { id: "dice: rewire 30%", cd: { rewireFrac: 0.3 }, metric: "ctxRate", dir: 0 },
  { id: "dice: mechanism lesion", cd: { lesionDice: true }, metric: "foraged", dir: 0 },
  { id: "dice: mutation 0.7", cd: { mutationSigma: 0.7 }, metric: "foraged", dir: 0 },
  // R-versions (mechanism-justified, see INVESTIGATION-R3.md)
  { id: "R sensoryLinesR 1.0 (real sensory lines, orexin path) -> asleep", wd: { sensoryLinesR: 1 }, metric: "asleep", dir: -1 },
  { id: "R sensory hyper-stim 2.0 -> asleep (direction reversed: adenosine)", wd: { sensoryLoad: 2 }, metric: "asleep", dir: 1 },
  { id: "R NE +0.01/tick -> NE level", cd: { modShift: { name: "NE", perTick: 0.01 } }, metric: "NE", dir: 1 },
  { id: "R NE +0.01/tick -> ignitions", cd: { modShift: { name: "NE", perTick: 0.01 } }, metric: "ignitions", dir: 1 },
  // new dials
  { id: "weather: temperature 40C", wd: { temperature: 40 }, metric: "stores", dir: -1 },
  { id: "weather: wind 0.05", wd: { wind: 0.05 }, metric: "path", dir: 1 },
  { id: "gas: hypoxia O2 0.10 (proxy)", wd: { o2: 0.1 }, metric: "stores", dir: -1 },
  { id: "gas: hypercapnia CO2 0.08 (proxy)", wd: { co2: 0.08 }, metric: "asleep", dir: -1 },
  { id: "radiation 0.001", wd: { radiation: 0.001 }, metric: "integrity", dir: -1 },
  { id: "waste recycling 0.05", wd: { recycling: 0.05 }, metric: "patchFood", dir: 1 },
  { id: "parasites 0.03 kJ/tick", wd: { parasites: 0.03 }, metric: "glc", dir: -1 },
  { id: "game: prisoner's dilemma (4 creatures, r=3)", wd: { game: "pd" }, metric: "popEaten", dir: 1, n: 4, cfg: { radius: 3 } },
];
const which = process.argv[2]; const rows: unknown[] = [];
if (which === "ladder") { const rhoI: number[] = [], rhoE: number[] = [], wl: number[] = [];
  for (const s of SEEDS) { const I: number[] = [], E: number[] = []; for (const L of LADDER) { const a = life(s, L, {}, "integrity"), b = life(s, L, {}, "eaten"); I.push(a.v); E.push(b.v); wl.push(a.wl, a.cl); } rhoI.push(spearman([0, 1, 2, 3, 4, 5, 6], I)); rhoE.push(spearman([0, 1, 2, 3, 4, 5, 6], E)); }
  const t = welch(rhoI, rhoI.map(() => 0)); rows.push({ dial: "utopia->hell ladder (7 rungs)", metric: "Spearman(rung, integrity)", meanRho: mean(rhoI), rhoI, meanRhoEaten: mean(rhoE), rhoE, p: t.p, pass: mean(rhoI) <= -0.8 && t.p < 0.05 && t.diff < 0, ledgersMaxErr: Math.max(...wl) });
} else for (const [i, D] of DIALS.entries()) { if (which !== undefined && which !== "all" && +which !== i) continue;
  const ctl = SEEDS.map((s) => life(s, D.ctlWd ?? {}, {}, D.metric, D.n, D.cfg)), trt = SEEDS.map((s) => life(s, D.wd ?? {}, D.cd ?? {}, D.metric, D.n, D.cfg));
  const a = trt.map((x) => x.v), b = ctl.map((x) => x.v); let t, d, shamMax = 0;
  if (D.dir === 0) { const sham = SEEDS.map((s) => life(s, D.ctlWd ?? {}, {}, D.metric, D.n, D.cfg)); const sd = sham.map((x, k) => Math.abs(x.v - b[k])); shamMax = Math.max(...sd); const ad = a.map((x, k) => Math.abs(x - b[k])); t = welch(ad, sd); d = cohenD(ad, sd); }
  else { t = welch(a, b); d = cohenD(a, b); }
  const dirOk = D.dir === 0 ? t.diff > 0 : Math.sign(t.diff) === D.dir;
  rows.push({ i, dial: D.id, metric: D.metric, dir: D.dir, n: SEEDS.length, control: mean(b), treated: mean(a), diff: t.diff, welchT: t.t, df: t.df, p: t.p, d, shamMax, pass: t.p < 0.05 && dirOk && Math.abs(d) >= 0.5 && shamMax === 0,
    ledgersMaxErr: Math.max(...trt.map((x) => Math.max(x.wl, x.cl))), extra: trt.map((x) => x.extra), dice: trt.map((x) => x.log.join(";")).filter(Boolean).slice(0, 4) }); }
mkdirSync("out", { recursive: true }); writeFileSync(`out/dials4_${process.argv[3] ?? "dev"}_${which ?? "all"}.json`, JSON.stringify(rows, null, 1));
console.log(JSON.stringify(rows.map((r: any) => [r.dial, r.control !== undefined ? +r.control.toFixed(4) : r.meanRho?.toFixed(3), r.treated?.toFixed?.(4), +r.p.toExponential(2), r.d?.toFixed?.(2), r.pass, r.ledgersMaxErr.toExponential(1)])));
