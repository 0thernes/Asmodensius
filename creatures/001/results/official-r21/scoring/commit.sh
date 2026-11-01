#!/bin/bash
R=/workspace/Asmodensius-v40/creatures/001/results/official-r21; mkdir -p $R/raw; last=""
while true; do for n in A D Dshuf; do mkdir -p $R/raw/$n; cp -r /tmp/r21/out_$n/. $R/raw/$n/ 2>/dev/null; find $R/raw/$n -name "*.tmp" -delete; done
 cp /tmp/r21/*.log $R/raw/ 2>/dev/null; n=$(find $R -type f -name "*.json" | wc -l)
 if [ "$n" != "$last" ]; then last=$n; cd /workspace/Asmodensius-v40 && git add creatures/001/results/official-r21 && git commit -qm "OFFICIAL-R21 progress ($n json)" -- creatures/001/results/official-r21 >/dev/null 2>&1; fi
 [ -e /tmp/r21/q.done ] && [ -z "$(pgrep -f /tmp/r21/run_)" ] && { cd /workspace/Asmodensius-v40 && git add creatures/001/results/official-r21 && git commit -qm "OFFICIAL-R21 runs complete" -- creatures/001/results/official-r21 >/dev/null 2>&1; exit 0; }
 sleep 300; done
