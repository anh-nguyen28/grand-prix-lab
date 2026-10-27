import { BUDGET, PARTS, SLOTS } from './content.js';
import { buildStats, sectorPace } from './simulation.js';
// Educational setup model. Ratings and event timings are game values, not F1 specifications.
export const ENGINEERING = {
  road: { tagline: 'Speed on a clean surface', benefits: 'Low rolling resistance and a light rotating assembly keep the car quick on smooth tarmac.', tradeoff: 'Less purchase on the experimental loose-surface sector. Grip drops as the stint gets longer.', watch: 'Wheelspin and a small dust trail on loose ground; a longer slide late in the race.', ratings: { grip: 42, endurance: 40 }, demo: 'wheelspin' },
  soft: { tagline: 'Peak grip on tarmac, gone on sand', benefits: 'The softest compound: the quickest tyre on the straight and through the corners.', tradeoff: 'Spins on the loose stretch and wears fastest of all. Like slicks, it is a low-grip tyre on sand.', watch: 'A rapid first lap, then wheelspin in the mystery sector and fading grip late on.', ratings: { grip: 30, endurance: 25 }, demo: 'wheelspin' },
  paddle: { tagline: 'Built for the dunes', benefits: 'Paddle fins scoop through loose sand: the most grip on the mystery stretch, and they barely wear.', tradeoff: 'The fins drag on tarmac, so the straight and corners are slower.', watch: 'A planted car through the sand, but rivals pull away on the straight.', ratings: { grip: 96, endurance: 92 }, demo: 'wheelspin' },
  medium: { tagline: 'A little of everything', benefits: 'A middle compound: quicker than grooved tyres on tarmac and calmer than slicks on loose ground.', tradeoff: 'It never leads any single sector. It wears faster than the grooved and endurance tyres.', watch: 'No dramatic slides, and no standout sector either.', ratings: { grip: 60, endurance: 62 }, demo: 'wheelspin' },
  offroad: { tagline: 'Find grip when the surface changes', benefits: 'A treaded experimental tyre trades some straight-line speed for grip on the loose section.', tradeoff: 'More weight and rolling resistance than slicks. This is a fictional mixed-surface tyre, not a modern F1 dry compound.', watch: 'A calmer line through the loose sector, with slightly less speed on the straight.', ratings: { grip: 78, endurance: 72 }, demo: 'wheelspin' },
  tracks: { tagline: 'Keep the grip for the final laps', benefits: 'The most durable experimental tyre package holds its pace over a long stint.', tradeoff: 'Heavier than the other tyres, so it gives away early acceleration.', watch: 'A slower launch but more consistent late-race sectors.', ratings: { grip: 90, endurance: 94 }, demo: 'wheelspin' },
  electric: { tagline: 'Power with room to breathe', benefits: 'A balanced hybrid-and-cooling package. Medium openings remove heat without a large drag penalty.', tradeoff: 'Less peak output than the attack package.', watch: 'Stable temperatures and consistent pace over eight laps.', ratings: { output: 70, cooling: 78 }, demo: 'overheat' },
  torque: { tagline: 'More power. Less thermal margin.', benefits: 'High output and compact cooling give stronger acceleration.', tradeoff: 'The compact cooling openings struggle late in a long, hot stint. Extra pace comes with one overheating penalty.', watch: 'Strong straights, then a heat warning, cooling vapour and reduced power late in the race. With low-drag aero, heavy braking also exposes brake fade.', ratings: { output: 95, cooling: 35 }, demo: 'overheat' },
  sprint: { tagline: 'Built for a sprint. Fails over race distance.', benefits: 'A high-output package with almost closed cooling ducts gives the strongest initial acceleration.', tradeoff: 'Repeated braking overwhelms its restricted cooling. On this eight-lap course, heat escalates into brake failure and retirement.', watch: 'A fast start, then overheating, smoke, a brake fire and a stopped car. A retired car earns no race points.', ratings: { output: 100, cooling: 10 }, demo: 'fire' },
  battery: { tagline: 'Light, cool and steady', benefits: 'Two battery packs deliver smooth power with plenty of cooling margin.', tradeoff: 'Less punch than the balanced hybrid on the straight.', watch: 'Glowing battery packs on the sidepods and calm temperatures all race.', ratings: { output: 58, cooling: 88 }, demo: 'overheat' },
  turbo: { tagline: 'Punch on the straight, lag in the corners', benefits: 'A turbocharger adds strong straight-line output without the attack unit\'s heat problem.', tradeoff: 'Turbo lag costs time accelerating out of slow corners, and it is expensive.', watch: 'A tall air intake behind the driver. Quick on the straight, slower out of the hairpin.', ratings: { output: 88, cooling: 62 }, demo: 'overheat' },
  solar: { tagline: 'Give heat somewhere to go', benefits: 'A lower-output hybrid with larger cooling outlets. Light and thermally conservative.', tradeoff: 'Less acceleration and more cooling drag than the attack package.', watch: 'A steady late-race pace with a low overheating risk.', ratings: { output: 48, cooling: 95 }, demo: 'overheat' },
  alloy: { tagline: 'A stable all-round platform', benefits: 'Balanced wing loading gives predictable cornering and straight-line performance.', tradeoff: 'Neither the fastest straight-line package nor the strongest cornering package.', watch: 'A settled car through the technical sector.', ratings: { cornering: 75, straight: 70 }, demo: 'understeer' },
  carbon: { tagline: 'Carry speed through the corners', benefits: 'A larger wing package and light structure help the car stay planted through the technical sector.', tradeoff: 'More aerodynamic drag slows the car on the straight. It also uses more of your budget.', watch: 'Tighter cornering lines and fewer handling incidents.', ratings: { cornering: 95, straight: 48 }, demo: 'understeer' },
  drs: { tagline: 'Open on the straight, closed in the corners', benefits: 'An active flap cuts drag on the straight and adds downforce in corners.', tradeoff: 'Good everywhere, best nowhere, and it costs more than the balanced wing.', watch: 'A two-part wing with a raised flap and bright endplates.', ratings: { cornering: 78, straight: 80 }, demo: 'understeer' },
  floor: { tagline: 'Grip from underneath', benefits: 'Shaped tunnels under the car suck it to smooth tarmac: huge cornering grip with little drag.', tradeoff: 'On loose ground the floor loses its seal, so the mystery stretch is slower.', watch: 'Skirts along the floor and a rear diffuser. Glued to the corners, unsettled on sand.', ratings: { cornering: 90, straight: 76 }, demo: 'understeer' },
  scout: { tagline: 'Win the straight. Respect the corner.', benefits: 'Small wings reduce drag and save credits.', tradeoff: 'Less aerodynamic grip. The front can run wide. On slick tyres it can also strike a kerb.', watch: 'Understeer and a wide line. With slick tyres, sparks and a time loss when the car catches the kerb.', ratings: { cornering: 35, straight: 95 }, demo: 'understeer' },
  camera: { tagline: 'Start with what you can see', benefits: 'Three visual observations help you identify the mystery surface.', tradeoff: 'No temperature or subsurface measurements. It still provides enough evidence to solve the round.', watch: 'The first scan locks your sensor. Sensors do not prevent mechanical failures.', ratings: null },
  thermal: { tagline: 'Read heat and moisture', benefits: 'Three observations reveal temperature and moisture patterns.', tradeoff: 'Costs 4 credits more than the camera, credits your car could use. Temperature alone cannot identify a surface.', watch: 'Combine all three clues before making your prediction. It does not cool the car.', ratings: null },
  lidar: { tagline: 'Map the shape of the ground', benefits: 'Three laser scans describe the shape and movement of the surface.', tradeoff: 'Costs 6 credits more than the camera. A different route to the same answer, not a racing advantage.', watch: 'A dome on a mast above the driver. It does not steer the car.', ratings: null },
  radar: { tagline: 'Look below the surface', benefits: 'Three observations describe the structure under the top layer.', tradeoff: 'The most expensive sensor: 8 credits more than the camera. It offers a different route to the same answer, not a racing advantage.', watch: 'Use the evidence before testing. It does not steer the car for you.', ratings: null },
};

