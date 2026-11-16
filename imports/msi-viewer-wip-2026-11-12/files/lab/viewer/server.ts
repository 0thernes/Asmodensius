// Hardened Live Dome Viewer Server (v5.0 — Grade-A MVP Standard 2.2.0 Compliant).
// Enforces loopback bind by default (I-038), strict CORS/Origin allow-list (I-228), per-response cryptographic
// CSP nonce with zero unsafe-inline/unsafe-eval (I-091, I-225), HSTS/nosniff/DENY headers, 64 KB body cap (413, I-267),
// sliding-window rate limiting (429, I-266), canonicalized path-traversal block (403, I-275), strict input schema
// validation (400, I-065), /healthz readiness check (I-293), and secret/PII-redacting structured logs (I-230).

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";
import { randomBytes, timingSafeEqual } from "crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join, resolve, sep } from "path";
import { makeTemplate } from "../template/creature";
import { Dome, make001, motorLensR, pci, qrngDiag } from "../src/index";
import { BASE_WORLD, LADDER, PRESETS, type WorldDials } from "../src/biosphere/god";
import { CREVICE_REFUGIA_CENTERS, CREVICE_REFUGIA_RADIUS, SAFE_OASIS_CENTERS, SAFE_OASIS_RADIUS, TOXIC_VENT_CENTERS, TOXIC_VENT_RADIUS } from "../src/biosphere/dome";
import type { CreatureLab } from "../src/interface";

/** Static habitat geometry streamed to the viewer so terrain features are drawn exactly where the simulation places them. */
const HABITAT_GEOMETRY = {
  crevices: CREVICE_REFUGIA_CENTERS.map(([x, y]) => [x, y]),
  creviceRadius: CREVICE_REFUGIA_RADIUS,
  vents: TOXIC_VENT_CENTERS.map(([x, y]) => [x, y]),
  ventRadius: TOXIC_VENT_RADIUS,
  oases: SAFE_OASIS_CENTERS.map(([x, y]) => [x, y]),
  oasisRadius: SAFE_OASIS_RADIUS,
};
const RENDER_MODULE_RE = /^[a-z0-9-]{1,48}\.mjs$/;

export const SERVER_VERSION = "5.0.0";
export const MAX_BODY_BYTES = 65_536;
export const MAX_SSE_CLIENTS = 32;

const SECRET_PATTERNS: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]"],
  /\bsk-[A-Za-z0-9_-]{12,}\b/g instanceof RegExp ? [/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_SK]"] : [/$^/, ""],
  [/\bgh[pousr]_[A-Za-z0-9]{16,}\b/g, "[REDACTED_GH_TOKEN]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_KEY]"],
  [/((?:api[_-]?key|secret|password|token|authorization)\s*[:=]\s*)([^\s"',;]+)/gi, "$1[REDACTED]"],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED_EMAIL]"],
];

export function redactSecrets(input: string): string {
  let out = input;
  for (const [re, rep] of SECRET_PATTERNS) {
    out = out.replace(re, rep);
  }
  return out;
}

export function structuredLog(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown> = {},
  sink: (line: string) => void = (line) => console.log(line),
): string {
  const raw = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  const safe = redactSecrets(raw);
  sink(safe);
  return safe;
}

export interface ViewerServerOptions {
  host?: string;
  port?: number;
  populationN?: number;
  seed?: number;
  speciesSpec?: string;
  respawnAfter?: number;
  stateFile?: string | null;
  saveIntervalMs?: number;
  tickIntervalMs?: number;
  rateLimitMax?: number;
  heavyRateLimitMax?: number;
  rateWindowMs?: number;
  allowedOrigins?: string[];
  viewerDir?: string;
  nodeEnv?: string;
  authToken?: string;
  quiet?: boolean;
}

export interface ViewerServerHandle {
  server: Server;
  getPort: () => number;
  getDome: () => Dome;
  listen: () => Promise<number>;
  close: () => Promise<void>;
}

class PayloadTooLargeError extends Error {
  readonly statusCode = 413;
  constructor() {
    super("payload exceeds 65536-byte limit");
  }
}

class BadJsonError extends Error {
  readonly statusCode = 400;
  constructor(msg = "invalid JSON object body") {
    super(msg);
  }
}

function readJsonObjectBody(req: IncomingMessage, maxBytes = MAX_BODY_BYTES): Promise<Record<string, unknown>> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    req.on("data", (chunk: Buffer | string) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > maxBytes) {
        settled = true;
        req.resume();
        rejectBody(new PayloadTooLargeError());
        return;
      }
      chunks.push(buf);
    });

    req.on("error", (err) => {
      if (!settled) {
        settled = true;
        rejectBody(err);
      }
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;
      if (total === 0) {
        resolveBody({});
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        // Reject raw __proto__ / constructor / prototype keys before & after parse
        if (/"(?:__proto__|constructor|prototype)"\s*:/.test(text)) {
          rejectBody(new BadJsonError("forbidden prototype key in JSON payload"));
          return;
        }
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          rejectBody(new BadJsonError("JSON body must be a plain object"));
          return;
        }
        resolveBody(parsed as Record<string, unknown>);
      } catch {
        rejectBody(new BadJsonError("malformed JSON payload"));
      }
    });
  });
}

