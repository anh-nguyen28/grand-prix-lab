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
