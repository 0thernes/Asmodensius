#!/bin/sh
# Concatenate harness + organism (the SAME organism.ts that node tests run) + inspector + app into the single-module Page source
{ echo 'import { Fragment, useEffect, useRef, useState, Button, Toggle, useGrokTheme } from "grok/canvas";'
  sed "s/^export //" ../harness/harness.ts
  sed -e "s/^export //" -e "/^type Rng = /d" -e "/^function mulberry(/d" ../organism/organism.ts
  sed -e "s/^export //" ../organism/coupling.ts
  cat inspector.tsx app.tsx; } > page.tsx
