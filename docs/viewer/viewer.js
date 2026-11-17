// Creature #1 Dome replay viewer. Replays numbers recorded headless in Node (viewer/tools/record.ts). No creature code runs here.
"use strict";
(() => {
const $ = (id) => document.getElementById(id);
const OVERLAYS = [["food", "food grid", 1], ["night", "day/night", 1], ["trail", "position trail", 1], ["heading", "heading", 1], ["mood", "mood colour", 1], ["emotion", "emotion glyph", 1],
  ["energy", "energy/fat bars", 1], ["stress", "stress halo", 1], ["limbs", "limb drive", 1], ["grazers", "grazers", 1], ["labels", "labels", 1], ["signals", "brain glow", 0], ["follow", "follow selected", 0]];
const ov = {}; const DEFAULT_SIGS = ["atp", "fat", "moodVal", "stress", "DA"];
const NICE = { atp: "ATP", glc: "blood glucose", fat: "fat (kJ)", liverGly: "liver glycogen", muscle: "muscle", integrity: "body integrity", eaten: "eaten (kJ, total)",
  DA: "dopamine", NE: "noradrenaline", "5HT": "serotonin", ACh: "acetylcholine", cortisol: "cortisol", insulin: "insulin", ghrelin: "ghrelin", hr: "heart rate", vagal: "vagal tone",
  stress: "stress", moodVal: "mood valence", moodAro: "mood arousal", fear: "fear", delight: "delight", frustration: "frustration", calm: "calm", forage: "foraging now", asleep: "asleep", alive: "alive" };
const st = { index: null, cache: {}, A: null, B: null, pos: 0, playing: false, speed: 1, sel: "c0", sigs: DEFAULT_SIGS.slice(), view: null, trail: 60 };
const panes = [{ cv: $("cvA"), tag: $("tagA"), key: "A" }, { cv: $("cvB"), tag: $("tagB"), key: "B" }];
const fmt = (v) => (v === null || v === undefined ? "–" : Math.abs(v) >= 100 ? v.toFixed(1) : Math.abs(v) >= 1 ? v.toFixed(3) : v.toFixed(4));

function prep(doc) { // column lookup + per-column ranges for scaling
  const ci = {}; doc.cols.forEach((c, k) => (ci[c] = k)); const lo = doc.cols.map(() => Infinity), hi = doc.cols.map(() => -Infinity);
  for (const f of doc.frames) for (const r of f.c) r.forEach((v, k) => { if (v !== null) { if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; } });
  doc.ci = ci; doc.lo = lo; doc.hi = hi; let fm = 0, fl = Infinity; for (const f of doc.food) for (const v of f.f) { if (v > fm) fm = v; if (v > 0 && v < fl) fl = v; } doc.foodMax = fm || 1; doc.foodMin = Math.min(isFinite(fl) ? fl : 0, fm * 0.5); doc.motPhase = buildPhase(doc); return doc; }
function buildPhase(doc) { const k = doc.ci["rate:MOT"], out = []; const acc = doc.ids.map(() => 0);
  doc.frames.forEach((f, i) => { f.c.forEach((r, j) => (acc[j] += (r[k] || 0) * 6 + (r[doc.ci.forage] ? 0.4 : 0))); out.push(acc.slice()); }); return out; }
async function load(file) { if (!st.cache[file]) { const r = await fetch("runs/" + file); if (!r.ok) throw new Error("load " + file + " " + r.status); st.cache[file] = prep(await r.json()); } return st.cache[file]; }
const label = (r) => `seed ${r.seed} · ${r.variant}${r.deaths ? " · " + r.deaths + " death" + (r.deaths > 1 ? "s" : "") : ""}`;

async function init() {
  for (const [k, name, on] of OVERLAYS) { ov[k] = !!on; const l = document.createElement("label"); l.innerHTML = `<input type="checkbox" ${on ? "checked" : ""}> ${name}`; l.firstChild.onchange = (e) => { ov[k] = e.target.checked; draw(); }; $("ovl").appendChild(l); }
  st.index = await (await fetch("runs/index.json")).json();
  for (const sel of [$("runA"), $("runB")]) for (const r of st.index.runs) { const o = document.createElement("option"); o.value = r.file; o.textContent = label(r); sel.appendChild(o); }
  const h = new URLSearchParams(location.hash.slice(1)); const has = (f) => st.index.runs.some((r) => r.file === f);
  const pickA = has(h.get("run")); $("runA").value = pickA ? h.get("run") : (st.index.runs.find((r) => r.seed === 540 && r.variant === "baseline") || st.index.runs[0]).file;
  $("runB").value = has(h.get("cmp")) ? h.get("cmp") : (st.index.runs.find((r) => r.variant === "harsh") || st.index.runs[1] || st.index.runs[0]).file;
  if (has(h.get("cmp"))) $("cmpOn").checked = true;
  $("runA").onchange = () => setRuns(); $("runB").onchange = () => setRuns(); $("cmpOn").onchange = () => setRuns();
  $("bPlay").onclick = () => setPlay(!st.playing); $("bBack").onclick = () => stepBy(-1); $("bFwd").onclick = () => stepBy(1);
  $("speed").onchange = (e) => (st.speed = +e.target.value); $("bFit").onclick = () => { st.view = null; draw(); };
  $("scrub").oninput = (e) => { st.pos = +e.target.value; draw(); };
  $("addSig").onclick = () => { const s = $("sig").value; if (!st.sigs.includes(s)) st.sigs.push(s); buildCharts(); draw(); };
  addEventListener("keydown", (e) => { if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT" && e.target.type !== "range" && e.target.type !== "checkbox") return;
    if (e.code === "Space") { e.preventDefault(); setPlay(!st.playing); } else if (e.key === "ArrowRight") stepBy(1); else if (e.key === "ArrowLeft") stepBy(-1); });
  for (const p of panes) attachPointer(p);
  addEventListener("resize", draw); await setRuns(); requestAnimationFrame(tick);
}
async function setRuns() {
  const cmp = $("cmpOn").checked; $("runB").disabled = !cmp; $("paneB").classList.toggle("hidden", !cmp); $("stage").classList.toggle("cmp", cmp);
  if (!$("runA").value) $("runA").value = st.index.runs[0].file; if (!$("runB").value) $("runB").value = st.index.runs[0].file;
  st.A = await load($("runA").value); st.B = cmp ? await load($("runB").value) : null;
  history.replaceState(null, "", "#run=" + $("runA").value + (cmp ? "&cmp=" + $("runB").value : ""));
  const n = st.A.frames.length - 1; $("scrub").max = n; if (st.pos > n) st.pos = n;
  if (!st.A.ids.includes(st.sel)) st.sel = st.A.ids[0];
  $("sig").innerHTML = ""; for (const c of st.A.cols) { if (c === "x" || c === "y" || c === "heading") continue; const o = document.createElement("option"); o.value = c; o.textContent = NICE[c] || c.replace("rate:", "region rate ") ; $("sig").appendChild(o); }
  about(); buildCharts(); draw(); }
function about() { const d = st.A; $("about").innerHTML = `<p><b>What you are watching.</b> Recorded runs of Creature #1 (frozen Combo A, code pin <span class="mono">${d.codeCommit}</span>, flags <span class="mono">ORG_V6=1 M50J=${esc(d.flags.M50J)}</span>) living in the lab's headless Dome biosphere. Each run was computed in Node ahead of time; this page only replays the numbers.</p>
<p>Run: dome seed ${d.seed}, creatures c0–c${d.ids.length - 1} with organism seeds ${d.creatureSeeds.join(", ")} (dev seeds only, never official or reservoir seeds), world variant <b>${d.variant}</b>, ${d.ticks} ticks (${(d.ticks / 1440).toFixed(1)} simulated days, 1 tick = 1 minute), one frame every ${d.every} ticks. Deaths: ${d.end.deaths}. World energy ledger error at end: ${d.end.worldLedgerError.toExponential(1)}.</p>
<p><b>Overlays.</b> Mood colour: red = negative valence, cyan = positive. Stress halo: the affect module's stress. Limb drive: the creature has no legs in the sim; the legs animate from its motor-region (MOT) firing rate. Emotion glyph: strongest of fear / delight / frustration / calm. Brain glow: CTX and VTA rates.</p>
<p class="muted">Indicator variables, not evidence of consciousness.</p>`; }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function setPlay(p) { st.playing = p; $("bPlay").textContent = p ? "⏸" : "▶"; if (p && st.pos >= st.A.frames.length - 1) st.pos = 0; }
function stepBy(k) { setPlay(false); st.pos = Math.max(0, Math.min(st.A.frames.length - 1, Math.round(st.pos) + k)); draw(); }
let last = 0;
function tick(ts) { const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
  if (st.playing && st.A) { st.pos += dt * 12 * st.speed; const n = st.A.frames.length - 1; if (st.pos >= n) { st.pos = n; setPlay(false); } draw(); }
  requestAnimationFrame(tick); }

// ---------- rendering ----------
function sample(doc, pos) { const n = doc.frames.length - 1, p = Math.max(0, Math.min(n, pos)), i = Math.floor(p), j = Math.min(n, i + 1), a = p - i; return { i, j, a, F: doc.frames[i], G: doc.frames[j] }; }
function lerpRow(doc, s, k) { const r0 = s.F.c[k], r1 = s.G.c[k]; if (!r0) return null; if (!r1) return r0; const ci = doc.ci; const r = r0.map((v, m) => (v === null || r1[m] === null ? v : v + (r1[m] - v) * s.a));
  let dh = r1[ci.heading] - r0[ci.heading]; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); r[ci.heading] = r0[ci.heading] + dh * s.a;
  if (Math.hypot(r1[ci.x] - r0[ci.x], r1[ci.y] - r0[ci.y]) > 3) { r[ci.x] = r0[ci.x]; r[ci.y] = r0[ci.y]; } return r; }
function viewFor(cv, doc) { const w = cv.clientWidth, h = cv.clientHeight; if (!st.view) st.view = { cx: 0, cy: 0, z: 1 }; const base = Math.min(w, h) / (2 * doc.dome.radius + 1.5);
  return { s: base * st.view.z, ox: w / 2 - st.view.cx * base * st.view.z, oy: h / 2 - st.view.cy * base * st.view.z, base }; }
function draw() { if (!st.A) return; $("scrub").value = Math.round(st.pos);
  if (ov.follow && st.view) { const k = st.A.ids.indexOf(st.sel), r = k >= 0 ? lerpRow(st.A, sample(st.A, st.pos), k) : null; if (r) { st.view.cx = r[st.A.ci.x]; st.view.cy = r[st.A.ci.y]; if (st.view.z < 2) st.view.z = 2.5; } }
  const s = sample(st.A, st.pos), t = Math.round(s.F.t + (s.G.t - s.F.t) * s.a), day = Math.floor(t / 1440), mm = t % 1440;
  $("clock").textContent = `tick ${t} · day ${day} ${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")} · frame ${s.i}/${st.A.frames.length - 1}`;
  drawPane(panes[0], st.A); if (st.B) drawPane(panes[1], st.B); inspector(); drawCharts(); }
function drawPane(p, doc) { const cv = p.cv, dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = "#0b1020"; g.fillRect(0, 0, w, h);
  const V = viewFor(cv, doc), X = (x) => V.ox + x * V.s, Y = (y) => V.oy + y * V.s, R = doc.dome.radius, cell = doc.dome.cell, n = doc.dome.n;
  const s = sample(doc, st.pos), ci = doc.ci;
  g.save(); g.beginPath(); g.arc(X(0), Y(0), R * V.s, 0, 7); g.fillStyle = "#101a2c"; g.fill(); g.clip();
  if (ov.food) { let fi = 0; while (fi + 1 < doc.food.length && doc.food[fi + 1].t <= s.F.t) fi++; const f = doc.food[fi].f;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = f[j * n + i]; if (!v) continue; const q = Math.max(0, Math.min(1, (v - doc.foodMin) / ((doc.foodMax - doc.foodMin) || 1)));
      g.fillStyle = `rgb(${18 + 20 * q | 0},${40 + 150 * q | 0},${30 + 40 * q | 0})`; g.fillRect(X(i * cell - R) + 0.5, Y(j * cell - R) + 0.5, cell * V.s - 1, cell * V.s - 1); } }
  if (ov.grazers) { g.fillStyle = "#7dffa8"; for (const [x, y] of s.F.g) g.fillRect(X(x) - 0.12 * V.s, Y(y) - 0.12 * V.s, 0.24 * V.s, 0.24 * V.s); }
  const light = s.F.light + (s.G.light - s.F.light) * s.a; if (ov.night) { g.fillStyle = `rgba(5,8,30,${(0.55 * (1 - light)).toFixed(3)})`; g.fillRect(0, 0, w, h); }
  g.restore(); g.beginPath(); g.arc(X(0), Y(0), R * V.s, 0, 7); g.strokeStyle = "#5c8fd8"; g.lineWidth = 2; g.stroke();
  doc.ids.forEach((id, k) => { const r = lerpRow(doc, s, k); if (!r) return; const x = X(r[ci.x]), y = Y(r[ci.y]), alive = r[ci.alive] > 0.5, sc = V.s;
    if (ov.trail) { g.beginPath(); const i0 = Math.max(0, s.i - st.trail); let pen = false; for (let i = i0; i <= s.i; i++) { const q = doc.frames[i].c[k]; if (!q) continue; const qx = X(q[ci.x]), qy = Y(q[ci.y]);
        if (pen && i > i0) { const pq = doc.frames[i - 1].c[k]; if (pq && Math.hypot(q[ci.x] - pq[ci.x], q[ci.y] - pq[ci.y]) > 3) pen = false; } pen ? g.lineTo(qx, qy) : g.moveTo(qx, qy); pen = true; }
      g.lineTo(x, y); g.strokeStyle = k === 0 ? "#ffb35c88" : k === 1 ? "#7fd2ff88" : "#d39bff88"; g.lineWidth = 1.5; g.stroke(); }
    const rad = Math.max(3, 0.45 * sc * (0.6 + 0.4 * Math.min(1, r[ci.integrity] ?? 1)));
    if (ov.stress && alive) { const sv = Math.min(1, Math.max(0, r[ci.stress] ?? 0)); if (sv > 0.02) { g.beginPath(); g.arc(x, y, rad * (1.5 + sv), 0, 7); g.fillStyle = `rgba(255,60,60,${(0.12 + 0.5 * sv).toFixed(3)})`; g.fill(); } }
    if (ov.limbs && alive) { const ph = doc.motPhase[s.i][k], amp = 0.25 + Math.min(1, (r[ci["rate:MOT"]] || 0) * 3); g.strokeStyle = "#e9d3a8"; g.lineWidth = Math.max(1, sc * 0.07);
      for (let L = 0; L < 4; L++) { const side = L < 2 ? 1 : -1, fore = L % 2 ? 0.6 : -0.6, sw = Math.sin(ph + (L % 2 ? Math.PI : 0) + (side > 0 ? 0 : Math.PI)) * 0.5 * amp;
        const a = r[ci.heading] + side * (Math.PI / 2) + fore * 0.6 + sw * 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * rad * 1.7, y + Math.sin(a) * rad * 1.7); g.stroke(); } }
    let fill = "#ffaa44"; if (ov.mood) { const v = Math.max(-1, Math.min(1, (r[ci.moodVal] ?? 0) * 1.6)), aro = Math.min(1, Math.max(0, r[ci.moodAro] ?? 0.3)); fill = v >= 0 ? `hsl(${185 - 10 * v},${50 + 45 * aro}%,${45 + 15 * v}%)` : `hsl(${0},${50 + 45 * aro}%,${45 + 10 * -v}%)`; }
    if (!alive) fill = "#555"; else if (r[ci.asleep] > 0.5) fill = "#4466cc";
    g.beginPath(); g.arc(x, y, rad, 0, 7); g.fillStyle = fill; g.fill(); g.lineWidth = id === st.sel ? 3 : 1; g.strokeStyle = id === st.sel ? "#fff" : "#0008"; g.stroke();
    if (ov.signals && alive) { const ctx = Math.min(1, (r[ci["rate:CTX"]] || 0) * 4), vta = Math.min(1, (r[ci["rate:VTA"]] || 0) * 4); g.beginPath(); g.arc(x, y, rad * 0.55, 0, 7); g.fillStyle = `rgba(255,255,160,${(0.15 + 0.8 * ctx).toFixed(3)})`; g.fill();
      g.beginPath(); g.arc(x, y, rad * 0.25, 0, 7); g.fillStyle = `rgba(255,80,220,${(0.2 + 0.8 * vta).toFixed(3)})`; g.fill(); }
    if (ov.heading && alive) { const hx = Math.cos(r[ci.heading]), hy = Math.sin(r[ci.heading]); g.beginPath(); g.moveTo(x + hx * rad, y + hy * rad); g.lineTo(x + hx * rad * 2.2, y + hy * rad * 2.2); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke(); }
    if (ov.energy) { const bw = Math.max(18, rad * 2.4), bx = x - bw / 2, by = y + rad + 4, bars = [["atp", "#ffd84a"], ["fat", "#ff9a5a"], ["glc", "#6fd3ff"]];
      bars.forEach(([c, colr], m) => { const kk = ci[c], q = Math.max(0, Math.min(1, (r[kk] - doc.lo[kk]) / ((doc.hi[kk] - doc.lo[kk]) || 1))); g.fillStyle = "#0009"; g.fillRect(bx, by + m * 4, bw, 3); g.fillStyle = colr; g.fillRect(bx, by + m * 4, bw * q, 3); }); }
    if (ov.emotion && alive) { const E = [["fear", "😨"], ["delight", "😊"], ["frustration", "😤"], ["calm", "😌"]].map(([c, e]) => [r[ci[c]] ?? 0, e]).sort((a, b) => b[0] - a[0]);
      const glyph = r[ci.asleep] > 0.5 ? "💤" : E[0][0] > 0.05 ? E[0][1] : ""; if (glyph) { g.font = `${Math.max(12, rad * 1.3) | 0}px system-ui`; g.textAlign = "center"; g.fillText(glyph, x + rad * 1.2, y - rad * 1.1); } }
    if (ov.labels) { g.font = "11px system-ui"; g.textAlign = "center"; g.fillStyle = "#dde3f5"; g.fillText(id + (alive ? "" : " †"), x, y - rad - 6); } });
  p.tag.textContent = `${p.key}: seed ${doc.seed} · ${doc.variant}`; }

