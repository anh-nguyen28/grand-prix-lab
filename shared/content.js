export const BUDGET = 75;
export const PRACTICE_RUNS = 2;
export const MAX_CHANGED_SLOTS = 2;
export const SLOTS = ['wheels', 'power', 'body', 'sensor'];
export const SLOT_LABELS = { wheels: 'Tyres', power: 'Power', body: 'Aero', sensor: 'Sensor' };
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
  camera: { id: 'camera', slot: 'sensor', name: 'Field camera', cost: 4, description: 'Read the surface through visual observations.', trait: 'Visual clues', color: '#343e3b' },
  thermal: { id: 'thermal', slot: 'sensor', name: 'Thermal scanner', cost: 8, description: 'Explore heat and moisture on the course.', trait: 'Heat + moisture clues', color: '#df815a' },
  lidar: { id: 'lidar', slot: 'sensor', name: 'Lidar scanner', cost: 10, description: 'Laser points map the exact shape of the surface.', trait: 'Shape + texture clues', color: '#2f6f7a' },
  radar: { id: 'radar', slot: 'sensor', name: 'Ground radar', cost: 12, description: 'Look beneath the surface for structural clues.', trait: 'Surface structure clues', color: '#8b9a89' },
};

export const DEFAULT_BUILD = { wheels: 'road', power: 'electric', body: 'alloy', sensor: 'camera' };
export const COURSE = {
  id: 'dune', title: 'Dune Valley', number: '01', subtitle: 'A little evidence goes a long way.',
  description: 'A sun-baked test course with one unknown stretch. Read the clues, set up your car, and find a way through.',
  target: 'sand',
  segments: [
    { id: 'start', name: 'Start / finish straight', terrain: 'road', sector: 'straight', base: 8 },
    { id: 'mystery', name: 'Mystery stretch', terrain: 'sand', sector: 'loose', base: 10 },
    { id: 'climb', name: 'Technical sector', terrain: 'rock', sector: 'technical', base: 9 },
  ],
  clues: {
    camera: ['Loose grains collect around the track markers.', 'The surface shifts under even a light wheel.', 'No plants, standing water, or solid pavement in this stretch.'],
    thermal: ['Surface temperature: 38°C. Warm, but temperature alone is not enough.', 'Moisture: 2%. The surface is very dry.', 'The dry, loose particles heat much faster than the nearby rock.'],
    lidar: ['The surface forms small ripples, a few centimetres high.', 'The ripples shift between scans: the surface is moving.', 'The grains are fine and evenly sized, like a dune.'],
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
export const GRID_GAP = .12; // seconds of launch delay per grid slot
export const RACE_PLAYBACK_MS = 150000;
export const BOOST_CHARGES = 3;
export const BOOST_SECONDS = 6;
export const BOOST_GAIN = 0.18;
export const BOOST_COOLDOWN = 8;

const rival = (id, name, team, color, wheels, power, body, sensor = 'camera') => ({ id, name, team, color, build: { wheels, power, body, sensor } });
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
export const driverCode = entry => entry.id === 'you' ? 'YOU' : entry.name.split(' ').at(-1).slice(0, 3).toUpperCase();

// The showroom livery is cosmetic only: it never changes how the car races.
export const LIVERY_PAINTS = [
  { name: 'Grid red', color: '#ef3038' }, { name: 'Papaya', color: '#ff8a1f' }, { name: 'Sunburst', color: '#ffcc33' },
  { name: 'Racing green', color: '#13744f' }, { name: 'Mint', color: '#3fe0b0' }, { name: 'Electric blue', color: '#2f6bff' },
  { name: 'Ice', color: '#9fd6ff' }, { name: 'Violet', color: '#8a4dff' }, { name: 'Hot pink', color: '#ff4fa3' },
  { name: 'Silver arrow', color: '#c3cad4' }, { name: 'Stealth', color: '#23272f' }, { name: 'Pearl', color: '#f4f2ec' },
];
export const LIVERY_ACCENTS = [
  { name: 'White', color: '#f2f5fb' }, { name: 'Carbon', color: '#151921' }, { name: 'Gold', color: '#e8b54a' },
  { name: 'Cyan', color: '#35e0ff' }, { name: 'Lime', color: '#b6f23a' }, { name: 'Red', color: '#ef3038' },
];
export const LIVERY_HELMETS = [
  { name: 'Yellow', color: '#f2d977' }, { name: 'White', color: '#f2f5fb' }, { name: 'Black', color: '#1b1f27' },
  { name: 'Orange', color: '#ff8a1f' }, { name: 'Blue', color: '#2f6bff' }, { name: 'Pink', color: '#ff4fa3' },
];
export const LIVERY_FINISHES = {
  gloss: { name: 'Gloss', roughness: .25, metalness: .25 },
  matte: { name: 'Matte', roughness: .8, metalness: 0 },
  metallic: { name: 'Metallic', roughness: .28, metalness: .8 },
};
export const LIVERY_PATTERNS = {
  classic: { name: 'Pinstripe', description: 'Thin accent lines along the sidepods.' },
  racing: { name: 'Twin stripe', description: 'Two accent stripes from nose to engine cover.' },
  split: { name: 'Two-tone', description: 'Accent-coloured sidepods and wing endplates.' },
};
export const DEFAULT_LIVERY = { paint: '#ef3038', accent: '#f2f5fb', helmet: '#f2d977', finish: 'gloss', pattern: 'classic', number: 7 };

const HEX = /^#[0-9a-f]{6}$/i;
export function cleanLivery(livery = {}) {
  const color = (value, fallback) => HEX.test(value ?? '') ? value.toLowerCase() : fallback;
  const number = Math.round(Number(livery.number));
  return {
    paint: color(livery.paint, DEFAULT_LIVERY.paint), accent: color(livery.accent, DEFAULT_LIVERY.accent), helmet: color(livery.helmet, DEFAULT_LIVERY.helmet),
    finish: LIVERY_FINISHES[livery.finish] ? livery.finish : DEFAULT_LIVERY.finish,
    pattern: LIVERY_PATTERNS[livery.pattern] ? livery.pattern : DEFAULT_LIVERY.pattern,
    number: number >= 1 && number <= 99 ? number : DEFAULT_LIVERY.number,
  };
}
export const carNumber = livery => String(cleanLivery(livery).number).padStart(2, '0');

// Player teams: the real F1 grid. Picking one loads its team colours, which the player can still change.
// Logos are not bundled: drop an image the workshop may use at public/team-logos/<id>.svg (or .png);
// until then each team shows an original monogram badge in its colours.
const team = (name, code, base, paint, accent, helmet, finish = 'gloss', pattern = 'classic') => ({ name, code, base, livery: { paint, accent, helmet, finish, pattern } });
export const PLAYER_TEAMS = {
  mclaren: team('McLaren', 'MCL', 'Woking, UK', '#ff8000', '#151921', '#ff8000', 'gloss', 'split'),
  ferrari: team('Ferrari', 'FER', 'Maranello, Italy', '#dc0000', '#ffd400', '#ffd400'),
  redbull: team('Red Bull Racing', 'RBR', 'Milton Keynes, UK', '#1e2a5a', '#ef3038', '#ffcc33', 'matte', 'racing'),
  mercedes: team('Mercedes', 'MER', 'Brackley, UK', '#c3cad4', '#00d2be', '#1b1f27', 'metallic', 'split'),
  astonmartin: team('Aston Martin', 'AMR', 'Silverstone, UK', '#00594f', '#cedc00', '#00594f', 'metallic'),
  alpine: team('Alpine', 'ALP', 'Enstone, UK', '#0090ff', '#ff87bc', '#0090ff', 'gloss', 'split'),
  williams: team('Williams', 'WIL', 'Grove, UK', '#005aff', '#f2f5fb', '#00a0de', 'gloss', 'racing'),
  racingbulls: team('Racing Bulls', 'RB', 'Faenza, Italy', '#f4f2ec', '#2f4bff', '#2f4bff', 'gloss', 'racing'),
  haas: team('Haas', 'HAA', 'Kannapolis, USA', '#f4f2ec', '#151921', '#d0021b', 'gloss', 'split'),
  audi: team('Audi', 'AUD', 'Hinwil, Switzerland', '#9aa0a6', '#e1001a', '#1b1f27', 'metallic', 'racing'),
  cadillac: team('Cadillac', 'CAD', 'Indiana, USA', '#1b1f27', '#f2f5fb', '#f2f5fb', 'matte', 'racing'),
};
export const DEFAULT_TEAM = { id: 'custom', name: 'Privateer Racing' };
export function cleanTeam(team = {}) {
  if (PLAYER_TEAMS[team.id]) return { id: team.id, name: PLAYER_TEAMS[team.id].name };
  const name = String(team.name ?? '').trim().slice(0, 24);
  return team.id === 'custom' && name ? { id: 'custom', name } : { ...DEFAULT_TEAM };
}
export const teamCode = team => PLAYER_TEAMS[team.id]?.code ?? (team.name.match(/\b\w/g) || ['P']).slice(0, 3).join('').toUpperCase();