const NUMERIC_DIAL_BOUNDS: Record<string, [number, number]> = {
  foodCapScale: [0, 10],
  growthScale: [0, 20],
  dayLength: [0, 24],
  lightScale: [0, 5],
  gravity: [0.05, 20],
  temperature: [-30, 80],
  toxicity: [0, 0.2],
  sensoryLoad: [0, 10],
  quantumKicks: [0, 1],
  wind: [0, 2],
  o2: [0, 1],
  co2: [0, 1],
  radiation: [0, 0.2],
  recycling: [0, 1],
  parasites: [0, 0.5],
  ph: [0, 14],
  singularity: [0, 10],
  sensoryLinesR: [0, 1],
  grazers: [0, 500],
  timeWarp: [0, 20],
  timeWarpR: [0, 30],
  respawnAfter: [0, 10000],
  seasonAmp: [0, 1],
  seasonPeriod: [0, 100000],
  thermalGrad: [-30, 30],
  budEnergyThreshold: [0, 2000],
  maxPop: [1, 64],
  toxicHazardZones: [0, 0.5],
};

const BOOLEAN_DIALS = new Set<string>([
  "lightToCreatures",
  "honestSignals",
  "wasteGarden",
  "creviceRefugia",
  "neutralShadow",
]);

const ALLOWED_MODULATORS = new Set(["DA", "5HT", "ACh", "NE"]);
const SAFE_ID_RE = /^[A-Za-z0-9._-]{1,32}$/;
const SAFE_COUPLING_RE = /^[A-Za-z0-9._>-]{1,48}$/;
const TRACEPARENT_RE = /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i;
export const MAX_RATE_BUCKETS = 4096;

export function parseBoundedNumber(
  name: string,
  explicit: number | undefined,
  envRaw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  integerOnly = false,
): number {
  const val =
    explicit !== undefined
      ? explicit
      : envRaw !== undefined && envRaw.trim() !== ""
        ? Number(envRaw)
        : fallback;
  if (typeof val !== "number" || !Number.isFinite(val) || (integerOnly && !Number.isInteger(val)) || val < min || val > max) {
    throw new RangeError(`Invalid configuration ${name}: expected ${integerOnly ? "integer" : "number"} in [${min}, ${max}], got ${String(explicit ?? envRaw)}`);
  }
  return val;
}

export function parseSpeciesSpec(raw: string): [string, number][] {
  const trimmed = raw.trim();
  if (!trimmed) throw new RangeError("Invalid configuration SPECIES: must not be empty");
  const out: [string, number][] = [];
  for (const part of trimmed.split(",")) {
    const segs = part.split(":");
    if (segs.length !== 2 || !SAFE_ID_RE.test(segs[0])) {
      throw new RangeError(`Invalid configuration SPECIES entry: ${part}`);
    }
    const count = Number(segs[1]);
    if (!Number.isInteger(count) || count < 0 || count > 64) {
      throw new RangeError(`Invalid configuration SPECIES count in ${part}: expected integer in [0, 64]`);
    }
    out.push([segs[0], count]);
  }
  return out;
}

export function isValidSnapshotEnvelope(w: unknown): w is { v: 2; S: Parameters<typeof Dome.fromSnapshot>[0]; speed?: unknown; paused?: unknown } {
  if (typeof w !== "object" || w === null || Array.isArray(w)) return false;
  const rec = w as Record<string, unknown>;
  if (rec.v !== 2 || typeof rec.S !== "object" || rec.S === null || Array.isArray(rec.S)) return false;
  const s = rec.S as Record<string, unknown>;
  if (s.v !== 2 || typeof s.f !== "object" || s.f === null || Array.isArray(s.f)) return false;
  const f = s.f as Record<string, unknown>;
  return (
    typeof f.t === "number" &&
    Number.isFinite(f.t) &&
    f.t >= 0 &&
    typeof f.cfg === "object" &&
    f.cfg !== null &&
    Array.isArray(s.pop) &&
    s.pop.length <= 128
  );
}

