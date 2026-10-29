// headless render check over the Chrome DevTools protocol: load the page, wait, read the HUD text, take a screenshot
import { spawn } from "child_process"; import { writeFileSync } from "fs";
const ch = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--remote-debugging-port=9333", "--window-size=1400,850", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); await sleep(2500);
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.type === "page"); const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
const cmd = (method, params = {}) => new Promise((r) => { pend.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await cmd("Page.enable"); await cmd("Page.navigate", { url: "http://localhost:8787/" }); await sleep(9000);
const hud = await cmd("Runtime.evaluate", { expression: "document.getElementById('hud').textContent + ' | canvas=' + !!document.querySelector('canvas')" });
const s = await cmd("Page.captureScreenshot", { format: "png" }); writeFileSync((process.env.OUT ?? "out/viewer.png"), Buffer.from(s.data, "base64")); console.log(hud.result.value); ws.close(); ch.kill();
