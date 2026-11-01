// L5 conjunctive output pool: y = softplus(basal) * sigmoid(gA * apical). Graded, unsaturated (Larkum 2013 apical-basal coincidence in L5 pyramids).
export const softplus = (x: number): number => (x > 20 ? x : Math.log1p(Math.exp(x)));
export class L5Pool { Wb: Float64Array; Wa: Float64Array; y: Float64Array;
  constructor(public U: number, public N: number, r: () => number, public gA = 4) { const s = 2 / Math.sqrt(N); this.Wb = new Float64Array(U * N).map(() => (r() * 2 - 1) * s); this.Wa = new Float64Array(U * N).map(() => (r() * 2 - 1) * s); this.y = new Float64Array(U); }
  /* Oja (1982) local Hebbian rule: each dendrite's weights converge to the leading principal component of its input */
  oja(W: Float64Array, u: number, x: ArrayLike<number>, eta: number): void { const N = this.N; let y = 0; for (let k = 0; k < N; k++) y += W[u * N + k] * x[k]; for (let k = 0; k < N; k++) W[u * N + k] += eta * y * (x[k] - y * W[u * N + k]); }
  learn(own: ArrayLike<number>, oth: ArrayLike<number> | null, eta = 0.01): void { for (let u = 0; u < this.U; u++) { this.oja(this.Wb, u, own, eta); if (oth) this.oja(this.Wa, u, oth, eta); } }
  step(own: ArrayLike<number>, oth: ArrayLike<number> | null, mode: "mul" | "add" = "mul"): Float64Array { for (let u = 0; u < this.U; u++) { let b = 0, a = 0; for (let k = 0; k < this.N; k++) { b += this.Wb[u * this.N + k] * own[k]; if (oth) a += this.Wa[u * this.N + k] * oth[k]; }
      this.y[u] = mode === "mul" ? softplus(b) / (1 + Math.exp(-this.gA * a)) : softplus(b) + 0.5 * softplus(a); } return this.y; } }
