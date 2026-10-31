// FIRST-PRINCIPLES RPT-2 module (isolated): two modules, each with N rectified units driven by its own feature; cross-module synapses arrive on
// dendrites with a threshold nonlinearity (dendritic conjunction; Häusser & Mel 2003; Larkum 2013) one tick later (recurrence takes time;
// Lamme 2006). After T ticks a linear read-out of both modules can decode XOR(a,b) only if cross-module input mixed nonlinearly. Original code.
export class TwoModule { Wa: number[][]; Wx: number[][]; th: number[]; A: number[]; B: number[];
  constructor(readonly N: number, seed: number) { let s = seed >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    this.Wa = Array.from({ length: 2 * N }, () => [r() * 2 - 1, r() * 2 - 1]); this.Wx = Array.from({ length: 2 * N }, () => Array.from({ length: N }, () => (r() * 2 - 1) / Math.sqrt(N))); this.th = Array.from({ length: 2 * N }, () => r()); this.A = new Array(N).fill(0); this.B = new Array(N).fill(0); }
  /** one tick: unit i of module (i<N ? A : B) = relu(feedforward(own feature) + dendrite(relu(cross input - th))) ; lesion cuts cross input */
  step(a: number, b: number, lesion: boolean): number[] { const N = this.N, prevA = this.A, prevB = this.B; const u = (i: number) => { const own = i < N ? a : b, other = i < N ? prevB : prevA; const ff = this.Wa[i][0] * own + this.Wa[i][1] * 0.5; const x = lesion ? 0 : this.Wx[i].reduce((s, w, j) => s + w * other[j], 0); return Math.max(0, ff + 2 * Math.max(0, x - this.th[i] * 0.5)); };
    const nA = Array.from({ length: N }, (_, i) => u(i)), nB = Array.from({ length: N }, (_, i) => u(N + i)); this.A = nA; this.B = nB; return [...nA, ...nB]; }
  reset(): void { this.A.fill(0); this.B.fill(0); } }

/** v4.0 apical-gain variant (original code): cross-module input lands on an apical compartment whose sigmoid output MULTIPLIES the basal
 *  (feedforward) drive, so a unit bursts only for basal AND apical coincidence (BAC firing; Larkum, Zhu & Sakmann 1999; Larkum 2013). */
export class ApicalGain extends TwoModule { gain = 3;
  step(a: number, b: number, lesion: boolean): number[] { const N = this.N, pA = this.A, pB = this.B; const u = (i: number) => { const own = i < N ? a : b, other = i < N ? pB : pA; const ff = Math.max(0, this.Wa[i][0] * own + this.Wa[i][1] * 0.5);
      const ap = lesion ? 0 : this.Wx[i].reduce((s, w, j) => s + w * other[j], 0); const g = 1 / (1 + Math.exp(-(ap - (this.th[i] - 0.5) * 0.5) / 0.1)); return ff * (lesion ? 1 : 1 + this.gain * (g - 0.5)) ; };
    const nA = Array.from({ length: N }, (_, i) => u(i)), nB = Array.from({ length: N }, (_, i) => u(N + i)); this.A = nA; this.B = nB; return [...nA, ...nB]; } }
