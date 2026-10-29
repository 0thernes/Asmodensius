// QRNG bias diagnosis + debiasing (v0.4). Creature 001's "quantum" sample qOut is a Born-rule measurement of a 3-qubit state
// prepared with angles theta = pi*clamp(DA, 5HT, NE) (organism.ts line 404), measured with a uniform u from ent() (seeded mulberry).
// We compare observed bit frequencies with the Born-rule expectation from the prepared state at each tick; if they match, the
// 17.5 % ones is the physics of the prepared state, not a sampling bug. Then we test extractors: von Neumann and Toeplitz.
import type { CreatureLab } from "../interface";
import { nistBits } from "./nist";
import { mulberry } from "../rng";
export function vonNeumann(b: Uint8Array) { const o: number[] = []; for (let i = 0; i + 1 < b.length; i += 2) if (b[i] !== b[i + 1]) o.push(b[i]); return Uint8Array.from(o); }
// Toeplitz hashing: out_j = XOR_i T[j+i] & in_i over blocks of n input bits -> m output bits (m <= n * minEntropyPerBit - security margin)
export function toeplitz(b: Uint8Array, n: number, m: number, seedBits: Uint8Array) { const o: number[] = []; for (let s = 0; s + n <= b.length; s += n) for (let j = 0; j < m; j++) { let x = 0; for (let i = 0; i < n; i++) x ^= seedBits[(j + i) % seedBits.length] & b[s + i]; o.push(x); } return Uint8Array.from(o); }
export function minEntropyPerBit(b: Uint8Array) { const p1 = b.reduce((a, x) => a + x, 0) / b.length; return -Math.log2(Math.max(p1, 1 - p1)); }
export function qrngDiag(c: CreatureLab, samples = 20000) {
  const o = (c as any).o; const obs = [0, 0, 0], exp = [0, 0, 0]; const bits0: number[] = [], all: number[] = [];
  for (let t = 0; t < samples; t++) { c.step(1); const p: number[] = o.q.probs(); const s = o.qOut; for (let b = 0; b < 3; b++) { obs[b] += (s >> b) & 1; exp[b] += p.reduce((a: number, pk: number, k: number) => a + ((k >> b) & 1) * pk, 0); all.push((s >> b) & 1); } bits0.push(s & 1); }
  const raw = Uint8Array.from(all), lsb = Uint8Array.from(bits0), vn = vonNeumann(raw), H = minEntropyPerBit(raw);
  const r = mulberry(777), seedBits = Uint8Array.from({ length: 4096 }, () => (r() < 0.5 ? 1 : 0)), n = 256, m = Math.max(1, Math.floor(n * H * 0.5));
  const tz = toeplitz(raw, n, m, seedBits);
  // R variants (tuned on dev seeds >= 2000): VN on the bit-0 stream only (the 3 bits of one sample are entangled by the CNOT chain,
  // which breaks VN's independence assumption), and Toeplitz with a 4x min-entropy safety margin (bias drifts with the modulators).
  const vnL = vonNeumann(lsb), mR = Math.max(1, Math.floor(n * H * 0.25)), tzR = toeplitz(raw, n, mR, seedBits), both = toeplitz(vonNeumann(raw), 64, 32, seedBits);
  return { samples, bitOnesObserved: obs.map((x) => x / samples), bitOnesBornExpected: exp.map((x) => x / samples), raw: nistBits(raw), minEntropyPerBit: H,
    vonNeumann: { ...nistBits(vn), yield: vn.length / raw.length }, toeplitz: { n, m, ...nistBits(tz), yield: tz.length / raw.length },
    vonNeumannLsbR: { ...nistBits(vnL), yield: vnL.length / raw.length }, toeplitzR: { n, m: mR, ...nistBits(tzR), yield: tzR.length / raw.length }, vnThenToeplitzR: { ...nistBits(both), yield: both.length / raw.length },
    decisionNoiseSignMean: 2 * (obs[0] / samples) - 1 /* choose() uses (u & 1) as the noise sign: E[sign] = 2*P(bit0)-1 */ };
}
