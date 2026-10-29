// DIALS-v4 comparisons: each factor arm vs the reference arm A (one factor differs), Welch + Cohen d
import { welch, cohenD } from "./src/index"; import { readFileSync, writeFileSync } from "fs";
const tag = process.argv[2] ?? "dev"; const L = (a: string) => JSON.parse(readFileSync(`out/dials7_${tag}_${a}.json`, "utf8"));
const PRED: [string, string, number, string][] = JSON.parse(readFileSync("preregistrations/DIALS-v4.pred.json", "utf8"));
const A = L("A_ref"); const rows = PRED.map(([arm, factor, dir, kind]) => { const B = L(arm); const t = welch(B.v, A.v), d = cohenD(B.v, A.v);
  const pass = kind === "null" ? Math.abs(d) < 0.5 && t.p >= 0.05 : t.p < 0.05 && Math.sign(t.diff) === dir && Math.abs(d) >= 0.5; return { dial: `${factor}: ${arm} vs A_ref (${kind === "null" ? "predicted null, |d|<0.5" : dir > 0 ? "predicted +" : "predicted -"})`, control: A.mean, treated: B.mean, p: t.p, d, pass }; });
rows.forEach((r, i) => writeFileSync(`out/dials7_${tag}_cmp${i}.json`, JSON.stringify(r))); console.log(JSON.stringify(rows.map((r) => [r.dial, r.control.toFixed(3), r.treated.toFixed(3), r.p.toPrecision(2), r.d.toFixed(2), r.pass])));
