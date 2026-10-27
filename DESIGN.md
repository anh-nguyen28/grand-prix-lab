# AI Grand Prix: build it, then watch it race

_Independent player-workflow prototype · revised 26 October 2026_

## Design direction

An original F1-inspired garage and spectator racing game. Roblox's robot-building assessment informs the visible assembly → test → improve loop. EA SPORTS F1 25 informs the team-owner perspective, identity and race presentation. F1 Manager informs the spectator viewpoint and visible mechanical stakes. The player engineers the car; the driver handles steering. Research, source links and engineering limits are documented in [RESEARCH.md](RESEARCH.md).

This local prototype remains separate from the in-development `ai-grand-prix/`. Three tracks are playable: Dune Valley, Mountain Pass and Quarry Ring. Each has its own sections and conditions.

## Player workflow

1. **Name your driver.** The garage identity panel and profile button open the name form. The same name appears above the car, in live timing and in the final classification. The player has a red YOU marker.
2. **Follow the Field notes.** Rae, the race engineer, narrates the round as the story of teaching an AI. Chapter 1 introduces the metaphor (car = model, clues = data, practice = training, qualifying = validation, race = real world). Chapter 2 takes three sensor readings of the track's mystery section. Chapter 3 asks the player to label its condition for 3 bonus points. Its answer does not change car performance; skipping it leaves all race points available.
3. **Assemble.** Choose a category on the physical parts shelf. Drag an illustrated component onto the car or its highlighted fitting point, or double-click it to fit it directly. Alternatively, tap/click a component and then its fitting point. Keyboard users can activate the same buttons. Escape cancels a picked-up part.
4. **Understand the choice.** More details explains the benefit, compromise, visible consequence, relative ratings and price difference from the installed part. Fit to car is also available here. **How your car will race** beneath the car explains the actual benefits and elevated cornering, traction and cooling risks. It is feedback about the fitted parts, not another required decision.
5. **Try a scenario if needed.** The engineering lab offers six controlled demonstrations. They use a separate race plan and do not consume tests, change the build, disclose mystery clues or affect points.
6. **Test.** Use up to two practice runs. Each run is one lap of your car alone, played a little slower than real time (0.5×–2× speeds and a skip button). Every weak section shows the worst problem it will cause in the race, in track order: the car shudders or slides, a pop-up names the problem and the seconds it costs, and a caption says what is coming up, when it first happens in the race and the time lost so far. A fire is shown but does not end the lap. The report then shows the lap time and the section forecast, and **Watch run again** replays the same lap. Compare, change the setup and try again.
7. **Qualify.** One lap locks a setup snapshot and sets the grid against five simulated rivals. Then change up to two slots before the race.
8. **Watch the Grand Prix.** Six-and-a-half seconds of starting lights lead into eight laps over roughly three minutes at 1×. Let the TV director follow battles and incidents, or choose the full circuit or your car. Read driver names, gaps, condition indicators and the incident feed. Deploy up to three ERS boosts.
9. **Learn from the result.** The classification and engineering debrief show what happened, its time cost, and what to change. The Field notes epilogue names the idea (classification) and recaps each chapter of the story.

## Assembly rules

- Five complete slots: tyres, power-and-cooling package, aero, chassis, sensor.
- The budget is **90 credits**. The best part in every slot costs far more, so every build gives something up. A pricier sensor costs credits the car could use. Swaps refund the old part in full.
- Dragging and tapping use the same validated `SET_PART` command. A visually selected part is not installed until dropped/fitted.
- Incompatible fitting points do not install the part. The correct point is highlighted; a drop on the car chooses that slot.
- The first scan locks the sensor. Sensors reveal evidence; they do not improve the driver's steering or repair mechanical issues.
- The first test or qualifying lap locks prediction entry. The player may continue without a prediction bonus.
- After qualifying, at most two slots can differ from the qualifying snapshot. Reverting a slot restores its allowance.
- Part details remain readable even when a part cannot be fitted. Disabled choices explain budget, sensor or adjustment limits.

## Garage layout

The top row holds three boxes of the same height: the **parts shelf** (the whole box scrolls, so parts stay level with the car; its pinned header compacts to a one-line budget and smaller category tabs once the player scrolls), the **car**, and **car stats** (six specs, setup risks and the fitted parts with their total). **Field notes** span the full width below in three readable columns: Rae's story, what to do in this chapter, and a glossary mapping the game to AI that highlights the current idea. Chapter tabs let the player look back; the notes jump to the new chapter whenever the story advances. During a race the row becomes timing tower | track | live chat.