// ---------- inspector + charts ----------
function inspector() { const d = st.A, k = d.ids.indexOf(st.sel); $("selName").textContent = st.sel ? "· " + st.sel + " (organism seed " + d.creatureSeeds[k] + ")" : "";
  const s = sample(d, st.pos), r = s.F.c[k]; if (!r) { $("insp").textContent = "Tap a creature."; return; }
  const rb = st.B && st.B.ids.indexOf(st.sel) >= 0 ? sample(st.B, st.pos).F.c[st.B.ids.indexOf(st.sel)] : null;
  $("insp").textContent = (rb ? "signal               A          B\n" : "") + d.cols.filter((c) => c !== "x" && c !== "y").map((c) => { const nm = (NICE[c] || c).padEnd(20).slice(0, 20); const kb = rb ? st.B.ci[c] : -1;
    return nm + " " + fmt(r[d.ci[c]]).padStart(9) + (rb ? " " + fmt(rb[kb]).padStart(9) : ""); }).join("\n"); }
function buildCharts() { const box = $("charts"); box.innerHTML = ""; for (const sgl of st.sigs) { if (!(sgl in st.A.ci)) continue; const d = document.createElement("div"); d.className = "chart";
  d.innerHTML = `<canvas></canvas><span class="lbl">${esc(NICE[sgl] || sgl)}</span><button class="x" title="remove">×</button>`; d.dataset.sig = sgl;
  d.querySelector(".x").onclick = () => { st.sigs = st.sigs.filter((x) => x !== sgl); buildCharts(); draw(); };
  const cv = d.querySelector("canvas"); const seek = (e) => { const b = cv.getBoundingClientRect(); st.pos = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * (st.A.frames.length - 1); draw(); };
  cv.addEventListener("pointerdown", (e) => { seek(e); cv.setPointerCapture(e.pointerId); }); cv.addEventListener("pointermove", (e) => { if (e.buttons) seek(e); }); box.appendChild(d); } }
