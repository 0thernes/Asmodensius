#!/bin/sh
# Concatenate the harness and the app into the single-module Page source
{ echo 'import { Fragment, useEffect, useRef, useState, Button, Toggle, useGrokTheme } from "grok/canvas";'; sed "s/^export //" ../harness/harness.ts; cat app.tsx; } > page.tsx
