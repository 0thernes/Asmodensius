// v0.6 instrument smoke: QGT, 3D field, scorecard. argv[2] = dev|test
import { make001, quantumGeometry, field3d, scorecard } from "./src/index"; import { writeFileSync } from "fs";
const SEEDS = process.argv[2] === "test" ? [1000, 1001, 1002, 1003] : [2000, 2001]; const out: any = { qgt: [], field: [], score: [] };
for (const s of SEEDS) { const c = make001(s); c.step(500); const q = quantumGeometry(c); out.qgt.push(q);
  const f = field3d(make001(s), 600, 20, s); out.field.push({ moranI: f.moranI, shuffledMax: f.shuffledMax, neurons: f.neurons });
  out.score.push(scorecard(make001, s)); }
const Q = out.qgt; out.checks = { qgtMatchesOrganism: Q.every((q: any) => q.traceRelErr < 1e-3), qgtPSD: Q.every((q: any) => q.psd), productControlAnalytic: Q.every((q: any) => Math.abs(q.control.productTrace - q.control.productTraceExpected) < 1e-3 && Math.abs(q.control.productBerry01) < 1e-6),
  berryLoopMatchesCurvature: Q.every((q: any) => Math.abs(q.berryPhaseLoop - q.berryPhaseFromCurvature * 2) < 0.1 * Math.abs(q.berryPhaseLoop) + 1e-5), fieldStructured: out.field.every((f: any) => f.moranI > f.shuffledMax) };
writeFileSync(`out/instr6_${process.argv[2] ?? "dev"}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ checks: out.checks, qgt: Q.map((q: any) => [q.trace.toFixed(4), q.organismTrace.toFixed(4), q.control.productTrace.toFixed(4), q.control.productTraceExpected.toFixed(4), q.berryPhaseLoop.toExponential(2), (q.berryPhaseFromCurvature * 2).toExponential(2)]), field: out.field.map((f: any) => [f.moranI.toFixed(3), f.shuffledMax.toFixed(3)]), score: out.score.map((s: any) => [s.score + "/" + s.of, s.rows.map((r: any) => [r.indicator.slice(0, 18), +r.value.toFixed(3), +r.control.toFixed(3), r.pass])]) }));
