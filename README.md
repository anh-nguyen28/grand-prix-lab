# AI Grand Prix — engineering and spectator prototype

An independent F1-inspired garage and player-workflow prototype in `grand-prix-lab`. No changes are made to the neighboring `ai-grand-prix` project.

## Open it

On macOS, double-click **Start Preview.command** in Finder. It starts the server and opens **http://localhost:4174**. Keep that Terminal window open; Control-C stops it.

Or, with Node.js 22.12+:

```sh
npm install
npm run dev
```

Use **Your driver** to set your name. Drag an illustrated part onto the car, or tap a part and then the highlighted fitting point. **More details** explains each option. **Preview failures** opens the engineering incident lab.

## Playable now

- Original 3D open-wheel car with visible component changes and projected fitting points.
- Visual parts shelf, pointer drag-and-drop, tap/keyboard fitting and detailed part inspection.
- Four slots, 100-credit budget, an optional sensor-based surface bonus, two practice tests and qualifying.
- **How your car will race** explains the fitted setup's cornering, traction and cooling compromises; the race brief explains why they matter.
- **Eight-lap race, about four minutes**, with six named drivers and a start-light sequence.
- **TV director, Circuit and Follow me** spectator cameras, larger nameplates and a red YOU marker.
- Larger circuit with named corners, braking/acceleration zones, direction arrows and a live minimap.
- Live timing with rows moving up/down as ranks change, gaps, ERS boosts, cooling/tyre indicators, race-engineer messages and incident feed.
- Visible wheelspin, understeer, overheating, brake fade and kerb contact, tied to actual time costs.
- An explicitly undercooled sprint package: early pace, heat, brake fade, a visible lap-5 fire and retirement with zero finishing points.
- Six separate 18-second incident demonstrations, including a deliberate blocked-duct brake fire. These do not affect the player's build, tests or score.
- Local pause, 1×/2× playback and skip controls. The race pauses if the browser tab becomes hidden.
- Final standings, engineering debrief and AI classification lesson.
- Desktop/mobile layouts and six-round season overview; rounds 2–6 remain design previews.

The five rivals are simulated. This prototype has no live multiplayer, persistence, host/projector connection or authentication. Refreshing resets the session. WebGL is needed for the visual car/race experience. The mixed-surface car rules are educational abstractions, not real F1 specifications. Scored races can include a disclosed setup-driven brake fire and retirement. Incidents are authored, repeatable scenarios rather than a full physics simulation. Contact currently means a kerb strike rather than car-to-car collision physics.

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
