// Runs the conformance suite on creature 001 (adapter over the read-only organism) and on the template creature.
import { make001 } from "../src/index"; import { makeTemplate } from "../template/creature"; import { conformance } from "./suite"; import { originality } from "./originality"; import { writeFileSync, mkdirSync } from "fs";
process.chdir(require("path").resolve(__dirname, "..")); mkdirSync("out", { recursive: true }); /* v4.1: run from any cwd (F36) */
const R = [conformance(make001, "001"), conformance(makeTemplate, "template")]; writeFileSync("out/conformance.json", JSON.stringify(R, null, 1));
for (const r of R) { console.log(`${r.creature}: ${r.pass ? "CONFORMS" : "DOES NOT CONFORM"} (${r.requiredPassed} required)`); for (const c of r.checks) console.log(`  ${c.pass ? "PASS" : "FAIL"}${c.required ? "" : " (optional)"} ${c.id}: ${c.detail}`); }
// Negative controls: the suite must reject broken creatures.
import { TemplateCreature } from "../template/creature";
class LeakyGive extends TemplateCreature { give(kJ: number) { (this as any).stores += kJ; } } // creates energy (intake not booked)
class Random extends TemplateCreature { private k = Math.random(); metrics() { const m = super.metrics(); return { ...m, DA: m.DA + this.k }; } } // non-deterministic
class NoBody extends TemplateCreature { constructor(s: number) { super(s); (this as any).takeWaste = undefined; } }
const NEG = [conformance((s) => new LeakyGive(s), "mutant: leaky give"), conformance((s) => new Random(s), "mutant: nondeterministic"), conformance((s) => new NoBody(s), "mutant: missing takeWaste")];
for (const r of NEG) console.log(`${r.creature}: ${r.pass ? "WRONGLY CONFORMS" : "rejected"} (${r.requiredPassed}); failed: ${r.checks.filter((c) => c.required && !c.pass).map((c) => c.id).join("; ")}`);
writeFileSync("out/conformance_neg.json", JSON.stringify({ negatives: NEG.map((r) => ({ creature: r.creature, rejected: !r.pass })), checks: { allNegativesRejected: NEG.every((r) => !r.pass), c001Conforms: R[0].pass, templateConforms: R[1].pass } }));

// v4.0: required originality check over the whole repo (see ORIGINS.md)
{ const o = originality("../"); console.log(`originality: ${o.pass ? "PASS" : "FAIL"} (${o.fails} fail, ${o.allowed} allowed)`); for (const x of o.findings) console.log(`  ${x.kind} ${x.file}:${x.line} ${x.why}`); writeFileSync("out/originality.json", JSON.stringify(o, null, 1)); if (!o.pass) process.exitCode = 1; }
