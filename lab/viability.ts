// v0.9 viability monitor (preregistered DEATH-v1). Runs the viewer's world: 5 x creature 001 in the default dome, death rule on, respawn after 60 ticks.
// It reports how long creatures live, why they die, and whether the lifecycle rule keeps the world physical.
// argv[2] = seed (dome seed; creatures use seed+k), argv[3] = days, argv[4] = tag
import { make001, Dome } from "./src/index"; import { writeFileSync, mkdirSync } from "fs";
const seed = +(process.argv[2] ?? 2000), days = +(process.argv[3] ?? 20), tag = process.argv[4] ?? "dev";
const d: any = new Dome({ seed }, { respawnAfter: 60 }); d.spawn = (_: string, s: number) => make001(s); for (let k = 0; k < 5; k++) d.add("c" + k, make001(seed + k));
let ledgerMax = 0, steppedAfterDeath = 0, minAtpAlive = Infinity, aliveTicks = 0, negAtpAliveTicks = 0; const frozen = new Map<any, number>(); const fat0 = d.pop.map((h: any) => h.c.o.fat);
const day10: any = {}; const fatTraj: number[][] = []; const T = 1440 * days;
for (let t = 0; t < T; t++) { d.step(); ledgerMax = Math.max(ledgerMax, d.ledger().worldLedgerError);
  for (const h of d.pop) { const o = h.c.o; if (h.deathT !== undefined) { const ft = frozen.get(h.c); if (ft === undefined) frozen.set(h.c, h.c.t()); else if (ft !== h.c.t()) steppedAfterDeath++; } else { aliveTicks++; minAtpAlive = Math.min(minAtpAlive, o.atp); if (o.atp < 0) negAtpAliveTicks++; } }
  if ((t + 1) % 14400 === 0) fatTraj.push(d.pop.map((h: any) => +h.c.o.fat.toFixed(1)));
  if (t === 1440 * 10 - 1) d.pop.forEach((h: any, i: number) => (day10[h.id] = { eatenPerDay: h.c.o.eaten / 10, fatLostPerDay: (fat0[i] - h.c.o.fat) / 10, deathT: h.deathT ?? null })); }
const lifeDays = d.deathLog.map((x: any) => x.age / 1440), med = lifeDays.length ? [...lifeDays].sort((a: number, b: number) => a - b)[Math.floor(lifeDays.length / 2)] : Infinity;
const checks = { ledgerExact: ledgerMax < 1e-9, noStepAfterDeath: steppedAfterDeath === 0, aliveFraction95: aliveTicks / (T * 5) >= 0.95, noDeepNegativeAtpAlive: minAtpAlive > -1 };
const row = { seed, days, ledgerMax, steppedAfterDeath, minAtpAlive, negAtpAliveTicks, aliveFraction: aliveTicks / (T * 5), deaths: d.deaths, births: d.births, medianLifeDays: med, fatEvery10d: fatTraj, viable30d: med >= 30, day10, deathLog: d.deathLog, checks, pass: Object.values(checks).every(Boolean) };
mkdirSync("out", { recursive: true }); writeFileSync(`out/viability_${tag}_${seed}.json`, JSON.stringify(row, null, 1));
console.log(JSON.stringify({ ...row, deathLog: undefined, day10: Object.values(day10).map((x: any) => `${x.eatenPerDay.toFixed(0)}in/${x.fatLostPerDay.toFixed(1)}fat`) }, (k, v) => (typeof v === "number" ? +v.toPrecision(4) : v)));