function series(doc, sig, id) { const k = doc.ids.indexOf(id), c = doc.ci[sig]; if (k < 0 || c === undefined) return null; return doc.frames.map((f) => (f.c[k] ? f.c[k][c] : null)); }
function drawCharts() { for (const d of $("charts").children) { const sig = d.dataset.sig, cv = d.querySelector("canvas"), w = cv.clientWidth, h = cv.clientHeight; if (!w) continue; const dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const SA = series(st.A, sig, st.sel), SB = st.B ? series(st.B, sig, st.sel) : null; let lo = Infinity, hi = -Infinity; for (const S of [SA, SB]) if (S) for (const v of S) if (v !== null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (!isFinite(lo)) continue; if (hi - lo < 1e-9) { hi += 0.5; lo -= 0.5; } const N = st.A.frames.length - 1;
  const line = (S, col, dash) => { g.beginPath(); g.setLineDash(dash); let pen = false; S.forEach((v, i) => { if (v === null) { pen = false; return; } const x = (i / Math.max(1, S.length - 1)) * w, y = h - 4 - ((v - lo) / (hi - lo)) * (h - 16); pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; }); g.strokeStyle = col; g.lineWidth = 1.4; g.stroke(); g.setLineDash([]); };
  if (SB) line(SB, "#7fd2ff", [4, 3]); if (SA) line(SA, "#ffb35c", []); const cx = (st.pos / Math.max(1, N)) * w; g.fillStyle = "#fff8"; g.fillRect(cx, 0, 1, h);
  const cur = SA ? SA[Math.round(st.pos)] : null; g.fillStyle = "#dde3f5"; g.font = "11px ui-monospace,monospace"; g.textAlign = "right"; g.fillText(fmt(cur) + (SB ? " | " + fmt(SB[Math.min(SB.length - 1, Math.round(st.pos))]) : ""), w - 22, 12); } }

// ---------- pan / zoom / pick ----------
function attachPointer(p) { const cv = p.cv, pts = new Map(); let moved = 0, pinch0 = null;
  const world = (e) => { const doc = p.key === "A" ? st.A : st.B, b = cv.getBoundingClientRect(), V = viewFor(cv, doc); return [(e.clientX - b.left - V.ox) / V.s, (e.clientY - b.top - V.oy) / V.s, V]; };
  cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: st.view ? st.view.z : 1 }; } });
  cv.addEventListener("pointermove", (e) => { if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); const doc = p.key === "A" ? st.A : st.B; if (!doc) return; const V = viewFor(cv, doc);
    if (pts.size === 2 && pinch0) { const [a, b] = [...pts.values()]; st.view.z = Math.max(0.5, Math.min(12, pinch0.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pinch0.d || 1))); moved += 10; }
    else { const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy); st.view.cx -= dx / V.s; st.view.cy -= dy / V.s; } draw(); });
  const up = (e) => { if (pts.size === 1 && moved < 6) pick(e); pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", (e) => { pts.delete(e.pointerId); pinch0 = null; });
  cv.addEventListener("wheel", (e) => { e.preventDefault(); const [wx, wy] = world(e); const z0 = st.view.z, z1 = Math.max(0.5, Math.min(12, z0 * Math.exp(-e.deltaY * 0.0015))); st.view.cx = wx - (wx - st.view.cx) * z0 / z1; st.view.cy = wy - (wy - st.view.cy) * z0 / z1; st.view.z = z1; draw(); }, { passive: false });
  function pick(e) { const doc = p.key === "A" ? st.A : st.B; if (!doc) return; const [wx, wy, V] = world(e), s = sample(doc, st.pos); let best = null, bd = Math.max(1.2, 22 / V.s);
    doc.ids.forEach((id, k) => { const r = lerpRow(doc, s, k); if (!r) return; const d = Math.hypot(r[doc.ci.x] - wx, r[doc.ci.y] - wy); if (d < bd) { bd = d; best = id; } }); if (best) { st.sel = best; draw(); } } }

// test hooks (used by the headless check in viewer/tools/test_viewer.mjs)
window.__view = () => ({ ...st.view });
window.__pick = (id) => { const cv = panes[0].cv, doc = st.A, k = doc.ids.indexOf(id), r = lerpRow(doc, sample(doc, st.pos), k), V = viewFor(cv, doc), b = cv.getBoundingClientRect(); return [b.left + V.ox + r[doc.ci.x] * V.s, b.top + V.oy + r[doc.ci.y] * V.s]; };
init().catch((e) => { console.error(e); $("insp").textContent = "Failed to load runs: " + e.message; });
})();
