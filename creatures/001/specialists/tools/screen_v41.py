#!/usr/bin/env python3
"""Phase 2 screen runner (ADVISORY: results here are dev screens, not governor decisions).
usage: screen_v41.py SPEC.json [--ref REF] [--jobs 7]
SPEC = list of {"item","arm","env":{...},"tests":[...],"blocks":[500,...],"nseeds":16} ; test "PROBE" = integration probe (blocks 600/616).
Writes specialists/<item>/v41/<arm>/<block>/dev_<TEST>.json (or probe_<block>.json); existing files are reused, so reruns are cheap.
Refuses the governor reservoir (704-999) and anything >= 1000."""
import json, os, subprocess, sys, argparse
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__)); SP = os.path.dirname(HERE)
ap = argparse.ArgumentParser(); ap.add_argument("spec"); ap.add_argument("--ref", default="HEAD"); ap.add_argument("--jobs", type=int, default=7); a = ap.parse_args()
B = lambda entry: subprocess.check_output([os.path.join(HERE, "build_bundle.sh"), a.ref, entry], text=True).strip()
run_b, probe_b = B("creatures/001/organism/run_v41.ts"), B("creatures/001/specialists/tools/probe_v41.ts")
meta = json.load(open(run_b + ".meta.json"))
work = []
for j in json.load(open(a.spec)):
    for blk in j["blocks"]:
        n = j.get("nseeds", 16)
        if blk + n - 1 >= 704: sys.exit(f"screen_v41: block {blk} touches the governor reservoir / official seeds")
        for t in j["tests"]:
            d = os.path.join(SP, j["item"], "v41", j["arm"], str(blk)); os.makedirs(d, exist_ok=True)
            dst = os.path.join(d, f"probe_{blk}.json" if t == "PROBE" else f"dev_{t}.json")
            if t == "PROBE" and not (600 <= blk and blk + n <= 632): sys.exit("probe blocks are 600-631")
            if t != "PROBE" and blk >= 600 and not (640 <= blk and blk + n <= 704): sys.exit(f"screen block {blk}: tests run on 500-595 or the AE1 pool 640-703")
            if not os.path.exists(dst): work.append((j, blk, n, t, d, dst))
def one(w):
    j, blk, n, t, d, dst = w
    e = {k: v for k, v in os.environ.items() if not k.startswith(("ORG_", "M4", "M5", "V3", "V4", "PROBE"))}; e.update(j["env"])
    if t == "PROBE":
        r = subprocess.run(["nice", "-n", "10", "node", probe_b, str(blk), str(n)], env=e, capture_output=True, text=True)
        if r.returncode: raise RuntimeError(f"{j['arm']} probe: {r.stderr[-600:]}")
        open(dst, "w").write(r.stdout); print(j["item"], j["arm"], "PROBE", blk, flush=True); return
    e.update({"MODE": "dev", "ARM": j["arm"], "SEEDBASE": str(blk), "NSEEDS": str(n), "OUT": d, "BUNDLE_SHA256": meta["sha256"]})
    r = subprocess.run(["nice", "-n", "10", "node", run_b, t], env=e, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(f"{j['arm']} {t} {blk}: {r.stderr[-600:]}")
    print(j["item"], blk, r.stdout.strip(), flush=True)
work.sort(key=lambda w: -{"AE1": 3, "C10": 3, "HOT3RM": 2}.get(w[3], 1))
errs = []
def safe(w):
    try: one(w)
    except Exception as x: errs.append(str(x)); print("ERROR", x, flush=True)
with ThreadPoolExecutor(a.jobs) as ex: list(ex.map(safe, work))
print(f"done: {len(work)} jobs, {len(errs)} errors; bundle {meta['sha256'][:12]} commit {meta['commit'][:7]}")
sys.exit(1 if errs else 0)
