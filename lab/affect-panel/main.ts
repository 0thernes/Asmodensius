// v4.0 live affect lab panel: a small dome of creature 001s stepped in the browser; per-creature emotions, mood, attitudes (sites + others), wanting, personality, risk, dysregulation events.
// Lesion toggles rebuild the dome with affectLesion set. Pure DOM, no framework, no network.
import { Dome } from "../src/biosphere/dome"; import { make001 } from "../src/adapters/c001";
const LAYERS = ["emotion", "mood", "attitude", "personality", "dysreg", "risk"]; const V40 = ["bus", "alien", "substrate", "self", "sim", "curv", "neo"]; const off40 = new Set<string>(); const off = new Set<string>(); let d: any, running = true, speed = 20;
const $ = (h: string) => { const e = document.createElement("div"); e.innerHTML = h; return e.firstElementChild as HTMLElement; };
const bar = (v: number, lo = 0, hi = 1, c = "#5b8") => { const f = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); return `<span class=b><i style="width:${(f * 100).toFixed(0)}%;background:${c}"></i></span><small>${v.toFixed(2)}</small>`; };
const strip = (a: number[], lo: number, hi: number) => a.map((v) => { const f = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); return `<i class=s style="background:hsl(${(f * 120).toFixed(0)},60%,45%)" title="${v.toFixed(2)}"></i>`; }).join("");
function build() { const seed = 2000 + Math.floor(Math.random() * 32); d = new Dome({ seed, radius: 6 }, { respawnAfter: 60 }); const les = [...off].join(","), les40 = [...off40].join(",");
  d.spawn = (_: string, s: number, parent?: any) => make001(s, { mind: "v40", affectLesion: les, v40Lesion: les40, ...(parent?.persona?.() ? { parentPersona: parent.persona() } : {}), ...(parent?.devGenome?.() ? { parentDevGenome: parent.devGenome() } : { develop: true }) });
  for (let i = 0; i < 5; i++) d.add("c" + i, make001(seed * 10 + i, { mind: "v40", affectLesion: les, v40Lesion: les40, develop: true })); (document.getElementById("seed") as HTMLElement).textContent = `dev seed ${seed}`; }
function render() { const root = document.getElementById("pop")!; root.innerHTML = ""; const t = d.t, day = (t / 1440).toFixed(2);
  (document.getElementById("clock") as HTMLElement).textContent = `t=${t} (day ${day}) · deaths ${d.deaths} · births ${d.births} · Neo marks granted ${d.neoGrants} / denied ${d.neoDenied}`;
  for (const h of d.pop) { const a = h.c.affectState?.(); if (!a) { root.append($(`<div class=card><b>${h.id}</b> affect off (lesion all)</div>`)); continue; }
    const P = a.persona, ev = a.events.slice(-6).reverse().map((e: any) => `<li><b>${e.type}</b> t${e.t} (${e.v})</li>`).join("");
    const oth = Object.entries(a.others).map(([k, v]: any) => `${k}:${(v as number).toFixed(2)}`).join(" ") || "none yet";
    root.append($(`<div class=card><div><b>${h.id}</b> ${h.c.alive() ? "" : "† "}${a.sick ? "🤒 sick " : ""}${a.hpaLocked ? "⚠ HPA locked " : ""}</div>
      <table><tr><td>fear</td><td>${bar(a.emo.fear, 0, 1, "#c55")}</td><td>delight</td><td>${bar(a.emo.delight, 0, 1, "#5c5")}</td></tr>
      <tr><td>frustration</td><td>${bar(a.emo.frustration, 0, 1, "#c95")}</td><td>calm</td><td>${bar(a.emo.calm)}</td></tr>
      <tr><td>mood</td><td>${bar(a.mood.val, -1, 1, "#58c")}</td><td>slow mood</td><td>${bar(a.mood.valSlow, -1, 1, "#58c")}</td></tr>
      <tr><td>stress</td><td>${bar(a.stress, 0, 1, "#c55")}</td><td>inflammation</td><td>${bar(a.inflam, 0, 1, "#c5c")}</td></tr>
      <tr><td>sleep debt</td><td>${bar(a.sleepDebt, 0, 2, "#88c")}</td><td>scarcity</td><td>${bar(a.scarcity, 0, 1, "#cc5")}</td></tr></table>
      <div>attitude (16 sites) ${strip(a.att, -0.5, 0.5)}</div><div>wanting ${strip(a.want, 0, 1)}</div><div>outcome SD ${strip(a.rSD, 0, 0.6)}</div>
      <div>others: <small>${oth}</small></div>
      <div><small>bold ${P.bold.toFixed(2)} · curious ${P.curious.toFixed(2)} · reactive ${P.reactive.toFixed(2)} · vuln ${P.vuln.toFixed(2)} · hedge ${(P.hedge ?? 0).toFixed(2)} · riskScar ${(P.riskScar ?? 0).toFixed(2)}</small></div>
      ${h.c.o?.devStats ? `<div><small>wiring: ${h.c.o.devStats.kept - h.c.o.devStats.pruned + h.c.o.devStats.sprouted}/${h.c.o.devStats.target} target · pruned ${h.c.o.devStats.pruned} · sprouted ${h.c.o.devStats.sprouted} · topo ${h.c.o.devStats.topo.toFixed(2)}</small></div>` : ""}${(() => { const v = h.c.v40State?.(); if (!v) return ""; const B = v.bus, S = v.self, K = v.curv, N = v.neo; return `<div><small><b>bus</b> gain ${B.gain.map((x: number) => x.toFixed(2)).join("/")} (classic/intero/alien/substrate:${B.substrateMode}) · surprise ${B.surprise.toFixed(3)}</small></div>
      <div><small><b>SELF</b> err ${S.err.toFixed(3)} · caution ${S.caution.toFixed(2)} · <b>SIM</b> ${bar(S.sim, 0, 1, "#a6f")}</small></div>
      <div><small><b>curvature</b> κ ${K.kappa.toFixed(2)} · felt ${K.felt.toFixed(2)} · confidence ${K.conf.toFixed(2)}</small></div>
      <div><small><b>Neo</b> shade ${N.uses[0]}/${N.granted[0]} · mark ${N.uses[1]}/${N.granted[1]} (used/granted) · hook values ${N.val.map((x: number) => x.toFixed(2)).join("/")} · pruned-kept ${v.devPruned}</small></div>`; })()}<ul>${ev || "<li>no dysregulation events yet</li>"}</ul></div>`)); } }
function loop() { if (running) { for (let i = 0; i < speed; i++) d.step(); render(); } requestAnimationFrame(loop); }
window.addEventListener("DOMContentLoaded", () => { const tg = document.getElementById("lesions")!;
  for (const l of LAYERS) { const b = $(`<label><input type=checkbox> lesion ${l}</label>`); b.querySelector("input")!.addEventListener("change", (e) => { (e.target as HTMLInputElement).checked ? off.add(l) : off.delete(l); build(); }); tg.append(b); }
  for (const l of V40) { const b = $(`<label><input type=checkbox> lesion ${l}</label>`); b.querySelector("input")!.addEventListener("change", (e) => { (e.target as HTMLInputElement).checked ? off40.add(l) : off40.delete(l); build(); }); tg.append(b); }
  document.getElementById("pause")!.onclick = () => { running = !running; }; (document.getElementById("speed") as HTMLInputElement).oninput = (e) => { speed = +(e.target as HTMLInputElement).value; };
  document.getElementById("reset")!.onclick = build; build(); loop(); });
