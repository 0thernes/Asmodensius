# Contributing
1. **Pre-register first.** Add `creatures/NNN/preregistrations/vX.md` with the metric, controls, seeds and thresholds, and commit it before any test code.
2. **Never modify** a committed test, criterion or control, and never special-case or detect the harness. Iterate mechanisms only.
3. Log every mechanism change, including rejected variants, in `HARNESS_CHANGES.md`.
4. Every number in docs must come from `results.json`. Regenerate the site with `python3 site/gen.py`.
5. Safety: a photosensitivity gate, no strobing above 3 Hz, no large full-screen red flashes, a visible calm-mode toggle and a mute button. Nothing may imitate system dialogs, chat UIs or real apps. No fake errors and no scare or urgency popups.
6. Use the issue templates: bug, indicator-dispute, new-creature, replication.
