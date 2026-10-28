import { runAll, runV2, v21Tests, setGpuRecord } from "./harness";
const fs = require("fs"); if (fs.existsSync("gpu_record.json")) setGpuRecord(JSON.parse(fs.readFileSync("gpu_record.json", "utf8")));
const pr = (res: any[]) => { for (const it of res) { console.log(`${it.pass ? "PASS" : (it.category === "Implementation identified" ? "IMPL" : "FAIL")} ${it.id.padEnd(16)} ${it.name.slice(0, 50)}`); for (const c of it.cmps) console.log(`     ${c.pass ? "+" : "-"} ${c.control.slice(0, 60).padEnd(60)} full=${c.full.toFixed(3)} ctrl=${c.ctrl.toFixed(3)} d=${c.d.toFixed(2)} t=${c.t.toFixed(2)}`); } };
const t0 = Date.now(); const v1 = runAll(); console.log("=== PREREGISTRATION v1 ==="); pr(v1); const v2 = runV2(); console.log("=== PREREGISTRATION v2 ==="); pr(v2); const v21 = v21Tests(); console.log("=== PREREGISTRATION v2.1 ==="); pr(v21);
console.log("ms", Date.now() - t0); require("fs").writeFileSync("results.json", JSON.stringify({ v1, v2, v21 }, null, 1));
