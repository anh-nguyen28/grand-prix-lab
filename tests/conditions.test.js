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
