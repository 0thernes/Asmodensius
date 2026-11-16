# MSI viewer work-in-progress (imported, not wired in)

**What this is.** Alex's MSI copy of the repo (`Z:\[Vibe Coded (AI)]\CLAUDECODE\Asmodensius-v40`, a separate history at
HEAD `e109ef07de069b8046412e32d293925835fbbe69`, Thu 12 Nov 2026 09:11 PT) had uncommitted viewer work. Alex's ruling
(16 Nov 2026): keep it, and the box copy is the one source of truth. It was copied here **read-only** on Mon 16 Nov 2026,
about 12:20 PM PT. The MSI repo was not modified.

**Contents.**
- `files/`: the 8 files exactly as they were on the MSI working tree (SHA-256 checked against the MSI before copying):
  - modified there: `lab/src/adapters/c001.ts`, `lab/src/interface.ts`, `lab/template/creature.ts`, `lab/viewer/server.ts`, `package.json`
  - untracked there: `lab/viewer/render/noise.mjs`, `lab/viewer/render/quality.mjs`, `scripts/start-viewer.mjs`
- `msi-uncommitted.patch`: `git diff` of the 5 modified files against MSI HEAD e109ef0 (245 lines).

**What it does.** Adds a `visualState()` / `couplingWeights()` read-out to the 001 adapter and the template creature,
a `weights` tool and a `/render/*` static route to the viewer server, two render helpers (noise, quality), and a
`start-viewer.mjs` launcher used by the MSI `package.json` start/dev scripts.

**Why it is not applied.** The patch is against the MSI tree, not the box tree: `git apply --check` on the box fails
(`lab/viewer/server.ts` context differs; the box has no root `package.json`). The MSI `c001.ts` also imports
`creatures/001/organism/embodied_ontogeny`, which exists only in the MSI's Antigravity line (not on the box). Porting it
onto the box viewer is a separate, reviewed step; it must not pull in any of the MSI organism changes (the dormant
test-detection code, audit F22/F29).

SHA-256 (files/):
```
24055588587622ee664730f8d3bbc29ebffd35c5cb62053ed0e4d0971bad9f23  ./lab/src/adapters/c001.ts
0691486a17c1204975bf1e1190fdd413af162b89655b3d216992c599322609e4  ./lab/src/interface.ts
aaaba9917355d254a22d0e7a76fe0e16ea9cc0855c748aba2e594a9e09ca575a  ./lab/template/creature.ts
ece2f5eacdae5f96aa71807e9b25a24a9247d3c347591c98a5eda8448a0bcfd5  ./lab/viewer/render/noise.mjs
15e603fbbce5e23a42a56685f864b529c83479a655ed0efd5e03bd66bdbf3d4a  ./lab/viewer/render/quality.mjs
4058a0c4e5ed69946500ef3f0edfd549f5a1f9502a3b144e2fe2f053b790b873  ./lab/viewer/server.ts
6eefd00f9a1b1ede2bfa2fc5b0c9d87367e49b6354aaee7c51709f63ce201783  ./package.json
fe8c6ab33aaa5f876ed189001f76106e0c0e0b8e8fb6538ce74ff054900909f2  ./scripts/start-viewer.mjs
```
