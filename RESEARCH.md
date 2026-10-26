# Research: a race you can understand from the pit wall

Reviewed 26 October 2026. This research uses official EA product material, Roblox's own assessment explanation, team engineering articles and a brake manufacturer's technical guidance. It is a document-based design study; it does not claim hands-on access to EA SPORTS F1 25 or Roblox's assessment. The reference period for the car is F1 25's original 2025 presentation, rather than the later 2026 regulations.

## What to learn from the references

| Reference finding | Design decision for this prototype |
| --- | --- |
| F1 25's My Team 2.0 separates the owner role from its two drivers and puts engineering choices into team management. | The player assembles and evaluates the car; autonomous drivers race it. A TV director, full-circuit view and Follow me camera keep the point of view outside the cockpit. |
| EA describes more detailed circuits, lighting, cinematics and expanded engineer/driver conversations. | Treat the race as a sequence with a starting grid, opening battle, long stint and final push. Use visible incidents and concise engineer explanations alongside the timing tower. |
| EA emphasizes team identity and customizable driver numbers/liveries. | Make driver identity prominent in the garage and above the car, with a red YOU marker and a consistent color in the standings. |
| F1 Manager puts race strategy above the track and includes mechanical failures that can disrupt a plan. | Make the race the main screen. Follow battles and incidents, keep the circuit map visible, and show a failed car stopping while the field continues. |
| Roblox describes building robots and testing systems thinking through interactive challenges with multiple approaches. | Let players manipulate visible parts, inspect a tradeoff, test, and improve. Avoid a single unexplained “best” selection. |

