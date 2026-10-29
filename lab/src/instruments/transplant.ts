// Neuralese activation patching (analysis.js patchResid) -> neural state transplant: copy a part's state from a donor
// creature (different seed or condition) into a recipient at tick T, then measure how far the recipient's motor/metric
// trajectory moves toward the donor's. effect = 1 means the part fully carries the difference, 0 = none.
import type { Factory } from "../interface";
const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
export function transplant(make: Factory, recipientSeed: number, donorSeed: number, parts: string[], warm: number, horizon: number, metricKeys: string[]) {
  const traj = (seed: number, patch?: string) => { const c = make(seed); c.step(warm); if (patch) { const d = make(donorSeed); d.step(warm); c.writeState(patch, d.readState(patch)); }
    const out: number[] = []; for (let h = 0; h < horizon; h++) { c.step(1); const m = c.metrics(); out.push(...Array.from(c.motor()), ...metricKeys.map((k) => m[k])); } return out; };
  const rec = traj(recipientSeed), don = traj(donorSeed), gap = dist(rec, don);
  return { gap, rows: parts.map((p) => { const x = traj(recipientSeed, p); return { part: p, movedFromRecipient: dist(x, rec), effect: gap ? (gap - dist(x, don)) / gap : 0 }; }) };
}
