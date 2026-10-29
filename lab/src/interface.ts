// Creature Lab Interface (CLI). Every Asmodensius creature exposes this so one set of instruments works on all 100.
// No tokens, no prompts, no LLM: the "inputs" are stimuli, the "outputs" are motor/behaviour, the "activations" are neural/body state.
export type Vec = Float32Array | Float64Array | number[];
export interface Part { id: string; kind: "region" | "organ" | "modulator" | "module"; size: number; }
export interface Coupling { id: string; from: string; to: string; n: number; }
export interface CreatureLab {
  readonly creatureId: string; readonly seed: number;
  parts(): Part[];                      // named parts (brain regions, organs, modulators)
  couplings(): Coupling[];              // named part->part edges (connectome at part granularity)
  step(n?: number): void;               // advance n ticks (deterministic given seed)
  t(): number;
  readState(part: string): Float64Array;           // state tensor of a part (rates, levels)
  writeState(part: string, x: Vec): void;          // overwrite state (transplant / patching)
  motor(): Float64Array;                // the creature's output vector ("motor lens" target)
  metrics(): Record<string, number>;    // scalar behavioural/physiological readouts
  lesionCoupling(id: string, gain: number): void;  // 0 = cut, 1 = intact
  lesionFlag?(flag: string, on: boolean): void;    // creature-specific mechanism lesions
  stimulate(part: string, amount: number): void;   // inject drive (steering)
  feed?(amount: number): void;
  clone?(): CreatureLab;                // fresh copy with same seed/options
}
export type Factory = (seed: number, opts?: Record<string, unknown>) => CreatureLab;
export interface InstrumentResult { instrument: string; creature: string; seeds: number[]; params: Record<string, unknown>; result: unknown; }
