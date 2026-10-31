(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require2() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // <define:process.env>
  var define_process_env_default;
  var init_define_process_env = __esm({
    "<define:process.env>"() {
      define_process_env_default = {};
    }
  });

  // ../src/rng.ts
  function mulberry(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.getState = () => a;
    f.setState = (x) => {
      a = x >>> 0;
    };
    return f;
  }
  var init_rng = __esm({
    "../src/rng.ts"() {
      init_define_process_env();
    }
  });

  // ../src/biosphere/god.ts
  var seededDice, BASE_WORLD, LADDER, PAYOFF, KICK_PARTS;
  var init_god = __esm({
    "../src/biosphere/god.ts"() {
      init_define_process_env();
      init_rng();
      seededDice = (seed) => ({ name: "classical-seeded", next: mulberry(seed * 2654435761) });
      BASE_WORLD = { deathRule: "organism", respawnAfter: 0, dayLength: 12, lightScale: 1, lightMode: "cycle", lightToCreatures: false, oneShot: false, timeWarp: 1, timeWarpR: 4, foodCapScale: 1, growthScale: 1, gravity: 1, toxicity: 0, electric: null, sensoryLoad: 0, quantumKicks: 0, sensoryLinesR: 0, temperature: 20, wind: 0, o2: 0.21, co2: 4e-4, radiation: 0, recycling: 0, parasites: 0, game: "none", gameStrategy: "fixed", ph: 7, singularity: 0, grazers: 0 };
      LADDER = Array.from({ length: 7 }, (_, i) => {
        const x = i / 6;
        return { foodCapScale: 2 * (1 - x) + 0.05 * x, growthScale: 3 * (1 - x) + 0.05 * x, gravity: 0.5 + 2.5 * x, toxicity: 3e-3 * x, temperature: 20 + 25 * x, o2: 0.21 - 0.12 * x, radiation: 1e-3 * x, parasites: 4e-3 * x };
      });
      PAYOFF = { pd: { CC: [2.2, 2.2], CD: [0, 3.3], DC: [3.3, 0], DD: [0.6, 0.6] }, stag: { CC: [3.3, 3.3], CD: [0, 1.1], DC: [1.1, 0], DD: [1.1, 1.1] } };
      KICK_PARTS = ["CTX", "THAL", "HIP", "STR", "VTA", "LC", "HYP", "MOT"];
    }
  });

  // ../src/biosphere/dome.ts
  var DEFAULT_DOME, Dome;
  var init_dome = __esm({
    "../src/biosphere/dome.ts"() {
      init_define_process_env();
      init_rng();
      init_god();
      DEFAULT_DOME = { radius: 12, cell: 1, foodCap: 30, growth: 4e-3, seed: 1, touchRadius: 1.2 };
      Dome = class _Dome {
        cfg;
        dials = { ...BASE_WORLD };
        dice;
        kicks = 0;
        deaths = 0;
        births = 0;
        born = 0;
        deathLog = [];
        spawn = null;
        detritus = 0;
        parasiteBiomass = 0;
        recycled = 0;
        games = 0;
        coop = 0;
        windDir = 0;
        teleports = 0;
        lr = 30;
        rewardWindow = 15;
        grazerEat = 0.03;
        grazerBiomass = 0;
        grazerHeat = 0;
        localFoodAcc = 0;
        grazersXY = [];
        learn = /* @__PURE__ */ new Map();
        coopLog = [];
        n;
        patches;
        t = 0;
        grown = 0;
        r;
        pop = [];
        E0 = 0;
        constructor(cfg = {}, dials = {}) {
          this.cfg = { ...DEFAULT_DOME, ...cfg };
          this.dials = { ...BASE_WORLD, ...dials };
          this.dice = seededDice(this.cfg.seed + 101);
          this.r = mulberry(this.cfg.seed);
          this.n = Math.ceil(2 * this.cfg.radius / this.cfg.cell);
          this.patches = Array.from({ length: this.n * this.n }, (_, i) => ({ food: this.inside(i) ? this.cfg.foodCap * this.dials.foodCapScale * (0.5 + 0.5 * this.r()) : 0 }));
        }
        inside(i) {
          const x = (i % this.n + 0.5) * this.cfg.cell - this.cfg.radius, y = (Math.floor(i / this.n) + 0.5) * this.cfg.cell - this.cfg.radius;
          return x * x + y * y <= this.cfg.radius ** 2;
        }
        cellAt(x, y) {
          const i = Math.min(this.n - 1, Math.max(0, Math.floor((x + this.cfg.radius) / this.cfg.cell))), j = Math.min(this.n - 1, Math.max(0, Math.floor((y + this.cfg.radius) / this.cfg.cell)));
          return this.patches[j * this.n + i];
        }
        light() {
          const D = this.dials;
          if (D.lightMode === "DD") return 0;
          if (D.lightMode === "LL") return D.lightScale;
          const m = this.t % 1440, h = D.dayLength * 30;
          return Math.abs(m - 720) < h ? D.lightScale * Math.sin(Math.PI * (m - (720 - h)) / (2 * h)) : 0;
        }
        // same 1 tick = 1 min clock as creature 001's SCN; dawn 06:00
        /** v4.0 Neo sandbox: the only dome state a creature hook may touch is this shared scent-mark map (no energy, no host). Rate-limited. */
        neoMarks = new Float32Array(16);
        neoGrants = 0;
        neoDenied = 0;
        attachNeo(c) {
          if (c.attachSandbox) {
            let last = -1e9;
            c.attachSandbox((site) => {
              if (!(Number.isInteger(site) && site >= 0 && site < 16) || this.t - last < 60) {
                this.neoDenied++;
                return false;
              }
              last = this.t;
              this.neoMarks[site] = Math.min(1, this.neoMarks[site] + 0.3);
              this.neoGrants++;
              return true;
            });
          }
        }
        add(id, c, dials) {
          this.attachNeo(c);
          if (!c.body || !c.act || !c.exchange || !c.ledger) throw new Error(`${id} lacks the biosphere body interface`);
          const a = this.r() * 2 * Math.PI, d = Math.sqrt(this.r()) * this.cfg.radius * 0.8;
          this.pop.push({ id, species: c.creatureId, c, x: d * Math.cos(a), y: d * Math.sin(a), heading: this.r() * 2 * Math.PI, path: 0, eaten0: c.ledger().intake, dials });
          if (dials?.rewireFrac) c.rewire(dials.rewireFrac, this.dice.next);
          this.E0 = this.total();
        }
        total() {
          return this.patches.reduce((s, p) => s + p.food, 0) + this.pop.reduce((s, h) => s + h.c.ledger().energy, 0) + this.detritus + this.parasiteBiomass + this.grazerBiomass + this.grazerHeat;
        }
        coopProb(id) {
          const L = this.learn.get(id);
          return L ? 1 / (1 + Math.exp(-L.w)) : NaN;
        }
        patchFood() {
          return this.patches.reduce((s, p) => s + p.food, 0);
        }
        step() {
          this.t++;
          const L = this.light();
          for (let k = 0; k < 16; k++) this.neoMarks[k] *= 0.999;
          for (let i = 0; i < this.patches.length; i++) {
            const p = this.patches[i];
            if (!this.inside(i)) continue;
            const g = Math.max(0, this.cfg.growth * this.dials.growthScale * L * (this.cfg.foodCap * this.dials.foodCapScale - p.food));
            p.food += g;
            this.grown += g;
          }
          for (let hi = 0; hi < this.pop.length; hi++) {
            let h = this.pop[hi];
            if (this.dials.deathRule !== "off" && h.c.alive && !h.c.alive()) {
              if (h.deathT === void 0) {
                h.deathT = this.t;
                this.deaths++;
                this.deathLog.push({ id: h.id, seed: h.c.seed, t: this.t, age: h.c.t() });
              }
              if (this.dials.respawnAfter > 0 && this.spawn && this.t - h.deathT >= this.dials.respawnAfter) {
                this.detritus += h.c.ledger().energy;
                this.births++;
                const kin = this.spawn.length >= 3 ? this.pop.filter((q) => q !== h && q.species === h.species && (!q.c.alive || q.c.alive())) : [];
                const c = this.spawn(h.species ?? "001", 7e6 + this.cfg.seed * 1e3 + this.births, kin.length ? kin[Math.floor(this.r() * kin.length)].c : void 0);
                this.attachNeo(c);
                this.born += c.ledger().energy;
                this.pop[hi] = h = { ...h, c, path: 0, eaten0: c.ledger().intake, deathT: void 0 };
              } else continue;
            }
            const patch = this.cellAt(h.x, h.y);
            let touch = 0;
            for (const o of this.pop) if (o !== h && Math.hypot(o.x - h.x, o.y - h.y) < this.cfg.touchRadius) touch++;
            if (h.c.meet || h.c.neighbors) {
              const nb = [];
              for (const o of this.pop) {
                if (o === h || o.c.alive && !o.c.alive()) continue;
                const dx = o.x - h.x, dy = o.y - h.y, dd = Math.hypot(dx, dy);
                if (dd < this.cfg.touchRadius) h.c.meet?.(o.id);
                if (dd < 3 * this.cfg.touchRadius) nb.push({ id: o.id, dx, dy });
              }
              h.c.neighbors?.(nb);
            }
            h.c.readMarks?.(this.neoMarks);
            if (this.dials.lightToCreatures && h.c.setLight) h.c.setLight(L);
            h.c.sense({ light: L, foodHere: patch.food, temperature: 20 + 5 * L, touch, t: this.t });
            h.c.exchange({ foodPatch: patch });
            const D = this.dials, cd = h.dials;
            if (D.toxicity) h.c.harm(D.toxicity);
            if (D.electric) h.c.stimulate(D.electric.part, D.electric.amount);
            if (D.sensoryLoad) h.c.stimulate("SENS", D.sensoryLoad);
            if (D.quantumKicks && this.dice.next() < D.quantumKicks) {
              h.c.stimulate(KICK_PARTS[Math.floor(this.dice.next() * KICK_PARTS.length)], 3 * this.dice.next());
              this.kicks++;
            }
            if (cd?.modShift) h.c.shiftModulator(cd.modShift.name, cd.modShift.perTick);
            if (D.sensoryLinesR) h.c.senseLines(Array.from({ length: 16 }, () => D.sensoryLinesR * this.dice.next()));
            if (D.temperature !== 20) h.c.work(5e-4 * Math.abs(D.temperature - 20));
            if (D.o2 < 0.21) h.c.work(0.01 * (0.21 - D.o2) / 0.21);
            if (D.co2 > 4e-4) h.c.stimulate("LC", 0.5 * D.co2 / 0.04);
            if (D.radiation) {
              h.c.harm(D.radiation);
              h.c.rewire(D.radiation, this.dice.next);
            }
            if (D.parasites) this.parasiteBiomass += h.c.drain(D.parasites);
            if (D.ph !== 7) this.detritus += h.c.drain(4e-3 * Math.abs(D.ph - 7));
            this.localFoodAcc += patch.food / this.pop.length;
            if (!this.rewardPhasic) this.learnTick(h);
            {
              const k = D.timeWarp !== 1 && Math.hypot(h.x, h.y) < D.timeWarpR ? D.timeWarp : 1;
              if (k > 0) h.c.step(k);
              this.warpTicks += k;
            }
            if (this.rewardPhasic) this.learnTick(h);
            const a = h.c.act();
            if (Number.isFinite(a.heading)) h.heading = a.heading;
            else h.heading += 0.3 * (this.r() - 0.5);
            const sp = a.speed * h.c.body().maxSpeed / Math.sqrt(this.dials.gravity);
            if (sp > 0) h.c.work(2e-3 * this.dials.gravity * h.c.body().mass * sp);
            let nx = h.x + sp * Math.cos(h.heading), ny = h.y + sp * Math.sin(h.heading);
            const R = this.cfg.radius - 0.5;
            if (nx * nx + ny * ny > R * R) {
              h.heading += Math.PI;
              const k = R / Math.hypot(nx, ny);
              nx *= k;
              ny *= k;
            }
            if (this.dials.wind) {
              nx += this.dials.wind * Math.cos(this.windDir);
              ny += this.dials.wind * Math.sin(this.windDir);
              const k = Math.hypot(nx, ny);
              if (k > R) {
                nx *= R / k;
                ny *= R / k;
              }
            }
            if (this.dials.singularity) {
              const r = Math.max(0.3, Math.hypot(nx, ny));
              const pull = Math.min(r, this.dials.singularity / r);
              nx -= pull * nx / r;
              ny -= pull * ny / r;
              if (Math.hypot(nx, ny) < 0.7) {
                const a2 = this.dice.next() * 2 * Math.PI, d2 = Math.sqrt(this.dice.next()) * R;
                nx = d2 * Math.cos(a2);
                ny = d2 * Math.sin(a2);
                this.teleports++;
              }
            }
            h.path += Math.hypot(nx - h.x, ny - h.y);
            h.x = nx;
            h.y = ny;
            if (this.dials.recycling) this.detritus += h.c.takeWaste();
          }
          if (this.dials.wind) this.windDir += 0.05 * (this.dice.next() - 0.5);
          if (this.dials.grazers) this.stepGrazers();
          if (this.dials.recycling && this.detritus > 0) {
            const occ = this.pop.map((h) => this.cellAt(h.x, h.y));
            const amt = this.dials.recycling * this.detritus;
            for (const p of occ) p.food += amt / occ.length;
            this.detritus -= amt;
            this.recycled += amt;
          }
          if (this.dials.game !== "none" && this.t % 60 === 0) this.playGames();
        }
        // ecology: grazers random-walk, eat 0.03 kJ/tick from their cell into biomass, respire 1 %/tick of biomass to heat, and shed 0.2 %/tick as detritus
        stepGrazers() {
          const R = this.cfg.radius - 0.5;
          while (this.grazersXY.length < this.dials.grazers) {
            const a = this.r() * 6.283, d = Math.sqrt(this.r()) * R;
            this.grazersXY.push({ x: d * Math.cos(a), y: d * Math.sin(a) });
          }
          for (const g of this.grazersXY) {
            g.x += 0.2 * (this.r() - 0.5);
            g.y += 0.2 * (this.r() - 0.5);
            const k = Math.hypot(g.x, g.y);
            if (k > R) {
              g.x *= R / k;
              g.y *= R / k;
            }
            const p = this.cellAt(g.x, g.y), e = Math.min(this.grazerEat, p.food);
            p.food -= e;
            this.grazerBiomass += e;
          }
          const resp = 0.01 * this.grazerBiomass, shed = 2e-3 * this.grazerBiomass;
          this.grazerBiomass -= resp + shed;
          this.grazerHeat += resp;
          this.detritus += shed;
          if (this.dials.recycling && this.dials.recycling > 0 && this.grazersXY.length) {
          }
        }
        warpTicks = 0;
        rewardPhasic = false;
        learnTick(h) {
          const L2 = this.learn.get(h.id);
          if (L2?.pend) {
            const P2 = L2.pend;
            P2.acc = (P2.acc ?? 0) + h.c.metrics().DA;
            P2.k = (P2.k ?? 0) + 1;
            if (P2.k >= this.rewardWindow) {
              const delta = P2.acc / P2.k - L2.daBase;
              const g = P2.c ? 1 - P2.p : -P2.p;
              L2.w = Math.max(-6, Math.min(6, L2.w + this.lr * delta * g));
              L2.pend = void 0;
            }
          } else if (L2) L2.daBase += 0.02 * (h.c.metrics().DA - L2.daBase);
        }
        pairs() {
          const out = [];
          if (this.dials.oneShot) {
            const s = this.pop.slice();
            for (let i = s.length - 1; i > 0; i--) {
              const j = Math.floor(this.dice.next() * (i + 1));
              [s[i], s[j]] = [s[j], s[i]];
            }
            for (let i = 0; i + 1 < s.length; i += 2) out.push([s[i], s[i + 1]]);
            return out;
          }
          for (let i = 0; i < this.pop.length; i++) for (let j = i + 1; j < this.pop.length; j++) {
            const a = this.pop[i], b = this.pop[j];
            if (Math.hypot(a.x - b.x, a.y - b.y) <= this.cfg.touchRadius) out.push([a, b]);
          }
          return out;
        }
        playGames() {
          const P = PAYOFF[this.dials.game];
          for (const [a, b] of this.pairs()) {
            const pick = (h) => {
              if (this.dials.gameStrategy !== "learned") return h.c.metrics().DA > 0.25 ? "C" : "D";
              const L = this.learn.get(h.id) ?? this.learn.set(h.id, { w: 0, base: 0, daBase: h.c.metrics().DA }).get(h.id);
              const p = 1 / (1 + Math.exp(-L.w));
              const c = this.dice.next() < p;
              L.pend = { c, p };
              this.coopLog.push(p);
              return c ? "C" : "D";
            };
            const sa = pick(a), sb = pick(b);
            const pay = P[sa + sb];
            const patch = this.cellAt(a.x, a.y);
            const want = pay[0] + pay[1];
            if (patch.food < want) {
              if (this.dials.gameStrategy === "learned") {
                const A = this.learn.get(a.id), B = this.learn.get(b.id);
                if (A) A.pend = void 0;
                if (B) B.pend = void 0;
              }
              continue;
            }
            patch.food -= want;
            a.c.give(pay[0]);
            b.c.give(pay[1]);
            if (this.dials.gameStrategy === "learned") {
              a.c.stimulate("VTA", 0.5 * pay[0]);
              b.c.stimulate("VTA", 0.5 * pay[1]);
            }
            this.games++;
            if (sa === "C") this.coop++;
            if (sb === "C") this.coop++;
          }
        }
        // v0.8 exact dome state: every own field (Maps as entries), both PRNG states, and each creature's own snapshot() (exact for 001 v3.6)
        snapshotFull() {
          const o = this, f = {};
          for (const k of Object.keys(o)) {
            if (["pop", "r", "dice"].includes(k)) continue;
            const v = o[k];
            if (typeof v === "function") continue;
            f[k] = v instanceof Map ? { __map: [...v.entries()] } : v;
          }
          return { v: 2, f, r: this.r.getState(), dice: this.dice.next.getState(), pop: this.pop.map((h) => ({ id: h.id, species: h.species, seed: h.c.seed, x: h.x, y: h.y, heading: h.heading, path: h.path, eaten0: h.eaten0, dials: h.dials, deathT: h.deathT, exact: !!h.c.snapshot, c: h.c.snapshot ? h.c.snapshot() : null })) };
        }
        static fromSnapshot(S, make) {
          const d = new _Dome(S.f.cfg, S.f.dials);
          for (const [k, v] of Object.entries(S.f)) d[k] = v && v.__map ? new Map(v.__map) : v;
          d.r.setState(S.r);
          d.dice.next.setState(S.dice);
          d.pop = S.pop.map((h) => {
            const c = make(h.species, h.seed);
            if (h.c && c.restore) c.restore(JSON.parse(JSON.stringify(h.c)));
            return { id: h.id, species: h.species, c, x: h.x, y: h.y, heading: h.heading, path: h.path, eaten0: h.eaten0, dials: h.dials, deathT: h.deathT ?? void 0 };
          });
          d.spawn = make;
          return d;
        }
        speciesStats() {
          const S = {};
          for (const h of this.pop) {
            const k = h.species ?? h.c.creatureId, m = h.c.metrics();
            const r = S[k] ??= { n: 0, eaten: 0, stores: 0, integrity: 0 };
            r.n++;
            r.eaten += m.eaten;
            r.stores += m.stores;
            r.integrity += m.integrity / 1;
          }
          for (const r of Object.values(S)) {
            r.stores /= r.n;
            r.integrity /= r.n;
          }
          return S;
        }
        ledger() {
          const tot = this.total();
          return { total: tot, start: this.E0, grown: this.grown, born: this.born, worldLedgerError: Math.abs(tot - this.E0 - this.grown - this.born) / this.E0 };
        }
        snapshot() {
          return { t: this.t, cfg: this.cfg, grown: this.grown, patches: this.patches.map((p) => +p.food.toFixed(4)), pop: this.pop.map((h) => ({ id: h.id, x: h.x, y: h.y, heading: h.heading, path: h.path, ledger: h.c.ledger(), seed: h.c.seed })) };
        }
      };
    }
  });

  // ../../creatures/001/organism/affect.ts
  var cl, Affect;
  var init_affect = __esm({
    "../../creatures/001/organism/affect.ts"() {
      init_define_process_env();
      cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
      Affect = class {
        constructor(nOpt, persona, off) {
          this.off = off;
          this.att = new Float32Array(nOpt);
          this.want = new Float32Array(nOpt);
          this.tol = new Float32Array(nOpt);
          this.lastVisit = new Float32Array(nOpt);
          this.rMean = new Float32Array(nOpt).fill(0.5);
          this.rVar = new Float32Array(nOpt).fill(0.25);
          this.persona = { ...persona };
          this.persona0 = this.off.has("personality") ? { bold: 0.5, curious: 1, reactive: 0.5, vuln: 0.3, hedge: 0.3, riskScar: 0.5 } : { ...persona };
        }
        off;
        emo = { fear: 0, delight: 0, frustration: 0, calm: 0.5 };
        mood = { val: 0, aro: 0.3, valSlow: 0, aroSlow: 0.3 };
        att;
        others = {};
        want;
        tol;
        lastVisit;
        persona;
        persona0;
        stress = 0;
        hpaLocked = false;
        sleepDebt = 0;
        inflam = 0;
        sick = false;
        nmBias = { DA: 0, S5: 0 };
        events = [];
        rMean;
        rVar;
        scarcity = 0;
        failStreak = 0;
        swingSign = 1;
        /* personality lesion = population-mean temperament (no individual differences, no drift) */
        /** seeded or inherited personality; vulnerability is heritable */
        static birth(rand, parent, mut = 0.1) {
          const g = () => {
            const u1 = Math.max(1e-12, rand()), u2 = rand();
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          };
          if (parent) {
            const h = parent.hedge ?? 0.3, m = mut * (0.3 + 2.5 * h);
            return { bold: cl(parent.bold + m * g(), 0.05, 1), curious: Math.max(0.2, parent.curious * Math.exp(m * g())), reactive: cl(parent.reactive + m * g(), 0.05, 1), vuln: cl(parent.vuln + m * g(), 0, 1), hedge: cl(h + mut * g()), riskScar: cl((parent.riskScar ?? 0.5) + mut * g(), 0, 2) };
          }
          return { bold: cl(0.5 + 0.2 * g(), 0.05, 1), curious: Math.exp(0.25 * g()), reactive: cl(0.5 + 0.2 * g(), 0.05, 1), vuln: cl(0.3 + 0.2 * g(), 0, 1), hedge: cl(0.3 + 0.15 * g()), riskScar: cl(0.5 + 0.3 * g(), 0, 2) };
        }
        ev(t, type, v) {
          this.events.push({ t, type, v: +v.toFixed(3) });
          if (this.events.length > 500) this.events.shift();
        }
        /** per-tick update; returns hormone/neuromodulator/sleep feedback for the body (natural coupling, not a penalty) */
        step(x) {
          const P = this.off.has("personality") ? this.persona0 : this.persona, on = (l) => !this.off.has(l);
          const fb = { cortisol: 0, DA: 0, S5: 0, sleep: 0 };
          this.scarcity = cl(0.6 * (1 - x.atp) + 0.6 * x.ghrelin - 0.3);
          if (on("emotion")) {
            const k = 1 / 15, re = 0.5 + P.reactive;
            this.emo.fear += k * (cl(re * (1.5 * Math.max(0, x.NE - 0.35) + 0.8 * Math.max(0, x.cortisol - 0.45) + (1 - x.integrity))) - this.emo.fear);
            this.emo.calm += k * (cl(x.S5 * (1 - x.ghrelin) * 1.5) - this.emo.calm);
            this.emo.delight *= 1 - k;
            this.emo.frustration *= 1 - k * 0.7;
          } else this.emo = { fear: 0, delight: 0, frustration: 0, calm: 0.5 };
          if (on("mood")) {
            const inst = this.emo.delight + 0.5 * this.emo.calm - this.emo.fear - 0.7 * this.emo.frustration - 0.5 * (this.sick ? 1 : 0);
            const rum = 0.6 * P.vuln;
            const prev = this.mood.val;
            this.mood.val = cl(this.mood.val + (inst - this.mood.val) / 360 + rum * (this.mood.val - this.mood.valSlow) / 360, -1, 1);
            this.mood.aro += (this.emo.fear + this.emo.delight + this.emo.frustration - this.mood.aro) / 360;
            this.mood.valSlow += (this.mood.val - this.mood.valSlow) / 4320;
            this.mood.aroSlow += (this.mood.aro - this.mood.aroSlow) / 4320;
            const sg = Math.sign(this.mood.val - this.mood.valSlow);
            if (Math.abs(this.mood.val - this.mood.valSlow) > 0.35 && sg !== this.swingSign) {
              this.swingSign = sg;
              this.ev(x.t, "moodSwing", this.mood.val);
            }
            void prev;
          }
          if (on("personality") && x.t % 60 === 0) {
            const d = 2e-4;
            P.bold = cl(P.bold + d * this.mood.valSlow, 0.05, 1);
            P.reactive = cl(P.reactive + d * (this.mood.aroSlow - 0.3), 0.05, 1);
          }
          if (on("dysreg")) {
            this.stress += (this.emo.fear + Math.max(0, x.cortisol - 0.4) + 0.5 * this.inflam - this.stress) / 240;
            const hi = 0.55 - 0.25 * P.vuln, lo = hi * 0.5;
            if (!this.hpaLocked && this.stress > hi) {
              this.hpaLocked = true;
              this.ev(x.t, "hpaLockIn", this.stress);
            } else if (this.hpaLocked && this.stress < lo) {
              this.hpaLocked = false;
              this.ev(x.t, "hpaRecover", this.stress);
            }
            if (this.hpaLocked) fb.cortisol += 4e-3;
            this.sleepDebt = Math.max(0, this.sleepDebt + (x.awake ? Math.max(0, x.sleepS - 0.7) * 0.01 : -4e-3));
            if (this.sleepDebt > 1 && x.t % 720 === 0) this.ev(x.t, "sleepDebt", this.sleepDebt);
            this.emo.frustration = cl(this.emo.frustration + 2e-3 * this.sleepDebt);
            const inf = x.r() < 2e-4 * (0.5 + P.vuln) ? 0.6 : 0;
            this.inflam = cl(this.inflam + inf + 2e-3 * (this.stress + Math.max(0, 0.6 - x.atp) + (1 - x.integrity)) - this.inflam / 600);
            if (!this.sick && this.inflam > 0.4) {
              this.sick = true;
              this.ev(x.t, inf ? "infection" : "sickness", this.inflam);
            } else if (this.sick && this.inflam < 0.2) {
              this.sick = false;
              this.ev(x.t, "recovered", this.inflam);
            }
            if (this.sick) {
              fb.sleep += 6e-4;
              this.emo.delight *= 0.9;
            }
            for (const m of ["DA", "S5"]) this.nmBias[m] += -this.nmBias[m] / 1440 + 2e-3 * P.vuln * (x.r() - 0.5);
            fb.DA += this.nmBias.DA * 0.01;
            fb.S5 += this.nmBias.S5 * 0.01;
            for (let k = 0; k < this.want.length; k++) if (this.want[k] > 0.3 && x.t - this.lastVisit[k] > 480) {
              this.emo.frustration = cl(this.emo.frustration + 15e-4 * this.want[k]);
              if (x.t % 240 === 0) this.ev(x.t, "craving", this.want[k]);
            }
          }
          return fb;
        }
        /** natural outcome of an approach to option k: reward (food), pain (damage), or nothing */
        outcome(t, k, reward, pain, da) {
          const on = (l) => !this.off.has(l);
          this.lastVisit[k] = t;
          const P = this.persona;
          {
            const d = reward - this.rMean[k];
            this.rMean[k] += 0.1 * d;
            this.rVar[k] += 0.1 * (d * d - this.rVar[k]);
          }
          if (on("emotion")) {
            if (reward > 0) {
              this.emo.delight = cl(this.emo.delight + 0.6 * reward * (0.5 + da) * (1 - this.tol[k]) * (this.sick ? 0.3 : 1));
              this.failStreak = 0;
            } else {
              this.failStreak++;
              this.emo.frustration = cl(this.emo.frustration + 0.08 * Math.min(5, this.failStreak));
            }
            if (pain > 0) this.emo.fear = cl(this.emo.fear + pain * (0.5 + P.reactive));
          }
          if (on("attitude")) this.att[k] += 0.08 * (this.emo.delight - this.emo.fear - 0.5 * this.emo.frustration - this.att[k]);
          if (on("dysreg") && reward > 0) {
            this.want[k] = cl(this.want[k] + 0.02 * (0.5 + P.vuln) * (0.5 + da));
            this.tol[k] = cl(this.tol[k] + 0.01 * P.vuln, 0, 0.8);
            if (this.want[k] > 0.6 && this.want[k] - 0.02 < 0.6) this.ev(t, "sensitised", this.want[k]);
          }
          for (let j = 0; j < this.tol.length; j++) {
            this.tol[j] *= 0.999;
            this.want[j] *= 0.9995;
          }
        }
        /** social contact with another creature (dome); valence is a natural consequence (shared food, fight damage, grooming) */
        meet(id, valence) {
          if (this.off.has("attitude")) return;
          this.others[id] = (this.others[id] ?? 0) + 0.1 * (valence - (this.others[id] ?? 0));
        }
        /** decision bias for option k: attitude + wanting (no designer penalty; both are learned from consequences) */
        bias(k) {
          return (this.off.has("attitude") ? 0 : 0.3 * this.att[k]) + (this.off.has("dysreg") ? 0 : 0.4 * this.want[k]) + (this.off.has("risk") ? 0 : 0.5 * (this.persona.riskScar ?? 0) * (this.scarcity - 0.3) * (Math.sqrt(this.rVar[k]) - 0.35));
        }
        // risk: averse when fed, seeking when starving (variance-sensitive)
        /** social stance toward another creature: >0 approach, <0 avoid */
        stance(id) {
          return this.off.has("attitude") ? 0 : this.others[id] ?? 0;
        }
        /** what contact with others feels like right now (associative: attitudes toward others are learned from how being near them felt) */
        feltValence() {
          return this.emo.delight + 0.5 * this.emo.calm - this.emo.fear - 0.5 * this.emo.frustration;
        }
        /** multiplier on the uncertainty (curiosity) term: good mood and boldness open exploration, fear and sickness close it */
        uMul() {
          const P = this.off.has("personality") ? this.persona0 : this.persona;
          return cl(P.curious * (1 + 0.6 * this.mood.val - 0.8 * this.emo.fear * (1 - P.bold)) * (this.sick ? 0.5 : 1), 0.1, 3);
        }
        /** multiplier on the forage probability: sickness lethargy, fear freezing, frustration restlessness */
        forageMul() {
          return cl((this.sick ? 0.5 : 1) * (1 - 0.4 * this.emo.fear * (1 - this.persona.bold)) * (1 + 0.3 * this.emo.frustration), 0.2, 1.6);
        }
        /** decision-noise multiplier: frustration and arousal make choices more erratic */
        noiseMul() {
          return 1 + 0.5 * this.emo.frustration + 0.3 * Math.max(0, this.mood.aro - 0.5);
        }
        /** lab view */
        state() {
          return { emo: { ...this.emo }, mood: { ...this.mood }, att: Array.from(this.att), want: Array.from(this.want), rMean: Array.from(this.rMean), rSD: Array.from(this.rVar, Math.sqrt), scarcity: this.scarcity, others: { ...this.others }, persona: { ...this.persona }, stress: this.stress, hpaLocked: this.hpaLocked, sleepDebt: this.sleepDebt, inflam: this.inflam, sick: this.sick, nmBias: { ...this.nmBias }, events: this.events.slice(-50) };
        }
      };
    }
  });

  // ../../creatures/001/organism/develop.ts
  function randomGenome(nProj, nReg, r) {
    const g = new Float32Array(3 * nProj + 3 * nReg + CORTEX_GENES.length);
    for (let p = 0; p < nProj; p++) {
      g[3 * p] = 1 + 0.3 * gs(r);
      g[3 * p + 1] = 0.1 * gs(r);
      g[3 * p + 2] = Math.log(0.25) + 0.3 * gs(r);
    }
    for (let k = 3 * nProj; k < 3 * nProj + 3 * nReg; k++) g[k] = gs(r);
    for (let k = 3 * nProj + 3 * nReg; k < g.length; k++) g[k] = 0.1 * gs(r);
    return g;
  }
  function mutateGenome(g, r, rate = 0.05) {
    const o = g.slice();
    for (let k = 0; k < o.length; k++) o[k] += rate * gs(r);
    return o;
  }
  function cortexGene(g, nProj, nReg, name) {
    const k = 3 * nProj + 3 * nReg + CORTEX_GENES.indexOf(name);
    return k < g.length ? Math.exp(Math.max(-1, Math.min(1, g[k]))) : 1;
  }
  function grow(P, R02, RN2, regions, g, r) {
    const nP = P.length, tagOf = (reg) => {
      const k = 3 * nP + 3 * regions.indexOf(reg);
      return [g[k], g[k + 1], g[k + 2]];
    };
    const pos = (i, reg) => (i - R02[reg] + 0.5) / RN2[reg];
    const jit = /* @__PURE__ */ new Map();
    const tag = (i, reg) => {
      let t = jit.get(i);
      if (!t) {
        const b = tagOf(reg);
        t = b.map((v) => v + 0.5 * gs(r));
        jit.set(i, t);
      }
      return t;
    };
    const pre = [], post = [], aff = [];
    let cand = 0, topo = 0, target = 0;
    const proj = [];
    const affinity = (pi, i, j) => {
      const [a, b] = P[pi];
      const gain = g[3 * pi], off = g[3 * pi + 1], sig = Math.max(0.05, Math.exp(g[3 * pi + 2]));
      const ti = tag(i, a), tj = tag(j, b);
      const d = pos(j, b) - (gain * pos(i, a) + off - (gain - 1) / 2);
      return Math.exp(-(d * d) / (2 * sig * sig)) * (1 + Math.tanh((ti[0] * tj[0] + ti[1] * tj[1] + ti[2] * tj[2]) / 3));
    };
    P.forEach(([a, b, p], pi) => {
      const gain = g[3 * pi], off = g[3 * pi + 1], sig = Math.max(0.05, Math.exp(g[3 * pi + 2]));
      for (let j = R02[b]; j < R02[b] + RN2[b]; j++) {
        const xj = pos(j, b), tj = tag(j, b);
        const C = [];
        for (let i = R02[a]; i < R02[a] + RN2[a]; i++) {
          if (i === j) continue;
          const xi = pos(i, a), ti = tag(i, a);
          const d = xj - (gain * xi + off - (gain - 1) / 2);
          const A = Math.exp(-(d * d) / (2 * sig * sig)) * (1 + Math.tanh((ti[0] * tj[0] + ti[1] * tj[1] + ti[2] * tj[2]) / 3));
          C.push([i, A]);
        }
        const meanA = C.reduce((s, c) => s + c[1], 0) / Math.max(1, C.length) || 1;
        const tN = p * C.length;
        target += tN;
        const keepN = Math.min(C.length, Math.round(OVERGROW * tN + (r() - 0.5)));
        const over = C.filter(([, A]) => r() < Math.min(1, 2 * p * A / meanA));
        cand += over.length;
        if (over.length < keepN) {
          const inSet = new Set(over.map((c) => c[0]));
          const rest = C.filter(([i]) => !inSet.has(i)).sort((u, v) => v[1] - u[1]);
          for (const c of rest) {
            if (over.length >= keepN) break;
            over.push(c);
          }
        }
        over.sort((u, v) => v[1] * (0.7 + 0.6 * r()) - u[1] * (0.7 + 0.6 * r()));
        for (const [i, A] of over.slice(0, Math.max(0, keepN))) {
          pre.push(i);
          post.push(j);
          proj.push(pi);
          aff.push(A / meanA);
          const xi = pos(i, a);
          topo += 1 - Math.abs(xj - xi);
        }
      }
    });
    return { pre, post, aff, proj, affinity, stats: { candidates: cand, kept: pre.length, topo: pre.length ? topo / pre.length : 0, target: Math.round(target) } };
  }
  var CORTEX_GENES, OVERGROW, gs;
  var init_develop = __esm({
    "../../creatures/001/organism/develop.ts"() {
      init_define_process_env();
      CORTEX_GENES = ["tc", "tcSig", "eI", "iE", "rec0", "xsSig"];
      OVERGROW = 1.15;
      gs = (r) => {
        const u = Math.max(1e-12, r()), v = r();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v);
      };
    }
  });

  // ../../creatures/001/organism/substrate.ts
  var SubstrateTap;
  var init_substrate = __esm({
    "../../creatures/001/organism/substrate.ts"() {
      init_define_process_env();
      init_organism();
      SubstrateTap = class {
        constructor(mode, seed, replayLog = []) {
          this.mode = mode;
          this.replayLog = replayLog;
          this.r = mulberry2(seed * 3571 + 40);
          if (mode === "live") {
            try {
              const ph = __require("perf_hooks");
              this.gcObs = new ph.PerformanceObserver((l) => {
                for (const e of l.getEntries()) this.gcPending += e.duration;
              });
              this.gcObs.observe({ entryTypes: ["gc"] });
              this.eld = ph.monitorEventLoopDelay({ resolution: 10 });
              this.eld.enable();
            } catch {
            }
            this.last = typeof performance !== "undefined" ? performance.now() : Date.now();
          }
        }
        mode;
        replayLog;
        log = [];
        i = 0;
        r;
        pink = new Float64Array(6);
        last = 0;
        gcPending = 0;
        gcObs = null;
        eld = null;
        /** one reading per tick: [jitter, cpu, heap, gc, loopDelay, dome], each roughly in 0..1 */
        read(t, dome = 0) {
          let v;
          if (this.mode === "replay") {
            const f = this.replayLog[this.i++];
            if (!f || f.t !== t) throw new Error(`substrate replay out of sync at tick ${t}`);
            this.log.push({ t, v: f.v.slice() });
            return f.v.slice();
          }
          if (this.mode === "synthetic") {
            for (let k = 0; k < 6; k++) {
              const a = 1 - Math.pow(2, -k - 1);
              this.pink[k] = a * this.pink[k] + (1 - a) * (this.r() - 0.5);
            }
            const pk = this.pink.reduce((s, x) => s + x, 0);
            const gc = this.r() < 0.02 ? 0.3 + 0.7 * this.r() : 0;
            v = [0.5 + pk, 0.3 + 0.2 * Math.sin(t / 1440 * 2 * Math.PI) + 0.05 * (this.r() - 0.5), 0.4 + 0.1 * this.pink[5], gc, 0.1 + 0.5 * gc, dome];
          } else {
            const now = typeof performance !== "undefined" ? performance.now() : Date.now();
            const dt = now - this.last;
            this.last = now;
            let cpu = 0, heap = 0;
            try {
              const os = __require("os");
              cpu = os.loadavg()[0] / Math.max(1, os.cpus().length);
              heap = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
            } catch {
            }
            const gc = Math.min(1, this.gcPending / 50);
            this.gcPending = 0;
            const m = this.eld ? this.eld.mean : 0;
            const ld = Number.isFinite(m) ? Math.min(1, m / 1e8) : 0;
            v = [Math.tanh(dt / 50), Math.min(1, cpu), heap, gc, ld, dome];
          }
          this.log.push({ t, v: v.slice() });
          return v;
        }
        /** newline-delimited JSON for results/<run>/substrate.ndjson */
        toNDJSON() {
          return this.log.map((f) => JSON.stringify(f)).join("\n");
        }
        static fromNDJSON(s) {
          return s.split("\n").filter(Boolean).map((l) => JSON.parse(l));
        }
        close() {
          try {
            this.gcObs?.disconnect();
            this.eld?.disable();
          } catch {
          }
        }
      };
    }
  });

  // ../../creatures/001/organism/v40mods.ts
  var cl2, fin, SensoryBus, SelfModel, Curvature, HOOKS, NeoHooks;
  var init_v40mods = __esm({
    "../../creatures/001/organism/v40mods.ts"() {
      init_define_process_env();
      init_substrate();
      cl2 = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
      fin = (x) => Number.isFinite(x) ? x : 0;
      SensoryBus = class {
        constructor(r, off, mode = "synthetic", seed = 0, replay = []) {
          this.off = off;
          const nIn = 16 + 4 + 3 + 6;
          this.W = new Float32Array(this.D * nIn);
          for (let k = 0; k < this.W.length; k++) this.W[k] = r() < 0.15 ? r() < 0.5 ? -1 : 1 : 0;
          this.P = new Float32Array(this.D * this.D);
          this.prev = new Float32Array(this.D);
          this.R = new Float32Array(16 * this.D);
          for (let k = 0; k < this.R.length; k++) this.R[k] = (r() - 0.5) * 0.3;
          this.tap = mode === "off" ? null : new SubstrateTap(mode === "live" ? "synthetic" : mode, seed, replay);
          for (let i = 0; i < 16; i++) this.chIdx.push(0);
          for (let i = 0; i < 4; i++) this.chIdx.push(1);
          for (let i = 0; i < 3; i++) this.chIdx.push(2);
          for (let i = 0; i < 6; i++) this.chIdx.push(3);
        }
        off;
        D = 32;
        W;
        P;
        prev;
        gain = [1, 0.5, 0.25, 0.25];
        use = [0, 0, 0, 0];
        surprise = 0;
        sMean = 1e-4;
        surpriseN = 1;
        rBar = 0;
        chSurprise = [0, 0, 0, 0];
        out = new Float32Array(16);
        tap;
        lastIn = [];
        chIdx = [];
        R;
        ctl = /* @__PURE__ */ new Set();
        outK = 0.3;
        cr = 2654435769;
        crand() {
          this.cr = Math.imul(this.cr ^ this.cr >>> 15, 739982445) + 1831565813 >>> 0;
          return this.cr / 4294967296;
        }
        step(t, classic, intero, alien, reward) {
          const sub = this.tap && !this.off.has("substrate") ? this.tap.read(t).map((v) => cl2(fin(v), -1, 2)) : [0, 0, 0, 0, 0, 0];
          if (this.ctl.has("glitchInj") && this.crand() < 0.02) sub[3] = 1;
          if (this.ctl.has("glitchNoise") && this.crand() < 0.02) for (let i = 0; i < 16; i++) classic[i] += this.crand() - 0.5;
          let x = [...Array.from(classic), ...intero, ...this.off.has("alien") ? [0, 0, 0] : alien, ...sub];
          this.lastIn = x;
          if (this.ctl.has("busShuffle")) {
            x = x.slice();
            for (let i = x.length - 1; i > 0; i--) {
              const j = Math.floor(this.crand() * (i + 1));
              const tmp = x[i];
              x[i] = x[j];
              x[j] = tmp;
            }
          }
          const D = this.D, n = x.length;
          const f = new Float32Array(D);
          const fc = [new Float32Array(D), new Float32Array(D), new Float32Array(D), new Float32Array(D)];
          for (let d = 0; d < D; d++) for (let i = 0; i < n; i++) {
            const w = this.W[d * n + i];
            if (w) {
              const c = this.chIdx[i];
              const v = w * x[i] * this.gain[c];
              f[d] += v;
              fc[c][d] += w * x[i];
            }
          }
          for (let d = 0; d < D; d++) f[d] = Math.tanh(f[d]);
          let se = 0;
          const err = new Float32Array(D);
          for (let d = 0; d < D; d++) {
            let p = 0;
            for (let e = 0; e < D; e++) p += this.P[d * D + e] * this.prev[e];
            err[d] = f[d] - p;
            se += err[d] * err[d];
          }
          for (let d = 0; d < D; d++) for (let e = 0; e < D; e++) this.P[d * D + e] += 0.01 * err[d] * this.prev[e];
          this.surprise += 0.05 * (se / D - this.surprise);
          this.sMean += 1e-3 * (this.surprise - this.sMean);
          this.surpriseN = cl2(this.surprise / (this.sMean + 1e-9), 0, 5);
          this.rBar += 2e-3 * (reward - this.rBar);
          for (let c = 0; c < 4; c++) {
            let s = 0;
            for (let d = 0; d < D; d++) s += fc[c][d] * err[d];
            this.chSurprise[c] += 0.05 * (Math.abs(s) / D - this.chSurprise[c]);
            let a = 0;
            for (let d = 0; d < D; d++) a += Math.abs(fc[c][d]);
            this.use[c] += 2e-3 * ((reward - this.rBar) * Math.tanh(a / D) * 10 - this.use[c]);
            this.gain[c] = cl2(this.gain[c] + 0.01 * this.use[c], 0.05, 2);
          }
          this.prev = f;
          for (let i = 0; i < 16; i++) {
            let s = 0;
            for (let d = 0; d < D; d++) s += this.R[i * D + d] * f[d];
            this.out[i] = this.off.has("bus") ? 0 : this.outK * Math.tanh(s);
          }
          return this.out;
        }
        state() {
          return { gain: [...this.gain], use: [...this.use], surprise: this.surprise, surpriseN: this.surpriseN, chSurprise: [...this.chSurprise], substrateMode: this.tap?.mode ?? "off" };
        }
      };
      SelfModel = class {
        constructor(r, off) {
          this.off = off;
          this.z = new Float32Array(this.N);
          this.mean = new Float32Array(this.N);
          this.Win = new Float32Array(this.N * 12).map(() => (r() - 0.5) * 0.6);
          this.Wout = new Float32Array(5 * this.N);
        }
        off;
        N = 32;
        z;
        Win;
        Wout;
        pred = [0, 0, 0, 0, 0];
        atpEMA = 0.5;
        err = 0;
        errBody = 0;
        sim = 0.1;
        mean;
        ctl = /* @__PURE__ */ new Set();
        simK = 0.6;
        lastX = [];
        step(x, glitch) {
          const tgt = [x[0], x[1], x[2], x[3], x[10]];
          let e = 0, eb = 0;
          for (let o = 0; o < 5; o++) {
            const d = tgt[o] - this.pred[o];
            e += d * d;
            if (o < 4) eb += d * d;
            if (!this.off.has("self")) for (let i = 0; i < this.N; i++) this.Wout[o * this.N + i] += 0.01 * d * this.z[i];
          }
          this.err += 0.05 * (e - this.err);
          this.atpEMA += 0.01 * (x[1] - this.atpEMA);
          this.errBody += 0.05 * (eb - this.errBody);
          for (let i = 0; i < this.N; i++) {
            let s = 0;
            for (let j = 0; j < (this.ctl.has("selfBody") ? 4 : 12); j++) s += this.Win[i * 12 + j] * fin(x[j]);
            this.z[i] = 0.95 * this.z[i] + 0.05 * Math.tanh(s);
            this.mean[i] += 1e-3 * (this.z[i] - this.mean[i]);
          }
          const z = this.off.has("self") ? this.mean : this.z;
          for (let o = 0; o < 5; o++) {
            let s = 0;
            for (let i = 0; i < this.N; i++) s += this.Wout[o * this.N + i] * z[i];
            this.pred[o] = s;
          }
          if (!this.off.has("sim")) {
            const unexpl = Math.max(0, 0.25 * x[10] - this.errBody);
            const lik = cl2(2 * glitch + 4 * unexpl);
            this.sim = cl2(0.98 * this.sim + 0.02 * lik);
          } else this.sim = 0.1;
          this.lastX = x;
        }
        /** predicted energy drop (next atp below now) -> caution */
        caution() {
          return this.off.has("self") ? 0.25 : cl2(0.25 + 5 * (this.atpEMA - this.pred[1]), 0, 1);
        }
        // 0.25 = neutral; >0.25 when SELF foresees an energy drop
        learnScale() {
          return 1 - this.simK * this.sim;
        }
        state() {
          return { err: this.err, errBody: this.errBody, sim: this.sim, pred: [...this.pred], caution: this.caution(), z: Array.from(this.z.slice(0, 8)) };
        }
      };
      Curvature = class {
        constructor(r, nIn, off) {
          this.nIn = nIn;
          this.off = off;
          this.Pm = new Float32Array(this.K * nIn).map(() => (r() - 0.5) * 2 / Math.sqrt(nIn));
          this.mu = new Float32Array(nIn);
        }
        nIn;
        off;
        K = 6;
        Pm;
        buf = [];
        kappa = 0;
        kMean = 0.5;
        kSD = 0.3;
        conf = 0.5;
        mu;
        step(rates) {
          const y = new Array(this.K).fill(0);
          for (let i = 0; i < this.nIn; i++) {
            const v = rates[i] - this.mu[i];
            this.mu[i] += 1e-3 * v;
            if (v) for (let k2 = 0; k2 < this.K; k2++) y[k2] += this.Pm[k2 * this.nIn + i] * v;
          }
          this.buf.push(y);
          if (this.buf.length > 3) this.buf.shift();
          if (this.buf.length < 3) return;
          const [a, b, c] = this.buf;
          const d1 = b.map((v, i) => v - a[i]), d2 = c.map((v, i) => v - b[i]);
          const n1 = Math.hypot(...d1), n2 = Math.hypot(...d2);
          if (n1 < 1e-6 || n2 < 1e-6) return;
          const cos = cl2(d1.reduce((s, v, i) => s + v * d2[i], 0) / (n1 * n2), -1, 1);
          const k = Math.acos(cos) / (0.5 * (n1 + n2) + 1e-3);
          this.kappa = 0.9 * this.kappa + 0.1 * Math.min(50, k);
          this.kMean += 2e-3 * (this.kappa - this.kMean);
          this.kSD += 2e-3 * (Math.abs(this.kappa - this.kMean) - this.kSD);
          this.conf = this.off.has("curv") ? 0.5 : cl2(0.5 - 0.25 * (this.kappa - this.kMean) / (this.kSD + 1e-3));
        }
        felt() {
          return this.off.has("curv") ? 0 : cl2((this.kappa - this.kMean) / (this.kSD + 1e-3), -2, 2);
        }
        noiseMul() {
          return 0.7 + 0.6 * (1 - this.conf);
        }
        state() {
          return { kappa: this.kappa, kMean: this.kMean, conf: this.conf, felt: this.felt() };
        }
      };
      HOOKS = ["shade", "mark"];
      NeoHooks = class {
        constructor(off) {
          this.off = off;
        }
        off;
        val = [0, 0];
        uses = [0, 0];
        granted = [0, 0];
        pending = [];
        lastUse = null;
        shadeUntil = 0;
        ctl = /* @__PURE__ */ new Set();
        step(t, sim, sleepDebt, hunger, bestSite, r) {
          if (this.off.has("neo")) return;
          if (this.lastUse && t - this.lastUse.t === 120) {
            const k = this.lastUse.k;
            const now = k === 0 ? -sleepDebt : -hunger;
            this.val[k] += 0.2 * (now - this.lastUse.base - this.val[k]);
            this.lastUse = null;
          }
          if (this.lastUse || t % 30 !== 0) return;
          const drive = [sleepDebt * (0.3 + sim), hunger * (0.2 + sim)];
          for (let k = 0; k < 2; k++) {
            const p = this.ctl.has("neoRandom") ? 0.06 : cl2(0.02 + 0.3 * drive[k] + 2 * this.val[k], 0, 0.5);
            if (r() < p) {
              this.uses[k]++;
              this.pending.push({ t, hook: HOOKS[k], arg: k === 1 ? bestSite : 60 });
              this.lastUse = { k, t, base: k === 0 ? -sleepDebt : -hunger };
              break;
            }
          }
        }
        /** sandbox reply */
        grant(req, ok) {
          if (ok) {
            this.granted[HOOKS.indexOf(req.hook)]++;
            if (req.hook === "shade") this.shadeUntil = req.t + req.arg;
          }
        }
        state() {
          return { val: [...this.val], uses: [...this.uses], granted: [...this.granted], pending: this.pending.length };
        }
      };
    }
  });

  // ../../creatures/001/organism/organism.ts
  function mulberry2(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.getState = () => a;
    f.setState = (x) => {
      a = x >>> 0;
    };
    return f;
  }
  function digamma(x) {
    let r = 0;
    while (x < 6) {
      r -= 1 / x;
      x += 1;
    }
    const f = 1 / (x * x);
    return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132))));
  }
  function betaIG(a, b) {
    const n = a + b, m = a / n;
    const H = -(m * Math.log(m) + (1 - m) * Math.log(1 - m));
    const EH = -(m * (digamma(a + 1) - digamma(n + 1)) + (1 - m) * (digamma(b + 1) - digamma(n + 1)));
    return Math.max(0, H - EH);
  }
  function snapEnc(x, skip) {
    if (x === null || typeof x !== "object") return typeof x === "function" ? x.getState ? { __rng: x.getState() } : void 0 : x;
    if (ArrayBuffer.isView(x)) return { __ta: x.constructor.name, v: Array.from(x) };
    if (Array.isArray(x)) return x.map((e) => snapEnc(e, skip));
    const o = {};
    for (const k of Object.keys(x)) {
      if (skip.has(k)) continue;
      const v = x[k];
      if (typeof v === "function" && !v.getState) continue;
      o[k] = snapEnc(v, skip);
    }
    return o;
  }
  function snapVal(cur, v, skip) {
    if (v === null || typeof v !== "object") return v;
    if (v.__rng !== void 0) {
      if (typeof cur === "function" && cur.setState) {
        cur.setState(v.__rng);
        return cur;
      }
      const f = mulberry2(0);
      f.setState(v.__rng);
      return f;
    }
    if (v.__ta) {
      const T = TA[v.__ta];
      if (cur && cur.constructor === T && cur.length === v.v.length) {
        cur.set(v.v);
        return cur;
      }
      return T.from(v.v);
    }
    if (Array.isArray(v)) {
      if (Array.isArray(cur)) {
        const out = v.map((e, i) => snapVal(cur[i], e, skip));
        cur.length = 0;
        cur.push(...out);
        return cur;
      }
      return v.map((e) => snapVal(void 0, e, skip));
    }
    if (cur && typeof cur === "object" && !Array.isArray(cur) && !ArrayBuffer.isView(cur)) {
      snapDec(cur, v, skip);
      return cur;
    }
    const o = {};
    for (const k of Object.keys(v)) o[k] = snapVal(void 0, v[k], skip);
    return o;
  }
  function snapDec(target, st, skip) {
    for (const k of Object.keys(st)) {
      if (skip.has(k)) continue;
      target[k] = snapVal(target[k], st[k], skip);
    }
  }
  function qgt(th) {
    const st = (t) => {
      const q = new Q3();
      q.prepare(t);
      return [q.re.slice(), q.im.slice()];
    };
    const h = 1e-4;
    const [r0, i0] = st(th);
    const dR = [], dI = [];
    for (let a = 0; a < 3; a++) {
      const tp = th.slice(), tm = th.slice();
      tp[a] += h;
      tm[a] -= h;
      const [rp, ip2] = st(tp), [rm, im] = st(tm);
      dR.push(rp.map((v, k) => (v - rm[k]) / (2 * h)));
      dI.push(ip2.map((v, k) => (v - im[k]) / (2 * h)));
    }
    const ip = (ar, ai, br, bi) => {
      let re = 0, imv = 0;
      for (let k = 0; k < 8; k++) {
        re += ar[k] * br[k] + ai[k] * bi[k];
        imv += ar[k] * bi[k] - ai[k] * br[k];
      }
      return [re, imv];
    };
    const g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], berry = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const [xr, xi] = ip(dR[a], dI[a], dR[b], dI[b]);
      const [ar, ai] = ip(dR[a], dI[a], r0, i0);
      const [br, bi] = ip(r0, i0, dR[b], dI[b]);
      const cr = ar * br - ai * bi, ci = ar * bi + ai * br;
      g[a][b] = xr - cr;
      berry[a][b] = -2 * (xi - ci);
    }
    return { g, berry, trace: g[0][0] + g[1][1] + g[2][2] };
  }
  var clamp, IG0, REGIONS, R0, RN, NNEU, INHIB, CP, TA, Q3, Health, NMOD, MW, msoftmax, margmax, mdot, Lin, RLS, Kal, Mind, TUNE, MT31, MT, LTC_TAU0, CX, LTC_INIT, LTC_LEARNED, M35, M36, M37, M38, M39, MIND_DEFAULT, ge35, ge36, is37, is38, is39, is40, M40, V40OPTS, hBin, gaussQ, betaSD, SD0, SITES, Organism;
  var init_organism = __esm({
    "../../creatures/001/organism/organism.ts"() {
      init_define_process_env();
      init_affect();
      init_develop();
      init_v40mods();
      clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
      IG0 = betaIG(1, 1);
      REGIONS = [["SENS", 16], ["THAL", 16], ["CTX", 64], ["HIP", 32], ["STR", 32], ["HYP", 16], ["VTA", 6], ["RAPHE", 6], ["LC", 6], ["BF", 6], ["INS", 8], ["SCN", 8], ["MOT", 8], ["ENS", 48]];
      R0 = {};
      RN = {};
      {
        let o = 0;
        for (const [n, k] of REGIONS) {
          R0[n] = o;
          RN[n] = k;
          o += k;
        }
      }
      NNEU = REGIONS.reduce((s, r) => s + r[1], 0);
      INHIB = (i) => i >= R0.CTX + 52 && i < R0.CTX + 64 || i >= R0.STR && i < R0.STR + RN.STR || i >= R0.ENS + 36 && i < R0.ENS + 48;
      CP = [
        ["SENS", "THAL", 0.25],
        ["THAL", "CTX", 0.12],
        ["CTX", "THAL", 0.06],
        ["CTX", "CTX", 0.1],
        ["CTX", "HIP", 0.06],
        ["HIP", "CTX", 0.06],
        ["HIP", "HIP", 0.05],
        ["CTX", "STR", 0.08],
        ["STR", "MOT", 0.15],
        ["CTX", "MOT", 0.05],
        ["HYP", "VTA", 0.2],
        ["HYP", "LC", 0.15],
        ["HYP", "HYP", 0.1],
        ["INS", "LC", 0.25],
        ["INS", "CTX", 0.06],
        ["INS", "HYP", 0.15],
        ["VTA", "STR", 0.1],
        ["LC", "CTX", 0.08],
        ["RAPHE", "CTX", 0.05],
        ["BF", "CTX", 0.06],
        ["BF", "HIP", 0.1],
        ["SCN", "HYP", 0.25],
        ["SCN", "RAPHE", 0.15],
        ["CTX", "INS", 0.06],
        ["ENS", "ENS", 0.12],
        ["ENS", "HYP", 0.05]
      ];
      TA = { Float32Array, Float64Array, Int32Array, Uint8Array, Uint32Array, Int8Array, Uint16Array, Int16Array };
      Q3 = class {
        re = new Float64Array(8);
        im = new Float64Array(8);
        ext = null;
        constructor() {
          this.re[0] = 1;
        }
        reset() {
          this.re.fill(0);
          this.im.fill(0);
          this.re[0] = 1;
          this.ext = null;
        }
        ry(q, t) {
          const c = Math.cos(t / 2), s = Math.sin(t / 2), m = 1 << q;
          for (let i = 0; i < 8; i++) if (!(i & m)) {
            const j = i | m;
            const a = this.re[i], b = this.re[j], ai = this.im[i], bi = this.im[j];
            this.re[i] = c * a - s * b;
            this.re[j] = s * a + c * b;
            this.im[i] = c * ai - s * bi;
            this.im[j] = s * ai + c * bi;
          }
        }
        rz(q, t) {
          const m = 1 << q;
          for (let i = 0; i < 8; i++) {
            const ph = i & m ? t / 2 : -t / 2;
            const c = Math.cos(ph), s = Math.sin(ph);
            const a = this.re[i], b = this.im[i];
            this.re[i] = a * c - b * s;
            this.im[i] = a * s + b * c;
          }
        }
        cx(c, t) {
          const mc = 1 << c, mt = 1 << t;
          for (let i = 0; i < 8; i++) if (i & mc && !(i & mt)) {
            const j = i | mt;
            let x = this.re[i];
            this.re[i] = this.re[j];
            this.re[j] = x;
            x = this.im[i];
            this.im[i] = this.im[j];
            this.im[j] = x;
          }
        }
        probs() {
          if (this.ext) return this.ext.slice();
          const p = [];
          for (let k = 0; k < 8; k++) p.push(this.re[k] ** 2 + this.im[k] ** 2);
          return p;
        }
        measure(u) {
          const p = this.probs();
          let k = 0;
          for (; k < 7; k++) {
            u -= p[k];
            if (u < 0) break;
          }
          return k;
        }
        prepare(th) {
          this.reset();
          for (let q = 0; q < 3; q++) this.ry(q, th[q]);
          this.cx(0, 1);
          this.cx(1, 2);
          for (let q = 0; q < 3; q++) this.rz(q, th[q] * 0.7);
        }
      };
      Health = class {
        rctCut;
        aptCut;
        W = 512;
        last = -1;
        run = 0;
        win = [];
        fails = 0;
        n = 0;
        constructor(minEntropy) {
          this.rctCut = Math.ceil(1 + 30 / minEntropy);
          const p = Math.pow(2, -minEntropy);
          const z = 5;
          this.aptCut = Math.ceil(this.W * p + z * Math.sqrt(this.W * p * (1 - p)) + 0.5);
        }
        push(s) {
          this.n++;
          if (s === this.last) {
            this.run++;
            if (this.run >= this.rctCut) {
              this.fails++;
              this.run = 1;
            }
          } else {
            this.last = s;
            this.run = 1;
          }
          this.win.push(s);
          if (this.win.length === this.W) {
            const c = this.win.filter((x) => x === this.win[0]).length;
            if (c >= this.aptCut) this.fails++;
            this.win = [];
          }
        }
      };
      NMOD = 4;
      MW = 13;
      msoftmax = (z, beta = 1) => {
        const m = Math.max(...z);
        const e = z.map((v) => Math.exp(beta * (v - m)));
        const s = e.reduce((a, b) => a + b, 0);
        return e.map((v) => v / s);
      };
      margmax = (a) => {
        let b = 0;
        for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i;
        return b;
      };
      mdot = (w, x, off = 0) => {
        let s = 0;
        for (let i = 0; i < x.length; i++) s += w[off + i] * x[i];
        return s + w[off + x.length];
      };
      Lin = class {
        constructor(nOut, nIn) {
          this.nOut = nOut;
          this.nIn = nIn;
          this.W = new Float64Array(nOut * (nIn + 1));
        }
        nOut;
        nIn;
        W;
        out(x) {
          const z = [];
          for (let k = 0; k < this.nOut; k++) z.push(mdot(this.W, x, k * (this.nIn + 1)));
          return z;
        }
        learn(x, target, lr, beta = 3) {
          const p = msoftmax(this.out(x), beta);
          for (let k = 0; k < this.nOut; k++) {
            const g = (k === target ? 1 : 0) - p[k];
            const o = k * (this.nIn + 1);
            for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i];
            this.W[o + this.nIn] += lr * g;
          }
        }
        regress(x, y, lr) {
          const z = this.out(x);
          let n = 1;
          for (let i = 0; i < x.length; i++) n += x[i] * x[i];
          for (let k = 0; k < this.nOut; k++) {
            const g = (y[k] - z[k]) / n;
            const o = k * (this.nIn + 1);
            for (let i = 0; i < this.nIn; i++) this.W[o + i] += lr * g * x[i];
            this.W[o + this.nIn] += lr * g;
          }
        }
      };
      RLS = class {
        constructor(nIn, lam) {
          this.lam = lam;
          this.n = nIn + 1;
          this.w = new Float64Array(this.n);
          this.P = new Float64Array(this.n * this.n);
          for (let i = 0; i < this.n; i++) this.P[i * this.n + i] = 100;
        }
        lam;
        w;
        P;
        n;
        out(x) {
          let z = this.w[this.n - 1];
          for (let i = 0; i < this.n - 1; i++) z += this.w[i] * x[i];
          return z;
        }
        fit(x, y) {
          const n = this.n, u = new Float64Array(n);
          for (let i = 0; i < n - 1; i++) u[i] = x[i];
          u[n - 1] = 1;
          const Pu = new Float64Array(n);
          let den = this.lam;
          for (let i = 0; i < n; i++) {
            let a = 0;
            for (let j = 0; j < n; j++) a += this.P[i * n + j] * u[j];
            Pu[i] = a;
            den += u[i] * a;
          }
          const e = y - this.out(x);
          for (let i = 0; i < n; i++) this.w[i] += Pu[i] / den * e;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) this.P[i * n + j] = (this.P[i * n + j] - Pu[i] * Pu[j] / den) / this.lam;
        }
      };
      Kal = class {
        constructor(q = 2e-3, qd = 4e-4, r = 0.09) {
          this.q = q;
          this.qd = qd;
          this.r = r;
        }
        q;
        qd;
        r;
        x = [0, 0];
        P = [[1, 0], [0, 1]];
        adapt = 0;
        predict(u = 0) {
          const [p, d] = this.x;
          this.x = [p + d + u, d];
          const P = this.P;
          this.P = [[P[0][0] + 2 * P[0][1] + P[1][1] + this.q, P[0][1] + P[1][1]], [P[0][1] + P[1][1], P[1][1] + this.qd]];
          return this.x[0];
        }
        update(z) {
          const S = this.P[0][0] + this.r;
          const nis = (z - this.x[0]) ** 2 / S;
          const infl = nis > 6 ? 3 : 1;
          this.P[0][0] *= infl;
          this.P[1][1] *= infl;
          const S2 = this.P[0][0] + this.r, K0 = this.P[0][0] / S2, K1 = this.P[0][1] / S2, e = z - this.x[0];
          this.x = [this.x[0] + K0 * e, this.x[1] + K1 * e];
          const P = this.P;
          this.P = [[(1 - K0) * P[0][0], (1 - K0) * P[0][1]], [P[1][0] - K1 * P[0][0], P[1][1] - K1 * P[0][1]]];
          if (this.adapt > 0) {
            const a = this.adapt;
            this.r = Math.max(5e-3, (1 - a) * this.r + a * (e * e - S + this.r));
            this.q = Math.max(1e-5, (1 - a) * this.q + a * (K0 * e) ** 2);
            this.qd = Math.max(1e-7, (1 - a) * this.qd + a * (K1 * e) ** 2);
          }
          return nis;
        }
      };
      Mind = class {
        rate = [];
        amp = [0, 0, 0, 0];
        ampPrev = [0, 0, 0, 0];
        post = [];
        cls = [];
        sal = [0, 0, 0, 0];
        win = -1;
        ign = 0;
        ignitions = 0;
        bc = new Float64Array(8);
        bcOut = new Float64Array(8);
        att = [1, 1, 1, 1];
        Wq = new Float64Array(4 * 4 * 4);
        lastQ = null;
        act = new Lin(4, 8);
        recv = new Lin(4, 8);
        rep = new Lin(4, 8);
        assoc = new Lin(4, 26);
        meta = new Float64Array(5);
        conf = 0.5;
        margin = 0;
        lastAct = -1;
        action = -1;
        actP = [0.25, 0.25, 0.25, 0.25];
        proto = [];
        recon = [];
        percept = [];
        td = new Float64Array(16);
        pp = new Lin(16, 65);
        pred = new Float64Array(16);
        ppMean = new Float64Array(16);
        ppErr = 0;
        ctxPrev = new Float64Array(65);
        af = 0;
        afTarget = 0;
        drift = 0;
        afObs = 0;
        kal = new Kal();
        other = new Kal();
        afErr = 0;
        astU = 0;
        phase = [0, 1.5, 3, 4.5];
        K = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        co = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        mAvg = [0, 0, 0, 0];
        plv = [];
        wv = new Float64Array(53);
        el = new Float64Array(53);
        V = 0;
        Vprev = 0;
        tdErr = 0;
        arm = 0;
        gTrue = 1;
        gHat = 1;
        efference = 0;
        dArmPred = 0;
        dArmObs = 0;
        push = 0;
        motor = 0;
        intero = new Lin(1, 5);
        interoBuf = [];
        glcPred = 0;
        // v3.5: reward is a setter so the actor knows a reward event happened (policy-gradient credit to the last decision)
        _rew = 0;
        rewSet = false;
        get rew() {
          return this._rew;
        }
        set rew(v) {
          this._rew = v;
          this.rewSet = true;
        }
        meta2 = new Float64Array(8);
        confF = [0, 0, 0, 0, 0, 0, 0, 1];
        pgX = null;
        pgA = -1;
        pgP = [0.25, 0.25, 0.25, 0.25];
        rbar = 0;
        pbar = [0.25, 0.25, 0.25, 0.25];
        interoBuf2 = [];
        rls = new RLS(5, M35.rlsLam);
        reVar = [0.1, 0.1, 0.1, 0.1];
        tdA = [0, 0, 0, 0];
        tdB = [0, 0, 0, 0];
        pr2L = [0, 0, 0, 0];
        meta3 = new Float64Array(10);
        tdW = [0.5, 0.5, 0.5, 0.5];
        buL = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        tdL = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        // v3.6 learned top-down precision
        cost = 0;
        prevC = -1;
        epi = [];
        replays = 0;
        g = null;
        Tm = new Int16Array(64).fill(-1);
        Qmf = new Float64Array(64);
        sweeps = 0;
        constructor(r) {
          for (let m = 0; m < NMOD; m++) {
            this.rate.push(new Float64Array(MW));
            this.post.push([0.25, 0.25, 0.25, 0.25]);
            this.cls.push(new Lin(4, MW));
            this.recon.push(new Lin(4, MW));
            this.proto.push([0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((j) => j === k ? 0.5 : 0.1)));
            this.percept.push([0, 0, 0, 0]);
            this.plv.push([0, 1, 2, 3].map(() => ({ c: 0, s: 0 })));
          }
          for (let i = 0; i < this.meta.length; i++) this.meta[i] = 0;
          void r;
        }
        // one tick: called by Organism.step after the spiking substeps
        step(g) {
          this.g = g;
          const o = g.o, ne = g.nm.NE.E, ach = g.nm.ACh.E;
          this.cost = 0;
          const v35 = ge35(o.mind ?? MIND_DEFAULT), v36 = ge36(o.mind ?? MIND_DEFAULT);
          if (v35 && this.rewSet && this.pgX && this.pgA >= 0 && g.learn) {
            const adv = this._rew - this.rbar;
            this.rbar += 0.05 * (this._rew - this.rbar);
            const W = this.act.W, n = this.act.nIn + 1;
            for (let k = 0; k < 4; k++) this.pbar[k] += 0.02 * (this.pgP[k] - this.pbar[k]);
            const Lb = this.pgP.reduce((a2, p, j) => a2 + p * Math.log(this.pbar[j] + 1e-9), 0);
            for (let k = 0; k < 4; k++) {
              const gk = M35.pgLr * adv * ((k === this.pgA ? 1 : 0) - this.pgP[k]) - M35.entK * this.pgP[k] * (Math.log(this.pbar[k] + 1e-9) - Lb);
              for (let i = 0; i < 8; i++) W[k * n + i] += gk * this.pgX[i];
              W[k * n + 8] += gk;
            }
          }
          this.rewSet = false;
          const c34 = o.cortex !== "v31";
          for (let m = 0; m < NMOD; m++) this.ampPrev[m] = this.amp[m];
          for (let m = 0; m < NMOD; m++) {
            let s = 0;
            for (let j = 0; j < MW; j++) {
              const ix = R0.CTX + m * MW + j, v = g.rate[ix];
              this.rate[m][j] = c34 ? CX.norm * (v - g.rateAvg[ix]) : v;
              s += v;
            }
            this.amp[m] = s / MW;
            this.post[m] = msoftmax(this.cls[m].out(this.rate[m]), 3);
            const bu = this.recon[m].out(this.rate[m]);
            const pm = this.post[m];
            const tdv = [0, 1, 2, 3].map((j) => pm.reduce((a2, p, k) => a2 + p * this.proto[m][k][j], 0));
            const pr = Math.max(...pm);
            if (v35 && !o.topdownLesion) {
              const lg = this.cls[m].out(this.rate[m]);
              const ps0 = msoftmax(lg, M35.tdBeta);
              const s2 = Math.max(0.01, M35.tdS * this.reVar[m]);
              const ll = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a2, q, j) => a2 + (bu[j] - q) ** 2, 0) / (2 * s2));
              const mx = Math.max(...ll);
              const ez = ll.map((v) => Math.exp(v - mx));
              const zs = ez.reduce((a2, v) => a2 + v, 0);
              const ps = ez.map((v) => v / zs);
              const pr2 = Math.max(...ps);
              for (let j = 0; j < 4; j++) tdv[j] = ps.reduce((a2, p, k) => a2 + p * this.proto[m][k][j], 0);
              const v37t = is37(o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0;
              if (v37t) this.pr2L[m] = pr2;
              const w = v37t ? 1 / (1 + Math.exp(-(this.tdA[m] + this.tdB[m] * (pr2 - 0.5) * 4))) : v36 ? Math.max(0, Math.min(1, this.tdW[m])) : Math.min(1, M35.tdGain * pr2);
              this.percept[m] = bu.map((b, j) => (1 - w) * b + w * tdv[j]);
              if (is39(o.mind ?? MIND_DEFAULT) && M39.tdIter > 0) for (let it = 0; it < M39.tdIter; it++) {
                const l2 = ps0.map((p, k) => M35.tdPrior * Math.log(p + 1e-9) - this.proto[m][k].reduce((a2, q, j) => a2 + (this.percept[m][j] - q) ** 2, 0) / (2 * s2));
                const m2 = Math.max(...l2);
                const e2 = l2.map((v) => Math.exp(v - m2));
                const z2 = e2.reduce((a2, v) => a2 + v, 0);
                for (let j = 0; j < 4; j++) tdv[j] = e2.reduce((a2, v, k) => a2 + v / z2 * this.proto[m][k][j], 0);
                this.percept[m] = bu.map((b2, j) => (1 - w) * b2 + w * tdv[j]);
              }
              if (v36) {
                this.buL[m] = bu.slice();
                this.tdL[m] = tdv.slice();
              }
            } else this.percept[m] = o.topdownLesion ? bu : bu.map((b, j) => (1 - pr) * b + pr * tdv[j]);
            for (let j = 0; j < 4; j++) this.td[m * 4 + j] = o.topdownLesion ? 0 : 0.25 * pr * tdv[j];
          }
          const mt = c34 ? MT : MT31;
          const thr = mt.ignThr * (1.3 - 0.6 * Math.min(1, ne));
          let best = -1, bs = 0;
          const thc = [0, 0, 0, 0];
          if (v35) for (let m = 0; m < NMOD; m++) {
            let mx = 0, sm = 0;
            for (let j = 0; j < 4; j++) {
              const v = M35.salSens ? g.rate[R0.SENS + m * 4 + j] : g.rate[R0.THAL + m * 4 + j];
              mx = Math.max(mx, v);
              sm += v;
            }
            thc[m] = M35.salK * (mx - sm / 4);
          }
          for (let m = 0; m < NMOD; m++) {
            this.sal[m] = Math.max(0, (v35 ? thc[m] : this.amp[m]) - mt.ampBase * this.ampPrev[m]) * this.att[m] * (mt.salOff + Math.max(...this.post[m])) ** mt.confExp * (m === this.win ? mt.hyst : 1);
            if (this.sal[m] > bs) {
              bs = this.sal[m];
              best = m;
            }
          }
          const prevWin = this.win;
          this.bc.fill(0);
          if (o.gwLesion) {
            this.win = -1;
            for (let m = 0; m < NMOD; m++) for (let k = 0; k < 4; k++) this.bc[4 + k] += this.post[m][k] / NMOD;
            this.bc.fill(0.25, 0, 4);
          } else if (bs > thr) {
            this.win = best;
            this.bc[best] = 1;
            for (let k = 0; k < 4; k++) this.bc[4 + k] = this.post[best][k];
          } else this.win = -1;
          if (prevWin >= 0 && this.win >= 0 && this.win !== prevWin) this.lastQ = [prevWin, this.prevC, this.win];
          this.prevC = this.win >= 0 ? margmax(this.post[this.win]) : -1;
          this.ign = this.win >= 0 && this.win !== prevWin ? 1 : 0;
          this.ignitions += this.ign;
          if (this.ign) {
            g.predErr += 0.15;
            this.cost += 4e-4;
          }
          for (let i = 0; i < 8; i++) this.bcOut[i] = o.bcLesion ? 0 : this.bc[i];
          this.att = [1, 1, 1, 1];
          if (!o.seqLesion && this.win >= 0) {
            const c = margmax(this.post[this.win]);
            for (let m = 0; m < NMOD; m++) if (m !== this.win) this.att[m] = 1 + 2 * Math.max(0, this.Wq[(this.win * 4 + c) * 4 + m]);
          }
          const z = this.act.out(this.bc);
          this.actP = msoftmax(z, 2 + 6 * Math.min(1, g.nm.DA.E + 0.2));
          const srt = this.actP.slice().sort((a2, b) => b - a2);
          this.margin = srt[0] - srt[1];
          this.lastAct = this.action;
          let u = g.r();
          let a = 0;
          for (; a < 3; a++) {
            u -= this.actP[a];
            if (u < 0) break;
          }
          this.action = a;
          if (v35) {
            const wm = this.win >= 0 ? this.win : margmax(this.amp);
            this.confF = [this.actP[this.action], this.margin, Math.max(...this.post[wm]), 4 * this.amp[wm], this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1];
            if (is37(o.mind ?? MIND_DEFAULT)) {
              this.confF = this.confF.concat([this.win >= 0 ? 1 : 0]);
              if (is39(o.mind ?? MIND_DEFAULT) && M39.evQ > 0) {
                const sv = Array.from(g.sens.slice(wm * 4, wm * 4 + 4)).sort((x, y) => y - x);
                this.confF.push(M39.evQ * (sv[0] - sv[1]));
              }
              this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta3[i], 0)));
            } else this.conf = 1 / (1 + Math.exp(-this.confF.reduce((s, v, i) => s + v * this.meta2[i], 0)));
          } else {
            const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, ne, g.S, 1];
            this.conf = 1 / (1 + Math.exp(-f.reduce((s, v, i) => s + v * this.meta[i], 0)));
          }
          if (v35 && this.win >= 0) {
            this.pgX = Float64Array.from(this.bc);
            this.pgA = this.action;
            this.pgP = this.actP.slice();
          }
          for (let i = 0; i < 16; i++) {
            this.ppMean[i] += 0.05 * (g.sens[i] - this.ppMean[i]);
          }
          const P = o.ppLesion ? Array.from(this.ppMean) : this.pp.out(this.ctxPrev);
          let e = 0;
          for (let i = 0; i < 16; i++) {
            this.pred[i] = P[i];
            e += (g.sens[i] - P[i]) ** 2;
          }
          this.ppErr = e / 16;
          if (!o.ppLesion && !o.ppFreeze && g.learn) this.pp.regress(this.ctxPrev, Array.from(g.sens), 0.5);
          g.predErr += 0.3 * Math.min(1, this.ppErr);
          for (let i = 0; i < 64; i++) this.ctxPrev[i] = g.rate[R0.CTX + i];
          this.ctxPrev[64] = 0;
          this.drift += 4e-3 * g.gauss() - 2e-3 * this.drift;
          this.af += this.astU + this.drift + 0.03 * (0.5 + ne) * g.gauss();
          this.afObs = this.af + 0.3 * g.gauss();
          this.kal.adapt = v36 && !o.astLesion ? M36.akA : 0;
          this.kal.predict(this.astU);
          this.kal.update(this.afObs);
          this.astU = o.astLesion ? -0.5 * (this.afObs - this.afTarget) : -(this.kal.x[0] - this.afTarget) - this.kal.x[1];
          this.afErr = (this.af - this.afTarget) ** 2;
          for (let m = 0; m < NMOD; m++) this.mAvg[m] += 0.1 * (this.amp[m] - this.mAvg[m]);
          for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) {
            this.co[m][n] += 0.25 * ((this.amp[m] - this.mAvg[m]) * (this.amp[n] - this.mAvg[n]) - this.co[m][n]);
            this.K[m][n] = o.fieldLesion || m === n ? 0 : 40 * Math.max(0, this.co[m][n]) / (2e-3 + Math.sqrt(Math.abs(this.co[m][m] * this.co[n][n]))) * (0.5 + ach) * 0.05;
          }
          for (let s = 0; s < 10; s++) {
            const d = [0, 0, 0, 0];
            for (let m = 0; m < NMOD; m++) {
              d[m] = 0.6 + 0.05 * m + 0.15 * g.gauss();
              for (let n = 0; n < NMOD; n++) d[m] += this.K[m][n] * Math.sin(this.phase[n] - this.phase[m]);
            }
            for (let m = 0; m < NMOD; m++) this.phase[m] += 0.1 * d[m];
          }
          for (let m = 0; m < NMOD; m++) for (let n = 0; n < NMOD; n++) {
            const dp = this.phase[m] - this.phase[n];
            const P2 = this.plv[m][n];
            P2.c += 0.2 * (Math.cos(dp) - P2.c);
            P2.s += 0.2 * (Math.sin(dp) - P2.s);
          }
          const xv = [];
          for (let m = 0; m < NMOD; m++) for (let j = 0; j < MW; j++) xv.push(this.rate[m][j]);
          this.Vprev = this.V;
          this.V = mdot(this.wv, xv);
          this.tdErr = this.rew + 0.9 * this.V - this.Vprev;
          if (g.learn) {
            let nn = 1;
            for (let i = 0; i < 53; i++) nn += this.el[i] * this.el[i];
            const lr = (v35 ? M35.ualLr : 0.3) * Math.max(-1, Math.min(1, this.tdErr)) / nn;
            for (let i = 0; i < 53; i++) this.wv[i] += lr * this.el[i];
          }
          const lam = o.traceLesion ? 0 : v35 ? M35.ualLam : 0.8;
          for (let i = 0; i < 52; i++) this.el[i] = lam * this.el[i] + xv[i];
          this.el[52] = lam * this.el[52] + 1;
          this._rew = 0;
          this.dArmPred = o.efferenceLesion ? 0 : (o.fwdLesion ? 1 : this.gHat) * this.efference;
          const dA = this.gTrue * this.efference + this.push;
          this.arm = Math.max(-2, Math.min(2, this.arm + dA));
          this.dArmObs = dA + 0.02 * g.gauss();
          if (!o.efferenceLesion && !o.fwdLesion && g.learn && Math.abs(this.efference) > 1e-3 && this.push === 0) this.gHat += 0.5 * (this.dArmObs - this.gHat * this.efference) * this.efference / (this.efference ** 2 + 0.01);
          this.motor = Math.abs(this.efference);
          this.efference = 0;
          this.push = 0;
          const xi = [g.blood.glc / 3, g.gut.glc / 5, g.insulin, g.glucagon, g.motility];
          if (v35) {
            this.glcPred = g.blood.glc + 3 * this.rls.out(xi);
            this.interoBuf2.push({ x: xi, at: g.t + 30, g0: g.blood.glc });
            while (this.interoBuf2.length && this.interoBuf2[0].at <= g.t) {
              const b = this.interoBuf2.shift();
              if (g.learn) this.rls.fit(b.x, (g.blood.glc - b.g0) / 3);
            }
          } else {
            this.glcPred = 3 * this.intero.out(xi)[0];
            this.interoBuf.push({ x: xi, at: g.t + 30 });
            while (this.interoBuf.length && this.interoBuf[0].at <= g.t) {
              const b = this.interoBuf.shift();
              if (g.learn) this.intero.regress(b.x, [g.blood.glc / 3], 0.3);
            }
          }
          if (g.learn && o.replay !== "none" && this.epi.length) {
            const n = g.stage === 0 ? 1 : g.stage >= 2 && g.stage <= 3 ? 6 : 0;
            for (let k = 0; k < n; k++) {
              const e2 = this.epi[Math.floor(g.r() * this.epi.length)];
              this.act.learn(e2.x, e2.y, 0.05);
              this.replays++;
            }
            this.cost += 1e-5 * n;
          }
          this.cost += 2e-5 * (this.ign + 1);
        }
        // ---- task-facing learning signals (feedback, as a trainer or the world would give) ----
        teach(m, label, clean) {
          if (this.g && this.g.o.eprop) this.g.epropLearn(m, label, clean ?? [0, 1, 2, 3].map((j) => j === label ? 1 : 0));
          const lr = 0.08 * (0.5 + 0.5 * Math.min(1, this.g ? this.g.nm.ACh.E : 0.3));
          this.cls[m].learn(this.rate[m], label, lr);
          const x = clean ?? [0, 1, 2, 3].map((j) => j === label ? 1 : 0);
          {
            const bu0 = this.recon[m].out(this.rate[m]);
            let e2 = 0;
            for (let j = 0; j < 4; j++) e2 += (x[j] - bu0[j]) ** 2;
            this.reVar[m] += 0.05 * (e2 / 4 - this.reVar[m]);
          }
          if (this.g && ge36(this.g.o.mind ?? MIND_DEFAULT) && !this.g.o.topdownLesion) {
            let num = 0, den = 1e-3;
            for (let j = 0; j < 4; j++) {
              const dlt = this.tdL[m][j] - this.buL[m][j];
              num += (x[j] - this.percept[m][j]) * dlt;
              den += dlt * dlt;
            }
            this.tdW[m] = Math.max(0, Math.min(1, this.tdW[m] + M36.tdLr * num / den));
            if (is37(this.g.o.mind ?? MIND_DEFAULT) && M37.tdLr2 > 0) {
              const z = this.tdA[m] + this.tdB[m] * (this.pr2L[m] - 0.5) * 4, wv = 1 / (1 + Math.exp(-z)), gz = num / den * wv * (1 - wv);
              this.tdA[m] += M37.tdLr2 * gz;
              this.tdB[m] += M37.tdLr2 * gz * (this.pr2L[m] - 0.5) * 4;
            }
          }
          this.recon[m].regress(this.rate[m], x, 0.2);
          for (let j = 0; j < 4; j++) this.proto[m][label][j] += 0.1 * (x[j] - this.proto[m][label][j]);
        }
        teachAction(label, lr = 0.15) {
          this.act.learn(this.bc, label, lr);
          this.epi.push({ x: Array.from(this.bc), y: label });
          if (this.epi.length > 300) this.epi.shift();
        }
        teachRecv(label) {
          this.recv.learn(this.bcOut, label, 0.15);
        }
        teachReport() {
          this.rep.learn(this.bcOut, this.action, 0.15);
        }
        teachConf(correct) {
          if (this.g && ge35(this.g.o.mind ?? MIND_DEFAULT)) {
            const e2 = (correct ? 1 : 0) - this.conf;
            let nn = 1;
            for (const v of this.confF) nn += v * v;
            if (this.confF.length >= 9) {
              for (let i = 0; i < this.confF.length; i++) this.meta3[i] += M35.confLr * e2 * this.confF[i] / nn * 4;
              return;
            }
            for (let i = 0; i < 8; i++) this.meta2[i] += M35.confLr * e2 * this.confF[i] / nn * 4;
            return;
          }
          const f = [this.margin, this.action === margmax(this.actP) ? 1 : 0, this.g ? this.g.nm.NE.E : 0.3, this.g ? this.g.S : 0.4, 1];
          const e = (correct ? 1 : 0) - this.conf;
          for (let i = 0; i < 5; i++) this.meta[i] += 0.3 * e * f[i];
        }
        rewardQuery(r) {
          if (!this.lastQ) return;
          const [w, c, m] = this.lastQ;
          const i = (w * 4 + c) * 4 + m;
          this.Wq[i] += 0.2 * (r - this.Wq[i]);
        }
        // model-based planning over a learned transition model (hippocampal sweeps); sweeps scale with intelligence level; model-free Q as the lesion control
        observe(s, a, s2, r) {
          this.Tm[s * 4 + a] = s2;
          const i = s * 4 + a;
          let mx = 0;
          for (let b = 0; b < 4; b++) mx = Math.max(mx, this.Qmf[s2 * 4 + b]);
          this.Qmf[i] += 0.3 * (r + 0.9 * mx - this.Qmf[i]);
        }
        plan(s, goal, level, modelFree, r) {
          const tie = (q) => {
            const m = Math.max(...q);
            const c = q.map((v, k) => v >= m - 1e-9 ? k : -1).filter((k) => k >= 0);
            return c[Math.floor(r() * c.length)];
          };
          if (modelFree) return tie([0, 1, 2, 3].map((a) => this.Qmf[s * 4 + a]));
          const V = new Float64Array(16);
          this.sweeps = 3 * level;
          for (let k = 0; k < this.sweeps; k++) for (let x = 0; x < 16; x++) {
            if (x === goal) {
              V[x] = 1;
              continue;
            }
            let m = 0;
            for (let a = 0; a < 4; a++) {
              const y = this.Tm[x * 4 + a];
              if (y >= 0) m = Math.max(m, 0.9 * V[y]);
            }
            V[x] = m;
          }
          this.cost += 1e-5 * this.sweeps * 16;
          return tie([0, 1, 2, 3].map((a) => {
            const y = this.Tm[s * 4 + a];
            return y < 0 ? 0.05 : y === goal ? 1 : 0.9 * V[y];
          }));
        }
        nParams() {
          let n = this.Wq.length + this.wv.length + this.meta.length + this.Qmf.length + this.Tm.length + 3 * 4 * 16;
          for (const l of [this.act, this.recv, this.rep, this.assoc, this.pp, ...this.cls, ...this.recon]) n += l.W.length;
          return n;
        }
        recvOut() {
          return margmax(this.recv.out(this.bcOut));
        }
        repOut() {
          return margmax(this.rep.out(this.bcOut));
        }
        binding(m, n) {
          const p = this.plv[m][n];
          return Math.hypot(p.c, p.s);
        }
      };
      TUNE = { thal: 0.1, ctxDrop: 0.35, st: 3, tc: 5, rec: 0.2, sensIn: 1.5, ltcAch: 1.5, ltcIn: 0.5, ltcNe: 0.5 };
      MT31 = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 };
      MT = { ignThr: 0.06, salOff: 0.6, hyst: 1.15, ampBase: 0, confExp: 1 };
      LTC_TAU0 = 1 / Math.log(1.25);
      CX = { tc: 1.2, tcSig: 0.55, tcSum: 6, ffI: 0.3, eI: 0.5, iE: 0.6, rec0: 0.05, recMax: 1.6, nmdaK: 0.9, aP: 0.02, aM: 0.021, rho: 0.12, hEta: 0.02, vEta: 2e-3, dev: 480, devAmp: 1, crit: 4, norm: 2.5, gluK: 3 };
      LTC_INIT = [Math.log(1 / Math.log(1.25)), 1.5, 0.5, 0.5];
      LTC_LEARNED = [1.3115, 1.4248, 0.4722, 0.5351];
      M35 = { tdPrior: 0, tdS: 1, entK: 1, rlsLam: 0.9995, tdBeta: 8, tdGain: 0.5, confLr: 0.2, pgLr: 0.3, xW: 2, xP: 0.05, featIt: 4, salK: 1, orxK: 1.2, salSens: 1, remAll: 1, remLr: 0.25, lrBase: 0.1, lrVol: 0.4, efeK: 0.6, efeTau: 200, efeVis: 0.5, ualLr: 0.3, ualLam: 0.8, interoLr: 0.3 };
      M36 = { neK: 0.1, tdLr: 0.05, akA: 0, lcThr: 2, lcDecay: 0.95, dendK: 0, dendVh: 0.5, dendVs: 0.15, schLam: 2, schDecay: 0.995, efeK: 2, igTau: 300, fbW: 0.2, fbN: 2, slowK: 0, slowTau: 60, visK: 1.5 };
      M37 = { slowK: 0.2, inhG: 10, dendK: 1, dendVh: 0.5, dendVs: 0.15, tdLr2: 0, bmW: 0, igTau: 300, dLr: 0.2, dTau: 240, depW: 1, fbW: 0.2, fbS: 1 };
      M38 = { efeC: 0.5, efeRef: 1, fK: 4, fSet: 400, thK: 1, thMin: 0.6, mMax: 180, fast: 1, ketSpare: 0, ketEx: 8e-4, ffaInh: 6, gngK: 2, protK: 2, ketK: 4 };
      M39 = { ketPS: 0.5, fCrit: 20, p3K: 3, mDeath: 60, lipE: 0.5, xsW: 0, xsSig: 0.5, tdIter: 0, evQ: 0, vK: 0 };
      try {
        const e9 = typeof process !== "undefined" ? define_process_env_default.V39TUNE : void 0;
        if (e9) Object.assign(M39, JSON.parse(e9));
      } catch {
      }
      try {
        const e = typeof process !== "undefined" ? define_process_env_default.V35TUNE : void 0;
        if (e) Object.assign(M35, JSON.parse(e));
        const e6 = typeof process !== "undefined" ? define_process_env_default.V36TUNE : void 0;
        if (e6) Object.assign(M36, JSON.parse(e6));
        const e7 = typeof process !== "undefined" ? define_process_env_default.V37TUNE : void 0;
        if (e7) Object.assign(M37, JSON.parse(e7));
        const e8 = typeof process !== "undefined" ? define_process_env_default.V38TUNE : void 0;
        if (e8) Object.assign(M38, JSON.parse(e8));
      } catch {
      }
      MIND_DEFAULT = (() => {
        try {
          const e = typeof process !== "undefined" ? define_process_env_default.ORG_MIND : void 0;
          return e === "v34" ? "v34" : e === "v35" ? "v35" : e === "v36" ? "v36" : e === "v37" ? "v37" : e === "v38" ? "v38" : e === "v39" ? "v39" : "v40";
        } catch {
          return "v40";
        }
      })();
      ge35 = (m) => m === "v35" || m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40";
      ge36 = (m) => m === "v36" || m === "v37" || m === "v38" || m === "v39" || m === "v40";
      is37 = (m) => m === "v37" || m === "v38" || m === "v39" || m === "v40";
      is38 = (m) => m === "v38" || m === "v39" || m === "v40";
      is39 = (m) => m === "v39" || m === "v40";
      is40 = (m) => m === "v40";
      M40 = { uK: 1, mK: 0.5, dreamC: 6, dreamLr: 0.75, tempSD: 0.25, turn: 0, busOut: 0.15, insK: 0.15, cautK: 0.25, simK: 0.3, markK: 0.05, affK: 0.5, forget: 0, eK: 0, tsK: 0 };
      try {
        const e40 = typeof process !== "undefined" ? define_process_env_default.V40TUNE : void 0;
        if (e40) Object.assign(M40, JSON.parse(e40));
      } catch {
      }
      V40OPTS = {};
      try {
        const e = typeof process !== "undefined" ? define_process_env_default.V40OPTS : void 0;
        if (e) V40OPTS = JSON.parse(e);
      } catch {
      }
      hBin = (q) => q <= 1e-6 || q >= 1 - 1e-6 ? 0 : -q * Math.log(q) - (1 - q) * Math.log(1 - q);
      gaussQ = (u) => Math.sqrt(-2 * Math.log(Math.max(1e-12, u()))) * Math.cos(2 * Math.PI * u());
      betaSD = (a, b) => {
        const n = a + b, m = a / n;
        return Math.sqrt(m * (1 - m) / (n + 1));
      };
      SD0 = betaSD(1, 1);
      SITES = 16;
      Organism = class {
        o;
        r;
        ent;
        t = 0;
        // neurons
        v = new Float32Array(NNEU);
        tau = new Float32Array(NNEU).fill(1 / Math.log(1.25));
        th = new Float32Array(NNEU);
        spk = new Uint8Array(NNEU);
        rate = new Float32Array(NNEU);
        xTr = new Float32Array(NNEU);
        yTr = new Float32Array(NNEU);
        syn;
        out = [];
        ext = new Float32Array(NNEU);
        regionRate = {};
        // plastic action values: hippocampal site cell -> striatal channel synapses (three-factor), cortical feature model (colour/shape)
        wSite = new Float32Array(SITES).fill(0.25);
        featC = new Float32Array(4).fill(0.15);
        featS = new Float32Array(4).fill(0.15);
        pTrue = new Float32Array(SITES);
        siteC = new Int8Array(SITES);
        siteS = new Int8Array(SITES);
        access = new Uint8Array(SITES);
        episodes = [];
        // metabolism (kJ); ledger
        gut = { glc: 4, fat: 2, prot: 1.5 };
        blood = { glc: 3, ffa: 1, aa: 2, ket: 0.2, urea: 0 };
        liverGly = 20;
        fat = 400;
        muscle = 120;
        brainGlc = 0.6;
        atp = 2;
        heat = 0;
        excreted = 0;
        eaten = 0;
        E0 = 0;
        leak = 0;
        // hormones / autonomic / heart
        insulin = 0.3;
        glucagon = 0.3;
        cortisol = 0.3;
        ghrelin = 0.3;
        leptin = 0.5;
        melatonin = 0;
        symp = 0.3;
        para = 0.4;
        hr = 70;
        perfusion = 1;
        pidI = 0;
        pidPrev = 0;
        // neuromodulators: vesicle pool P, extracellular E
        nm = { DA: { P: 1, E: 0.3 }, "5HT": { P: 1, E: 0.3 }, NE: { P: 1, E: 0.3 }, ACh: { P: 1, E: 0.3 }, Glu: { P: 1, E: 0.3 }, GABA: { P: 1, E: 0.3 }, eCB: { P: 0.5, E: 0.1 } };
        // sleep / circadian
        S = 0.4;
        orx = 0;
        scnPhase = 0;
        stage = 0;
        ultra = 0;
        awakeMin = 0;
        asleep = false;
        light = 1;
        // latent / curvature / interoception
        pc = [];
        z = [];
        kappa = 0;
        kHist = [];
        liminal = 0;
        predErr = 0;
        // quantum
        q = new Q3();
        qth = [0.5, 0.5, 0.5];
        qOut = 0;
        qgtTrace = 0;
        berry = 0;
        health = new Health(2.5);
        // behaviour
        level = 1;
        foraged = 0;
        rewards = 0;
        lastChoice = -1;
        choices = [];
        brainUse = 0;
        learn = true;
        stim = {};
        vagal = 0;
        ensRate = 0;
        motility = 0;
        hist = {};
        events = [];
        // v3.1: sensory lines (4 modalities x 4), synapse kinds + lesion mask, Mind layer, body integrity, ecology
        nmda = new Float32Array(NNEU);
        nmdaS = new Float32Array(NNEU);
        modAct = new Float32Array(4);
        dHat = new Float32Array(SITES);
        dDelta = 0;
        pk = new Uint8Array(0);
        thA = new Float32Array(NNEU);
        inn = [];
        devSens = new Float32Array(16);
        rd = mulberry2(1);
        rateAvg = new Float32Array(NNEU).fill(0.12);
        gate = LTC_LEARNED.slice();
        elig = new Float64Array(NNEU * 4);
        eligT = new Float64Array(NNEU * 4);
        gHist = [];
        // gate is reset to LTC_INIT in the constructor when o.eprop (training)
        sens = new Float32Array(16);
        kind;
        mask;
        mind;
        integrity = 1;
        tissue = 10;
        damageTaken = 0;
        cogCost = 0;
        pBase = new Float32Array(SITES);
        depl = new Float32Array(SITES);
        danger = new Float32Array(SITES);
        wAv = new Float32Array(SITES);
        visits = new Float32Array(SITES);
        lastVisit = new Float32Array(SITES);
        vol = 0;
        assocPH = new Float32Array(SITES).fill(0.5);
        // v3.6: light input, dendritic NMDA buffer, latent-cause value map, schema statistics, Beta beliefs for expected information gain
        deathCause = "";
        temper = -1;
        devGenome = null;
        devStats = null;
        devAff = null;
        devTarget = 0;
        devPruned = null;
        bus = null;
        selfM = null;
        curv = null;
        neo = null;
        marks = new Float32Array(SITES);
        lastRew = 0;
        devSlots = [];
        actEMA = new Float32Array(NNEU);
        cg = () => 1;
        intPrev = 1;
        affR = mulberry2(9);
        affect = null;
        lightIn = null;
        photo = [6, 18];
        dend = new Float32Array(NNEU);
        wAlt = new Float32Array(SITES).fill(0.25);
        lcLLR = 0;
        lcSwitches = 0;
        sN = new Float32Array(SITES);
        sR = new Float32Array(SITES);
        bA = new Float32Array(SITES).fill(1);
        bB = new Float32Array(SITES).fill(1);
        rule = null;
        qb = null;
        modLesion = [false, false, false, false];
        dead = false;
        lowGlc = 0;
        constructor(o) {
          if (Object.keys(V40OPTS).length) {
            o = { ...o };
            for (const k in V40OPTS) if (o[k] == null) o[k] = V40OPTS[k];
          }
          this.o = { noise: "quantum", replay: "full", entropy: "seeded", access: "half", ...o };
          this.r = mulberry2(o.seed * 7919 + 17);
          if (o.eprop) this.gate = LTC_INIT.slice();
          const er = mulberry2(o.seed * 104729 + 3);
          this.ent = this.o.entropy === "crypto" && typeof crypto !== "undefined" ? (() => {
            const b = new Uint32Array(1);
            crypto.getRandomValues(b);
            return b[0] / 4294967296;
          }) : er;
          const r = this.r;
          const pre = [], post = [], w = [], pl = [];
          const has = /* @__PURE__ */ new Set();
          if (o.develop ?? is40(o.mind ?? MIND_DEFAULT)) {
            const rg = mulberry2(o.seed * 5167 + 23);
            const gnm = o.devGenome ?? randomGenome(CP.length, REGIONS.length, rg);
            this.devGenome = gnm;
            const G2 = grow(CP, R0, RN, REGIONS.map((x) => x[0]), gnm, rg);
            this.devStats = { ...G2.stats, pruned: 0, sprouted: 0 };
            this.devAff = G2.affinity;
            this.devTarget = G2.stats.target;
            const base0 = pre.length;
            this.devSlots = G2.proj.map((pi, k) => [base0 + k, pi]);
            this.cg = (n) => cortexGene(gnm, CP.length, REGIONS.length, n);
            const regOf = (i) => REGIONS.find(([n]) => i >= R0[n] && i < R0[n] + RN[n])[0];
            G2.pre.forEach((i, k) => {
              const j = G2.post[k];
              const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35 * Math.min(2, 0.5 + 0.5 * G2.aff[k]);
              w.push(INHIB(i) ? -ln * 1.6 : ln);
              pre.push(i);
              post.push(j);
              pl.push(regOf(i) === "CTX" && regOf(j) === "CTX" && !INHIB(i) ? 1 : 0);
            });
          } else for (const [a, b, p] of CP) for (let i = R0[a]; i < R0[a] + RN[a]; i++) for (let j = R0[b]; j < R0[b] + RN[b]; j++) {
            if (i === j) continue;
            let pp = p;
            if (a === b && b === "CTX" && has.has(j * NNEU + i)) pp = Math.min(1, p * 4);
            if (r() < pp) {
              has.add(i * NNEU + j);
              pre.push(i);
              post.push(j);
              const ln = Math.exp(-0.7 + 0.9 * this.gauss(r)) * 0.35;
              w.push(INHIB(i) ? -ln * 1.6 : ln);
              pl.push(a === "CTX" && b === "CTX" && !INHIB(i) ? 1 : 0);
            }
          }
          const ra = mulberry2(o.seed * 31337 + 5);
          const kd = pre.map((p, k) => {
            const q = post[k];
            const cx = (i) => i >= R0.CTX && i < R0.CTX + 52;
            return cx(p) && cx(q) ? Math.floor((p - R0.CTX) / 13) === Math.floor((q - R0.CTX) / 13) ? 2 : 3 : 0;
          });
          for (let i = 0; i < 16; i++) {
            pre.push(R0.SENS + i);
            post.push(R0.THAL + i);
            w.push(TUNE.st);
            pl.push(0);
            kd.push(1);
          }
          const c34 = this.o.cortex !== "v31";
          for (let i = 0; i < 16; i++) {
            const m = Math.floor(i / 4);
            for (let c = 0; c < 3; c++) {
              const mm = this.o.topoScramble ? Math.floor(ra() * 4) : m;
              const j = R0.CTX + mm * 13 + Math.floor(ra() * 13);
              if (!c34) {
                pre.push(R0.THAL + i);
                post.push(j);
                w.push(TUNE.tc);
                pl.push(0);
                kd.push(1);
              }
            }
          }
          for (let m = 0; m < 4; m++) for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (a !== b && ra() < 0.25) {
            if (!c34) {
              pre.push(R0.CTX + m * 13 + a);
              post.push(R0.CTX + m * 13 + b);
              w.push(TUNE.rec);
              pl.push(1);
              kd.push(2);
            }
          }
          const pkk = pre.map(() => 0);
          if (c34) {
            const rc = mulberry2(o.seed * 7777 + 11);
            const E = (m, n) => R0.CTX + m * 13 + n, I = (m, k) => R0.CTX + 52 + 3 * m + k;
            const add = (a, b, ww, k, p2) => {
              pre.push(a);
              post.push(b);
              w.push(ww);
              pl.push(0);
              kd.push(k);
              pkk.push(p2);
            };
            for (let i = 0; i < 16; i++) {
              const m = Math.floor(i / 4), j = i % 4;
              const mm = this.o.topoScramble ? Math.floor(rc() * 4) : m;
              const perm = Array.from({ length: 13 }, (_, n) => n);
              if (this.o.topoScramble) perm.sort(() => rc() - 0.5);
              for (let n = 0; n < 13; n++) {
                const pos = 3 * perm[n] / 12;
                add(R0.THAL + i, E(mm, n), CX.tc * this.cg("tc") * Math.exp(-((pos - j) ** 2) / (2 * (CX.tcSig * this.cg("tcSig")) ** 2)) * (0.8 + 0.4 * rc()), 1, 1);
              }
              for (let k = 0; k < 3; k++) add(R0.THAL + i, I(mm, k), CX.ffI, 5, 0);
            }
            for (let m = 0; m < 4; m++) {
              for (let n = 0; n < 13; n++) for (let k = 0; k < 3; k++) {
                add(E(m, n), I(m, k), CX.eI * this.cg("eI") * (0.8 + 0.4 * rc()), 6, 0);
                add(I(m, k), E(m, n), -CX.iE * this.cg("iE") * (0.8 + 0.4 * rc()), 7, 3);
              }
              for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (a !== b) add(E(m, a), E(m, b), CX.rec0 * this.cg("rec0") * (0.5 + rc()), 2, 2);
            }
            if (ge35(o.mind ?? MIND_DEFAULT)) {
              const rx = mulberry2(o.seed * 6113 + 29);
              for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) if (m !== n) {
                for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) if (rx() < M35.xP) add(E(m, a), E(n, b), M35.xW * (0.5 + rx()), 3, 0);
              }
            }
            if (is39(o.mind ?? MIND_DEFAULT) && M39.xsW > 0) {
              const rs = mulberry2(o.seed * 3301 + 17);
              for (let m = 0; m < 4; m++) for (let b = 0; b < 13; b++) {
                const n = m ^ 1, p = Math.floor(rs() * 4);
                for (let a = 0; a < 13; a++) {
                  const ww = M39.xsW * Math.exp(-((3 * a / 12 - p) ** 2) / (2 * (M39.xsSig * this.cg("xsSig")) ** 2));
                  if (ww > 0.02 * M39.xsW) add(E(n, a), E(m, b), ww, 3, 0);
                }
              }
            }
            const fbWe = is37(o.mind ?? MIND_DEFAULT) ? M37.fbW : M36.fbW;
            if (ge36(o.mind ?? MIND_DEFAULT) && fbWe > 0) {
              const rf = mulberry2(o.seed * 9973 + 5);
              for (let m = 0; m < 4; m++) for (let n = 0; n < 13; n++) for (let k = 0; k < M36.fbN; k++) add(E(m, n), R0.THAL + m * 4 + Math.floor(rf() * 4), fbWe * (0.5 + rf()), 8, 2);
            }
          }
          this.syn = { pre: Int32Array.from(pre), post: Int32Array.from(post), w: Float32Array.from(w), plastic: Uint8Array.from(pl) };
          this.kind = Uint8Array.from(kd);
          this.pk = Uint8Array.from(pkk);
          this.rd = mulberry2(o.seed * 4441 + 9);
          this.mask = new Float32Array(pre.length).fill(1);
          this.mind = new Mind(ra);
          for (let i = 0; i < NNEU; i++) {
            this.out.push([]);
            this.th[i] = 1 + 0.1 * r();
          }
          pre.forEach((p, s) => this.out[p].push(s));
          for (let i = 0; i < NNEU; i++) this.inn.push([]);
          post.forEach((q, s2) => {
            if (this.pk[s2]) this.inn[q].push(s2);
          });
          const cv = [0, 1, 2, 3].sort(() => r() - 0.5), sv = [0, 1, 2, 3].sort(() => r() - 0.5);
          for (let k = 0; k < SITES; k++) {
            const c = k & 3, s = k >> 2;
            this.siteC[k] = c;
            this.siteS[k] = s;
            this.pTrue[k] = 0.05 + 0.25 * cv[c] / 3 + 0.25 * sv[s] / 3;
          }
          for (let k = 0; k < SITES; k++) this.access[k] = this.o.access === "all" || (this.siteC[k] + this.siteS[k] & 1) === 0 ? 1 : 0;
          for (let k = 0; k < 3; k++) {
            const v = new Float64Array(12);
            for (let i = 0; i < 12; i++) v[i] = this.gauss(r) * 0.3;
            this.pc.push(v);
          }
          if (this.o.fat0 !== void 0) this.fat = this.o.fat0;
          const G = this.o.genes;
          if (G) {
            this.th = this.th.map((x) => x * G[1]);
            const reach = Math.max(0.1, Math.min(1, 0.5 * G[3]));
            for (let k = 0; k < SITES; k++) this.access[k] = ra() < reach ? 1 : 0;
          }
          for (let k = 0; k < SITES; k++) {
            this.pBase[k] = this.pTrue[k];
            this.danger[k] = ra() < 0.5 ? 0.5 : 0;
          }
          this.applyMask();
          this.E0 = this.energy();
        }
        // lesion mask over synapses (kinds: 0 random, 1 topographic, 2 within-module recurrent, 3 cross-module cortical)
        applyMask() {
          const o = this.o;
          for (let k = 0; k < this.mask.length; k++) {
            const kd = this.kind[k];
            let m = 1;
            if (o.recLesion && (kd === 2 || kd === 3)) m = 0;
            if (o.mixLesion && kd === 3) m = 0;
            if (o.ctFbLesion && (kd === 8 || this.syn.pre[k] >= R0.CTX && this.syn.pre[k] < R0.CTX + RN.CTX && this.syn.post[k] >= R0.THAL && this.syn.post[k] < R0.THAL + RN.THAL)) m = 0;
            if (o.eiLesion && kd >= 5 && kd <= 7) m = 0;
            if (this.devPruned && this.devPruned[k]) m = 0;
            this.mask[k] = m;
          }
        }
        lesionModule(m, on = true) {
          this.modLesion[m] = on;
        }
        damage(x) {
          const d = Math.min(this.tissue, 10 * x);
          this.tissue -= d;
          this.blood.aa += d;
          this.integrity = this.tissue / 10;
          this.damageTaken += x;
          this.events.push(`t${this.t} damage ${x.toFixed(2)}`);
        }
        gauss(r = this.r) {
          const u = Math.max(1e-12, r()), v = r();
          return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v);
        }
        energy() {
          const g = this.gut, b = this.blood;
          return g.glc + g.fat + g.prot + b.glc + b.ffa + b.aa + b.ket + b.urea + this.liverGly + this.fat + this.muscle + this.brainGlc + this.atp + this.heat + this.excreted + this.tissue;
        }
        ledgerError() {
          return Math.abs(this.energy() - this.E0 - this.eaten) / (this.E0 + this.eaten);
        }
        paramCount() {
          const syn = this.syn.w.length, pl = this.syn.plastic.reduce((a, b) => a + b, 0), val = SITES + 8 + this.mind.nParams(), kin = NNEU + 7 * 6 + 40 + 36, q = 16 + 3;
          return { synapses: syn, plasticSynapses: pl, valueSynapses: val, kinetics: kin, quantum: q, total: syn + val + kin + q };
        }
        // ---------- interventions (browser inspector + tests) ----------
        // ---- v3.6 steering API: light input, photoperiod, external quantum backend, rule engine, full-state snapshot/restore ----
        /** dome light in [0,1]; null returns to the internal photoperiod clock */
        setLight(x) {
          this.lightIn = x === null ? null : clamp(x);
        }
        setPhotoperiod(on, off) {
          this.photo = [on, off];
        }
        /** external statevector (e.g. Moonlab WASM): prepare(theta) then probs() of the 8 basis states; draws stay on the seeded stream, so runs stay deterministic */
        setQuantumBackend(b) {
          this.qb = b;
        }
        /** external sleep/wake flip-flop rule (e.g. an Eshkol program); must compute the same boolean as the built-in rule */
        setRuleEngine(f) {
          this.rule = f;
        }
        /** complete serialisable state (JSON-safe): every field incl. typed arrays, the Mind, and all PRNG states */
        snapshot() {
          return snapEnc(this, /* @__PURE__ */ new Set(["rule", "qb", "g"]));
        }
        /** restore a snapshot into this instance (any seed); continuing then reproduces the original run exactly */
        restore(st) {
          snapDec(this, st, /* @__PURE__ */ new Set(["rule", "qb", "g"]));
        }
        feed(kJ) {
          const f = kJ / 2.2;
          this.gut.glc += 1.2 * f;
          this.gut.fat += 0.6 * f;
          this.gut.prot += 0.4 * f;
          this.eaten += kJ;
          this.events.push(`t${this.t} fed ${kJ.toFixed(1)} kJ`);
        }
        stimulate(reg, amt) {
          this.stim[reg] = (this.stim[reg] || 0) + amt;
        }
        inject(nm, amt) {
          if (this.nm[nm]) this.nm[nm].E += amt;
        }
        lesion(k, v = true) {
          this.o[k] = v;
          this.events.push(`t${this.t} ${k}=${String(v)}`);
          this.applyMask();
        }
        // ---------- one-tick update of the whole organism ----------
        step() {
          const o = this.o, r = this.r;
          this.t++;
          if (is40(o.mind ?? MIND_DEFAULT) && !(o.affectLesion ?? "").includes("all")) {
            this.intPrev = this.integrity;
            if (!this.affect) {
              this.affR = mulberry2(o.seed * 4051 + 11);
            }
            if (!this.affect) this.affect = new Affect(SITES, o.persona ?? Affect.birth(mulberry2(o.seed * 4049 + 7)), new Set((o.affectLesion ?? "").split(",").filter(Boolean)));
            const fb = this.affect.step({ t: this.t, DA: this.nm.DA.E, NE: this.nm.NE.E, S5: this.nm["5HT"].E, cortisol: this.cortisol, ghrelin: this.ghrelin, atp: this.atp / 2, integrity: this.integrity, sleepS: this.S, awake: this.stage === 0, r: this.affR });
            this.cortisol = clamp(this.cortisol + fb.cortisol);
            this.nm.DA.E = Math.max(0, this.nm.DA.E + fb.DA);
            this.nm["5HT"].E = Math.max(0, this.nm["5HT"].E + fb.S5);
            this.S = clamp(this.S + fb.sleep);
          }
          if (is40(o.mind ?? MIND_DEFAULT) && M40.forget > 0 && this.t % 10 === 0) {
            const f2 = 1 - 10 * M40.forget;
            for (let k = 0; k < this.bA.length; k++) {
              this.bA[k] = 1 + f2 * (this.bA[k] - 1);
              this.bB[k] = 1 + f2 * (this.bB[k] - 1);
            }
          }
          if (is40(o.mind ?? MIND_DEFAULT) && !(o.v40Lesion ?? "").includes("v40all")) {
            const off = new Set((o.v40Lesion ?? "").split(",").filter(Boolean));
            if (!this.bus) {
              const rr = mulberry2(o.seed * 6007 + 41);
              this.bus = new SensoryBus(rr, off, o.substrate ?? "synthetic", o.seed, o.substrateLog ?? []);
              this.selfM = new SelfModel(rr, off);
              const ctl = new Set((o.v40Ctl ?? "").split(",").filter(Boolean));
              this.curv = new Curvature(rr, RN.CTX, off);
              this.neo = new NeoHooks(off);
              this.bus.ctl = ctl;
              this.selfM.ctl = ctl;
              this.neo.ctl = ctl;
              this.bus.outK = M40.busOut;
              this.selfM.simK = M40.simK;
            }
            const A = this.affect;
            const intero = [this.blood.glc, this.atp / 2, this.integrity, this.fat / 400];
            const alien = [Math.cos(2 * Math.PI * this.t / (1440 * 7) + o.seed), clamp(this.cortisol), this.qOut ? 1 : 0];
            this.bus.step(this.t, this.sens, intero, alien, this.lastRew);
            this.lastRew *= 0.9;
            const glitch = this.bus.lastIn[16 + 4 + 3 + 3] ?? 0;
            this.curv.step(this.rate.subarray(R0.CTX, R0.CTX + RN.CTX));
            this.selfM.step([...intero, this.nm.DA.E, this.nm["5HT"].E, this.nm.NE.E, this.nm.ACh.E, A ? A.mood.val : 0, A ? A.emo.fear : 0, this.bus.surpriseN - 1, this.curv.felt()], glitch);
            this.neo.step(this.t, this.selfM.sim, A ? A.sleepDebt : this.S, clamp(this.ghrelin), this.bestSite(), this.affR);
            for (const q of this.neo.pending.splice(0)) this.neoSandbox(q);
          }
          const minute = this.t % 1440, hour = minute / 60;
          this.light = this.lightIn !== null ? clamp(this.lightIn) : hour >= this.photo[0] && hour < this.photo[1] ? 1 : 0;
          this.scnPhase += 2 * Math.PI / 1440 + this.light * 2e-3 * Math.sin(2 * Math.PI * minute / 1440 - this.scnPhase);
          if (this.neo && this.t < this.neo.shadeUntil) this.light = 0;
          const scnOut = o.scnLesion ? 0 : Math.cos(this.scnPhase - 2 * Math.PI * 14 / 24);
          this.melatonin += 0.05 * ((1 - this.light) * (o.scnLesion ? 0.5 : clamp(0.5 - scnOut)) - this.melatonin);
          this.ultra = (this.ultra + 1 / 90) % 1;
          const C = 0.25 * scnOut + 0.1 * Math.sin(2 * Math.PI * this.ultra) * (this.asleep ? 0 : 0.5);
          const drive = this.S - C + 0.15 * this.melatonin - (ge36(o.mind ?? MIND_DEFAULT) ? M36.neK * Math.max(0, this.nm.NE.E - 0.3) : 0);
          const forced = o.forceWake || (this.stim.LC || 0) > 3;
          let thrS = 0.62;
          if (ge35(o.mind ?? MIND_DEFAULT)) {
            let eng = 0;
            for (let i = 0; i < 16; i++) eng += this.sens[i];
            this.orx += 0.02 * (Math.min(1, eng) - this.orx);
            thrS += M35.orxK * this.orx;
          }
          if (this.rule) {
            const was = this.asleep;
            this.asleep = this.rule(was, drive, thrS, forced);
            if (this.asleep && !was) this.ultra = 0;
          } else if (!this.asleep && drive > thrS && !forced) {
            this.asleep = true;
            this.ultra = 0;
          } else if (this.asleep && (drive < 0.2 || forced)) this.asleep = false;
          this.liminal = Math.exp(-((drive - (this.asleep ? 0.2 : thrS)) ** 2) / 4e-3);
          if (!this.asleep) this.stage = 0;
          else {
            const u = this.ultra;
            this.stage = u < 0.1 ? 1 : u < 0.3 ? 2 : u < 0.75 - 0.25 * clamp(0.6 - this.S) ? this.S > 0.35 ? 3 : 2 : 4;
          }
          const awake = this.stage === 0, rem = this.stage === 4, n3 = this.stage === 3;
          const gutFill = this.gut.glc + this.gut.fat + this.gut.prot;
          const bg = this.blood.glc / 3;
          const set = 1 + 0.08 * scnOut;
          const e = bg - set;
          this.pidI = clamp(this.pidI + 2e-3 * e, -0.5, 0.5);
          const dE = e - this.pidPrev;
          this.pidPrev = e;
          this.insulin += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 + 1.5 * e + this.pidI + 3 * dE + 0.2 * this.para * (o.vagotomy ? 0.3 : 1))) - this.insulin);
          this.glucagon += 0.1 * ((o.pidLesion ? 0.3 : clamp(0.3 - 1.5 * e - this.pidI + 0.3 * this.symp)) - this.glucagon);
          this.cortisol += 0.02 * (clamp(0.35 + 0.25 * (o.scnLesion ? 0 : Math.cos(2 * Math.PI * (hour - 7) / 24)) + 0.6 * clamp(0.85 - bg) + 0.2 * (forced ? 1 : 0) + 0.4 * clamp(0.8 - this.integrity)) - this.cortisol);
          this.ghrelin += 0.01 * (clamp(1 - gutFill / 6) - this.ghrelin);
          this.leptin = clamp(this.fat / 800);
          const paraGut = o.vagotomy ? 0.1 : this.para;
          this.motility = clamp(0.2 + 0.5 * paraGut + 0.4 * this.ensRate - 0.3 * this.symp);
          this.vagal = o.vagotomy ? 0 : clamp(gutFill / 25 + 0.2 * this.ensRate);
          const ATPf = clamp(this.atp / 2, 0, 1.2);
          const brainF = clamp(this.brainGlc / 0.6 + 0.12 * this.blood.ket, 0, 1.3);
          const prec = clamp(this.blood.aa / 2, 0, 1.5);
          const nmE = (k) => this.nm[k].E;
          const da = o.daClamp !== void 0 ? o.daClamp : nmE("DA");
          const kIn = o.insulaLesion ? 0 : o.kappaShuffle ? this.kHist[this.t * 7919 % Math.max(1, this.kHist.length)] || 0 : this.kappa;
          const ext = this.ext;
          ext.fill(0);
          const add = (reg, x2) => {
            for (let i = R0[reg]; i < R0[reg] + RN[reg]; i++) ext[i] = x2 + 0.15 * this.gauss();
          };
          const wake = awake ? 1 : 0;
          add("SENS", 0.08 * wake * (0.5 + this.light));
          add("THAL", awake ? TUNE.thal : rem ? 0.3 : 0.08);
          add("CTX", 0.2 + 0.15 * nmE("ACh") + (n3 ? 0.25 * (Math.sin(this.t * 2.1) > 0 ? 1 : -0.5) : 0));
          for (let i = R0.CTX; i < R0.CTX + 52; i++) ext[i] -= TUNE.ctxDrop;
          add("HIP", 0.1 + 0.3 * nmE("ACh"));
          add("STR", 0.1 + 0.3 * da);
          add("HYP", 0.4 + 0.5 * this.ghrelin + 0.5 * clamp(1 - bg) - 0.4 * this.vagal - 0.3 * this.leptin + 0.2 * this.insulin * 0);
          add("VTA", (0.35 + 0.05 * this.ghrelin) * prec * ATPf * clamp(brainF) * (o.genes ? o.genes[0] : 1));
          if (o.decision !== "v30") add(
            "RAPHE",
            /* v3.2 BUG FIX: in v3.0 this call sat inside the comment above, so raphe had no drive (5-HT ~ 0) */
            (rem ? 0.05 : 0.2 + 0.25 * wake) * prec * ATPf + 0.1 * this.vagal
          );
          add("LC", rem ? 0 : 0.15 + 0.25 * wake + 0.3 * this.cortisol + 1.2 * kIn + 0.3 * this.predErr + (this.stim.LC || 0) * 0.3);
          add("BF", (awake || rem ? 0.5 : 0.08) * ATPf);
          add("INS", 0.1 + 0.8 * kIn + 0.3 * clamp(1 - bg) + 2e-3 * Math.abs(this.hr - 70));
          add("SCN", o.scnLesion ? 0 : 0.3 + 0.3 * scnOut);
          add("MOT", 0.1 * wake);
          add("ENS", 0.1 + 0.2 * gutFill / 4 + 0.3 * paraGut);
          for (const k in this.stim) if (R0[k] !== void 0 && k !== "LC") add(k, this.stim[k] * 0.3);
          if (ge36(o.mind ?? MIND_DEFAULT) && !o.visceralLesion && !o.insulaLesion) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M36.visK * (i % 2 ? 1 - bg : bg - 1);
          if (this.curv) for (let i = 0; i < RN.INS; i++) ext[R0.INS + i] += M40.insK * this.curv.felt();
          if (o.insulaLesion) add("INS", -5);
          if (o.scnLesion) add("SCN", -5);
          {
            const M = this.mind;
            const gate = awake ? 1 : rem ? 0.2 : 0.05;
            for (let i = 0; i < 16; i++) {
              ext[R0.SENS + i] += TUNE.sensIn * gate * (this.sens[i] + (this.bus ? this.bus.out[i] : 0)) * M.att[i >> 2];
              ext[R0.THAL + i] += M.td[i];
            }
            if (o.cortex !== "v31" && this.t < CX.dev && !o.devLesion) {
              const rd = this.rd;
              this.devSens.fill(0);
              for (let m = 0; m < 4; m++) if (rd() < 0.5) {
                const p = 3 * rd();
                for (let j = 0; j < 4; j++) this.devSens[m * 4 + j] = Math.exp(-((j - p) ** 2) / 0.5);
              }
              for (let i = 0; i < 16; i++) ext[R0.THAL + i] += CX.devAmp * this.devSens[i];
            }
            for (let i = 0; i < 8; i++) ext[R0.HIP + 16 + i] += 0.6 * M.bcOut[i];
            for (let i = 0; i < 8; i++) ext[R0.MOT + i] += 0.8 * M.motor;
            ext[R0.INS] += 2 * clamp(1 - this.integrity);
            for (let m = 0; m < 4; m++) if (this.modLesion[m]) for (let j = 0; j < 13; j++) ext[R0.CTX + m * 13 + j] = -5;
          }
          const exc = clamp(this.nm.Glu.P, 0.2, 1.2) * (1 - 0.5 * clamp(nmE("eCB"))) * (0.6 + 0.4 * brainF), inh = 0.6 + 0.6 * nmE("GABA") + 0.5 * this.S * 0;
          const ne = nmE("NE"), adenTh = 0.25 * this.S;
          const SUB = 6;
          const cnt = new Float32Array(NNEU);
          const syn = this.syn;
          let nsp = 0;
          const inp = new Float32Array(NNEU);
          const c34 = o.cortex !== "v31", crit = this.t < CX.dev ? CX.crit : 1, plast = this.learn && c34, stdpOn = plast && !o.stdpLesion, homeo = plast && !o.homeoLesion, aMod = crit * clamp(nmE("ACh") / 0.3, 0, 1.5), pk = this.pk, nmK = CX.nmdaK;
          if (o.eprop) this.eligT.fill(0);
          const v36n = ge36(o.mind ?? MIND_DEFAULT) && c34 && M36.dendK > 0;
          const v37c = is37(o.mind ?? MIND_DEFAULT) && c34, slowKe = v37c ? M37.slowK : M36.slowK;
          const v36s = ge36(o.mind ?? MIND_DEFAULT) && c34 && !o.slowLesion && slowKe > 0, slowDec = Math.exp(-1 / (M36.slowTau * SUB));
          const v37d = v37c && M37.dendK > 0;
          const sdiv = [1, 1, 1, 1];
          for (let s = 0; s < SUB; s++) {
            if (v36s && v37c) for (let m = 0; m < 4; m++) {
              let c = 0;
              for (let n = 0; n < 13; n++) c += this.spk[R0.CTX + m * 13 + n];
              this.modAct[m] = 0.9 * this.modAct[m] + 0.1 * c / 13;
              sdiv[m] = 1 / (1 + M37.inhG * 13 * this.modAct[m]);
            }
            for (let i = 0; i < NNEU; i++) {
              const cortical = i >= R0.CTX && i < R0.CTX + 64;
              const g = cortical ? 1 + 0.5 * ne : 1;
              const I = ext[i] + inp[i] + (c34 ? this.nmda[i] : 0) + (v36s ? this.nmdaS[i] * (v37c && i >= R0.CTX && i < R0.CTX + 52 ? sdiv[Math.floor((i - R0.CTX) / 13)] : 1) : 0) + (v37d ? M37.dendK * this.dend[i] / (1 + Math.exp(-(this.v[i] - M37.dendVh) / M37.dendVs)) : 0) + (v36n ? M36.dendK * this.dend[i] / (1 + Math.exp(-(this.v[i] - M36.dendVh) / M36.dendVs)) : 0);
              if (c34) this.nmda[i] *= nmK;
              if (v36s) this.nmdaS[i] *= slowDec;
              if (v36n || v37d) this.dend[i] = 0;
              const ts = o.tauScale ?? 1;
              let dec = ts === 1 ? 0.8 : Math.exp(-1 / (LTC_TAU0 * ts));
              if (o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + 52) {
                const th = this.gate, ach = nmE("ACh"), ai = Math.abs(inp[i]), fA = 1 + th[1] * ach, fI = 1 + th[2] * ai, fN = 1 + th[3] * ne;
                const tau = Math.max(0.5, ts * Math.exp(th[0]) * fA / (fI * fN));
                dec = Math.exp(-1 / tau);
                this.tau[i] = tau;
                if (o.eprop) {
                  const dd = dec / (tau * tau) * tau, drv = this.v[i] - g * I / 0.2, b = i * 4;
                  const dT = [1, ach / fA, -ai / fI, -ne / fN];
                  for (let k = 0; k < 4; k++) this.elig[b + k] = dec * this.elig[b + k] + dd * dT[k] * drv;
                }
              } else if (o.ltc) {
                const tau = ts * LTC_TAU0 * (1 + TUNE.ltcAch * (cortical || i >= R0.HIP && i < R0.HIP + 32 ? nmE("ACh") : 0)) / ((1 + TUNE.ltcIn * Math.abs(inp[i])) * (1 + TUNE.ltcNe * (cortical ? ne : 0)));
                dec = Math.exp(-1 / tau);
                this.tau[i] = tau;
              }
              this.v[i] = dec * this.v[i] + g * I * (o.ltc || ts !== 1 ? (1 - dec) / 0.2 : 1);
              inp[i] = 0;
              this.xTr[i] *= 0.7;
              this.yTr[i] *= 0.7;
              const thr = this.th[i] * (1 + (2 - 2 * clamp(ATPf, 0, 1)) * 0.5) + (cortical ? adenTh : 0) + this.thA[i];
              this.spk[i] = 0;
              if (o.eprop && o.ltc === "learned" && i >= R0.CTX && i < R0.CTX + 52) {
                const psi = 0.3 * Math.max(0, 1 - Math.abs(this.v[i] - thr) / Math.max(0.1, thr)), b = i * 4;
                for (let k = 0; k < 4; k++) this.eligT[b + k] += psi * this.elig[b + k] / SUB;
                if (this.v[i] > thr) for (let k = 0; k < 4; k++) this.elig[b + k] = 0;
              }
              if (this.v[i] > thr) {
                this.spk[i] = 1;
                this.v[i] = 0;
                cnt[i]++;
                nsp++;
              }
            }
            for (let i = 0; i < NNEU; i++) if (this.spk[i]) {
              for (const si of this.out[i]) {
                const w = syn.w[si] * this.mask[si];
                const q = syn.post[si];
                if (v36n && this.kind[si] === 3) {
                  this.dend[q] += w * exc;
                  continue;
                }
                if (v37d && this.kind[si] === 3) this.dend[q] += w * exc;
                if (c34 && pk[si]) {
                  if (pk[si] === 2 && !o.nmdaLesion) {
                    this.nmda[q] += w * exc * 0.35;
                    if (v36s && this.kind[si] === 2) this.nmdaS[q] += w * exc * slowKe;
                    else if (v36s && v37c && this.kind[si] === 8) this.nmdaS[q] += w * exc * slowKe * M37.fbS;
                  } else inp[q] += w > 0 ? w * exc : w * inh;
                  if (pk[si] === 3) {
                    if (homeo) syn.w[si] = clamp(syn.w[si] - CX.vEta * crit * (this.xTr[q] - 2 * CX.rho * 2.8), -3 * CX.iE, 0);
                  } else if (stdpOn) syn.w[si] -= CX.aM * aMod * syn.w[si] * this.xTr[q];
                  continue;
                }
                inp[q] += w > 0 ? w * exc : w * inh;
                if (syn.plastic[si] && this.learn) syn.w[si] = clamp(w - 2e-3 * this.yTr[syn.post[si]] * (0.5 + da), 0.01, 2);
              }
              if (c34 && (stdpOn || homeo)) for (const si of this.inn[i]) {
                const pre2 = syn.pre[si];
                if (pk[si] === 3) {
                  if (homeo) syn.w[si] = Math.max(-3 * CX.iE, syn.w[si] - CX.vEta * crit * this.xTr[pre2]);
                } else if (stdpOn) syn.w[si] += CX.aP * aMod * syn.w[si] * this.xTr[pre2];
              }
              for (const si of this.out[i]) void si;
              this.xTr[i] += 1;
            }
            for (let i = 0; i < NNEU; i++) if (this.spk[i] && i >= R0.CTX && i < R0.CTX + 52 && this.learn) {
              this.yTr[i] += 1;
            }
          }
          if (this.learn) {
            for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && cnt[syn.post[si]] && this.xTr[syn.pre[si]] > 0.05) syn.w[si] = clamp(syn.w[si] + 3e-3 * this.xTr[syn.pre[si]] * (0.5 + da) - 5e-4 * (syn.w[si] - 0.35), 0.01, 2);
          }
          for (const [n] of REGIONS) {
            let s = 0;
            for (let i = R0[n]; i < R0[n] + RN[n]; i++) {
              s += cnt[i];
              this.rate[i] = cnt[i] / SUB;
            }
            this.regionRate[n] = s / (RN[n] * SUB);
          }
          if (c34) {
            for (let i = R0.CTX; i < R0.CTX + 64; i++) this.rateAvg[i] += 0.01 * (this.rate[i] - this.rateAvg[i]);
            if (stdpOn) {
              for (let i = R0.CTX; i < R0.CTX + 52; i++) {
                let sT = 0, sR = 0;
                for (const si of this.inn[i]) {
                  if (pk[si] === 1) sT += syn.w[si];
                  else if (pk[si] === 2) sR += syn.w[si];
                }
                for (const si of this.inn[i]) {
                  if (pk[si] === 1 && sT > 0) syn.w[si] *= CX.tcSum / sT;
                  else if (pk[si] === 2 && sR > CX.recMax) syn.w[si] *= CX.recMax / sR;
                }
              }
              for (let i = R0.THAL; i < R0.THAL + 16; i++) {
                let sO = 0, nO = 0;
                for (const si of this.out[i]) if (pk[si] === 1) {
                  sO += syn.w[si];
                  nO++;
                }
                if (sO > 0) {
                  for (const si of this.out[i]) if (pk[si] === 1) syn.w[si] *= nO * CX.tcSum / 4 / sO;
                }
              }
            }
            if (homeo) for (let i = R0.CTX; i < R0.CTX + 52; i++) this.thA[i] = clamp(this.thA[i] + CX.hEta * crit * clamp(nmE("ACh") / 0.3, 0, 1) * (this.rate[i] - CX.rho), -0.3, 2);
          }
          this.ensRate = this.regionRate.ENS;
          this.mind.step(this);
          this.cogCost = this.mind.cost;
          const R = this.regionRate;
          let synthCost = 0;
          const kin = (k, src, pre, ksyn, vmax, km, kdeg) => {
            const m = this.nm[k];
            const sy = ksyn * pre * clamp(ATPf) * (1 - m.P / 1.5);
            m.P += sy;
            synthCost += 2e-3 * Math.max(0, sy);
            const rel = 0.25 * src * m.P;
            m.P -= rel;
            m.E += rel;
            const up = vmax * m.E / (km + m.E);
            m.E -= up + kdeg * m.E;
            m.P += 0.7 * up;
            m.E = Math.max(0, m.E);
            m.P = Math.max(0, m.P);
          };
          kin("DA", R.VTA, prec, 0.03, 0.1, 0.4, 0.03);
          kin("5HT", R.RAPHE, prec * (o.vagotomy ? 0.85 : 1), 0.03, 0.1, 0.4, 0.03);
          kin("NE", R.LC, this.nm.DA.P * 0.5 + 0.2 * prec, 0.03, 0.1, 0.4, 0.03);
          kin("ACh", R.BF, clamp(this.blood.glc / 3 + this.blood.ket), 0.04, 0.1, 0.4, 0.03);
          const ctxRel = R.CTX * (o.cortex !== "v31" ? CX.gluK : 1);
          kin("Glu", ctxRel * 1.5, clamp(this.brainGlc / 0.6), 0.06, 0.5, 0.5, 0.02);
          kin("GABA", R.STR + ctxRel * 0.3, this.nm.Glu.P, 0.04, 0.4, 0.5, 0.02);
          kin("eCB", clamp(R.CTX * 3 - 0.3, 0, 2), clamp(this.blood.ffa), 0.02, 0.2, 0.3, 0.1);
          if (o.daClamp !== void 0) this.nm.DA.E = o.daClamp;
          this.symp = clamp((o.sympathectomy ? 0.2 : 1) * (0.1 + 0.8 * R.LC + 0.4 * this.cortisol + 0.4 * clamp(0.8 - bg) + 0.2 * R.HYP));
          this.para = clamp(0.3 + 0.4 * (1 - wake) + 0.5 * this.vagal * 0.5 - 0.3 * R.LC);
          this.hr += 0.2 * (60 + 70 * this.symp - 25 * this.para - this.hr);
          this.perfusion = this.hr / 70;
          this.level = o.level ?? Math.max(1, Math.min(4, 1 + Math.floor(3 * clamp(nmE("ACh")) * clamp(ATPf) * brainF)));
          const hunger = R.HYP - 0.8 * this.vagal * 0.5;
          let decideSpikes = 0;
          const v38e = is38(o.mind ?? MIND_DEFAULT);
          const fatDef = v38e ? clamp(1 - this.fat / M38.fSet) : 0;
          if (awake && !this.dead && r() * (this.affect ? 1 / this.affect.forageMul() : 1) < (o.fixedDrive ? 0.12 : clamp((3 * hunger - 0.1 + (v38e ? M38.fK * fatDef : 0)) * (o.genes ? o.genes[2] : 1)))) {
            const { k, sp } = this.choose(da);
            decideSpikes = sp;
            this.foraged++;
            this.lastChoice = k;
            this.choices.push(k);
            let got2 = r() < this.pTrue[k];
            if (got2 && o.pool) {
              if (o.pool.food >= 2.2) o.pool.food -= 2.2;
              else got2 = false;
            }
            if (got2 && !o.starve) {
              this.feed(2.2);
              this.rewards++;
            }
            if (o.deplete && got2) this.depl[k] = 1;
            this.visits[k]++;
            this.lastVisit[k] = this.t;
            if (o.danger && r() < this.danger[k]) {
              this.damage(0.08);
              this.predErr += 0.5;
              if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.3 * (1 - this.wAv[k]);
            } else if (!o.aversiveLesion && this.learn) this.wAv[k] += 0.05 * (0 - this.wAv[k]);
            const rew = got2 && !o.starve ? 1 : 0;
            this.lastRew = Math.max(this.lastRew, rew);
            if (this.affect) this.affect.outcome(this.t, k, rew, Math.max(0, this.intPrev - this.integrity), this.nm.DA.E);
            const v36d = ge36(o.mind ?? MIND_DEFAULT);
            const v37f = is37(o.mind ?? MIND_DEFAULT);
            if (v37f && this.learn && M37.dLr > 0) {
              const pu = this.bA[k] / (this.bA[k] + this.bB[k]), dh = this.dHat[k];
              if (dh > 0.05) {
                const e2 = rew - pu * (1 - this.dDelta * dh);
                this.dDelta = clamp(this.dDelta - M37.dLr * e2 * pu * dh, 0, 1);
              }
            }
            if (v36d && this.learn) {
              const dw = v37f ? 1 - this.dDelta * this.dHat[k] : 1;
              this.bA[k] += rew;
              this.bB[k] += (1 - rew) * dw;
            }
            if (v37f && rew) this.dHat[k] = 1;
            if (v36d && this.learn && !o.rpeLesion) {
              const pc = clamp(this.wSite[k], 0.02, 0.98), pa = clamp(this.wAlt[k], 0.02, 0.98);
              this.lcLLR = Math.max(-M36.lcThr, M36.lcDecay * this.lcLLR + Math.log(rew ? pa / pc : (1 - pa) / (1 - pc)));
              if (this.lcLLR > M36.lcThr) {
                const t2 = this.wAlt.slice();
                this.wAlt.set(this.wSite);
                this.wSite.set(t2);
                this.lcLLR = 0;
                this.lcSwitches++;
              }
              for (let j = 0; j < SITES; j++) {
                this.sN[j] *= M36.schDecay;
                this.sR[j] *= M36.schDecay;
              }
              this.sN[k] += 1;
              this.sR[k] += rew;
            }
            if (this.learn && !o.rpeLesion) {
              const rpe = rew - this.wSite[k];
              this.vol += 0.05 * (Math.abs(rpe) - this.vol);
              this.nm.DA.E += 0.05 * Math.max(0, rpe) * prec;
              const v35d = ge35(o.mind ?? MIND_DEFAULT);
              if (v35d) {
                this.wSite[k] += (M35.lrBase + M35.lrVol * this.assocPH[k]) * rpe * (0.5 + nmE("ACh")) * (this.selfM ? this.selfM.learnScale() : 1);
                this.assocPH[k] = 0.7 * this.assocPH[k] + 0.3 * Math.abs(rpe);
              } else this.wSite[k] += 0.01 * rpe * (0.5 + nmE("ACh"));
              if (r() < 0.3 + 0.6 * nmE("ACh")) {
                this.episodes.push({ k, r: rew, p: Math.abs(rpe) });
                if (this.episodes.length > 200) this.episodes.shift();
              }
            }
          }
          if (this.learn && !o.rpeLesion && o.replay !== "none" && !awake && this.episodes.length) {
            const E = this.episodes;
            const v32 = o.decision !== "v30";
            let tot = 0;
            if (v32) for (const ep of E) tot += ep.p + 0.05;
            const pick = () => {
              if (!v32) return E[Math.floor(E.length * r())];
              let u = r() * tot;
              for (const ep of E) {
                u -= ep.p + 0.05;
                if (u <= 0) return ep;
              }
              return E[E.length - 1];
            };
            if ((n3 || this.stage === 2) && r() < 0.5 + 0.3 * this.liminal) {
              for (let j = 0; j < 4; j++) {
                const ep = pick();
                const k = ep.k;
                this.wSite[k] += 0.04 * (ep.r - this.wSite[k]);
                if (v32) ep.p *= 0.9;
                const pred = this.featC[this.siteC[k]] + this.featS[this.siteS[k]];
                const d = ep.r - pred;
                this.featC[this.siteC[k]] += 0.08 * d;
                this.featS[this.siteS[k]] += 0.08 * d;
                for (let i = R0.HIP + 2 * k; i < R0.HIP + 2 * k + 2; i++) this.v[i] += 1;
              }
              if (ge35(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < M35.featIt * 4; it++) {
                const ep = E[Math.floor(r() * E.length)];
                const k = ep.k;
                const d = ep.r - this.featC[this.siteC[k]] - this.featS[this.siteS[k]];
                this.featC[this.siteC[k]] += 0.03 * d;
                this.featS[this.siteS[k]] += 0.03 * d;
              }
              if (ge36(o.mind ?? MIND_DEFAULT)) for (let it = 0; it < 4; it++) {
                for (let c = 0; c < 4; c++) {
                  let nu = M36.schLam * 0.15, de = M36.schLam;
                  for (let k = 0; k < SITES; k++) if (this.siteC[k] === c && this.sN[k] > 0) {
                    nu += this.sR[k] - this.sN[k] * this.featS[this.siteS[k]];
                    de += this.sN[k];
                  }
                  this.featC[c] = nu / de;
                }
                for (let c = 0; c < 4; c++) {
                  let nu = M36.schLam * 0.15, de = M36.schLam;
                  for (let k = 0; k < SITES; k++) if (this.siteS[k] === c && this.sN[k] > 0) {
                    nu += this.sR[k] - this.sN[k] * this.featC[this.siteC[k]];
                    de += this.sN[k];
                  }
                  this.featS[c] = nu / de;
                }
              }
            }
            if (rem && o.replay !== "nremOnly" && r() < 0.9) {
              const a = E[Math.floor(r() * E.length)], b = E[Math.floor(r() * E.length)];
              const c = this.siteC[a.k], s = this.siteS[b.k];
              const k = s * 4 + c;
              const vhat = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[c] + this.featS[s]);
              const v40r = is40(o.mind ?? MIND_DEFAULT);
              if (!this.access[k]) {
                if (v40r) this.dreamBelief(k, vhat);
                else this.wSite[k] += 0.25 * (vhat - this.wSite[k]);
              }
              if (ge35(o.mind ?? MIND_DEFAULT) && M35.remAll) {
                for (let k2 = 0; k2 < SITES; k2++) if (!this.access[k2]) {
                  const vh = o.replay === "remShuffle" ? r() * 0.6 : clamp(this.featC[this.siteC[k2]] + this.featS[this.siteS[k2]]);
                  if (v40r) this.dreamBelief(k2, vh);
                  else this.wSite[k2] += M35.remLr * (vh - this.wSite[k2]);
                }
              }
            }
          }
          if (this.devAff) {
            for (let i = 0; i < NNEU; i++) this.actEMA[i] += 2e-3 * ((this.spk[i] ? 1 : 0) - this.actEMA[i]);
            if (n3 && this.t % 10 === 0) this.devRefine();
          }
          if (n3 && this.learn && is40(o.mind ?? MIND_DEFAULT) && M40.turn > 0 && r() < M40.turn) {
            let mi = -1, mw = 1e9;
            for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si] && syn.w[si] < mw) {
              mw = syn.w[si];
              mi = si;
            }
            if (mi >= 0) syn.w[mi] = 0.05 + 0.3 * r();
          }
          if (n3 && this.learn && o.decision !== "v30") {
            for (let si = 0; si < syn.w.length; si++) if (syn.plastic[si]) syn.w[si] += 5e-4 * (0.35 - syn.w[si]);
          }
          if (is37(o.mind ?? MIND_DEFAULT)) for (let k = 0; k < SITES; k++) this.dHat[k] = Math.max(0, this.dHat[k] - 1 / M37.dTau);
          if (ge36(o.mind ?? MIND_DEFAULT)) {
            const fg = Math.exp(-1 / (is37(o.mind ?? MIND_DEFAULT) ? M37.igTau : M36.igTau));
            for (let k = 0; k < SITES; k++) {
              this.bA[k] = 1 + (this.bA[k] - 1) * fg;
              this.bB[k] = 1 + (this.bB[k] - 1) * fg;
            }
          }
          for (let k = 0; k < SITES; k++) {
            if (this.depl[k] > 0) this.depl[k] = Math.max(0, this.depl[k] - 1 / 120);
            if (o.deplete) this.pTrue[k] = this.pBase[k] * (1 - 0.9 * this.depl[k]);
          }
          let repairATP = 0;
          if (!o.repairLesion && this.tissue < 10) {
            const f2 = Math.max(0, Math.min(10 - this.tissue, 0.01 * clamp(ATPf) * clamp(this.blood.aa - 0.3), this.blood.aa));
            this.blood.aa -= f2;
            this.tissue += f2;
            repairATP = 0.5 * f2;
          }
          this.integrity = this.tissue / 10;
          const x = REGIONS.slice(0, 12).map(([n]) => this.regionRate[n]);
          this.pcaUpdate(x);
          const zt = this.pc.map((p) => p.reduce((s, w, i) => s + w * x[i], 0));
          this.z.push(zt);
          if (this.z.length > 60) this.z.shift();
          if (this.z.length >= 3) {
            const n = this.z.length;
            const a = this.z[n - 3], b = this.z[n - 2], c = this.z[n - 1];
            const v1 = b.map((q, i) => q - a[i]), v2 = c.map((q, i) => q - b[i]);
            const n1 = Math.hypot(...v1), n2 = Math.hypot(...v2);
            const cos = n1 * n2 > 1e-9 ? v1.reduce((s, q, i) => s + q * v2[i], 0) / (n1 * n2) : 1;
            const k = Math.acos(clamp(cos, -1, 1)) / Math.max(0.02, (n1 + n2) / 2);
            this.kappa = clamp(k / 60);
            this.kHist.push(this.kappa);
            if (this.kHist.length > 1440) this.kHist.shift();
          }
          this.qth = [Math.PI * clamp(da), Math.PI * clamp(nmE("5HT")), Math.PI * clamp(ne)];
          this.q.prepare(this.qth);
          if (this.qb) {
            this.qb.prepare(this.qth);
            this.q.ext = this.qb.probs();
          }
          this.qOut = this.q.measure(this.ent());
          this.health.push(this.qOut);
          if (this.t % 10 === 0) {
            const Q = qgt(this.qth);
            this.qgtTrace = Q.trace;
            this.berry = Q.berry[0][1];
          }
          this.brainUse = 0;
          const mv = (from, frac) => Math.max(0, Math.min(from, from * frac));
          let f = mv(this.gut.glc, 0.06 * this.motility);
          this.gut.glc -= f;
          this.blood.glc += f;
          f = mv(this.gut.fat, 0.025 * this.motility);
          this.gut.fat -= f;
          this.blood.ffa += f;
          f = mv(this.gut.prot, 0.035 * this.motility);
          this.gut.prot -= f;
          this.blood.aa += f;
          f = mv(this.blood.glc, 0.03 * this.insulin * (1 - this.liverGly / 60));
          this.blood.glc -= f;
          this.liverGly += 0.95 * f;
          this.heat += 0.05 * f;
          f = mv(this.liverGly, 4e-3 * this.glucagon + 2e-3 * this.symp);
          this.liverGly -= f;
          this.blood.glc += f;
          f = mv(this.blood.glc, 0.01 * clamp(this.insulin - 0.4) * clamp(this.liverGly / 50));
          this.blood.glc -= f;
          this.fat += 0.8 * f;
          this.heat += 0.2 * f;
          f = mv(this.fat, 12e-5 * (this.glucagon + this.symp + this.cortisol * 0.5) * (1 - 0.7 * this.insulin) * (v38e && M38.fast ? clamp(1 - this.blood.ffa / M38.ffaInh) : 1) * (is39(o.mind ?? MIND_DEFAULT) && M39.lipE > 0 ? Math.min(4, Math.pow(M38.fSet / Math.max(this.fat, 10), M39.lipE)) : 1));
          this.fat -= f;
          this.blood.ffa += 0.9 * f;
          this.blood.glc += 0.1 * f;
          f = mv(this.blood.ffa, 0.01 * this.insulin);
          this.blood.ffa -= f;
          this.fat += f;
          f = mv(this.blood.ffa, 0.02 * clamp(0.5 - this.insulin) * (v38e && M38.fast ? 1 + M38.ketK * clamp(1 - this.liverGly / 5) : 1));
          this.blood.ffa -= f;
          this.blood.ket += 0.8 * f;
          this.heat += 0.2 * f;
          f = mv(this.blood.aa, 4e-3 * (this.glucagon + this.cortisol) * (v38e && M38.fast ? 1 + M38.gngK * clamp(1 - this.liverGly / 5) : 1));
          this.blood.aa -= f;
          this.blood.glc += 0.75 * f;
          this.blood.urea += 0.1 * f;
          this.heat += 0.15 * f;
          const v39e = is39(o.mind ?? MIND_DEFAULT);
          f = mv(this.muscle, 15e-5 * this.cortisol * (1 - this.insulin) * (v38e && M38.fast ? 1 + M38.protK * clamp(1 - this.liverGly / 5) : 1) * (v39e ? 1 / (1 + M39.ketPS * this.blood.ket) * (this.fat < M39.fCrit ? M39.p3K : 1) : 1));
          this.muscle -= f;
          this.blood.aa += f;
          const msat = is38(o.mind ?? MIND_DEFAULT) ? clamp((M38.mMax - this.muscle) / 60) : 1;
          f = mv(this.blood.aa, 5e-3 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * msat);
          this.blood.aa -= f;
          this.muscle += f;
          if (msat < 1) {
            f = mv(this.blood.aa, 5e-3 * this.insulin * clamp(this.blood.aa - 1, 0, 1) * (1 - msat));
            this.blood.aa -= f;
            this.blood.glc += 0.75 * f;
            this.blood.urea += 0.1 * f;
            this.heat += 0.15 * f;
          }
          f = mv(this.blood.urea, 0.01);
          this.blood.urea -= f;
          this.excreted += f;
          f = mv(this.blood.ket, v38e && M38.fast ? M38.ketEx : 3e-3);
          this.blood.ket -= f;
          this.excreted += f;
          f = Math.max(0, 0.3 * this.perfusion * (this.blood.glc / 3 - this.brainGlc / 0.6)) / (v38e && M38.fast ? 1 + M38.ketSpare * this.blood.ket : 1);
          f = Math.min(f, this.blood.glc);
          this.blood.glc -= f;
          this.brainGlc += f;
          const thm = v38e ? Math.max(M38.thMin, 1 - M38.thK * fatDef) : 1;
          const brainD = 4e-3 * thm + 12e-6 * nsp * (0.6 + 0.4 * this.level) + 3e-5 * decideSpikes * this.level + synthCost + this.cogCost;
          const bodyD = (6e-3 + 6e-5 * this.hr) * thm + (decideSpikes > 0 ? 4e-3 : 0) + (forced ? 3e-3 : 0) + repairATP + 2e-3 * this.mind.motor + (o.genes ? 3e-3 * Math.max(0, o.genes[3] - 1) : 0);
          this.brainUse = brainD;
          let need = brainD + bodyD;
          this.atp -= need;
          this.heat += need;
          this.lastChoice = -1;
          const refill = Math.max(0, 2 - this.atp) * 0.5;
          let got = 0;
          const ox = (take) => {
            if (got >= refill) return;
            const want = (refill - got) / 0.4;
            const s = take(want);
            got += 0.4 * s;
            this.atp += 0.4 * s;
            this.heat += 0.6 * s;
          };
          const oxBG = (w) => {
            const s = Math.min(w * 0.4, this.brainGlc);
            this.brainGlc -= s;
            return s;
          }, oxBK = (w) => {
            const s = Math.min(w * (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0 ? Math.min(0.7, 0.3 + 0.05 * this.blood.ket) : 0.3), this.blood.ket);
            this.blood.ket -= s;
            return s;
          };
          if (v38e && M38.fast) {
            ox(oxBK);
            ox(oxBG);
          } else {
            ox(oxBG);
            ox(oxBK);
          }
          ox((w) => {
            const s = Math.min(w * 0.5, this.blood.ket);
            this.blood.ket -= s;
            return s;
          });
          const oxF = (w) => {
            const s = Math.min(w, this.blood.ffa);
            this.blood.ffa -= s;
            return s;
          }, oxG = (w) => {
            const s = Math.min(w, this.blood.glc * 0.5);
            this.blood.glc -= s;
            return s;
          }, oxK = (w) => {
            const s = Math.min(w, this.blood.ket);
            this.blood.ket -= s;
            return s;
          };
          if (is39(o.mind ?? MIND_DEFAULT) && M39.ketPS > 0) {
            ox(oxF);
            ox(oxK);
            ox(oxG);
          } else {
            ox(oxF);
            ox(oxG);
            ox(oxK);
          }
          if (o.leakyLedger) {
            this.heat -= 0.05 * need;
            this.leak++;
          }
          this.S = clamp(this.S + (awake ? 8e-4 * (brainD / 75e-4) : -(n3 ? 4e-3 : 22e-4) * this.S));
          if (this.blood.glc < 0.9 || this.atp < 1) this.lowGlc++;
          else this.lowGlc = 0;
          if (this.lowGlc > 120) {
            this.dead = true;
            this.deathCause = this.deathCause || "hypoglycaemia";
          }
          if (is39(o.mind ?? MIND_DEFAULT) && M39.mDeath > 0 && this.muscle < M39.mDeath && !this.dead) {
            this.dead = true;
            this.deathCause = "protein depletion (organ failure)";
          }
          for (const k in this.stim) {
            this.stim[k] *= 0.9;
            if (this.stim[k] < 0.01) delete this.stim[k];
          }
          this.predErr *= 0.9;
          if (this.t % 2 === 0) this.record();
        }
        // spiking race between striatal channels; noise from quantum (Born-rule) or classical source, amplitude set by tonic DA
        /** value estimate the chooser uses for site k: v4.0 blends the Beta posterior mean (mK) into the striatal value, so a dreamt belief counts; before v4.0 it is wSite */
        valueEst(k) {
          return is40(this.o.mind ?? MIND_DEFAULT) && !this.o.rpeLesion ? this.wSite[k] + M40.mK * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]) : this.wSite[k];
        }
        /** v4.0 REM: move an unexperienced option's Beta belief toward a dreamt mean vh with low confidence (pseudo-count dreamC). Value (wSite) is untouched; the dream raises or lowers expected reward AND keeps uncertainty high, so novelty flows through the single uncertainty term */
        dreamBelief(k, vh) {
          const c = M40.dreamC, lr = M40.dreamLr;
          this.bA[k] += lr * (1 + c * vh - this.bA[k]);
          this.bB[k] += lr * (1 + c * (1 - vh) - this.bB[k]);
        }
        /** v4.0 individual temperament: log-normal curiosity gain drawn at first choice. With noise "quantum" the draw comes from the creature's own Q3 Born-rule measurements (the quantum layer as a source of individual variation); otherwise from a seed stream */
        birthTemper() {
          let u1, u2;
          if (this.o.noise === "quantum") {
            u1 = (this.q.measure(this.ent()) + this.ent()) / 8;
            u2 = this.ent();
          } else {
            const rr = mulberry2(this.o.seed * 7919 + 40);
            u1 = rr();
            u2 = rr();
          }
          const g = Math.sqrt(-2 * Math.log(Math.max(1e-12, u1))) * Math.cos(2 * Math.PI * u2);
          return Math.exp(M40.tempSD * g);
        }
        /** v4.0 develop: one deep-sleep refinement event. Score a sample of grown synapses by |w| x coactivity; eliminate the weakest. While above the
         *  table's target density, elimination is net (developmental pruning); at target, the slot re-sprouts onto a partner in the same projection chosen
         *  by genome affinity x recent presynaptic activity. Only the presynaptic partner changes (dendrite fixed), so this.out is updated in place. */
        devRefine() {
          const S = this.devSlots;
          if (!S.length || !this.devAff) return;
          const r = this.rd, syn = this.syn;
          let worst = -1, ws = 1e9;
          for (let n = 0; n < 24; n++) {
            const k = Math.floor(r() * S.length), si2 = S[k][0];
            if (this.mask[si2] === 0 && S[k][2] === 1) continue;
            const sc = Math.abs(syn.w[si2]) * (0.02 + Math.sqrt(this.actEMA[syn.pre[si2]] * this.actEMA[syn.post[si2]]));
            if (sc < ws) {
              ws = sc;
              worst = k;
            }
          }
          if (worst < 0) return;
          const [si, pi] = S[worst];
          const st = this.devStats;
          const live = S.length - st.pruned + st.sprouted;
          if (live > this.devTarget) {
            this.mask[si] = 0;
            S[worst][2] = 1;
            (this.devPruned ??= new Uint8Array(this.mask.length))[si] = 1;
            st.pruned++;
            return;
          }
          const [a] = CP[pi];
          const j = syn.post[si];
          let best = -1, bs = -1;
          for (let n = 0; n < 12; n++) {
            const i = R0[a] + Math.floor(r() * RN[a]);
            if (i === j) continue;
            const sc = this.devAff(pi, i, j) * (0.05 + this.actEMA[i]) * (0.5 + r());
            if (sc > bs) {
              bs = sc;
              best = i;
            }
          }
          if (best < 0) return;
          const old = syn.pre[si];
          const L = this.out[old];
          const ix = L.indexOf(si);
          if (ix >= 0) L.splice(ix, 1);
          syn.pre[si] = best;
          this.out[best].push(si);
          const ln = 0.1 + 0.15 * r();
          syn.w[si] = INHIB(best) ? -ln * 1.6 : ln;
          this.mask[si] = 1;
          st.sprouted++;
          st.pruned++;
        }
        /** v4.0 Neo: built-in sandbox. Legal hooks only; touches nothing outside this creature unless a dome sandbox is attached (domeSandbox). */
        domeSandbox = null;
        neoLog = [];
        neoSandbox(q) {
          let ok = false;
          if (q.hook === "shade") ok = q.arg > 0 && q.arg <= 120;
          else if (q.hook === "mark") ok = !!this.domeSandbox && Number.isInteger(q.arg) && q.arg >= 0 && q.arg < SITES && this.domeSandbox(q);
          this.neo.grant(q, ok);
          this.neoLog.push(q);
          if (this.neoLog.length > 100) this.neoLog.shift();
        }
        bestSite() {
          let b = 0;
          for (let k = 1; k < SITES; k++) if (this.wSite[k] > this.wSite[b]) b = k;
          return b;
        }
        /** v4.0 lab view of Parts VII–X */
        v40State() {
          return this.bus ? { bus: this.bus.state(), self: this.selfM.state(), curv: this.curv.state(), neo: this.neo.state(), marks: Array.from(this.marks), devPruned: this.devPruned ? this.devPruned.reduce((a, b) => a + b, 0) : 0 } : null;
        }
        /** v4.0 lab view of the layered affect system (emotions, moods, attitudes, personality, dysregulation events) */
        affectState() {
          return this.affect ? this.affect.state() : null;
        }
        choose(da) {
          const W = 3 + 5 * (this.level - 1);
          const sig = 0.35 * (0.2 + 2 * clamp(da)) * (1 + 0.2 * this.qgtTrace) * (this.affect ? this.affect.noiseMul() : 1) * (this.curv ? this.curv.noiseMul() : 1);
          const cnt = new Float32Array(SITES), v = new Float32Array(SITES);
          let sp = 0;
          const v32 = this.o.decision !== "v30";
          const keep = v32 ? 1 - 0.4 / this.level : 0.6, gain = (1 - keep) / 0.4;
          const v40 = is40(this.o.mind ?? MIND_DEFAULT);
          let sdMu = 0, hdMu = 0;
          if (v40) {
            if (this.temper < 0) this.temper = this.birthTemper();
            let na = 0;
            for (let k = 0; k < SITES; k++) if (this.access[k]) {
              sdMu += betaSD(this.bA[k], this.bB[k]);
              na++;
            }
            sdMu /= Math.max(1, na);
            hdMu = 0;
            for (let k = 0; k < SITES; k++) if (this.access[k]) hdMu += hBin(this.dDelta * this.dHat[k]);
            hdMu /= Math.max(1, na);
          }
          const uGate = 0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E);
          const drive = new Float32Array(SITES);
          const beta = this.o.efeLesion ? 0 : (ge35(this.o.mind ?? MIND_DEFAULT) ? M35.efeK : 2 * this.vol) * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E));
          let igM = 0;
          if (is38(this.o.mind ?? MIND_DEFAULT) && M38.efeC > 0) {
            let na = 0, mn = Infinity;
            for (let k = 0; k < SITES; k++) if (this.access[k]) {
              const ig = betaIG(this.bA[k], this.bB[k]);
              igM += ig;
              na++;
              mn = Math.min(mn, ig);
            }
            igM = M38.efeC * (M38.efeRef ? na ? mn : 0 : igM / Math.max(1, na));
          }
          let wMu = 0;
          if (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0) {
            let na = 0;
            for (let k = 0; k < SITES; k++) if (this.access[k]) {
              wMu += this.wSite[k];
              na++;
            }
            wMu /= Math.max(1, na);
          }
          for (let k = 0; k < SITES; k++) {
            let w = this.wSite[k] + (is39(this.o.mind ?? MIND_DEFAULT) && M39.vK > 0 ? M39.vK * (this.wSite[k] - wMu) : 0);
            if (v32 && this.level >= 3) w += 0.5 * (clamp(this.featC[this.siteC[k]] + this.featS[this.siteS[k]]) - w);
            if (this.affect) w += M40.affK * this.affect.bias(k);
            if (this.neo) w += M40.markK * this.marks[k];
            w -= (1 + this.cortisol) * this.wAv[k] * clamp(1.2 - 0.6 * this.ghrelin);
            w += v40 ? this.o.efeLesion ? 0 : M40.uK * this.temper * (this.affect ? this.affect.uMul() : 1) * (this.selfM ? 1 + M40.cautK * (0.25 - this.selfM.caution()) : 1) * uGate * ((betaSD(this.bA[k], this.bB[k]) - sdMu) / SD0 + M40.eK * (hBin(this.dDelta * this.dHat[k]) - hdMu) / Math.LN2 + (M40.tsK ? M40.tsK * (betaSD(this.bA[k], this.bB[k]) / SD0) * gaussQ(this.ent) : 0)) : ge36(this.o.mind ?? MIND_DEFAULT) ? this.o.efeLesion ? 0 : M36.efeK * (0.5 + clamp(this.nm.ACh.E) + 0.5 * clamp(this.nm.NE.E)) * (betaIG(this.bA[k], this.bB[k]) - igM) / IG0 : ge35(this.o.mind ?? MIND_DEFAULT) ? beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / M35.efeTau)) / Math.pow(1 + this.visits[k], M35.efeVis) : beta * (1 - Math.exp(-(this.t - this.lastVisit[k]) / 200)) / Math.sqrt(1 + this.visits[k]);
            if (is37(this.o.mind ?? MIND_DEFAULT)) {
              const avail = 1 - M37.depW * this.dDelta * this.dHat[k];
              if (!this.o.rpeLesion) w += (v40 ? M40.mK : M37.bmW) * (this.bA[k] / (this.bA[k] + this.bB[k]) - this.wSite[k]);
              w = (w - 0.2) * avail + 0.2;
            }
            drive[k] = w;
          }
          const adenNoise = 1 * Math.max(0, this.S - 0.5);
          const v36q = ge36(this.o.mind ?? MIND_DEFAULT);
          for (let s = 0; s < W; s++) for (let k = 0; k < SITES; k++) {
            if (!this.access[k]) continue;
            let n;
            if (this.o.noise === "quantum" && v36q) {
              let bit = -1;
              for (let tr = 0; tr < 8 && bit < 0; tr++) {
                const b1 = this.q.measure(this.ent()) & 1, b2 = this.q.measure(this.ent()) & 1;
                if (b1 !== b2) bit = b1;
              }
              if (bit < 0) bit = this.ent() < 0.5 ? 1 : 0;
              const u2 = this.ent();
              n = (bit ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2))) * 0.8;
            } else if (this.o.noise === "quantum") {
              const u = this.q.measure(this.ent());
              const u2 = this.ent();
              n = (u & 1 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2))) * 0.8;
            } else {
              const u2 = this.ent();
              n = (this.ent() < 0.5 ? 1 : -1) * Math.sqrt(-2 * Math.log(Math.max(1e-12, u2))) * 0.8;
            }
            v[k] = keep * v[k] + gain * (1.6 * (drive[k] - 0.2) + sig * n + adenNoise * this.gauss());
            if (v[k] > 1) {
              cnt[k]++;
              v[k] = 0;
              sp++;
            }
          }
          let best = -1, bv = -1e9;
          for (let k = 0; k < SITES; k++) if (this.access[k]) {
            const s = cnt[k] + 0.01 * v[k];
            if (s > bv) {
              bv = s;
              best = k;
            }
          }
          return { k: best, sp };
        }
        pcaUpdate(x) {
          const m = x;
          for (let p = 0; p < 3; p++) {
            const w = this.pc[p];
            let y = 0;
            for (let i = 0; i < 12; i++) y += w[i] * m[i];
            for (let i = 0; i < 12; i++) {
              let rec = 0;
              for (let q = 0; q <= p; q++) {
                let yq = 0;
                for (let j = 0; j < 12; j++) yq += this.pc[q][j] * m[j];
                rec += yq * this.pc[q][i];
              }
              w[i] += 2e-3 * y * (m[i] - rec);
            }
          }
        }
        record() {
          const h = this.hist;
          const put = (k, v) => {
            (h[k] = h[k] || []).push(v);
            if (h[k].length > 720) h[k].shift();
          };
          put("DA", this.nm.DA.E);
          put("5HT", this.nm["5HT"].E);
          put("NE", this.nm.NE.E);
          put("ACh", this.nm.ACh.E);
          put("Glu", this.nm.Glu.P);
          put("GABA", this.nm.GABA.E);
          put("eCB", this.nm.eCB.E);
          put("glc", this.blood.glc);
          put("ffa", this.blood.ffa);
          put("ket", this.blood.ket);
          put("aa", this.blood.aa);
          put("atp", this.atp);
          put("fat", this.fat);
          put("glycogen", this.liverGly);
          put("hr", this.hr);
          put("insulin", this.insulin);
          put("glucagon", this.glucagon);
          put("cortisol", this.cortisol);
          put("ghrelin", this.ghrelin);
          put("melatonin", this.melatonin);
          put("S", this.S);
          put("stage", this.stage);
          put("kappa", this.kappa);
          put("liminal", this.liminal);
          put("level", this.level);
          put("qgt", this.qgtTrace);
          put("symp", this.symp);
          put("para", this.para);
          put("ledgerErr", this.ledgerError());
          for (const [n] of REGIONS) put("r_" + n, this.regionRate[n]);
        }
        run(ticks) {
          for (let i = 0; i < ticks; i++) this.step();
        }
        // probe: n choices (trained = sites accessible on days 1-3, novel = never accessible) with learning frozen; returns mean true reward probability of chosen sites (expected reward)
        probe(n, set = "trained") {
          const save = this.learn;
          this.learn = false;
          const acc = this.access.slice();
          if (set === "all") this.access.fill(1);
          if (set === "novel") for (let k = 0; k < SITES; k++) this.access[k] = acc[k] ? 0 : 1;
          const da = this.o.daClamp !== void 0 ? this.o.daClamp : this.nm.DA.E;
          let s = 0;
          const c = new Array(SITES).fill(0);
          for (let i = 0; i < n; i++) {
            const { k } = this.choose(da);
            s += this.pTrue[k];
            c[k]++;
          }
          this.access = acc;
          this.learn = save;
          let H = 0;
          for (const x of c) if (x) {
            const p = x / n;
            H -= p * Math.log2(p);
          }
          return { ev: s / n, entropy: H };
        }
        hash() {
          let h = 2166136261;
          const mix = (x) => {
            const b = new Float64Array([x]);
            const u = new Uint32Array(b.buffer);
            for (const w of u) {
              h ^= w;
              h = Math.imul(h, 16777619) >>> 0;
            }
          };
          mix(this.energy());
          mix(this.nm.DA.E);
          mix(this.S);
          for (const w of this.wSite) mix(w);
          for (let i = 0; i < this.syn.w.length; i += 97) mix(this.syn.w[i]);
          return (h >>> 0).toString(16);
        }
        // compact read-out used by the renderer (visuals read ONLY this)
        // v3.4 e-prop gate update (training curriculum only): learning signal = readout error fed back through the Mind's own readout weights (symmetric e-prop), applied to the shared CTX-E gate theta
        epropLearn(m, label, x, eta = 0.02) {
          const M = this.mind, cls = M.cls[m], rec = M.recon[m], xin = M.rate[m];
          const p = msoftmax(cls.out(xin), 3), z = rec.out(xin);
          let nn = 1;
          for (const v of xin) nn += v * v;
          const gsum = [0, 0, 0, 0];
          for (let j = 0; j < MW; j++) {
            let L = 0;
            for (let k = 0; k < 4; k++) L += 3 * ((k === label ? 1 : 0) - p[k]) * cls.W[k * (cls.nIn + 1) + j] + (x[k] - z[k]) / nn * rec.W[k * (rec.nIn + 1) + j];
            const b = (R0.CTX + m * MW + j) * 4;
            for (let k = 0; k < 4; k++) gsum[k] += L * CX.norm * this.eligT[b + k];
          }
          for (let k = 0; k < 4; k++) this.gate[k] += eta * clamp(gsum[k], -1, 1);
          this.gate[0] = clamp(this.gate[0], Math.log(1.5), Math.log(40));
          for (let k = 1; k < 4; k++) this.gate[k] = clamp(this.gate[k], 0, 5);
          this.gHist.push(this.gate.slice());
        }
        rateAvgMod(m) {
          let s = 0;
          for (let j = 0; j < MW; j++) s += this.rateAvg[R0.CTX + m * MW + j];
          return s / MW;
        }
        view() {
          const R = this.regionRate;
          return { DA: this.nm.DA.E, SER: this.nm["5HT"].E, NE: this.nm.NE.E, ACh: this.nm.ACh.E, eCB: this.nm.eCB.E, atp: this.atp, glc: this.blood.glc, fat: this.fat, hr: this.hr, stage: this.stage, S: this.S, kappa: this.kappa, liminal: this.liminal, level: this.level, light: this.light, ctx: R.CTX, hip: R.HIP, str: R.STR, mot: R.MOT, ens: R.ENS, q: this.qOut, gut: this.gut.glc + this.gut.fat + this.gut.prot, symp: this.symp, para: this.para };
        }
      };
    }
  });

  // ../src/adapters/c001.ts
  var NM, regionOf, NEU, Creature001, make001;
  var init_c001 = __esm({
    "../src/adapters/c001.ts"() {
      init_define_process_env();
      init_organism();
      init_affect();
      init_develop();
      NM = ["DA", "5HT", "NE", "ACh", "Glu", "GABA", "eCB"];
      regionOf = (i) => {
        for (const [r] of REGIONS) if (i >= R0[r] && i < R0[r] + RN[r]) return r;
        return "?";
      };
      NEU = ["v", "spk", "rate", "xTr", "yTr", "nmda", "thA", "rateAvg", "th", "tau"];
      Creature001 = class _Creature001 {
        constructor(seed, opts = {}) {
          this.seed = seed;
          this.opts = opts;
          const pp = opts.parentPersona;
          this.o = new Organism({ seed, ...opts, ...pp ? { persona: Affect.birth(mulberry2(seed * 4049 + 7), pp) } : {}, ...opts.parentDevGenome ? { develop: true, devGenome: mutateGenome(opts.parentDevGenome, mulberry2(seed * 4073 + 3)) } : {} });
          const s = this.o.syn;
          for (let k = 0; k < s.pre.length; k++) {
            const id = `${regionOf(s.pre[k])}->${regionOf(s.post[k])}`;
            (this.edges.get(id) ?? this.edges.set(id, []).get(id)).push(k);
          }
        }
        seed;
        opts;
        creatureId = "001";
        o;
        edges = /* @__PURE__ */ new Map();
        nChoices = 0;
        lastSite = -1;
        parts() {
          return [...REGIONS.map(([r, n]) => ({ id: r, kind: "region", size: n })), ...NM.map((m) => ({ id: "nm:" + m, kind: "modulator", size: 2 })), { id: "body", kind: "organ", size: 6 }, { id: "value", kind: "module", size: 16 }];
        }
        couplings() {
          return [...this.edges].map(([id, ks]) => {
            const [from, to] = id.split("->");
            return { id, from, to, n: ks.length };
          });
        }
        hasCoupling(id) {
          return this.edges.has(id);
        }
        step(n = 1) {
          for (let i = 0; i < n; i++) {
            this.o.step();
            if (this.o.choices.length > this.nChoices) {
              this.nChoices = this.o.choices.length;
              this.lastSite = this.o.choices[this.nChoices - 1];
            } else this.lastSite = -1;
          }
        }
        t() {
          return this.o.t;
        }
        snapshot() {
          return { org: this.o.snapshot(), nChoices: this.nChoices, lastSite: this.lastSite };
        }
        restore(s) {
          this.o.restore(s.org);
          this.nChoices = s.nChoices;
          this.lastSite = s.lastSite;
        }
        setLight(x) {
          this.o.setLight(x);
        }
        readState(part, mode = "slow") {
          const o = this.o;
          if (part.startsWith("nm:")) {
            const m = o.nm[part.slice(3)];
            return Float64Array.from([m.P, m.E]);
          }
          if (part === "body") return Float64Array.from([o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp]);
          if (part === "value") return Float64Array.from(o.wSite);
          if (part === "regionRates") return Float64Array.from(REGIONS.map(([r]) => o.regionRate[r] ?? 0));
          if (part === "rateAvg") {
            const out2 = [];
            for (const r of ["HYP", "CTX", "STR", "MOT", "INS"]) for (let i = R0[r]; i < R0[r] + RN[r]; i++) out2.push(o.rateAvg[i]);
            return Float64Array.from(out2);
          }
          const a = R0[part], n = RN[part];
          if (mode === "slow") {
            const x = new Float64Array(2 * n);
            for (let i = 0; i < n; i++) {
              x[i] = o.rate[a + i];
              x[n + i] = o.v[a + i];
            }
            return x;
          }
          const inc = this.incoming(part);
          const out = [];
          for (const k of NEU) for (let i = 0; i < n; i++) out.push(o[k][a + i]);
          for (const s of inc) out.push(o.syn.w[s]);
          for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) out.push(o[k][i]);
          return Float64Array.from(out);
        }
        writeState(part, x, mode = "slow") {
          const o = this.o;
          if (part.startsWith("nm:")) {
            const m = o.nm[part.slice(3)];
            m.P = x[0];
            m.E = x[1];
            return;
          }
          if (part === "body") {
            [o.blood.glc, o.blood.ffa, o.blood.aa, o.fat, o.hr, o.atp] = Array.from(x);
            return;
          }
          if (part === "value") {
            for (let k = 0; k < x.length; k++) o.wSite[k] = x[k];
            return;
          }
          const a = R0[part], n = RN[part];
          if (mode === "slow") {
            for (let i = 0; i < n; i++) {
              o.rate[a + i] = x[i];
              o.v[a + i] = x[n + i];
            }
            return;
          }
          let j = 0;
          for (const k of NEU) for (let i = 0; i < n; i++) o[k][a + i] = x[j++];
          const inc = this.incoming(part);
          if (x.length !== NEU.length * n + inc.length + 8 * n) throw new Error(`full state size mismatch for ${part}: donor wiring differs (seed-specific connectome); use mode "slow" across seeds`);
          for (const s of inc) o.syn.w[s] = x[j++];
          for (const k of ["elig", "eligT"]) for (let i = 4 * a; i < 4 * (a + n); i++) o[k][i] = x[j++];
        }
        incoming(part) {
          const a = R0[part], n = RN[part], p = this.o.syn.post, r = [];
          for (let s = 0; s < p.length; s++) if (p[s] >= a && p[s] < a + n) r.push(s);
          return r;
        }
        allParts() {
          return [...REGIONS.map(([r]) => r), ...NM.map((m) => "nm:" + m), "body", "value"];
        }
        motor() {
          return this.readState("MOT").subarray(0, RN.MOT).slice();
        }
        metrics() {
          const o = this.o;
          return { foraged: o.foraged, rewards: o.rewards, asleep: o.asleep ? 1 : 0, DA: o.nm.DA.E, NE: o.nm.NE.E, glc: o.blood.glc, hr: o.hr, kappa: o.kappa, qgtTrace: o.qgtTrace, motRate: o.regionRate.MOT ?? 0, ctxRate: o.regionRate.CTX ?? 0, forageNow: this.lastSite >= 0 ? 1 : 0, energy: o.energy(), ledgerError: o.ledgerError(), stores: o.fat + o.liverGly + o.muscle, integrity: o.integrity, atp: o.atp, eaten: o.eaten, ignitions: o.mind.ignitions, hunger: o.regionRate.HYP ?? 0, vagal: o.vagal };
        }
        lesionCoupling(id, gain) {
          const ks = this.edges.get(id);
          if (!ks) throw new Error(`creature 001 has no coupling ${id}`);
          for (const k of ks) this.o.mask[k] = gain;
        }
        lesionFlag(flag, on) {
          this.o.lesion(flag, on);
        }
        stimulate(part, amount) {
          this.o.stimulate(part, amount);
        }
        feed(a) {
          this.o.feed(a);
        }
        clone() {
          return new _Creature001(this.seed, this.opts);
        }
        spikes() {
          return this.o.spk.slice();
        }
        routing() {
          const m = this.o.mind;
          return { winner: m.win, phases: m.phase.slice(), ignitions: m.ignitions };
        }
        noiseSample() {
          return this.o.qOut;
        }
        noiseBits() {
          return 3;
        }
        // biosphere body
        body() {
          return { radius: 0.5, mass: 1, maxSpeed: 0.6, habitat: ["water", "land"] };
        }
        sense(w) {
          if (w.touch > 0) this.o.stimulate("INS", 0.2 * w.touch);
        }
        alive() {
          return !this.o.dead;
        }
        exchange(e) {
          this.o.o.pool = e.foodPatch;
        }
        // the organism's own forage draws (2.2 kJ) now come out of the world patch under its body
        nb = [];
        meet(id) {
          const a = this.o.affect;
          if (a) a.meet(id, a.feltValence());
        }
        neighbors(nb) {
          this.nb = nb;
        }
        persona() {
          return this.o.affect ? { ...this.o.affect.persona } : null;
        }
        attachSandbox(mark) {
          this.o.domeSandbox = (q) => q.hook === "mark" && mark(q.arg);
        }
        readMarks(m) {
          if (this.o.neo) this.o.marks.set(m);
        }
        v40State() {
          return this.o.v40State();
        }
        devGenome() {
          return this.o.devGenome;
        }
        affectState() {
          return this.o.affectState();
        }
        /** v4.0: when not heading to a food site, steer toward the most-liked or away from the most-disliked nearby creature */
        socialHeading() {
          const a = this.o.affect;
          if (!a || !this.nb.length) return NaN;
          let best = 0, hd = NaN;
          for (const n of this.nb) {
            const s = a.stance(n.id);
            if (Math.abs(s) > Math.abs(best) && Math.abs(s) > 0.05) {
              best = s;
              hd = Math.atan2(n.dy, n.dx) + (s < 0 ? Math.PI : 0);
            }
          }
          return hd;
        }
        act() {
          const site = this.lastSite;
          return { heading: site >= 0 ? site / 16 * 2 * Math.PI : this.socialHeading(), speed: Math.min(1, 4 * (this.o.regionRate.MOT ?? 0)) * (this.o.asleep ? 0 : 1), forage: site >= 0, site };
        }
        harm(x) {
          this.o.damage(x);
        }
        work(kJ) {
          const o = this.o;
          const w = Math.min(kJ, Math.max(0, o.atp));
          o.atp -= w;
          o.heat += w;
        }
        shiftModulator(name, d) {
          const m = this.o.nm[name];
          if (!m) throw new Error(`no modulator ${name}`);
          m.E = Math.max(0, m.E + d);
        }
        rewire(frac, rnd) {
          let n = 0;
          for (let k = 0; k < this.o.mask.length; k++) if (rnd() < frac) {
            this.o.mask[k] = 0;
            n++;
          }
          return n;
        }
        senseLines(x) {
          for (let i = 0; i < 16; i++) this.o.sens[i] = x[i % x.length];
        }
        drain(kJ) {
          const o = this.o;
          const d = Math.min(kJ, Math.max(0, o.blood.glc));
          o.blood.glc -= d;
          o.eaten -= d;
          return d;
        }
        give(kJ) {
          if (kJ > 0) this.o.feed(kJ);
        }
        takeWaste() {
          const o = this.o;
          const w = o.excreted;
          o.excreted = 0;
          o.eaten -= w;
          return w;
        }
        // waste leaves the body: booked as negative intake so the internal ledger stays exact
        ledger() {
          return { energy: this.o.energy(), intake: this.o.eaten, error: this.o.ledgerError() };
        }
      };
      make001 = (seed, opts) => new Creature001(seed, opts);
    }
  });

  // main.ts
  var require_main = __commonJS({
    "main.ts"() {
      init_define_process_env();
      init_dome();
      init_c001();
      var LAYERS = ["emotion", "mood", "attitude", "personality", "dysreg", "risk"];
      var V40 = ["bus", "alien", "substrate", "self", "sim", "curv", "neo"];
      var off40 = /* @__PURE__ */ new Set();
      var off = /* @__PURE__ */ new Set();
      var d;
      var running = true;
      var speed = 20;
      var $ = (h) => {
        const e = document.createElement("div");
        e.innerHTML = h;
        return e.firstElementChild;
      };
      var bar = (v, lo = 0, hi = 1, c = "#5b8") => {
        const f = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
        return `<span class=b><i style="width:${(f * 100).toFixed(0)}%;background:${c}"></i></span><small>${v.toFixed(2)}</small>`;
      };
      var strip = (a, lo, hi) => a.map((v) => {
        const f = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
        return `<i class=s style="background:hsl(${(f * 120).toFixed(0)},60%,45%)" title="${v.toFixed(2)}"></i>`;
      }).join("");
      function build() {
        const seed = 2e3 + Math.floor(Math.random() * 32);
        d = new Dome({ seed, radius: 6 }, { respawnAfter: 60 });
        const les = [...off].join(","), les40 = [...off40].join(",");
        d.spawn = (_, s, parent) => make001(s, { mind: "v40", affectLesion: les, v40Lesion: les40, ...parent?.persona?.() ? { parentPersona: parent.persona() } : {}, ...parent?.devGenome?.() ? { parentDevGenome: parent.devGenome() } : { develop: true } });
        for (let i = 0; i < 5; i++) d.add("c" + i, make001(seed * 10 + i, { mind: "v40", affectLesion: les, v40Lesion: les40, develop: true }));
        document.getElementById("seed").textContent = `dev seed ${seed}`;
      }
      function render() {
        const root = document.getElementById("pop");
        root.innerHTML = "";
        const t = d.t, day = (t / 1440).toFixed(2);
        document.getElementById("clock").textContent = `t=${t} (day ${day}) \xB7 deaths ${d.deaths} \xB7 births ${d.births} \xB7 Neo marks granted ${d.neoGrants} / denied ${d.neoDenied}`;
        for (const h of d.pop) {
          const a = h.c.affectState?.();
          if (!a) {
            root.append($(`<div class=card><b>${h.id}</b> affect off (lesion all)</div>`));
            continue;
          }
          const P = a.persona, ev = a.events.slice(-6).reverse().map((e) => `<li><b>${e.type}</b> t${e.t} (${e.v})</li>`).join("");
          const oth = Object.entries(a.others).map(([k, v]) => `${k}:${v.toFixed(2)}`).join(" ") || "none yet";
          root.append($(`<div class=card><div><b>${h.id}</b> ${h.c.alive() ? "" : "\u2020 "}${a.sick ? "\u{1F912} sick " : ""}${a.hpaLocked ? "\u26A0 HPA locked " : ""}</div>
      <table><tr><td>fear</td><td>${bar(a.emo.fear, 0, 1, "#c55")}</td><td>delight</td><td>${bar(a.emo.delight, 0, 1, "#5c5")}</td></tr>
      <tr><td>frustration</td><td>${bar(a.emo.frustration, 0, 1, "#c95")}</td><td>calm</td><td>${bar(a.emo.calm)}</td></tr>
      <tr><td>mood</td><td>${bar(a.mood.val, -1, 1, "#58c")}</td><td>slow mood</td><td>${bar(a.mood.valSlow, -1, 1, "#58c")}</td></tr>
      <tr><td>stress</td><td>${bar(a.stress, 0, 1, "#c55")}</td><td>inflammation</td><td>${bar(a.inflam, 0, 1, "#c5c")}</td></tr>
      <tr><td>sleep debt</td><td>${bar(a.sleepDebt, 0, 2, "#88c")}</td><td>scarcity</td><td>${bar(a.scarcity, 0, 1, "#cc5")}</td></tr></table>
      <div>attitude (16 sites) ${strip(a.att, -0.5, 0.5)}</div><div>wanting ${strip(a.want, 0, 1)}</div><div>outcome SD ${strip(a.rSD, 0, 0.6)}</div>
      <div>others: <small>${oth}</small></div>
      <div><small>bold ${P.bold.toFixed(2)} \xB7 curious ${P.curious.toFixed(2)} \xB7 reactive ${P.reactive.toFixed(2)} \xB7 vuln ${P.vuln.toFixed(2)} \xB7 hedge ${(P.hedge ?? 0).toFixed(2)} \xB7 riskScar ${(P.riskScar ?? 0).toFixed(2)}</small></div>
      ${h.c.o?.devStats ? `<div><small>wiring: ${h.c.o.devStats.kept - h.c.o.devStats.pruned + h.c.o.devStats.sprouted}/${h.c.o.devStats.target} target \xB7 pruned ${h.c.o.devStats.pruned} \xB7 sprouted ${h.c.o.devStats.sprouted} \xB7 topo ${h.c.o.devStats.topo.toFixed(2)}</small></div>` : ""}${(() => {
            const v = h.c.v40State?.();
            if (!v) return "";
            const B = v.bus, S = v.self, K = v.curv, N = v.neo;
            return `<div><small><b>bus</b> gain ${B.gain.map((x) => x.toFixed(2)).join("/")} (classic/intero/alien/substrate:${B.substrateMode}) \xB7 surprise ${B.surprise.toFixed(3)}</small></div>
      <div><small><b>SELF</b> err ${S.err.toFixed(3)} \xB7 caution ${S.caution.toFixed(2)} \xB7 <b>SIM</b> ${bar(S.sim, 0, 1, "#a6f")}</small></div>
      <div><small><b>curvature</b> \u03BA ${K.kappa.toFixed(2)} \xB7 felt ${K.felt.toFixed(2)} \xB7 confidence ${K.conf.toFixed(2)}</small></div>
      <div><small><b>Neo</b> shade ${N.uses[0]}/${N.granted[0]} \xB7 mark ${N.uses[1]}/${N.granted[1]} (used/granted) \xB7 hook values ${N.val.map((x) => x.toFixed(2)).join("/")} \xB7 pruned-kept ${v.devPruned}</small></div>`;
          })()}<ul>${ev || "<li>no dysregulation events yet</li>"}</ul></div>`));
        }
      }
      function loop() {
        if (running) {
          for (let i = 0; i < speed; i++) d.step();
          render();
        }
        requestAnimationFrame(loop);
      }
      window.addEventListener("DOMContentLoaded", () => {
        const tg = document.getElementById("lesions");
        for (const l of LAYERS) {
          const b = $(`<label><input type=checkbox> lesion ${l}</label>`);
          b.querySelector("input").addEventListener("change", (e) => {
            e.target.checked ? off.add(l) : off.delete(l);
            build();
          });
          tg.append(b);
        }
        for (const l of V40) {
          const b = $(`<label><input type=checkbox> lesion ${l}</label>`);
          b.querySelector("input").addEventListener("change", (e) => {
            e.target.checked ? off40.add(l) : off40.delete(l);
            build();
          });
          tg.append(b);
        }
        document.getElementById("pause").onclick = () => {
          running = !running;
        };
        document.getElementById("speed").oninput = (e) => {
          speed = +e.target.value;
        };
        document.getElementById("reset").onclick = build;
        build();
        loop();
      });
    }
  });
  require_main();
})();