Sources: [EA My Team 2.0 deep dive](https://forums.ea.com/blog/f1-games-game-info-hub-en/take-the-lead-in-my-team-2-0---ea-sports%E2%84%A2-f1%C2%AE-25-deep-dive/12108842), [EA creative-director Q&A](https://www.ea.com/news/f1-25-qa), [EA launch overview](https://news.ea.com/press-releases/press-releases-details/2025/This-Story-Is-Yours---Take-the-Lead-in-F1-25-Available-Worldwide-Today/default.aspx), [Roblox Fair Play](https://about.roblox.com/newsroom/2025/07/fair-play-robloxs-game-based-talent-assessment), [Formula 1 on F1 Manager 2024](https://www.formula1.com/en/latest/article/f1-manager-2024-to-launch-this-summer-on-pc-and-console.2lqiOJobCAXCDnHRBahQyu).

These are design interpretations, not claims that the reference products implements this prototype's drag-and-drop system, spectator modes or incident rules. No EA or Roblox models, logos, audio or UI artwork are imported.

## Engineering principles worth making visible

### Aero: a fast straight can create a difficult corner

Downforce increases the tyre loading available for cornering, while aerodynamic drag resists forward motion. The floor and wings work together; simply fitting the largest wing is not a universal solution. Real teams evaluate aerodynamic behavior with CFD, wind tunnels and track work. For the player, the useful comparison is between cornering stability and straight-line pace, rather than a single overall “speed” number. [Mercedes downforce explanation](https://www.mercedesamgf1.com/news/feature-downforce-in-formula-one-explained)

Front/rear balance matters as well as total load. Understeer means the front cannot follow the requested line; oversteer means the rear loses stability. Low-speed behavior can differ from high-speed behavior as the aero platform changes. Our low-drag package deliberately exposes a simple running-wide situation, but real cars cannot be diagnosed from wing size alone. [Formula 1 technical analysis of cornering balance](https://www.formula1.com/en/latest/article/tech-tuesday-the-front-wing-dilemma-facing-red-bull-after-austria-exposed.6eMsMVdKIuVcTK0zS4XwhS)

**Visible result:** the car takes a wider line, briefly loses pace and may strike a raised kerb. The model records the same cost that appears in the broadcast and final debrief.

### Cooling: compact packaging has a cost

Cooling uses airflow to carry heat away. Changing inlet and outlet sizes affects both heat rejection and aerodynamic performance, so cooling capacity competes with drag and packaging. Ambient conditions and air density also affect the margin. The prototype combines output and cooling into one package to keep four understandable slots; a full engineering game should separate the radiator, ducts and power mapping. [Mercedes cooling and altitude explanation](https://www.mercedesamgf1.com/news/what-impact-does-high-altitude-have-on-an-f1-car)

**Visible result:** the attack package can develop a thermal warning, visible cooling vapour and reduced pace during a long stint. The condition display is an index, not an invented real temperature reading.

### Brakes: hot is normal; uncontrolled heat is a problem

F1 brake discs are designed for substantial heat. Temperature must be managed within the system's operating limits. Inadequate airflow can reduce braking performance and damage components. A blocked duct can lead to smoke, burning friction material and serious failure; it is a specific fault mechanism, not a guaranteed consequence of a powerful engine. [Mercedes brake systems](https://www.mercedesamgf1.com/news/formula-one-brake-systems-explained), [Brembo brake ventilation](https://www.brembo.com/en/motorsport/formula1/f1-brake-ventilation)

There are real examples of a mechanical brake fault escalating into fire: Verstappen described a right-rear brake remaining engaged at the 2024 Australian Grand Prix. That is distinct from choosing an aggressive aero setup. [Formula 1's account of the brake failure](https://www.formula1.com/en/latest/article/verstappen-explains-really-weird-cause-of-early-retirement-from-australian.1aOLI3Wa4D3fYzPnMTfn6F)

**Visible result:** the attack package can suffer brake fade. The explicitly undercooled sprint package gains early pace, overheats on lap 2, suffers brake fade on lap 3, then develops a brake fire and retires on lap 5. Its insufficient cooling is disclosed before fitting. This authored failure teaches that a fast short test does not prove endurance; the chosen lap is a game rule, not a predicted real-world threshold. A separate blocked-duct lab demonstration lets the player inspect smoke and fire without affecting a score.

### Tyres: grip changes over a stint

Tyre behavior depends on compound, load, temperature and wear. Graining and blistering are different mechanisms; both can affect the contact surface and performance. Heat distribution and construction matter, not just softness. [Pirelli's explanation of its tyre development](https://press.pirelli.com/the-latest-formula-1-pirelli-tyres/)

**Visible result:** our fictional loose-surface slick suffers wheelspin and more late-stint grip loss; the endurance package trades acceleration for consistency. These mixed-surface tyres preserve the original classification lesson and are not a representation of modern F1 dry compounds or tyre regulations.

## Consequence design

| Situation | What the spectator sees | Why it is understandable |
| --- | --- | --- |
| Loose-surface wheelspin | Dust, a small yaw movement, slower progress | “How your car will race” warned about traction; the event and result show a time cost. |
| Understeer | The front follows a wider arc | The low-drag aero option disclosed its reduced cornering margin. |
| Power-unit overheating | Vapour and a thermal warning, then reduced pace | Output and cooling were shown as opposing benefits. |
| Brake fade | Heat at the wheel and a wider braking line | The compact-cooling/high-speed combination was flagged. |
| Kerb contact | A lateral excursion, small bump and sparks | Contact is attached to an obstacle section after a handling limitation. |
| Brake fire | Smoke builds into a small flame while the car nearly stops | Restricted cooling is disclosed in the part details; a retired car stops and earns no finishing points. An isolated lab preview is also available. |

These are repeatable educational scenarios. They are not a continuous tyre, fluid or multibody physics simulation. Car-to-car crashes require relative position, closing speed, contact geometry and shared responsibility; adding them as arbitrary dice rolls would teach the wrong lesson. The current contact event is a kerb strike. Full collision physics, punctures, wing breakage and pit repairs are future scope. The brake-fire retirement is implemented.

## Spectator design: length is only one ingredient

The user's concern was the duration of the competition, not the apparent speed of individual cars. Making every car crawl would weaken the race. The design instead gives it more distance and a readable structure:

| Race beat | Implementation | What the player can judge |
| --- | --- | --- |
| Launch and opening laps | Starting lights, qualifying grid, stronger output on straights | Did the car gain an early position? |
| Corner sequences | Larger circuit, labelled hairpin/switchback, braking marks, slower corner traversal | Does the car hold its line or run wide? |
| Long stint | Tyre wear, cooling warnings and setup-specific incidents | Does the initial advantage last? |
| Failure and recovery | Director follows incidents; smoke, heat, sparks or fire; a cause and consequence caption | Which part caused the problem, and is the car still racing? |
| Final push | Final-lap call, remaining ERS, live gaps and final classification | Can the player convert remaining resources into a position? |

F1 Manager is the closer reference for watching the race while making decisions. Its official announcement describes the elevated strategic view, team communications and mechanical failures. Its camera presentation includes aerial and trackside viewpoints. Our implementation translates those principles into an automatic elevated director, an overview and a player-follow view, rather than reproducing its interface. [F1 Manager announcement](https://www.formula1.com/en/latest/article/f1-manager-2024-to-launch-this-summer-on-pc-and-console.2lqiOJobCAXCDnHRBahQyu), [Formula 1's release description](https://corp.formula1.com/july-including-new-create-a-team-mode/)

**The timing tower is part of the action.** Rows stay mounted and move to their new vertical position when an overtake occurs. Position, gap and a rise/fall cue update together. Retired drivers move below running cars and display OUT / RETIRED. The player's row stays red. Reduced-motion preferences remove the movement without hiding rank changes. These are our UI decisions, informed by the need to follow a broadcast; we are not claiming an exact copy of either game's timing tower.

**Track knowledge needs a visible location.** A minimap shows every car while the main camera follows a battle. Corner names, braking marks and direction arrows connect engineering explanations to the visible course. The same track-zone definitions weight the race timeline and name the zones. This is still an authored racing line, not a tyre-force solver.

## Why the race is longer

The previous five-lap/75-second race compressed a lap into roughly fifteen seconds. A player could miss an incident while reading a label. The new default is eight laps over approximately four minutes, plus a six-and-a-half-second light sequence. A lap has roughly twice the viewing time, and there is room for early pace, reliability and late-stint changes to become noticeable.

Pause freezes the local race. Playback can switch to 2×; it defaults to 1×. The same underlying plan drives both speeds and the result. This is a product-design hypothesis to test with players, not evidence that four minutes is the optimal session length.

## Making the choices understandable

“Prediction” and “setup forecast” previously looked like unexplained parallel systems. They now have separate, concrete roles:

- **Optional surface puzzle:** use sensor evidence to classify the unmarked surface for 3 extra points. The submitted answer never changes the car. The puzzle is collapsed beneath the race brief and can be skipped.
- **How your car will race:** describes the behavior of the installed parts. Benefits, risks and a failure preview explain what should appear on the track. It is not an additional action or a promise of final position.
- **More details:** inspect each physical part's gain, compromise, visual consequence and price before fitting it. The fitting interaction stays on the car.

The race brief now leads with straight-line output, cornering grip and enough cooling for the full distance. A full build could integrate classification more tightly with engineering decisions, but that should be tested rather than hidden behind ambiguous terminology.

## Full-build priorities

1. Keep the part metadata, behavior explanations and simulation consequences connected through shared definitions.
2. Replace fixed incidents with measured grip demand, temperature, wear and proximity once the educational loop is validated.
3. Add explicit cooling/brake/suspension choices only if participant tests show the four-slot vocabulary is comfortable.
4. Move race clocks, command validation and boost timestamps to an authoritative server. Local pause/speed controls become host controls; individual participants cannot change competitive time.
5. Add race replay from authoritative events so an incident can be inspected after scoring without changing the race.
6. Test name readability, attribution of incidents, alternative-build quality and the four-minute duration with actual players before balancing a full season.