## Parts, budget and balance

| Slot | Options (credits) |
| --- | --- |
| Tyres | Slick 10 · Medium 14 · Soft 16 · Grooved 18 · Intermediate 18 · Hard 20 · Wet 20 · Sand paddles 22 · Endurance 24 |
| Power | Efficiency 12 · Twin-battery hybrid 16 · Balanced hybrid 20 · Uncooled sprint 22 · Turbo 26 · Attack 28 |
| Aero | Low-drag 8 · Balanced 16 · Ground-effect floor 20 · Active DRS 22 · High-downforce 26 |
| Chassis | Stiff aluminium 8 · Soft-sprung steel 14 · Titanium adaptive 22 · Carbon monocoque 26 |
| Sensor | Camera 4 · Thermal 8 · Lidar 10 · Radar 12 |

Every part changes the 3D car: tyre width, stripe colour and tread (grooves, blocks, paddle fins); power-unit inlets, engine cover and a coloured signature (cooling grille, glowing battery packs, turbo snorkel, glowing exhausts, heat stripes); wing width, height, number of elements, front-wing flaps, DRS flap and ground-effect skirts and diffuser; and a distinct sensor pod on a mast. Both the 3D car (`src/scene/racecar.js`) and the shelf illustrations (`src/ui/part-art.js`) draw from one look table, `src/ui/part-looks.js`, so colours and shapes always match. Car stats animate when parts change: each bar slides from its old value to the new one, turns red below 40, yellow from 40 to 69 and green from 70, and shows a +/− badge for a few seconds. Fitting or picking up a part keeps the player's camera angle; the camera only resets when switching between the garage and circuit views. Incidents follow part traits (low-grip tyres, low-downforce aero, hot or sprint power), so a new part joins the incident system by declaring a trait.

Each part declares its `pace` (seconds per lap gained or lost) on the straight and the technical corners, and tyres declare their wear. It also declares condition **stats** (0–100, `shared/part-stats.js`): tyres have dry grip, wet grip, warm-up, abrasion resistance and heat tolerance; power has output and cooling; aero has downforce, straight-line efficiency and stability; the chassis has stability and weight. Practice telemetry, qualifying, the race and the spec sheet read these same values. `tests/balance.test.js` runs every affordable build on every track: at least four winning builds using different tyres and power units, no build that wins all three tracks, 25–45% of builds that crash or retire, a starting car that does not score, every part except the sprint package reaching the top five on some track, and a priciest build that does not automatically win.

## Tracks, conditions and sections

There are three tracks (`shared/tracks.js`), each with 4–5 sections. A section has a condition (dry, abrasive, damp, cold, bumpy, hot or rain), the stats it demands with weights, and a baseline score (`required`). The car's score for a section is the weighted sum of those stats after the condition's wear for that lap (abrasive and hot sections wear grip and heat tolerance lap by lap). The **margin** is score minus baseline.

| Margin | Result |
| --- | --- |
| 0 or more | Clean |
| −10 to below 0 | Slower: 0.12 s per point of deficit |
| −25 to below −10 | Incident (warning, moment, impact): 1.5–4 s |
| below −25 | Crashable section: **crash**, 12–16 s lost, the car keeps racing. Hot section: escalates overheat → brake fade → fire (lap 5 or later) and retires. Otherwise a heavy 4 s incident |

A section can crash a car once; after that the driver backs off to a plain incident. A car that keeps failing the same section is reported on the first failing lap and then every third lap; other laps lose half as much, quietly.

| Track | Sections (condition) |
| --- | --- |
| Dune Valley, "Sun and grit" | Start straight (dry) · Gravel hairpin (abrasive, crashable) · Heat-soak back straight (hot, fire risk) · Dust chicane (abrasive) |
| Mountain Pass, "Cold and wet" | Shaded climb (cold) · Switchback hairpins (damp, crashable) · Waterfall straight (rain, crashable) · Summit sweeper (dry) · Downhill braking zone (cold) |
| Quarry Ring, "Rough and hot" | Kerb chicane (bumpy, crashable) · Washboard straight (bumpy, crashable) · Furnace hairpin (hot, fire risk) · Quarry sweeps (abrasive) · Closing straight (dry) |

Each track has a hidden mystery section. The sensors read it (thermal: heat and moisture, lidar: shape, radar: structure, camera: what is visible) and the player labels its condition for 3 bonus points. The practice report shows a section forecast: the condition, the baseline, the car's score, the weakest stat and the best single-part swaps within budget.

## Race rules and pacing

