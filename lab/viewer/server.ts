// Live dome viewer server (v0.5). The headless Dome sim runs here, in Node, and is the only source of truth: the browser only
// renders snapshots streamed over SSE and sends God-panel dial changes back, which are written into dome.dials of the running sim.
// Lab instruments run on demand against live creatures (read-only probes) or on fresh clones (experiments).
import { createServer } from "http"; import { readFileSync, writeFileSync, existsSync, renameSync } from "fs"; import { join } from "path";
import { makeTemplate } from "../template/creature";
import { make001, Dome, motorLensR, pci, qrngDiag } from "../src/index";
import { BASE_WORLD, PRESETS, LADDER, type WorldDials } from "../src/biosphere/god";
const PORT = +(process.env.PORT ?? 8787), N = +(process.env.N ?? 5), SEED = +(process.env.SEED ?? 3000);
let dome: Dome; let speed = 10; let paused = false;
// v0.7 multi-species: SPECIES="001:5,template:3" places different creature types in one dome (default: N x 001)
const FACTORIES: Record<string, (s: number) => any> = { "001": make001, template: makeTemplate };
const SPEC = (process.env.SPECIES ?? `001:${N}`).split(",").map((x) => x.split(":")) as [string, string][];
/* v0.9 lifecycle (DEATH-v1): the viewer honours creature 001's own death rule and respawns a newborn 60 ticks after a death (RESPAWN=0 disables) */
const VIEWER_DEF: Partial<WorldDials> = { respawnAfter: +(process.env.RESPAWN ?? 60) };
function reset(dials: Partial<WorldDials> = {}) { dome = new Dome({ seed: SEED }, { ...VIEWER_DEF, ...dials }); dome.spawn = (sp: string, s: number) => (FACTORIES[sp] ?? make001)(s); let k = 0; for (const [sp, n] of SPEC) for (let i = 0; i < +n; i++, k++) dome.add((sp === "001" ? "c" : sp[0]) + k, FACTORIES[sp](SEED + k)); }
// v0.8 persistence (v:2) is exact: Dome.snapshotFull() saves every world field and both PRNG states, plus each creature's snapshot() (organism v3.6).
// A restored dome continues bit-identically to the uninterrupted one (test_persist.mjs). Old v:1 files still load through the approximate path below.
// That path is a writeState partial transplant with the world ledger re-baselined.
const STATE = process.env.STATE ?? join(__dirname, "dome_state.json"), SAVE_MS = +(process.env.SAVE_MS ?? 30000); let restoreMode = "fresh", restoredAt: number | null = null, savedAt = 0;
function persist() { const w = { v: 2, savedAt: new Date().toISOString(), S: dome.snapshotFull(), speed, paused }; /* v0.8: exact, via organism v3.6 snapshot() and Dome.snapshotFull */

  writeFileSync(STATE + ".tmp", JSON.stringify(w)); renameSync(STATE + ".tmp", STATE); savedAt = dome.t; }
function restore(): boolean { if (!existsSync(STATE) || process.env.FRESH) return false; const w = JSON.parse(readFileSync(STATE, "utf8"));
  if (w.v === 2) { dome = Dome.fromSnapshot(w.S, (sp: string, seed: number) => (FACTORIES[sp ?? "001"] ?? make001)(seed)); dome.dials = { ...BASE_WORLD, ...VIEWER_DEF, ...dome.dials }; speed = w.speed; paused = w.paused; restoredAt = dome.t; restoreMode = "exact"; return true; }
  restoreMode = "v1-approximate"; const d: any = new Dome(w.cfg, w.dials); dome = d;
  for (const h of w.pop) { const c: any = (FACTORIES[h.species ?? "001"] ?? make001)(h.seed); for (const [k, v] of Object.entries(h.parts)) { try { c.writeState(k, Float64Array.from(v as number[]), "full"); } catch {} } if (c.o) c.o.t = h.age; /* non-001 species restart their clock (no age setter in the interface) */ d.add(h.id, c, h.dials); const I = d.pop[d.pop.length - 1]; Object.assign(I, { x: h.x, y: h.y, heading: h.heading, path: h.path }); }
  d.t = w.t; d.grown = w.grown; w.patches.forEach((f: number, i: number) => (d.patches[i].food = f)); Object.assign(d, w.counters); d.grazersXY = w.grazersXY; d.learn = new Map(w.learn); speed = w.speed; paused = w.paused;
  d.E0 = d.total() - d.grown; restoredAt = d.t; return true; } // world ledger re-baselined at restore because creature ledgers restart
