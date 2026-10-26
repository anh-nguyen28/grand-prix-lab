# AI Grand Prix: build it, then watch it race

_Independent player-workflow prototype · revised 26 October 2026_

## Design direction

An original F1-inspired garage and spectator racing game. Roblox's robot-building assessment informs the visible assembly → test → improve loop. EA SPORTS F1 25 informs the team-owner perspective, identity and race presentation. F1 Manager informs the spectator viewpoint and visible mechanical stakes. The player engineers the car; the driver handles steering. Research, source links and engineering limits are documented in [RESEARCH.md](RESEARCH.md).

This local prototype remains separate from the in-development `ai-grand-prix/`. Dune Valley is playable; the other five rounds are marked previews.

## Player workflow

1. **Name your driver.** The garage identity panel and profile button open the name form. The same name appears above the car, in live timing and in the final classification. The player has a red YOU marker.
2. **Read the race brief.** Understand the long straight, demanding corners and hot long stint. The collapsed **Optional surface puzzle** offers three sensor observations and a 3-point classification bonus before the first run. Its answer does not change car performance; skipping it leaves all race points available.
3. **Assemble.** Choose a category on the physical parts shelf. Drag an illustrated component onto the car or its highlighted fitting point. Alternatively, tap/click a component and then its fitting point. Keyboard users can activate the same buttons. Escape cancels a picked-up part.
4. **Understand the choice.** More details explains the benefit, compromise, visible consequence, relative ratings and price difference from the installed part. Fit to car is also available here. **How your car will race** beneath the car explains the actual benefits and elevated cornering, traction and cooling risks. It is feedback about the fitted parts, not another required decision.
5. **Try a scenario if needed.** The engineering lab offers six controlled demonstrations. They use a separate race plan and do not consume tests, change the build, disclose mystery clues or affect points.
6. **Test.** Use up to two practice runs. Compare sector feedback, change the setup and try again.
7. **Qualify.** One lap locks a setup snapshot and sets the grid against five simulated rivals. Then change up to two slots before the race.
8. **Watch the Grand Prix.** Six-and-a-half seconds of starting lights lead into eight laps over roughly four minutes. Let the TV director follow battles and incidents, or choose the full circuit or your car. Read driver names, gaps, condition indicators and the incident feed. Deploy up to three ERS boosts.
9. **Learn from the result.** The classification and engineering debrief show what happened, its time cost, and what to change. The optional surface bonus and classification lesson are shown separately.

## Assembly rules

- Four complete slots: tyres, power-and-cooling package, aero, sensor.
- The budget is **100 credits**. Swaps refund the old part in full.
- Dragging and tapping use the same validated `SET_PART` command. A visually selected part is not installed until dropped/fitted.
- Incompatible fitting points do not install the part. The correct point is highlighted; a drop on the car chooses that slot.
- The first scan locks the sensor. Sensors reveal evidence; they do not improve the driver's steering or repair mechanical issues.
- The first test or qualifying lap locks prediction entry. The player may continue without a prediction bonus.
- After qualifying, at most two slots can differ from the qualifying snapshot. Reverting a slot restores its allowance.
- Part details remain readable even when a part cannot be fitted. Disabled choices explain budget, sensor or adjustment limits.

## Race rules and pacing

**Field and duration.** Six cars run eight actual laps, each with three timed sectors. Default playback lasts approximately 240 seconds plus the light sequence. The final car may finish slightly earlier after boosts. This provides roughly twice the per-lap viewing time of the previous version.

**Grid and pace.** Qualifying sets the starting order. Grid positions introduce small launch delays. Setup-derived performance, a common spec baseline, aero tradeoffs, tyre endurance and fixed driver variation shape sector times. The shared circuit zones redistribute each sector's time into acceleration and braking portions: cars cover straight sections faster and corner sections slower. Rivals do not adapt to the player's pace. Their ERS plans are fixed. Jordan Lee deliberately uses the undercooled sprint package to show an early advantage giving way to a failure; this is a scenario opponent, not a claim of optimal rival strategy.

**ERS.** Three charges. Each raises timeline progress by 18% for six simulated race seconds, with an eight-second interval between deployments. The gain accumulates; pressing the button never teleports the car. Boosts affect the same timeline used for classification. They are unavailable before the start, while paused, after finishing or retiring, or when the resource is exhausted. The prototype does not model a full energy-harvesting system or make deployment strength depend on straight/corner geometry.

**Incidents.** Setup-exposed incidents are deterministic, attached to lap distance, and disclosed by the part details and “How your car will race”. Each inserts extra time into the affected portion of a car's timeline. Effects, line changes, live progress and results use that same timeline. They are not decorative explosions or independent random penalties.

| Exposed setup | Race situation | Timing | Extra timeline cost |
| --- | --- | --- | --- |
| Slick tyres | Loose-surface wheelspin | Lap 1 / lap 6 | 1.8s / 2.4s |
| Low-drag aero | Understeer | Lap 2 | 2.5s |
| Low-drag aero | Raised-kerb contact | Lap 5 | 4.2s |
| Attack power/cooling | Overheating | Lap 4 / lap 7 | 3.2s each |
| Attack package + low-drag aero | Brake fade | Lap 3 | 2.8s |
| Uncooled sprint package | Overheating, then brake fade | Laps 2 / 3 | 3.2s / 2.8s |
| Uncooled sprint package | Smoke, brake fire, retirement | Lap 5 | Race-ending failure |

These timings and costs are authored game values, not predictions for a real F1 car. Other combinations avoid the corresponding incidents but can give up initial pace, acceleration or budget. A kerb strike produces sparks and a time loss; there is no persistent wing breakage or car-to-car collision solver yet.

