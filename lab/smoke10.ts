// v0.8 preregistered battery DIALS-v5 (preregistrations/DIALS-v5.md): light / day-length dials (dome light drives creature 001 via
// setLight) and the Moonlab simulated-quantum dice. argv[2] = dial index | "dice"; argv[3] = test (1000..1015) | dev (2000..2005)
import { make001, Dome, welch, cohenD, moonlabDice, loadMoonlabSim } from "./src/index"; import type { WorldDials } from "./src/biosphere/god"; import { writeFileSync, mkdirSync } from "fs";
const SEEDS = process.argv[3] === "test" ? Array.from({ length: 16 }, (_, i) => 1000 + i) : Array.from({ length: 6 }, (_, i) => 500 + i) /* v4.1: dev seeds moved out of 1000+ (SEEDS.md) */;
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length; let ML: any = null;
function life(seed: number, wd: Partial<WorldDials>, metric: string, days = 2, dice = "classical") { const d = new Dome({ seed, radius: 4 }, wd); if (dice === "moonlab") d.dice = moonlabDice(ML, seed + 101); const c = make001(seed); d.add("x", c);
  let acc = 0, mel = 0; const T = 1440 * days; for (let t = 0; t < T; t++) { d.step(); acc += c.metrics().asleep; mel += (c as any).o.melatonin; }
  return { v: metric === "asleep" ? acc / T : metric === "melatonin" ? mel / T : metric === "kicks" ? d.kicks : c.metrics()[metric], wl: d.ledger().worldLedgerError, cl: c.metrics().ledgerError }; }
const C: Partial<WorldDials> = { lightToCreatures: true };
type Dial = { id: string; wd: Partial<WorldDials>; ctl: Partial<WorldDials>; metric: string; dir: 1 | -1 | 0; dice?: string };
const DIALS: Dial[] = [
  { id: "constant dark (DD) vs 12:12 cycle -> asleep", wd: { ...C, lightMode: "DD" }, ctl: C, metric: "asleep", dir: 0 },
  { id: "constant light (LL) vs 12:12 cycle -> asleep", wd: { ...C, lightMode: "LL" }, ctl: C, metric: "asleep", dir: -1 },
  { id: "short day 6 h vs 12 h -> asleep", wd: { ...C, dayLength: 6 }, ctl: C, metric: "asleep", dir: 1 },
  { id: "long day 18 h vs 12 h -> asleep", wd: { ...C, dayLength: 18 }, ctl: C, metric: "asleep", dir: -1 },
  { id: "dim light 0.3 vs 1 -> melatonin", wd: { ...C, lightScale: 0.3 }, ctl: C, metric: "melatonin", dir: 1 },
  { id: "coupling check: DD with dome light coupled vs uncoupled (own photoperiod) -> melatonin", wd: { lightMode: "DD", lightToCreatures: true }, ctl: { lightMode: "DD" }, metric: "melatonin", dir: 1 },
  { id: "Moonlab simulated-quantum dice vs classical dice, quantum kicks 0.05 -> kicks count (predicted null)", wd: { quantumKicks: 0.05 }, ctl: { quantumKicks: 0.05 }, metric: "kicks", dir: 0, dice: "moonlab" },
];
(async () => { ML = await loadMoonlabSim(); const which = process.argv[2]; const tag = process.argv[3] ?? "dev";
  if (which !== "dice" && !(/^\d+$/.test(which ?? "") && DIALS[+which!])) { console.error(`usage: bun smoke10.ts <dice|0..${DIALS.length - 1}> [dev|test]`); process.exit(2); } /* v4.1: argv guard (F37) */
  process.chdir(__dirname); mkdirSync("out", { recursive: true }); let row: any;
  if (which === "dice") { const chi = (x: number[]) => { const b = new Array(16).fill(0); for (const v of x) b[Math.floor(v * 16)]++; const e = x.length / 16; return b.reduce((s, o) => s + (o - e) ** 2 / e, 0); };
    const a = moonlabDice(ML, 1, Math.PI / 2), b = moonlabDice(ML, 1, Math.PI / 2), xs = Array.from({ length: 20000 }, () => a.next()), ys = Array.from({ length: 20000 }, () => b.next());
    const bias = moonlabDice(ML, 2, Math.PI / 3); const p1 = bias.probs.reduce((s, p, k) => s + p * (k & 1), 0);
    row = { dial: "Moonlab dice checks", chi2_15df: chi(xs), reproducible: xs.every((v, i) => v === ys[i]), uniformProbs: a.probs, biasP1: p1, biasExpected: Math.sin(Math.PI / 6) ** 2, label: a.label,
      pass: chi(xs) < 30.58 && xs.every((v, i) => v === ys[i]) && Math.abs(p1 - 0.25) < 1e-9 && a.probs.every((p) => Math.abs(p - 0.125) < 1e-9) }; // chi2 15 df, p=0.01 critical 30.58
  } else { const D = DIALS[+which]; const a = SEEDS.map((s) => life(s, D.wd, D.metric, 2, D.dice)), b = SEEDS.map((s) => life(s, D.ctl, D.metric, 2));
    const A = a.map((x) => x.v), B = b.map((x) => x.v), t = welch(A, B), d = cohenD(A, B);
    row = { i: +which, dial: D.id, metric: D.metric, dir: D.dir, control: mean(B), treated: mean(A), p: t.p, d, pass: D.dir === 0 ? Math.abs(d) < 0.5 && t.p >= 0.05 : t.p < 0.05 && Math.sign(t.diff) === D.dir && Math.abs(d) >= 0.5, ledgersMaxErr: Math.max(...[...a, ...b].map((x) => Math.max(x.wl, x.cl))) }; }
  writeFileSync(`out/dials8_${tag}_${which}.json`, JSON.stringify(row, null, 1)); console.log(JSON.stringify(row, (k, v) => (k === "uniformProbs" ? undefined : typeof v === "number" ? +v.toPrecision(4) : v))); })();
