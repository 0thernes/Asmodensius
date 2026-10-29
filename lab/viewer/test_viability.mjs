// v0.9 live viability monitor: point at a running viewer (PORT). Checks: every creature is alive, or dead and frozen with a respawn pending;
// no living creature has negative ATP; world ledger exact; /inspect CORS (OPTIONS 204 + ACAO *); qrng signMean is the debiased v3.6+ sign (|mean| < 0.1)
const PORT = process.env.PORT ?? 8787, B = `http://localhost:${PORT}`; const s = await (await fetch(B + "/state")).json();
const v = await Promise.all(s.pop.map(async (p) => (await fetch(`${B}/inspect?id=${p.id}&tool=viability`)).json()));
const opt = await fetch(`${B}/inspect?id=${s.pop[0].id}&tool=state`, { method: "OPTIONS" }); const get = await fetch(`${B}/inspect?id=${s.pop[0].id}&tool=state`);
const q = await (await fetch(`${B}/inspect?id=${s.pop[0].id}&tool=qrng`)).json();
const checks = { livingAtpNonNegative: v.every((x) => !x.alive || x.atp >= 0), deadArePendingRespawn: v.every((x) => x.alive || x.respawnAfter > 0), atLeastOneAlive: v.some((x) => x.alive), ledgerExact: s.worldLedgerError < 1e-9,
  corsPreflight: opt.status === 204 && opt.headers.get("access-control-allow-origin") === "*", corsGet: get.headers.get("access-control-allow-origin") === "*", qrngDebiased: Math.abs(q.signMean) < 0.1 };
console.log(JSON.stringify({ t: s.t, alive: v.map((x) => `${x.id}:${x.alive ? "alive" : "dead"} atp ${(+x.atp).toFixed(2)} fat ${(+x.fat).toFixed(0)} age ${x.ageDays.toFixed(1)}d`), deaths: s.deaths, births: s.births, signMean: q.signMean, rawBit0SignMean: q.rawBit0SignMean, checks, pass: Object.values(checks).every(Boolean) }));
