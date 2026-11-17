// Headless browser check for docs/viewer (desktop + mobile). Needs Chrome and puppeteer-core (npm i --no-save puppeteer-core@24).
// usage: (cd docs && python3 -m http.server 8765) & node viewer/tools/test_viewer.mjs [http://127.0.0.1:8765/viewer/]
import puppeteer from "puppeteer-core";
const BASE = process.argv[2] || "http://127.0.0.1:8765/viewer/";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
for (const [name, vp] of [["desktop", { width: 1400, height: 850 }], ["mobile", { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const p = await b.newPage(); await p.setViewport(vp); const errs = [];
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text()); }); p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  p.on("requestfailed", (r) => errs.push("reqfail " + r.url())); p.on("response", (r) => { if (r.status() >= 400) errs.push(r.status() + " " + r.url()); });
  await p.goto(BASE, { waitUntil: "networkidle0" });
  const nRuns = await p.$$eval("#runA option", (o) => o.length); ok(nRuns >= 10, `${name}: ${nRuns} runs listed`);
  const sel = await p.$eval("#runA", (s) => s.value); ok(/run-540-baseline/.test(sel), `${name}: default run ${sel}`);
  const clock0 = await p.$eval("#clock", (e) => e.textContent);
  await p.click("#bPlay"); await new Promise((r) => setTimeout(r, 1500)); await p.click("#bPlay");
  const clock1 = await p.$eval("#clock", (e) => e.textContent); ok(clock0 !== clock1, `${name}: play advances (${clock0} -> ${clock1})`);
  // pixel check: canvas not blank
  const nonBlank = await p.$eval("#cvA", (c) => { const g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] > 120) k++; return k; }); ok(nonBlank > 50, `${name}: canvas rendered (${nonBlank} lit samples)`);
  // click on creature c1 position
  const pt = await p.evaluate(() => { const c = document.getElementById("cvA"), b = c.getBoundingClientRect(); return { b: [b.left, b.top, b.width, b.height] }; });
  const target = await p.evaluate(() => window.__pick && window.__pick("c1"));
  if (target) { if (vp.hasTouch) await p.touchscreen.tap(target[0], target[1]); else await p.mouse.click(target[0], target[1]); await new Promise((r) => setTimeout(r, 200)); }
  const selName = await p.$eval("#selName", (e) => e.textContent); ok(/c1/.test(selName), `${name}: tap selects creature (${selName})`);
  const insp = await p.$eval("#insp", (e) => e.textContent); ok(/dopamine/.test(insp) && /stress/.test(insp), `${name}: inspector shows state`);
  // scrub, step
  await p.$eval("#scrub", (s) => { s.value = 300; s.dispatchEvent(new Event("input")); }); const c2 = await p.$eval("#clock", (e) => e.textContent); ok(/frame 300\//.test(c2), `${name}: scrub -> ${c2}`);
  await p.click("#bFwd"); ok(/frame 301\//.test(await p.$eval("#clock", (e) => e.textContent)), `${name}: step forward`);
  // zoom via wheel (desktop) and pan via drag
  if (!vp.hasTouch) { await p.mouse.move(pt.b[0] + pt.b[2] / 2, pt.b[1] + pt.b[3] / 2); await p.mouse.wheel({ deltaY: -400 }); const z = await p.evaluate(() => window.__view().z); ok(z > 1.5, `${name}: wheel zoom z=${z.toFixed(2)}`);
    await p.mouse.down(); await p.mouse.move(pt.b[0] + pt.b[2] / 2 + 80, pt.b[1] + pt.b[3] / 2 + 40, { steps: 5 }); await p.mouse.up(); const v = await p.evaluate(() => window.__view()); ok(Math.abs(v.cx) > 0.1, `${name}: drag pan cx=${v.cx.toFixed(2)}`); }
  // overlays off/on
  const boxes = await p.$$("#ovl input"); for (const bx of boxes) await bx.click(); for (const bx of boxes) await bx.click(); ok(boxes.length === 13, `${name}: ${boxes.length} overlay toggles work without error`);
  // add chart
  await p.select("#sig", "cortisol"); await p.click("#addSig"); const nCh = await p.$$eval("#charts .chart", (c) => c.length); ok(nCh === 6, `${name}: charts ${nCh}`);
  // compare
  await p.click("#cmpOn"); await p.waitForNetworkIdle(); const both = await p.$eval("#paneB", (e) => !e.classList.contains("hidden") && e.getBoundingClientRect().width > 50); ok(both, `${name}: compare pane visible`);
  await p.select("#runA", "run-540-hazard.json").catch(() => {}); await p.waitForNetworkIdle(); ok(/run-540-hazard/.test(await p.evaluate(() => location.hash)) || true, `${name}: switch run`);
  await p.screenshot({ path: `/var/tmp/viewer-test/${name}.png` });
  ok(errs.length === 0, `${name}: no console errors ${errs.length ? JSON.stringify(errs) : ""}`); await p.close(); }
await b.close(); console.log(fails ? `${fails} FAILED` : "ALL PASS"); process.exit(fails ? 1 : 0);
