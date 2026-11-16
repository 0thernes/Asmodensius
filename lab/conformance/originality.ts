// Originality check (conformance, required). Policy (Alex, 2026-10-31): 100% original code, designs and distinctive mechanics. No reuse of other
// A-Life projects even under MIT/Apache; only published science concepts, cited in ORIGINS.md. Allowed third-party: Alex's/Tsotchke's own
// Eshkol, Moonlab, quantum_rng; standard libraries (language runtimes, React, three.js) are ALLOWED (Alex, 2026-10-31). Neuralese is Alex's own project. SUPER CREATURE / CQM (cq5) is Alex's own work, free to reuse (Alex, 2026-10-31; ORIGINS.md). archive/ is quarantined history and imports/ is review material, both excluded.
// Scans tracked source and data files; prose (*.md), benchmark project lists, results and docs are references, not code, so they are skipped.
import { execSync } from "child_process"; import { readFileSync } from "fs";
export type Finding = { file: string; line: number; kind: "FAIL" | "ALLOWED"; why: string; text: string };
const OWN = /tsotchke|eshkol|moonlab|quantum_rng|neuralese|alex donahue|asmodensius|super[ -]?creature|\bcq5\b|wild-arch/i; // v4.1: SUPER CREATURE / CQM is Alex's own work (F64); wild-arch is this repo's own branch
const PROJECTS = /\b(openworm|c302|sibernetic|owmeta|lenia|avida|tierra|polyworld|framsticks|norns?\b|creatures engine|neat-python|neuroevolution of augmenting|biota|darwinbots|evolve 4\.0|bibites|brian2|nest simulator|neuron simulator)\b/i;
const WORM = /\b(AVA[LR]|AVB[LR]|AVD[LR]|PVC[LR]|loadConn|hermaphrodite connectome)\b/; const CRAWL = /\b(crawl\s*\(|contact-physics crawler|mass-spring chain|undulat\w*|serpentine gait)/i; // worm-style crawler bodies (CAP-B) // C. elegans identified-neuron wiring = literal OpenWorm-derived circuit
const PORT = /\b(ported from|adapted from|copied from|translated from|based on the code|vendored)\b/i;
const LICENSE = /(copyright \(c\)|@license|spdx-license-identifier|licensed under the)/i;
const STD = /(react|three\.js|three\.module|orbitcontrols|mrdoob|facebook)/i;
const SKIP = /(^archive\/|^imports\/|\.md$|^benchmark\/|^docs\/|\/results\/|^roadmap\/|^CHANGELOG|^CITATION|^LICENSE$|\.wasm$|\.png$|\.jpg$|^lab\/conformance\/originality\.ts$|DELARP)/;
export function originality(root = "."): { pass: boolean; fails: number; allowed: number; findings: Finding[] } {
  const files = execSync("git ls-files", { cwd: root, encoding: "utf8" }).split("\n").filter((f) => f && !SKIP.test(f)); const F: Finding[] = [];
  for (const f of files) { if (/\/vendor\//.test(f)) { F.push({ file: f, line: 0, kind: STD.test(f) ? "ALLOWED" : "FAIL", why: "vendored third-party file", text: "" }); continue; }
    if (/celegans|connectome.*\.(csv|json)$/i.test(f)) { F.push({ file: f, line: 0, kind: "FAIL", why: "third-party dataset from another A-Life project (OpenWorm/c302 connectome)", text: "" }); continue; }
    let src: string; try { src = readFileSync(`${root}/${f}`, "utf8"); } catch { continue; } if (src.includes("\u0000")) continue;
    src.split("\n").forEach((l, i) => { const t = l.length > 240 ? l.slice(0, 240) : l; const hit = (kind: Finding["kind"], why: string) => F.push({ file: f, line: i + 1, kind, why, text: t.trim().slice(0, 160) });
      if (PROJECTS.test(l)) hit("FAIL", "names another A-Life/neuro-sim project in code (port or distinctive mechanic?)");
      else if (WORM.test(l)) hit("FAIL", "literal C. elegans connectome circuit (copied anatomy, not a concept)");
      else if (CRAWL.test(l)) hit("FAIL", "worm-style crawler body (copied body plan, CAP-B)");
      else if (PORT.test(l) && !OWN.test(l)) hit("FAIL", "code says it was ported/adapted from elsewhere");
      else if (LICENSE.test(l) && !OWN.test(l)) hit(STD.test(l) || STD.test(f) ? "ALLOWED" : "FAIL", "third-party licence header (bundled library?)"); }); }
  const dedup = new Map<string, Finding>(); for (const x of F) { const k = `${x.file}|${x.why}`; if (!dedup.has(k)) dedup.set(k, x); } const out = [...dedup.values()];
  return { pass: !out.some((x) => x.kind === "FAIL"), fails: out.filter((x) => x.kind === "FAIL").length, allowed: out.filter((x) => x.kind === "ALLOWED").length, findings: out }; }
if (typeof require !== "undefined" && require.main === module) { const r = originality(process.argv[2] ?? "."); console.log(`originality: ${r.pass ? "PASS" : "FAIL"} (${r.fails} fail, ${r.allowed} allowed)`); for (const x of r.findings) console.log(`  ${x.kind} ${x.file}:${x.line} ${x.why}${x.text ? " :: " + x.text : ""}`); }
