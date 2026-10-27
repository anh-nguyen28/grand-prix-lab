# AI Grand Prix — engineering and spectator prototype

An independent F1-inspired garage and player-workflow prototype in `grand-prix-lab`. No changes are made to the neighboring `ai-grand-prix` project.

## Open it

On macOS, double-click **Start Preview.command** in Finder. It starts the server and opens **http://localhost:4174**. Keep that Terminal window open; Control-C stops it.

Or, with Node.js 22.12+:

```sh
npm install
npm run dev
```

Use **Your driver** to set your name. Drag an illustrated part onto the car, double-click it, or tap a part and then the highlighted fitting point. The garage shows the parts shelf, the car and its stats side by side at the same height (the parts box scrolls; its header compacts to a one-line budget and smaller tabs as you scroll), with Field notes across the full width below. **More details** explains each option. **Preview failures** opens the engineering incident lab.

## Playable now

- Original 3D open-wheel car with visible component changes and projected fitting points.
- Visual parts shelf, pointer drag-and-drop, tap/keyboard fitting and detailed part inspection.
- Four slots and 21 parts (6 tyres, 6 power units, 5 aero packages, 4 sensors), each with its own look on the 3D car and the shelf, a 75-credit budget that rules out the best of everything, two practice tests and qualifying.
- Seven different builds can win, and about a third of affordable builds finish fifth or retire (see `tests/balance.test.js`).
- **How your car will race** shows five specs (top speed, cornering, loose grip, cooling, tyre life) read from the same data that times the race, plus the setup's risks.
- **Field notes** tell the round as a story: Rae, your race engineer, walks you through teaching your car like an AI, chapter by chapter (data → label → training → validation → real world). The lesson is named in the epilogue.
- **A 20-car, eight-lap race in about 2½ minutes**, with a start-light sequence. The rivals are a realistic workshop field: two strong builds, a dense midfield, budget cars and two sprint-package gambles.
- **TV director, Circuit and Follow me** cameras. The director queues every incident, cuts to it, and shows a second simultaneous incident in a picture-in-picture inset. Full nameplates for the cars that matter right now; code chips for the rest.
- Larger circuit with named corners, braking/acceleration zones, direction arrows and a live minimap.
- A compact 20-row timing tower with live gaps, warning and incident tags; F1-style callouts for overtakes, battles, fastest lap and the final lap; a gap readout and an ERS attack window within half a second of the car ahead.
- Every incident has three beats: a **warning** (amber ring, tower tag, engineer call) about 3 race seconds before, the **moment** (yellow flag graphic, ring, effects, minimap pin), and the **impact** (positions lost and who got past).
- An explicitly undercooled sprint package: early pace, heat, brake fade, a visible lap-5 fire and retirement with zero finishing points.
- Six separate 18-second incident demonstrations, including a deliberate blocked-duct brake fire. These do not affect the player's build, tests or score.
- Local pause, 1×/2× playback and skip controls. The race pauses if the browser tab becomes hidden.
- **Live chat** in the right-hand column during the race: race control (lights out, merged incident lines, fastest lap, final lap, your position changes), rival drivers reacting to real events (often naming the part that caused them), and your messages and one-tap reactions. 80 characters, one message every 2 seconds, a starter word filter and HTML escaping, defined in `shared/chat.js` so a server can enforce the same rules. Rivals are simulated; there is no real multiplayer chat yet.
- **Learning loop:** practice reports forecast race risks with Watch and Fix it (highlighting the parts that remove each risk). Results show a podium, your incident reel with exact replays and fixes, three lessons from the field, and **Rebuild from this car** for the next attempt.
- Desktop/mobile layouts and six-round season overview; rounds 2–6 remain design previews.

The 19 rivals are simulated. This prototype has no live multiplayer, persistence, host/projector connection or authentication. Refreshing resets the session. WebGL is needed for the visual car/race experience. The mixed-surface car rules are educational abstractions, not real F1 specifications. Scored races can include a disclosed setup-driven brake fire and retirement. Incidents are authored, repeatable scenarios rather than a full physics simulation. Contact currently means a kerb strike rather than car-to-car collision physics.

## Design and research

- [DESIGN.md](DESIGN.md): complete workflow, rules, incident table and architecture.
- [RESEARCH.md](RESEARCH.md): study of official EA SPORTS F1 25, F1 Manager and Roblox material, engineering sources, design conclusions and full-build priorities.
- `artifacts/`: screenshots of the garage, detailed options, incident demo and race views.

Pure setup/race rules live in `shared/`. Browser interaction and 3D presentation are separated from the session adapter. The full build must move authority, timing and boost timestamps to the server; local playback controls must become host controls.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

The browser suite requires Playwright Chromium (`npx playwright install chromium` if needed). It includes a full natural-duration race, so allow several minutes. It also verifies physical assembly, detailed inspection, the isolated fire demo, spectator controls, animated ranking, separated labels, a scored fire/retirement sequence and mobile fitting/ERS. Screenshots are saved in `artifacts/`.

`npm run preview` serves the production bundle. Fonts and artwork are local; no backend is needed. Competitive balance, participant comprehension and 40-client performance still require full-build tests and playtests.
