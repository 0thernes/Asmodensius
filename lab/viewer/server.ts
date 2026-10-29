// Live dome viewer server (v0.5). The headless Dome sim runs here, in Node, and is the only source of truth: the browser only
// renders snapshots streamed over SSE and sends God-panel dial changes back, which are written into dome.dials of the running sim.
// Lab instruments run on demand against live creatures (read-only probes) or on fresh clones (experiments).
import { createServer } from "http"; import { readFileSync } from "fs"; import { join } from "path";
import { make001, Dome, motorLensR, pci, qrngDiag } from "../src/index";
import { BASE_WORLD, PRESETS, LADDER, type WorldDials } from "../src/biosphere/god";
const PORT = +(process.env.PORT ?? 8787), N = +(process.env.N ?? 5), SEED = +(process.env.SEED ?? 3000);
let dome: Dome; let speed = 10; let paused = false;
function reset(dials: Partial<WorldDials> = {}) { dome = new Dome({ seed: SEED }, dials); for (let k = 0; k < N; k++) dome.add("c" + k, make001(SEED + k)); }
reset();
const clients = new Set<any>();
const snap = () => { const L = dome.ledger(); return { t: dome.t, light: dome.light(), dials: dome.dials, speed, paused, n: dome.n, radius: dome.cfg.radius, cell: dome.cfg.cell,
  food: dome.patches.map((p) => Math.round(p.food * 10) / 10), grazers: dome.grazersXY, detritus: dome.detritus, parasite: dome.parasiteBiomass, grazerBiomass: dome.grazerBiomass, teleports: dome.teleports, games: dome.games, worldLedgerError: L.worldLedgerError,
  pop: dome.pop.map((h) => { const m = h.c.metrics(); return { id: h.id, x: h.x, y: h.y, heading: h.heading, path: h.path, asleep: m.asleep, DA: m.DA, NE: m.NE, glc: m.glc, integrity: m.integrity, stores: m.stores, eaten: m.eaten, ledgerError: m.ledgerError, coopP: dome.coopProb(h.id) }; }) }; };
setInterval(() => { if (!paused) for (let i = 0; i < speed; i++) dome.step(); const s = "data: " + JSON.stringify(snap()) + "\n\n"; for (const c of clients) c.write(s); }, 100);
const body = (req: any) => new Promise<any>((ok) => { let b = ""; req.on("data", (d: any) => (b += d)); req.on("end", () => ok(b ? JSON.parse(b) : {})); });
const NUM = new Set(Object.entries(BASE_WORLD).filter(([, v]) => typeof v === "number").map(([k]) => k));
createServer(async (req, res) => { const u = new URL(req.url!, "http://x"); const json = (o: unknown, code = 200) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  try {
    if (u.pathname === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(readFileSync(join(__dirname, "..", "viewer", "index.html"))); }
    if (u.pathname.startsWith("/vendor/") && /^[\w.]+$/.test(u.pathname.slice(8))) { res.writeHead(200, { "content-type": "text/javascript" }); return res.end(readFileSync(join(__dirname, "..", "viewer", "vendor", u.pathname.slice(8)))); }
    if (u.pathname === "/stream") { res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" }); clients.add(res); req.on("close", () => clients.delete(res)); return; }
    if (u.pathname === "/state") return json(snap());
    if (u.pathname === "/dials" && req.method === "POST") { const b = await body(req); const bad: string[] = [];
      for (const [k, v] of Object.entries(b)) { if (NUM.has(k) && typeof v === "number" && isFinite(v)) (dome.dials as any)[k] = v; else if (k === "game" && ["none", "pd", "stag"].includes(v as string)) dome.dials.game = v as any; else if (k === "gameStrategy" && ["fixed", "learned"].includes(v as string)) dome.dials.gameStrategy = v as any; else if (k === "electric") dome.dials.electric = v as any; else bad.push(k); }
      return json({ ok: bad.length === 0, rejected: bad, dials: dome.dials }, bad.length ? 400 : 200); }
    if (u.pathname === "/preset" && req.method === "POST") { const b = await body(req); const p = b.ladder !== undefined ? LADDER[b.ladder] : (PRESETS as any)[b.name]; if (!p) return json({ error: "unknown preset" }, 400); Object.assign(dome.dials, BASE_WORLD, p); return json({ ok: true, dials: dome.dials }); }
    if (u.pathname === "/control" && req.method === "POST") { const b = await body(req); if (b.speed !== undefined) speed = Math.max(0, Math.min(200, +b.speed)); if (b.paused !== undefined) paused = !!b.paused; if (b.reset) reset(); return json({ ok: true, speed, paused }); }
    if (u.pathname === "/god" && req.method === "POST") { const b = await body(req); const h = dome.pop.find((p) => p.id === b.id); if (!h) return json({ error: "no creature " + b.id }, 404);
      if (b.act === "stimulate") h.c.stimulate(b.part, +b.amount); else if (b.act === "shiftModulator") h.c.shiftModulator!(b.name, +b.amount); else if (b.act === "harm") h.c.harm!(+b.amount); else if (b.act === "feed") { const p = dome.cellAt(h.x, h.y), g = Math.min(+b.amount, p.food); p.food -= g; h.c.give!(g); } else if (b.act === "lesion") h.c.lesionCoupling(b.coupling, +b.gain); else return json({ error: "unknown act" }, 400);
      return json({ ok: true }); }
    // creature 001 inspector, wired to lab instruments
    if (u.pathname === "/inspect") { const h = dome.pop.find((p) => p.id === u.searchParams.get("id")); if (!h) return json({ error: "no creature" }, 404); const tool = u.searchParams.get("tool") ?? "state"; const c: any = h.c;
      if (tool === "state") return json({ id: h.id, t: c.t(), metrics: c.metrics(), regionRates: Object.fromEntries((c.parts() as any[]).filter((p) => p.kind === "region").map((p, i) => [p.id, c.readState("regionRates")[i]])), routing: { winner: c.routing().winner, ignitions: c.routing().ignitions }, ledger: c.ledger() });
      if (tool === "motorLens") { const k = make001(c.seed); k.step(300); return json(motorLensR(k, ["CTX", "regionRates", "rateAvg"], 600, 5, c.seed)); }
      if (tool === "pci") return json(pci((s: number) => make001(s), c.seed, "CTX", 3));
      if (tool === "qrng") { const k = make001(c.seed); k.step(100); const r = qrngDiag(k, 4000); return json({ bornVsObs: [r.bitOnesObserved, r.bitOnesBornExpected], raw: r.raw.pass, vnToeplitz: r.vnThenToeplitzR.pass, signMean: r.decisionNoiseSignMean }); }
      return json({ error: "tools: state, motorLens, pci, qrng" }, 400); }
    json({ error: "not found" }, 404);
  } catch (e: any) { json({ error: String(e?.message ?? e) }, 500); }
}).listen(PORT, () => console.log(`dome viewer on http://localhost:${PORT}  (N=${N}, seed=${SEED})`));
