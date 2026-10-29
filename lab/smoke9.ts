// v0.6 preregistered battery DIALS-v4 (preregistrations/DIALS-v4.md): single-factor arms for the one-shot PD confound. argv[2] = dial index | "lens"; argv[3] = "test" (1000..1015) | dev (2000..2005)
import { make001, Dome, welch, cohenD, spearman, motorLensR } from "./src/index";
import { BASE_CREATURE, birthOpts, seededDice, type WorldDials } from "./src/biosphere/god";
import { writeFileSync, mkdirSync } from "fs";
const SEEDS = process.argv[3] === "test" ? Array.from({ length: 16 }, (_, i) => 1000 + i) : Array.from({ length: 6 }, (_, i) => 2000 + i);
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
function life(seed: number, wd: Partial<WorldDials>, metric: string, days = 1, n = 1, cfg: any = {}) {
  const d = new Dome({ seed, ...cfg }, wd); if (cfg.grazerEat) d.grazerEat = cfg.grazerEat; if (cfg.rewardWindow) { d.rewardWindow = cfg.rewardWindow; d.rewardPhasic = !!cfg.phasic; } if (cfg.lr) d.lr = cfg.lr; const cs: any[] = [];
  for (let k = 0; k < n; k++) { const { opts } = birthOpts(BASE_CREATURE, seededDice(seed + 7919 * k)); const c = make001(seed + 100000 * k, opts); d.add("x" + k, c); cs.push(c); }
  let acc = 0, dist = 0; const T = 1440 * days; for (let t = 0; t < T; t++) { d.step(); acc += cs[0].metrics().asleep; dist += Math.hypot(d.pop[0].x, d.pop[0].y); }
  const v = metric === "asleep" ? acc / T : metric === "localFood" ? d.localFoodAcc / T : metric === "dist" ? dist / T : metric === "coopP" ? mean(d.pop.map((h) => d.coopProb(h.id)).filter((x) => !isNaN(x))) : metric === "popEaten" ? cs.reduce((s, c) => s + c.metrics().eaten, 0) : cs[0].metrics()[metric];
  return { v, wl: d.ledger().worldLedgerError, cl: Math.max(...cs.map((c) => c.metrics().ledgerError)), extra: { teleports: d.teleports, grazer: d.grazerBiomass, recycled: d.recycled, games: d.games } };
}
const G = { game: "pd" as const, gameStrategy: "learned" as const };
type Arm = { oneShot: boolean; W: number; lr: number };
const ARMS: Record<string, Arm> = { A_ref: { oneShot: true, W: 1, lr: 300 }, B_contact: { oneShot: false, W: 1, lr: 300 }, C_window15: { oneShot: true, W: 15, lr: 300 }, D_lr30: { oneShot: true, W: 1, lr: 30 }, E_v3repeatedAtN8: { oneShot: false, W: 15, lr: 30 } };
const run = (a: Arm) => SEEDS.map((s) => life(s, { ...G, oneShot: a.oneShot }, "coopP", 3, 8, { radius: 4, rewardWindow: a.W, phasic: a.W === 1, lr: a.lr }));
const which = process.argv[2]; const tag = process.argv[3] ?? "dev"; mkdirSync("out", { recursive: true });
const r = run(ARMS[which]); const row = { arm: which, cfg: ARMS[which], v: r.map((x) => x.v), mean: mean(r.map((x) => x.v)), ledgersMaxErr: Math.max(...r.map((x) => Math.max(x.wl, x.cl))) };
writeFileSync(`out/dials7_${tag}_${which}.json`, JSON.stringify(row)); console.log(JSON.stringify({ arm: which, mean: row.mean.toFixed(3), ledger: row.ledgersMaxErr }));
