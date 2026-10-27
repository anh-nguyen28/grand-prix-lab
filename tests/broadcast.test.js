import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUILD, DEMO_TEAMS, RACE_LAPS } from '../shared/content.js';
import { incidentFixes, raceRiskForecast } from '../shared/engineering.js';
import { createRace, fastestLap, findBattles, incidentImpact, sampleRace, WARNING_SECONDS } from '../shared/race.js';

// A mismatched car (soft tyres and low drag on a gritty, hot track) so the player has incidents to report.
const WEAK = { ...DEFAULT_BUILD, wheels: 'soft', body: 'scout' };
const entries = [{ id: 'you', name: 'Ada', build: WEAK }, ...DEMO_TEAMS];
const race = createRace(entries, WEAK);
const you = race.field.find(car => car.id === 'you');

test('each incident is announced shortly before it happens, and never after', () => {
  const event = you.incidents[0], elapsedAt = virtual => you.startDelay + virtual;
  const early = sampleRace(race, elapsedAt(event.start - WARNING_SECONDS + .5)).find(car => car.id === 'you');
  assert.equal(early.warning?.type, event.type);
  assert.equal(early.incident, null);
  const during = sampleRace(race, elapsedAt((event.start + event.end) / 2)).find(car => car.id === 'you');
  assert.notEqual(during.warning?.distance, event.distance);
});

test('incident impact reports the places lost and who got past', () => {
  const event = you.incidents.at(-1), impact = incidentImpact(race, 'you', event);
  assert.ok(impact.after >= impact.before);
  assert.ok(impact.passedBy.length >= impact.after - impact.before);
  const after = sampleRace(race, impact.end);
  for (const name of impact.passedBy) assert.ok(after.find(car => car.name === name).position < impact.after);
  assert.ok(impact.end > impact.start);
});

test('battles pair neighbouring cars within a second, and the fastest lap is a completed lap', () => {
  const rows = sampleRace(race, 90);
  for (const battle of findBattles(rows)) { assert.equal(battle.behind.position, battle.ahead.position + 1); assert.ok(battle.gap < 1); }
  assert.ok(race.field.every(car => car.lapTimes.length === RACE_LAPS && car.lapTimes.every(time => time > 0)));
  assert.equal(fastestLap(sampleRace(race, 1)), null);
  const best = fastestLap(sampleRace(race, race.maxTime + 1));
  const finishers = race.field.filter(car => !car.retirement);
  assert.equal(best.time, Math.min(...finishers.flatMap(car => car.lapTimes.slice(1))));
});

test('practice can forecast every race risk and suggest an affordable fix for it', () => {
  const risky = { ...DEFAULT_BUILD, wheels: 'soft', power: 'torque', body: 'scout' };
  const forecast = raceRiskForecast(risky);
  assert.ok(forecast.length >= 2, 'a mismatched car should have several risks');
  for (const risk of forecast) {
    const fixes = incidentFixes(risky, risk.type);
    assert.ok(fixes.length > 0, `no fix for ${risk.type}`);
    for (const fix of fixes) assert.equal(raceRiskForecast({ ...risky, [fix.slot]: fix.id }).some(other => other.type === risk.type), false);
  }
  assert.equal(raceRiskForecast({ ...DEFAULT_BUILD, power: 'sprint' }).find(risk => risk.type === 'fire').retirement, true);
});