**Field and duration.** Twenty cars run eight actual laps, each with three timed sectors, played back in about 175 seconds plus the light sequence at 1×. The speed button cycles 1×, 1.5×, 2× and 0.5×. Playback speed never changes the result. The field is sized like a real workshop (the requirements allow up to 40 players in teams of 1–3), so the broadcast is designed for a crowded track.

**Grid and pace.** Qualifying sets the starting order. Grid positions introduce a 0.12 s launch delay per slot. Setup-derived performance, a common spec baseline, aero tradeoffs, tyre endurance and fixed driver variation shape sector times. The shared circuit zones redistribute each sector's time into acceleration and braking portions: cars cover straight sections faster and corner sections slower. Rivals do not adapt to the player's pace. Each has a fixed three-boost ERS plan, the same allowance as the player, so builds decide the order and ERS timing fine-tunes it. Jordan Lee and Mateo Cruz deliberately uses the undercooled sprint package to show an early advantage giving way to a failure; this is a scenario opponent, not a claim of optimal rival strategy.

**ERS.** Three charges. Each raises timeline progress by 18% for six simulated race seconds, with an eight-second interval between deployments. The gain accumulates; pressing the button never teleports the car. Boosts affect the same timeline used for classification. They are unavailable before the start, while paused, after finishing or retiring, or when the resource is exhausted. The prototype does not model a full energy-harvesting system or make deployment strength depend on straight/corner geometry.

**Incidents.** Setup-exposed incidents are deterministic, attached to lap distance, and disclosed by the part details and “How your car will race”. Each inserts extra time into the affected portion of a car's timeline. Effects, line changes, live progress and results use that same timeline. They are not decorative explosions or independent random penalties.

Incidents come from the section results above, not from part traits. The incident types are wheelspin, understeer, overheating, brake fade, kerb contact, aquaplaning, cold tyres, tyre shredding, parts shaken loose, crash and brake fire. A crash produces sparks and a time loss; the car keeps racing and finishes on its time. Only the brake fire retires a car.

These timings and costs are authored game values, not predictions for a real F1 car. Other combinations avoid the corresponding incidents but can give up initial pace, acceleration or budget. A kerb strike produces sparks and a time loss; there is no persistent wing breakage or car-to-car collision solver yet.

**Fire and retirement.** The uncooled sprint package has inadequate brake cooling for this course. It is labelled as a retirement risk before selection. It starts quickly, develops heat and braking problems, then slows almost to a stop for nine simulated seconds while smoke builds into flame. It pulls aside as the failure develops, retires on lap 5, parks outside the line and stays there while the race continues. The tower marks it OUT / RETIRED, and its ERS is disabled. A separate blocked-duct lab preview does not affect the build or score. These are explicit educational failure scenarios; aero choices alone do not cause a fire.

**Finish and scoring.** The same race sample used to position the cars produces the final order. Equal rounded finish times share a place. Finishing positions earn 25 / 18 / 15 / 12 / 10 / 8 points, plus 3 for a correct optional surface answer. Retired cars are listed after finishers and receive zero race points; any earned bonus is retained. Retirement is shown explicitly instead of a fabricated finish time. The final debrief lists the player's incident costs and remedies.

**Local playback.** Pause freezes the race and disables ERS. Switching between 1× and 2× changes presentation time, not the result model. Skip to finish resolves the current plan with boosts already deployed. The race pauses when the browser tab is hidden. These are prototype review controls; competitive multiplayer must put such controls under the host/server.

## What the spectator sees

- **TV director:** every incident is logged and queued. The camera cuts (no slow motion) to each one and holds at least about 3 seconds, ordered brake fire → your car → others. Before your own incident it cuts to your car during the warning, so the moment itself is on screen. Otherwise it follows battles at the front or around you.
- **Picture-in-picture:** a second incident at the same moment appears in an inset, so no incident goes unseen.
- **Circuit:** overview with the whole field and the circuit's shape.
- **Follow me:** a moving elevated view centered on the player's car.
- Full nameplates only for your car, the camera's focus, the inset car and cars in an incident; three-letter code chips for everyone else, so 20 cars stay readable.
- A compact timing tower (20 rows) with animated position changes, gaps, movement from the grid, WATCH/incident tags and clear retirement status.
- TV callouts, one at a time: OVERTAKE (front three or involving you), BATTLE FOR Pn (within 0.6 s), FASTEST LAP and FINAL LAP.
- A gap readout to the cars ahead and behind. Within 0.5 s of the car ahead, ERS shows an attack window.
- A circuit minimap, labelled corners, direction arrows and braking marks. The scene takes most of the screen during a race; setup panels make way for the competition.
- Laps, race time and a zone readout connecting the player's setup to the current straight or corner.
- An opening-grid introduction, early battle, middle stint and final-lap messaging.
- Dust, yaw, wider lines, vapour, brake glow, kerb sparks and brake fire when the relevant incident is active.
- Each incident has three beats. **Warning:** about 3 race seconds before, an amber ring, a WATCH tag in the tower and an engineer call. **Moment:** a yellow-flag lower-third (red for fire) naming the car, problem, track zone and time cost, a yellow ring under the car, effects and a pulsing minimap pin. **Impact:** once the car recovers, the lower-third turns into an IMPACT card: P before → P after and who got past. Pins stay on the minimap.

