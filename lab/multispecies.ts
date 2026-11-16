// v0.7 multi-species dome integration test: 001 and the template creature share one dome (r=5, 2 days, food cap x0.25, 8 x 001 + 4 templates vs 4 templates alone).
// Checks: exact world + creature ledgers, both species forage, species are reported separately, and competition is real
// (the template eats less when sharing the dome with 001 than alone at the same density of its own kind), dev seeds 2000-2005.
import { make001, Dome, welch, cohenD } from "./src/index"; import { makeTemplate } from "./template/creature"; import { conformance } from "./conformance/suite"; import { writeFileSync } from "fs";
const SEEDS = process.argv[2] === "test" ? Array.from({ length: 8 }, (_, i) => 1000 + i) : [500, 501, 502, 503, 504, 505] /* v4.1: dev seeds moved out of 1000+ (SEEDS.md) */;
const run = (seed: number, n001: number, nT: number) => { const d = new Dome({ seed, radius: 5 }, { foodCapScale: 0.25 }); for (let k = 0; k < n001; k++) d.add("c" + k, make001(seed + k)); for (let k = 0; k < nT; k++) d.add("t" + k, makeTemplate(seed + 50 + k)); for (let t = 0; t < 2880; t++) d.step(); return { S: d.speciesStats(), wl: d.ledger().worldLedgerError, cl: Math.max(...d.pop.map((h) => h.c.ledger!().error)) }; };
const gate = [conformance(make001, "001").pass, conformance(makeTemplate, "template").pass];
const mixed = SEEDS.map((s) => run(s, 8, 4)), alone = SEEDS.map((s) => run(s, 0, 4));
const tm = mixed.map((r) => r.S.template.eaten / 4), ta = alone.map((r) => r.S.template.eaten / 4); const t = welch(tm, ta);
const checks = { bothConform: gate.every(Boolean), ledgersExact: [...mixed, ...alone].every((r) => r.wl < 1e-9 && r.cl < 1e-9), bothSpeciesForage: mixed.every((r) => r.S["001"].eaten > 0 && r.S.template.eaten > 0), speciesReported: mixed.every((r) => r.S["001"].n === 8 && r.S.template.n === 4) }; const descriptive = { competitionCostsTemplate: t.p < 0.05 && t.diff < 0 && Math.abs(cohenD(tm, ta)) >= 0.5 };
const out = { checks, descriptive, templateEatenMixed: tm, templateEatenAlone: ta, p: t.p, d: cohenD(tm, ta), c001EatenMixed: mixed.map((r) => r.S["001"].eaten / 8) };
writeFileSync(`out/multispecies_${process.argv[2] ?? "dev"}.json`, JSON.stringify(out)); console.log(JSON.stringify(out, (k, v) => (typeof v === "number" ? +v.toPrecision(4) : v)));
