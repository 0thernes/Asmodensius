#!/usr/bin/env bash
# ID-gate (PLAN.md §0): run before and after every code change. Exit 0 = IDENTICAL on all checks.
# usage: identity_gate.sh [REF]   (default: the current working tree, via `git stash create`, else HEAD)
#        identity_gate.sh --make-golden   (writes the smoke golden from the frozen pin bc6ad6a; run once)
# Checks: (1) Combo A, 8 retained tests, seeds 540-543 == results/sc-port/raw/comboA_540 (first 4 seeds), exact;
#         (2) v5.7b base (ORG_V5=11), HOT3RM + RPT2R, seeds 540-543 == results/identity/base_*.json, made by run_v39 at bc6ad6a
#             (raw/base_540 itself does NOT reproduce at bc6ad6a: finding F60);
#         (3) ORG_MW=13 identity: ORG_V5=13 ORG_MW=13 == ORG_V5=12 on RPT2R 540-541 (v6 scale code is a no-op at MW=13);
#         (4) smoke.ts 4-day trajectory (seed 540, Combo A) == results/identity/smoke_540_comboA.golden (timing token stripped).
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(git -C "$HERE" rev-parse --show-toplevel); C1=$ROOT/creatures/001
GOLD=$C1/results/identity/smoke_540_comboA.golden; RAW=$C1/results/sc-port/raw
COMBO_A=(ORG_V6=1 'M50J={"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}' 'V40TUNE={}' ORG_MIND=v40)
smoke() { env "${COMBO_A[@]}" node "$1" 540 | sed -E 's/^ms [0-9]+ /ms _ /'; }
if [ "${1:-}" = "--make-golden" ]; then B=$("$HERE/build_bundle.sh" bc6ad6a creatures/001/organism/smoke.ts); mkdir -p "$(dirname "$GOLD")"; smoke "$B" > "$GOLD"; echo "golden written: $GOLD"
  R39=$("$HERE/build_bundle.sh" bc6ad6a creatures/001/organism/run_v39.ts); G=$(mktemp -d)
  for T in HOT3RM RPT2R; do env ORG_V5=11 'M50J={}' 'V40TUNE={}' ORG_MIND=v40 SEEDBASE=540 NSEEDS=4 V39OUT=$G node "$R39" tune $T >/dev/null && python3 -c "import json,sys; j=json.load(open('$G/tune_$T.json')); json.dump({'key':j['key'],'seeds':j['seeds'],'arms':j['arms'],'source':'run_v39 @ bc6ad6a, ORG_V5=11 M50J={} V40TUNE={} ORG_MIND=v40'},open('$C1/results/identity/base_${T}_540-543.json','w'))"; done; rm -rf "$G"; echo "base goldens written"; exit 0; fi
REF=${1:-$(git -C "$ROOT" stash create 2>/dev/null)}; REF=${REF:-HEAD}
RUN=$("$HERE/build_bundle.sh" "$REF") || exit 3; SMK=$("$HERE/build_bundle.sh" "$REF" creatures/001/organism/smoke.ts) || exit 3
W=$(mktemp -d /tmp/idgate.XXXX); fail=0
TESTS="HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2"
for T in $TESTS; do echo "env ${COMBO_A[*]@Q} MODE=dev ARM=idA SEEDBASE=540 NSEEDS=4 OUT=$W/A node $RUN $T"; done > "$W/jobs"
for T in HOT3RM RPT2R; do echo "env ORG_V5=11 M50J='{}' V40TUNE='{}' ORG_MIND=v40 MODE=dev ARM=idB SEEDBASE=540 NSEEDS=4 OUT=$W/B node $RUN $T"; done >> "$W/jobs"
echo "env ORG_V5=12 M50J='{}' V40TUNE='{}' ORG_MIND=v40 MODE=dev ARM=mw12 SEEDBASE=540 NSEEDS=2 OUT=$W/MW11 node $RUN RPT2R" >> "$W/jobs"
echo "env ORG_V5=13 ORG_MW=13 M50J='{}' V40TUNE='{}' ORG_MIND=v40 MODE=dev ARM=mw13 SEEDBASE=540 NSEEDS=2 OUT=$W/MW13 node $RUN RPT2R" >> "$W/jobs"
export IDG_W=$W; xargs -d '\n' -P "${IDGATE_JOBS:-6}" -n1 bash -c 'eval "$1" >/dev/null 2>>"$IDG_W/err"' _ < "$W/jobs"
python3 - "$W" "$RAW" <<'PY' || fail=1
import json,sys,os
W,RAW=sys.argv[1:3]; bad=0
def cmp(new,ref,n,label):
    global bad
    a=json.load(open(new))['arms']; b=json.load(open(ref))['arms']
    ok=list(a)==list(b) and all(a[k]==b[k][:n] for k in a)
    print(('IDENTICAL ' if ok else 'DIFFERENT ')+label); bad+= not ok
for T in "HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2".split(): cmp(f'{W}/A/dev_{T}.json',f'{RAW}/comboA_540/tune_{T}.json',4,f'ComboA {T} 540-543')
for T in ["HOT3RM","RPT2R"]: cmp(f'{W}/B/dev_{T}.json',f'{RAW}/../../identity/base_{T}_540-543.json',4,f'v5.7b {T} 540-543 (bc6ad6a golden)')
a=json.load(open(f'{W}/MW13/dev_RPT2R.json'))['arms']; b=json.load(open(f'{W}/MW11/dev_RPT2R.json'))['arms']
ok=a==b; print(('IDENTICAL ' if ok else 'DIFFERENT ')+'ORG_MW=13 (ORG_V5=13) vs ORG_V5=12, RPT2R 540-541'); bad+=not ok
led=max(json.load(open(f'{W}/A/dev_{T}.json'))['energy']['ledgerMaxDaily'] for T in "HOT3RM RPT2R AE1 AE2 RPT1 RPT2RL5 UAL GWT2".split())
print(f'energy ledger max error (daily check, Combo A runs): {led:.2e}')
sys.exit(1 if bad else 0)
PY
if [ -s "$GOLD" ]; then if diff -q <(smoke "$SMK") "$GOLD" >/dev/null; then echo "IDENTICAL smoke 4-day seed 540 Combo A"; else echo "DIFFERENT smoke 4-day seed 540 Combo A"; fail=1; fi; else echo "MISSING smoke golden (run --make-golden)"; fail=1; fi
[ -s "$W/err" ] && { echo "stderr:"; cat "$W/err"; }
rm -rf "$W"; echo "ref=$REF bundle=$(cut -d'"' -f20 "$RUN.meta.json")"
[ $fail = 0 ] && echo "ID-GATE: PASS" || echo "ID-GATE: FAIL"; exit $fail
