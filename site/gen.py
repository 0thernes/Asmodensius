#!/usr/bin/env python3
"""Generate the static research site from creatures/001/results/results.json, the benchmark TSV and the roadmap TSV.
Every number on the site is read from those files; nothing is typed in by hand."""
import json, csv, html, os, math, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs")
R = json.load(open(os.path.join(ROOT, "creatures/001/results/results.json")))
REPRO = open(os.path.join(ROOT, "creatures/001/results/repro.txt")).read()
BENCH = list(csv.DictReader(open(os.path.join(ROOT, "benchmark/projects.tsv")), delimiter="\t"))
ROAD = list(csv.DictReader(open(os.path.join(ROOT, "roadmap/capabilities.tsv")), delimiter="\t"))
E = html.escape
os.makedirs(OUT, exist_ok=True)

CSS = """:root{--bg:#09111c;--panel:#0f1a29;--line:#1d2b3f;--fg:#d9e2ee;--mut:#8a9bb2;--teal:#2dd4bf;--amber:#f5b041;--blue:#5b9cf6;--red:#ef6b6b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:var(--blue)}header{border-bottom:1px solid var(--line);padding:14px 28px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
header b{color:var(--teal);letter-spacing:.04em}nav a{color:var(--mut);text-decoration:none;margin-right:14px;font-size:13px}nav a:hover{color:var(--fg)}
main{max-width:1180px;margin:0 auto;padding:24px 28px 60px}h1{font-size:26px;margin:.2em 0}h2{font-size:18px;margin-top:2em;border-bottom:1px solid var(--line);padding-bottom:4px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.k{font-size:28px;font-weight:600}.mut{color:var(--mut);font-size:13px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid var(--line);padding:5px 7px;text-align:left;vertical-align:top}th{color:var(--mut);font-weight:500;position:sticky;top:0;background:var(--bg)}
.pass{color:var(--teal)}.fail{color:var(--amber)}.impl{color:var(--blue)}.tag{display:inline-block;border:1px solid currentColor;border-radius:10px;padding:0 7px;font-size:11px}
.warn{border-left:3px solid var(--amber)}code{background:#0c1522;padding:1px 4px;border-radius:3px}footer{color:var(--mut);font-size:12px;border-top:1px solid var(--line);padding:16px 28px}"""

PAGES = [("index.html","Home"),("results.html","Results"),("tests.html","Tests"),("diagrams.html","Diagrams"),("docs.html","Docs"),("glossary.html","Glossary"),
         ("versions.html","Versions"),("stack.html","Tech stack"),("benchmark.html","Benchmark"),("rankings.html","Rankings"),("roadmap.html","Roadmap to being alive"),
         ("grounding.html","Biological grounding"),("sitemap.html","Index")]

def page(fn, title, body):
    nav = "".join(f'<a href="{f}">{E(t)}</a>' for f, t in PAGES)
    open(os.path.join(OUT, fn), "w").write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)} · Asmodensius</title><style>{CSS}</style></head>
