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
