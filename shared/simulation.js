import { PARTS, COURSE } from './content.js';

export function buildStats(build) {
  const parts = Object.values(build).map(id => PARTS[id]);
  return {
    cost: parts.reduce((total, part) => total + part.cost, 0),
    weight: parts.reduce((total, part) => total + part.weight, 0),
    power: PARTS[build.power].power,
    grip: PARTS[build.wheels].fit.sand,
    protection: PARTS[build.body].protection,
  };
}

// Pure, deterministic rules. These can be imported unchanged by a future server.
export function simulate(build, course = COURSE) {
  const stats = buildStats(build);
  const segments = course.segments.map(segment => {
    const fit = PARTS[build.wheels].fit[segment.terrain] ?? 0;
    const speed = stats.power / stats.weight * (1 + fit * 0.12);
    const slip = fit < 0 ? -fit * 2 : 0;
    const climb = segment.slope ? Math.max(0, stats.weight - stats.power / 4) * 1.2 : 0;
    const impact = segment.terrain === 'rock' ? Math.max(0, 2 - stats.protection) * 1.8 : 0;
    const time = segment.length / speed + slip + climb + impact;
    const problem = slip > 0 ? 'Wheels lost grip on this surface.' : climb > 1.5 ? 'Extra weight slowed the climb.' : impact > 0 ? 'The light chassis took a rough landing.' : 'A clean run. This combination works here.';
    const suggestion = slip > 0 ? 'Try grooved or endurance tyres.' : climb > 1.5 ? 'Try a stronger motor or lighter chassis.' : impact > 0 ? 'A protected chassis reduces the landing penalty.' : 'Keep this strength while improving the other stretches.';
    return { ...segment, time: Math.round(time * 100) / 100, good: slip + climb + impact < 1.5, problem, suggestion };
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
