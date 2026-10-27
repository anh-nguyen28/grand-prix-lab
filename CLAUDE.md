# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node >= 22.12 required.

```sh
npm run dev            # vite on http://127.0.0.1:4174 (strict port)
npm run build          # production bundle
npm run preview        # serve bundle on 4174
npm test               # node --test tests/*.test.js (pure rules, no browser)
node --test tests/race.test.js                 # single unit test file
node --test --test-name-pattern="<name>" tests/race.test.js   # single test
npm run test:browser   # Playwright (Chromium, swiftshader WebGL); full natural-duration race, takes minutes
npx playwright test tests/browser/assembly.spec.js            # single browser spec
```

Playwright's `webServer` runs `npm run dev` (reuses an existing server on 4174). Browser specs write screenshots to `artifacts/`. If Chromium is missing: `npx playwright install chromium`.

## Architecture

Vanilla JS ES modules + Vite + three.js (no framework, no backend). Three layers:

- `shared/` — pure, deterministic game rules (parts/budget in `content.js`, per-part condition stats in `part-stats.js`, section scoring in `conditions.js`, the three tracks and their sections in `tracks.js`, state machine in `game.js`, practice/qualifying in `simulation.js`, race and incident timeline in `race.js`, engineer story in `story.js`, chat rules in `chat.js`, incident plan and part text in `engineering.js`). `simulate`, `createRace` and `planIncidents` all take a track. No DOM/three imports. Designed to be imported unchanged by a future authoritative server. Unit tests in `tests/*.test.js` target this layer (including `balance.test.js`, which runs every affordable build on all three tracks, takes ~15 s, and pins build-win/crash distribution — changing part stats, section baselines or rival builds can break it; `node scripts/balance-report.mjs` prints the numbers for tuning).
- `src/adapters/local-session.js` — session adapter. Views only consume snapshots (`getSnapshot`/`subscribe`) and send commands (`dispatch` → `transition` in `shared/game.js`); views never award points. Intended to be swapped for a WebSocket adapter.
- `src/` presentation — `main.js` wires session to UI; `ui/` builds DOM (garage, race HUD, chat, dialogs, part art); `scene/` is three.js (workshop car, circuit, effects, geometry). CSS split by area (`garage.css`, `broadcast.css`, `f1.css`, `engineering.css`, `layout.css`, `styles.css`).

Section outcome bands (clean, slow, incident, crash, fire) are defined in `conditions.js`; section baselines (`required`) live in `tracks.js` and are the main balance knob.

Key design constraints (see `DESIGN.md` for the full workflow, rules and incident table; `RESEARCH.md` for rationale):
- Race outcomes, incidents (warning → moment → impact) and rival behaviour are deterministic and repeatable, not physics. A crash is a large time loss and the car keeps racing; only the brake fire retires a car. Race UI and cameras read from the same data that times the race.
- Local playback controls (pause, 0.5×–2×, skip) are prototype-only; the full build must move timing/authority server-side.
- The 19 rivals and chat are simulated; no persistence or auth, refresh resets session.
- Incident demos (`engineering.js`) are isolated and must not affect the player's build, tests or score.

## Git

Never commit (or push) on your own. Leave changes in the working tree; the user commits.
