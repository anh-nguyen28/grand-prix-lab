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

- `shared/` — pure, deterministic game rules (parts/budget in `content.js`, state machine in `game.js`, practice/qualifying in `simulation.js`, race and incident timeline in `race.js`, track in `track.js`, engineer story in `story.js`, chat rules in `chat.js`, incident-lab in `engineering.js`). No DOM/three imports. Designed to be imported unchanged by a future authoritative server. Unit tests in `tests/*.test.js` target this layer (including `balance.test.js`, which pins build-win/finish distribution — changing part stats can break it).
- `src/adapters/local-session.js` — session adapter. Views only consume snapshots (`getSnapshot`/`subscribe`) and send commands (`dispatch` → `transition` in `shared/game.js`); views never award points. Intended to be swapped for a WebSocket adapter.
- `src/` presentation — `main.js` wires session to UI; `ui/` builds DOM (garage, race HUD, chat, dialogs, part art); `scene/` is three.js (workshop car, circuit, effects, geometry). CSS split by area (`garage.css`, `broadcast.css`, `f1.css`, `engineering.css`, `layout.css`, `styles.css`).

Key design constraints (see `DESIGN.md` for the full workflow, rules and incident table; `RESEARCH.md` for rationale):
- Race outcomes, incidents (warning → moment → impact) and rival behaviour are authored/repeatable, not physics. Race UI and cameras read from the same data that times the race.
- Local playback controls (pause, 1×/2×, skip) are prototype-only; the full build must move timing/authority server-side.
- The 19 rivals and chat are simulated; no persistence or auth, refresh resets session.
- Incident demos (`engineering.js`) are isolated and must not affect the player's build, tests or score.
