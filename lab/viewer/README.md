# Live dome viewer
Build: `npx esbuild viewer/server.ts --bundle --platform=node --outfile=out/server.js`
Run: `PORT=8787 N=5 SEED=3000 node out/server.js`, then open http://localhost:8787.

The headless Dome sim runs in Node. The page renders SSE snapshots with three.js (vendored in viewer/vendor). Every God-panel control POSTs to the running sim:
- `/dials`: any WorldDials key; unknown keys are rejected.
- `/preset`: utopia, baseline, harsh or hell, or a ladder rung 0-6.
- `/control`: speed, pause or reset.
- `/god`: stimulate, NE shift, harm, feed or lesion one creature.

Inspector (`/inspect?id=c0&tool=state|motorLens|pci|qrng`): runs the lab instruments on a live creature 001 (state) or on a fresh clone of it (experiments).

Test: `node viewer/test_viewer.mjs` (6 checks). Render check: `node --experimental-websocket viewer/shot.mjs`.

## Creature 001 inspector (creatures/001/src/inspector.tsx)
Not edited: that file sits in the Round 16 worker's tree, whose page.tsx has uncommitted changes. To wire it in, the inspector only needs to fetch `/inspect?id=…&tool=…` from this server. Suggested patch for the Round 16 owner: add a "Lab" tab that calls these four endpoints and renders the JSON.
