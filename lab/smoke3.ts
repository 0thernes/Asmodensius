// v0.3 God-panel dial tests: each dial vs a seed-matched control (same creature seed, same dome seed, dial off).
// Directional dials: paired permutation on the signed difference. Dice dials (random direction): paired test on |delta| vs the
// sham (a deterministic re-run of the control, so sham delta is exactly 0 -- verified).
import { make001, Dome, permPaired, cohenDPaired } from "./src/index";
import { BASE_CREATURE, birthOpts, seededDice, PRESETS, type WorldDials, type CreatureDials } from "./src/biosphere/god";
import { writeFileSync, mkdirSync } from "fs";
const SEEDS = [4000, 4001, 4002, 4003, 4004, 4005], TICKS = 1440;
type M = (d: Dome) => number;
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
function life(seed: number, wd: Partial<WorldDials>, cd: Partial<CreatureDials>, metric: string) {
  const c2 = { ...BASE_CREATURE, ...cd }; const { opts, log } = birthOpts(c2, seededDice(seed)); const d = new Dome({ seed }, wd); const c = make001(seed, opts); d.add("x", c, c2);
  let acc = 0; for (let t = 0; t < TICKS; t++) { d.step(); acc += metric === "path" ? 0 : c.metrics()[metric]; }
  const m = c.metrics(); const v = metric === "path" ? d.pop[0].path : ["eaten", "integrity", "stores", "foraged", "rewards"].includes(metric) ? m[metric] : acc / TICKS;
  return { v, log, wl: d.ledger().worldLedgerError, cl: m.ledgerError, kicks: d.kicks };
}
const DIALS: { id: string; group: "world" | "creature"; wd?: Partial<WorldDials>; cd?: Partial<CreatureDials>; metric: string; dir: 1 | -1 | 0 }[] = [
  { id: "food: barren (foodCapScale 0.05)", group: "world", wd: { foodCapScale: 0.05, growthScale: 0.05 }, metric: "eaten", dir: -1 },
  { id: "toxicity 0.003/tick", group: "world", wd: { toxicity: 0.003 }, metric: "integrity", dir: -1 },
  { id: "gravity x3", group: "world", wd: { gravity: 3 }, metric: "path", dir: -1 },
  { id: "electrical stim VTA 1.0", group: "world", wd: { electric: { part: "VTA", amount: 1 } }, metric: "DA", dir: 1 },
  { id: "sensory hyper-stimulation 2.0", group: "world", wd: { sensoryLoad: 2 }, metric: "asleep", dir: -1 },
  { id: "quantum kicks p=0.2 (dice)", group: "world", wd: { quantumKicks: 0.2 }, metric: "ctxRate", dir: 0 },
  { id: "preset hell vs baseline", group: "world", wd: PRESETS.hell, metric: "integrity", dir: -1 },
  { id: "preset utopia vs baseline", group: "world", wd: PRESETS.utopia, metric: "path", dir: 1 },
  { id: "neuromodulator shift NE +0.01/tick", group: "creature", cd: { modShift: { name: "NE", perTick: 0.01 } }, metric: "asleep", dir: -1 },
  { id: "dice: rewire 30% synapses", group: "creature", cd: { rewireFrac: 0.3 }, metric: "ctxRate", dir: 0 },
  { id: "dice: random mechanism lesion", group: "creature", cd: { lesionDice: true }, metric: "foraged", dir: 0 },
  { id: "dice: mutation sigma 0.7", group: "creature", cd: { mutationSigma: 0.7 }, metric: "foraged", dir: 0 },
];
const which = process.argv[2]; const rows: unknown[] = [];
for (const [i, D] of DIALS.entries()) { if (which !== undefined && +which !== i) continue;
  const ctl = SEEDS.map((s) => life(s, {}, {}, D.metric)), sham = SEEDS.map((s) => life(s, {}, {}, D.metric)), trt = SEEDS.map((s) => life(s, D.wd ?? {}, D.cd ?? {}, D.metric));
  const a = trt.map((x) => x.v), b = ctl.map((x) => x.v), shamDelta = Math.max(...sham.map((x, k) => Math.abs(x.v - b[k])));
  const t = D.dir === 0 ? permPaired(a.map((x, k) => Math.abs(x - b[k])), a.map(() => 0), 5000, 3) : permPaired(a, b, 5000, 3);
  const dirOk = D.dir === 0 || Math.sign(t.diff) === D.dir;
  rows.push({ dial: D.id, group: D.group, metric: D.metric, control: mean(b), treated: mean(a), diff: t.diff, dz: cohenDPaired(a, b), p: t.p, shamDelta, pass: t.p < 0.05 && dirOk && shamDelta === 0,
    ledgersMaxErr: Math.max(...trt.map((x) => Math.max(x.wl, x.cl))), dice: trt.map((x) => x.log.join(";")).filter(Boolean), kicks: trt.map((x) => x.kicks) }); }
mkdirSync("out", { recursive: true }); writeFileSync(`out/dials_${which ?? "all"}.json`, JSON.stringify(rows, null, 1));
console.log(JSON.stringify(rows.map((r: any) => [r.dial, r.metric, +r.control.toFixed(4), +r.treated.toFixed(4), +r.p.toFixed(4), r.pass, r.ledgersMaxErr.toExponential(1)])));
