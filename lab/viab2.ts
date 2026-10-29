// v0.9 lab-side starvation/refeed monitor for creature 001 in the dome (descriptive; the organism-side claims are preregistered in creatures/001 v3.8a).
// arm "starve": 2 days with food, then the dome's food is removed (patches 0, no growth) until death or 40 days. arm "refeed": same, but food returns once fat < 50 % of its pre-fast value, then 10 days.
import { make001, Dome } from "./src/index"; import { writeFileSync, mkdirSync } from "fs";
const seed = +(process.argv[2] ?? 2000), arm = process.argv[3] ?? "starve", tag = process.argv[4] ?? "dev";
const d: any = new Dome({ seed }, {}); const c: any = make001(seed); d.add("c0", c); const o = c.o; for (let t = 0; t < 2880; t++) d.step();
const pre = { liverGly: o.liverGly, fat: o.fat, muscle: o.muscle, ket: o.blood.ket }; const saved = d.patches.map((p: any) => p.food); const gs = d.dials.growthScale;
const fast = () => { d.patches.forEach((p: any) => { d.detritus += p.food; p.food = 0; }); d.dials.growthScale = 0; };
fast(); const ev: Record<string, number | null> = { glycogenOut: null, ketosis: null, fatHalf: null, muscleLoss10: null, death: null, refed: null }; let t = 0, refedAt = -1, fatAtRefeed = 0, ketMax = 0;
for (; t < 1440 * 40; t++) { d.step(); const day = t / 1440; ketMax = Math.max(ketMax, o.blood.ket);
  if (ev.glycogenOut === null && o.liverGly < 0.1 * pre.liverGly) ev.glycogenOut = day; if (ev.ketosis === null && o.blood.ket > Math.max(0.5, 3 * pre.ket)) ev.ketosis = day;
  if (ev.fatHalf === null && o.fat < 0.5 * pre.fat) { ev.fatHalf = day; if (arm === "refeed") { saved.forEach((f: number, i: number) => { const g = Math.min(f, d.detritus); d.patches[i].food = g; d.detritus -= g; }); d.dials.growthScale = gs; ev.refed = day; refedAt = t; fatAtRefeed = o.fat; } }
  if (ev.muscleLoss10 === null && o.muscle < 0.9 * pre.muscle) ev.muscleLoss10 = day; if (o.dead) { ev.death = day; break; } if (refedAt >= 0 && t - refedAt >= 14400) break; }
const order = ["glycogenOut", "ketosis", "fatHalf", "death"].map((k) => ev[k]).filter((x) => x !== null) as number[];
const row: any = { seed, arm, pre, ev, ketMax, end: { liverGly: o.liverGly, fat: o.fat, muscle: o.muscle, alive: !o.dead }, ledger: d.ledger().worldLedgerError,
  orderedStages: order.every((x, i) => i === 0 || x >= order[i - 1]) && ev.glycogenOut !== null && ev.fatHalf !== null };
if (arm === "starve") row.diesWithoutFood = ev.death !== null; else row.recovers = !o.dead && o.fat > fatAtRefeed && o.liverGly > 0.5 * pre.liverGly;
mkdirSync("out", { recursive: true }); writeFileSync(`out/viab2_${tag}_${arm}_${seed}.json`, JSON.stringify(row, null, 1)); console.log(JSON.stringify(row, (k, v) => (typeof v === "number" ? +v.toPrecision(3) : v)));
