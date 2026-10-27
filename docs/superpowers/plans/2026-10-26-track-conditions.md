# Track Conditions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single Dune Valley course with three tracks (4–5 sections each, each section with a surface/weather condition). A build is scored per section against a baseline; a deficit costs time, then causes an incident, then (on crashable sections) a crash worth a big time loss.

**Architecture:** Pure rules in `shared/`: per-part `stats` (new `shared/part-stats.js`) feed `buildProfile` and `sectionOutcome` (new `shared/conditions.js`); tracks are data (new `shared/tracks.js`); `simulate`, `createRace` and `buildIncidents` take a track. Pace (`pace` per `straight`/`technical`) stays the time model; stats decide incidents and add a margin-based slow loss. UI/scene read the selected track from game state.

**Tech Stack:** Vanilla ES modules, Vite, three.js 0.180, `node --test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-track-conditions-design.md`

## Global Constraints

- Node >= 22.12; no new runtime dependencies.
- `shared/` stays pure: no DOM, three.js or browser imports. Same inputs, same outputs (no `Math.random`, no clocks).
- Chassis is a 5th slot: `SLOTS = ['wheels','power','body','chassis','sensor']`; budget starts at 90 and is tuned by balance tests.
- A crash is a ≈12 s time loss (up to 16 s), the car keeps racing. Only `fire` retires a car.
- Section outcome bands (margin = score − required): `>=0` clean; `-10..<0` slow, loss = `0.12 × deficit`; `-25..<-10` incident, loss `1.5..4 s`; `< -25` crash (crashable sections, 12–16 s), fire escalation (hot sections with `escalates`), else heavy incident (4 s).
- Stat scale 0–100. Stats: `dryGrip, wetGrip, warmup, abrasion, heatTol, downforce, topSpeed, cooling, stability`.
- Balance targets per track: ≥4 winning builds (with ERS), winners vary in tyres and power, no build wins all three tracks, 25–45% of affordable builds crash or retire, the default build finishes outside the points, price does not buy the win.
- Existing UI copy rule: short, plain sentences; no real F1 claims (values are game values).

## Review Focus

- Unknown or missing `trackId` in state/commands must fall back to Dune Valley, never throw.
- A build missing the `chassis` key (old fixtures, saved builds) must be rejected by `startingBuild`, not crash `buildProfile`.
- A car that fails the same section every lap must not flood the incident reel or lose >~60 s (events only on the first failing lap then every 3rd; other laps are quiet half-losses; crash happens once per section).
- A fire-escalation car must still retire (zero points) and everyone else must still finish.
- `createIncidentDemo` (incident lab) must keep working and not affect the player's build or score.
- Changing track after scanning/practice must reset clues, prediction and runs.

---

## File Structure

| File | Responsibility |
|---|---|
| `shared/part-stats.js` (new) | `PART_STATS` per part id |
| `shared/conditions.js` (new) | `CONDITIONS`, `buildProfile`, `sectionScore`, `sectionOutcome` |
| `shared/tracks.js` (new) | `TRACKS`, `trackById`, `trackSegments`, `trackZone`, mystery clues |
| `shared/content.js` | slots/parts/budget/default build/rivals; drop `COURSE`, `SEASON` |
| `shared/engineering.js` | new part text, new incident types, `planIncidents`/`buildIncidents(build, track)`, risk/fix helpers |
| `shared/simulation.js`, `shared/race.js`, `shared/game.js` | track-driven sim, timeline, state |
| `src/ui/*`, `src/scene/*`, `src/main.js` | chassis tab, new part art, track picker, condition strip, per-track circuit |
| `tests/parts.test.js`, `tests/conditions.test.js`, `tests/tracks.test.js` (new); `tests/balance.test.js` rewritten per track | |
| `scripts/balance-report.mjs` (new) | prints per-track balance numbers for tuning |

Balance tests (`tests/balance.test.js`) are expected to be red from Task 4 until Task 7. Commit anyway; each task states which suites must pass.

---

### Task 1: Part stats, new parts and the chassis slot

**Files:**
- Create: `shared/part-stats.js`, `tests/parts.test.js`
- Modify: `shared/content.js`, `shared/engineering.js` (ENGINEERING entries), `tests/*.test.js` fixtures, `tests/balance.test.js`

**Interfaces:**
- Produces: `PART_STATS[id]`; `PARTS[id].stats`; new ids `hard`, `inter`, `wet` (wheels) and `stiff`, `sprung`, `titanium`, `monocoque` (chassis); `SLOTS` with `'chassis'`; `BUDGET = 90`; `DEFAULT_BUILD.chassis = 'stiff'`; `rival(...)` takes optional `chassis`.

- [ ] **Step 1: Write the failing test** — create `tests/parts.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUDGET, DEFAULT_BUILD, DEMO_TEAMS, PARTS, SLOTS } from '../shared/content.js';
import { ENGINEERING } from '../shared/engineering.js';
import { buildStats } from '../shared/simulation.js';

const KEYS = {
  wheels: ['dryGrip', 'wetGrip', 'warmup', 'abrasion', 'heatTol'],
  power: ['output', 'cooling'],
  body: ['downforce', 'straight', 'stability'],
  chassis: ['stability', 'weight'],
};

test('every non-sensor part declares all stats for its slot, 0–100', () => {
  for (const part of Object.values(PARTS).filter(part => part.slot !== 'sensor')) {
    assert.ok(part.stats, `${part.id} has no stats`);
    for (const key of KEYS[part.slot]) {
      assert.ok(Number.isFinite(part.stats[key]) && part.stats[key] >= 0 && part.stats[key] <= 100, `${part.id}.${key}`);
    }
  }
});

test('stats agree with the ratings shown in the part details', () => {
  for (const part of Object.values(PARTS).filter(part => part.slot !== 'sensor')) {
    const ratings = ENGINEERING[part.id]?.ratings;
    assert.ok(ratings, `${part.id} has no engineering entry`);
    if (part.slot === 'power') { assert.equal(part.stats.cooling, ratings.cooling); assert.equal(part.stats.output, ratings.output); }
    if (part.slot === 'body') { assert.equal(part.stats.downforce, ratings.cornering); assert.equal(part.stats.straight, ratings.straight); }
  }
});

test('the chassis slot, new tyres and the default build are complete and affordable', () => {
  assert.deepEqual(SLOTS, ['wheels', 'power', 'body', 'chassis', 'sensor']);
  for (const id of ['hard', 'inter', 'wet']) assert.equal(PARTS[id].slot, 'wheels');
  for (const id of ['stiff', 'sprung', 'titanium', 'monocoque']) assert.equal(PARTS[id].slot, 'chassis');
  assert.equal(PARTS.stiff.cost, 8);
  assert.equal(PARTS.monocoque.cost, 26);
  assert.equal(BUDGET, 90);
  assert.equal(DEFAULT_BUILD.chassis, 'stiff');
  assert.ok(buildStats(DEFAULT_BUILD).cost <= BUDGET);
  for (const team of DEMO_TEAMS) { assert.ok(PARTS[team.build.chassis], team.id); assert.ok(buildStats(team.build).cost <= BUDGET, team.id); }
});

test('the default chassis is pace-neutral so existing balance is unchanged', () => {
  assert.deepEqual(PARTS.stiff.pace, { straight: 0, loose: 0, technical: 0 });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/parts.test.js`
Expected: FAIL (`part.stats` undefined / `chassis` missing).

- [ ] **Step 3: Create `shared/part-stats.js`**

```js
// Condition stats, 0–100 (game values, not real F1 data). tests/parts.test.js ties the power and aero
// numbers to the ratings in shared/engineering.js so the two cannot drift apart.
export const PART_STATS = {
  // tyres: dry grip, wet grip, grip when cold, resistance to gritty surfaces, heat tolerance
  road: { dryGrip: 70, wetGrip: 15, warmup: 35, abrasion: 50, heatTol: 55 },
  soft: { dryGrip: 85, wetGrip: 20, warmup: 80, abrasion: 25, heatTol: 30 },
  medium: { dryGrip: 65, wetGrip: 35, warmup: 60, abrasion: 50, heatTol: 55 },
  offroad: { dryGrip: 55, wetGrip: 60, warmup: 50, abrasion: 75, heatTol: 60 },
  tracks: { dryGrip: 55, wetGrip: 50, warmup: 40, abrasion: 90, heatTol: 80 },
  paddle: { dryGrip: 35, wetGrip: 40, warmup: 45, abrasion: 70, heatTol: 55 },
  hard: { dryGrip: 50, wetGrip: 25, warmup: 20, abrasion: 95, heatTol: 85 },
  inter: { dryGrip: 45, wetGrip: 80, warmup: 55, abrasion: 40, heatTol: 35 },
  wet: { dryGrip: 25, wetGrip: 95, warmup: 50, abrasion: 30, heatTol: 20 },
  // power: output and cooling
  solar: { output: 48, cooling: 95 },
  battery: { output: 58, cooling: 88 },
  electric: { output: 70, cooling: 78 },
  sprint: { output: 100, cooling: 10 },
  turbo: { output: 88, cooling: 62 },
  torque: { output: 95, cooling: 35 },
  // aero: downforce, straight-line efficiency, stability over kerbs and bumps
  scout: { downforce: 35, straight: 95, stability: 30 },
  alloy: { downforce: 75, straight: 70, stability: 65 },
  carbon: { downforce: 95, straight: 48, stability: 70 },
  drs: { downforce: 78, straight: 80, stability: 60 },
  floor: { downforce: 90, straight: 76, stability: 40 },
  // chassis: stability and weight (weight lowers top speed and abrasion resistance)
  stiff: { stability: 25, weight: 3 },
  sprung: { stability: 60, weight: 10 },
  titanium: { stability: 85, weight: 4 },
  monocoque: { stability: 80, weight: 0 },
};
```

- [ ] **Step 4: Edit `shared/content.js`**

1. Top of file: `import { PART_STATS } from './part-stats.js';`
2. `export const BUDGET = 90;`
3. `export const SLOTS = ['wheels', 'power', 'body', 'chassis', 'sensor'];` and `SLOT_LABELS` gets `chassis: 'Chassis'` (keep key order: wheels, power, body, chassis, sensor).
4. Inside `PARTS`, after the `paddle` line, add:

```js
  hard: { id: 'hard', slot: 'wheels', name: 'Hard tyres', cost: 20, pace: { straight: .08, loose: 0, technical: .05 }, wear: .003, description: 'A tough compound that shrugs off grit and heat. Slow to warm up.', trait: 'Grit and heat', color: '#4b5058' },
  inter: { id: 'inter', slot: 'wheels', name: 'Intermediate tyres', cost: 18, pace: { straight: .1, loose: 0, technical: .04 }, wear: .02, description: 'Shallow tread for damp tarmac. Overheats when it is hot.', trait: 'Damp specialist', color: '#3d5a55' },
  wet: { id: 'wet', slot: 'wheels', name: 'Wet tyres', cost: 20, pace: { straight: .22, loose: 0, technical: .1 }, wear: .025, description: 'Deep tread clears standing water. Slow and fragile on a dry track.', trait: 'Rain specialist', color: '#2f5f8f' },
```

and after the `floor` line (aero) add the chassis parts:

```js
  stiff: { id: 'stiff', slot: 'chassis', name: 'Stiff aluminium', cost: 8, pace: { straight: 0, loose: 0, technical: 0 }, description: 'Cheap and light, but stiff suspension rattles over bumps.', trait: 'Light and cheap', color: '#aab3bf' },
  sprung: { id: 'sprung', slot: 'chassis', name: 'Soft-sprung steel', cost: 14, pace: { straight: .1, loose: 0, technical: .04 }, description: 'Heavy, but soft springs soak up bumps.', trait: 'Bump soaker', color: '#6e7683' },
  titanium: { id: 'titanium', slot: 'chassis', name: 'Titanium adaptive', cost: 22, pace: { straight: .03, loose: 0, technical: -.02 }, description: 'Adaptive dampers and a strong, light frame.', trait: 'Adaptive ride', color: '#8fa0b6' },
  monocoque: { id: 'monocoque', slot: 'chassis', name: 'Carbon monocoque', cost: 26, pace: { straight: -.08, loose: 0, technical: -.06 }, description: 'The lightest, stiffest tub. Expensive.', trait: 'Lightest frame', color: '#20252e' },
```

5. After the closing `};` of `PARTS`: `for (const [id, stats] of Object.entries(PART_STATS)) PARTS[id].stats = stats;`
6. `DEFAULT_BUILD = { wheels: 'road', power: 'electric', body: 'alloy', chassis: 'stiff', sensor: 'camera' };`
7. `rival` helper: `const rival = (id, name, team, color, wheels, power, body, sensor = 'camera', chassis = 'stiff') => ({ id, name, team, color, build: { wheels, power, body, chassis, sensor } });`

- [ ] **Step 5: Add ENGINEERING entries** in `shared/engineering.js` (inside the `ENGINEERING` object, before `camera`):