export function verifyBearerToken(authHeader: string | undefined, expectedToken: string | undefined): boolean {
  if (!expectedToken || expectedToken.length < 16 || !authHeader || !authHeader.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authHeader.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  if (supplied.length !== expected.length) return false;
  return timingSafeEqual(supplied, expected);
}

export function createViewerServer(opts: ViewerServerOptions = {}): ViewerServerHandle {
  const rawHost = opts.host ?? (process.env.HOST && process.env.HOST.trim() !== "" ? process.env.HOST.trim() : "127.0.0.1");
  if (!/^[A-Za-z0-9.:_-]{1,128}$/.test(rawHost)) {
    throw new TypeError(`Invalid configuration HOST: ${rawHost}`);
  }
  const host = rawHost;
  const requestedPort = parseBoundedNumber("PORT", opts.port, process.env.PORT, 8787, 0, 65_535, true);
  const popN = parseBoundedNumber("N", opts.populationN, process.env.N, 5, 1, 64, true);
  const seed = parseBoundedNumber("SEED", opts.seed, process.env.SEED, 3000, -2_147_483_648, 2_147_483_647, true);
  const respawnAfter = parseBoundedNumber("RESPAWN", opts.respawnAfter, process.env.RESPAWN, 60, 0, 10_000, false);
  const defaultViewerDir = existsSync(join(__dirname, "index.html")) ? __dirname : resolve(process.cwd(), "lab", "viewer");
  const viewerDir = resolve(opts.viewerDir ?? defaultViewerDir);
  const vendorDir = resolve(viewerDir, "vendor");
  const envStateFile = (process.env.STATE ?? process.env.STATE_FILE ?? "").trim();
  const stateFile =
    opts.stateFile === null
      ? null
      : (opts.stateFile ?? (envStateFile !== "" ? envStateFile : join(viewerDir, "dome_state.json")));
  const saveIntervalMs = parseBoundedNumber("SAVE_MS", opts.saveIntervalMs, process.env.SAVE_MS, 30_000, 0, 86_400_000, true);
  const tickIntervalMs = parseBoundedNumber("tickIntervalMs", opts.tickIntervalMs, undefined, 100, 0, 60_000, true);
  const rateLimitMax = parseBoundedNumber("RATE_LIMIT_MAX", opts.rateLimitMax, process.env.RATE_LIMIT_MAX, 120, 1, 100_000, true);
  const heavyRateLimitMax = parseBoundedNumber("heavyRateLimitMax", opts.heavyRateLimitMax, undefined, 15, 1, 10_000, true);
  const rateWindowMs = parseBoundedNumber("rateWindowMs", opts.rateWindowMs, undefined, 10_000, 100, 3_600_000, true);
  const runtimeEnv = opts.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const authToken = opts.authToken ?? (process.env.VIEWER_AUTH_TOKEN && process.env.VIEWER_AUTH_TOKEN.trim() !== "" ? process.env.VIEWER_AUTH_TOKEN.trim() : undefined);
  const quiet = opts.quiet ?? false;

  const factories: Record<string, (s: number) => CreatureLab> = {
    "001": (s: number) => make001(s, { apexMind: true }),
    template: (s: number) => makeTemplate(s),
  };
  const specRaw = opts.speciesSpec ?? (process.env.SPECIES && process.env.SPECIES.trim() !== "" ? process.env.SPECIES : `001:${popN}`);
  const specPairs = parseSpeciesSpec(specRaw);
  const viewerDefaults: Partial<WorldDials> = { respawnAfter };

  let dome!: Dome;
  let speed = 10;
  let paused = false;
  let restoreMode = "fresh";
  let restoredAt: number | null = null;
  let savedAt = 0;
  let activePort = requestedPort;

  const log = (level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) => {
    if (!quiet) structuredLog(level, event, fields);
  };

  function reset(dials: Partial<WorldDials> = {}): void {
    dome = new Dome({ seed }, { ...viewerDefaults, ...dials });
    dome.spawn = (sp: string, s: number) => (factories[sp] ?? factories["001"])(s);
    let k = 0;
    for (const [sp, countNum] of specPairs) {
      const count = Math.max(0, Math.min(32, countNum));
      const fac = factories[sp] ?? factories["001"];
      for (let i = 0; i < count; i++, k++) {
        const prefix = sp === "001" ? "c" : (sp[0] ?? "x");
        dome.add(`${prefix}${k}`, fac(seed + k));
      }
    }
  }

  function persist(): void {
    if (!stateFile) return;
    const payload = {
      v: 2,
      savedAt: new Date().toISOString(),
      S: dome.snapshotFull(),
      speed,
      paused,
    };
    writeFileSync(`${stateFile}.tmp`, JSON.stringify(payload));
    renameSync(`${stateFile}.tmp`, stateFile);
    savedAt = dome.t;
  }

  function restore(): boolean {
    if (!stateFile || !existsSync(stateFile) || process.env.FRESH) return false;
    try {
      const w: unknown = JSON.parse(readFileSync(stateFile, "utf8"));
      if (isValidSnapshotEnvelope(w)) {
        dome = Dome.fromSnapshot(w.S, (sp: string, s: number) => (factories[sp ?? "001"] ?? factories["001"])(s));
        dome.dials = { ...BASE_WORLD, ...viewerDefaults, ...dome.dials };
        speed = typeof w.speed === "number" && Number.isFinite(w.speed) ? Math.max(0, Math.min(200, w.speed)) : 10;
        paused = Boolean(w.paused);
        restoredAt = dome.t;
        restoreMode = "exact";
        return true;
      }
      log("warn", "state_restore_rejected_schema", { stateFile });
    } catch (err) {
      log("warn", "state_restore_failed", { reason: err instanceof Error ? err.message : String(err) });
    }
    return false;
  }

  if (!restore()) reset();

  const clients = new Set<ServerResponse>();
  const rateBuckets = new Map<string, number[]>();
  const heavyBuckets = new Map<string, number[]>();

  function checkRateLimit(bucketMap: Map<string, number[]>, key: string, maxReqs: number): boolean {
    const now = Date.now();
    const cutoff = now - rateWindowMs;
    const prev = bucketMap.get(key);
    if (prev !== undefined) bucketMap.delete(key);
    const active = prev ? prev.filter((t) => t > cutoff) : [];
    if (bucketMap.size >= MAX_RATE_BUCKETS) {
      for (const [k, ts] of bucketMap) {
        if (ts.length === 0 || ts[ts.length - 1] <= cutoff) bucketMap.delete(k);
        if (bucketMap.size < MAX_RATE_BUCKETS) break;
      }
      if (bucketMap.size >= MAX_RATE_BUCKETS) {
        const oldestKey = bucketMap.keys().next().value;
        if (oldestKey !== undefined) bucketMap.delete(oldestKey);
      }
    }
    if (active.length >= maxReqs) {
      bucketMap.set(key, active);
      return false;
    }
    active.push(now);
    bucketMap.set(key, active);
    return true;
  }

  function isAllowedOrigin(originHeader: string | undefined): boolean {
    if (!originHeader) return true; // Same-origin non-CORS or CLI curl without Origin
    if (originHeader === "null") return false;
    const explicit = opts.allowedOrigins ?? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) : []);
    const allowed = new Set<string>([
      `http://127.0.0.1:${activePort}`,
      `http://localhost:${activePort}`,
      ...explicit,
    ]);
    return allowed.has(originHeader);
  }

  function buildSecurityHeaders(
    nonce: string | undefined,
    originHeader: string | undefined,
    requestId: string,
    traceparent: string,
  ): Record<string, string> {
    const csp = nonce
      ? `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`
      : "default-src 'none'; frame-ancestors 'none'; sandbox";
    const headers: Record<string, string> = {
      "content-security-policy": csp,
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
      "x-request-id": requestId,
      traceparent,
    };
    if (originHeader && isAllowedOrigin(originHeader)) {
      headers["access-control-allow-origin"] = originHeader;
      headers["vary"] = "Origin";
      headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
      headers["access-control-allow-headers"] = "content-type, authorization, traceparent, x-request-id";
    }
    return headers;
  }

  const snap = () => {
    const L = dome.ledger();
    const firstVis = dome.pop.find((h) => typeof h.c.visualState === "function");
    return {
      t: dome.t,
      light: dome.light(),
      dials: dome.dials,
      speed,
      paused,
      n: dome.n,
      radius: dome.cfg.radius,
      cell: dome.cfg.cell,
      habitat: HABITAT_GEOMETRY,
      regionIds: firstVis ? firstVis.c.parts().filter((p) => p.kind === "region").map((p) => p.id) : [],
      food: dome.patches.map((p) => Math.round(p.food * 10) / 10),
      soil: dome.patches.map((p) => Math.round((p.soil ?? 0) * 10) / 10),
      windDir: dome.windDir,
      neoMarks: Array.from(dome.neoMarks, (v) => Math.round(v * 1000) / 1000),
      grazers: dome.grazersXY,
      detritus: dome.detritus,
      parasite: dome.parasiteBiomass,
      grazerBiomass: dome.grazerBiomass,
      teleports: dome.teleports,
      games: dome.games,
      coop: dome.coop,
      signalsEmitted: dome.signalsEmitted,
      buds: dome.buds,
      creviceEntries: dome.creviceEntries,
      worldLedgerError: L.worldLedgerError,
      species: dome.speciesStats(),
      restoredAt,
      restoreMode,
      deaths: dome.deaths,
      births: dome.births,
      savedAt,
      pop: dome.pop.map((h) => {
        const m = h.c.metrics();
        return {
          id: h.id,
          species: h.species,
          alive: h.deathT === undefined,
          atp: m.atp,
          x: h.x,
          y: h.y,
          heading: h.heading,
          path: h.path,
          asleep: m.asleep,
          DA: m.DA,
          NE: m.NE,
          glc: m.glc,
          integrity: m.integrity,
          stores: m.stores,
          eaten: m.eaten,
          ledgerError: m.ledgerError,
          coopP: dome.coopProb(h.id),
          vis: h.c.visualState ? h.c.visualState() : null,
        };
      }),
    };
  };

  const simTimer =
    tickIntervalMs > 0
      ? setInterval(() => {
          if (!paused) {
            for (let i = 0; i < speed; i++) dome.step();
          }
          if (clients.size > 0) {
            const frame = `data: ${JSON.stringify(snap())}\n\n`;
            for (const c of clients) c.write(frame);
          }
        }, tickIntervalMs)
      : null;

  const saveTimer = stateFile && saveIntervalMs > 0 ? setInterval(persist, saveIntervalMs) : null;

  const server = createServer(async (req, res) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    const clientIp = req.socket.remoteAddress ?? "local";
    const incomingReqId = typeof req.headers["x-request-id"] === "string" && SAFE_ID_RE.test(req.headers["x-request-id"])
      ? req.headers["x-request-id"]
      : randomBytes(8).toString("hex");
    const incomingTrace = typeof req.headers.traceparent === "string" && TRACEPARENT_RE.test(req.headers.traceparent)
      ? req.headers.traceparent.toLowerCase()
      : `00-${randomBytes(16).toString("hex")}-${randomBytes(8).toString("hex")}-01`;
    const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : undefined;
    const requireOperatorAuth = (): boolean => {
      if (runtimeEnv !== "production") return true;
      return verifyBearerToken(authHeader, authToken);
    };
    const sendJson = (obj: unknown, code = 200, extra: Record<string, string> = {}) => {
      const payload =
        code >= 400 && typeof obj === "object" && obj !== null && !Array.isArray(obj)
          ? { ...(obj as Record<string, unknown>), requestId: incomingReqId }
          : obj;
      res.writeHead(code, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        ...extra,
      });
      res.end(JSON.stringify(payload));
    };

    try {
      const rawUrl = req.url ?? "/";
      if (rawUrl.length > 2048 || rawUrl.includes("\0") || rawUrl.includes("%00")) {
        return sendJson({ error: "invalid request URI" }, 400);
      }

      if (!checkRateLimit(rateBuckets, clientIp, rateLimitMax)) {
        return sendJson({ error: "rate limit exceeded" }, 429, { "retry-after": "10" });
      }

      if (req.method === "OPTIONS") {
        if (origin && !isAllowedOrigin(origin)) {
          return sendJson({ error: "origin not allowed" }, 403);
        }
        res.writeHead(204, {
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
          "access-control-max-age": "86400",
        });
        return res.end();
      }

      // Block cross-origin CSRF writes on state-mutating POST requests
      if (req.method === "POST" && origin && !isAllowedOrigin(origin)) {
        log("warn", "blocked_cross_origin_post", { origin, url: rawUrl, requestId: incomingReqId });
        return sendJson({ error: "cross-origin state mutation forbidden" }, 403);
      }

      const u = new URL(rawUrl, `http://127.0.0.1:${activePort}`);
      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(u.pathname);
      } catch {
        return sendJson({ error: "malformed URI encoding" }, 400);
      }

      // Canonical path-traversal, hidden dotfile & source-map block before any static file access (I-271, I-275)
      if (
        decodedPath.includes("..") ||
        decodedPath.includes("\\") ||
        decodedPath.includes("/.") ||
        decodedPath.toLowerCase().endsWith(".map")
      ) {
        log("warn", "blocked_path_traversal", { path: decodedPath, requestId: incomingReqId });
        return sendJson({ error: "forbidden path" }, 403);
      }

      if (decodedPath === "/healthz" && req.method === "GET") {
        const L = dome.ledger();
        const healthy = Number.isFinite(L.worldLedgerError) && L.worldLedgerError < 1e-6;
        const aliveCount = dome.pop.filter((p) => p.deathT === undefined).length;
        return sendJson(
          {
            ok: healthy,
            status: healthy ? "ready" : "degraded",
            version: SERVER_VERSION,
            tick: dome.t,
            aliveCount,
            worldLedgerError: L.worldLedgerError,
          },
          healthy ? 200 : 503,
        );
      }

      if (decodedPath === "/" && req.method === "GET") {
        const nonce = randomBytes(16).toString("base64");
        const htmlTemplate = readFileSync(join(viewerDir, "index.html"), "utf8");
        const html = htmlTemplate.replaceAll("__CSP_NONCE__", nonce);
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
          ...buildSecurityHeaders(nonce, origin, incomingReqId, incomingTrace),
        });
        return res.end(html);
      }

      if ((decodedPath === "/favicon.svg" || decodedPath === "/favicon.ico") && req.method === "GET") {
        const svg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
          '<rect width="64" height="64" rx="14" fill="#111930"/>' +
          '<circle cx="32" cy="34" r="20" fill="#1d3557" stroke="#6484cc" stroke-width="3"/>' +
          '<circle cx="32" cy="34" r="9" fill="#52b788"/>' +
          "</svg>";
        res.writeHead(200, {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=600",
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        });
        return res.end(svg);
      }

      if (decodedPath === "/viewer.css" && req.method === "GET") {
        const css = readFileSync(join(viewerDir, "viewer.css"));
        res.writeHead(200, {
          "content-type": "text/css; charset=utf-8",
          "cache-control": "no-cache",
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        });
        return res.end(css);
      }

      if (decodedPath === "/viewer-app.mjs" && req.method === "GET") {
        const js = readFileSync(join(viewerDir, "viewer-app.mjs"));
        res.writeHead(200, {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "no-cache",
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        });
        return res.end(js);
      }

      if (decodedPath.startsWith("/render/") && req.method === "GET") {
        const rel = decodedPath.slice("/render/".length);
        if (!RENDER_MODULE_RE.test(rel)) {
          return sendJson({ error: "forbidden render module path" }, 403);
        }
        const renderDir = resolve(viewerDir, "render");
        const fullRenderPath = resolve(renderDir, rel);
        if (!fullRenderPath.startsWith(renderDir + sep) || !existsSync(fullRenderPath)) {
          return sendJson({ error: "render module not found" }, 404);
        }
        res.writeHead(200, {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "no-cache",
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        });
        return res.end(readFileSync(fullRenderPath));
      }

      if (decodedPath.startsWith("/vendor/") && req.method === "GET") {
        const rel = decodedPath.slice("/vendor/".length);
        const fullVendorPath = resolve(vendorDir, rel);
        if (!fullVendorPath.startsWith(vendorDir + sep) || !/^[A-Za-z0-9._-]+$/.test(rel) || rel.endsWith(".map")) {
          return sendJson({ error: "forbidden vendor path" }, 403);
        }
        if (!existsSync(fullVendorPath)) {
          return sendJson({ error: "vendor asset not found" }, 404);
        }
        res.writeHead(200, {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "public, max-age=600",
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        });
        return res.end(readFileSync(fullVendorPath));
      }

      if (decodedPath === "/stream" && req.method === "GET") {
        if (clients.size >= MAX_SSE_CLIENTS) {
          return sendJson({ error: "too many active stream clients" }, 503);
        }
        res.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache",
          connection: "keep-alive",
          ...buildSecurityHeaders(undefined, origin, incomingReqId, incomingTrace),
        });
        res.write(`data: ${JSON.stringify(snap())}\n\n`);
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }

      if (decodedPath === "/state" && req.method === "GET") {
        return sendJson(snap());
      }

      if (decodedPath === "/dials" && req.method === "POST") {
        const b = await readJsonObjectBody(req);
        const keys = Object.keys(b);
        if (keys.length === 0 || keys.length > 32) {
          return sendJson({ error: "dials payload must contain 1..32 keys" }, 400);
        }
        const bad: string[] = [];
        const updates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(b)) {
          const bounds = NUMERIC_DIAL_BOUNDS[k];
          if (bounds !== undefined) {
            if (typeof v === "number" && Number.isFinite(v) && v >= bounds[0] && v <= bounds[1]) {
              updates[k] = v;
            } else {
              bad.push(k);
            }
          } else if (BOOLEAN_DIALS.has(k)) {
            if (typeof v === "boolean") updates[k] = v;
            else bad.push(k);
          } else if (k === "game" && (v === "none" || v === "pd" || v === "stag")) {
            updates[k] = v;
          } else if (k === "gameStrategy" && (v === "fixed" || v === "learned")) {
            updates[k] = v;
          } else if (k === "lightMode" && (v === "cycle" || v === "LL" || v === "DD")) {
            updates[k] = v;
          } else if (k === "deathRule" && (v === "organism" || v === "creature" || v === "off")) {
            updates[k] = v;
          } else if (k === "electric") {
            if (
              v === null ||
              (typeof v === "object" &&
                !Array.isArray(v) &&
                typeof (v as { part?: unknown }).part === "string" &&
                SAFE_ID_RE.test((v as { part: string }).part) &&
                typeof (v as { amount?: unknown }).amount === "number" &&
                Number.isFinite((v as { amount: number }).amount) &&
                (v as { amount: number }).amount >= 0 &&
                (v as { amount: number }).amount <= 20)
            ) {
              updates[k] = v;
            } else {
              bad.push(k);
            }
          } else {
            bad.push(k);
          }
        }
        if (bad.length > 0) {
          return sendJson({ ok: false, error: "invalid dial fields", rejected: bad }, 400);
        }
        Object.assign(dome.dials, updates);
        return sendJson({ ok: true, rejected: [], dials: dome.dials });
      }

      if (decodedPath === "/preset" && req.method === "POST") {
        const b = await readJsonObjectBody(req);
        let preset: Partial<WorldDials> | undefined;
        if (b.ladder !== undefined) {
          if (typeof b.ladder !== "number" || !Number.isInteger(b.ladder) || b.ladder < 0 || b.ladder >= LADDER.length) {
            return sendJson({ error: "ladder rung must be an integer 0..6" }, 400);
          }
          preset = LADDER[b.ladder];
        } else if (typeof b.name === "string" && Object.prototype.hasOwnProperty.call(PRESETS, b.name)) {
          preset = (PRESETS as Record<string, Partial<WorldDials>>)[b.name];
        }
        if (!preset) return sendJson({ error: "unknown preset" }, 400);
        Object.assign(dome.dials, BASE_WORLD, viewerDefaults, preset);
        return sendJson({ ok: true, dials: dome.dials });
      }

      if (decodedPath === "/control" && req.method === "POST") {
        const b = await readJsonObjectBody(req);
        for (const k of Object.keys(b)) {
          if (k !== "speed" && k !== "paused" && k !== "reset") {
            return sendJson({ error: `unknown control field: ${k}` }, 400);
          }
        }
        if (b.speed !== undefined) {
          if (typeof b.speed !== "number" || !Number.isFinite(b.speed) || b.speed < 0 || b.speed > 200) {
            return sendJson({ error: "speed must be a finite number in [0, 200]" }, 400);
          }
          speed = b.speed;
        }
        if (b.paused !== undefined) {
          if (typeof b.paused !== "boolean") {
            return sendJson({ error: "paused must be boolean" }, 400);
          }
          paused = b.paused;
        }
        if (b.reset !== undefined) {
          if (typeof b.reset !== "boolean") {
            return sendJson({ error: "reset must be boolean" }, 400);
          }
          if (b.reset) {
            if (!requireOperatorAuth()) {
              return sendJson({ error: "operator authorization required in production" }, 403);
            }
            if (!checkRateLimit(heavyBuckets, clientIp, heavyRateLimitMax)) {
              return sendJson({ error: "heavy reset rate limit exceeded" }, 429, { "retry-after": "10" });
            }
            reset();
          }
        }
        return sendJson({ ok: true, speed, paused });
      }

      if (decodedPath === "/god" && req.method === "POST") {
        if (!requireOperatorAuth()) {
          return sendJson({ error: "privileged operator endpoint disabled or unauthorized in production" }, 403);
        }
        if (!checkRateLimit(heavyBuckets, clientIp, heavyRateLimitMax)) {
          return sendJson({ error: "operator perturbation rate limit exceeded" }, 429, { "retry-after": "10" });
        }
        const b = await readJsonObjectBody(req);
        if (typeof b.id !== "string" || !SAFE_ID_RE.test(b.id)) {
          return sendJson({ error: "invalid creature id" }, 400);
        }
        const h = dome.pop.find((p) => p.id === b.id);
        if (!h) return sendJson({ error: "creature not found" }, 404);

        if (b.act === "stimulate") {
          if (typeof b.part !== "string" || !SAFE_ID_RE.test(b.part) || typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount < 0 || b.amount > 50) {
            return sendJson({ error: "invalid stimulate parameters" }, 400);
          }
          const knownPart = h.c.parts().some((p) => p.id === b.part);
          if (!knownPart) return sendJson({ error: "unknown anatomical part" }, 400);
          h.c.stimulate(b.part, b.amount);
        } else if (b.act === "shiftModulator") {
          if (typeof b.name !== "string" || !ALLOWED_MODULATORS.has(b.name) || typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount < -2 || b.amount > 2) {
            return sendJson({ error: "invalid shiftModulator parameters" }, 400);
          }
          h.c.shiftModulator?.(b.name as "DA" | "5HT" | "ACh" | "NE", b.amount);
        } else if (b.act === "harm") {
          if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1) {
            return sendJson({ error: "harm amount must be in (0, 1]" }, 400);
          }
          h.c.harm?.(b.amount);
        } else if (b.act === "feed") {
          if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 50) {
            return sendJson({ error: "feed amount must be in (0, 50]" }, 400);
          }
          const p = dome.cellAt(h.x, h.y);
          const g = Math.min(b.amount, p.food);
          p.food -= g;
          h.c.give?.(g);
        } else if (b.act === "lesion") {
          if (typeof b.coupling !== "string" || !SAFE_COUPLING_RE.test(b.coupling) || typeof b.gain !== "number" || !Number.isFinite(b.gain) || b.gain < 0 || b.gain > 2) {
            return sendJson({ error: "invalid lesion parameters" }, 400);
          }
          h.c.lesionCoupling(b.coupling, b.gain);
        } else {
          return sendJson({ error: "unknown act" }, 400);
        }
        return sendJson({ ok: true });
      }

      if (decodedPath === "/inspect" && req.method === "GET") {
        const id = u.searchParams.get("id") ?? "";
        if (!SAFE_ID_RE.test(id)) return sendJson({ error: "invalid creature id" }, 400);
        const h = dome.pop.find((p) => p.id === id);
        if (!h) return sendJson({ error: "creature not found" }, 404);
        const tool = u.searchParams.get("tool") ?? "state";
        if (tool === "motorLens" || tool === "pci" || tool === "qrng") {
          if (!checkRateLimit(heavyBuckets, clientIp, heavyRateLimitMax)) {
            return sendJson({ error: "heavy probe rate limit exceeded" }, 429, { "retry-after": "10" });
          }
        }
        const c = h.c as CreatureLab & {
          o?: {
            atp: number;
            blood: { glc: number; ket: number };
            fat: number;
            liverGly: number;
            muscle: number;
            lowGlc: number;
            eaten: number;
          };
          apexState?: () => unknown;
          v40State?: () => unknown;
        };
        if (tool === "viability") {
          const o = c.o;
          return sendJson({
            id: h.id,
            alive: c.alive ? c.alive() : true,
            deathT: h.deathT ?? null,
            ageDays: c.t() / 1440,
            atp: o?.atp,
            bloodGlc: o?.blood?.glc,
            ket: o?.blood?.ket,
            fat: o?.fat,
            liverGly: o?.liverGly,
            muscle: o?.muscle,
            lowGlcTicks: o?.lowGlc,
            eatenKJ: o?.eaten,
            eatenPerDay: o ? o.eaten / Math.max(1e-9, c.t() / 1440) : null,
            deaths: dome.deaths,
            births: dome.births,
            deathLog: dome.deathLog.slice(-10),
            respawnAfter: dome.dials.respawnAfter,
          });
        }
        if (tool === "state") {
          const regionParts = c.parts().filter((p) => p.kind === "region");
          const rates = c.readState("regionRates");
          const rt = c.routing ? c.routing() : { winner: -1, ignitions: 0 };
          return sendJson({
            id: h.id,
            t: c.t(),
            metrics: c.metrics(),
            regionRates: Object.fromEntries(regionParts.map((p, i) => [p.id, rates[i]])),
            routing: { winner: rt.winner, ignitions: rt.ignitions },
            ledger: c.ledger?.(),
          });
        }
        if (tool === "motorLens") {
          const k = make001(c.seed);
          k.step(300);
          return sendJson(motorLensR(k, ["CTX", "regionRates", "rateAvg"], 600, 5, c.seed));
        }
        if (tool === "pci") return sendJson(pci((s: number) => make001(s), c.seed, "CTX", 3));
        if (tool === "qrng") {
          const k = make001(c.seed);
          k.step(100);
          const r = qrngDiag(k, 4000);
          return sendJson({
            bornVsObs: [r.bitOnesObserved, r.bitOnesBornExpected],
            raw: r.raw.pass,
            vnToeplitz: r.vnThenToeplitzR.pass,
            signMean: r.decisionNoiseSignMean,
            rawBit0SignMean: r.rawBit0SignMean,
            vnFallbackRate: r.vnFallbackRate,
            signSource: "v3.6+ von Neumann-debiased Born bit (organism.ts), replayed on prepared state",
          });
        }
        if (tool === "apex") {
          return sendJson({
            id: h.id,
            t: c.t(),
            apex: c.apexState ? c.apexState() : null,
            v40: c.v40State ? c.v40State() : null,
          });
        }
        if (tool === "weights") {
          return sendJson({
            id: h.id,
            t: c.t(),
            note: "Live synaptic weight statistics per named coupling; gain is the current lesion mask (POST /god act=lesion sets it in [0, 2]).",
            couplings: c.couplingWeights ? c.couplingWeights() : [],
          });
        }
        return sendJson({ error: "tools: state, viability, apex, weights, motorLens, pci, qrng" }, 400);
      }

      if (decodedPath === "/client-error" && req.method === "POST") {
        const body = await readJsonObjectBody(req);
        const message = typeof body.message === "string" ? body.message.slice(0, 512) : "";
        if (!message) {
          return sendJson({ error: "message required" }, 400);
        }
        const stack = typeof body.stack === "string" ? body.stack.slice(0, 4096) : undefined;
        const clientVersion = typeof body.version === "string" ? body.version.slice(0, 32) : SERVER_VERSION;
        log("error", "client_unhandled_error", {
          version: clientVersion,
          serverVersion: SERVER_VERSION,
          requestId: incomingReqId,
          traceparent: incomingTrace,
          message,
          stack,
        });
        return sendJson({ ok: true, requestId: incomingReqId });
      }

      return sendJson({ error: "not found" }, 404);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        return sendJson({ error: err.message }, 413);
      }
      if (err instanceof BadJsonError) {
        return sendJson({ error: err.message }, 400);
      }
      log("error", "unhandled_request_error", {
        version: SERVER_VERSION,
        requestId: incomingReqId,
        traceparent: incomingTrace,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error && err.stack ? err.stack : undefined,
      });
      return sendJson({ error: "internal server error" }, 500);
    }
  });

  const listen = () =>
    new Promise<number>((resolvePort, rejectPort) => {
      server.once("error", rejectPort);
      server.listen(requestedPort, host, () => {
        const addr = server.address();
        activePort = typeof addr === "object" && addr ? addr.port : requestedPort;
        log("info", "viewer_listening", { host, port: activePort, n: popN, seed });
        resolvePort(activePort);
      });
    });

  const close = () =>
    new Promise<void>((resolveClose) => {
      if (simTimer) clearInterval(simTimer);
      if (saveTimer) clearInterval(saveTimer);
      try {
        persist();
      } catch (err) {
        log("warn", "state_save_on_close_failed", { reason: err instanceof Error ? err.message : String(err) });
      }
      for (const c of clients) {
        try {
          c.end();
        } catch {
          // ignore closed stream
        }
      }
      clients.clear();
      if (!server.listening) {
        resolveClose();
        return;
      }
      server.closeAllConnections?.();
      server.close(() => resolveClose());
    });

  return {
    server,
    getPort: () => activePort,
    getDome: () => dome,
    listen,
    close,
  };
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  process.on("uncaughtException", (err) => {
    structuredLog("error", "server_uncaught_exception", {
      version: SERVER_VERSION,
      error: err.message,
      stack: err.stack,
    });
  });
  process.on("unhandledRejection", (reason) => {
    structuredLog("error", "server_unhandled_rejection", {
      version: SERVER_VERSION,
      error: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
  const handle = createViewerServer();
  handle.listen().then((port) => {
    const host = process.env.HOST ?? "127.0.0.1";
    console.log(`Asmodensius Dome viewer v${SERVER_VERSION} listening on http://${host}:${port}`);
  });
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => {
      handle.close().finally(() => process.exit(0));
    });
  }
}