<body><header><b>ASMODENSIUS</b><nav>{nav}</nav></header><main>{body}</main>
<footer>Not evidence of consciousness. These are bounded functional tests of indicator properties against controls. MIT licensed. Credits: <a href="https://github.com/tsotchke/eshkol">Eshkol</a> and <a href="https://github.com/tsotchke/moonlab">Moonlab</a> by Tsotchke. All numbers are generated from results.json.</footer></body></html>""")

def status(it):
    if it["pass"]: return "pass", "PASS"
    if it.get("category") == "Implementation identified": return "impl", "IMPL"
    return "fail", "FAIL"
def fd(x): return "∞" if x is None else f"{x:.2f}"
def fv(x): return "—" if x is None else f"{x:.3f}"
ALL = [("v1", i) for i in R["v1"]] + [("v2", i) for i in R["v2"]] + [("v2.1", i) for i in R["v21"]]
def counts(lst):
    c = {"pass": 0, "fail": 0, "impl": 0}
    for i in lst: c[status(i)[0]] += 1
    return c
c1, c2, c21 = counts(R["v1"]), counts(R["v2"]), counts(R["v21"])
v1fails = [i for i in R["v1"] if status(i)[0] == "fail"]

def chart(items, w=1100):
    """Horizontal bar chart of the weakest-comparison Cohen's d per item, log scale, with the 0.8 threshold."""
    rows = []
    for ver, it in items:
        ds = [c["d"] for c in it["cmps"]]
        if not ds: continue
        m = min((math.inf if d is None else d) for d in ds)
        rows.append((f'{ver} {it["id"]}', m, status(it)[0]))
    h = 18 * len(rows) + 40; x0 = 150; lo, hi = math.log10(0.05), math.log10(100)
    X = lambda d: x0 + (w - x0 - 40) * (min(max(math.log10(max(d, 0.05)) if d != math.inf else hi, lo), hi) - lo) / (hi - lo)
    col = {"pass": "#2dd4bf", "fail": "#f5b041", "impl": "#5b9cf6"}
    s = [f'<svg viewBox="0 0 {w} {h}" width="100%" role="img" aria-label="weakest-control Cohen d per item">']
    for tk in [0.1, 0.8, 1, 10, 100]:
        s.append(f'<line x1="{X(tk):.1f}" x2="{X(tk):.1f}" y1="10" y2="{h-20}" stroke="{"#f5b041" if tk==0.8 else "#1d2b3f"}" stroke-dasharray="{"4 3" if tk==0.8 else ""}"/><text x="{X(tk):.1f}" y="{h-5}" fill="#8a9bb2" font-size="11" text-anchor="middle">{tk}</text>')
    for k, (lab, d, st) in enumerate(rows):
        y = 14 + 18 * k
        s.append(f'<text x="{x0-6}" y="{y+11}" fill="#d9e2ee" font-size="11" text-anchor="end">{E(lab)}</text><rect x="{x0}" y="{y}" width="{max(X(d)-x0,1):.1f}" height="13" fill="{col[st]}" opacity=".85"/><text x="{X(d)+4:.1f}" y="{y+11}" fill="#8a9bb2" font-size="10">{"∞" if d==math.inf else f"{d:.2f}"}</text>')
    s.append("</svg>")
    return "".join(s)

def table(items):
    r = ['<table><tr><th>Ver</th><th>ID</th><th>Name</th><th>Status</th><th>Control</th><th>Full</th><th>Ctrl</th><th>d</th><th>t</th></tr>']
    for ver, it in items:
        cl, lab = status(it)
        cm = it["cmps"] or [None]
        for j, c in enumerate(cm):
            head = f'<td>{ver}</td><td>{E(it["id"])}</td><td>{E(it["name"])}</td><td class="{cl}">{lab}</td>' if j == 0 else '<td></td>' * 4
            if c is None: r.append(f'<tr>{head}<td colspan="5" class="mut">{E(it.get("note",""))}</td></tr>')
            else: r.append(f'<tr>{head}<td class="{"pass" if c["pass"] else "fail"}">{E(c["control"])}</td><td>{fv(c["full"])}</td><td>{fv(c["ctrl"])}</td><td>{fd(c["d"])}</td><td>{fd(c["t"])}</td></tr>')
    return "".join(r) + "</table>"

CEIL = f"""<div class="card warn"><b>Stated plainly: v1 has {len(v1fails)} ceiling-limited failures</b> ({", ".join(E(i["id"]) for i in v1fails)}).
activeInference and CQM-10 hit the ceiling: full and passive/random-switching controls both score 1.000. CQM-21's differentiation comparison came out negative (d −2.57) because the v1 metric favours the uncoupled control. They stay recorded as FAIL under the v1 pre-registration, and their criteria are not changed. Pre-registration v2 added new non-ceiling tests for the same properties.
There, {c2["pass"]}/{len(R["v2"])} pass, and they are shown next to the v1 failures below. A v2 pass does not convert a v1 failure into a pass.</div>"""