```js
  hard: { tagline: 'Slow to warm up, hard to wear out', benefits: 'A tough compound that resists grit and heat.', tradeoff: 'Little grip when cold and less dry grip than softer tyres.', watch: 'A steady car that holds its pace late in the race.', ratings: { grip: 55, endurance: 96 }, demo: 'wheelspin' },
  inter: { tagline: 'Made for damp tarmac', benefits: 'Shallow channels clear a thin film of water and still grip a little when it dries.', tradeoff: 'Overheats in the heat and wears quickly on dry, gritty ground.', watch: 'Confident on wet patches, nervous when it is hot.', ratings: { grip: 66, endurance: 50 }, demo: 'wheelspin' },
  wet: { tagline: 'Built for standing water', benefits: 'Deep tread clears standing water and stops aquaplaning.', tradeoff: 'Slow, fragile and low on grip on a dry surface.', watch: 'Spray on the straights, a lot of squirm on dry corners.', ratings: { grip: 72, endurance: 38 }, demo: 'wheelspin' },
  stiff: { tagline: 'Light and cheap', benefits: 'A light aluminium frame with stiff suspension. Saves credits.', tradeoff: 'Bumps and kerbs rattle the car and can break parts.', watch: 'Crisp on smooth ground, upset on rough surfaces.', ratings: { stability: 25, lightness: 90 }, demo: 'understeer' },
  sprung: { tagline: 'Soak up the bumps', benefits: 'Soft springs keep the tyres on rough ground.', tradeoff: 'A heavy steel frame costs speed and tyre life.', watch: 'A calm car over washboard ground.', ratings: { stability: 60, lightness: 40 }, demo: 'understeer' },
  titanium: { tagline: 'Adaptive and strong', benefits: 'Adaptive dampers and a strong, light frame cope with kerbs and bumps.', tradeoff: 'Costs a lot of your budget.', watch: 'A planted car over the roughest sections.', ratings: { stability: 85, lightness: 85 }, demo: 'understeer' },
  monocoque: { tagline: 'The lightest, stiffest tub', benefits: 'The lightest frame: the best top speed and tyre life, with strong stability.', tradeoff: 'The most expensive chassis.', watch: 'Fast, stable and hard on the budget.', ratings: { stability: 80, lightness: 100 }, demo: 'understeer' },
```

- [ ] **Step 6: Run the new test**

Run: `node --test tests/parts.test.js`
Expected: PASS.

- [ ] **Step 7: Fix old fixtures and keep legacy balance stable**

Run: `grep -n "sensor:" tests/*.test.js tests/browser/*.js` and add `chassis: 'stiff'` to every build literal. In `tests/rules.test.js` change `Object.keys(state.build).length, 4` to `5`, and the two cost assertions (`74`, `60`) to `82` and `68` (the default chassis adds 8). In `tests/balance.test.js` make the legacy enumeration ignore new parts until Task 7:

```js
const NEW = new Set(['hard', 'inter', 'wet', 'sprung', 'titanium', 'monocoque']);
const options = slot => Object.values(PARTS).filter(part => part.slot === slot && !NEW.has(part.id)).map(part => part.id);
// builds: add chassis: 'stiff'
const builds = options('wheels').flatMap(wheels => options('power').flatMap(power => options('body').map(body => ({ wheels, power, body, chassis: 'stiff', sensor: 'camera' }))));
```
and in the "premium" test add `chassis: 'stiff'`; in the last test use `Object.keys(PARTS).filter(id => PARTS[id].slot !== 'sensor' && id !== 'sprint' && !NEW.has(id) && id !== 'stiff')`.

- [ ] **Step 8: Run all unit tests**

