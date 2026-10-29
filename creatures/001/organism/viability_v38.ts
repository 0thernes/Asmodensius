// v3.8 viability test (prereg v3.8 §E). Read-only use of the lab dome: 5 x creature 001 in the default dome, death rule on, no respawn.
// arms: "ample" = foodCapScale 2, growthScale 3; "none" = no food in the dome (foodCapScale 0, growthScale 0). Lifespan = age at death, censored at DAYS.
// usage: node viability_v38.js <seed> <days> <arm>  -> prints one JSON row
import { make001, Dome } from "../../../lab/src/index";
const seed = +(process.argv[2] ?? 2000), days = +(process.argv[3] ?? 40), arm = process.argv[4] ?? "ample";
const dials = arm === "none" ? { foodCapScale: 0, growthScale: 0, respawnAfter: 0 } : { foodCapScale: 2, growthScale: 3, respawnAfter: 0 };
const d: any = new Dome({ seed }, dials); for (let k = 0; k < 5; k++) d.add("c" + k, make001(seed + k));
const T = 1440 * days; for (let t = 0; t < T && d.deaths < 5; t++) d.step();
const life = d.pop.map((h: any) => (h.deathT !== undefined ? h.c.t() / 1440 : days));
const fat = d.pop.map((h: any) => +h.c.o.fat.toFixed(1)), eaten = d.pop.map((h: any) => +(h.c.o.eaten / Math.max(1, h.c.t() / 1440)).toFixed(1));
const med = [...life].sort((a, b) => a - b)[2];
console.log(JSON.stringify({ seed, days, arm, life, medianLifeDays: med, fat, eatenPerDay: eaten, deaths: d.deaths, ledger: d.ledger().worldLedgerError }));
