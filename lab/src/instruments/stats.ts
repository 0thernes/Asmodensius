// Port of neuralese-git/research.js permPaired / holm / bh / bootCI / cohenDPaired (same algorithms, typed).
import { mulberry } from "../rng";
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
export function permPaired(a: number[], b: number[], B = 5000, seed = 1) { const d = a.map((x, i) => x - b[i]), obs = Math.abs(mean(d)), r = mulberry(seed); let c = 0;
  for (let k = 0; k < B; k++) { let s = 0; for (const x of d) s += r() < 0.5 ? -x : x; if (Math.abs(s / d.length) >= obs - 1e-15) c++; } return { diff: mean(d), p: (c + 1) / (B + 1), B }; }
export function cohenDPaired(a: number[], b: number[]) { const d = a.map((x, i) => x - b[i]), m = mean(d); const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, d.length - 1)); return sd ? m / sd : 0; }
export function holm(ps: number[]) { const o = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]), m = ps.length, out = new Array(m); let run = 0; o.forEach(([p, i], k) => { run = Math.max(run, Math.min(1, (m - k) * p)); out[i] = run; }); return out as number[]; }
export function bh(ps: number[]) { const o = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]), m = ps.length, out = new Array(m); let run = 1; for (let k = m - 1; k >= 0; k--) { const [p, i] = o[k]; run = Math.min(run, (p * m) / (k + 1)); out[i] = Math.min(1, run); } return out as number[]; }
export function bootCI(xs: number[], B = 2000, seed = 1, stat = mean) { const r = mulberry(seed), n = xs.length, v: number[] = []; for (let b = 0; b < B; b++) { const s: number[] = []; for (let i = 0; i < n; i++) s.push(xs[Math.floor(r() * n)]); v.push(stat(s)); } v.sort((x, y) => x - y); return { est: stat(xs), lo: v[Math.floor(0.025 * B)], hi: v[Math.floor(0.975 * B)] }; }
