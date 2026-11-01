// OFFICIAL-R21 R-variant scorer, written before any test output was read. Every non-full arm is a control; pass = d>=0.8 & t>=2.75 vs all.
import { compare } from "/tmp/r21/src_v40/creatures/001/harness/harness";
const fs = require("fs"); const D = process.argv[2], SH = process.argv[3];
const ld = (d: string, k: string) => { const f = `${d}/test_${k}.json`; return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).arms : null; };
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const SPEC: [string, string, string, number?][] = [["RPT2R", "RPT2R", "full", 1], ["RPT2RL5", "RPT2RL5", "full", 1], ["HOT3RM", "HOT3RM", "metacognitive opt-out", 1], ["AE1R", "AE1R", "full"], ["PROJR", "PROJR", "full", 1], ["C16R", "C16R", "full"], ["CQM18R", "CQM18R", "full", 1]];
const out: any[] = [];
for (const [id, k, full, max] of SPEC) { const a = ld(D, k); if (!a) { out.push({ id, status: "MISSING" }); continue; }
  const cm = Object.keys(a).filter((x) => x !== full).map((c) => compare(c, a[full], a[c]));
  if (k === "RPT2R" && SH) { const b = ld(SH, "RPT2R"); if (b) cm.push(compare("shuffled pairing (vshuf)", a[full], b.full)); else cm.push({ control: "shuffled pairing (vshuf)", full: NaN, ctrl: NaN, d: NaN, t: NaN, pass: false } as any); }
  const ceil = max !== undefined && mean(a[full]) > 0.95 * max; const all = cm.every((c) => c.pass), any = cm.some((c) => c.pass);
  out.push({ id, status: ceil ? "FAIL(ceiling)" : all ? "PASS" : any ? "PARTIAL" : "FAIL", cmps: cm.map((c) => ({ control: c.control, full: c.full, ctrl: c.ctrl, d: +c.d.toFixed(2), t: +c.t.toFixed(2) })) });
  if (k === "HOT3RM") { const x = a[full], y = a["confidence shuffled"]; const dd = x.map((v: number, i: number) => v - y[i]); const m = mean(dd), s = Math.sqrt(dd.reduce((q: number, v: number) => q + (v - m) ** 2, 0) / (dd.length - 1)); const dz = m / s, tp = m / (s / Math.sqrt(dd.length));
    out.push({ id: "HOT3RM-P", status: dz >= 0.8 && tp >= 2.75 ? "PASS" : "FAIL", cmps: [{ control: "confidence shuffled (paired)", dz: +dz.toFixed(2), t: +tp.toFixed(2) }] }); } }
console.log(JSON.stringify(out, null, 1));
