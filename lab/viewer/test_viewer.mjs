// Viewer integration test: the God panel must drive the real sim. Uses the HTTP API exactly as the page does.
const B = "http://localhost:" + (process.env.PORT ?? 8787); const j = (p, b) => fetch(B + p, b ? { method: "POST", body: JSON.stringify(b) } : undefined).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const res = {};
async function pathRate(ms) { const a = await j("/state"); await sleep(ms); const b = await j("/state"); return { ticks: b.t - a.t, perTick: b.pop.reduce((s, p, i) => s + p.path - a.pop[i].path, 0) / Math.max(1, b.t - a.t) }; }
await j("/control", { speed: 50 }); await sleep(1500);
res.g1 = await pathRate(4000); res.setG = await j("/dials", { gravity: 5 }); res.g5 = await pathRate(4000);
res.bogus = await j("/dials", { notADial: 1 }); res.tox = await j("/dials", { gravity: 1, toxicity: 0.004 }); const i0 = (await j("/state")).pop.map((p) => p.integrity); await sleep(3000); const i1 = (await j("/state")).pop.map((p) => p.integrity);
res.integrityDrop = i0.map((x, k) => x - i1[k]); res.ledger = (await j("/state")).worldLedgerError;
res.inspectState = Object.keys(await j("/inspect?id=c0&tool=state")); const ml = await j("/inspect?id=c0&tool=motorLens"); res.motorLens = { oracle: ml.oracleBalancedAcc, rows: ml.rows?.map((r) => [r.part, +r.balancedAcc.toFixed(3)]) };
res.pause = await j("/control", { paused: true }); const p0 = (await j("/state")).t; await sleep(1000); res.pausedTicks = (await j("/state")).t - p0;
res.pass = { gravitySlows: res.g5.perTick < 0.8 * res.g1.perTick, bogusRejected: res.bogus.ok === false, toxicityHarms: res.integrityDrop.every((d) => d > 0), ledger: res.ledger < 1e-12, paused: res.pausedTicks === 0, inspector: res.inspectState.includes("regionRates") && !!ml.rows };
console.log(JSON.stringify(res, null, 0));
