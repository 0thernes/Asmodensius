// Replay recorder for the static Dome viewer (docs/viewer/). The creature runs HERE, headless, in Node; the browser only
// replays the recorded numbers. It never runs organism code. Organism code is whatever organism.ts is at the build commit
// (checked byte-identical to frozen Combo A pin bc6ad6a by record_all.sh). Combo A flags must be set in the environment:
//   ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}'
// usage: SEED=<dev seed 500-703> VARIANT=<name> [N=3] [DAYS=2] [EVERY=5] node record.js <out.json>
import { make001, Dome } from "../../lab/src/index";
import { BASE_WORLD, PRESETS } from "../../lab/src/biosphere/god";
const fs = require("fs");
const E = process.env, out = process.argv[2];
const die = (m: string): never => { console.error("record: " + m); process.exit(2); };
if (!out) die("missing output path");
const SEED = +(E.SEED ?? NaN); if (!(SEED >= 500 && SEED <= 703)) die("SEED must be a dev seed in 500-703 (never reservoir 704-999 or 1000+)");
if (E.ORG_V6 !== "1" || !E.M50J) die("Combo A flags (ORG_V6=1, M50J) must be set");
const N = +(E.N ?? 3), DAYS = +(E.DAYS ?? 2), EVERY = +(E.EVERY ?? 5), FOOD_EVERY = +(E.FOOD_EVERY ?? 30);
if (SEED + N - 1 > 703) die("creature seeds would leave the 500-703 dev range");
const VARIANTS: Record<string, any> = {
  baseline: {}, lush: PRESETS.utopia, sparse: { foodCapScale: 0.4, growthScale: 0.4 }, harsh: PRESETS.harsh,
  hazard: { toxicity: 0.0015, radiation: 0.0008, temperature: 32 }, grazers: { grazers: 40 }, hell: PRESETS.hell,
};
const VAR = E.VARIANT ?? "baseline"; const dials = VARIANTS[VAR]; if (!dials) die("unknown VARIANT " + VAR + " (" + Object.keys(VARIANTS).join(", ") + ")");
const dome = new Dome({ seed: SEED }, { ...dials, respawnAfter: 0 });
for (let k = 0; k < N; k++) dome.add("c" + k, make001(SEED + k));
const r3 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);
const R = ["SENS", "THAL", "CTX", "HIP", "STR", "HYP", "VTA", "RAPHE", "LC", "BF", "INS", "SCN", "MOT", "ENS"];
// per creature per frame, fixed column order (documented in the file header so the viewer stays generic)
const COLS = ["x", "y", "heading", "alive", "asleep", "atp", "glc", "fat", "liverGly", "muscle", "integrity", "eaten", "DA", "NE", "5HT", "ACh",
  "cortisol", "insulin", "ghrelin", "hr", "vagal", "stress", "moodVal", "moodAro", "fear", "delight", "frustration", "calm", "forage",
  ...R.map((r) => "rate:" + r)];
const row = (h: any) => { const c = h.c, o = c.o, A = o.affect, nm = o.nm, m = c.metrics();
  return [h.x, h.y, h.heading, h.deathT === undefined ? 1 : 0, m.asleep, o.atp, o.blood?.glc, o.fat, o.liverGly, o.muscle, o.integrity, o.eaten,
    nm.DA?.E, nm.NE?.E, nm["5HT"]?.E, nm.ACh?.E, o.cortisol, o.insulin, o.ghrelin, o.hr, o.vagal, A?.stress, A?.mood?.val, A?.mood?.aro,
    A?.emo?.fear, A?.emo?.delight, A?.emo?.frustration, A?.emo?.calm, m.forageNow, ...R.map((r) => o.regionRate?.[r] ?? 0)].map((v: any) => r3(+v)); };
const frames: any[] = [], food: any[] = [], t0 = Date.now(), T = DAYS * 1440;
for (let t = 0; t <= T; t++) {
  if (t > 0) dome.step();
  if (t % EVERY === 0) frames.push({ t: dome.t, light: r3(dome.light()), g: (dome.grazersXY ?? []).map((p: any) => [r3(p.x), r3(p.y)]), c: dome.pop.map(row) });
  if (t % FOOD_EVERY === 0) food.push({ t: dome.t, f: dome.patches.map((p: any) => Math.round(p.food * 10) / 10) });
}
const L = dome.ledger();
const doc = { format: "asmodensius-replay/1", creature: "001 (Asmodensius), frozen Combo A", flags: { ORG_V6: E.ORG_V6, M50J: E.M50J },
  codeCommit: E.CODE_COMMIT ?? null, organismSha256: E.ORGANISM_SHA ?? null, seed: SEED, creatureSeeds: Array.from({ length: N }, (_, k) => SEED + k),
  variant: VAR, dials: { ...BASE_WORLD, ...dials }, dome: { radius: dome.cfg.radius, cell: dome.cfg.cell, n: dome.n }, ids: dome.pop.map((h: any) => h.id),
  cols: COLS, every: EVERY, foodEvery: FOOD_EVERY, ticks: T, frames, food, end: { deaths: dome.deaths, worldLedgerError: L.worldLedgerError },
  note: "Recorded headless in Node. The browser replays numbers only. Not evidence of consciousness.", recordedAt: new Date().toISOString(), seconds: (Date.now() - t0) / 1000 };
fs.writeFileSync(out, JSON.stringify(doc));
console.log(`record ${VAR} seed ${SEED}: ${frames.length} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s, deaths ${dome.deaths}`);