export const INCIDENTS = {
  wheelspin: { title: 'Wheelspin', label: 'TRACTION LOSS', cause: 'The tyres cannot transfer all of the available force into this loose surface.', remedy: 'Try a tyre with more loose-surface grip.', effect: 'dust', loss: 1.8, phase: .47, warning: 'Loose surface ahead. Expect wheelspin.' },
  understeer: { title: 'Running wide', label: 'UNDERSTEER', cause: 'The front tyres do not have enough grip to follow the requested cornering line.', remedy: 'Use a more stable aero package, or improve grip.', effect: 'slide', loss: 2.5, phase: .78, warning: 'Corner coming. The front will want to run wide.' },
  overheat: { title: 'Power unit overheating', label: 'TEMPERATURE HIGH', cause: 'The high-output package generates more heat than its compact cooling can remove.', remedy: 'Trade some output for a package with more cooling margin.', effect: 'steam', loss: 3.2, phase: .22, warning: 'Temperatures climbing. Power loss is coming.' },
  brakefade: { title: 'Braking performance lost', label: 'BRAKE FADE', cause: 'Repeated braking and restricted cooling reduce braking performance.', remedy: 'Use the balanced cooling package and a more stable aero setup.', effect: 'brake', loss: 2.8, phase: .76, warning: 'Brakes are very hot into this corner.' },
  contact: { title: 'Kerb strike', label: 'CONTACT', cause: 'An unsettled low-downforce car runs wide and strikes the raised outside kerb.', remedy: 'Add cornering stability. Contact depends on the line and the obstacle, not simply the car being fast.', effect: 'sparks', loss: 4.2, phase: .82, warning: 'Careful on the exit. That kerb is close.' },
  fire: { title: 'Blocked brake duct', label: 'BRAKE FIRE', cause: 'Restricted brake airflow cannot remove repeated-braking heat. Smoke builds into a brake fire and the car must stop.', remedy: 'Use a package with enough brake cooling for the full race distance. Heat must have somewhere to go.', effect: 'fire', loss: 8, phase: .72, warning: 'Smoke from the brakes. The car cannot last.' },
};

