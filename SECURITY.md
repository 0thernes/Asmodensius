# Security policy

This is a research repository. The creatures run offline and deterministically: tokenless, promptless, no LLM, no network
access from the organism, and the host substrate is read-only to them.

**Reporting.** Please report a vulnerability privately to the maintainer (Alex Donahue) rather than in a public issue.
Include the file, commit, and steps to reproduce. You should get an acknowledgement within 7 days.

**Scope.** The lab viewer (`lab/viewer/server.ts`) is a local development server. Do not expose it to the internet.
Bundled third-party code lives under `lab/viewer/vendor/` (three.js) and the `creatures/001/index*.html` builds (React).
