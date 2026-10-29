import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
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

test('every track has a closed circuit and valid sections', () => {
  for (const track of TRACKS) {
    assert.ok(track.points.length >= 12);
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

// The pit building and stands are fixed props placed around Dune Valley's footprint, and barriers sit 1.8 units
// either side of the line, so every circuit must stay inside that footprint and never pinch back on itself.
test('every circuit fits the shared footprint and never pinches', () => {
  for (const track of TRACKS) {
    const curve = new THREE.CatmullRomCurve3(track.points.map(point => new THREE.Vector3(...point)), true, 'catmullrom', .32);
    const samples = curve.getSpacedPoints(300).slice(0, 300), length = curve.getLength();
    for (const point of samples) {
      assert.ok(point.x >= -19.5 && point.x <= 18.5, `${track.id}: x ${point.x.toFixed(1)}`);
      assert.ok(point.z >= -12 && point.z <= 9.6, `${track.id}: z ${point.z.toFixed(1)}`);
    }
    let closest = Infinity;
    for (let i = 0; i < 300; i++) for (let j = i + 1; j < 300; j++) {
      if (Math.min(j - i, 300 - (j - i)) * length / 300 < 8) continue;
      closest = Math.min(closest, Math.hypot(samples[i].x - samples[j].x, samples[i].z - samples[j].z));
    }
    assert.ok(closest >= 4.8, `${track.id}: the track comes within ${closest.toFixed(1)} of itself`);
  }
});
