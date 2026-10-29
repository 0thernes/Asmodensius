# DEATH-v1 results
## v3.7 (original run, 12:3x London, Oct 29; the commit was lost in the box rollback; numbers from the session record)
Lifecycle checks P1-P4 PASS on dome seeds 1000-1004. P5 FAIL as predicted: median lifespan 11.2-12.3 days.

## Rerun on organism v3.8a (14:2x London; not re-scored against the v3.7 predictions)
viability.ts, 5×001, default dome, respawn 60, **30 days**, test dome seeds 1000-1004:
- Lifecycle checks P1-P4 PASS 5/5: ledger ≤6.4e-12, 0 steps after death, minimum living ATP ≥1.9, alive fraction 1.0.
- **0 deaths in 25 creature-lives × 30 days.** Fat at days 10, 20 and 30 holds at 341-379 kJ (no drift), so the energy balance is steady with food.

viab2.ts (new lab-side monitor, descriptive; the organism-side claims are preregistered in creatures/001 v3.8a). One 001 per dome, 2 days fed, then all dome food removed. Seeds 1000-1004:
| Event (days after food removed) | range over 5 seeds |
|---|---|
| muscle −10 % | 1.54-1.59 |
| liver glycogen <10 % | 1.87-1.93 |
| ketosis (ket > 0.5) | 1.97-2.02 |
| fat <50 % | 3.74-3.80 |
| death (no food) | 6.67-6.75 |
- Stages are ordered (glycogen → ketosis → fat → death) on 5/5. One note: muscle proteolysis passes 10 % *before* glycogen runs out, so it overlaps with stage 1 rather than coming last.
- Dies without food on 5/5.
- Refeed arm (food returned when fat reaches 50 %): recovers on 5/5. It stays alive, fat rises again (back to ~345), liver glycogen refills, and muscle regrows.
- Ledger stays ≤2e-13 throughout.
