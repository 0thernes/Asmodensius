#!/usr/bin/env bash
# Reproducible organism bundle (PLAN.md 0.3, fixes F03).
# usage: build_bundle.sh [REF=HEAD] [ENTRY=creatures/001/organism/run_v41.ts] [STORE_DIR]
# Exports REF with `git archive` into the fixed path /var/tmp/asm-build/<commit>, builds ENTRY with the pinned bun,
# and prints the bundle path. Writes <bundle>.meta.json (commit, entry, bun version, build path, sha256).
# With STORE_DIR, copies bundle + meta there (for official rounds: results/<round>/bundle/).
# The build path is fixed per commit because bun embeds the absolute source directory in the bundle.
set -euo pipefail
REF=${1:-HEAD}; ENTRY=${2:-creatures/001/organism/run_v41.ts}; STORE=${3:-}
PIN_BUN=1.4.4
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
SHA=$(git -C "$ROOT" rev-parse --verify "$REF^{commit}")
BV=$(bun --version)
[ "$BV" = "$PIN_BUN" ] || { echo "build_bundle: bun $BV != pinned $PIN_BUN (change PIN_BUN deliberately and record it)" >&2; exit 3; }
DIR=/var/tmp/asm-build/$SHA
if [ ! -d "$DIR/src" ]; then mkdir -p "$DIR/src.part"; git -C "$ROOT" archive "$SHA" | tar -x -C "$DIR/src.part"; mv "$DIR/src.part" "$DIR/src"; fi
NAME=$(basename "$ENTRY" .ts); OUTF=$DIR/$NAME.js
( cd "$DIR/src" && bun build "$ENTRY" --target=node --outfile "$OUTF" >/dev/null )
SUM=$(sha256sum "$OUTF" | cut -d' ' -f1)
printf '{"commit":"%s","entry":"%s","bun":"%s","buildPath":"%s","sha256":"%s"}\n' "$SHA" "$ENTRY" "$BV" "$DIR/src" "$SUM" > "$OUTF.meta.json"
if [ -n "$STORE" ]; then mkdir -p "$STORE"; cp "$OUTF" "$OUTF.meta.json" "$STORE/"; fi
echo "$OUTF"
