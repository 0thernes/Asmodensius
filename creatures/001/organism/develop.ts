// v4.0 developmental wiring (Asmodensius-original rules; concepts: chemoaffinity, Sperry 1963 PNAS 50:703; graded topographic guidance,
// Goodhill & Richards 1999 TINS 22:529; developmental overproduction then competitive pruning, Purves & Lichtman 1980 Science 210:153;
// Huttenlocher 1979 Brain Res 163:195). No connectome is imported: 001 grows its own wiring from a small heritable genome.
// The region-level projection table (which regions may talk, and at what density) is 001's own design. Development decides WHICH neurons connect:
//  1. every neuron gets a position x in [0,1] along its region and a 3-d surface tag (region tag from the genome + individual jitter);
//  2. each projection over-produces ~2x candidate synapses, with probability shaped by a genome-encoded topographic map
//     (target position ~ gain*x + offset, width sigma) and tag affinity;
//  3. competitive pruning: each postsynaptic neuron keeps its strongest-affinity inputs (plus noise) down to the target density.
// Genome length: 3 per projection (gain, offset, log sigma) + 3 per region (tag). Heritable via mutateGenome().
export type DevGenome = Float32Array;
export type Proj = [string, string, number];
const gs = (r: () => number) => { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); };
export function randomGenome(nProj: number, nReg: number, r: () => number): DevGenome { const g = new Float32Array(3 * nProj + 3 * nReg);
  for (let p = 0; p < nProj; p++) { g[3 * p] = 1 + 0.3 * gs(r); g[3 * p + 1] = 0.1 * gs(r); g[3 * p + 2] = Math.log(0.25) + 0.3 * gs(r); } for (let k = 3 * nProj; k < g.length; k++) g[k] = gs(r); return g; }
export function mutateGenome(g: DevGenome, r: () => number, rate = 0.05): DevGenome { const o = g.slice(); for (let k = 0; k < o.length; k++) o[k] += rate * gs(r); return o; }
/** grow edges for the projection table; returns lists parallel to organism.ts's random layer (pre, post, plastic-flag decided by caller) */
export function grow(P: Proj[], R0: Record<string, number>, RN: Record<string, number>, regions: string[], g: DevGenome, r: () => number): { pre: number[]; post: number[]; aff: number[]; stats: { candidates: number; kept: number; topo: number } } {
  const nP = P.length, tagOf = (reg: string) => { const k = 3 * nP + 3 * regions.indexOf(reg); return [g[k], g[k + 1], g[k + 2]]; };
  const pos = (i: number, reg: string) => (i - R0[reg] + 0.5) / RN[reg]; const jit = new Map<number, number[]>(); const tag = (i: number, reg: string) => { let t = jit.get(i); if (!t) { const b = tagOf(reg); t = b.map((v) => v + 0.5 * gs(r)); jit.set(i, t); } return t; };
  const pre: number[] = [], post: number[] = [], aff: number[] = []; let cand = 0, topo = 0;
  P.forEach(([a, b, p], pi) => { const gain = g[3 * pi], off = g[3 * pi + 1], sig = Math.max(0.05, Math.exp(g[3 * pi + 2]));
    for (let j = R0[b]; j < R0[b] + RN[b]; j++) { const xj = pos(j, b), tj = tag(j, b); const C: [number, number][] = [];
      for (let i = R0[a]; i < R0[a] + RN[a]; i++) { if (i === j) continue; const xi = pos(i, a), ti = tag(i, a); const d = xj - (gain * xi + off - (gain - 1) / 2);
        const A = Math.exp(-(d * d) / (2 * sig * sig)) * (1 + Math.tanh((ti[0] * tj[0] + ti[1] * tj[1] + ti[2] * tj[2]) / 3)); C.push([i, A]); }
      const meanA = C.reduce((s, c) => s + c[1], 0) / Math.max(1, C.length) || 1; const keepN = Math.round(p * C.length + (r() - 0.5)); // target density = the projection table's
      const over = C.filter(([, A]) => r() < Math.min(1, (2 * p * A) / meanA)); cand += over.length; // overproduction (~2x)
      over.sort((u, v) => v[1] * (0.7 + 0.6 * r()) - u[1] * (0.7 + 0.6 * r())); // competition with noise
      for (const [i, A] of over.slice(0, Math.max(0, keepN))) { pre.push(i); post.push(j); aff.push(A / meanA); const xi = pos(i, a); topo += 1 - Math.abs(xj - xi); } } });
  return { pre, post, aff, stats: { candidates: cand, kept: pre.length, topo: pre.length ? topo / pre.length : 0 } }; }