**Fire and retirement.** The uncooled sprint package has inadequate brake cooling for this course. It is labelled as a retirement risk before selection. It starts quickly, develops heat and braking problems, then slows almost to a stop for nine simulated seconds while smoke builds into flame. It pulls aside as the failure develops, retires on lap 5, parks outside the line and stays there while the race continues. The tower marks it OUT / RETIRED, and its ERS is disabled. A separate blocked-duct lab preview does not affect the build or score. These are explicit educational failure scenarios; aero choices alone do not cause a fire.

**Finish and scoring.** The same race sample used to position the cars produces the final order. Equal rounded finish times share a place. Finishing positions earn 25 / 18 / 15 / 12 / 10 / 8 points, plus 3 for a correct optional surface answer. Retired cars are listed after finishers and receive zero race points; any earned bonus is retained. Retirement is shown explicitly instead of a fabricated finish time. The final debrief lists the player's incident costs and remedies.

**Local playback.** Pause freezes the race and disables ERS. Switching between 1× and 2× changes presentation time, not the result model. Skip to finish resolves the current plan with boosts already deployed. The race pauses when the browser tab is hidden. These are prototype review controls; competitive multiplayer must put such controls under the host/server.

## What the spectator sees

- **TV director:** the default elevated camera follows close battles and active incidents, prioritizing brake fires.
- **Circuit:** overview with the whole field and the circuit's shape.
- **Follow me:** a moving elevated view centered on the player's car.
- Larger, color-matched nameplates anchored to visible cars. Labels spread apart, remain readable and connect back to their cars. YOU identifies the player's car. Drivers outside a focused camera remain listed in the timing tower.
- A larger timing tower whose rows animate up and down as positions change, with gaps, movement from qualifying and clear retirement status.
- A circuit minimap, labelled corners, direction arrows and braking marks. The scene takes most of the screen during a race; setup panels make way for the competition.
- Laps, race time and a zone readout connecting the player's setup to the current straight or corner.
- An opening-grid introduction, early battle, middle stint and final-lap messaging.
- Dust, yaw, wider lines, vapour, brake glow, kerb sparks and brake fire when the relevant incident is active.
- Incident explanations and time costs, plus a short feed of overtakes and problems. Explanations remain visible briefly after recovery; Follow driver focuses the affected car.
- Cooling load shown as NORMAL / WARM / CRITICAL / FAILED, plus a tyre-life index. These are qualitative game indicators, not real sensor measurements.

On phones, starting the race brings the track into view and keeps ERS controls reachable. The parts shelf supports tap-to-fit as an alternative to dragging. Reduced-motion settings simplify decorative movement; race timing is preserved so resource opportunities do not change.

## Engineering scope

The car, parts and circuit are original stylized assets. The mixed-surface course preserves the AI classification activity; it is not a modern F1 championship circuit or regulation-compliant tyre simulation. Power and cooling are bundled into one slot to keep the decisions manageable.

The model demonstrates tradeoffs; it does not solve tyre forces, fluid flow, suspension dynamics, vehicle collision geometry or real component temperatures. The sprint-package retirement is a deterministic endurance lesson, and the separate fire lab is a controlled fault lesson. Weather, pit stops, punctures, crashes between cars and general persistent component damage remain future scope.

## Architecture and full-build path

- `shared/content.js`: budget, parts, course, drivers and race constants.
- `shared/engineering.js`: part explanations, ratings, behavior warnings and incident definitions.
- `shared/track.js`: shared circuit geometry, named zones, braking pace weights and landmarks.
- `shared/game.js`: command validation, phase transitions and scoring.
- `shared/simulation.js`: practice/qualifying setup evaluation.
- `shared/race.js`: distance-based timelines, incident time costs, ERS, samples and classification. Pure functions with no DOM/network dependency.
- `src/adapters/local-session.js`: replaceable command/snapshot boundary.
- `src/ui/part-art.js`: original vector part illustrations.
- `src/ui/assembly.js`: pointer dragging; click and keyboard alternatives use the same command path.
- `src/ui/engineering-ui.js`: detailed part inspection, behavior explanations and incident lab.
- `src/scene/racecar.js`, `circuit.js`, `effects.js`, `workshop.js`: geometry, effects, fitting-point projection, nameplates and spectator cameras.
- `src/ui/race-ui.js`: broadcast timing, playback controls, conditions and incident explanations.

For multiplayer, make the server authoritative for setup validation, clocks, boost timestamps, incident plans and scoring. Clients send intent rather than trusted elapsed times. Redact hidden surface answers and future incidents from participant snapshots, then broadcast sanctioned events. Replay/reconnect must restore the same race state. Move pause/speed to the host; a participant cannot change competitive time.

Later add rooms, identities, team editing, host/projector views, reconnect recovery and persistence. Extend the incident model toward grip, heat, wear and proximity only after participant tests validate the educational benefit. Load-test the server and client rendering with the intended field size; this local prototype is not evidence of 40-client performance.

## Verification

Domain tests cover budgets, locks, adjustment limits, deterministic race completion, boost constraints, all 27 non-sprint tyre/power/aero combinations, sprint-package retirement and its scoring, event location and time costs, setup remedies, and isolated demonstrations. Browser tests cover drag-and-drop, keyboard and mobile fitting, detailed inspection, driver identity, camera controls, pause, animated ranking positions, visible fire and retirement in a scored race, incident presentation and the complete natural-duration race. Screenshots are saved in `artifacts/`.
