// v4.1 integration probe = probe_integ.ts plus M41J mechanisms (dev seeds 600-631 only). usage: M50J=... M41J=... node probe_v41.js <seedbase> <n>
import { applyM41 } from "../../organism/v41mods";
if (+(process.argv[2] ?? 600) < 600 || +(process.argv[2] ?? 600) + +(process.argv[3] ?? 16) > 632) { console.error("probe_v41: integration seeds are 600-631"); process.exit(2); }
import { Organism } from "../../organism/organism";
applyM41(process.env.M41J);
const sb = +(process.argv[2] ?? 600), n = +(process.argv[3] ?? 16); const out: Record<string, number[]> = {};
const put = (k: string, v: number) => { (out[k] ??= []).push(Number.isFinite(v) ? v : 0); };
for (let s = sb; s < sb + n; s++) { const g: any = new Organism({ seed: s } as any); for (let t = 0; t < 480; t++) g.step(); const acc: Record<string, number> = {}; const aw: number[][] = [[], []]; let N = 0;
  for (let t = 0; t < 1440; t++) { g.step(); N++; const A = g.affect; const v: Record<string, number> = { NE: g.nm.NE.E, ACh: g.nm.ACh.E, DA: g.nm.DA.E, adenosineS: g.S, glc: g.blood.glc, cortisol: g.cortisol ?? 0, mood: A ? A.mood.val : 0, ignitions: g.mind.ign, conf: g.mind.conf ?? 0, confLow: g.scConfLow ?? 0 };
    for (const k in v) acc[k] = (acc[k] ?? 0) + v[k]; const w = g.mind.scAW; if (w !== undefined) aw[(g.ghrelin ?? 0) > 0.5 ? 1 : 0].push(w); }
  for (const k in acc) put(k, acc[k] / N); put("foraged", g.foraged); put("rewards", g.rewards);
  put("awSated", aw[0].length ? aw[0].reduce((a, b) => a + b, 0) / aw[0].length : NaN); put("awHungry", aw[1].length ? aw[1].reduce((a, b) => a + b, 0) / aw[1].length : NaN); }
console.log(JSON.stringify(out));