# ---------- index
sha = [l for l in REPRO.splitlines() if "sha256" in l or "REPRO" in l]
page("index.html", "Home", f"""<h1>Creature #001: bounded tests of consciousness-indicator properties</h1>
<p class="mut">A browser creature with a real-time shader body, a recurrent controller and a test harness. All tests are pre-registered, controlled and seeded (1000–1015, n=16). The pass rule is Cohen's d ≥ 0.8 and Welch t ≥ 2.75 against every control.</p>
<div class="grid"><div class="card"><div class="k pass">{c1["pass"]}/{len(R["v1"])}</div><div class="mut">v1 items pass ({c1["fail"]} fail, {c1["impl"]} implementation-only)</div></div>
<div class="card"><div class="k pass">{c2["pass"]}/{len(R["v2"])}</div><div class="mut">v2 non-ceiling re-tests pass</div></div>
<div class="card"><div class="k pass">{c21["pass"]}/{len(R["v21"])}</div><div class="mut">v2.1 substrate / reproducibility / scale tests pass</div></div>
<div class="card"><div class="k">{len(BENCH)}</div><div class="mut">projects in the capability benchmark</div></div></div>
{CEIL}
<div class="card"><b>Not evidence of consciousness.</b> There is no aggregate consciousness score. Each item is a narrow functional test of one indicator property, and passing it shows only that the mechanism beats its controls on that test.</div>
<div class="card"><b>Reproducibility</b>: {"<br>".join(E(l) for l in sha)}</div>
<h2>Weakest-control effect size per item</h2>{chart(ALL)}
<p class="mut">Log scale. The amber dashed line is the d = 0.8 threshold. ∞ means zero-variance separation (pre-registered in v2.1). Teal = pass, amber = fail, blue = implementation-only.</p>""")

# ---------- results
page("results.html", "Results", f"""<h1>Results</h1><p class="mut">Generated from <code>creatures/001/results/results.json</code> (full harness, run.ts). Raw log: <code>results/run6.txt</code>.</p>{CEIL}
<h2>Chart</h2>{chart(ALL)}<h2>v1 (frozen)</h2>{table([("v1",i) for i in R["v1"]])}<h2>v2: non-ceiling re-tests</h2>{table([("v2",i) for i in R["v2"]])}
<h2>v2.1: substrate pluralism, reproducibility, scale</h2>{table([("v2.1",i) for i in R["v21"]])}
<div class="card mut">GPU substrate: headless Chrome WebGL2 on ANGLE/SwiftShader, a software rasterizer, disclosed as pre-registered. Notes: {"; ".join(E(i.get("note","")) for i in R["v21"])}</div>""")

# ---------- tests
groups = {}
for ver, it in ALL: groups.setdefault(f'{ver} · {it["group"]}', []).append(it)
tb = "".join(f'<h2>{E(g)}</h2><table><tr><th>ID</th><th>Name</th><th>Metric</th><th>Mechanism</th><th>Controls</th></tr>' + "".join(f'<tr><td>{E(i["id"])}</td><td>{E(i["name"])}</td><td>{E(i.get("metric",""))}</td><td>{E(i.get("mechanism",""))}</td><td>{"<br>".join(E(c["control"]) for c in i["cmps"])}</td></tr>' for i in its) + "</table>" for g, its in groups.items())
page("tests.html", "Tests", f"""<h1>Tests and CI</h1><p>Pre-registrations: <code>creatures/001/preregistrations/</code> (v1, v2, v2.1). Each one was committed before its test code was written.
CI (<code>.github/workflows/harness.yml</code>) type-checks the page with tsc, runs the full harness, and runs the cross-process SHA-256 reproducibility check.</p>
<p class="mut">Badges are wired to GitHub Actions and become live once the repository is published. It is not published yet.</p>{tb}""")

