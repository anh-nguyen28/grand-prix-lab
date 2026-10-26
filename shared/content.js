export const BUDGET = 100;
export const PRACTICE_RUNS = 2;
export const MAX_CHANGED_SLOTS = 2;
export const SLOTS = ['wheels', 'power', 'body', 'sensor'];
export const SLOT_LABELS = { wheels: 'Tyres', power: 'Power', body: 'Aero', sensor: 'Sensor' };

export const PARTS = {
  road: { id: 'road', slot: 'wheels', name: 'Slick tyres', cost: 12, weight: 2, description: 'Light and quick. Happiest on smooth ground.', trait: 'Built for tarmac', fit: { road: 3, sand: -2, rock: -1 }, color: '#333c3d' },
  offroad: { id: 'offroad', slot: 'wheels', name: 'Grooved tyres', cost: 22, weight: 3, description: 'Deep tread keeps you moving on loose ground.', trait: 'Grip on sand + rock', fit: { road: 1, sand: 3, rock: 2 }, color: '#364841' },
  tracks: { id: 'tracks', slot: 'wheels', name: 'Endurance tyres', cost: 28, weight: 5, description: 'A durable compound for grip through the long run.', trait: 'Long-run grip', fit: { road: 0, sand: 4, rock: 4 }, color: '#454c44' },
  electric: { id: 'electric', slot: 'power', name: 'Balanced hybrid', cost: 24, weight: 2, power: 24, description: 'A balanced power unit for consistent sector times.', trait: 'Balanced power', color: '#e99355' },
  torque: { id: 'torque', slot: 'power', name: 'Attack power unit', cost: 34, weight: 3, power: 32, description: 'More output, compact cooling. Watch the heat.', trait: 'High power · heat risk', color: '#e85c36' },
  sprint: { id: 'sprint', slot: 'power', name: 'Uncooled sprint package', cost: 28, weight: 2, power: 38, description: 'Fast launch, inadequate brake cooling for a long race.', trait: 'Sprint pace · retirement risk', color: '#ff794f' },
  solar: { id: 'solar', slot: 'power', name: 'Efficiency unit', cost: 16, weight: 1, power: 18, description: 'A lighter power unit. Less power, less weight.', trait: 'Lightweight choice', color: '#527a8c' },
  alloy: { id: 'alloy', slot: 'body', name: 'Balanced aero', cost: 18, weight: 3, protection: 2, description: 'Balanced downforce and stability over the kerbs.', trait: 'Stable cornering', color: '#e7e4d6' },
  carbon: { id: 'carbon', slot: 'body', name: 'High-downforce aero', cost: 30, weight: 1, protection: 3, description: 'More cornering grip, with more drag on the straight.', trait: 'Cornering specialist', color: '#536963' },
  scout: { id: 'scout', slot: 'body', name: 'Low-drag aero', cost: 10, weight: 2, protection: 0, description: 'Minimal downforce. Fast, but less settled on kerbs.', trait: 'Save your credits', color: '#d9ad78' },
  camera: { id: 'camera', slot: 'sensor', name: 'Field camera', cost: 8, weight: 0, description: 'Read the surface through visual observations.', trait: 'Visual clues', color: '#343e3b' },
  thermal: { id: 'thermal', slot: 'sensor', name: 'Thermal scanner', cost: 12, weight: 0, description: 'Explore heat and moisture on the course.', trait: 'Heat + moisture clues', color: '#df815a' },
  radar: { id: 'radar', slot: 'sensor', name: 'Ground radar', cost: 16, weight: 0, description: 'Look beneath the surface for structural clues.', trait: 'Surface structure clues', color: '#8b9a89' },
};

export const DEFAULT_BUILD = { wheels: 'road', power: 'electric', body: 'alloy', sensor: 'camera' };
export const COURSE = {
  id: 'dune', title: 'Dune Valley', number: '01', subtitle: 'A little evidence goes a long way.',
  description: 'A sun-baked test course with one unknown stretch. Read the clues, set up your car, and find a way through.',
  target: 'sand',
  segments: [
    { id: 'start', name: 'Start / finish straight', terrain: 'road', length: 65, slope: 0 },
    { id: 'mystery', name: 'Mystery stretch', terrain: 'sand', length: 90, slope: 0 },
    { id: 'climb', name: 'Technical sector', terrain: 'rock', length: 45, slope: 1 },
  ],
  clues: {
    camera: ['Loose grains collect around the track markers.', 'The surface shifts under even a light wheel.', 'No plants, standing water, or solid pavement in this stretch.'],
    thermal: ['Surface temperature: 38°C. Warm, but temperature alone is not enough.', 'Moisture: 2%. The surface is very dry.', 'The dry, loose particles heat much faster than the nearby rock.'],
    radar: ['The top layer is loose and 18 cm deep.', 'The surface yields under pressure instead of cracking.', 'A granular layer sits above a firm rock base.'],
  },
};
export const SEASON = [
  { number: '01', title: 'Dune Valley', terrain: 'Sand · road · rock', lesson: 'Classification', color: '#e6a475', icon: 'sun', ready: true, summary: 'Use sensor clues to identify an unknown surface.' },
  { number: '02', title: 'Mountain Pass', terrain: 'Climbs · tight turns', lesson: 'Training', color: '#9caaa0', icon: 'mountain', summary: 'Use feedback from each run to improve your build.' },
  { number: '03', title: 'Frozen Lake', terrain: 'Ice · changing grip', lesson: 'Generalization', color: '#adc8cf', icon: 'snow', summary: 'Discover whether a specialist can handle an unfamiliar course.' },
  { number: '04', title: 'Night City', terrain: 'Tarmac · low light', lesson: 'Data coverage', color: '#999ab0', icon: 'moon', summary: 'Investigate which conditions your practice data left out.' },
  { number: '05', title: 'Jungle Rally', terrain: 'Mud · water · rock', lesson: 'Trusting AI', color: '#9eaf82', icon: 'leaf', summary: 'Weigh your engineer’s advice against the evidence.' },
  { number: '06', title: 'Neural Ring', terrain: 'The grand final', lesson: 'Reward design', color: '#d4aa76', icon: 'flag', summary: 'Teach a driver what to aim for, then see what it actually does.' },
];

export const RACE_LAPS = 8;
export const RACE_PLAYBACK_MS = 240000;
export const BOOST_CHARGES = 3;
export const BOOST_SECONDS = 6;
export const BOOST_GAIN = 0.18;
export const BOOST_COOLDOWN = 8;

export const DEMO_TEAMS = [
  { id: 'moss', name: 'Alex Chen', team: 'Moss Racing', color: '#36ddab', build: { wheels: 'offroad', power: 'electric', body: 'alloy', sensor: 'camera' } },
  { id: 'orbit', name: 'Jordan Lee', team: 'Orbit GP', color: '#639aff', build: { wheels: 'tracks', power: 'sprint', body: 'scout', sensor: 'camera' } },
  { id: 'sun', name: 'Sam Rivera', team: 'Sol Racing', color: '#ffd34e', build: { wheels: 'road', power: 'solar', body: 'carbon', sensor: 'thermal' } },
  { id: 'apex', name: 'Maya Patel', team: 'Apex Motorsport', color: '#be8aff', build: { wheels: 'offroad', power: 'torque', body: 'alloy', sensor: 'camera' } },
  { id: 'vector', name: 'Luca Rossi', team: 'Vector GP', color: '#ff953d', build: { wheels: 'offroad', power: 'solar', body: 'carbon', sensor: 'camera' } },
];
