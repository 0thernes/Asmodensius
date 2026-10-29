// Scaffold a new creature from the template: node out/scaffold.js 002 [outDir]. Default outDir is lab/out/scaffold/<id>
// (creatures/NNN is owned by each creature's worker; copy the scaffold there yourself). Writes creature.ts + a conformance runner.
import { readFileSync, writeFileSync, mkdirSync } from "fs"; import { join } from "path";
const id = process.argv[2]; if (!/^\d{3}$/.test(id ?? "") || +id < 2 || +id > 100) { console.error("usage: scaffold <002..100> [outDir]"); process.exit(1); }
const dir = process.argv[3] ?? join("out", "scaffold", id); mkdirSync(dir, { recursive: true });
const src = readFileSync(join(__dirname, "..", "template", "creature.ts"), "utf8").replace(/TemplateCreature/g, `Creature${id}`).replace(/makeTemplate/g, `make${id}`).replace('id = "template"', `id = "${id}"`).replace(/from "\.\.\/src\//g, 'from "LAB/src/');
writeFileSync(join(dir, "creature.ts"), `// Creature ${id}, scaffolded from lab/template/creature.ts. Replace LAB with the relative path to Asmodensius/lab.\n` + src);
writeFileSync(join(dir, "conformance.ts"), `import { conformance } from "LAB/conformance/suite"; import { make${id} } from "./creature";\nconst r = conformance(make${id}, "${id}"); console.log(r.creature, r.pass ? "CONFORMS" : "DOES NOT CONFORM", r.requiredPassed); for (const c of r.checks) if (!c.pass) console.log(" FAIL", c.id, c.detail); process.exit(r.pass ? 0 : 1);\n`);
console.log("scaffolded", dir);
