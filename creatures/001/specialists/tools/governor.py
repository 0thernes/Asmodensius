#!/usr/bin/env python3
"""BSS governor v0 (PLAN.md 1.1, upgrade U6). Host-side only: it builds a bundle, runs parent and child configurations on a
fresh 16-seed dev block, and decides. It never edits organism code, flags in the repo, or substrate data.

Gate (all must hold for ACCEPT):
  1. Non-inferiority on every retained test: paired delta-d of the child's full arm vs the parent's full arm,
     lower 95% bootstrap CI > -0.3 (delta-d = mean paired difference / pooled SD of the two full arms).
  2. Gain on the target test (if one is named): lower 95% CI of delta-d > 0.
Also reported, not gating in v0: grade status (A = d>=0.8, t>=2.75 vs every control) for both arms, and cost:
metabolic heat kJ per organism-day and CPU-seconds per organism-day, with delta-d per unit of each.

Seeds: blocks of 16 from the reservoir 704-999 (704, 720, ..., 976). A block is used once; every allocation is
appended to results/governor/ledger.jsonl BEFORE any run starts, and mirrored into SEEDS.md.

usage:
  governor.py run --name N --parent PRESET|JSON --child PRESET|JSON [--target TEST] [--tests T1,T2,..] [--jobs 6] [--ref REF]
  governor.py selftest [--jobs 6] [--ref REF]     # Phase 1 audit on the reserved blocks 704 and 720
  governor.py blocks                              # show the ledger
"""
import argparse, datetime, hashlib, json, math, os, random, shlex, statistics as S, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = subprocess.check_output(["git", "-C", HERE, "rev-parse", "--show-toplevel"], text=True).strip()
C1 = os.path.join(ROOT, "creatures/001")
GOV = os.path.join(C1, "results/governor"); LEDGER = os.path.join(GOV, "ledger.jsonl"); SEEDS_MD = os.path.join(ROOT, "SEEDS.md")
RESERVOIR = list(range(704, 977, 16)); SELFTEST_BLOCKS = [704, 720]
RETAINED = ["HOT3RM", "RPT2R", "AE1", "AE2", "RPT1", "RPT2RL5", "UAL", "GWT2"]
NI_MARGIN = -0.3; BOOT = 10000
# Binding decision rule (Alex, 2026-11-17): 96 fresh seeds per decision = 6 reservoir blocks of 16, non-inferiority margin -0.3.
DECISION_BLOCKS = 6; RULE = "96 fresh seeds (6 x 16) per decision, NI margin -0.3 (Alex, 2026-11-17); binding"
PRESETS = {
    "comboA": {"ORG_V6": "1", "M50J": '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1}', "V40TUNE": "{}", "ORG_MIND": "v40"},
    "v57b": {"ORG_V5": "11", "M50J": "{}", "V40TUNE": "{}", "ORG_MIND": "v40"},
}
now = lambda: datetime.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z")

def cfg(x):
    if x in PRESETS: return x, dict(PRESETS[x])
    d = json.loads(x); return "custom-" + hashlib.sha256(json.dumps(d, sort_keys=True).encode()).hexdigest()[:8], d

def ledger():
    return [json.loads(l) for l in open(LEDGER)] if os.path.exists(LEDGER) else []

def allocate_n(purpose, n):
    used = {e["block"] for e in ledger()}
    free = [b for b in RESERVOIR if b not in used and b not in SELFTEST_BLOCKS]
    if len(free) < n: sys.exit(f"governor: only {len(free)} reservoir blocks left, need {n}")
    return [allocate(f"{purpose} [{i + 1}/{n}]", b) for i, b in enumerate(free[:n])]

def merge(dirs, out, tests):
    """concatenate per-block results (block order) into one result per test, so compare() sees 96 paired seeds"""
    os.makedirs(out, exist_ok=True)
    for t in tests:
        J = [json.load(open(os.path.join(d, f"dev_{t}.json"))) for d in dirs]
        m = dict(J[0]); m["seeds"] = sum((j["seeds"] for j in J), []); m["arms"] = {k: sum((j["arms"][k] for j in J), []) for k in J[0]["arms"]}
        m["energy"] = {k: (max(j["energy"][k] for j in J) if k == "ledgerMaxDaily" else sum(j["energy"][k] for j in J)) for k in J[0]["energy"]}
        m["blocks"] = [j["seeds"][0] for j in J]; json.dump(m, open(os.path.join(out, f"dev_{t}.json"), "w"))

