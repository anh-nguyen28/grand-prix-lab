import { PART_STATS } from './part-stats.js';
export const BUDGET = 90;
export const PRACTICE_RUNS = 2;
export const MAX_CHANGED_SLOTS = 2;
export const SLOTS = ['wheels', 'power', 'body', 'chassis', 'sensor'];
export const SLOT_LABELS = { wheels: 'Tyres', power: 'Power', body: 'Aero', chassis: 'Chassis', sensor: 'Sensor' };
export const SECTORS = ['straight', 'loose', 'technical'];

// pace: seconds gained (negative) or lost (positive) per lap in each sector,
// relative to a balanced reference car. wear: extra seconds per sector per lap of tyre age.
// traits drive race incidents: lowGrip tyres, lowDownforce aero, hot and sprint power units.
// These are authored game values tuned by tests/balance.test.js, not F1 data.
export const PARTS = {
  road: { id: 'road', slot: 'wheels', name: 'Slick tyres', cost: 10, pace: { straight: -.34, loose: .3, technical: -.08 }, wear: .02, traits: ['lowGrip'], description: 'Light and quick. Happiest on smooth ground.', trait: 'Built for tarmac', color: '#333c3d' },
  soft: { id: 'soft', slot: 'wheels', name: 'Soft tyres', cost: 16, pace: { straight: -.42, loose: .34, technical: -.16 }, wear: .03, traits: ['lowGrip'], description: 'The fastest compound on tarmac. Hates sand and wears fast.', trait: 'Qualifying pace', color: '#3a2f45' },
  medium: { id: 'medium', slot: 'wheels', name: 'Medium tyres', cost: 14, pace: { straight: -.15, loose: .05, technical: -.05 }, wear: .012, description: 'A middle compound. Never the best, rarely the worst.', trait: 'All-rounder', color: '#3b3f46' },
  offroad: { id: 'offroad', slot: 'wheels', name: 'Grooved tyres', cost: 18, pace: { straight: .05, loose: -.22, technical: 0 }, wear: .008, description: 'Deep tread keeps you moving on loose ground.', trait: 'Grip on sand + rock', color: '#364841' },
  tracks: { id: 'tracks', slot: 'wheels', name: 'Endurance tyres', cost: 24, pace: { straight: .14, loose: -.26, technical: -.06 }, wear: .002, launch: .5, description: 'A durable compound for grip through the long run.', trait: 'Long-run grip', color: '#454c44' },
  paddle: { id: 'paddle', slot: 'wheels', name: 'Sand paddles', cost: 22, pace: { straight: .24, loose: -.42, technical: .04 }, wear: .004, description: 'Paddle fins scoop through loose sand. Slow on tarmac.', trait: 'Sand specialist', color: '#4a3a2a' },
  hard: { id: 'hard', slot: 'wheels', name: 'Hard tyres', cost: 20, pace: { straight: .08, loose: 0, technical: .05 }, wear: .003, description: 'A tough compound that shrugs off grit and heat. Slow to warm up.', trait: 'Grit and heat', color: '#4b5058' },
  inter: { id: 'inter', slot: 'wheels', name: 'Intermediate tyres', cost: 18, pace: { straight: .1, loose: 0, technical: .04 }, wear: .02, description: 'Shallow tread for damp tarmac. Overheats when it is hot.', trait: 'Damp specialist', color: '#3d5a55' },
  wet: { id: 'wet', slot: 'wheels', name: 'Wet tyres', cost: 20, pace: { straight: .22, loose: 0, technical: .1 }, wear: .025, description: 'Deep tread clears standing water. Slow and fragile on a dry track.', trait: 'Rain specialist', color: '#2f5f8f' },
  solar: { id: 'solar', slot: 'power', name: 'Efficiency unit', cost: 12, pace: { straight: .22, loose: .04, technical: -.07 }, description: 'A lighter power unit. Less power, less weight.', trait: 'Lightweight choice', color: '#527a8c' },
  battery: { id: 'battery', slot: 'power', name: 'Twin-battery hybrid', cost: 16, pace: { straight: .1, loose: .02, technical: -.03 }, description: 'Two battery packs: light, cool-running and steady.', trait: 'Cool and steady', color: '#2f5f8f' },
  electric: { id: 'electric', slot: 'power', name: 'Balanced hybrid', cost: 20, pace: { straight: 0, loose: 0, technical: 0 }, description: 'A balanced power unit for consistent sector times.', trait: 'Balanced power', color: '#e99355' },
  sprint: { id: 'sprint', slot: 'power', name: 'Uncooled sprint package', cost: 22, pace: { straight: -.55, loose: -.1, technical: 0 }, traits: ['sprint'], description: 'Fast launch, inadequate brake cooling for a long race.', trait: 'Sprint pace · retirement risk', color: '#ff794f' },
  turbo: { id: 'turbo', slot: 'power', name: 'Turbo unit', cost: 26, pace: { straight: -.3, loose: -.04, technical: .14 }, description: 'Huge straight-line punch, with turbo lag out of slow corners.', trait: 'Straight-line punch', color: '#7a5a2f' },
  torque: { id: 'torque', slot: 'power', name: 'Attack power unit', cost: 28, pace: { straight: -.42, loose: -.06, technical: 0 }, traits: ['hot'], description: 'More output, compact cooling. Watch the heat.', trait: 'High power · heat risk', color: '#e85c36' },
  scout: { id: 'scout', slot: 'body', name: 'Low-drag aero', cost: 8, pace: { straight: -.34, loose: 0, technical: .26 }, traits: ['lowDownforce'], description: 'Minimal downforce. Fast, but less settled on kerbs.', trait: 'Save your credits', color: '#d9ad78' },
  alloy: { id: 'alloy', slot: 'body', name: 'Balanced aero', cost: 16, pace: { straight: 0, loose: 0, technical: 0 }, description: 'Balanced downforce and stability over the kerbs.', trait: 'Stable cornering', color: '#e7e4d6' },
  carbon: { id: 'carbon', slot: 'body', name: 'High-downforce aero', cost: 26, pace: { straight: .2, loose: -.04, technical: -.42 }, description: 'More cornering grip, with more drag on the straight.', trait: 'Cornering specialist', color: '#536963' },
  drs: { id: 'drs', slot: 'body', name: 'Active DRS wing', cost: 22, pace: { straight: -.1, loose: 0, technical: -.1 }, description: 'A wing that opens on the straight and closes for corners.', trait: 'All-rounder', color: '#2f6f7a' },
  floor: { id: 'floor', slot: 'body', name: 'Ground-effect floor', cost: 20, pace: { straight: -.04, loose: .16, technical: -.28 }, description: 'Sucks the car to smooth tarmac. Unsettled on loose ground.', trait: 'Corner grip from the floor', color: '#3c4a5a' },
  stiff: { id: 'stiff', slot: 'chassis', name: 'Stiff aluminium', cost: 8, pace: { straight: 0, loose: 0, technical: 0 }, description: 'Cheap and light, but stiff suspension rattles over bumps.', trait: 'Light and cheap', color: '#aab3bf' },
  sprung: { id: 'sprung', slot: 'chassis', name: 'Soft-sprung steel', cost: 14, pace: { straight: .1, loose: 0, technical: .04 }, description: 'Heavy, but soft springs soak up bumps.', trait: 'Bump soaker', color: '#6e7683' },
  titanium: { id: 'titanium', slot: 'chassis', name: 'Titanium adaptive', cost: 22, pace: { straight: .03, loose: 0, technical: -.02 }, description: 'Adaptive dampers and a strong, light frame.', trait: 'Adaptive ride', color: '#8fa0b6' },
  monocoque: { id: 'monocoque', slot: 'chassis', name: 'Carbon monocoque', cost: 26, pace: { straight: -.08, loose: 0, technical: -.06 }, description: 'The lightest, stiffest tub. Expensive.', trait: 'Lightest frame', color: '#20252e' },
  camera: { id: 'camera', slot: 'sensor', name: 'Field camera', cost: 4, description: 'Read the surface through visual observations.', trait: 'Visual clues', color: '#343e3b' },
  thermal: { id: 'thermal', slot: 'sensor', name: 'Thermal scanner', cost: 8, description: 'Explore heat and moisture on the course.', trait: 'Heat + moisture clues', color: '#df815a' },
  lidar: { id: 'lidar', slot: 'sensor', name: 'Lidar scanner', cost: 10, description: 'Laser points map the exact shape of the surface.', trait: 'Shape + texture clues', color: '#2f6f7a' },
  radar: { id: 'radar', slot: 'sensor', name: 'Ground radar', cost: 12, description: 'Look beneath the surface for structural clues.', trait: 'Surface structure clues', color: '#8b9a89' },
};
for (const [id, stats] of Object.entries(PART_STATS)) PARTS[id].stats = stats;

