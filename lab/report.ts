// v0.6 auto report: collects every result JSON in out/ (dial batteries, lens, instruments) into one markdown report with PASS/FAIL tables.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
const files = readdirSync("out").filter((f) => /^(dials\d?_test_|instr\d_test|smoke|lens|qrng).*\.json$/.test(f)).sort(); const f3 = (x: any) => (typeof x === "number" ? (Math.abs(x) < 1e-3 && x !== 0 ? x.toExponential(2) : x.toFixed(3)) : String(x));
let md = `# Asmodensius lab auto report\n\nGenerated ${new Date().toISOString()} from ${files.length} result files in lab/out/ (test seeds only). Failures are listed as failures.\n\n`;
const groups: Record<string, any[]> = {}; for (const f of files) { try { const j = JSON.parse(readFileSync("out/" + f, "utf8")); (groups[f.replace(/_test.*$/, "")] ??= []).push([f, j]); } catch {} }
let pass = 0, fail = 0;
for (const [g, rows] of Object.entries(groups)) { md += `## ${g}\n\n| file | dial | control | treated | p | d | result |\n|---|---|---|---|---|---|---|\n`;
  for (const [f, j] of rows) { if (j.checks) { for (const [k, v] of Object.entries(j.checks)) { md += `| ${f} | ${k} | | | | | ${v ? "PASS" : "FAIL"} |\n`; v ? pass++ : fail++; } continue; }
    const res = j.pass === undefined ? "n/a" : j.pass ? "PASS" : "FAIL"; if (j.pass === true) pass++; else if (j.pass === false) fail++;
    md += `| ${f} | ${j.dial ?? j.id ?? ""} | ${f3(j.control ?? "")} | ${f3(j.treated ?? j.meanRho ?? j.best ?? "")} | ${f3(j.p ?? "")} | ${f3(j.d ?? "")} | ${res} |\n`; }
  md += "\n"; }
md = md.replace("\n\n## ", `\n\n**Totals: ${pass} PASS, ${fail} FAIL.**\n\n## `);
mkdirSync("reports", { recursive: true }); const name = `reports/REPORT-${new Date().toISOString().slice(0, 10)}.md`; writeFileSync(name, md); writeFileSync("reports/LATEST.md", md); console.log(name, pass, fail);