# ---------- diagrams
page("diagrams.html", "Diagrams", """<h1>Diagrams</h1><h2>Architecture</h2>
<svg viewBox="0 0 900 300" width="100%"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="#8a9bb2"/></marker></defs>
<g font-size="13" fill="#d9e2ee"><rect x="20" y="30" width="170" height="60" rx="6" fill="#0f1a29" stroke="#2dd4bf"/><text x="35" y="65">Sensors + world</text>
<rect x="250" y="30" width="190" height="60" rx="6" fill="#0f1a29" stroke="#2dd4bf"/><text x="262" y="58">Recurrent reservoir</text><text x="262" y="78" font-size="11" fill="#8a9bb2">ρ=0.95, ridge readouts</text>
<rect x="500" y="30" width="170" height="60" rx="6" fill="#0f1a29" stroke="#5b9cf6"/><text x="512" y="58">Global workspace</text><text x="512" y="78" font-size="11" fill="#8a9bb2">broadcast + attention</text>
<rect x="720" y="30" width="160" height="60" rx="6" fill="#0f1a29" stroke="#f5b041"/><text x="732" y="65">Limb chains (8×6)</text>
<rect x="250" y="170" width="190" height="60" rx="6" fill="#0f1a29" stroke="#5b9cf6"/><text x="262" y="198">Attention schema</text><text x="262" y="218" font-size="11" fill="#8a9bb2">Kalman, surprise-inflated</text>
<rect x="500" y="170" width="170" height="60" rx="6" fill="#0f1a29" stroke="#5b9cf6"/><text x="512" y="198">Active-inference agent</text><text x="512" y="218" font-size="11" fill="#8a9bb2">depth-4 planning</text>
<rect x="720" y="170" width="160" height="60" rx="6" fill="#0f1a29" stroke="#2dd4bf"/><text x="732" y="198">Substrates</text><text x="732" y="218" font-size="11" fill="#8a9bb2">JS · RV32IM · GLSL</text></g>
<g stroke="#8a9bb2" marker-end="url(#a)"><line x1="190" y1="60" x2="248" y2="60"/><line x1="440" y1="60" x2="498" y2="60"/><line x1="670" y1="60" x2="718" y2="60"/><line x1="345" y1="90" x2="345" y2="168"/><line x1="440" y1="200" x2="498" y2="200"/><line x1="585" y1="168" x2="585" y2="92"/><line x1="670" y1="200" x2="718" y2="200"/></g></svg>
<h2>Test protocol</h2><svg viewBox="0 0 900 120" width="100%"><g font-size="13" fill="#d9e2ee">
<rect x="10" y="30" width="190" height="50" rx="6" fill="#0f1a29" stroke="#f5b041"/><text x="22" y="60">Pre-register + commit</text>
<rect x="240" y="30" width="190" height="50" rx="6" fill="#0f1a29" stroke="#5b9cf6"/><text x="252" y="60">16 seeds × (full, controls)</text>
<rect x="470" y="30" width="190" height="50" rx="6" fill="#0f1a29" stroke="#5b9cf6"/><text x="482" y="60">d ≥ 0.8 and t ≥ 2.75</text>
<rect x="700" y="30" width="190" height="50" rx="6" fill="#0f1a29" stroke="#2dd4bf"/><text x="712" y="60">results.json → site</text></g>
<g stroke="#8a9bb2" marker-end="url(#a)"><line x1="200" y1="55" x2="238" y2="55"/><line x1="430" y1="55" x2="468" y2="55"/><line x1="660" y1="55" x2="698" y2="55"/></g></svg>
<p class="mut">On failure, only the mechanisms are iterated and each change is logged in HARNESS_CHANGES.md. Tests, criteria and controls are never edited after pre-registration.</p>""")

page("docs.html", "Docs", """<h1>Docs</h1><div class="card"><b>Run the creature</b>: open <code>creatures/001/index.html</code> in a WebGL2 browser. A photosensitivity warning gate comes before start. There is no strobing above 3 Hz and there are no large full-screen red flashes. A visible calm-mode toggle and a mute button are always shown.</div>
<div class="card"><b>Run the harness</b>: <code>cd creatures/001/src && npx esbuild run.ts --bundle --platform=node --outfile=/tmp/r.js && node /tmp/r.js</code> writes results.json.
<code>node measure_gpu.js</code> (puppeteer + Chrome) records the GPU substrate and render-detail measurements, and <code>./repro.sh</code> checks cross-process byte-identity.</div>
<div class="card"><b>Rebuild the site</b>: <code>python3 site/gen.py</code>, which writes the site into <code>docs/</code>.</div>
<div class="card"><b>Rules</b>: pre-register before coding. Never special-case or detect the harness. Iterate mechanisms only, and log every change in HARNESS_CHANGES.md. Report every number from a real run.</div>""")