Run: `npm test`
Expected: PASS (budget 90 keeps affordability looser; if `balance.test.js` "budget rules out the all-premium car" fails, the premium build cost 24+28+26+8+4=90 is now affordable: change that test's premium build to `chassis: 'monocoque'`, cost 108 > 90). If other balance targets fail only because the budget rose to 90, temporarily keep `const BUDGET_LEGACY = 82` out of `content.js` and filter `affordable` with it in this file only, until Task 7 rewrites the file.

- [ ] **Step 9: Commit**

```bash
git add shared tests
git commit -m "feat: part stats, new tyres and chassis slot"
```

---

### Task 2: Condition engine

**Files:**
- Create: `shared/conditions.js`, `tests/conditions.test.js`

**Interfaces:**
- Consumes: `PARTS[id].stats` (Task 1).
- Produces:
  - `CONDITIONS: { [id]: { label, blurb, adjust(profile, lap) => profile } }` for `dry, abrasive, damp, cold, bumpy, hot, rain`
  - `buildProfile(build) => { dryGrip, wetGrip, warmup, abrasion, heatTol, downforce, cooling, stability, topSpeed }`
  - `sectionScore(profile, section, lap = 1) => number`
  - `sectionOutcome(profile, section, lap = 1) => { kind: 'clean'|'slow'|'incident'|'crash'|'fire', type?, score, margin, loss, retire? }`
  - A section object needs `condition, demand, required`, and optionally `incident, crash, escalates`.

- [ ] **Step 1: Write the failing test** — `tests/conditions.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUILD } from '../shared/content.js';
import { CONDITIONS, buildProfile, sectionOutcome, sectionScore } from '../shared/conditions.js';

const corner = { condition: 'dry', demand: { dryGrip: .5, downforce: .5 }, required: 55, incident: 'understeer', crash: true };
const profile = (over = {}) => ({ ...buildProfile(DEFAULT_BUILD), ...over });

test('buildProfile reads the fitted parts', () => {
  const p = buildProfile({ wheels: 'soft', power: 'solar', body: 'carbon', chassis: 'monocoque', sensor: 'camera' });
  assert.equal(p.dryGrip, 85);
  assert.equal(p.cooling, 95);
  assert.equal(p.downforce, 95);
  assert.equal(p.stability, Math.round(.6 * 80 + .4 * 70));
  assert.equal(p.abrasion, 25);
});

test('heavier chassis lowers top speed and abrasion resistance', () => {
  const light = buildProfile({ ...DEFAULT_BUILD, chassis: 'monocoque' });
  const heavy = buildProfile({ ...DEFAULT_BUILD, chassis: 'sprung' });
  assert.ok(light.topSpeed > heavy.topSpeed);
  assert.ok(light.abrasion > heavy.abrasion);
});

test('outcome bands follow the margin against the baseline', () => {
  const at = score => sectionOutcome({ dryGrip: score, downforce: score }, corner, 1);
  assert.equal(at(55).kind, 'clean');
  const slow = at(50);
  assert.equal(slow.kind, 'slow'); assert.equal(slow.loss, .6);
  const incident = at(40);
  assert.equal(incident.kind, 'incident'); assert.equal(incident.type, 'understeer');
  assert.ok(incident.loss >= 1.5 && incident.loss <= 4);
  const crash = at(20);
  assert.equal(crash.kind, 'crash'); assert.equal(crash.type, 'crash');
  assert.ok(crash.loss >= 12 && crash.loss <= 16);
});

test('a car with grip of 20 crashes at a sharp corner that needs 55', () => {
  const outcome = sectionOutcome(profile({ dryGrip: 20, downforce: 20 }), corner, 1);
  assert.equal(outcome.kind, 'crash');
});

test('a section that is not crashable gives a heavy incident instead of a crash', () => {
  const outcome = sectionOutcome({ dryGrip: 0, downforce: 0 }, { ...corner, crash: false }, 1);
  assert.equal(outcome.kind, 'incident'); assert.equal(outcome.loss, 4);
});

test('fire sections escalate with the lap: overheat, brake fade, then fire and retirement', () => {
  const hot = { condition: 'hot', demand: { cooling: .6, heatTol: .4 }, required: 60, incident: 'overheat', escalates: true };
  const weak = { cooling: 5, heatTol: 20 };
  assert.equal(sectionOutcome(weak, hot, 1).type, 'overheat');
  assert.equal(sectionOutcome(weak, hot, 3).type, 'brakefade');
  const fire = sectionOutcome(weak, hot, 5);
  assert.equal(fire.kind, 'fire'); assert.equal(fire.retire, true);
});

test('abrasive and hot conditions wear the car down lap by lap', () => {
  const soft = buildProfile({ ...DEFAULT_BUILD, wheels: 'soft' });
  assert.ok(CONDITIONS.abrasive.adjust(soft, 8).dryGrip < CONDITIONS.abrasive.adjust(soft, 1).dryGrip);
  const poorCooling = buildProfile({ ...DEFAULT_BUILD, power: 'sprint' });
  assert.ok(CONDITIONS.hot.adjust(poorCooling, 8).heatTol < CONDITIONS.hot.adjust(poorCooling, 1).heatTol);
  assert.deepEqual(CONDITIONS.dry.adjust(soft, 8), soft);
});

test('stats are clamped to 0–100 and scores never go NaN', () => {
  const adjusted = CONDITIONS.abrasive.adjust({ dryGrip: 5, abrasion: 0 }, 8);
  assert.equal(adjusted.dryGrip, 0);
  assert.ok(Number.isFinite(sectionScore({ dryGrip: 0, downforce: 0 }, corner, 8)));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/conditions.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `shared/conditions.js`**

```js
import { PARTS } from './content.js';

const clamp = value => Math.max(0, Math.min(100, value));
const round1 = value => Math.round(value * 10) / 10;

export const SLOW_PER_POINT = .12;
export const CRASH_LOSS = 12;
export const CRASH_LOSS_MAX = 16;

// A condition changes the stats a section sees. Most conditions only change which stats the section
// demands (set in shared/tracks.js); abrasive and hot also wear the car down lap by lap.
const unchanged = profile => profile;
export const CONDITIONS = {
  dry: { label: 'Dry', blurb: 'Good grip everywhere. The baseline.', adjust: unchanged },
  abrasive: {
    label: 'Abrasive', blurb: 'A gritty surface that shreds soft tyres.',
    adjust: (profile, lap = 1) => ({
      ...profile,
      dryGrip: clamp(profile.dryGrip * (.5 + .5 * profile.abrasion / 100) - (lap - 1) * (100 - profile.abrasion) / 25),
    }),
  },
  damp: { label: 'Damp', blurb: 'Wet patches and low grip off the racing line.', adjust: unchanged },
  cold: { label: 'Cold', blurb: 'Tyres are slow to warm up and grip is low.', adjust: unchanged },
  bumpy: { label: 'Bumpy', blurb: 'Rough ground and kerbs shake the car.', adjust: unchanged },
  hot: {
    label: 'Hot', blurb: 'Heat stresses the power unit, brakes and tyres.',
    adjust: (profile, lap = 1) => ({
      ...profile,
      cooling: clamp(profile.cooling - 15),
      heatTol: clamp(profile.heatTol - 15 - (lap - 1) * (100 - profile.cooling) / 30),
    }),
  },
  rain: { label: 'Rain', blurb: 'Standing water. Tyres can aquaplane.', adjust: unchanged },
};

// The build's stats, combined from the four fitted parts.
export function buildProfile(build) {
  const tyre = PARTS[build.wheels].stats, power = PARTS[build.power].stats;
  const aero = PARTS[build.body].stats, chassis = PARTS[build.chassis].stats;
  return {
    dryGrip: tyre.dryGrip, wetGrip: tyre.wetGrip, warmup: tyre.warmup,
    abrasion: clamp(tyre.abrasion - chassis.weight), heatTol: tyre.heatTol,
    downforce: aero.downforce, cooling: power.cooling,
    stability: Math.round(.6 * chassis.stability + .4 * aero.stability),
    topSpeed: clamp(Math.round(.5 * power.output + .5 * aero.straight - chassis.weight)),
  };
}

export function sectionScore(profile, section, lap = 1) {
  const adjusted = CONDITIONS[section.condition].adjust(profile, lap);
  const entries = Object.entries(section.demand);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  return entries.reduce((sum, [stat, weight]) => sum + (adjusted[stat] ?? 0) * weight, 0) / total;
}

// Escalation for sections that can end in a brake fire: overheat, then brake fade, then fire.
const ESCALATION = [
  { from: 1, type: 'overheat', loss: 3.2 },
  { from: 3, type: 'brakefade', loss: 2.8 },
  { from: 5, type: 'fire', loss: 9, retire: true },
];

export function sectionOutcome(profile, section, lap = 1) {
  const score = round1(sectionScore(profile, section, lap)), margin = round1(score - section.required);
  const base = { score, margin };
  if (margin >= 0) return { kind: 'clean', loss: 0, ...base };
  if (margin >= -10) return { kind: 'slow', loss: round1(-margin * SLOW_PER_POINT), ...base };
  if (margin >= -25) return { kind: 'incident', type: section.incident, loss: round1(Math.min(4, 1.5 + (-margin - 10) / 15 * 2.5)), ...base };
  if (section.escalates) {
    const step = [...ESCALATION].reverse().find(item => lap >= item.from);
    return { kind: step.retire ? 'fire' : 'incident', type: step.type, loss: step.loss, retire: !!step.retire, ...base };
  }
  if (section.crash) return { kind: 'crash', type: 'crash', loss: round1(Math.min(CRASH_LOSS_MAX, CRASH_LOSS + (-margin - 25) * .2)), ...base };
  return { kind: 'incident', type: section.incident, loss: 4, ...base };
}
```


- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/conditions.test.js`
Expected: PASS (all 8 tests). If the `slow.loss === .6` check fails by float rounding, the cause is `round1`; keep `-margin * SLOW_PER_POINT` rounded with `round1`.

- [ ] **Step 5: Commit**

```bash
git add shared/conditions.js tests/conditions.test.js
git commit -m "feat: section condition engine"
```

---

### Task 3: Track data

**Files:**
- Create: `shared/tracks.js`, `tests/tracks.test.js`

**Interfaces:**
- Consumes: `CONDITIONS` ids (Task 2) for validation only.
- Produces:
  - `TRACKS: Track[]` (`dune`, `mountain`, `quarry`), `DEFAULT_TRACK_ID = 'dune'`, `DEFAULT_TRACK`
  - `trackById(id) => Track` (falls back to the default track)
  - `trackSegments(track) => Segment[]` with `base` (seconds, before part pace) and `share` (fraction of its sector's pace this section carries)
  - `trackZone(track, distance) => Section` (distance in laps, wraps)
  - Track: `{ id, number, title, subtitle, description, lesson, color, icon, lapBase, points, sections, landmarks, mystery }`
  - Section: `{ id, name, label, kind: 'straight'|'corner'|'sweep', sector: 'straight'|'technical', from, to, pace, condition, demand, required, incident, crash?, escalates?, warning, problem, suggestion }`
  - `mystery: { section, question, options: string[], target, clues: { camera, thermal, lidar, radar } }` (each clue list has 3 strings)

- [ ] **Step 1: Write the failing test** — `tests/tracks.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONDITIONS } from '../shared/conditions.js';
import { INCIDENTS } from '../shared/engineering.js';
import { DEFAULT_TRACK_ID, TRACKS, trackById, trackSegments, trackZone } from '../shared/tracks.js';

const STATS = ['dryGrip', 'wetGrip', 'warmup', 'abrasion', 'heatTol', 'downforce', 'topSpeed', 'cooling', 'stability'];

test('three tracks with 4–5 sections each', () => {
  assert.deepEqual(TRACKS.map(track => track.id), ['dune', 'mountain', 'quarry']);
  for (const track of TRACKS) assert.ok(track.sections.length >= 4 && track.sections.length <= 5, track.id);
});

test('sections tile one lap exactly and use known conditions, stats and incidents', () => {
  for (const track of TRACKS) {
    let edge = 0;
    for (const section of track.sections) {
      assert.ok(Math.abs(section.from - edge) < 1e-9, `${track.id}/${section.id} gap`);
      assert.ok(section.to > section.from);
      edge = section.to;
      assert.ok(CONDITIONS[section.condition], section.id);
      for (const stat of Object.keys(section.demand)) assert.ok(STATS.includes(stat), `${section.id}: ${stat}`);
      assert.ok(INCIDENTS[section.incident], `${section.id}: ${section.incident}`);
      assert.ok(['straight', 'technical'].includes(section.sector));
      assert.ok(section.problem && section.suggestion && section.warning);
    }
    assert.ok(Math.abs(edge - 1) < 1e-9, `${track.id} ends at ${edge}`);
  }
});

test('every track has a closed circuit and a mystery section with three clues per sensor', () => {
  for (const track of TRACKS) {
    assert.ok(track.points.length >= 12);
    const mystery = track.mystery, section = track.sections.find(item => item.id === mystery.section);
    assert.ok(section, track.id);
    assert.equal(mystery.target, section.condition);
    assert.ok(mystery.options.includes(mystery.target));
    for (const sensor of ['camera', 'thermal', 'lidar', 'radar']) assert.equal(mystery.clues[sensor].length, 3, `${track.id}/${sensor}`);
  }
});

test('segment bases sum to the lap base and shares sum to 1 per sector', () => {
  for (const track of TRACKS) {
    const segments = trackSegments(track);
    assert.ok(Math.abs(segments.reduce((sum, segment) => sum + segment.base, 0) - track.lapBase) < .05, track.id);
    for (const sector of ['straight', 'technical']) {
      const group = segments.filter(segment => segment.sector === sector);
      if (group.length) assert.ok(Math.abs(group.reduce((sum, segment) => sum + segment.share, 0) - 1) < 1e-9, `${track.id}/${sector}`);
    }
  }
});

test('trackById falls back to the default track and trackZone wraps laps', () => {
  assert.equal(trackById('nope').id, DEFAULT_TRACK_ID);
  assert.equal(trackById(undefined).id, DEFAULT_TRACK_ID);
  const track = trackById('mountain');
  assert.equal(trackZone(track, 0.01).id, track.sections[0].id);
  assert.equal(trackZone(track, 3.01).id, track.sections[0].id);
  assert.equal(trackZone(track, -0.01).id, track.sections.at(-1).id);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/tracks.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `shared/tracks.js`**

```js
// Three tracks. Each section declares a condition, the stats it demands (weights sum to 1) and the
// baseline score ('required') a car needs to get through cleanly. Values are game values, tuned by
// tests/balance.test.js. `pace` weights how long the section takes; `sector` picks the part pace it uses.
const section = (id, name, label, kind, from, to, rest) => ({
  id, name, label, kind, from, to, pace: kind === 'straight' ? .72 : kind === 'sweep' ? 1 : 1.42,
  sector: kind === 'straight' ? 'straight' : 'technical', ...rest,
});

export const TRACKS = [
  {
    id: 'dune', number: '01', title: 'Dune Valley', subtitle: 'Sun and grit.', lesson: 'Classification', color: '#e6a475', icon: 'sun',
    description: 'A sun-baked course. Gritty gravel shreds soft tyres and the back straight bakes the power unit.',
    lapBase: 27,
    points: [[-14, .38, 9], [-5, .38, 9], [7, .38, 9], [14, .38, 8], [17, .38, 4], [15, .38, 0], [10, .38, -1], [5, .38, -1], [2, .38, -5], [5, .38, -9], [0, .38, -11], [-8, .38, -10], [-12, .38, -6], [-17, .38, -6], [-19, .38, -2], [-18, .38, 4]],
    sections: [
      section('start', 'Start / finish straight', 'POWER ZONE', 'straight', 0, .28, { condition: 'dry', demand: { topSpeed: 1 }, required: 40, incident: 'understeer',
        warning: 'Long straight. Top speed matters.', problem: 'Not enough top speed for the straight.', suggestion: 'Low-drag aero or a stronger power unit is quicker here.' }),
      section('hairpin', 'T1 · Gravel hairpin', 'BRAKE → TURN', 'corner', .28, .42, { condition: 'abrasive', demand: { dryGrip: .4, downforce: .3, abrasion: .3 }, required: 55, incident: 'tyreshred', crash: true,
        warning: 'Gritty gravel ahead. Soft tyres will shred.', problem: 'Grit chewed up the tyres in the hairpin.', suggestion: 'Hard or endurance tyres resist grit. Add downforce.' }),
      section('heatsoak', 'Heat-soak back straight', 'HEAT BUILD', 'straight', .42, .70, { condition: 'hot', demand: { cooling: .6, heatTol: .4 }, required: 55, incident: 'overheat', escalates: true,
        warning: 'The back straight bakes the car. Watch the temperatures.', problem: 'The power unit and brakes ran too hot.', suggestion: 'A cooler power unit and hard tyres cope with the heat.' }),
      section('chicane', 'T2–4 · Dust chicane', 'CHANGE DIRECTION', 'corner', .70, 1, { condition: 'abrasive', demand: { dryGrip: .4, downforce: .3, abrasion: .3 }, required: 58, incident: 'understeer',
        warning: 'Dust and grit through the chicane.', problem: 'The tyres could not hold the line through the grit.', suggestion: 'Downforce and a tough tyre keep the car on line.' }),
    ],
    landmarks: [{ at: .08, name: 'START', label: 'POWER STRAIGHT' }, { at: .35, name: 'T1', label: 'GRAVEL HAIRPIN' }, { at: .56, name: 'HEAT', label: 'HEAT-SOAK STRAIGHT' }, { at: .85, name: 'T2–4', label: 'DUST CHICANE' }],
    mystery: {
      section: 'hairpin', question: 'What is the surface in the gravel hairpin?', options: ['dry', 'abrasive', 'damp'], target: 'abrasive',
      clues: {
        camera: ['Gravel and grit are scattered over the racing line.', 'Old tyre rubber lies in shreds on the apex.', 'The surface looks dry, but rough and gritty.'],
        thermal: ['Surface temperature: 41°C. Hot, but not the problem here.', 'Moisture: 3%. Very dry.', 'Friction heat marks line the apex where tyres were torn.'],
        lidar: ['The surface is covered in sharp, uneven grains.', 'Grain size varies from dust to small stones.', 'The texture is rough and coarse, like sandpaper.'],
        radar: ['A thin gritty layer sits over firm tarmac.', 'The layer is only a few millimetres deep.', 'The base is solid. The problem is the top layer.'],
      },
    },
  },
  {
    id: 'mountain', number: '02', title: 'Mountain Pass', subtitle: 'Cold and wet.', lesson: 'Training', color: '#9caaa0', icon: 'mountain',
    description: 'A shaded climb, wet switchbacks and a waterfall straight. Warm-up and wet grip decide the day.',
    lapBase: 27,
    points: [[-16, .38, 8], [-6, .38, 10], [6, .38, 9], [15, .38, 6], [18, .38, 0], [14, .38, -4], [8, .38, -3], [4, .38, -7], [8, .38, -11], [0, .38, -12], [-7, .38, -9], [-9, .38, -4], [-14, .38, -3], [-19, .38, -6], [-20, .38, 0], [-19, .38, 5]],
    sections: [
      section('climb', 'Shaded climb', 'COLD TYRES', 'sweep', 0, .20, { condition: 'cold', demand: { warmup: .5, downforce: .5 }, required: 50, incident: 'coldslide',
        warning: 'Shaded and cold. The tyres will be slow to warm up.', problem: 'Cold tyres gave little grip on the climb.', suggestion: 'Soft tyres warm up fast. Downforce adds grip.' }),
      section('switchbacks', 'Switchback hairpins', 'WET PATCHES', 'corner', .20, .42, { condition: 'damp', demand: { wetGrip: .5, downforce: .5 }, required: 55, incident: 'understeer', crash: true,
        warning: 'Wet patches off the racing line.', problem: 'The car slid on the wet patches.', suggestion: 'Intermediate or grooved tyres and balanced aero.' }),
      section('waterfall', 'Waterfall straight', 'STANDING WATER', 'straight', .42, .62, { condition: 'rain', demand: { wetGrip: .6, topSpeed: .4 }, required: 55, incident: 'aquaplane', crash: true,
        warning: 'Standing water ahead. Aquaplaning risk.', problem: 'The tyres floated on the standing water.', suggestion: 'Wet tyres clear the water. Slicks aquaplane.' }),
      section('summit', 'Summit sweeper', 'HOLD THE LINE', 'sweep', .62, .82, { condition: 'dry', demand: { dryGrip: .5, downforce: .5 }, required: 60, incident: 'understeer',
        warning: 'Dry and fast. Wet tyres will squirm.', problem: 'Not enough dry grip through the sweeper.', suggestion: 'Medium or soft tyres with high downforce.' }),
      section('descent', 'Downhill braking zone', 'BRAKE EARLY', 'corner', .82, 1, { condition: 'cold', demand: { warmup: .5, cooling: .5 }, required: 55, incident: 'brakefade',
        warning: 'Cold tyres into a long braking zone.', problem: 'Cold tyres and hot brakes lost stopping power.', suggestion: 'Warm tyres and a well-cooled power unit.' }),
    ],
    landmarks: [{ at: .06, name: 'CLIMB', label: 'SHADED CLIMB' }, { at: .31, name: 'S1', label: 'SWITCHBACKS' }, { at: .52, name: 'WET', label: 'WATERFALL STRAIGHT' }, { at: .72, name: 'SUMMIT', label: 'SUMMIT SWEEPER' }, { at: .91, name: 'T5', label: 'BRAKING ZONE' }],
    mystery: {
      section: 'waterfall', question: 'What is the surface on the waterfall straight?', options: ['dry', 'rain', 'cold'], target: 'rain',
      clues: {
        camera: ['Water streams across the whole width of the track.', 'Spray hangs over the straight.', 'The kerbs and verges are dark and soaked.'],
        thermal: ['Surface temperature: 9°C. Cool.', 'Moisture: 96%. The surface is saturated.', 'Cold water has cooled the tarmac below the air temperature.'],
        lidar: ['The surface is smooth, with a thin shiny layer on top.', 'Ripples move across the layer as the scan repeats.', 'Small puddles fill the low spots along the line.'],
        radar: ['A layer of water sits above firm tarmac.', 'The water is several millimetres deep.', 'The base is solid. The standing water is the problem.'],
      },
    },
  },
  {
    id: 'quarry', number: '03', title: 'Quarry Ring', subtitle: 'Rough and hot.', lesson: 'Generalization', color: '#d4aa76', icon: 'flag',
    description: 'Kerbs, washboard ground and a furnace hairpin. Ride quality and cooling decide the day.',
    lapBase: 27,
    points: [[-15, .38, 9], [-4, .38, 10], [8, .38, 10], [16, .38, 7], [18, .38, 1], [13, .38, -3], [12, .38, -8], [6, .38, -11], [-2, .38, -9], [-4, .38, -4], [-9, .38, -2], [-14, .38, -5], [-19, .38, -4], [-20, .38, 1], [-19, .38, 6]],
    sections: [
      section('kerbs', 'Kerb chicane', 'RIDE THE KERBS', 'corner', 0, .18, { condition: 'bumpy', demand: { stability: .6, dryGrip: .4 }, required: 55, incident: 'contact', crash: true,
        warning: 'Raised kerbs ahead. The car will be shaken.', problem: 'The kerbs unsettled the car.', suggestion: 'Adaptive or soft suspension and a strong chassis.' }),
      section('washboard', 'Washboard straight', 'ROUGH GROUND', 'straight', .18, .42, { condition: 'bumpy', demand: { stability: .5, topSpeed: .5 }, required: 50, incident: 'bumpbreak', crash: true,
        warning: 'Washboard ground. Parts can shake loose.', problem: 'The rough ground shook the car and cost speed.', suggestion: 'Soft suspension or a titanium or carbon chassis.' }),
      section('furnace', 'Furnace hairpin', 'BRAKES HOT', 'corner', .42, .60, { condition: 'hot', demand: { cooling: .5, heatTol: .5 }, required: 58, incident: 'brakefade', escalates: true,
        warning: 'The brakes are glowing into the hairpin.', problem: 'The brakes and tyres overheated.', suggestion: 'An efficient power unit and hard tyres.' }),
      section('sweeps', 'Quarry sweeps', 'GRIT AND LOAD', 'sweep', .60, .84, { condition: 'abrasive', demand: { abrasion: .5, downforce: .5 }, required: 52, incident: 'tyreshred',
        warning: 'Gritty sweepers. Tyres wear fast.', problem: 'The tyres wore out through the sweepers.', suggestion: 'Hard or endurance tyres and downforce.' }),
      section('closing', 'Closing straight', 'POWER DOWN', 'straight', .84, 1, { condition: 'dry', demand: { topSpeed: 1 }, required: 45, incident: 'understeer',
        warning: 'Long dry straight to the flag.', problem: 'Not enough top speed.', suggestion: 'Low drag and a light chassis.' }),
    ],
    landmarks: [{ at: .06, name: 'KERBS', label: 'KERB CHICANE' }, { at: .30, name: 'WASH', label: 'WASHBOARD' }, { at: .51, name: 'HAIRPIN', label: 'FURNACE HAIRPIN' }, { at: .72, name: 'SWEEPS', label: 'QUARRY SWEEPS' }, { at: .92, name: 'FLAG', label: 'CLOSING STRAIGHT' }],
    mystery: {
      section: 'washboard', question: 'What is the ground like on the washboard straight?', options: ['dry', 'bumpy', 'hot'], target: 'bumpy',
      clues: {
        camera: ['The surface is ribbed with regular ridges.', 'Dust jumps off the ridges as a marshal vehicle crosses.', 'The kerbs are chipped and uneven.'],
        thermal: ['Surface temperature: 33°C. Warm, nothing unusual.', 'Moisture: 4%. Dry.', 'Temperature alone does not explain the rough ground.'],
        lidar: ['Ridges repeat every half metre, a few centimetres high.', 'The pattern is regular and fixed: it is not moving.', 'The surface is hard and rigid, but very uneven.'],
        radar: ['A solid rock base lies under a thin layer.', 'The base itself is rippled and uneven.', 'Nothing loose below the surface: the shape is the problem.'],
      },
    },
  },
];

export const DEFAULT_TRACK_ID = 'dune';
export const DEFAULT_TRACK = TRACKS[0];
export const trackById = id => TRACKS.find(track => track.id === id) ?? DEFAULT_TRACK;

const cache = new WeakMap();
// Each section's base time (seconds, before part pace) and the share of its sector's pace it carries.
export function trackSegments(track) {
  if (cache.has(track)) return cache.get(track);
  const weight = item => (item.to - item.from) * item.pace;
  const total = track.sections.reduce((sum, item) => sum + weight(item), 0);
  const bySector = {};
  for (const item of track.sections) bySector[item.sector] = (bySector[item.sector] ?? 0) + weight(item);
  const segments = track.sections.map(item => ({ ...item, base: Math.round(track.lapBase * weight(item) / total * 100) / 100, share: weight(item) / bySector[item.sector] }));
  cache.set(track, segments);
  return segments;
}

export function trackZone(track, distance) {
  const progress = ((distance % 1) + 1) % 1;
  return track.sections.find(item => progress >= item.from && progress < item.to) ?? track.sections[0];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/tracks.test.js`
Expected: the "known incidents" check fails for `tyreshred`, `aquaplane`, `coldslide`, `bumpbreak` (not in `INCIDENTS` yet). That is expected: do Step 5 first, then re-run.

- [ ] **Step 5: Add the new incident types** to `INCIDENTS` in `shared/engineering.js` (after `fire`):

```js
  crash: { title: 'Crash', label: 'CRASH', cause: 'The car was asked for more grip or stability than it has and left the track.', remedy: 'Fit parts that match this section. The forecast names the weak stat.', effect: 'sparks', loss: 12, phase: .5, warning: 'This section is beyond your car. Brace for a crash.' },
  aquaplane: { title: 'Aquaplaning', label: 'NO GRIP', cause: 'The tyres cannot clear the standing water and float on top of it.', remedy: 'Fit wet tyres, which have deep channels.', effect: 'slide', loss: 2.6, phase: .5, warning: 'Standing water ahead. Aquaplaning risk.' },
  coldslide: { title: 'Cold tyres', label: 'LOW GRIP', cause: 'The tyres have not reached working temperature, so grip is low.', remedy: 'Use a compound that warms up fast, and add downforce.', effect: 'slide', loss: 2.2, phase: .5, warning: 'Shaded and cold. The tyres are slow to warm up.' },
  tyreshred: { title: 'Tyres shredded', label: 'TYRE WEAR', cause: 'Gritty tarmac tears into a soft compound.', remedy: 'Use hard or endurance tyres on abrasive surfaces.', effect: 'dust', loss: 2.4, phase: .5, warning: 'Gritty surface ahead. Soft tyres will shred.' },
  bumpbreak: { title: 'Parts shaken loose', label: 'BUMPS', cause: 'Rough ground shakes the car and loosens parts on a stiff chassis.', remedy: 'Fit softer suspension or a stronger chassis.', effect: 'sparks', loss: 3, phase: .5, warning: 'Rough ground ahead. Parts can shake loose.' },
```

- [ ] **Step 6: Re-run**

Run: `node --test tests/tracks.test.js tests/conditions.test.js tests/parts.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add shared tests
git commit -m "feat: three tracks with conditioned sections"
```

---

### Task 4: Track-driven simulation and race timeline

**Files:**
- Modify: `shared/simulation.js`, `shared/race.js`, `shared/engineering.js` (signature changes only in this task: keep `buildIncidents(build, track)` returning an array; full rewrite is Task 5), tests (`race.test.js`, `rules.test.js`)

**Interfaces:**
- Consumes: `trackSegments`, `DEFAULT_TRACK`, `trackById`, `trackZone` (Task 3); `buildProfile`, `sectionOutcome` (Task 2).
- Produces:
  - `simulate(build, track = DEFAULT_TRACK) => { time, segments, build, trackId }`; segment: `{ id, name, sector, terrain, base, time, good, outcome, problem, suggestion }`
  - `rankField(entries, track = DEFAULT_TRACK)`
  - `createRace(entries, qualifyingBuild, track = DEFAULT_TRACK)`; the race object gets `trackId`
  - `createIncidentDemo(build, type, name, trackId = 'dune')`
  - `sampleRace` rows: `zone` is a track section object
  - `buildIncidents(build, track) => event[]`, each event has `{...INCIDENTS[type], type, lap, loss, distance, section}`

- [ ] **Step 1: Update tests first.** In `tests/race.test.js` change `car.result.segments.length===24` to `=== RACE_LAPS * DEFAULT_TRACK.sections.length` (import `DEFAULT_TRACK` from `../shared/tracks.js`). In `tests/rules.test.js` replace any `simulate(build)` expectations that assume 3 segments with `DEFAULT_TRACK.sections.length`. Add to `tests/race.test.js`:

```js
import { TRACKS, trackById } from '../shared/tracks.js';

test('every track produces a deterministic eight-lap race with the right number of segments', () => {
  for (const track of TRACKS) {
    const a = createRace(entries, DEFAULT_BUILD, track), b = createRace(entries, DEFAULT_BUILD, track);
    assert.equal(a.trackId, track.id);
    assert.deepEqual(finishRace(a), finishRace(b));
    assert.ok(a.field.every(car => car.result.segments.length === RACE_LAPS * track.sections.length), track.id);
    const final = sampleRace(a, a.maxTime + 1);
    assert.ok(final.every(car => car.retired || car.finished), track.id);
    assert.equal(sampleRace(a, 1)[0].zone.id !== undefined, true);
  }
});
```

- [ ] **Step 2: Run to see the failures**

Run: `node --test tests/race.test.js tests/rules.test.js`
Expected: FAIL (new `createRace` signature not implemented).

- [ ] **Step 3: Rewrite `simulate` in `shared/simulation.js`** (keep `buildStats`, `sectorPace`, `racePoints`; replace `PROBLEMS`, `SUGGESTIONS`, `simulate`, `rankField`):

```js
import { PARTS, SLOTS } from './content.js';
import { buildProfile, sectionOutcome } from './conditions.js';
import { DEFAULT_TRACK, trackSegments } from './tracks.js';

const PRACTICE_SCALE = 2.5;
const round2 = value => Math.round(value * 100) / 100;
const CLEAN = 'A clean run. This combination works here.';
const KEEP = 'Keep this strength while improving the other stretches.';

// Pure, deterministic rules. These can be imported unchanged by a future server.
export function simulate(build, track = DEFAULT_TRACK) {
  const profile = buildProfile(build);
  const segments = trackSegments(track).map(segment => {
    const outcome = sectionOutcome(profile, segment, 1);
    const delta = sectorPace(build, segment.sector) * segment.share;
    const good = outcome.kind === 'clean' && delta <= .05;
    return { id: segment.id, name: segment.name, sector: segment.sector, terrain: segment.condition, base: segment.base, outcome: outcome.kind,
      time: round2(segment.base + delta * PRACTICE_SCALE + outcome.loss), good,
      problem: good ? CLEAN : segment.problem, suggestion: good ? KEEP : segment.suggestion };
  });
  return { time: round2(segments.reduce((sum, item) => sum + item.time, 0)), segments, build: { ...build }, trackId: track.id };
}

export function rankField(entries, track = DEFAULT_TRACK) {
  const sorted = entries.map(entry => ({ ...entry, result: simulate(entry.build, track) })).sort((a, b) => a.result.time - b.result.time || a.id.localeCompare(b.id));
  return sorted.map((entry, index) => ({ ...entry, place: index > 0 && entry.result.time === sorted[index - 1].result.time ? sorted.findIndex(item => item.result.time === entry.result.time) + 1 : index + 1 }));
}
```

Remove the old `COURSE` import and the unused `PROBLEMS`, `SUGGESTIONS` constants.

- [ ] **Step 4: Generalize `buildTimeline` and `createRace` in `shared/race.js`**

Replace the imports and `buildTimeline`:

```js
import { BOOST_CHARGES, BOOST_COOLDOWN, BOOST_GAIN, BOOST_SECONDS, GRID_GAP, PARTS, RACE_LAPS } from './content.js';
import { buildIncidents, engineeringStats, INCIDENTS } from './engineering.js';
import { sectorPace, simulate } from './simulation.js';
import { DEFAULT_TRACK, trackById, trackSegments, trackZone } from './tracks.js';

const eventSpan = event => event.type === 'fire' ? .003 : .085;
// One timeline piece per section per lap. Incidents add their loss over a short stretch of the section.
function buildTimeline(segments, incidents, sections) {
  const timeline = [], events = []; let clock = 0;
  function append(from, to, seconds, event = null) {
    if (to <= from) return;
    const piece = { from, to, start: clock, duration: seconds, event };
    timeline.push(piece); clock += seconds;
    if (event) events.push({ ...event, start: piece.start, end: clock, from, to });
  }
  for (let i = 0; i < segments.length; i++) {
    const lap = Math.floor(i / sections.length), section = sections[i % sections.length];
    const from = lap + section.from, to = lap + section.to;
    const eventsHere = incidents.filter(item => item.distance >= from - 1e-9 && item.distance < to - 1e-9);
    const edges = [from, to, ...eventsHere.flatMap(event => [event.distance, Math.min(to, event.distance + eventSpan(event))])].filter(edge => edge >= from && edge <= to).sort((a, b) => a - b);
    const unique = [...new Set(edges)], chunks = [];
    for (let j = 0; j < unique.length - 1; j++) {
      const start = unique[j], end = unique[j + 1]; if (end - start < 1e-9) continue;
      const event = eventsHere.find(item => start >= item.distance - 1e-9 && start < Math.min(to, item.distance + eventSpan(item)) - 1e-9);
      chunks.push({ from: start, to: end, weight: end - start, event });
    }
    const sum = chunks.reduce((total, chunk) => total + chunk.weight, 0);
    for (const chunk of chunks) {
      const event = chunk.event, span = event ? Math.min(to, event.distance + eventSpan(event)) - event.distance : 1;
      append(chunk.from, chunk.to, segments[i].time * chunk.weight / sum + (event ? event.loss * (chunk.to - chunk.from) / span : 0), event);
    }
  }
  // One incident may cross a boundary. Expose it as one event.
  const merged = [];
  for (const event of events) { const previous = merged.at(-1); if (previous && previous.distance === event.distance && previous.type === event.type) { previous.end = event.end; previous.to = event.to; } else merged.push({ ...event }); }
  return { timeline, events: merged, time: round(clock) };
}
```

Replace `createRace`'s body (grid/field construction):

```js
export function createRace(entries, qualifyingBuild, track = DEFAULT_TRACK) {
  const sections = trackSegments(track);
  const grid = entries.map(entry => ({ ...entry, qualifying: simulate(entry.id === 'you' ? qualifyingBuild : entry.build, track) }))
    .sort((a, b) => a.qualifying.time - b.qualifying.time || a.id.localeCompare(b.id));
  const field = grid.map((entry, gridIndex) => {
    const tyre = PARTS[entry.build.wheels];
    const segments = Array.from({ length: RACE_LAPS }, (_, lap) => sections.map((segment, index) => ({
      id: segment.id, name: segment.name, terrain: segment.condition, lap: lap + 1, sector: index + 1,
      time: round(segment.base + sectorPace(entry.build, segment.sector) * segment.share + lap * tyre.wear * 3 / sections.length + noise(entry.id, lap, segment.id) * .18 + (lap === 0 && index === 0 ? tyre.launch ?? 0 : 0)),
    }))).flat();
    const plan = buildTimeline(segments, buildIncidents(entry.build, track), sections);
    const retirement = plan.events.find(event => event.type === 'fire') || null;
    const incidents = plan.events.filter(event => !retirement || event.start <= retirement.end);
    const lapEnds = Array.from({ length: RACE_LAPS + 1 }, (_, lap) => lap === 0 ? 0 : virtualTimeAtDistance({ timeline: plan.timeline }, lap));
    const lapTimes = lapEnds.slice(1).map((end, lap) => round(end - lapEnds[lap]));
    return { ...entry, grid: gridIndex + 1, startDelay: gridIndex * GRID_GAP, timeline: plan.timeline, incidents, retirement, lapTimes,
      result: { segments, time: plan.time, incidentLoss: round(incidents.reduce((sum, event) => sum + event.loss, 0)), build: { ...entry.build } } };
  });
  const boosts = field.filter(entry => entry.id !== 'you').flatMap((entry, index) => [
    { id: entry.id, at: 39 + index * 2.3 }, { id: entry.id, at: 99 + index * 1.9 }, { id: entry.id, at: 159 + index * 1.7 },
  ]);
  return { laps: RACE_LAPS, trackId: track.id, field, boosts, maxTime: Math.max(...field.map(entry => (entry.retirement?.end ?? entry.result.time) + entry.startDelay)), charges: BOOST_CHARGES };
}
```

`noise(id, lap, sector)` already hashes `${id}:${lap}:${sector}`, so passing the section id string is fine.

Update `createIncidentDemo`:

```js
const DEMO_SECTIONS = [{ from: 0, to: 1 / 3 }, { from: 1 / 3, to: 2 / 3 }, { from: 2 / 3, to: 1 }];
export function createIncidentDemo(build, type, name, trackId = 'dune') {
  const incident = INCIDENTS[type];
  if (!incident) throw new Error('Unknown incident demonstration');
  const event = { ...incident, type, lap: 1, distance: incident.phase, loss: type === 'fire' ? 11 : 7 };
  const segments = Array.from({ length: 3 }, () => ({ time: 5 }));
  const plan = buildTimeline(segments, [event], DEMO_SECTIONS);
  const entry = { id: 'you', name, team: 'Incident lab', color: '#ff3b38', build, grid: 1, startDelay: 0,
    timeline: plan.timeline, incidents: plan.events, result: { time: plan.time, segments, build } };
  return { laps: 1, trackId, field: [entry], boosts: [], maxTime: plan.time, charges: 0, demo: true };
}
```

In `sampleRace` change `zone: trackZone(distance)` to `zone: trackZone(trackById(race.trackId), distance)`. Remove the old `TRACK_ZONES`/`trackZone` import from `./track.js`.

- [ ] **Step 5: Make `buildIncidents` track-aware without changing behaviour yet.** In `shared/engineering.js` change the signature to `buildIncidents(build, track)` and `raceRiskForecast(build, track)`, `incidentFixes(build, type, track)` (pass `track` through; ignore it inside until Task 5 rewrites the body). Keep the old trait-based body for now. Update calls in `race.js` only (UI callers are updated in Task 6/10 — they use the default until then).

Wait: with the old body, events' `distance` values are fractions inside the old thirds. They still land inside some section, so the timeline still works. Do not rely on them beyond Task 5.

- [ ] **Step 6: Run**

Run: `node --test tests/race.test.js tests/rules.test.js tests/tracks.test.js tests/conditions.test.js tests/parts.test.js tests/broadcast.test.js tests/chat.test.js tests/story.test.js tests/engineering.test.js`
Expected: PASS except any assertion that pins old incident laps in `tests/engineering.test.js` (fixed in Task 5). `tests/balance.test.js` is allowed to be red from now until Task 7.

- [ ] **Step 7: Commit**

```bash
git add shared tests
git commit -m "feat: track-driven simulation and race timeline"
```

---

### Task 5: Incidents from section outcomes

**Files:**
- Modify: `shared/engineering.js`, `tests/engineering.test.js`

**Interfaces:**
- Consumes: `buildProfile`, `sectionOutcome` (Task 2); `trackSegments`/`DEFAULT_TRACK` (Task 3); `RACE_LAPS` (content).
- Produces:
  - `planIncidents(build, track) => { events, quiet }` where `quiet['<lap>:<sectionId>']` is seconds lost without an event
  - `buildIncidents(build, track) => events` (events carry `section` id, `distance = lap - 1 + section.from + .02`)
  - `setupRisks(build, track) => [{ type, text, detail, section }]`
  - `raceRiskForecast(build, track)`, `incidentFixes(build, type, track)`
  - `quiet` losses are applied in `createRace`'s segment `time` (see Step 4)

- [ ] **Step 1: Write the failing tests** — add to `tests/engineering.test.js` (remove the old assertions that pin trait-based incident laps and slick/low-drag combinations):

```js
import { buildIncidents, planIncidents, raceRiskForecast, setupRisks } from '../shared/engineering.js';
import { TRACKS, trackById } from '../shared/tracks.js';
import { DEFAULT_BUILD } from '../shared/content.js';

const build = over => ({ ...DEFAULT_BUILD, ...over });

test('a build that matches the track is clean, a mismatched one gets incidents on the right sections', () => {
  const quarry = trackById('quarry');
  const stiff = buildIncidents(build({ chassis: 'stiff', body: 'floor' }), quarry);
  assert.ok(stiff.some(event => event.section === 'kerbs' || event.section === 'washboard'), 'stiff chassis should suffer on the bumps');
  const smooth = buildIncidents(build({ chassis: 'titanium', body: 'alloy', wheels: 'tracks', power: 'solar' }), quarry);
  assert.equal(smooth.filter(event => ['kerbs', 'washboard'].includes(event.section)).length, 0);
});

test('slicks aquaplane in the rain and wet tyres do not', () => {
  const mountain = trackById('mountain');
  assert.ok(buildIncidents(build({ wheels: 'road' }), mountain).some(event => event.section === 'waterfall'));
  assert.ok(!buildIncidents(build({ wheels: 'wet', body: 'carbon' }), mountain).some(event => event.section === 'waterfall'));
});

test('the sprint package escalates to a retiring fire on a hot track', () => {
  const events = buildIncidents(build({ power: 'sprint' }), trackById('dune'));
  assert.deepEqual(events.filter(event => event.section === 'heatsoak').map(event => event.type).slice(0, 3), ['overheat', 'brakefade', 'fire']);
  assert.equal(events.at(-1).type, 'fire');
});

test('a car that fails every lap gets bounded, readable incidents', () => {
  for (const track of TRACKS) {
    const worst = build({ wheels: 'wet', power: 'sprint', body: 'scout', chassis: 'stiff' });
    const { events, quiet } = planIncidents(worst, track);
    const bySection = {};
    for (const event of events) bySection[event.section] = (bySection[event.section] ?? 0) + 1;
    for (const count of Object.values(bySection)) assert.ok(count <= 4, `${track.id}: ${count} events in one section`);
    assert.equal(events.filter(event => event.type === 'crash').length <= track.sections.filter(section => section.crash).length, true);
    const total = events.reduce((sum, event) => sum + event.loss, 0) + Object.values(quiet).reduce((sum, loss) => sum + loss, 0);
    assert.ok(total < 120, `${track.id}: ${total}s lost`);
  }
});

test('risks and forecasts are per track and deterministic', () => {
  const quarry = trackById('quarry'), car = build({ chassis: 'stiff' });
  assert.deepEqual(buildIncidents(car, quarry), buildIncidents(car, quarry));
  assert.ok(raceRiskForecast(car, quarry).length > 0);
  assert.ok(setupRisks(car, quarry).every(risk => risk.type && risk.text && risk.detail));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/engineering.test.js`
Expected: FAIL (`planIncidents` is not exported).

- [ ] **Step 3: Replace the trait-based incident code in `shared/engineering.js`.** Delete `has`, the old `setupRisks`, `buildIncidents`, `raceRiskForecast`, `incidentFixes`, and add (keep `engineeringStats`, `specSheet`; add imports `RACE_LAPS` from content, `buildProfile, sectionOutcome` from `./conditions.js`, `DEFAULT_TRACK` from `./tracks.js`):

```js
const round1 = value => Math.round(value * 10) / 10;

// Events attach to lap distance inside the failing section. A car that keeps failing the same section is
// reported on the first failing lap and then every third lap; the other laps cost half as much, quietly.
// A section can crash a car once; after that the driver backs off to a plain incident.
export function planIncidents(build, track = DEFAULT_TRACK) {
  const profile = buildProfile(build), events = [], quiet = {}, firstFail = {}, crashed = new Set();
  let retired = false;
  for (let lap = 1; lap <= RACE_LAPS && !retired; lap++) {
    for (const section of track.sections) {
      if (retired) break;
      let outcome = sectionOutcome(profile, section, lap);
      if (outcome.kind === 'clean') continue;
      const key = `${lap}:${section.id}`;
      if (outcome.kind === 'slow') { quiet[key] = outcome.loss; continue; }
      if (outcome.kind === 'crash' && crashed.has(section.id)) outcome = { ...outcome, kind: 'incident', type: section.incident, loss: 4 };
      if (outcome.kind === 'crash') crashed.add(section.id);
      firstFail[section.id] ??= lap;
      if (outcome.kind !== 'fire' && (lap - firstFail[section.id]) % 3 !== 0) { quiet[key] = round1(outcome.loss * .5); continue; }
      events.push({ ...INCIDENTS[outcome.type], type: outcome.type, lap, loss: outcome.loss, warning: section.warning, section: section.id, distance: lap - 1 + section.from + .02 });
      if (outcome.kind === 'fire') retired = true;
    }
  }
  return { events: events.sort((a, b) => a.distance - b.distance), quiet };
}
export const buildIncidents = (build, track = DEFAULT_TRACK) => planIncidents(build, track).events;

// One line per weak section, for "How your car will race" and the practice report.
export function setupRisks(build, track = DEFAULT_TRACK) {
  const seen = new Set();
  return buildIncidents(build, track).filter(event => !seen.has(event.section) && seen.add(event.section)).map(event => {
    const section = track.sections.find(item => item.id === event.section);
    return { type: event.type, section: section.id, text: `${event.title} · ${section.name}`, detail: `${event.cause} ${event.remedy}` };
  });
}

// Every incident this setup will meet in the race, grouped so practice can warn about it.
export function raceRiskForecast(build, track = DEFAULT_TRACK) {
  const groups = new Map();
  for (const event of buildIncidents(build, track)) {
    const group = groups.get(event.type) || { type: event.type, title: event.title, laps: [], loss: 0, retirement: false };
    group.laps.push(event.lap); group.loss = Math.round((group.loss + (event.type === 'fire' ? 0 : event.loss)) * 10) / 10; group.retirement ||= event.type === 'fire';
    groups.set(event.type, group);
  }
  return [...groups.values()];
}

// Single-part swaps that remove an incident type and still fit the budget.
export function incidentFixes(build, type, track = DEFAULT_TRACK) {
  return SLOTS.flatMap(slot => Object.values(PARTS).filter(part => part.slot === slot && part.id !== build[slot]).filter(part => {
    const next = { ...build, [slot]: part.id };
    return buildStats(next).cost <= BUDGET && !buildIncidents(next, track).some(event => event.type === type);
  }).map(part => ({ slot, id: part.id, name: part.name, cost: part.cost - PARTS[build[slot]].cost })));
}
```

- [ ] **Step 4: Apply quiet losses in `createRace`.** In `shared/race.js` change `buildIncidents(entry.build, track)` to `const incidentPlan = planIncidents(entry.build, track);` (import `planIncidents`), compute it before `segments`, add `+ (incidentPlan.quiet[`${lap + 1}:${segment.id}`] ?? 0)` to each segment's `time`, and pass `incidentPlan.events` to `buildTimeline`.

- [ ] **Step 5: Run**

Run: `node --test tests/engineering.test.js tests/race.test.js tests/rules.test.js`
Expected: PASS. If the "bounded losses" test fails (`total >= 120`), the `crash` loss or quiet-loss factors are too high: lower the quiet factor in `planIncidents` from `.5` to `.35` and re-run.

- [ ] **Step 6: Commit**

```bash
git add shared tests
git commit -m "feat: incidents from section outcomes with crashes and fire escalation"
```

---

### Task 6: Game state, track selection and the mystery section

**Files:**
- Modify: `shared/game.js`, `shared/content.js` (remove `COURSE`, `SEASON`; add `rivalsFor`), `tests/rules.test.js`

**Interfaces:**
- Consumes: `TRACKS`, `trackById`, `DEFAULT_TRACK_ID` (Task 3).
- Produces:
  - `createGame(profile, build, trackId = 'dune')` → state has `trackId`
  - command `{ type: 'SELECT_TRACK', id }`: only in `practice`; resets `clues, sensorLocked, prediction, predictionLocked, runs`; unknown id rejected with a message
  - `SCAN` reads `trackById(state.trackId).mystery.clues[sensor][n]`; `PREDICT` accepts `mystery.options`; the bonus is `prediction === mystery.target`
  - `rivalsFor(trackId) => DEMO_TEAMS with per-track builds`; empty overrides for now (filled in Task 7)

- [ ] **Step 1: Write the failing tests** — add to `tests/rules.test.js`:

```js
test('selecting a track resets practice and uses that track for clues, prediction and the race', () => {
  let state = act(createGame(), { type: 'SCAN' });
  state = act(state, { type: 'SELECT_TRACK', id: 'mountain' });
  assert.equal(state.trackId, 'mountain');
  assert.equal(state.clues.length, 0);
  assert.equal(state.sensorLocked, false);
  state = act(state, { type: 'SCAN' });
  assert.match(state.clues[0], /Water|water/);
  assert.equal(transition(state, { type: 'PREDICT', terrain: 'sand' }).ok, false);
  state = act(state, { type: 'PREDICT', terrain: 'rain' });
  state = act(act(state, { type: 'QUALIFY' }), { type: 'FINISH_QUALIFY' });
  state = act(state, { type: 'RACE' });
  assert.equal(state.race.trackId, 'mountain');
  state = act(state, { type: 'REVEAL' });
  assert.equal(state.score.prediction, 3);
});

test('track selection is only open in practice, and unknown tracks are rejected', () => {
  assert.equal(transition(createGame(), { type: 'SELECT_TRACK', id: 'nope' }).ok, false);
  const qualified = qualify(createGame());
  assert.equal(transition(qualified, { type: 'SELECT_TRACK', id: 'quarry' }).ok, false);
  assert.equal(createGame(undefined, null, 'nope').trackId, 'dune');
});
```

Also in the existing "complete round" test replace `terrain: 'sand'` with `terrain: 'abrasive'`.

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/rules.test.js`
Expected: FAIL (`SELECT_TRACK` unknown).

- [ ] **Step 3: Edit `shared/content.js`.** Delete the `COURSE` and `SEASON` exports. After `DEMO_TEAMS` add:

```js
// Per-track rival builds [wheels, power, body, chassis]; ids not listed keep their Dune Valley build.
export const RIVAL_BUILDS = { dune: {}, mountain: {}, quarry: {} };
export const rivalsFor = trackId => DEMO_TEAMS.map(team => {
  const override = RIVAL_BUILDS[trackId]?.[team.id];
  return override ? { ...team, build: { wheels: override[0], power: override[1], body: override[2], chassis: override[3], sensor: team.build.sensor } } : team;
});
```

- [ ] **Step 4: Edit `shared/game.js`**

```js
import { BUDGET, DEFAULT_BUILD, MAX_CHANGED_SLOTS, PARTS, PRACTICE_RUNS, SLOTS, rivalsFor } from './content.js';
import { TRACKS, DEFAULT_TRACK_ID, trackById } from './tracks.js';
```

`createGame(profile = {...}, build = null, trackId = DEFAULT_TRACK_ID)`: add `trackId: TRACKS.some(track => track.id === trackId) ? trackId : DEFAULT_TRACK_ID,` to the state.

Add the command (before `SET_PART`):

```js
    case 'SELECT_TRACK': {
      if (state.phase !== 'practice') return reject('Finish this round before choosing another track.');
      if (!TRACKS.some(track => track.id === command.id)) return reject('That track is not on the calendar.');
      state.trackId = command.id;
      Object.assign(state, { clues: [], sensorLocked: false, prediction: null, predictionLocked: false, runs: [] });
      break;
    }
```

Replace the track-dependent lines:

```js
    case 'SCAN':
      ...
      state.clues.push(trackById(state.trackId).mystery.clues[state.build.sensor][state.clues.length]);
    case 'PREDICT': {
      const mystery = trackById(state.trackId).mystery;
      if (state.phase !== 'practice' || state.predictionLocked) return reject('Your prediction is locked.');
      if (!mystery.options.includes(command.terrain)) return reject(`Choose ${mystery.options.join(', ')}.`);
      ...
    }
    case 'PRACTICE': state.runs.push(simulate(state.build, trackById(state.trackId)));
    case 'QUALIFY': state.qualifying = simulate(state.build, trackById(state.trackId));
    case 'RACE': state.race = createRace([{ id: 'you', ... }, ...rivalsFor(state.trackId)], state.qualifyingBuild, trackById(state.trackId));
    case 'REVEAL': const bonus = state.prediction === trackById(state.trackId).mystery.target ? 3 : 0;
```

Keep the `command.terrain` field name for compatibility with the UI.

- [ ] **Step 5: Fix the remaining `COURSE`/`SEASON` imports.** Run `grep -rn "COURSE\|SEASON" shared src tests`. In `shared/story.js`/`src/ui/dialogs.js`/`tests` replace with the new APIs as follows: tests import `DEFAULT_TRACK` from `shared/tracks.js`; `src/ui/dialogs.js` is rewritten in Task 9 (leave its imports pointing at the new `TRACKS` there only after Task 9; for now make the file compile by changing `import { BUDGET, COURSE, SEASON } ...` to `import { BUDGET } from '../../shared/content.js'; import { TRACKS, DEFAULT_TRACK as COURSE } from '../../shared/tracks.js'; const SEASON = TRACKS;`, which Task 9 removes).

- [ ] **Step 6: Run**

Run: `npm test` (excluding `balance.test.js`: `node --test tests/*.test.js --test-skip-pattern=balance` or run files individually)
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add shared src tests
git commit -m "feat: track selection in game state"
```

---

### Task 7: Rivals per track and per-track balance

**Files:**
- Modify: `shared/content.js` (`RIVAL_BUILDS`, possibly `BUDGET`, part pace/stats, track `required` values), `tests/balance.test.js` (rewrite)
- Create: `scripts/balance-report.mjs`

**Interfaces:**
- Consumes: `createRace`, `finishRace`, `rivalsFor`, `TRACKS`.
- Produces: balance numbers per track; initial `RIVAL_BUILDS`.

- [ ] **Step 1: Create the report script** — `scripts/balance-report.mjs`

```js
import { BUDGET, PARTS, rivalsFor } from '../shared/content.js';
import { addPlayerBoost, createRace, finishRace } from '../shared/race.js';
import { buildStats } from '../shared/simulation.js';
import { TRACKS } from '../shared/tracks.js';

const options = slot => Object.values(PARTS).filter(part => part.slot === slot).map(part => part.id);
const builds = options('wheels').flatMap(wheels => options('power').flatMap(power => options('body').flatMap(body => options('chassis').map(chassis => ({ wheels, power, body, chassis, sensor: 'camera' })))));
export const affordable = builds.filter(build => buildStats(build).cost <= BUDGET);

export function finish(build, track, boosts) {
  let race = createRace([{ id: 'you', name: 'Balance', build }, ...rivalsFor(track.id)], build, track);
  for (let i = 0; i < boosts; i++) { const result = addPlayerBoost(race, 30 + i * 60); if (result.ok) race = result.race; }
  const you = finishRace(race).find(car => car.id === 'you');
  return { place: you.retired ? 99 : you.place, retired: you.retired, crashed: you.incidents.some(event => event.type === 'crash') };
}
export function analyse(track) {
  const rows = affordable.map(build => ({ build, cost: buildStats(build).cost, plain: finish(build, track, 0), ers: finish(build, track, 3) }));
  const winners = rows.filter(row => row.ers.place === 1);
  return {
    track: track.id, builds: rows.length, winners: winners.length,
    winnerTyres: [...new Set(winners.map(row => row.build.wheels))], winnerPower: [...new Set(winners.map(row => row.build.power))],
    points: Math.round(rows.filter(row => row.ers.place <= 10).length / rows.length * 100),
    trouble: Math.round(rows.filter(row => row.ers.retired || row.ers.crashed).length / rows.length * 100),
    rows,
  };
}
if (process.argv[1].endsWith('balance-report.mjs')) for (const track of TRACKS) { const { rows, ...summary } = analyse(track); console.log(JSON.stringify(summary)); }
```

- [ ] **Step 2: Run the report to see where we are**

Run: `node scripts/balance-report.mjs`
Expected: three JSON lines. Initially rivals use Dune builds on every track, so Mountain Pass and Quarry will look wrong; that is what Step 3 fixes.

- [ ] **Step 3: Author rival builds.** Fill `RIVAL_BUILDS.mountain` and `RIVAL_BUILDS.quarry` for the 19 rivals in `shared/content.js`. Use this recipe (`[wheels, power, body, chassis]`) and keep each build within `BUDGET`:
  - 2 strong builds that match the track (e.g. Mountain: `['inter','electric','alloy','stiff']`, `['soft','battery','carbon','stiff']`; Quarry: `['tracks','solar','alloy','titanium']`, `['hard','battery','alloy','sprung']`)
  - 8–10 midfield builds that match half the sections
  - 4 budget builds with one glaring weakness (e.g. slicks on Mountain Pass, a stiff chassis with ground-effect on Quarry)
  - 2 gamblers (the sprint package keeps retiring on any hot track: keep `orbit`/`volt` on `sprint` for Dune and Quarry, but not on Mountain Pass)
  Example:

```js
export const RIVAL_BUILDS = {
  dune: {},
  mountain: {
    moss: ['inter', 'electric', 'alloy', 'stiff'], orbit: ['wet', 'turbo', 'carbon', 'stiff'], sun: ['soft', 'battery', 'carbon', 'stiff'],
    apex: ['inter', 'torque', 'drs', 'stiff'], vector: ['medium', 'electric', 'carbon', 'stiff'], delta: ['offroad', 'solar', 'alloy', 'stiff'],
    kite: ['soft', 'torque', 'alloy', 'stiff'], north: ['road', 'electric', 'scout', 'stiff'], blaze: ['road', 'torque', 'alloy', 'stiff'],
    alpine: ['inter', 'turbo', 'carbon', 'stiff'], mesa: ['medium', 'electric', 'carbon', 'sprung'], pixel: ['inter', 'battery', 'drs', 'stiff'],
    drift: ['soft', 'turbo', 'scout', 'stiff'], crest: ['offroad', 'battery', 'floor', 'stiff'], volt: ['wet', 'electric', 'alloy', 'stiff'],
    reed: ['soft', 'solar', 'floor', 'stiff'], forge: ['medium', 'torque', 'scout', 'stiff'], lumen: ['offroad', 'solar', 'carbon', 'stiff'], tide: ['road', 'electric', 'carbon', 'stiff'],
  },
  quarry: {
    moss: ['tracks', 'solar', 'alloy', 'titanium'], orbit: ['hard', 'sprint', 'scout', 'stiff'], sun: ['soft', 'solar', 'carbon', 'stiff'],
    apex: ['hard', 'torque', 'scout', 'sprung'], vector: ['medium', 'electric', 'carbon', 'sprung'], delta: ['offroad', 'solar', 'alloy', 'sprung'],
    kite: ['medium', 'torque', 'alloy', 'stiff'], north: ['medium', 'electric', 'scout', 'sprung'], blaze: ['road', 'torque', 'alloy', 'stiff'],
    alpine: ['hard', 'turbo', 'scout', 'sprung'], mesa: ['road', 'electric', 'carbon', 'sprung'], pixel: ['medium', 'battery', 'drs', 'sprung'],
    drift: ['soft', 'turbo', 'scout', 'stiff'], crest: ['paddle', 'battery', 'floor', 'stiff'], volt: ['offroad', 'sprint', 'alloy', 'stiff'],
    reed: ['soft', 'solar', 'floor', 'stiff'], forge: ['medium', 'torque', 'scout', 'stiff'], lumen: ['hard', 'solar', 'carbon', 'sprung'], tide: ['road', 'electric', 'carbon', 'titanium'],
  },
};
```

Dune keeps the existing rival builds (the old balance set), each with the stiff chassis.

- [ ] **Step 4: Rewrite `tests/balance.test.js`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUDGET, DEFAULT_BUILD, DEMO_TEAMS, PARTS, rivalsFor } from '../shared/content.js';
import { buildStats } from '../shared/simulation.js';
import { TRACKS } from '../shared/tracks.js';
import { analyse, finish } from '../scripts/balance-report.mjs';

const reports = Object.fromEntries(TRACKS.map(track => [track.id, analyse(track)]));
const key = build => `${build.wheels}/${build.power}/${build.body}/${build.chassis}`;

test('every rival build is complete and within budget on every track', () => {
  for (const track of TRACKS) for (const team of rivalsFor(track.id)) {
    assert.ok(buildStats(team.build).cost <= BUDGET, `${track.id}/${team.id}`);
    for (const slot of ['wheels', 'power', 'body', 'chassis', 'sensor']) assert.ok(PARTS[team.build[slot]], `${track.id}/${team.id}/${slot}`);
  }
});

test('each track can be won by several different builds', () => {
  for (const track of TRACKS) {
    const report = reports[track.id];
    assert.ok(report.winners >= 4, `${track.id}: only ${report.winners} winning builds`);
    assert.ok(report.winnerTyres.length >= 2, `${track.id}: winners share one tyre`);
    assert.ok(report.winnerPower.length >= 2, `${track.id}: winners share one power unit`);
  }
});

test('no build wins every track', () => {
  const sets = TRACKS.map(track => new Set(reports[track.id].rows.filter(row => row.ers.place === 1).map(row => key(row.build))));
  const everywhere = [...sets[0]].filter(item => sets.every(set => set.has(item)));
  assert.equal(everywhere.length, 0, `build wins everywhere: ${everywhere[0]}`);
});

test('25–45% of affordable builds crash or retire, and the default car does not score', () => {
  for (const track of TRACKS) {
    const trouble = reports[track.id].trouble;
    assert.ok(trouble >= 25 && trouble <= 45, `${track.id}: ${trouble}% crash or retire`);
    assert.ok(finish(DEFAULT_BUILD, track, 3).place > 10, `${track.id}: the starting car should not score`);
  }
});

test('every part except the sprint package reaches the top five somewhere, and price does not buy the win', () => {
  for (const id of Object.keys(PARTS).filter(id => PARTS[id].slot !== 'sensor' && id !== 'sprint')) {
    assert.ok(TRACKS.some(track => reports[track.id].rows.some(row => Object.values(row.build).includes(id) && row.ers.place <= 5)), `${id} never reaches the top five`);
  }
  for (const track of TRACKS) {
    const rows = reports[track.id].rows, priciest = Math.max(...rows.map(row => row.cost));
    assert.ok(rows.some(row => row.cost < priciest && row.ers.place === 1), `${track.id}: the priciest build always wins`);
  }
  assert.ok(DEMO_TEAMS.length >= 19);
});
```

- [ ] **Step 5: Tune.** Run `node scripts/balance-report.mjs` and `node --test tests/balance.test.js`. Tune in this order, re-running after each change, until the suite passes:
  1. Per-section `required` values in `shared/tracks.js` (±5 at a time): raising them lowers the "trouble" percentage's complement; the target is 25–45% builds in trouble per track.
  2. `RIVAL_BUILDS` (swap one rival at a time) so winners come from ≥2 tyres and ≥2 power units.
  3. Part `pace` in `shared/content.js` for the new parts (±.03) if one part never reaches the top five.
  4. `BUDGET` (80–100) if the all-best build wins everywhere.
  Do not weaken a threshold in the test to pass it. If a target cannot be met after these knobs, stop and report the numbers.

- [ ] **Step 6: Commit**

```bash
git add shared tests scripts
git commit -m "feat: per-track rivals and balance tuning"
```

---

### Task 8: Chassis slot and new parts in the UI

**Files:**
- Modify: `src/ui/render.js` (slot count label), `src/ui/icons.js` (`slotIcon.chassis`), `src/ui/part-looks.js` (`TYRE_LOOKS` for `hard/inter/wet`, new `CHASSIS_LOOKS`), `src/ui/part-art.js` (chassis illustration), `src/scene/racecar.js` (chassis look), `src/scene/workshop.js` (fitting point for the chassis slot), `src/ui/engineering-ui.js` (detail ratings labels for chassis), `tests/browser/assembly.spec.js`

**Interfaces:**
- Consumes: `SLOTS`, `PARTS` with the new ids (Task 1).
- Produces: a working 5th tab and fitting point; new parts render on the shelf and the 3D car.

- [ ] **Step 1: Read first.** Read `src/ui/icons.js`, `src/ui/engineering-ui.js`, `src/ui/assembly.js`, `src/scene/workshop.js` (the slot/anchor code: `grep -n "wheels\|anchor\|slot" src/scene/workshop.js`), `tests/browser/assembly.spec.js`. Note: how fitting points are defined per slot, which keys the detail view reads from `ratings`, and which icon names exist.

- [ ] **Step 2: Add looks.** In `src/ui/part-looks.js`:

```js
// extend TYRE_LOOKS
  hard: { stripe: '#e8eaee', width: 1.04, tread: 'blocks' },
  inter: { stripe: '#4caf9a', width: 1.02, tread: 'grooves' },
  wet: { stripe: '#4f8dff', width: 1.06, tread: 'grooves' },

// stance: ride height multiplier; arms: suspension arm thickness; tub: body accent; accent: highlight
export const CHASSIS_LOOKS = {
  stiff: { arms: 1.25, tub: '#98a4b5', accent: null, drop: 0 },
  sprung: { arms: .75, tub: '#6e7683', accent: '#e0a050', drop: .06 },
  titanium: { arms: .9, tub: '#8fa0b6', accent: PALETTE.cyan, drop: .03 },
  monocoque: { arms: 1, tub: '#20252e', accent: '#ffffff', drop: .02 },
};
```

- [ ] **Step 3: Draw the chassis on the car.** In `src/scene/racecar.js` import `CHASSIS_LOOKS`, read `const chassis = CHASSIS_LOOKS[build.chassis] || CHASSIS_LOOKS.stiff;`, scale the suspension arm height by `chassis.arms` (the `box(car,[.07,.07,1.1]...)` arms: use `.07*chassis.arms` for the height and width), colour the floor plank (`box(car,[4.5,.14,2],...)`) with `material(chassis.tub,.6,.15)` instead of `carbon`, and when `chassis.accent` is set add a thin accent strip `box(car,[3.6,.03,.05],[-.3,.43,Math.sign(z)*1.0],material(chassis.accent),0)` inside the per-side loop.

- [ ] **Step 4: Shelf illustration.** In `src/ui/part-art.js` add a `chassis(look)` function that draws the tub and suspension from above and register it where the art function is selected by slot (mirror how `aero`/`tyre` are registered; read the file's export to see the dispatch):

```js
function chassis(look) {
  const arm = 5 * look.arms;
  return `${shadow(110, 70)}<rect x="40" y="50" width="140" height="38" rx="10" fill="${look.tub}" stroke="#ffffff55"/>
    ${[56, 150].map(x => `<path d="M${x} 50 ${x - 22} 24M${x} 88 ${x - 22} 114" stroke="#c4ccd8" stroke-width="${arm}" stroke-linecap="round"/><rect x="${x - 34}" y="14" width="22" height="14" rx="4" fill="#11151d" stroke="#65738b"/><rect x="${x - 34}" y="110" width="22" height="14" rx="4" fill="#11151d" stroke="#65738b"/>`).join('')}
    ${look.accent ? `<rect x="52" y="66" width="116" height="5" rx="2" fill="${look.accent}"/>` : ''}`;
}
```

- [ ] **Step 5: Slot UI.** In `src/ui/icons.js` add `slotIcon.chassis` (reuse an existing icon name such as `'box'`). In `src/ui/render.js` replace the literal `04 SLOTS` with `` `0${SLOTS.length} SLOTS` ``. In `src/ui/engineering-ui.js` make the ratings bars handle `stability`/`lightness` keys (add them to whatever label map the file uses).

- [ ] **Step 6: Fitting point.** In `src/scene/workshop.js` add a `chassis` fitting point beside the existing four (copy the `sensor` entry and place it near the front floor, e.g. world position `[0.4, 0.3, 0]`; adjust until the label does not overlap the others in a screenshot). Update `src/ui/assembly.js` only if the slot list is hard-coded (the read in Step 1 tells you).

- [ ] **Step 7: Update the browser spec and verify.** In `tests/browser/assembly.spec.js` add one test: open the Chassis tab, drag `Titanium adaptive` onto the car and assert the shelf shows `FITTED`. Then:

Run: `npm test && npx playwright test tests/browser/assembly.spec.js`
Expected: PASS. Take screenshots (`npm run dev`, open the garage at 1440×900 and 390×800) and check that the 5 tabs fit without wrapping.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat: chassis slot and new tyres in the garage"
```

---

### Task 9: Track picker, briefing and prediction by track

**Files:**
- Modify: `src/ui/dialogs.js`, `src/ui/render.js` (header, prediction, sensor text, story steps), `src/main.js` (dispatch `SELECT_TRACK`, pass `trackId` to the incident demo, header refresh), `shared/story.js` (surface-specific copy), `src/styles.css` or `src/garage.css` (picker card styles), `tests/story.test.js`, `tests/browser/workflow.spec.js`

**Interfaces:**
- Consumes: `TRACKS`, `trackById`, `state.trackId`, `SELECT_TRACK` (Tasks 3, 6).
- Produces: `seasonDialog` replaced by `tracksDialog(state)`; the header round button, briefing and prediction all use the selected track.

- [ ] **Step 1: Read first.** Read `src/ui/dialogs.js` in full, `shared/story.js` in full, and `grep -n "season\|briefing\|sand\|road\|rock\|Dune\|terrain" src/main.js src/ui/*.js shared/story.js` to list every hard-coded surface or track string. Every hit is changed in this task.

- [ ] **Step 2: Write the failing story test.** In `tests/story.test.js` add (adapt to the helper the file already uses to build a state):

```js
test('story copy names the selected track and its mystery section', () => {
  for (const track of TRACKS) {
    const state = { ...createGame(undefined, null, track.id) };
    const text = JSON.stringify(storyChapters(state));
    assert.ok(!/sand|road, sand or rock/i.test(text), `${track.id} still mentions sand`);
    assert.ok(text.includes(track.mystery.question) || text.toLowerCase().includes(track.sections.find(s => s.id === track.mystery.section).name.toLowerCase()), track.id);
  }
});
```

Run: `node --test tests/story.test.js` → Expected: FAIL.

- [ ] **Step 3: Make story copy track-driven.** In `shared/story.js` read the track with `trackById(state.trackId)` inside `storyChapters` and replace each sentence that names the surface, "mystery stretch", "road, sand or rock" or "the straight/loose/technical" with text built from `track.mystery.question`, `track.title`, and `track.sections` names. Keep Rae's voice and the chapter ids unchanged (`meet, data, label, train, exam, race`) so `METAPHOR` keeps working.

- [ ] **Step 4: Track picker.** In `src/ui/dialogs.js` replace `seasonDialog` with:

```js
export function tracksDialog(state) {
  const cards = TRACKS.map(track => `<button class="season-card ${track.id === state.trackId ? 'selected' : ''}" data-action="select-track" data-track="${track.id}" ${state.phase !== 'practice' ? 'disabled' : ''}>
    <div class="season-art" style="background:${track.color}"><span class="icon-slot">${icon(track.icon)}</span><strong>${track.number}</strong></div>
    <div class="season-card-copy"><strong>${track.title}</strong><span>${[...new Set(track.sections.map(section => CONDITIONS[section.condition].label))].join(' · ')}</span><p>${track.description}</p></div></button>`).join('');
  return frame(`<span class="eyebrow">THREE TRACKS. THREE WAYS TO FAIL.</span><h2 id="dialog-title">Choose your track.</h2><p class="dialog-lead">Every section asks something different of your car. Pick the parts that suit it, or crash.</p><div class="season-grid">${cards}</div>${state.phase !== 'practice' ? '<p class="dialog-lead">Finish this round to pick another track.</p>' : ''}`);
}
```

(Import `TRACKS` from tracks, `CONDITIONS` from conditions; keep the existing `frame` helper.) Remove the temporary `COURSE`/`SEASON` shim added in Task 6 and update `briefingDialog(state)` and `roundConceptDialog` to read `trackById(state.trackId)`. In `src/main.js` handle `data-action="select-track"`: `session.dispatch({ type: 'SELECT_TRACK', id: button.dataset.track })`, close the dialog on success, reset UI state held in `ui` (`guess`, `viewChapter`) and re-render; wire `data-action="season"` to `tracksDialog(session.getSnapshot())`. Rename the nav label `The season` to `Tracks` and the `06` badge to `03` in `renderShell`.

- [ ] **Step 5: Header, prediction and sensor text.** In `src/ui/render.js` `renderShell` the round button text (`GRAND PRIX 01 / 06`, `Dune Valley`, `icon('sun')`) becomes dynamic: add `id="round-number"`, `id="round-title"`, `id="round-icon"` and have `src/main.js` set them from `trackById(state.trackId)` on every render (`GRAND PRIX ${track.number} / 03`). In `prediction()` replace `['road','sand','rock']` with `trackById(state.trackId).mystery.options` and the labels with `CONDITIONS[option].label`; keep `data-terrain`. In the results lesson (`renderLesson`) replace the hard-coded `SAND` illustration and "The mystery surface was sand" with `track.mystery.target`'s label and the track's mystery question. In the `train` chapter's `track-tests` list replace the three hard-coded items with `track.sections.map(section => `<li><strong>${section.name}</strong><span>${CONDITIONS[section.condition].label}: ${section.suggestion}</span></li>`)`.

- [ ] **Step 6: Run**

Run: `npm test && npx playwright test tests/browser/workflow.spec.js`
Expected: PASS. Update `workflow.spec.js` where it clicks the old sand/rock labels to click the first mystery option of the default track (`abrasive`) and add a step that opens the Tracks dialog, selects Mountain Pass, and asserts the header reads `Mountain Pass`.

- [ ] **Step 7: Commit**

```bash
git add src shared tests
git commit -m "feat: track picker replaces the season cards"
```

---

### Task 10: Condition strip, section forecast and spec sheet

**Files:**
- Create: `src/ui/track-ui.js`
- Modify: `src/ui/render.js`, `src/ui/engineering-ui.js` (`specSheet` rendering), `shared/engineering.js` (`specSheet`, `sectionAdvice`), `src/layout.css`/`src/garage.css`, `tests/engineering.test.js`

**Interfaces:**
- Consumes: `buildProfile`, `sectionOutcome`, `CONDITIONS`, `trackById`, `buildStats`, `BUDGET`.
- Produces:
  - `sectionReport(build, track) => [{ section, condition, outcome, weakStat?, advice: [{ slot, id, name, cost, gain }] }]` (pure, in `shared/engineering.js`)
  - `renderTrackStrip(state)`, `renderSectionForecast(state)` (HTML strings, in `src/ui/track-ui.js`)
  - `specSheet(build)` returns: Top speed, Cornering, Wet grip, Cooling, Tyre life, Stability

- [ ] **Step 1: Write the failing tests** — add to `tests/engineering.test.js`:

```js
import { sectionReport, specSheet } from '../shared/engineering.js';

test('the section report names the weak stat and single-part swaps that help', () => {
  const quarry = trackById('quarry');
  const report = sectionReport(build({ chassis: 'stiff', body: 'floor' }), quarry);
  assert.equal(report.length, quarry.sections.length);
  const kerbs = report.find(item => item.section.id === 'kerbs');
  assert.notEqual(kerbs.outcome.kind, 'clean');
  assert.equal(kerbs.weakStat, 'stability');
  assert.ok(kerbs.advice.length > 0 && kerbs.advice[0].gain > 0);
  assert.ok(kerbs.advice.every(item => item.cost <= BUDGET - buildStats(build({ chassis: 'stiff', body: 'floor' })).cost + PARTS.stiff.cost));
});

test('the spec sheet shows wet grip and stability from the same stats', () => {
  const labels = specSheet(DEFAULT_BUILD).map(item => item.label);
  assert.deepEqual(labels, ['Top speed', 'Cornering', 'Wet grip', 'Cooling', 'Tyre life', 'Stability']);
  assert.ok(specSheet(build({ wheels: 'wet' })).find(item => item.id === 'wet').value > specSheet(build({ wheels: 'road' })).find(item => item.id === 'wet').value);
});
```

(Import `BUDGET`, `PARTS` from content and `buildStats` from simulation at the top of the file if missing.)

Run: `node --test tests/engineering.test.js` → Expected: FAIL.

- [ ] **Step 2: Implement in `shared/engineering.js`**

```js
// For each section: the outcome at lap 1, the stat that is furthest below the baseline, and the best
// single-part swaps (by score gain) that fit the budget.
export function sectionReport(build, track = DEFAULT_TRACK) {
  const profile = buildProfile(build);
  return track.sections.map(section => {
    const outcome = sectionOutcome(profile, section, 1);
    const weakStat = Object.entries(section.demand).sort((a, b) => (profile[a[0]] * 1) - (profile[b[0]] * 1))[0][0];
    const advice = outcome.kind === 'clean' ? [] : SLOTS.flatMap(slot => Object.values(PARTS).filter(part => part.slot === slot && part.id !== build[slot]).map(part => {
      const next = { ...build, [slot]: part.id };
      return { slot, id: part.id, name: part.name, cost: part.cost - PARTS[build[slot]].cost, total: buildStats(next).cost, gain: round1(sectionScore(buildProfile(next), section, 1) - outcome.score) };
    })).filter(item => item.total <= BUDGET && item.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 3);
    return { section, condition: section.condition, outcome, weakStat, advice };
  });
}
```

(Import `sectionScore` from `./conditions.js`.) Replace `specSheet` with:

```js
export function specSheet(build) {
  const profile = buildProfile(build);
  return [
    { id: 'straight', label: 'Top speed', value: clamp(profile.topSpeed) },
    { id: 'technical', label: 'Cornering', value: clamp(Math.round(.5 * profile.dryGrip + .5 * profile.downforce)) },
    { id: 'wet', label: 'Wet grip', value: clamp(profile.wetGrip) },
    { id: 'cooling', label: 'Cooling', value: clamp(profile.cooling) },
    { id: 'endurance', label: 'Tyre life', value: clamp(Math.round(.5 * profile.abrasion + .5 * profile.heatTol)) },
    { id: 'stability', label: 'Stability', value: clamp(profile.stability) },
  ];
}
```

Run: `node --test tests/engineering.test.js` → Expected: PASS. Then fix any UI code that relied on the old five ids (`loose`): `grep -rn "'loose'\|\"loose\"\|spec-sheet\|specSheet" src` and update `engineering-ui.js`; widen `.spec-sheet` to 6 items (`grid-template-columns: repeat(3, 1fr)` at the existing breakpoints, which already use three columns).

- [ ] **Step 3: Track strip and forecast** — create `src/ui/track-ui.js`:

```js
import { CONDITIONS } from '../../shared/conditions.js';
import { INCIDENTS, sectionReport } from '../../shared/engineering.js';
import { SLOT_LABELS } from '../../shared/content.js';
import { trackById } from '../../shared/tracks.js';
import { escapeHtml as e } from './icons.js';

const STAT_LABELS = { dryGrip: 'Dry grip', wetGrip: 'Wet grip', warmup: 'Tyre warm-up', abrasion: 'Grit resistance', heatTol: 'Heat tolerance', downforce: 'Downforce', topSpeed: 'Top speed', cooling: 'Cooling', stability: 'Stability' };

// One chip per section: its condition, and (after a practice run) whether the car passes it.
export function renderTrackStrip(state) {
  const track = trackById(state.trackId), report = sectionReport(state.build, track), scanned = state.runs.length > 0 || state.qualifying;
  return `<div class="track-strip" aria-label="Track sections">${report.map(({ section, outcome }, index) => `
    <div class="track-chip cond-${section.condition} ${scanned ? `is-${outcome.kind}` : ''}"><span class="eyebrow">${String(index + 1).padStart(2, '0')} · ${CONDITIONS[section.condition].label.toUpperCase()}</span>
    <strong>${e(section.name)}</strong><small>${e(CONDITIONS[section.condition].blurb)}</small></div>`).join('')}</div>`;
}

// Per section: how the car scores against the baseline, which stat is weakest and what to try.
export function renderSectionForecast(state) {
  const track = trackById(state.trackId);
  return `<div class="section-forecast"><span class="eyebrow">SECTION FORECAST</span>${sectionReport(state.build, track).map(({ section, outcome, weakStat, advice }) => `
    <div class="forecast-row is-${outcome.kind}"><div><strong>${e(section.name)}</strong><small>${CONDITIONS[section.condition].label} · needs ${Math.round(section.required)} · you score ${Math.round(outcome.score)}</small></div>
    <span class="pill">${{ clean: 'CLEAN', slow: 'SLOWER', incident: INCIDENTS[outcome.type]?.label ?? 'INCIDENT', crash: 'CRASH RISK', fire: 'FIRE RISK' }[outcome.kind]}</span>
    ${outcome.kind === 'clean' ? '' : `<p>${e(section.suggestion)} Weakest: ${STAT_LABELS[weakStat]}. Try ${advice.map(item => `${e(item.name)} (${SLOT_LABELS[item.slot]}, ${item.cost >= 0 ? '+' : ''}${item.cost} cr)`).join(', ') || 'a cheaper swap elsewhere'}.</p>`}</div>`).join('')}</div>`;
}
```

- [ ] **Step 4: Mount them.** In `src/ui/render.js`: render `renderTrackStrip(state)` at the top of the `train` and `exam` chapter bodies (above the run report) and `renderSectionForecast(state)` in place of (or above) `renderRisks(state)` there, importing from `./track-ui.js`. Update `renderRisks` to call `raceRiskForecast(state.build, trackById(state.trackId))`, and every other caller of `buildIncidents`/`setupRisks`/`incidentFixes` (`grep -rn "setupRisks\|raceRiskForecast\|incidentFixes\|buildIncidents" src`) to pass the track. Add styles in `src/garage.css`:

```css
.track-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px}
.track-chip{padding:10px;border:1px solid #2d3c52;border-radius:5px;background:#111d2b}
.track-chip small{display:block;color:#93a4bb;font-size:10px;margin-top:4px}
.track-chip.is-clean{border-color:#2f7a5a}.track-chip.is-slow{border-color:#a98a2f}.track-chip.is-incident{border-color:#b8693a}.track-chip.is-crash,.track-chip.is-fire{border-color:#d4433f}
.forecast-row{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:10px 0;border-top:1px solid #2d3c52}
.forecast-row p{grid-column:1/-1;margin:0;font-size:11px;color:#b2c3db}
.forecast-row.is-crash .pill,.forecast-row.is-fire .pill{background:#d4433f;color:#fff}
```

- [ ] **Step 5: Run and look**

Run: `npm test && npx playwright test tests/browser/workflow.spec.js tests/browser/presentation.spec.js`
Expected: PASS. Open the garage on each track at 1440×900 and 390×800 and check the strip wraps cleanly and the forecast reads naturally.

- [ ] **Step 6: Commit**

```bash
git add src shared tests
git commit -m "feat: condition strip and per-section forecast"
```

---

### Task 11: Per-track circuit, minimap, landmarks and weather effects

**Files:**
- Modify: `src/scene/circuit.js`, `src/scene/workshop.js`, `src/scene/effects.js`, `src/main.js`, `src/ui/race-ui.js`

**Interfaces:**
- Consumes: `trackById(trackId)` with `points`, `sections`, `landmarks`.
- Produces: `createWorkshop(...)` builds the circuit from the selected track and rebuilds when `trackId` changes; section tints reflect the condition.

- [ ] **Step 1: Read first.** Read `src/scene/circuit.js`, the circuit/minimap/landmark parts of `src/scene/workshop.js` (`grep -n "circuit\|minimap\|TRACK_\|landmark\|zone" src/scene/workshop.js src/ui/race-ui.js src/main.js`), and `src/scene/effects.js`. Note how `circuit.js` consumes `TRACK_POINTS`, `TRACK_ZONES`, `TRACK_LANDMARKS`, and where `zone` (now a section object with `name`, `label`, `kind`) is read in `race-ui.js` (the race readout).

- [ ] **Step 2: Parametrize the circuit.** Change `circuit.js` to export `buildCircuit(track)` (what it exports now, built from `track.points`, `track.sections.filter(s => s.kind === 'corner')` for braking ribbons and `track.landmarks`). Delete the imports of `shared/track.js`; then delete `shared/track.js` (all of its data now lives in `shared/tracks.js`). In `workshop.js` keep one circuit group per track id (lazily created, hidden when not selected) and expose `workshop.setTrack(trackId)`; call it from `src/main.js` in the render path whenever `state.trackId` changes, and before `createIncidentDemo(..., state.trackId)`.

- [ ] **Step 3: Section tint and weather.** In `buildCircuit`, tint each section's ribbon by condition with this palette: dry `#3a4350`, abrasive `#6d5a45`, damp `#2f4658`, cold `#4a5d70`, bumpy `#5a4a3a`, hot `#7a4a3a`, rain `#243a52`; add a thin lighter edge strip for `damp`/`rain`. In `src/scene/effects.js` add `splash` (blue-white particles, reuse the `dust` emitter with colour `#bfe0ff` and upward velocity) and map it: `aquaplane` → `splash`. If `INCIDENTS.aquaplane.effect` is changed to `'splash'` in `shared/engineering.js`, `grep -rn "effect ===\|effect:" src` to confirm every consumer handles the new name.

- [ ] **Step 4: Race readout.** In `src/ui/race-ui.js` the corner/zone readout (`#race-zone`) should show `zone.name` and `CONDITIONS[zone.condition].label` (for example `T1 · Gravel hairpin · Abrasive`) while keeping the existing `zone.label` text.

- [ ] **Step 5: Verify visually**

Run: `npm run dev` and take screenshots of the circuit view and a race for each track at 1440×900 and 390×800 (Playwright script as in the earlier screenshot run). Check: closed loop, no self-intersection, readable landmark labels, tint differences visible, nothing from Dune's old points remains on the other tracks. If a point list self-intersects, adjust the offending points in `shared/tracks.js` and re-run `node --test tests/tracks.test.js`.

- [ ] **Step 6: Commit**

```bash
git add src shared
git commit -m "feat: per-track circuits, tints and splash effect"
```

---

### Task 12: Docs, browser suite and final verification

**Files:**
- Modify: `DESIGN.md`, `README.md`, `CLAUDE.md`, `tests/browser/*.spec.js`

- [ ] **Step 1: Update docs.** `DESIGN.md`: replace "Parts, budget and balance", the incident table and the "Race rules" incidents section with the new slots (5), part table (new tyres and chassis), condition list, the outcome bands, the crash rule (≈12 s, car keeps racing, fire still retires) and the three tracks. `README.md`: update "Playable now" (5 slots, 29 parts, three tracks, section forecast) and remove the sand/Dune-only wording. `CLAUDE.md`: add `shared/tracks.js`, `conditions.js`, `part-stats.js` to the architecture list, and note that `balance.test.js` runs all three tracks (slow) and that `scripts/balance-report.mjs` prints the numbers.

- [ ] **Step 2: Update browser specs.** Update every spec that assumes four slots, the sand/road/rock prediction, a 24-segment race, or the season dialog (`grep -n "sand\|rock\|season\|Season\|Dune" tests/browser/*.js`). Add a spec that plays a full race on Mountain Pass and asserts: the player has a classified place, at least one rival shows a `Crash` or `Aquaplaning` incident in the reel, and no car other than a fire retirement is marked OUT.

- [ ] **Step 3: Full verification**

Run, and paste the results into the final report:

```bash
npm test
npm run build
npm run test:browser
```

Expected: all PASS (the browser suite takes several minutes). If anything fails, fix the cause; do not relax a test.

- [ ] **Step 4: Manual pass.** At 2560×1300, 1440×900 and 390×800, play one round on each track: pick the track, scan, predict, practice, qualify, race, read results. Confirm: no horizontal scroll, the track strip and forecast read clearly, crashes show a warning, the moment and the position loss, and the results reel lists them with fixes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: track conditions design, readme and browser specs"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| 1 Stats model, new parts, budget | 1, 2 |
| 2 Section evaluation (bands, wear, determinism) | 2, 5 |
| 3 Crash rule (large loss, car keeps racing) | 2, 5 |
| 4 Tracks and mystery sections | 3, 6, 9 |
| 5 Code changes (`tracks.js`, `conditions.js`, content, engineering, simulation/race, game, UI, docs) | 1–12 |
| 6 Testing (conditions, per-track balance, race tests) | 2, 4, 5, 7, 12 |
| 7 Build order | task order |

**Deviations from the spec (intentional, noted here):**
- The spec listed per-condition stat modifiers (damp, cold, rain). They are expressed instead as the stats each section demands (`wetGrip`, `warmup`); only abrasive and hot have lap-dependent modifiers. Same behaviour, less code.
- Section time loss uses `sector` pace for `straight`/`technical` only; the old `loose` pace is no longer used by the new tracks (all new parts have `loose: 0`).
- Dune Valley is re-cut into four sections (the old three-sector layout is gone), so its old balance numbers are re-tuned in Task 7.
- Fire retirement is kept through `escalates` hot sections (Dune heat-soak, Quarry furnace) instead of the sprint trait.

**Placeholder scan:** UI tasks (8, 9, 10, 11) start with an explicit read step because they edit files with many hard-coded details (anchors, story strings, circuit geometry). Their code blocks are complete where the interface is new. If the read step shows a different structure than assumed (for example how `part-art.js` dispatches by slot), adapt the registration but keep the function signatures above.

**Type consistency:** `simulate(build, track)`, `createRace(entries, qualifyingBuild, track)`, `buildIncidents(build, track)`, `planIncidents`, `sectionOutcome(profile, section, lap)`, `sectionReport(build, track)`, `trackById`, `trackSegments`, `trackZone(track, distance)`, `rivalsFor(trackId)` and the `trackId` field on both `state` and `race` are used with the same names in every task. The command field stays `terrain` for `PREDICT`.
