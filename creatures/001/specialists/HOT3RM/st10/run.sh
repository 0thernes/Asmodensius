#!/bin/bash
# dev seeds only (<1064)
B=${1:-500}; [ $B -ge 1048 ] && { echo 'dev seeds only'; exit 1; }
BUNDLE=${BUNDLE:-/tmp/scp/sc10.js} /tmp/scp/run3.sh st10_st10 ORG_V6=1 '{"v6P":0,"v6Ak":0,"scAIm":0.5,"scBM":1,"scCH":1,"scST":3,"scCL":1}' $B HOT3RM