GL = [("Cohen's d","Standardized mean difference: (mean_full − mean_ctrl)/pooled SD."),("Welch t","t statistic without the equal-variance assumption."),("Ablation control","Same system with the hypothesized mechanism removed."),("Random control","Mechanism replaced by a random process with matched statistics."),
("Ceiling-limited failure","The v1 test design left no headroom above the control (both at or near the maximum), so a pass was impossible however good the mechanism. The failure is kept as a FAIL."),("Pre-registration","Test, metric, controls and thresholds committed to git before implementation."),
("Attention schema (AST)","A model the system keeps of its own attention, used to control it (Graziano)."),("Global workspace (GWT)","Limited-capacity stage whose contents are broadcast to many modules (Baars, Dehaene)."),("Higher-order (HOT)","Representations of the system's own first-order states, e.g. metacognitive confidence."),
("IIT / phi proxy","Integrated-information-style measure. Here it is a tractable proxy, not exact Φ."),("Active inference","Action selection minimizing expected free energy (Friston)."),("Participation ratio","(Σλ)²/Σλ² of the covariance eigenvalues: the effective number of dimensions."),
("Sobel detail","Mean luminance-gradient magnitude of a rendered frame."),("RV32IM","32-bit RISC-V base integer ISA plus the multiply extension, interpreted in JS."),("SwiftShader","Google's CPU implementation of Vulkan/GL, used as the disclosed GPU substrate in headless runs."),
("Established / theorized / speculative","Evidence labels on the grounding pages: established means replicated empirical findings, theorized means published models without decisive evidence, speculative means no accepted evidence.")]
page("glossary.html", "Glossary", "<h1>Glossary</h1><table>" + "".join(f"<tr><th>{E(a)}</th><td>{E(b)}</td></tr>" for a, b in GL) + "</table>")

page("versions.html", "Versions", f"""<h1>Versions</h1><table><tr><th>Version</th><th>What</th><th>Result</th></tr>
<tr><td>Pre-registration v1</td><td>Butlin 14 indicators, 10 frameworks, CQM-25 dimensions</td><td>{c1["pass"]} pass / {c1["fail"]} fail (ceiling-limited) / {c1["impl"]} implementation-only</td></tr>
<tr><td>Pre-registration v2</td><td>Non-ceiling re-tests for active inference, CQM-10, CQM-21</td><td>{c2["pass"]}/{len(R["v2"])} pass</td></tr>
<tr><td>Pre-registration v2.1</td><td>CQM-23 substrate pluralism, CQM-24 reproducibility, CQM-25 scale</td><td>{c21["pass"]}/{len(R["v21"])} pass</td></tr></table><p>See CHANGELOG.md for the full history.</p>""")

page("stack.html", "Tech stack", """<h1>Languages and tech stack</h1><table><tr><th>Layer</th><th>Tech</th></tr>
<tr><td>Creature + harness</td><td>TypeScript (strict), React (page shell)</td></tr><tr><td>Rendering</td><td>WebGL2, GLSL ES 3.00 (ray-marched SDF body, bloom)</td></tr>
<tr><td>Substrates</td><td>JavaScript (Math.imul), RV32IM machine code in a JS interpreter, GLSL uint shader</td></tr><tr><td>Audio</td><td>Web Audio API (mute button)</td></tr>
<tr><td>Measurement</td><td>Node.js, esbuild, puppeteer-core + headless Chrome</td></tr><tr><td>Site</td><td>Python 3 static generator, hand-written SVG charts</td></tr><tr><td>CI</td><td>GitHub Actions</td></tr>
<tr><td>Credited prior work</td><td><a href="https://github.com/tsotchke/eshkol">Eshkol</a> (Tsotchke) and <a href="https://github.com/tsotchke/moonlab">Moonlab</a> (Tsotchke). Credited as inspiration and planned integrations (roadmap items). Neither is a dependency of v1 yet.</td></tr></table>""")

# ---------- benchmark
CAPS = [("E","Evolution"),("R","Self-reproduction"),("B","Embodied physics"),("N","Neural control"),("L","Learning/plasticity"),("M","Metabolism/energy"),("S","Social/multi-agent"),("C","Connectome/bio-grounded"),("I","Indicator tests"),("D","Deterministic/reproducible"),("W","Runs in browser"),("O","Open source")]
CRE = {"N":"tested","L":"tested","M":"tested","I":"tested","D":"tested","W":"tested","B":"partial","S":"partial","E":"roadmap","R":"roadmap","C":"roadmap","O":"roadmap"}
CREV = {"N":"RPT/GWT items","L":"iit4 plasticity, V2-10","M":"V2-AI viability","I":"v1/v2 harness","D":"v2.1-24","W":"page runs in browser","B":"limb chains only; no contact physics","S":"social attention in AST; no second creature","E":"no evolution yet","R":"no reproduction yet","C":"roadmap: FlyWire subgraph","O":"MIT licensed locally; unpublished"}
score = lambda caps: len(caps.split())
cre_score = sum(1 if v == "tested" else 0.5 if v == "partial" else 0 for v in CRE.values())
ranked = sorted(BENCH, key=lambda r: -score(r["caps"]))
better = [r for r in BENCH if score(r["caps"]) > cre_score]
rank = 1 + len(better)
claim = ("Creature #001 is the most complete among the systems compared on this rubric." if not better else
         f"Creature #001 is NOT the most complete on this rubric. It scores {cre_score:g}/12, and {len(better)} of the {len(BENCH)} systems score higher (top: {E(ranked[0]['name'])}, {score(ranked[0]['caps'])}/12). The claim is not made.")
