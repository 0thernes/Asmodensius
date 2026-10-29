// v0.4: motor lens R (with oracle ceiling) and QRNG diagnosis/debiasing. argv[2] = "test" -> seeds 1000..1015, else dev 2000..2005.
import { make001, motorLensR, qrngDiag, welch, cohenD } from "./src/index";
import { writeFileSync } from "fs";
const SEEDS = process.argv[2] === "test" ? Array.from({ length: 16 }, (_, i) => 1000 + i) : Array.from({ length: 6 }, (_, i) => 2000 + i);
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length; const PARTS = ["CTX", "HYP", "STR", "MOT", "HIP"];
const ml = process.argv[3]==="q" ? [] as any[] : SEEDS.map((s) => { const c = make001(s); c.step(300); return motorLensR(c, PARTS, 900, 5, s); });
if (process.argv[3]==="q") { const q = SEEDS.slice(0,4).map((s)=>{const c=make001(s);c.step(300);return qrngDiag(c,20000);}); console.log(JSON.stringify(q.map((x:any)=>[x.vonNeumann.pass,x.vonNeumannLsbR.pass,x.vonNeumannLsbR.p,x.toeplitz.pass,x.toeplitzR.pass,x.toeplitzR.p,x.vnThenToeplitzR.pass,x.vnThenToeplitzR.p]))); process.exit(0); }
const best = ml.map((r) => Math.max(...r.rows.map((x) => x.balancedAcc))), ctl = ml.map((r) => Math.max(...r.rows.map((x) => x.controlShuffled))), orc = ml.map((r) => r.oracleBalancedAcc);
const perPart = PARTS.map((p, k) => ({ part: p, acc: mean(ml.map((r) => r.rows[k].balancedAcc)), ctl: mean(ml.map((r) => r.rows[k].controlShuffled)) }));
const tw = welch(best, ctl); const frac = best.map((b, i) => (b - 0.5) / Math.max(1e-9, orc[i] - 0.5));
const lens = { n: SEEDS.length, bestMean: mean(best), shuffledBestMean: mean(ctl), oracleMean: mean(orc), baseRate: mean(ml.map((r) => r.baseRate)), p: tw.p, d: cohenD(best, ctl), fracOfOracle: mean(frac), perPart,
  pass: tw.p < 0.05 && cohenD(best, ctl) >= 0.5 && mean(frac) >= 0.5 };
const q = SEEDS.slice(0, 4).map((s) => { const c = make001(s); c.step(300); return qrngDiag(c, 20000); });
const out = { lens, qrng: q }; writeFileSync(`out/lensq_${process.argv[2] ?? "dev"}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ lens: { ...lens, perPart: perPart.map((x) => [x.part, x.acc.toFixed(3), x.ctl.toFixed(3)]) }, qrng: q.map((x) => ({ obs: x.bitOnesObserved.map((v) => v.toFixed(4)), born: x.bitOnesBornExpected.map((v) => v.toFixed(4)), raw: x.raw, H: x.minEntropyPerBit.toFixed(3), vn: x.vonNeumann, tz: x.toeplitz, vnL: x.vonNeumannLsbR, tzR: x.toeplitzR, both: x.vnThenToeplitzR, sign: x.decisionNoiseSignMean.toFixed(3) })) }, null, 0));
