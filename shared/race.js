import { BOOST_CHARGES, BOOST_COOLDOWN, BOOST_GAIN, BOOST_SECONDS, GRID_GAP, PARTS, RACE_LAPS } from './content.js';
import { engineeringStats, INCIDENTS, planIncidents, previewIncidents } from './engineering.js';
import { sectorPace, simulate } from './simulation.js';
import { DEFAULT_TRACK, trackById, trackSegments, trackZone } from './tracks.js';


const round = n => Math.round(n * 1000) / 1000;
export const WARNING_SECONDS = 3;
function noise(id, lap, sector) {
  let hash = 2166136261;
  for (const char of `${id}:${lap}:${sector}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 1000) / 1000 - .5;
}

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

export function createRace(entries, qualifyingBuild, track = DEFAULT_TRACK) {
  const sections = trackSegments(track);
  const grid = entries.map(entry => ({ ...entry, qualifying: simulate(entry.id === 'you' ? qualifyingBuild : entry.build, track) }))
    .sort((a, b) => a.qualifying.time - b.qualifying.time || a.id.localeCompare(b.id));
  const field = grid.map((entry, gridIndex) => {
    const tyre = PARTS[entry.build.wheels], incidentPlan = planIncidents(entry.build, track);
    const segments = Array.from({ length: RACE_LAPS }, (_, lap) => sections.map((segment, index) => ({
      id: segment.id, name: segment.name, terrain: segment.condition, lap: lap + 1, sector: index + 1,
      time: round(segment.base + sectorPace(entry.build, segment.sector) * segment.share + lap * tyre.wear * 3 / sections.length + noise(entry.id, lap, segment.id) * .18 + (lap === 0 && index === 0 ? tyre.launch ?? 0 : 0) + (incidentPlan.quiet[`${lap + 1}:${segment.id}`] ?? 0)),
    }))).flat();
    const plan = buildTimeline(segments, incidentPlan.events, sections);
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

const DEMO_SECTIONS = [{ from: 0, to: 1 / 3 }, { from: 1 / 3, to: 2 / 3 }, { from: 2 / 3, to: 1 }];
// The practice run: the car alone for one lap, with the worst problem of every weak section shown in order.
// Same pace model and timeline as the race, so the lap is exactly reproducible for "Watch run again".
export function createPracticeLap(entry, track = DEFAULT_TRACK) {
  const sections = trackSegments(track);
  const segments = sections.map((segment, index) => ({
    id: segment.id, name: segment.name, terrain: segment.condition, lap: 1, sector: index + 1,
    time: round(segment.base + sectorPace(entry.build, segment.sector) * segment.share),
  }));
  const plan = buildTimeline(segments, previewIncidents(entry.build, track), sections);
  const car = { ...entry, grid: 1, startDelay: 0, timeline: plan.timeline, incidents: plan.events, retirement: null, lapTimes: [plan.time],
    result: { segments, time: plan.time, incidentLoss: round(plan.events.reduce((sum, event) => sum + event.loss, 0)), build: { ...entry.build } } };
  return { laps: 1, trackId: track.id, field: [car], boosts: [], maxTime: plan.time, charges: 0, practice: true };
}

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

export function effectiveTime(race, id, elapsed) {
  const entry = race.field.find(car => car.id === id);
  return Math.max(0, elapsed - entry.startDelay) + race.boosts.filter(boost => boost.id === id)
    .reduce((gain, boost) => gain + Math.min(BOOST_SECONDS, Math.max(0, elapsed - boost.at)) * BOOST_GAIN, 0);
}
function elapsedForProgress(race, entry, virtualTime) {
  let low = 0, high = race.maxTime + 1;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    if (effectiveTime(race, entry.id, mid) < virtualTime) low = mid;
    else high = mid;
  }
  return high;
}
function virtualTimeAtDistance(entry, distance) {
  const piece = entry.timeline.find(item => distance <= item.to) || entry.timeline.at(-1);
  return piece.start + Math.max(0, Math.min(1, (distance - piece.from) / (piece.to - piece.from))) * piece.duration;
}
export function sampleRace(race, elapsed) {
  const rows = race.field.map(entry => {
    const virtualTime = Math.min(effectiveTime(race, entry.id, elapsed),entry.retirement?.end??Infinity);
    const piece = entry.timeline.find(item => virtualTime < item.start + item.duration) || entry.timeline.at(-1);
    const fraction = Math.max(0, Math.min(1, (virtualTime - piece.start) / piece.duration));
    let distance = Math.min(race.laps, piece.from + fraction * (piece.to - piece.from));
    const retired=!!entry.retirement&&virtualTime>=entry.retirement.end;
    if(retired)distance=entry.retirement.to;
    const finished = !retired && virtualTime >= entry.result.time;
    const fullEvent=piece.event?entry.incidents.find(event=>event.distance===piece.event.distance&&event.type===piece.event.type):null;
    const incident = retired ? {...entry.retirement,progress:1,effect:'steam',label:'RETIRED · BRAKE FAILURE'} : !finished && piece.event ? {...piece.event,progress:Math.min(1,(virtualTime-fullEvent.start)/(fullEvent.end-fullEvent.start))} : null;
    const completedIncidents = entry.incidents.filter(event => virtualTime >= event.end);
    // A short warning before each incident gives spectators time to look.
    const warning = retired || finished ? null : entry.incidents.find(event => event.start > virtualTime && event.start - virtualTime <= WARNING_SECONDS) || null;
    const stats = engineeringStats(entry.build);
    return { ...entry, distance:retired?entry.retirement.to:finished?race.laps:distance, virtualTime, finished, retired, incident, zone:trackZone(trackById(race.trackId),distance),
      completedIncidents, warning, finishTime: finished ? round(elapsedForProgress(race, entry, entry.result.time)) : null,
      lap: Math.min(race.laps, Math.floor(distance) + 1),
      heat: Math.round(Math.min(99, 45 + (100 - stats.cooling) * .5 + distance * 2 + (incident?.type === 'overheat' ? 20 : 0))),
      tyreLife: Math.round(Math.max(15, 100 - distance * (100 - stats.endurance) / 9)),
      boosting: race.boosts.some(boost => boost.id === entry.id && elapsed >= boost.at && elapsed < boost.at + BOOST_SECONDS),
    };
  }).sort((a, b) => a.retired!==b.retired?(a.retired?1:-1):a.finished && b.finished ? a.finishTime - b.finishTime || a.id.localeCompare(b.id) : b.distance - a.distance || a.grid - b.grid);
  const leader = rows[0];
  return rows.map((row, index) => ({ ...row, position: index + 1,
    gap:row.retired?0:index === 0 ? 0 : row.finished && leader.finished ? round(row.finishTime - leader.finishTime) : round(Math.max(0, elapsed - elapsedForProgress(race, leader, virtualTimeAtDistance(leader, row.distance)))),
  }));
}
export function addPlayerBoost(race, elapsed) {
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= race.maxTime) return { ok: false, message: 'Wait for lights out before deploying ERS.' };
  const used = race.boosts.filter(boost => boost.id === 'you');
  if (used.length >= BOOST_CHARGES) return { ok: false, message: 'All three ERS charges are used.' };
  if (used.length && elapsed - used.at(-1).at < BOOST_COOLDOWN) return { ok: false, message: 'ERS is recharging. Wait for the indicator.' };
  if (sampleRace(race, elapsed).find(entry => entry.id === 'you').finished || sampleRace(race, elapsed).find(entry => entry.id === 'you').retired) return { ok: false, message: 'Your car is no longer racing.' };
  return { ok: true, race: { ...race, boosts: [...race.boosts, { id: 'you', at: elapsed }], charges: BOOST_CHARGES - used.length - 1 } };
}
export function finishRace(race) {
  const rows = sampleRace(race, race.maxTime + 1);
  return rows.map((row, index) => ({ ...row,
    place: !row.retired && index > 0 && row.finishTime === rows[index - 1].finishTime ? rows.findIndex(car => car.finishTime === row.finishTime) + 1 : index + 1,
    result: { ...row.result, time: row.retired?null:row.finishTime },
  }));
}

// Where a car stood when an incident began, where it stood once it recovered, and who got past.
export function incidentImpact(race, id, event) {
  const entry = race.field.find(car => car.id === id);
  const start = elapsedForProgress(race, entry, event.start), end = elapsedForProgress(race, entry, event.end) + 1;
  const before = sampleRace(race, start), after = sampleRace(race, end);
  const was = before.find(car => car.id === id), now = after.find(car => car.id === id);
  const passedBy = after.filter(car => car.id !== id && car.position < now.position && before.find(other => other.id === car.id).position > was.position).map(car => car.name);
  return { before: was.position, after: now.position, passedBy, retired: event.type === 'fire', loss: event.loss, start, end };
}

// Neighbouring running cars separated by less than a second are fighting for a place.
export function findBattles(rows, threshold = 1) {
  const running = rows.filter(row => !row.retired && !row.finished);
  return running.slice(1).map((row, i) => ({ position: row.position, ahead: running[i], behind: row, gap: round(row.gap - running[i].gap) }))
    .filter(battle => battle.gap >= 0 && battle.gap < threshold);
}

// The quickest lap any car has completed so far.
export function fastestLap(rows) {
  let best = null;
  for (const row of rows) {
    const completed = row.finished ? row.lapTimes.length : Math.floor(row.distance);
    row.lapTimes.slice(0, row.retired ? 0 : completed).forEach((time, index) => {
      if (index > 0 && (!best || time < best.time)) best = { id: row.id, name: row.name, lap: index + 1, time };
    });
  }
  return best;
}