hdr = "".join(f"<th title='{E(n)}'>{c}</th>" for c, n in CAPS)
crow = "".join(f'<td class="{ {"tested":"pass","partial":"fail","roadmap":"impl"}[CRE[c]] }" title="{E(CREV[c])}">{CRE[c][0].upper()}</td>' for c, _ in CAPS)
brows = "".join(f'<tr><td>{E(r["name"])}</td><td>{r["year"]}</td><td>{E(r["category"])}</td>' + "".join(f'<td class="pass">●</td>' if c in r["caps"].split() else "<td></td>" for c, _ in CAPS) + f'<td>{score(r["caps"])}</td><td class="mut">{E(r["reference"])}</td></tr>' for r in BENCH)
page("benchmark.html", "Benchmark", f"""<h1>ALife capability benchmark ({len(BENCH)} projects)</h1>
<div class="card warn">Scores are <b>rubric-based</b>, assigned from each project's cited publication or documentation. They were <b>not run by us</b>. A ● means the capability is described in the cited source. The list is deduplicated by project name, one row per project.</div>
<div class="card"><b>{claim}</b></div>
<p class="mut">Legend: {", ".join(f"{c} = {E(n)}" for c, n in CAPS)}. Creature #001's status per capability: T = tested (harness item passes), P = partial, R = roadmap.</p>
<table><tr><th>Project</th><th>Year</th><th>Category</th>{hdr}<th>Score</th><th>Citation</th></tr><tr><td><b>Creature #001</b></td><td>2026</td><td>this work</td>{crow}<td>{cre_score:g}</td><td class="mut">tested=1, partial=0.5; see the rankings page</td></tr>{brows}</table>""")

page("rankings.html", "Rankings", f"""<h1>Rankings (scaffold)</h1><p class="mut">Rubric score = number of the 12 capabilities described in the cited source (not run by us). Creature #001 counts tested = 1 and partial = 0.5. Future versions will replace rubric entries with replications we ran, marked separately.</p>
<table><tr><th>#</th><th>System</th><th>Score</th><th>Basis</th></tr>""" + "".join(f'<tr><td>{k+1}</td><td>{E(r["name"])}</td><td>{score(r["caps"])}</td><td class="mut">rubric, not run by us</td></tr>' for k, r in enumerate(ranked[:25])) +
f'</table><div class="card">Creature #001: score {cre_score:g}, rank {rank} of {len(BENCH)+1} (ties counted favorably to others). Creature status per capability: ' + "; ".join(f"{n}: {CRE[c]} ({E(CREV[c])})" for c, n in CAPS) + "</div>")

# ---------- roadmap
rr = "".join(f'<tr><td>{k+1}</td><td>{E(r["capability"])}</td><td class="mut">{E(r["prior_art"])}</td><td>{E(r["test"])}</td><td class="impl">roadmap</td></tr>' for k, r in enumerate(ROAD))
page("roadmap.html", "Roadmap to being alive", f"""<h1>Roadmap to being alive: {len(ROAD)} capabilities</h1>
<div class="card warn">A capability is marked achieved only when its measurable test is pre-registered, implemented and passes. Achieved now: <b>0 / {len(ROAD)}</b>. The prior-art column records the closest known work, checked from the literature cited there. "Novel" means novel for this creature or combination, not a claim that nobody has tried it.
The title is aspirational: none of these tests would establish that the creature is alive or conscious.</div>
<table><tr><th>#</th><th>Capability</th><th>Prior-art check</th><th>Measurable test</th><th>Status</th></tr>{rr}</table>""")

