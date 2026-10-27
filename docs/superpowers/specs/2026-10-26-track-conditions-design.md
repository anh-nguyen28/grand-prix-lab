# Track conditions and section-based incidents — design

Status: draft for review. No code written yet.

## Goal
Replace the single course with three tracks, each 4–5 sections with their own surface/weather condition. Each section demands certain car stats. A build is compared with the section's baseline; a deficit costs time, then causes an incident, then (on crashable sections) a crash. The player learns which parts suit which conditions.

## Decisions (agreed)
1. Add new parts: Hard, Intermediate, Wet tyres; a 5th slot **Chassis** with 4 parts.
2. The six-card season preview is replaced by the three tracks (track picker).
3. A crash does **not** stop the car or end its race. It costs a big chunk of time (≈12 s, plus a visible crash event and recovery), and the car carries on. Only the existing brake fire still retires a car.

## 1. Stats model
Every part declares `stats` (0–100). A build profile is computed per slot rules below.

| Stat | Meaning | Provided by |
|---|---|---|
| dryGrip | grip on clean dry surface | tyres |
| wetGrip | grip on damp/standing water | tyres |
| warmup | grip while tyres are cold | tyres |
| abrasion | resistance to gritty surface wear | tyres, chassis (light = better) |
| heatTol | tyre/brake tolerance of heat | tyres |
| downforce | aero cornering load | aero |
| topSpeed | straight-line speed | power, aero (drag), chassis (weight) |
| cooling | power-unit and brake cooling | power |
| stability | resistance to bumps and kerbs | chassis, aero |

Build profile: tyre stats pass through; `downforce` from aero; `cooling` from power (the existing `ENGINEERING.*.ratings.cooling`); `stability` = 0.6 chassis + 0.4 aero; `topSpeed` = from existing `pace.straight` via the same mapping as `specSheet`, minus a chassis weight penalty.

### New parts
Tyres (slot `wheels`): Hard 20 cr (dryGrip 50, wetGrip 25, warmup 20, abrasion 95, heatTol 85); Intermediate 18 cr (45/80/55/40/35); Wet 20 cr (25/95/50/30/20).
Chassis (slot `chassis`, new): Stiff aluminium 8 cr (stability 25, light); Soft-sprung steel 14 cr (stability 60, heavy); Titanium adaptive 22 cr (stability 85); Carbon monocoque 26 cr (stability 80, lightest). Default build gets Stiff aluminium.
Existing parts get `stats` per the plan table (tunable): Soft 85/20/80/25/30; Slick 70/15/35/50/55; Medium 65/35/60/50/55; Grooved 55/60/50/75/60; Endurance 55/50/40/90/80; Sand paddles 35/40/45/70/55 (dryGrip/wetGrip/warmup/abrasion/heatTol).
Budget rises from 75 to a value set by `balance.test.js` (start at 90).

## 2. Section evaluation
```js
section = { id, name, kind:'straight'|'corner'|'sweep', condition, demand:{stat:weight,...}, required, crashable, warning, incident }
```
`sectionScore(build, section, lap) = Σ weight·stat'` where `stat'` is the stat after (a) the condition modifier and (b) wear for that lap.
`margin = score − required`.

| Margin | Outcome |
|---|---|
| ≥ 0 | clean |
| −10 … <0 | time loss = 0.12 s × deficit |
| −25 … <−10 | incident (type from section), loss 1.5–4 s, with warning/moment/impact |
| < −25 | crashable: **crash** (≈12 s loss, scaled up to 16 s by how far below −25); non-crashable: heavy incident (4 s) |

Condition modifiers (applied to stats before weighting): dry none; abrasive abrasion weighs more, wear ×2; damp dryGrip ← 0.5·dryGrip+0.5·wetGrip; cold dryGrip scaled by warmup; bumpy stability weighs more; hot cooling and heatTol −15, wear ×2; rain dryGrip ← wetGrip. Wear: each lap subtracts `wearRate × lap` from tyre stats on abrasive/hot sections, so a car may pass lap 1 and fail lap 6.

