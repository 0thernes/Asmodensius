#!/bin/bash
# rescoring loop: every 20 min regenerate SCORECARD.md; exits after the runs finish.
R=/workspace/Asmodensius-v40/creatures/001/results/official-r21
while true; do /tmp/r21/score/score.sh >/dev/null 2>&1; mkdir -p $R/scoring; cp /tmp/r21/score/{A,D}_orig.txt /tmp/r21/score/*_rvar.json /tmp/r21/score/gen.py /tmp/r21/score/loop.sh $R/scoring/ 2>/dev/null; python3 /tmp/r21/score/gen.py
 if [ -e /tmp/r21/q.done ] && [ -z "$(pgrep -f /tmp/r21/run_)" ]; then cd /workspace/Asmodensius-v40 && git add creatures/001/results/official-r21 && git commit -qm "OFFICIAL-R21: final SCORECARD" -- creatures/001/results/official-r21; exit 0; fi
 sleep 1200; done