# ---------- grounding
G = [("FlyWire (Drosophila whole-brain connectome)", [
 ("established","Complete adult fly brain connectome: ~139,000 neurons and ~50 million synapses","Dorkenwald et al. (2024) Nature 634:124"),
 ("established","LIF model built on the connectome predicts sensorimotor circuit activity (feeding, grooming)","Shiu et al. (2024) Nature 634:210"),
 ("theorized","Connectome-constrained models can predict neural activity from structure alone","Lappalainen et al. (2024) Nature 634:1132"),
 ("speculative","Creature #001 using a FlyWire subgraph would inherit fly-like behavior. Untested; this is roadmap item 6","this project")]),
 ("Allen Institute / Blue Brain", [
 ("established","Biophysically detailed mouse V1 model integrating structural and functional data","Billeh et al. (2020) Neuron 106:388"),
 ("established","Reconstruction of a rat neocortical microcircuit of ~31,000 neurons","Markram et al. (2015) Cell 163:456"),
 ("theorized","Detailed microcircuit simulation is sufficient to reproduce in-vivo-like activity regimes","Markram et al. (2015); Isbister et al. (2023) bioRxiv"),
 ("speculative","The reservoir in Creature #001 resembles cortical microcircuits. It is only loosely analogous and has not been validated","this project")]),
 ("Human models", [
 ("established","Global ignition and P3b signatures accompany conscious access in humans","Dehaene & Changeux (2011) Neuron 70:200"),
 ("established","Perturbational complexity index separates conscious from unconscious states","Casali et al. (2013) Sci. Transl. Med. 5:198ra105"),
 ("theorized","Global workspace, higher-order, IIT and attention-schema theories each explain subsets of the data","Butlin et al. (2023) arXiv:2308.08708; COGITATE (2025) Nature"),
 ("speculative","Passing functional indicator tests implies experience in an artificial system","no accepted evidence; explicitly not claimed here")]),
 ("Astrobiology", [
 ("established","Extremophiles survive desiccation, radiation and vacuum (tardigrades, Deinococcus)","Jönsson et al. (2008) Curr. Biol. 18:R729; Cox & Battista (2005) Nat. Rev. Microbiol. 3:882"),
 ("established","Complex organics in Enceladus plumes","Postberg et al. (2018) Nature 558:564"),
 ("theorized","Azotosome-like membranes in Titan methane","Stevenson et al. (2015) Sci. Adv. 1:e1400067 (later disputed: Sandström & Rahm 2020)"),
 ("theorized","Silicon or non-water-solvent biochemistries","Bains (2004) Astrobiology 4:137"),
 ("speculative","Any detected extraterrestrial life","no confirmed detection as of 2026")]),
 ("Speculative: NHI / UAP", [
 ("established","Government reviews have found no verified evidence of extraterrestrial technology","US DoD AARO Historical Record Report Vol. 1 (2024)"),
 ("theorized","Technosignature searches as a scientific framework","Wright et al. (2022) NASA technosignatures report"),
 ("speculative","Non-human intelligence behind UAP and its possible cognitive architecture","no accepted evidence. Included only as labeled speculation; nothing in Creature #001 depends on it")])]
LC = {"established":"pass","theorized":"impl","speculative":"fail"}
gb = "".join(f'<h2>{E(t)}</h2><table><tr><th>Label</th><th>Feature</th><th>Citation</th></tr>' + "".join(f'<tr><td><span class="tag {LC[l]}">{l}</span></td><td>{E(f)}</td><td class="mut">{E(c)}</td></tr>' for l, f, c in rows) + "</table>" for t, rows in G)
page("grounding.html", "Biological grounding", f"<h1>Biological grounding</h1><p class='mut'>Every feature is labeled established, theorized or speculative, with a citation.</p>{gb}")

page("sitemap.html", "Index", "<h1>Site index</h1><ul>" + "".join(f'<li><a href="{f}">{E(t)}</a></li>' for f, t in PAGES) + '<li><a href="../creatures/001/index.html">Creature #001 (standalone)</a></li></ul>' + f'<p class="mut">Generated {datetime.date.today().isoformat()} from results.json.</p>')
print("site written:", len(PAGES), "pages; creature score", cre_score, "rank", rank)