## Live chat

During the race the right-hand column becomes a live chat (below the track on narrower screens).

- **Race control** posts lights out, incidents (same-type incidents within two race seconds share one line, so a first-lap pile-up reads as one message), retirements, fastest laps, the final lap, and your position changes at most every five race seconds.
- **Rivals** react to events that really happened to them: an overtake, their own incident (often naming the part, e.g. “Wrong tyres for that surface. Lesson learned”), a fastest lap. At most one rival line every three race seconds keeps it readable. When you post, the car ahead of you replies.
- **You** can type (Enter to send) or tap a quick reaction (🔥 👏 😮 🏁 GG).
- **Safety:** messages are trimmed, limited to 80 characters and one every 2 seconds, filtered against a starter word list, and always HTML-escaped. These rules live in `shared/chat.js`. In multiplayer, the server must apply them before broadcasting, and the host should be able to mute a player and clear the chat. Replace the starter word list with the organisation's own before a live event.

## Learning from incidents

- **Practice** cannot show late-race problems on one lap, so each practice and qualifying report lists **Race risks found** for the fitted parts (lap and cost, or retirement). **Watch** plays the isolated demo; **Fix it** opens the right parts tab and highlights every affordable single-part swap that removes the risk.
- **Results** show the podium, your **incident reel** (each with its impact, an exact replay and the parts that would have prevented it), up to three **lessons from the field** (problems you did not have, such as a rival's brake fire), and the full classification on demand.
- **Replays** re-run the deterministic race from three seconds before the incident to two seconds after, following that car. They are presentation only.
- **Rebuild from this car** starts a fresh round with the same parts, so the next attempt can apply exactly what the race taught.
- Cooling load shown as NORMAL / WARM / CRITICAL / FAILED, plus a tyre-life index. These are qualitative game indicators, not real sensor measurements.

On phones, starting the race brings the track into view and keeps ERS controls reachable. The parts shelf supports tap-to-fit as an alternative to dragging. Reduced-motion settings simplify decorative movement; race timing is preserved so resource opportunities do not change.

## Engineering scope

The car, parts and circuit are original stylized assets. The mixed-surface course preserves the AI classification activity; it is not a modern F1 championship circuit or regulation-compliant tyre simulation. Power and cooling are bundled into one slot to keep the decisions manageable.

The model demonstrates tradeoffs; it does not solve tyre forces, fluid flow, suspension dynamics, vehicle collision geometry or real component temperatures. The sprint-package retirement is a deterministic endurance lesson, and the separate fire lab is a controlled fault lesson. Weather, pit stops, punctures, crashes between cars and general persistent component damage remain future scope.

## Architecture and full-build path

- `shared/content.js`: budget, parts, drivers, per-track rival builds and race constants.
- `shared/part-stats.js`: the condition stats of every part.
- `shared/conditions.js`: conditions, the build profile, section score and outcome (clean, slow, incident, crash, fire).
- `shared/tracks.js`: the three tracks: sections, conditions, baselines, circuit points, landmarks and mystery clues.
- `shared/engineering.js`: part explanations, ratings, incident definitions, the incident plan per track and the section report.
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

Domain tests cover budgets, locks, adjustment limits, deterministic race completion, boost constraints, every non-sprint tyre/power/aero/chassis combination on the default track, the section scoring bands and conditions, track geometry and every track's sections, balance targets, the Field notes story progression, sprint-package retirement and its scoring, event location and time costs, setup remedies, and isolated demonstrations. Browser tests cover drag-and-drop, keyboard and mobile fitting, detailed inspection, driver identity, camera controls, pause, animated ranking positions, visible fire and retirement in a scored race, incident presentation and the complete natural-duration race. Screenshots are saved in `artifacts/`.
