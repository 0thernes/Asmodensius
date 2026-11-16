// Seeded, deterministic noise shared by every render module (JS + GLSL).
// Rule (docs/VISUALS.md): decorative variation must be reproducible, so Math.random is never used in lab/viewer/render/.

/** 32-bit integer hash -> [0, 1). */
export function hash1(n) {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 2D lattice hash -> [0, 1). */
export function hash2(x, y) {
  return hash1(Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263));
}

/** Stable hash of a string id (used only for decorative identity hues). */
export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return hash1(h);
}

const fade = (t) => t * t * (3 - 2 * t);

/** Smooth 2D value noise in [0, 1). */
export function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal Brownian motion, `oct` octaves, result roughly in [0, 1). */
export function fbm(x, y, oct = 4) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * valueNoise(x * f, y * f);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / norm;
}

/** GLSL counterparts (identical intent; GPU float hash, not bit-identical to JS). */
export const GLSL_NOISE = /* glsl */ `
float asmoHash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float asmoNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = asmoHash12(i), b = asmoHash12(i + vec2(1.0, 0.0));
  float c = asmoHash12(i + vec2(0.0, 1.0)), d = asmoHash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float asmoFbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * asmoNoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return s / 0.96875;
}
`;