def allocate(purpose, block=None):
    used = {e["block"] for e in ledger()}
    if block is None:
        free = [b for b in RESERVOIR if b not in used and b not in SELFTEST_BLOCKS]
        if not free: sys.exit("governor: the 704-999 reservoir is exhausted")
        block = free[0]
    elif block in used: sys.exit(f"governor: block {block} was already used (a block is never reused)")
    if block not in RESERVOIR: sys.exit(f"governor: {block} is not a reservoir block")
    e = {"block": block, "seeds": f"{block}-{block + 15}", "allocated": now(), "purpose": purpose}
    os.makedirs(GOV, exist_ok=True)
    with open(LEDGER, "a") as f: f.write(json.dumps(e) + "\n"); f.flush(); os.fsync(f.fileno())
    mirror_seeds_md(); return block

def mirror_seeds_md():
    s = open(SEEDS_MD).read(); a, b = "<!-- GOVERNOR-BLOCKS:BEGIN", "<!-- GOVERNOR-BLOCKS:END -->"
    i, j = s.index(a), s.index(b); head = s[:i]; first = s[i:].split("\n", 1)[0]
    rows = "\n".join(f"| {e['seeds']} | {e['allocated']} | {e['purpose']} |" for e in ledger())
    body = f"{first}\n| seeds | allocated | purpose |\n|---|---|---|\n{rows}\n"
    tmp = SEEDS_MD + ".tmp"; open(tmp, "w").write(head + body + s[j:]); os.replace(tmp, SEEDS_MD)

def bundle(ref):
    p = subprocess.check_output([os.path.join(HERE, "build_bundle.sh"), ref], text=True).strip()
    return p, json.load(open(p + ".meta.json"))

def run_arms(bpath, bsha, specs, jobs):
    """specs: list of (env, arm, block, tests, out). All (arm, test) jobs share one pool."""
    work = []
    for env, arm, block, tests, out in specs:
        os.makedirs(out, exist_ok=True)
        for t in tests: work.append((env, arm, block, t, out))
    def one(w):
        env, arm, block, t, out = w; dst = os.path.join(out, f"dev_{t}.json")
        if os.path.exists(dst): return
        e = {k: v for k, v in os.environ.items() if not k.startswith(("ORG_", "M4", "M5", "V3", "V4", "PROBE"))}
        e.update(env); e.update({"MODE": "dev", "ARM": arm, "SEEDBASE": str(block), "NSEEDS": "16", "OUT": out, "BUNDLE_SHA256": bsha})
        r = subprocess.run(["nice", "-n", "10", "node", bpath, t], env=e, capture_output=True, text=True)
        if r.returncode: raise RuntimeError(f"{arm} {t}: {r.stderr[-800:]}")
        print(r.stdout.strip(), flush=True)
    work.sort(key=lambda w: -{"AE1": 3, "HOT3RM": 2, "RPT2RL5": 2}.get(w[3], 1))  # long tests first
    with ThreadPoolExecutor(jobs) as ex: list(ex.map(one, work))

def dt(a, b):
    ma, mb = S.mean(a), S.mean(b); sp = math.sqrt((S.variance(a) + S.variance(b)) / 2) or 1e-12
    return (ma - mb) / sp, (ma - mb) / (math.sqrt(S.variance(a) / len(a) + S.variance(b) / len(b)) or 1e-12)

def grade(A):
    k = list(A); f = A[k[0]]; cs = [dt(f, A[c]) for c in k[1:]]
    if not cs: return {"grade": "-", "d": None, "t": None}
    d, t = min(cs, key=lambda x: x[0]); return {"grade": "A" if all(x >= 0.8 and y >= 2.75 for x, y in cs) else "fail", "d": round(d, 3), "t": round(t, 2)}

