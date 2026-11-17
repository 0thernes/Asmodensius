#!/usr/bin/env bash
# Rebuild the replay library in docs/viewer/runs/. Creature code = organism.ts at HEAD, which must be byte-identical to frozen
# Combo A pin bc6ad6a. Dev seeds 500-599 only (SEEDS.md screening range; never reservoir 704-999 or 1000+).
set -euo pipefail
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); cd "$ROOT"
PIN=bc6ad6a
A=$(git show $PIN:creatures/001/organism/organism.ts | sha256sum | cut -d' ' -f1); B=$(sha256sum creatures/001/organism/organism.ts | cut -d' ' -f1)
[ "$A" = "$B" ] || { echo "organism.ts differs from Combo A pin $PIN; refusing to record" >&2; exit 3; }
OUTD=$ROOT/docs/viewer/runs; BUILD=${BUILD:-/var/tmp/asm-viewer-build}; mkdir -p "$OUTD" "$BUILD"
bun build viewer/tools/record.ts --target=node --outfile "$BUILD/record.js" >/dev/null
export ORG_V6=1 M50J='{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}' CODE_COMMIT=$PIN ORGANISM_SHA=$B DAYS=${DAYS:-3} EVERY=${EVERY:-10}
JOBS=()
for s in 500 510 520 530 540 550 560 570 580 590; do JOBS+=("$s baseline"); done
for v in lush sparse harsh hazard grazers hell; do JOBS+=("540 $v"); done
printf '%s\n' "${JOBS[@]}" | xargs -P "${PAR:-3}" -L1 bash -c 'SEED=$0 VARIANT=$1 nice -n 19 node '"$BUILD"'/record.js '"$OUTD"'/run-$0-$1.json'
python3 - "$OUTD" <<'PY'
import json,sys,os,glob
d=sys.argv[1]; idx=[]
for f in sorted(glob.glob(d+"/run-*.json")):
    j=json.load(open(f)); idx.append({"file":os.path.basename(f),"seed":j["seed"],"variant":j["variant"],"creatureSeeds":j["creatureSeeds"],"ticks":j["ticks"],"frames":len(j["frames"]),"deaths":j["end"]["deaths"],"bytes":os.path.getsize(f)})
json.dump({"format":"asmodensius-replay-index/1","codeCommit":"bc6ad6a","runs":idx},open(d+"/index.json","w"),indent=1)
print(len(idx),"runs indexed")
PY
