#!/bin/bash
# dev seeds only (<1064)
B=${1:-560}; [ $B -ge 1048 ] && { echo 'dev seeds only'; exit 1; }
BUNDLE=${BUNDLE:-/tmp/scp/sc10.js} /tmp/scp/run3.sh v07_v07 ORG_V5=11 '{"rp2":7,"rp2K":3}' $B RPT2R
