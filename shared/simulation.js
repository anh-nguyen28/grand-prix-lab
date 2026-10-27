import { PARTS, SLOTS } from './content.js';
import { buildProfile, sectionOutcome } from './conditions.js';
import { DEFAULT_TRACK, trackSegments } from './tracks.js';

export function buildStats(build) {
  return { cost: SLOTS.reduce((total, slot) => total + PARTS[build[slot]].cost, 0) };
}

// Seconds per lap each fitted part adds (positive) or saves (negative) in one sector.
export function sectorPace(build, sector) {
  return SLOTS.reduce((total, slot) => total + (PARTS[build[slot]].pace?.[sector] ?? 0), 0);
}

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

export function racePoints(place) {
  return [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][place - 1] ?? 0;
}