def delta_d(p, c, seed):
    diff = [y - x for x, y in zip(p, c)]; sp = math.sqrt((S.variance(p) + S.variance(c)) / 2)
    if sp == 0: return (0.0, 0.0, 0.0) if all(x == 0 for x in diff) else (math.copysign(math.inf, S.mean(diff)),) * 3
    rng = random.Random(seed); n = len(diff)
    bs = sorted(S.mean(rng.choice(diff) for _ in range(n)) / sp for _ in range(BOOT))
    return S.mean(diff) / sp, bs[int(0.025 * BOOT)], bs[int(0.975 * BOOT) - 1]

def cost(d, tests):
    E = [json.load(open(os.path.join(d, f"dev_{t}.json")))["energy"] for t in tests]
    ticks = sum(e["organismTicks"] for e in E) or 1
    return {"kJ_per_org_day": sum(e["heatKJ"] for e in E) * 1440 / ticks, "cpu_s_per_org_day": sum(e["cpuSec"] for e in E) * 1440 / ticks,
            "cpu_s_total": sum(e["cpuSec"] for e in E), "ledger_max": max(e["ledgerMaxDaily"] for e in E), "nonfinite": sum(e["ledgerNonFinite"] for e in E)}

def compare(pdir, cdir, tests, target, label, block, pname, cname, meta):
    rows, ok_ni = [], True
    for i, t in enumerate(tests):
        P = json.load(open(os.path.join(pdir, f"dev_{t}.json")))["arms"]; C = json.load(open(os.path.join(cdir, f"dev_{t}.json")))["arms"]
        fk = list(P)[0]; dd, lo, hi = delta_d(P[fk], C[fk], seed=block * 100 + i)
        ni = lo > NI_MARGIN; ok_ni &= ni
        rows.append({"test": t, "parent": grade(P), "child": grade(C), "delta_d": round(dd, 3), "ci95": [round(lo, 3), round(hi, 3)],
                     "non_inferior": ni, "identical": P == C})
    pc, cc = cost(pdir, tests), cost(cdir, tests)
    gain = None
    if target:
        r = next(x for x in rows if x["test"] == target); gain = r["ci95"][0] > 0
    verdict = "ACCEPT" if ok_ni and (gain is not False) else "REJECT"
    tr = next((x for x in rows if x["test"] == target), None)
    eff = None
    if tr: eff = {"delta_d_per_kJ_org_day": tr["delta_d"] / cc["kJ_per_org_day"], "delta_d_per_cpu_s_org_day": tr["delta_d"] / cc["cpu_s_per_org_day"],
                  "metabolic_cost_change_pct": 100 * (cc["kJ_per_org_day"] / pc["kJ_per_org_day"] - 1), "compute_cost_change_pct": 100 * (cc["cpu_s_per_org_day"] / pc["cpu_s_per_org_day"] - 1)}
    return {"label": label, "verdict": verdict, "block": block, "seeds": f"{block}-{block + 15}", "parent": pname, "child": cname, "target": target,
            "non_inferior_all": ok_ni, "target_gain": gain, "rows": rows, "cost": {"parent": pc, "child": cc}, "efficiency": eff, "bundle": meta, "decided": now()}

def md(v):
    L = [f"### {v['label']}: **{v['verdict']}**", "", f"Block {v['seeds']}; parent `{v['parent']}`, child `{v['child']}`; target {v['target'] or '(none)'}; bundle {v['bundle']['sha256'][:12]} (commit {v['bundle']['commit'][:7]}, bun {v['bundle']['bun']}).", "",
         "| test | parent grade d/t | child grade d/t | delta-d (child - parent) | 95% CI | non-inferior (lo > -0.3) | per-seed identical |", "|---|---|---|---|---|---|---|"]
    for r in v["rows"]:
        g = lambda x: f"{x['grade']} {x['d']}/{x['t']}"
        L.append(f"| {r['test']} | {g(r['parent'])} | {g(r['child'])} | {r['delta_d']:+.3f} | [{r['ci95'][0]:+.3f}, {r['ci95'][1]:+.3f}] | {'yes' if r['non_inferior'] else '**no**'} | {'yes' if r['identical'] else 'no'} |")
    p, c = v["cost"]["parent"], v["cost"]["child"]
    L += ["", f"Cost (all retained tests): parent {p['kJ_per_org_day']:.1f} kJ and {p['cpu_s_per_org_day']:.2f} CPU-s per organism-day; child {c['kJ_per_org_day']:.1f} kJ and {c['cpu_s_per_org_day']:.2f} CPU-s. Energy-ledger max error {max(p['ledger_max'], c['ledger_max']):.1e}; non-finite {p['nonfinite'] + c['nonfinite']}."]
    if v["efficiency"]:
        e = v["efficiency"]; L.append(f"Target {v['target']}: delta-d per kJ/org-day {e['delta_d_per_kJ_org_day']:+.4f}; per CPU-s/org-day {e['delta_d_per_cpu_s_org_day']:+.3f}; metabolic cost {e['metabolic_cost_change_pct']:+.1f}%, compute cost {e['compute_cost_change_pct']:+.1f}%.")
    return "\n".join(L) + "\n"

