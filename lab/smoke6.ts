// v0.5 preregistered battery DIALS-v2 (preregistrations/DIALS-v2.md). argv[2] = dial index | "lens"; argv[3] = "test" (1000..1015) | dev (2000..2005)
import { make001, Dome, welch, cohenD, spearman, motorLensR } from "./src/index";
import { BASE_CREATURE, birthOpts, seededDice, type WorldDials } from "./src/biosphere/god";
import { writeFileSync, mkdirSync } from "fs";
const SEEDS = process.argv[3] === "test" ? Array.from({ length: 16 }, (_, i) => 1000 + i) : Array.from({ length: 6 }, (_, i) => 500 + i) /* v4.1: dev seeds moved out of 1000+ (SEEDS.md) */;
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
function life(seed: number, wd: Partial<WorldDials>, metric: string, days = 1, n = 1, cfg: any = {}) {
  const d = new Dome({ seed, ...cfg }, wd); if (cfg.grazerEat) d.grazerEat = cfg.grazerEat; const cs: any[] = [];
  for (let k = 0; k < n; k++) { const { opts } = birthOpts(BASE_CREATURE, seededDice(seed + 7919 * k)); const c = make001(seed + 100000 * k, opts); d.add("x" + k, c); cs.push(c); }
  let acc = 0, dist = 0; const T = 1440 * days; for (let t = 0; t < T; t++) { d.step(); acc += cs[0].metrics().asleep; dist += Math.hypot(d.pop[0].x, d.pop[0].y); }
  const v = metric === "asleep" ? acc / T : metric === "localFood" ? d.localFoodAcc / T : metric === "dist" ? dist / T : metric === "coopP" ? mean(d.pop.map((h) => d.coopProb(h.id)).filter((x) => !isNaN(x))) : metric === "popEaten" ? cs.reduce((s, c) => s + c.metrics().eaten, 0) : cs[0].metrics()[metric];
  return { v, wl: d.ledger().worldLedgerError, cl: Math.max(...cs.map((c) => c.metrics().ledgerError)), extra: { teleports: d.teleports, grazer: d.grazerBiomass, recycled: d.recycled, games: d.games } };
}
type Dial = { id: string; wd: Partial<WorldDials>; ctl: Partial<WorldDials>; metric: string; dir: 1 | -1; days?: number; n?: number; cfg?: any; vsConst?: number };
const G = { game: "pd" as const, gameStrategy: "learned" as const };
export const DIALS: Dial[] = [
  { id: "gentle sensory lines 0.02 -> asleep", wd: { sensoryLinesR: 0.02 }, ctl: {}, metric: "asleep", dir: -1 },
  { id: "recycling 0.05 with grazer litter, 3 days -> local food", wd: { grazers: 40, recycling: 0.05 }, ctl: { grazers: 40 }, metric: "localFood", dir: 1, days: 3 },
  { id: "recycling 0.05 creature waste only, 3 days -> local food", wd: { recycling: 0.05 }, ctl: {}, metric: "localFood", dir: 1, days: 3 },
  { id: "chemistry pH 4 -> stores", wd: { ph: 4 }, ctl: {}, metric: "stores", dir: -1 },
  { id: "anomaly singularity 1.5 -> mean distance to centre", wd: { singularity: 1.5 }, ctl: {}, metric: "dist", dir: -1 },
  { id: "ecology grazers 100 (0.1 kJ/tick each, dome r=5), 3 days -> eaten", wd: { grazers: 100 }, ctl: {}, metric: "eaten", dir: -1, days: 3, cfg: { radius: 5, grazerEat: 0.1 } },
  { id: "learned game: stag hunt vs PD -> coop prob (3 days, 4 creatures)", wd: { ...G, game: "stag" }, ctl: G, metric: "coopP", dir: 1, days: 3, n: 4, cfg: { radius: 3 } },
  { id: "learned game: PD coop prob vs 0.5 start (3 days, 4 creatures)", wd: G, ctl: G, metric: "coopP", dir: -1, days: 3, n: 4, cfg: { radius: 3 }, vsConst: 0.5 },
];
const which = process.argv[2]; const tag = process.argv[3] ?? "dev";
if (which !== "sweep" && which !== "lens" && !(/^\d+$/.test(which ?? "") && DIALS[+which!])) { console.error(`usage: bun smoke6.ts <0..${DIALS.length - 1}|sweep|lens> [dev|test]`); process.exit(2); } /* v4.1: argv guard (F37) */
process.chdir(__dirname); mkdirSync("out", { recursive: true }); let row: any;
if (which === "sweep") { const doses = [0, 0.005, 0.01, 0.02, 0.03, 0.05]; const per = SEEDS.map((s) => doses.map((x) => life(s, { sensoryLinesR: x }, "asleep").v)); const rho = per.map((v) => spearman(doses, v));
  row = { dial: "sensory-lines dose sweep", doses, meanAsleep: doses.map((_, k) => mean(per.map((p) => p[k]))), rho, meanRho: mean(rho), p: welch(rho, rho.map(() => 0)).p, pass: mean(rho) <= -0.8 && welch(rho, rho.map(() => 0)).p < 0.05 };
} else if (which === "lens") { const PARTS = ["CTX", "HYP", "regionRates", "rateAvg"]; const ml = SEEDS.map((s) => { const c = make001(s); c.step(300); return motorLensR(c, PARTS, 900, 5, s); });
  const per = PARTS.map((p, k) => ({ part: p, acc: mean(ml.map((r) => r.rows[k].balancedAcc)), ctl: mean(ml.map((r) => r.rows[k].controlShuffled)) }));
  const best = ml.map((r) => Math.max(...r.rows.map((x) => x.balancedAcc))), sh = ml.map((r) => Math.max(...r.rows.map((x) => x.controlShuffled))), orc = ml.map((r) => r.oracleBalancedAcc); const frac = mean(best.map((b, i) => (b - 0.5) / (orc[i] - 0.5))); const t = welch(best, sh);
  row = { dial: "motor lens v2 (firing-rate readouts)", per, best: mean(best), oracle: mean(orc), frac, p: t.p, d: cohenD(best, sh), pass: t.p < 0.05 && cohenD(best, sh) >= 0.5 && frac >= 0.5 };
} else { const D = DIALS[+which]; const trt = SEEDS.map((s) => life(s, D.wd, D.metric, D.days, D.n, D.cfg)); const a = trt.map((x) => x.v);
  const b = D.vsConst !== undefined ? a.map(() => D.vsConst!) : SEEDS.map((s) => life(s, D.ctl, D.metric, D.days, D.n, D.cfg).v); const t = welch(a, b), d = D.vsConst !== undefined ? (mean(a) - D.vsConst) / Math.sqrt(a.reduce((s, x) => s + (x - mean(a)) ** 2, 0) / (a.length - 1)) : cohenD(a, b);
  const gentle = D.metric === "asleep" ? mean(a) >= 0.3 : true;
  row = { i: +which, dial: D.id, metric: D.metric, control: mean(b), treated: mean(a), p: t.p, d, pass: t.p < 0.05 && Math.sign(t.diff) === D.dir && Math.abs(d) >= 0.5 && gentle, ledgersMaxErr: Math.max(...trt.map((x) => Math.max(x.wl, x.cl))), extra: trt.map((x) => x.extra) }; }
writeFileSync(`out/dials5_${tag}_${which}.json`, JSON.stringify(row, null, 1));
console.log(JSON.stringify(row, (k, v) => (k === "extra" ? undefined : typeof v === "number" ? +v.toPrecision(4) : v)));