export function engineeringStats(build) {
  return { cornering: ENGINEERING[build.body].ratings.cornering, cooling: ENGINEERING[build.power].ratings.cooling, endurance: ENGINEERING[build.wheels].ratings.endurance };
}
const clamp = value => Math.round(Math.max(5, Math.min(100, value)));
// The spec sheet is read directly from the same pace data that times the race.
export function specSheet(build) {
  const stats = engineeringStats(build);
  return [
    { id: 'straight', label: 'Top speed', value: clamp(50 - sectorPace(build, 'straight') * 45) },
    { id: 'technical', label: 'Cornering', value: clamp(50 - sectorPace(build, 'technical') * 90) },
    { id: 'loose', label: 'Loose grip', value: clamp(50 - sectorPace(build, 'loose') * 120) },
    { id: 'cooling', label: 'Cooling', value: stats.cooling },
    { id: 'endurance', label: 'Tyre life', value: stats.endurance },
  ];
}
// Incidents follow part traits, so new parts join the system by declaring a trait.
const has = (build, trait) => SLOTS.some(slot => PARTS[build[slot]].traits?.includes(trait));
export function setupRisks(build) {
  const risks = [];
  if (has(build, 'lowGrip')) risks.push({ type: 'wheelspin', text: 'Loose-surface grip', detail: 'Expect a slide in the mystery sector and more wear late in the stint.' });
  if (has(build, 'lowDownforce')) risks.push({ type: 'understeer', text: 'Runs wide in corners', detail: has(build, 'lowGrip') ? 'Low downforce on low-grip tyres: understeer, then a kerb strike.' : 'Low downforce exposes the car to understeer in the corners.' });
  if (has(build, 'sprint')) risks.push({type:'fire',text:'Cooling cannot last this race',detail:'The sprint package overheats, develops a brake fire and retires on lap 5. Choose balanced cooling to finish.'});
  if (has(build, 'hot')) risks.push({ type: 'overheat', text: 'Limited cooling margin', detail: 'The attack package loses power once, late in the long stint.' });
  if (has(build, 'hot') && has(build, 'lowDownforce')) risks.push({ type: 'brakefade', text: 'Braking heat', detail: 'High straight-line pace plus compact cooling exposes brake fade.' });
  return risks;
}

// Events are attached to lap distance. Boosting changes when a car reaches them,
// but never moves a corner incident onto an unrelated section of track.
export function buildIncidents(build) {
  const events = [];
  const add = (type, lap, loss) => events.push({ ...INCIDENTS[type], type, lap, loss: loss ?? INCIDENTS[type].loss, distance: lap - 1 + INCIDENTS[type].phase });
  if (has(build, 'lowGrip')) { add('wheelspin', 1, 1.2); add('wheelspin', 6, 1.8); }
  if (has(build, 'lowDownforce')) { add('understeer', 2, 1.5); if (has(build, 'lowGrip')) add('contact', 5, 3); }
  if (has(build, 'sprint')) { add('overheat',2); add('brakefade',3); add('fire',5,9); }
  if (has(build, 'hot')) add('overheat', 6, 2.2);
  if (has(build, 'hot') && has(build, 'lowDownforce')) add('brakefade', 3, 2.2);
  return events.sort((a, b) => a.distance - b.distance);
}

// Every incident this setup will meet in the race, grouped so practice can warn about it.
export function raceRiskForecast(build) {
  const groups = new Map();
  for (const event of buildIncidents(build)) {
    const group = groups.get(event.type) || { type: event.type, title: event.title, laps: [], loss: 0, retirement: false };
    group.laps.push(event.lap); group.loss = Math.round((group.loss + (event.type === 'fire' ? 0 : event.loss)) * 10) / 10; group.retirement ||= event.type === 'fire';
    groups.set(event.type, group);
  }
  return [...groups.values()];
}

// Single-part swaps that remove an incident type and still fit the budget.
export function incidentFixes(build, type) {
  return SLOTS.flatMap(slot => Object.values(PARTS).filter(part => part.slot === slot && part.id !== build[slot]).filter(part => {
    const next = { ...build, [slot]: part.id };
    return buildStats(next).cost <= BUDGET && !buildIncidents(next).some(event => event.type === type);
  }).map(part => ({ slot, id: part.id, name: part.name, cost: part.cost - PARTS[build[slot]].cost })));
}
