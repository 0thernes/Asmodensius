// tiny headless check of social attitudes + inheritance in the dome (1 dev seed, 1 day). Not a test.
import { Dome } from "../src/biosphere/dome"; import { make001 } from "../src/adapters/c001";
const d: any = new Dome({ seed: 2003, radius: 4 }, { respawnAfter: 30, foodCapScale: 0.3 }); let inh = 0;
d.spawn = (_: string, s: number, p?: any) => { if (p?.persona?.()) inh++; return make001(s, { mind: "v40", ...(p?.persona?.() ? { parentPersona: p.persona() } : {}) }); };
for (let i = 0; i < 5; i++) d.add("c" + i, make001(20030 + i, { mind: "v40" })); for (let t = 0; t < 1440; t++) d.step();
console.log(JSON.stringify({ deaths: d.deaths, births: d.births, inherited: inh, pop: d.pop.map((h: any) => { const a = h.c.affectState(); return { id: h.id, others: a.others, mood: +a.mood.val.toFixed(2), ev: a.events.length, risk: a.persona.riskScar?.toFixed(2), hedge: a.persona.hedge?.toFixed(2) }; }) }));