Everything is deterministic (no randomness), as the existing incidents are.

## 3. Crash rule
A crash is an incident of type `crash` with a large `loss` (12 s base). It goes through the existing timeline path in `race.js` exactly like other incidents (warning, moment with debris/impact effects, impact), so positions drop and the car continues. No retirement, no zero points. Only `fire` still retires. A car that crashes repeatedly (e.g. once per lap) simply finishes far down the order.

## 4. Tracks (required = section baseline, tunable)
**Dune Valley — Sun and Grit (easy):** Start straight (dry, topSpeed 40); Gravel hairpin (abrasive, crashable, dryGrip .4/downforce .3/abrasion .3, 55); Heat-soak back straight (hot, cooling .5/heatTol .5, 50); Dust chicane (abrasive corner, 60).
**Mountain Pass — Cold and Wet (medium):** Shaded climb (cold, warmup .5/downforce .5, 50); Switchback hairpins (damp, crashable, wetGrip .5/downforce .5, 55); Waterfall straight (rain, crashable, wetGrip .6/topSpeed .4, 55); Summit sweeper (dry, dryGrip .5/downforce .5, 60); Downhill braking zone (cold, warmup .5/cooling .5, 55).
**Quarry Ring — Rough and Hot (hard):** Kerb chicane (bumpy, crashable, stability .6/dryGrip .4, 55); Washboard straight (bumpy, stability .5/topSpeed .5, 50); Furnace hairpin (hot, crashable, cooling .5/heatTol .5, 60); Quarry sweeps (abrasive, abrasion .5/downforce .5, 55); Closing straight (dry, topSpeed, 45).

Each track keeps a hidden "mystery" section whose condition the sensors reveal (thermal → hot/cold/damp, lidar → bumpy, radar → abrasive, camera → visible clues). The existing prediction question becomes "which condition is this section?" so the classification lesson survives.

## 5. Code changes
- `shared/tracks.js` (new): the three tracks, sections, geometry points/zones, landmarks. Replaces `COURSE`, `TRACK_POINTS`, `TRACK_ZONES`, `SEASON`.
- `shared/conditions.js` (new): modifiers, wear, `sectionScore`, `evaluateSection`.
- `shared/content.js`: add `stats`, new parts, `chassis` slot in `SLOTS`/`SLOT_LABELS`, budget, `DEFAULT_BUILD`, rival builds per track.
- `shared/engineering.js`: `buildIncidents(build, track)` from `evaluateSection`; new incident types (aquaplane, coldslide, tyreshred, bumpbreak, crash with ≈12 s loss); `setupRisks`/`raceRiskForecast` per section; `specSheet` gets stability.
- `shared/simulation.js` and `race.js`: sectors become track sections; `buildTimeline` weights come from the track; crash is a large-loss incident.
- `shared/game.js`: state holds the selected track; commands `selectTrack`.
- UI: track picker replaces the season dialog/cards; condition strip; per-section forecast in practice; chassis tab in the shelf; part art/looks and 3D car for new parts; circuit geometry per track; rain/dust/heat/cold effects.
- Docs: update `DESIGN.md` and `README.md`.

## 6. Testing
- `tests/conditions.test.js`: each margin band, each condition modifier, wear over laps, grip-20-at-sharp-corner crashes.
- `tests/balance.test.js` per track: ≥4 distinct winning builds, no build wins all three tracks, crash-or-fire rate 25–45% of affordable builds, the default build does not win, the best expensive build does not auto-win.
- Race tests: a crash adds its large time loss, the car still finishes with normal points for its place, and fire is still the only retirement.
- Browser specs updated for the 5th slot and the track picker.

## 7. Build order
1. Stats and `evaluateSection` engine on the current course; existing tests pass.
2. Dune Valley on the new engine; crash rule; forecast UI.
3. New parts (art, looks, 3D) and chassis slot.
4. Mountain Pass and Quarry Ring; track picker; effects; docs.

## Open items (defaults chosen)
- All numeric thresholds and ratings are first guesses to be tuned by balance tests.
- Rivals get hand-authored builds per track.
