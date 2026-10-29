// v0.6 persistence test: run, SIGTERM (saves), restart from the state file, check the world continues where it stopped.
import { spawn } from "child_process"; import { rmSync } from "fs";
const STATE = "/tmp/dome_persist_test.json", PORT = 8799; rmSync(STATE, { force: true });
const start = () => spawn("node", ["out/server.js"], { env: { ...process.env, PORT: "" + PORT, STATE, SAVE_MS: "2000" }, stdio: "ignore" });
const get = async (p) => (await fetch(`http://localhost:${PORT}${p}`)).json(); const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (p, b) => fetch(`http://localhost:${PORT}${p}`, { method: "POST", body: JSON.stringify(b) });
let s = start(); await wait(1500); await post("/dials", { gravity: 0.5, grazers: 10 }); await post("/control", { speed: 50 }); await wait(3000);
const a = await get("/state"); s.kill("SIGTERM"); await wait(800);
s = start(); await wait(1200); const b = await get("/state"); await wait(1500); const c = await get("/state"); s.kill("SIGTERM"); await wait(500);
const near = (x, y) => Math.abs(x - y) < 1e-9; const pa = a.pop[0], pb = b.pop[0];
const checks = { restored: b.restoredAt !== null, timeContinues: b.t >= a.t && b.t <= a.t + 50 * 30, dialsKept: b.dials.gravity === 0.5 && b.dials.grazers === 10, runsAfterRestore: c.t > b.t, ledgerAfterRestore: c.worldLedgerError < 1e-9, sameCreatures: b.pop.length === a.pop.length && b.pop.every((h, i) => h.id === a.pop[i].id), integrityKept: Math.abs(pb.integrity - pa.integrity) < 0.05 };
console.log(JSON.stringify({ tBefore: a.t, tAfterRestore: b.t, restoredAt: b.restoredAt, tLater: c.t, ledger: c.worldLedgerError, checks, pass: Object.values(checks).every(Boolean) }));
