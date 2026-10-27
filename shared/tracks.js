// Three tracks. Each section declares a condition, the stats it demands (weights sum to 1) and the
// baseline score ('required') a car needs to get through cleanly. Values are game values, tuned by
// tests/balance.test.js. `pace` weights how long the section takes; `sector` picks the part pace it uses.
const section = (id, name, label, kind, from, to, rest) => ({
  id, name, label, kind, from, to, pace: kind === 'straight' ? .72 : kind === 'sweep' ? 1 : 1.42,
  sector: kind === 'straight' ? 'straight' : 'technical', ...rest,
});

export const TRACKS = [
  {
    id: 'dune', number: '01', title: 'Dune Valley', subtitle: 'Sun and grit.', lesson: 'Classification', color: '#e6a475', icon: 'sun',
    description: 'A sun-baked course. Gritty gravel shreds soft tyres and the back straight bakes the power unit.',
    lapBase: 27,
    points: [[-14, .38, 9], [-5, .38, 9], [7, .38, 9], [14, .38, 8], [17, .38, 4], [15, .38, 0], [10, .38, -1], [5, .38, -1], [2, .38, -5], [5, .38, -9], [0, .38, -11], [-8, .38, -10], [-12, .38, -6], [-17, .38, -6], [-19, .38, -2], [-18, .38, 4]],
    sections: [
      section('start', 'Start / finish straight', 'POWER ZONE', 'straight', 0, .28, { condition: 'dry', demand: { topSpeed: 1 }, required: 40, incident: 'understeer',
        warning: 'Long straight. Top speed matters.', problem: 'Not enough top speed for the straight.', suggestion: 'Low-drag aero or a stronger power unit is quicker here.' }),
      section('hairpin', 'T1 · Gravel hairpin', 'BRAKE → TURN', 'corner', .28, .42, { condition: 'abrasive', demand: { dryGrip: .4, downforce: .3, abrasion: .3 }, required: 55, incident: 'tyreshred', crash: true,
        warning: 'Gritty gravel ahead. Soft tyres will shred.', problem: 'Grit chewed up the tyres in the hairpin.', suggestion: 'Hard or endurance tyres resist grit. Add downforce.' }),
      section('heatsoak', 'Heat-soak back straight', 'HEAT BUILD', 'straight', .42, .70, { condition: 'hot', demand: { cooling: .6, heatTol: .4 }, required: 45, incident: 'overheat', escalates: true,
        warning: 'The back straight bakes the car. Watch the temperatures.', problem: 'The power unit and brakes ran too hot.', suggestion: 'A cooler power unit and hard tyres cope with the heat.' }),
      section('chicane', 'T2–4 · Dust chicane', 'CHANGE DIRECTION', 'corner', .70, 1, { condition: 'abrasive', demand: { dryGrip: .4, downforce: .3, abrasion: .3 }, required: 58, incident: 'understeer',
        warning: 'Dust and grit through the chicane.', problem: 'The tyres could not hold the line through the grit.', suggestion: 'Downforce and a tough tyre keep the car on line.' }),
    ],
    landmarks: [{ at: .08, name: 'START', label: 'POWER STRAIGHT' }, { at: .35, name: 'T1', label: 'GRAVEL HAIRPIN' }, { at: .56, name: 'HEAT', label: 'HEAT-SOAK STRAIGHT' }, { at: .85, name: 'T2–4', label: 'DUST CHICANE' }],
    mystery: {
      section: 'hairpin', question: 'What is the surface in the gravel hairpin?', options: ['dry', 'abrasive', 'damp'], target: 'abrasive',
      clues: {
        camera: ['Gravel and grit are scattered over the racing line.', 'Old tyre rubber lies in shreds on the apex.', 'The surface looks dry, but rough and gritty.'],
        thermal: ['Surface temperature: 41°C. Hot, but not the problem here.', 'Moisture: 3%. Very dry.', 'Friction heat marks line the apex where tyres were torn.'],
        lidar: ['The surface is covered in sharp, uneven grains.', 'Grain size varies from dust to small stones.', 'The texture is rough and coarse, like sandpaper.'],
        radar: ['A thin gritty layer sits over firm tarmac.', 'The layer is only a few millimetres deep.', 'The base is solid. The problem is the top layer.'],
      },
    },
  },
  {
    id: 'mountain', number: '02', title: 'Mountain Pass', subtitle: 'Cold and wet.', lesson: 'Training', color: '#9caaa0', icon: 'mountain',
    description: 'A shaded climb, wet switchbacks and a waterfall straight. Warm-up and wet grip decide the day.',
    lapBase: 27,
    points: [[-16, .38, 8], [-6, .38, 10], [6, .38, 9], [15, .38, 6], [18, .38, 0], [14, .38, -4], [8, .38, -3], [4, .38, -7], [8, .38, -11], [0, .38, -12], [-7, .38, -9], [-9, .38, -4], [-14, .38, -3], [-19, .38, -6], [-20, .38, 0], [-19, .38, 5]],
    sections: [
      section('climb', 'Shaded climb', 'COLD TYRES', 'sweep', 0, .20, { condition: 'cold', demand: { warmup: .5, downforce: .5 }, required: 50, incident: 'coldslide',
        warning: 'Shaded and cold. The tyres will be slow to warm up.', problem: 'Cold tyres gave little grip on the climb.', suggestion: 'Soft tyres warm up fast. Downforce adds grip.' }),
      section('switchbacks', 'Switchback hairpins', 'WET PATCHES', 'corner', .20, .42, { condition: 'damp', demand: { wetGrip: .5, downforce: .5 }, required: 55, incident: 'understeer', crash: true,
        warning: 'Wet patches off the racing line.', problem: 'The car slid on the wet patches.', suggestion: 'Intermediate or grooved tyres and balanced aero.' }),
      section('waterfall', 'Waterfall straight', 'STANDING WATER', 'straight', .42, .62, { condition: 'rain', demand: { wetGrip: .6, topSpeed: .4 }, required: 55, incident: 'aquaplane', crash: true,
        warning: 'Standing water ahead. Aquaplaning risk.', problem: 'The tyres floated on the standing water.', suggestion: 'Wet tyres clear the water. Slicks aquaplane.' }),
      section('summit', 'Summit sweeper', 'HOLD THE LINE', 'sweep', .62, .82, { condition: 'dry', demand: { dryGrip: .5, downforce: .5 }, required: 60, incident: 'understeer',
        warning: 'Dry and fast. Wet tyres will squirm.', problem: 'Not enough dry grip through the sweeper.', suggestion: 'Medium or soft tyres with high downforce.' }),
      section('descent', 'Downhill braking zone', 'BRAKE EARLY', 'corner', .82, 1, { condition: 'cold', demand: { warmup: .5, cooling: .5 }, required: 55, incident: 'brakefade',
        warning: 'Cold tyres into a long braking zone.', problem: 'Cold tyres and hot brakes lost stopping power.', suggestion: 'Warm tyres and a well-cooled power unit.' }),
    ],
    landmarks: [{ at: .06, name: 'CLIMB', label: 'SHADED CLIMB' }, { at: .31, name: 'S1', label: 'SWITCHBACKS' }, { at: .52, name: 'WET', label: 'WATERFALL STRAIGHT' }, { at: .72, name: 'SUMMIT', label: 'SUMMIT SWEEPER' }, { at: .91, name: 'T5', label: 'BRAKING ZONE' }],
    mystery: {
      section: 'waterfall', question: 'What is the surface on the waterfall straight?', options: ['dry', 'rain', 'cold'], target: 'rain',
      clues: {
        camera: ['Water streams across the whole width of the track.', 'Spray hangs over the straight.', 'The kerbs and verges are dark and soaked.'],
        thermal: ['Surface temperature: 9°C. Cool.', 'Moisture: 96%. The surface is saturated.', 'Cold water has cooled the tarmac below the air temperature.'],
        lidar: ['The surface is smooth, with a thin shiny layer on top.', 'Ripples move across the layer as the scan repeats.', 'Small puddles fill the low spots along the line.'],
        radar: ['A layer of water sits above firm tarmac.', 'The water is several millimetres deep.', 'The base is solid. The standing water is the problem.'],
      },
    },
  },
  {
    id: 'quarry', number: '03', title: 'Quarry Ring', subtitle: 'Rough and hot.', lesson: 'Generalization', color: '#d4aa76', icon: 'flag',
    description: 'Kerbs, washboard ground and a furnace hairpin. Ride quality and cooling decide the day.',
    lapBase: 27,
    points: [[-15, .38, 9], [-4, .38, 10], [8, .38, 10], [16, .38, 7], [18, .38, 1], [13, .38, -3], [12, .38, -8], [6, .38, -11], [-2, .38, -9], [-4, .38, -4], [-9, .38, -2], [-14, .38, -5], [-19, .38, -4], [-20, .38, 1], [-19, .38, 6]],
    sections: [
      section('kerbs', 'Kerb chicane', 'RIDE THE KERBS', 'corner', 0, .18, { condition: 'bumpy', demand: { stability: .6, dryGrip: .4 }, required: 62, incident: 'contact', crash: true,
        warning: 'Raised kerbs ahead. The car will be shaken.', problem: 'The kerbs unsettled the car.', suggestion: 'Adaptive or soft suspension and a strong chassis.' }),
      section('washboard', 'Washboard straight', 'ROUGH GROUND', 'straight', .18, .42, { condition: 'bumpy', demand: { stability: .5, topSpeed: .5 }, required: 58, incident: 'bumpbreak', crash: true,
        warning: 'Washboard ground. Parts can shake loose.', problem: 'The rough ground shook the car and cost speed.', suggestion: 'Soft suspension or a titanium or carbon chassis.' }),
      section('furnace', 'Furnace hairpin', 'BRAKES HOT', 'corner', .42, .60, { condition: 'hot', demand: { cooling: .5, heatTol: .5 }, required: 58, incident: 'brakefade', escalates: true,
        warning: 'The brakes are glowing into the hairpin.', problem: 'The brakes and tyres overheated.', suggestion: 'An efficient power unit and hard tyres.' }),
      section('sweeps', 'Quarry sweeps', 'GRIT AND LOAD', 'sweep', .60, .84, { condition: 'abrasive', demand: { abrasion: .5, downforce: .5 }, required: 52, incident: 'tyreshred',
        warning: 'Gritty sweepers. Tyres wear fast.', problem: 'The tyres wore out through the sweepers.', suggestion: 'Hard or endurance tyres and downforce.' }),
      section('closing', 'Closing straight', 'POWER DOWN', 'straight', .84, 1, { condition: 'dry', demand: { topSpeed: 1 }, required: 45, incident: 'understeer',
        warning: 'Long dry straight to the flag.', problem: 'Not enough top speed.', suggestion: 'Low drag and a light chassis.' }),
    ],
    landmarks: [{ at: .06, name: 'KERBS', label: 'KERB CHICANE' }, { at: .30, name: 'WASH', label: 'WASHBOARD' }, { at: .51, name: 'HAIRPIN', label: 'FURNACE HAIRPIN' }, { at: .72, name: 'SWEEPS', label: 'QUARRY SWEEPS' }, { at: .92, name: 'FLAG', label: 'CLOSING STRAIGHT' }],
    mystery: {
      section: 'washboard', question: 'What is the ground like on the washboard straight?', options: ['dry', 'bumpy', 'hot'], target: 'bumpy',
      clues: {
        camera: ['The surface is ribbed with regular ridges.', 'Dust jumps off the ridges as a marshal vehicle crosses.', 'The kerbs are chipped and uneven.'],
        thermal: ['Surface temperature: 33°C. Warm, nothing unusual.', 'Moisture: 4%. Dry.', 'Temperature alone does not explain the rough ground.'],
        lidar: ['Ridges repeat every half metre, a few centimetres high.', 'The pattern is regular and fixed: it is not moving.', 'The surface is hard and rigid, but very uneven.'],
        radar: ['A solid rock base lies under a thin layer.', 'The base itself is rippled and uneven.', 'Nothing loose below the surface: the shape is the problem.'],
      },
    },
  },
];

export const DEFAULT_TRACK_ID = 'dune';
export const DEFAULT_TRACK = TRACKS[0];
export const trackById = id => TRACKS.find(track => track.id === id) ?? DEFAULT_TRACK;

const cache = new WeakMap();
// Each section's base time (seconds, before part pace) and the share of its sector's pace it carries.
export function trackSegments(track) {
  if (cache.has(track)) return cache.get(track);
  const weight = item => (item.to - item.from) * item.pace;
  const total = track.sections.reduce((sum, item) => sum + weight(item), 0);
  const bySector = {};
  for (const item of track.sections) bySector[item.sector] = (bySector[item.sector] ?? 0) + weight(item);
  const segments = track.sections.map(item => ({ ...item, base: Math.round(track.lapBase * weight(item) / total * 100) / 100, share: weight(item) / bySector[item.sector] }));
  cache.set(track, segments);
  return segments;
}

export function trackZone(track, distance) {
  const progress = ((distance % 1) + 1) % 1;
  return track.sections.find(item => progress >= item.from && progress < item.to) ?? track.sections[0];
}