export const DEFAULT_BUILD = { wheels: 'road', power: 'electric', body: 'alloy', chassis: 'stiff', sensor: 'camera' };
export const RACE_LAPS = 8;
export const GRID_GAP = .12; // seconds of launch delay per grid slot
export const RACE_PLAYBACK_MS = 150000;
export const BOOST_CHARGES = 3;
export const BOOST_SECONDS = 6;
export const BOOST_GAIN = 0.18;
export const BOOST_COOLDOWN = 8;

const rival = (id, name, team, color, wheels, power, body, sensor = 'camera', chassis = 'stiff') => ({ id, name, team, color, build: { wheels, power, body, chassis, sensor } });
// A workshop-sized field: five named archetypes first, then a realistic spread of student builds.
export const DEMO_TEAMS = [
  rival('moss', 'Alex Chen', 'Moss Racing', '#36ddab', 'offroad', 'solar', 'alloy'),
  rival('orbit', 'Jordan Lee', 'Orbit GP', '#639aff', 'tracks', 'sprint', 'scout'),
  rival('sun', 'Sam Rivera', 'Sol Racing', '#ffd34e', 'road', 'solar', 'carbon', 'thermal'),
  rival('apex', 'Maya Patel', 'Apex Motorsport', '#be8aff', 'offroad', 'torque', 'scout'),
  rival('vector', 'Luca Rossi', 'Vector GP', '#ff953d', 'medium', 'electric', 'carbon'),
  rival('delta', 'Priya Shah', 'Delta Works', '#4fc3f7', 'offroad', 'solar', 'alloy'),
  rival('kite', 'Kenji Mori', 'Kite Racing', '#f06292', 'medium', 'torque', 'alloy'),
  rival('north', 'Zara Okafor', 'Northline', '#aed581', 'medium', 'electric', 'scout'),
  rival('blaze', 'Omar Haddad', 'Blaze GP', '#ff7043', 'road', 'torque', 'alloy'),
  rival('alpine', 'Lena Fischer', 'Alpine Lab', '#90caf9', 'offroad', 'turbo', 'scout', 'lidar'),
  rival('mesa', 'Diego Santos', 'Mesa Motors', '#ffb74d', 'road', 'electric', 'carbon'),
  rival('pixel', 'Ava Kim', 'Pixel Racing', '#ce93d8', 'medium', 'battery', 'drs', 'thermal'),
  rival('drift', 'Noah Brooks', 'Driftwood', '#80cbc4', 'soft', 'turbo', 'scout', 'radar'),
  rival('crest', 'Isla Novak', 'Crest GP', '#e6ee9c', 'paddle', 'battery', 'floor'),
  rival('volt', 'Mateo Cruz', 'Volt Union', '#fff176', 'offroad', 'sprint', 'alloy'),
  rival('reed', 'Hana Sato', 'Reedline', '#bcaaa4', 'soft', 'solar', 'floor'),
  rival('forge', 'Felix Wright', 'Forge Racing', '#ef9a9a', 'medium', 'torque', 'scout'),
  rival('lumen', 'Sofia Russo', 'Lumen GP', '#b39ddb', 'offroad', 'solar', 'carbon'),
  rival('tide', 'Ravi Menon', 'Tidewater', '#81d4fa', 'road', 'electric', 'carbon'),
];
// Per-track rival builds [wheels, power, body, chassis]; ids not listed keep their Dune Valley build.
// Per-track rival builds [wheels, power, body, chassis]; ids not listed keep their Dune Valley build.
export const RIVAL_BUILDS = {
  dune: {
    moss: ['hard', 'solar', 'alloy', 'titanium'], sun: ['tracks', 'solar', 'carbon', 'stiff'], apex: ['hard', 'turbo', 'alloy', 'sprung'],
    vector: ['tracks', 'electric', 'carbon', 'sprung'], delta: ['offroad', 'solar', 'alloy', 'titanium'], alpine: ['hard', 'turbo', 'scout', 'stiff'],
    mesa: ['hard', 'electric', 'carbon', 'stiff'], pixel: ['tracks', 'battery', 'drs', 'stiff'],
  },
  mountain: {
    moss: ['inter', 'electric', 'alloy', 'stiff'], orbit: ['wet', 'turbo', 'carbon', 'stiff'], sun: ['soft', 'battery', 'carbon', 'stiff'],
    apex: ['inter', 'torque', 'drs', 'stiff'], vector: ['medium', 'electric', 'carbon', 'stiff'], delta: ['offroad', 'solar', 'alloy', 'stiff'],
    kite: ['soft', 'torque', 'alloy', 'stiff'], north: ['road', 'electric', 'scout', 'stiff'], blaze: ['road', 'torque', 'alloy', 'stiff'],
    alpine: ['inter', 'turbo', 'carbon', 'stiff'], mesa: ['medium', 'electric', 'carbon', 'sprung'], pixel: ['inter', 'battery', 'drs', 'stiff'],
    drift: ['soft', 'turbo', 'scout', 'stiff'], crest: ['offroad', 'battery', 'floor', 'stiff'], volt: ['wet', 'electric', 'alloy', 'stiff'],
    reed: ['soft', 'solar', 'floor', 'stiff'], forge: ['medium', 'torque', 'scout', 'stiff'], lumen: ['offroad', 'solar', 'carbon', 'stiff'], tide: ['road', 'electric', 'carbon', 'stiff'],
  },
  quarry: {
    moss: ['tracks', 'solar', 'alloy', 'titanium'], orbit: ['hard', 'sprint', 'scout', 'stiff'], sun: ['hard', 'solar', 'carbon', 'sprung'],
    apex: ['hard', 'battery', 'alloy', 'sprung'], vector: ['tracks', 'solar', 'alloy', 'titanium'], delta: ['hard', 'solar', 'alloy', 'sprung'],
    kite: ['medium', 'electric', 'alloy', 'sprung'], north: ['medium', 'solar', 'alloy', 'sprung'], blaze: ['hard', 'electric', 'alloy', 'sprung'],
    alpine: ['hard', 'turbo', 'alloy', 'sprung'], mesa: ['hard', 'electric', 'drs', 'titanium'], pixel: ['tracks', 'battery', 'drs', 'sprung'],
    drift: ['soft', 'turbo', 'scout', 'stiff'], crest: ['paddle', 'battery', 'floor', 'stiff'], volt: ['offroad', 'sprint', 'alloy', 'stiff'],
    reed: ['soft', 'solar', 'floor', 'stiff'], forge: ['medium', 'torque', 'scout', 'stiff'], lumen: ['hard', 'solar', 'carbon', 'sprung'], tide: ['medium', 'electric', 'alloy', 'titanium'],
  },
};
export const rivalsFor = trackId => DEMO_TEAMS.map(team => {
  const override = RIVAL_BUILDS[trackId]?.[team.id];
  return override ? { ...team, build: { wheels: override[0], power: override[1], body: override[2], chassis: override[3], sensor: team.build.sensor } } : team;
});
export const driverCode = entry => entry.id === 'you' ? 'YOU' : entry.name.split(' ').at(-1).slice(0, 3).toUpperCase();
