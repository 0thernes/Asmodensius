// Adaptive quality tiers + frame-time governor.
// Software rasterisers (SwiftShader / llvmpipe, e.g. headless CI) start at "minimal" so input latency stays within budget;
// real GPUs start at "high". In "auto" mode the governor only steps DOWN (never oscillates up) after sustained overload.

export const TIERS = ["minimal", "low", "medium", "high", "ultra"];

export const TIER_SETTINGS = {
  minimal: { pixelRatio: 0.5, maxFps: 24, post: false, msaa: 0, shadows: 0, flora: 260, terrainSeg: 72, particles: 0.0, bloomMips: 0, envEverySec: 0, iridescence: false, trailPts: 0 },
  low: { pixelRatio: 0.75, maxFps: 40, post: true, msaa: 0, shadows: 0, flora: 900, terrainSeg: 110, particles: 0.25, bloomMips: 3, envEverySec: 0, iridescence: false, trailPts: 24 },
  medium: { pixelRatio: 1.0, maxFps: 60, post: true, msaa: 0, shadows: 1024, flora: 2600, terrainSeg: 160, particles: 0.5, bloomMips: 4, envEverySec: 12, iridescence: false, trailPts: 48 },
  high: { pixelRatio: 1.5, maxFps: 60, post: true, msaa: 4, shadows: 2048, flora: 6000, terrainSeg: 220, particles: 0.8, bloomMips: 5, envEverySec: 4, iridescence: true, trailPts: 64 },
  ultra: { pixelRatio: 2.0, maxFps: 120, post: true, msaa: 4, shadows: 4096, flora: 10000, terrainSeg: 300, particles: 1.0, bloomMips: 6, envEverySec: 2, iridescence: true, trailPts: 96 },
};

/** Inspect the WebGL context and pick a starting tier. Returns { tier, gpu, software }. */
export function detectTier(gl) {
  let gpu = "unknown";
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch {
    // Some privacy modes block renderer strings; fall through to the conservative default below.
  }
  const software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(gpu);
  const mobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const tier = software ? "minimal" : mobile ? "medium" : "high";
  return { tier, gpu, software };
}

/** Exponential-moving-average frame governor. */
export class FrameGovernor {
  constructor(onStepDown) {
    this.onStepDown = onStepDown;
    this.emaMs = 16;
    this.overBudgetFrames = 0;
    this.enabled = true;
  }

  sample(frameMs, tier) {
    if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 1000) return;
    this.emaMs += 0.05 * (frameMs - this.emaMs);
    const budget = 1000 / Math.min(60, TIER_SETTINGS[tier].maxFps);
    if (this.enabled && this.emaMs > budget * 1.7) this.overBudgetFrames++;
    else this.overBudgetFrames = Math.max(0, this.overBudgetFrames - 2);
    if (this.overBudgetFrames > 120) {
      this.overBudgetFrames = 0;
      const idx = TIERS.indexOf(tier);
      if (idx > 0) this.onStepDown(TIERS[idx - 1]);
    }
  }
}
