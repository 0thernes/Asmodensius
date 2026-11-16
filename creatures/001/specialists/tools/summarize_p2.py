#!/usr/bin/env python3
"""Summarise Phase 2 screens (ADVISORY). usage: summarize_p2.py ITEM [--pairs arm:offarm,...] -> markdown on stdout.
Test cells: weakest control d / Welch t (grade A = d>=0.8 and t>=2.75 vs every control) and the full-arm mean.
Probe cells: integration (a) = subsystems moved (paired |t| >= 2.75) between arm and its ablation, seeds 600-615."""
import json, os, sys, math, statistics as S, glob
HERE = os.path.dirname(os.path.abspath(__file__)); SP = os.path.dirname(HERE)
sys.path.insert(0, HERE); from governor import grade
item = sys.argv[1]; pairs = dict(p.split(":") for p in (sys.argv[3].split(",") if len(sys.argv) > 3 and sys.argv[2] == "--pairs" else []))
base = os.path.join(SP, item, "v41"); arms = sorted(os.listdir(base), key=lambda a: (a != "comboA", a))
cells = {}; tests = set(); blocks = set()
for a in arms:
    for f in glob.glob(os.path.join(base, a, "*", "dev_*.json")):
        j = json.load(open(f)); t = j["key"]; b = j["seeds"][0]; tests.add(t); blocks.add(b)
        g = grade(j["arms"]); full = S.mean(list(j["arms"].values())[0]); cells[(a, t, b)] = (g, full)
cols = [(t, b) for t in sorted(tests) for b in sorted(blocks) if any((a, t, b) in cells for a in arms)]
print(f"| arm | " + " | ".join(f"{t} {b}" for t, b in cols) + " |"); print("|---" * (len(cols) + 1) + "|")
for a in arms:
    row = []
    for c in cols:
        x = cells.get((a,) + c)
        row.append("-" if not x else f"{'**A**' if x[0]['grade'] == 'A' else 'fail'} {x[0]['d']}/{x[0]['t']} (m {x[1]:.3f})")
    if any(r != "-" for r in row): print(f"| {a} | " + " | ".join(row) + " |")
SKIP = {"awSated", "awHungry", "conf", "confLow"}
def integ(on, off):
    A, B = json.load(open(on)), json.load(open(off)); mv = []
    for k in A:
        if k in SKIP or k not in B: continue
        d = [x - y for x, y in zip(A[k], B[k])]; m = S.mean(d); sd = S.stdev(d)
        t = m / (sd / math.sqrt(len(d))) if sd > 0 else (0 if m == 0 else math.inf)
        if abs(t) >= 2.75: mv.append(f"{k}({t:+.1f})")
    b = ""
    if "awSated" in A and A["awSated"]:
        s, h = [x for x in A["awSated"] if not math.isnan(x)], [x for x in A["awHungry"] if not math.isnan(x)]
        if s and h: b = f"; (b) belief weight sated {S.mean(s):.2f} vs hungry {S.mean(h):.2f}"
    return f"(a) {'PASS' if len(mv) >= 2 else 'FAIL'}: {len(mv)} moved {', '.join(mv) or '-'}; foraged {S.mean(A['foraged']):.1f} vs {S.mean(B['foraged']):.1f}{b}"
pr = [a for a in arms if os.path.exists(os.path.join(base, a, "600", "probe_600.json"))]
if pr: print("\nIntegration probe, seeds 600-615 (arm vs its ablation):\n")
for a in pr:
    off = pairs.get(a, pairs.get("*", "comboA").replace("{}", a))
    if off == a or not os.path.exists(os.path.join(base, off, "600", "probe_600.json")): continue
    print(f"- {a} vs {off}: " + integ(os.path.join(base, a, "600", "probe_600.json"), os.path.join(base, off, "600", "probe_600.json")))
