#!/usr/bin/env node
// Compiles lab/viewer/server.ts via local esbuild (~20 ms) and launches the live Dome HTTP/SSE + 3D WebGL server.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "lab", "out", "_pipeline_tmp");
const outFile = path.join(outDir, "viewer_server.cjs");
const esbuild = path.join(root, "node_modules", "esbuild", "bin", "esbuild");

mkdirSync(outDir, { recursive: true });
execFileSync(
  process.execPath,
  [
    esbuild,
    path.join(root, "lab", "viewer", "server.ts"),
    "--bundle",
    "--platform=node",
    "--format=cjs",
    `--outfile=${outFile}`,
    "--log-level=warning",
  ],
  { cwd: root, stdio: "inherit" },
);

const child = spawn(process.execPath, [outFile], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    child.kill(sig);
  });
}

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
