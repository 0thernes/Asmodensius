#!/bin/bash
# dev seeds only (<1064)
B=${1:-560}; [ $B -ge 1048 ] && { echo 'dev seeds only'; exit 1; }
BUNDLE=${BUNDLE:-/tmp/scp/sc10.js} /tmp/scp/run3.sh v01_v01 ORG_V5=11 '{"ae2":1}' $B AE2
