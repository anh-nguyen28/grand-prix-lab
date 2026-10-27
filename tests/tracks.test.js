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
