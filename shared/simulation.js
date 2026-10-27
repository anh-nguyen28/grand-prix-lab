import { PARTS, COURSE, SLOTS } from './content.js';

export function buildStats(build) {
  return { cost: SLOTS.reduce((total, slot) => total + PARTS[build[slot]].cost, 0) };
}

// Seconds per lap each fitted part adds (positive) or saves (negative) in one sector.
export function sectorPace(build, sector) {
  return SLOTS.reduce((total, slot) => total + (PARTS[build[slot]].pace?.[sector] ?? 0), 0);
}

const PROBLEMS = {
  straight: { wheels: 'Heavy tyres dulled the acceleration.', power: 'Not enough output for the straight.', body: 'Wing drag held the car back on the straight.' },
  loose: { wheels: 'Wheels lost grip on this surface.', power: 'The power unit struggled to drive through the loose surface.', body: 'The car felt unsettled on the loose surface.' },
  technical: { wheels: 'The tyres could not hold the corners.', power: 'The power unit was slow out of the corners.', body: 'Low downforce cost time in the corners.' },
};
const SUGGESTIONS = {
  straight: { wheels: 'Lighter slick or medium tyres are quicker here.', power: 'Try a stronger power unit, if you can manage the heat.', body: 'Less drag helps here. Try balanced or low-drag aero.' },
  loose: { wheels: 'Try grooved or endurance tyres.', power: 'More output helps a little on loose ground.', body: 'A more stable aero package can help.' },
  technical: { wheels: 'Endurance tyres hold the corners best.', power: 'A lighter unit can help in the corners.', body: 'Try balanced or high-downforce aero.' },
};
const PRACTICE_SCALE = 2.5;

// Pure, deterministic rules. These can be imported unchanged by a future server.
export function simulate(build, course = COURSE) {
  const segments = course.segments.map(segment => {
    const delta = sectorPace(build, segment.sector);
    const worst = SLOTS.filter(slot => slot !== 'sensor').sort((a, b) => (PARTS[build[b]].pace[segment.sector]) - (PARTS[build[a]].pace[segment.sector]))[0];
    const good = delta <= .05;
    const time = segment.base + delta * PRACTICE_SCALE;
    return { ...segment, time: Math.round(time * 100) / 100, good,
      problem: good ? 'A clean run. This combination works here.' : PROBLEMS[segment.sector][worst],
      suggestion: good ? 'Keep this strength while improving the other stretches.' : SUGGESTIONS[segment.sector][worst] };
  });
  return { time: Math.round(segments.reduce((sum, s) => sum + s.time, 0) * 100) / 100, segments, build: { ...build } };
}

export function rankField(entries) {
  const sorted = entries.map(entry => ({ ...entry, result: simulate(entry.build) })).sort((a, b) => a.result.time - b.result.time || a.id.localeCompare(b.id));
  return sorted.map((entry, index) => ({ ...entry, place: index > 0 && entry.result.time === sorted[index - 1].result.time ? sorted.findIndex(item => item.result.time === entry.result.time) + 1 : index + 1 }));
}

export function racePoints(place) {
  return [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][place - 1] ?? 0;
}
