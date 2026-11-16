// v4.1 runner (Phase 0.2 + 1.4). run_v39.ts stays untouched for the frozen line; new runs use this file.
// usage: MODE=dev ARM=<name> SEEDBASE=<n> [NSEEDS=16] [OUT=<dir>] node run_v41.js <TESTKEY>
//   -> $OUT/<MODE>_<TESTKEY>.json with the same `arms` layout as run_v39, plus provenance and an energy meter.
// Seed rules (SEEDS.md): MODE=dev only on seeds 500-999. MODE=official only on 1224-1335 and only with PREREG=<frozen prereg file>.
// The runner refuses to start without MODE, ARM and SEEDBASE (closes F10: no silent default to the 1000+ ranges).
// Energy meter: wraps Organism.prototype.step to add up metabolic heat (kJ, the ATP-ledger sink), organism-ticks and the worst
// energy-ledger error (checked once per simulated day per organism). The wrapper only reads state, so outputs are unchanged.
import { Organism } from "./organism";
import { TESTS, LEDGER } from "./tests_v31";
import { TESTS34 } from "./tests_v34";
import { TESTS36 } from "./tests_v36";
import { TESTS37 } from "./tests_v37";
import { TESTS39 } from "./tests_v39";
import { TESTS40 } from "./tests_v40";
import { TESTS41 } from "./tests_v41";
import { applyM41 } from "./v41mods"; // Phase 2 specialist mechanisms (prototype wrappers; inert unless M41J is set)
const fs = require("fs"), path = require("path");
const E = process.env, key = process.argv[2];
const die = (m: string): never => { console.error("run_v41: " + m); process.exit(2); };
const MODE = E.MODE, ARM = E.ARM;
if (!key) die("missing TESTKEY argument");
if (MODE !== "dev" && MODE !== "official") die("MODE must be dev or official (got " + MODE + ")");
if (!ARM || !/^[A-Za-z0-9_.-]+$/.test(ARM)) die("ARM must be set (letters, digits, _ . -)");
if (E.SEEDBASE === undefined || !/^\d+$/.test(E.SEEDBASE)) die("SEEDBASE must be set explicitly");
const N = E.NSEEDS ? +E.NSEEDS : 16; if (!(N >= 1 && N <= 64)) die("NSEEDS out of range");
const seeds = Array.from({ length: N }, (_, k) => +E.SEEDBASE! + k);
const lo = Math.min(...seeds), hi = Math.max(...seeds);
if (MODE === "dev" && (lo < 500 || hi > 999)) die(`dev seeds must lie in 500-999 (got ${lo}-${hi}); 1000 and up are never used for tuning`);
if (MODE === "official") { if (lo < 1224 || hi > 1335) die(`official seeds must lie in 1224-1335 (got ${lo}-${hi})`); if (!E.PREREG || !fs.existsSync(E.PREREG)) die("official runs need PREREG=<frozen preregistration file>"); }
for (const [k, j] of [["V37TUNE", "M37"], ["V38TUNE", "M38"], ["V39TUNE", "M39"]] as const) if (E[k]) { const M = (require("./organism") as any)[j]; const v = JSON.parse(E[k]!); for (const x of Object.keys(v)) if (M[x] !== v[x]) die(`${k} not applied: ${x}`); }
applyM41(E.M41J);
const f = TESTS41[key] ?? TESTS40[key] ?? TESTS39[key] ?? TESTS37[key] ?? TESTS36[key] ?? TESTS34[key] ?? TESTS[key];
if (!f) die("unknown test key " + key);
// ---- energy meter (read-only wrapper) ----
const meter = { heatKJ: 0, eatenKJ: 0, ticks: 0, organisms: 0, ledgerMax: 0, nonFinite: 0 };
const P: any = Organism.prototype, step0 = P.step;
P.step = function (this: any) { if (this.t === 0) meter.organisms++; const h = this.heat, e = this.eaten; step0.call(this); meter.heatKJ += this.heat - h; meter.eatenKJ += this.eaten - e; meter.ticks++;
  if (this.t % 1440 === 0) { const le = this.ledgerError(); if (Number.isFinite(le)) { if (le > meter.ledgerMax) meter.ledgerMax = le; } else meter.nonFinite++; } };
const flags: Record<string, string> = {}; for (const k of Object.keys(E).sort()) if (/^(ORG_|M\d\dJ$|V\d\dTUNE$|PROBE$)/.test(k)) flags[k] = E[k]!;
if (flags.PROBE) die("PROBE diagnostics are not allowed in run_v41 (F44)");
const c0 = process.cpuUsage(), t0 = Date.now();
const arms = f(seeds);
const cpu = process.cpuUsage(c0), cpuSec = (cpu.user + cpu.system) / 1e6, seconds = (Date.now() - t0) / 1000;
const dir = path.resolve(E.OUT || "out_v41"); fs.mkdirSync(dir, { recursive: true });
const out = { key, mode: MODE, arm: ARM, seeds, arms, flags, prereg: E.PREREG ?? null, bundle: E.BUNDLE_SHA256 ?? null, runtime: { node: process.version, bun: (process.versions as any).bun ?? null },
  ledgerMax: LEDGER.length ? Math.max(...LEDGER.map((x) => x.err)) : 0, runs: LEDGER.length,
  energy: { heatKJ: meter.heatKJ, eatenKJ: meter.eatenKJ, organismTicks: meter.ticks, organisms: meter.organisms, ledgerMaxDaily: meter.ledgerMax, ledgerNonFinite: meter.nonFinite, cpuSec, kJperOrgDay: meter.ticks ? (meter.heatKJ * 1440) / meter.ticks : 0, cpuSecPerOrgDay: meter.ticks ? (cpuSec * 1440) / meter.ticks : 0 }, seconds };
const tmp = path.join(dir, `.${MODE}_${key}.json.tmp`); fs.writeFileSync(tmp, JSON.stringify(out)); fs.renameSync(tmp, path.join(dir, `${MODE}_${key}.json`));
const m = (a: number[]): string => (a.reduce((s, x) => s + x, 0) / a.length).toPrecision(4);
console.log(ARM, key, Object.entries(arms).map(([k, v]) => `${k}=${m(v as number[])}`).join("  "), `${seconds.toFixed(0)}s cpu=${cpuSec.toFixed(0)}s heat=${meter.heatKJ.toFixed(0)}kJ ledgerMax=${meter.ledgerMax.toExponential(1)}`);
