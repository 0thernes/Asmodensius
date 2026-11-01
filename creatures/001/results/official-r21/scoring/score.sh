#!/bin/bash
# usage: score.sh  -> /tmp/r21/score/{A,D}_{orig.txt,rvar.json}
cd /tmp/r21/src_v40/creatures/001/organism
for a in A:11 D:16; do n=${a%%:*}; v=${a##*:}; [ $n = D ] && cd /tmp/r21/src_wild/creatures/001/organism
 ls /tmp/r21/out_$n/viab/starve_*.json >/dev/null 2>&1 && [ $(ls /tmp/r21/out_$n/viab/ | grep -c json) -ge 102 ] && python3 viab_eval_v39.py /tmp/r21/out_$n/viab 1064 48 > /tmp/r21/out_$n/viab_eval.json
 ORG_V5=$v ORG_MIND=v40 MODE=test NOWRITE=1 V34DIR=/tmp/r21/out_$n bun summarize_v39.ts > /tmp/r21/score/${n}_orig.txt 2>&1
 SH=""; [ $n = D ] && SH=/tmp/r21/out_Dshuf; bun /tmp/r21/score/rvar.ts /tmp/r21/out_$n $SH > /tmp/r21/score/${n}_rvar.json 2>&1
 cd /tmp/r21/src_v40/creatures/001/organism; done