if (!restore()) reset(); setInterval(persist, SAVE_MS); for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig as any, () => { persist(); process.exit(0); });
const clients = new Set<any>();
const snap = () => { const L = dome.ledger(); return { t: dome.t, light: dome.light(), dials: dome.dials, speed, paused, n: dome.n, radius: dome.cfg.radius, cell: dome.cfg.cell,
  food: dome.patches.map((p) => Math.round(p.food * 10) / 10), grazers: dome.grazersXY, detritus: dome.detritus, parasite: dome.parasiteBiomass, grazerBiomass: dome.grazerBiomass, teleports: dome.teleports, games: dome.games, worldLedgerError: L.worldLedgerError, species: dome.speciesStats(), restoredAt, restoreMode, deaths: dome.deaths, births: dome.births, savedAt,
  pop: dome.pop.map((h) => { const m = h.c.metrics(); return { id: h.id, species: h.species, alive: h.deathT === undefined, atp: m.atp, x: h.x, y: h.y, heading: h.heading, path: h.path, asleep: m.asleep, DA: m.DA, NE: m.NE, glc: m.glc, integrity: m.integrity, stores: m.stores, eaten: m.eaten, ledgerError: m.ledgerError, coopP: dome.coopProb(h.id) }; }) }; };
setInterval(() => { if (!paused) for (let i = 0; i < speed; i++) dome.step(); const s = "data: " + JSON.stringify(snap()) + "\n\n"; for (const c of clients) c.write(s); }, 100);
const body = (req: any) => new Promise<any>((ok) => { let b = ""; req.on("data", (d: any) => (b += d)); req.on("end", () => ok(b ? JSON.parse(b) : {})); });
const NUM = new Set(Object.entries(BASE_WORLD).filter(([, v]) => typeof v === "number").map(([k]) => k));
createServer(async (req, res) => { const u = new URL(req.url!, "http://x"); const cors = u.pathname === "/inspect" ? { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "content-type" } : {}; /* v0.9: CORS on /inspect so the creature 001 inspector page can call it from another origin */
  if (u.pathname === "/inspect" && req.method === "OPTIONS") { res.writeHead(204, { ...cors, "access-control-max-age": "86400" }); return res.end(); }
  const json = (o: unknown, code = 200) => { res.writeHead(code, { "content-type": "application/json", ...cors }); res.end(JSON.stringify(o)); };
  try {
    if (u.pathname === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(readFileSync(join(__dirname, "..", "viewer", "index.html"))); }
    if (u.pathname.startsWith("/vendor/") && /^[\w.]+$/.test(u.pathname.slice(8))) { res.writeHead(200, { "content-type": "text/javascript" }); return res.end(readFileSync(join(__dirname, "..", "viewer", "vendor", u.pathname.slice(8)))); }
    if (u.pathname === "/stream") { res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" }); clients.add(res); req.on("close", () => clients.delete(res)); return; }
    if (u.pathname === "/state") return json(snap());
    if (u.pathname === "/dials" && req.method === "POST") { const b = await body(req); const bad: string[] = [];
      for (const [k, v] of Object.entries(b)) { if (NUM.has(k) && typeof v === "number" && isFinite(v)) (dome.dials as any)[k] = v; else if (k === "game" && ["none", "pd", "stag"].includes(v as string)) dome.dials.game = v as any; else if (k === "gameStrategy" && ["fixed", "learned"].includes(v as string)) dome.dials.gameStrategy = v as any; else if (k === "electric") dome.dials.electric = v as any; else bad.push(k); }
      return json({ ok: bad.length === 0, rejected: bad, dials: dome.dials }, bad.length ? 400 : 200); }
    if (u.pathname === "/preset" && req.method === "POST") { const b = await body(req); const p = b.ladder !== undefined ? LADDER[b.ladder] : (PRESETS as any)[b.name]; if (!p) return json({ error: "unknown preset" }, 400); Object.assign(dome.dials, BASE_WORLD, VIEWER_DEF, p); return json({ ok: true, dials: dome.dials }); }
    if (u.pathname === "/control" && req.method === "POST") { const b = await body(req); if (b.speed !== undefined) speed = Math.max(0, Math.min(200, +b.speed)); if (b.paused !== undefined) paused = !!b.paused; if (b.reset) reset(); return json({ ok: true, speed, paused }); }
    if (u.pathname === "/god" && req.method === "POST") { const b = await body(req); const h = dome.pop.find((p) => p.id === b.id); if (!h) return json({ error: "no creature " + b.id }, 404);
      if (b.act === "stimulate") h.c.stimulate(b.part, +b.amount); else if (b.act === "shiftModulator") h.c.shiftModulator!(b.name, +b.amount); else if (b.act === "harm") h.c.harm!(+b.amount); else if (b.act === "feed") { const p = dome.cellAt(h.x, h.y), g = Math.min(+b.amount, p.food); p.food -= g; h.c.give!(g); } else if (b.act === "lesion") h.c.lesionCoupling(b.coupling, +b.gain); else return json({ error: "unknown act" }, 400);
      return json({ ok: true }); }
    // creature 001 inspector, wired to lab instruments
    if (u.pathname === "/inspect") { const h = dome.pop.find((p) => p.id === u.searchParams.get("id")); if (!h) return json({ error: "no creature" }, 404); const tool = u.searchParams.get("tool") ?? "state"; const c: any = h.c;
      if (tool === "viability") { const o = c.o; return json({ id: h.id, alive: c.alive ? c.alive() : true, deathT: h.deathT ?? null, ageDays: c.t() / 1440, atp: o?.atp, bloodGlc: o?.blood?.glc, ket: o?.blood?.ket, fat: o?.fat, liverGly: o?.liverGly, muscle: o?.muscle, lowGlcTicks: o?.lowGlc, eatenKJ: o?.eaten, eatenPerDay: o ? o.eaten / Math.max(1e-9, c.t() / 1440) : null, deaths: dome.deaths, births: dome.births, deathLog: dome.deathLog.slice(-10), respawnAfter: dome.dials.respawnAfter }); }
      if (tool === "state") return json({ id: h.id, t: c.t(), metrics: c.metrics(), regionRates: Object.fromEntries((c.parts() as any[]).filter((p) => p.kind === "region").map((p, i) => [p.id, c.readState("regionRates")[i]])), routing: { winner: c.routing().winner, ignitions: c.routing().ignitions }, ledger: c.ledger() });
      if (tool === "motorLens") { const k = make001(c.seed); k.step(300); return json(motorLensR(k, ["CTX", "regionRates", "rateAvg"], 600, 5, c.seed)); }
      if (tool === "pci") return json(pci((s: number) => make001(s), c.seed, "CTX", 3));
      if (tool === "qrng") { const k = make001(c.seed); k.step(100); const r = qrngDiag(k, 4000); return json({ bornVsObs: [r.bitOnesObserved, r.bitOnesBornExpected], raw: r.raw.pass, vnToeplitz: r.vnThenToeplitzR.pass, signMean: r.decisionNoiseSignMean, rawBit0SignMean: r.rawBit0SignMean, vnFallbackRate: r.vnFallbackRate, signSource: "v3.6+ von Neumann-debiased Born bit (organism.ts), replayed on the creature's prepared state" }); }
      return json({ error: "tools: state, motorLens, pci, qrng" }, 400); }
    json({ error: "not found" }, 404);
  } catch (e: any) { json({ error: String(e?.message ?? e) }, 500); }
}).listen(PORT, () => console.log(`dome viewer on http://localhost:${PORT}  (N=${N}, seed=${SEED})`));