def save(name, verdicts, extra=""):
    d = os.path.join(GOV, name); os.makedirs(d, exist_ok=True)
    json.dump(verdicts, open(os.path.join(d, "verdict.json"), "w"), indent=1)
    open(os.path.join(d, "VERDICT.md"), "w").write(f"# Governor: {name}\n\nDecided {now()}. Gate: every retained test non-inferior (lower 95% CI of paired delta-d > {NI_MARGIN}) and, if a target is named, a gain on it (lower CI > 0).\n\n" + extra + "\n".join(md(v) for v in verdicts))
    print(open(os.path.join(d, "VERDICT.md")).read())

def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("run"); r.add_argument("--name", required=True); r.add_argument("--parent", required=True); r.add_argument("--child", required=True)
    r.add_argument("--target"); r.add_argument("--tests", default=",".join(RETAINED)); r.add_argument("--jobs", type=int, default=6); r.add_argument("--ref", default="HEAD")
    s = sp.add_parser("selftest"); s.add_argument("--jobs", type=int, default=6); s.add_argument("--ref", default="HEAD")
    sp.add_parser("blocks")
    a = ap.parse_args()
    if a.cmd == "blocks":
        for e in ledger(): print(json.dumps(e))
        return
    bpath, meta = bundle(a.ref)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M")
    if a.cmd == "run":
        tests = a.tests.split(","); pn, pe = cfg(a.parent); cn, ce = cfg(a.child)
        if a.target and a.target not in tests: tests.append(a.target)
        blk = allocate(f"run {a.name}: {pn} -> {cn}, target {a.target or '-'}")
        base = os.path.join(GOV, f"{stamp}_{a.name}", "raw"); pd, cd = os.path.join(base, "parent"), os.path.join(base, "child")
        run_arms(bpath, meta["sha256"], [(pe, "parent", blk, tests, pd), (ce, "child", blk, tests, cd)], a.jobs)
        save(f"{stamp}_{a.name}", [compare(pd, cd, tests, a.target, a.name, blk, pn, cn, meta)])
    else:
        used = {e["block"] for e in ledger()}
        for b in SELFTEST_BLOCKS:
            if b not in used: allocate("governor v0 self-test (Phase 1.1)", b)
        base = os.path.join(GOV, f"{stamp}_selftest", "raw"); T = RETAINED; j = a.jobs
        runs = {(b, arm): os.path.join(base, f"{arm}_{b}") for b in SELFTEST_BLOCKS for arm in ("comboA", "comboA-rerun")}
        runs[(720, "v57b")] = os.path.join(base, "v57b_720")
        run_arms(bpath, meta["sha256"], [(PRESETS[arm.split("-")[0]], arm, b, T, d) for (b, arm), d in runs.items()], j)
        V = [compare(runs[(b, "comboA")], runs[(b, "comboA-rerun")], T, None, f"parent vs parent (Combo A twice), block {b}", b, "comboA", "comboA", meta) for b in SELFTEST_BLOCKS]
        V.append(compare(runs[(720, "comboA")], runs[(720, "v57b")], T, "RPT2R", "sensitivity: Combo A -> v5.7b (a known RPT2R loss; must REJECT)", 720, "comboA", "v57b", meta))
        V.append(compare(runs[(720, "v57b")], runs[(720, "comboA")], T, "RPT2R", "sensitivity: v5.7b -> Combo A, target RPT2R (the official +3.37 d gain)", 720, "v57b", "comboA", meta))
        save(f"{stamp}_selftest", V)

if __name__ == "__main__":
    main()
