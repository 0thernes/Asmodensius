// Mutable v2.5 mechanism: the network the creature builds for CQM-21R. Initially the unchanged creatureNet.
import { creatureNet, Net6 } from "./harness";
export function cqm21rNet(seed: number): Net6 { return creatureNet(seed); }
