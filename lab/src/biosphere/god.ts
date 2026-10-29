// God control panel: world dials and creature dials ("God plays dice"). Every dial acts through the Creature Lab Interface
// and is energy-conserving. Dice come from a DiceSource with provenance; default is seeded mulberry32 ("classical-seeded").
// The tsotchke quantum_rng WASM (neuralese-git/tsotchke/qrng.mjs) is the planned "qrng" source (not wired yet).
import { mulberry } from "../rng";
export type DiceSource = { name: "classical-seeded" | "qrng"; next: () => number };
export const seededDice = (seed: number): DiceSource => ({ name: "classical-seeded", next: mulberry(seed * 2654435761) });
export type WorldDials = {
  foodCapScale: number;      // ecology / food cycle: nutrient capacity per patch (0 = barren)
  growthScale: number;       // photosynthetic regrowth rate
  gravity: number;           // 1 = baseline; scales locomotion cost (ATP -> heat) and slows movement
  toxicity: number;          // per-tick tissue damage
  electric: { part: string; amount: number } | null;   // sustained electrical stimulation
  sensoryLoad: number;       // hyper-stimulation of the sensory sheet (0 = baseline)
  quantumKicks: number;      // probability per tick of a dice-driven pulse into a random brain part
};
export type CreatureDials = {
  modShift: { name: string; perTick: number } | null;   // neuromodulator shift
  rewireFrac: number;        // dice: fraction of synapses silenced at birth
  lesionDice: boolean;       // dice: one random mechanism lesion at birth
  mutationSigma: number;     // dice: genes ~ exp(N(0, sigma)) at birth
};
export const BASE_WORLD: WorldDials = { foodCapScale: 1, growthScale: 1, gravity: 1, toxicity: 0, electric: null, sensoryLoad: 0, quantumKicks: 0 };
export const BASE_CREATURE: CreatureDials = { modShift: null, rewireFrac: 0, lesionDice: false, mutationSigma: 0 };
export const PRESETS: Record<string, Partial<WorldDials>> = {
  utopia: { foodCapScale: 2, growthScale: 3, gravity: 0.5 },
  baseline: {},
  harsh: { foodCapScale: 0.3, growthScale: 0.3, gravity: 2, toxicity: 0.0005 },
  hell: { foodCapScale: 0.05, growthScale: 0.05, gravity: 3, toxicity: 0.003, sensoryLoad: 2, quantumKicks: 0.2 },
};
export const LESION_POOL = ["recLesion", "gwLesion", "rpeLesion", "efeLesion", "ppLesion", "stdpLesion", "homeoLesion", "nmdaLesion", "traceLesion", "pidLesion"];
export const KICK_PARTS = ["CTX", "THAL", "HIP", "STR", "VTA", "LC", "HYP", "MOT"];
export function birthOpts(cd: CreatureDials, dice: DiceSource): { opts: Record<string, unknown>; log: string[] } {
  const opts: Record<string, unknown> = {}, log: string[] = [];
  if (cd.mutationSigma > 0) { const g = Array.from({ length: 4 }, () => { const u = Math.max(1e-12, dice.next()), v = dice.next(); return Math.exp(cd.mutationSigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)); }); opts.genes = g; log.push(`genes ${g.map((x) => x.toFixed(2)).join(",")}`); }
  if (cd.lesionDice) { const f = LESION_POOL[Math.floor(dice.next() * LESION_POOL.length)]; opts[f] = true; log.push(`lesion ${f}`); }
  return { opts, log };
}
