// descriptive replication of the scorecard diagnosis on test seeds 1000-1003 (no pass/fail, per DIALS-v4.md)
import { make001, rptProbe, stateDecoder } from "./src/index"; import { writeFileSync } from "fs"; const out: any[] = [];
for (const s of [1000, 1001, 1002, 1003]) { const r1 = rptProbe(make001, s, "CTX->THAL"), r2 = rptProbe(make001, s, "CTX->CTX"); const g: number[] = []; const k = make001(s); k.step(300); for (let t = 0; t < 1440; t++) { k.step(1); g.push(k.metrics().glc); } const med = [...g].sort((a, b) => a - b)[720];
  const dec = (p: string) => { const z = make001(s); z.step(300); const D: any = stateDecoder(z, p, () => ((z as any).o.blood.glc > med ? 1 : 0), 2, 1200, 4, 1); return [+D.accuracy.toFixed(3), +D.controlShuffled.toFixed(3)]; };
  out.push({ seed: s, intactEarly: r1.intact.early, intactLate: r1.intact.late, cutFbLate: r1.cut.late, cutRecEarly: r2.cut.early, INS: dec("INS"), HYP: dec("HYP") }); }
writeFileSync("out/scorediag_test.json", JSON.stringify(out)); console.log(JSON.stringify(out, (k, v) => (typeof v === "number" ? +v.toPrecision(3) : v)));
