// Mutable v2.7 mechanisms (prereg v2.7). Parameters fixed in the prereg; nothing tuned on test seeds.
import { Rng, mulberry, gauss, creatureNet } from "./harness";
import { cqm21rNet } from "./v25mech";
// ---- CAP-B: 2D contact-physics crawler ----
export type BodyOpt = { phases: number[]; mu: number; aniso: number; phi0: number; jit: number[] };
export function crawl(o: BodyOpt, steps = 20000): number { const n = 6, L0 = 0.1, ka = 500, kb = 2, dt = 0.002, w = 6.283185307;
  const x = Array.from({ length: n }, (_, i) => i * L0 + o.jit[i]), y = Array.from({ length: n }, (_, i) => 0.005 + o.jit[n + i] * 0.1), vx = new Array(n).fill(0), vy = new Array(n).fill(0); const cx0 = x.reduce((a, b) => a + b) / n;
  for (let s = 0; s < steps; s++) { const t = s * dt; const fx = new Array(n).fill(0), fy = new Array(n).fill(-9.8);
    for (let i = 0; i < n - 1; i++) { const dx = x[i + 1] - x[i], dy = y[i + 1] - y[i], l = Math.hypot(dx, dy) || 1e-9; const rest = L0 * (1 + 0.2 * Math.sin(w * t + o.phi0 - o.phases[i])); const f = ka * (l - rest) + 5 * ((vx[i + 1] - vx[i]) * dx + (vy[i + 1] - vy[i]) * dy) / l; fx[i] += f * dx / l; fy[i] += f * dy / l; fx[i + 1] -= f * dx / l; fy[i + 1] -= f * dy / l; }
    for (let i = 1; i < n - 1; i++) { const a1 = Math.atan2(y[i] - y[i - 1], x[i] - x[i - 1]), a2 = Math.atan2(y[i + 1] - y[i], x[i + 1] - x[i]); let th = a2 - a1; th = Math.atan2(Math.sin(th), Math.cos(th)); const tq = -kb * (th - 0.3 * Math.sin(w * t + o.phi0 - o.phases[i]));
      for (const [j, sg] of [[i + 1, 1], [i - 1, -1]] as [number, number][]) { const rx = x[j] - x[i], ry = y[j] - y[i], r2 = rx * rx + ry * ry || 1e-9; const Fx = -sg * tq * ry / r2, Fy = sg * tq * rx / r2; fx[j] += Fx; fy[j] += Fy; fx[i] -= Fx; fy[i] -= Fy; } }
    for (let i = 0; i < n; i++) { if (y[i] < 0) { const N = Math.max(0, -2000 * y[i] - 20 * vy[i]); fy[i] += N; const mu = vx[i] < 0 ? o.mu * o.aniso : o.mu; fx[i] += -mu * N * Math.tanh(vx[i] / 0.01); }
      vx[i] += fx[i] * dt; vy[i] += fy[i] * dt; x[i] += vx[i] * dt; y[i] += vy[i] * dt; } }
  return x.reduce((a, b) => a + b) / n - cx0; }
// ---- CAP-R: self-description, noisy channel, majority-vote repair ----
export function stateOf(seed: number): Float32Array { const net = cqm21rNet(seed), r = mulberry(seed * 263 + 2710); const v: number[] = []; net.W.forEach((row) => v.push(...row)); v.push(...net.b); v.push(r() * 6.283185307, r(), (r() * 4294967296) >>> 0); return Float32Array.from(v); }
export function transmit(desc: Uint8Array, r: Rng, p: number): Uint8Array { const o = desc.slice(); for (let i = 0; i < o.length * 8; i++) if (r() < p) o[i >> 3] ^= 1 << (i & 7); return o; }
export function reproduce(parent: Float32Array, r: Rng, repair: boolean): Float32Array { const b = new Uint8Array(parent.buffer.slice(0)); const L = b.length;
  if (!repair) return new Float32Array(transmit(b, r, 1e-3).buffer); const d = new Uint8Array(3 * L); d.set(b); d.set(b, L); d.set(b, 2 * L); const rx = transmit(d, r, 1e-3); const out = new Uint8Array(L);
  for (let i = 0; i < L; i++) { const a = rx[i], c = rx[L + i], e = rx[2 * L + i]; out[i] = (a & c) | (a & e) | (c & e); } return new Float32Array(out.buffer); }
// CAP-C (C. elegans connectome rate model) retired 2026-10-31 under the originality rule; archived in archive/history/cap-c/.
// ---- CAP-S (v2.7a): uncertainty-aware planner. Known-open edges cost 1, unknown edges cost UNK; walls impassable. Same replanning loop as v2.6.
import { MN } from "./v26mech";
export let UNK = 20; export function setUNK(v: number) { UNK = v; }
const DX7 = [1, -1, 0, 0], DY7 = [0, 0, 1, -1]; const mv7 = (c: number, d: number) => { const x = c % MN + DX7[d], y = Math.floor(c / MN) + DY7[d]; return x < 0 || y < 0 || x >= MN || y >= MN ? -1 : y * MN + x; };
function dij(M: number[][], s: number, g: number): number { const N = MN * MN, dist = new Array(N).fill(Infinity), first = new Array(N).fill(-1), done = new Array(N).fill(false); dist[s] = 0;
  for (;;) { let u = -1; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i; if (u < 0 || u === g) break; done[u] = true;
    for (let d = 0; d < 4; d++) { const n = mv7(u, d); if (n < 0 || M[u][d] === 2) continue; const nd = dist[u] + (M[u][d] === 1 ? 1 : UNK); if (nd < dist[n]) { dist[n] = nd; first[n] = u === s ? d : first[u]; } } }
  return first[g]; }
export function seekPref(W: boolean[][], M: number[][], goal: number, cap: number): number { let c = 0, t = 0;
  while (c !== goal && t < cap) { let d = dij(M, c, goal); if (d < 0) { for (const row of M) for (let k = 0; k < 4; k++) if (row[k] === 2) row[k] = 0; d = dij(M, c, goal); } t++; if (d < 0) break; const n = mv7(c, d);
    if (W[c][d]) { M[c][d] = 2; if (n >= 0) M[n][d ^ 1] = 2; } else { M[c][d] = 1; M[n][d ^ 1] = 1; c = n; } }
  return c === goal ? t : cap; }
