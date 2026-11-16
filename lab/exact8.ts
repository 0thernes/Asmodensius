// v0.8 exact-restore tests. (a) dome: run A for W ticks, snapshot -> JSON -> restore into B, step both H more ticks, compare
// every creature metric/position and the patch food bit-for-bit. (b) full-state transplant via snapshot/restore (same-seed
// and cross-seed donors): effect must be 1 (recipient becomes donor), self control 0. seeds from argv: dev 2000-2005 | test 1000-1015.
import { make001, Dome, transplant } from "./src/index"; import { writeFileSync } from "fs";
const SEEDS = process.argv[2] === "test" ? Array.from({ length: 16 }, (_, i) => 1000 + i) : [500, 501, 502, 503, 504, 505] /* v4.1: dev seeds moved out of 1000+ (SEEDS.md) */;
const domeRow = (seed: number) => { const mk = () => { const d = new Dome({ seed, radius: 4 }, { quantumKicks: 0.02, wind: 0.05, game: "pd", gameStrategy: "learned" }); for (let k = 0; k < 3; k++) d.add("c" + k, make001(seed + k)); return d; };
  const A = mk(); for (let t = 0; t < 400; t++) A.step(); const S = JSON.parse(JSON.stringify(A.snapshotFull())); const B = Dome.fromSnapshot(S, (_sp, s) => make001(s));
  for (let t = 0; t < 300; t++) { A.step(); B.step(); }
  const fa = JSON.stringify({ p: A.patches, pop: A.pop.map((h) => [h.x, h.y, h.heading, h.c.metrics()]), t: A.t, L: A.ledger() }), fb = JSON.stringify({ p: B.patches, pop: B.pop.map((h) => [h.x, h.y, h.heading, h.c.metrics()]), t: B.t, L: B.ledger() });
  return { seed, identical: fa === fb, ledger: B.ledger().worldLedgerError }; };
const trRow = (seed: number) => { const prep = (d: any) => { for (let i = 0; i < 5; i++) d.stimulate("VTA", 2); };
  const same = transplant(make001, { recipientSeed: seed, donorSeed: seed, donorPrep: prep, parts: ["@snapshot", "*"], warm: 600, horizon: 30, metricKeys: ["DA", "motRate"], mode: "full" });
  const cross = transplant(make001, { recipientSeed: seed, donorSeed: seed + 7, parts: ["@snapshot"], warm: 600, horizon: 30, metricKeys: ["DA", "motRate"], mode: "full" });
  return { seed, sameSnapshotEffect: same.rows[0].effect, samePartsStarEffect: same.rows[1].effect, crossSnapshotEffect: cross.rows[0].effect, selfMoved: same.selfControlMoved }; };
const dome = SEEDS.map(domeRow), tr = SEEDS.map(trRow);
const checks = { domeRestoreBitExact: dome.every((r) => r.identical), transplantSameSeedEffect1: tr.every((r) => Math.abs(r.sameSnapshotEffect - 1) < 1e-9), transplantCrossSeedEffect1: tr.every((r) => Math.abs(r.crossSnapshotEffect - 1) < 1e-9), selfControlZero: tr.every((r) => r.selfMoved === 0) };
writeFileSync(`out/exact8_${process.argv[2] ?? "dev"}.json`, JSON.stringify({ checks, dome, tr })); console.log(JSON.stringify({ checks, partsStar: tr.map((r) => +r.samePartsStarEffect.toFixed(3)) }));
