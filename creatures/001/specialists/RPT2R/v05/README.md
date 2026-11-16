# RPT2R/v05
Approach: random sparse expansion, ReLU + top-10% (hunger lowers hub gain)
Source: Babadi & Sompolinsky 2014
Substrate: base v5.7b (ORG_V5=11); hybrid on Combo A. Code is flag-gated (default off) in organism/organism.ts; this folder holds the spec and runner.
Flags (M50J): "rp2":5,"rp2K":3
Run (dev seeds only): `./run.sh [block]` (default 560)
Results: see ../README.md
