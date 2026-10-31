// FIRST-PRINCIPLES HOT-3 module (isolated). Metacognitive opt-out: keep P(correct | confidence bin) by delta rule; opt out when it falls
// below the value of the safe option. Kiani & Shadlen 2009; Lau & Rosenthal 2011. Original code.
export class OptOut { pc: number[]; constructor(readonly bins = 10, init = 0.5) { this.pc = new Array(bins).fill(init); }
  bin(conf: number): number { return Math.max(0, Math.min(this.bins - 1, Math.floor(conf * this.bins))); }
  decide(conf: number, safe: number): boolean { return this.pc[this.bin(conf)] < safe; }
  learn(conf: number, correct: boolean): void { const b = this.bin(conf); this.pc[b] += 0.1 * ((correct ? 1 : 0) - this.pc[b]); } }
