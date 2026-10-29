// v0.2 smoke: new instruments (each with its control), full-state transplant, HIP->STR investigation, dome biosphere.
import { make001, transplant, motorLens, workspaceRouting, saeOnPart, geometry, pci, nistOnCreature, Dome, lesionStats } from "./src/index";
import { writeFileSync, mkdirSync } from "fs";
const which = process.argv[2] || "all", out: Record<string, unknown> = {}, ok: string[] = [], bad: string[] = [], T: Record<string, number> = {};
const check = (n: string, c: boolean) => (c ? ok : bad).push(n);
const run = (name: string, f: () => void) => { if (which !== "all" && which !== name) return; const t = Date.now(); f(); T[name] = Date.now() - t; };
run("motorLens", () => { const r = motorLens(make001(2010), ["CTX", "STR", "MOT", "HYP", "HIP"], 900, 5); out.motorLens = r; check("motorLens: best part beats shuffled by 0.1", Math.max(...r.rows.map((x) => x.balancedAcc - x.controlShuffled)) > 0.1); });
run("routing", () => { const r = workspaceRouting(make001(2011), 1500); out.routing = r; check("routing: some PLV above lag-shuffled null", r.pairs.some((p) => p.plv > p.nullPlv + 0.1)); check("routing: occupancy sums to 1", Math.abs(r.occupancy.reduce((a, b) => a + b, 0) - 1) < 1e-9); });
run("sae", () => { const r = saeOnPart(make001(2012), "CTX", 500, 16); out.sae = r; check("sae: real EV > shuffled EV", r.real.explainedVar > r.shuffledControl.explainedVar); });
run("geometry", () => { const r = geometry(make001, 2013, 2014, ["CTX", "HYP", "body"], 200, 6); out.geometry = r; check("geometry: across-seed CKA > shuffled for some part", r.rows.some((x) => x.ckaAcrossSeeds > x.ckaShuffledControl + 0.1)); });
run("pci", () => { const r = pci(make001, 2015, "THAL", 3, 300, 60); out.pci = r; check("pci: sham gives zero response", r.shamResponseFrac === 0); check("pci: pulse gives response, PCI below shuffled bound", r.responseFrac > 0 && r.pci > 0 && r.pci <= r.shuffledUpperBound + 1e-9); });
run("nist", () => { const r = nistOnCreature(make001(2016), 20000); out.nist = r; check("nist: PRNG control passes", r.controlPRNG.pass); check("nist: biased control fails", !r.controlBiased.pass); });
run("transplant", () => {
  const slow = transplant(make001, { recipientSeed: 2000, donorSeed: 2007, parts: ["CTX", "STR", "MOT", "nm:DA", "body", "value"], warm: 600, horizon: 30, metricKeys: ["DA", "motRate"] });
  const full = transplant(make001, { recipientSeed: 2000, donorSeed: 2000, donorPrep: (d) => { for (let i = 0; i < 5; i++) d.stimulate("VTA", 2); }, parts: ["CTX", "STR", "VTA", "MOT", "nm:DA", "*"], warm: 600, horizon: 30, metricKeys: ["DA", "motRate"], mode: "full" });
  let crossErr = ""; try { const a = make001(2000), b = make001(2007); a.writeState("CTX", b.readState("CTX", "full"), "full"); } catch (e) { crossErr = String((e as Error).message); }
  out.transplant = { slow, full, crossSeedFullRefused: crossErr }; check("transplant: self-control is a no-op (slow+full)", slow.selfControlMoved === 0 && full.selfControlMoved === 0);
  check("transplant full: some part carries > 0.2 of the gap", full.rows.some((r) => r.effect > 0.2)); check("transplant full refuses cross-seed wiring", crossErr.includes("mismatch")); });
run("hipstr", () => { const c = make001(2000); let err = ""; try { c.lesionCoupling("HIP->STR", 0); } catch (e) { err = (e as Error).message; }
  const ls = lesionStats(make001, [2000, 2001, 2002, 2003, 2004, 2005], ["CTX->STR", "STR->MOT"], 720, "rewards");
  const v = [2000, 2001, 2002, 2003, 2004, 2005].map((s) => { const a = make001(s), b = make001(s, { rpeLesion: true }); a.step(1440); b.step(1440); return [a.metrics().rewards, b.metrics().rewards]; });
  out.hipstr = { hasCoupling: c.hasCoupling("HIP->STR"), lesionError: err, couplingsIntoSTR: c.couplings().filter((k) => k.to === "STR"), lesionStatsRewards: ls.rows, valueLesion_rpeLesion_rewards_intact_vs_lesioned: v };
  check("HIP->STR: unknown coupling now raises instead of silently no-op", err.includes("no coupling")); });
run("dome", () => { const d = new Dome({ seed: 7 }); for (let i = 0; i < 5; i++) d.add(`001-${3000 + i}`, make001(3000 + i)); const s0 = d.snapshot();
  for (let t = 0; t < 2880; t++) d.step(); const s1 = d.snapshot(), L = d.ledger();
  const rows = s1.pop.map((h, i) => ({ id: h.id, moved: h.path, displacement: Math.hypot(h.x - s0.pop[i].x, h.y - s0.pop[i].y), eaten: h.ledger.intake - s0.pop[i].ledger.intake, ledgerError: h.ledger.error }));
  out.dome = { ticks: 2880, ledger: L, rows }; mkdirSync("out", { recursive: true }); writeFileSync("out/dome_snapshot.json", JSON.stringify(s1));
  check("dome: every creature moved", rows.every((r) => r.moved > 1)); check("dome: every creature ate from the world", rows.every((r) => r.eaten > 0));
  check("dome: creature ledgers balance (<1e-6)", rows.every((r) => r.ledgerError < 1e-6)); check("dome: world ledger balances (<1e-9)", L.worldLedgerError < 1e-9); });
out.ms = T; out.ok = ok; out.failed = bad; mkdirSync("out", { recursive: true }); writeFileSync(`out/smoke2_${which}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ms: T, ok, bad }));
process.exit(bad.length ? 1 : 0);
