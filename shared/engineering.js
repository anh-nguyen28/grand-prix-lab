// Educational setup model. Ratings and event timings are game values, not F1 specifications.
export const ENGINEERING = {
  road: { tagline: 'Speed on a clean surface', benefits: 'Low rolling resistance and a light rotating assembly keep the car quick on smooth tarmac.', tradeoff: 'Less purchase on the experimental loose-surface sector. Grip drops as the stint gets longer.', watch: 'Wheelspin and a small dust trail on loose ground; a longer slide late in the race.', ratings: { grip: 42, endurance: 40 }, demo: 'wheelspin' },
  offroad: { tagline: 'Find grip when the surface changes', benefits: 'A treaded experimental tyre trades some straight-line speed for grip on the loose section.', tradeoff: 'More weight and rolling resistance than slicks. This is a fictional mixed-surface tyre, not a modern F1 dry compound.', watch: 'A calmer line through the loose sector, with slightly less speed on the straight.', ratings: { grip: 78, endurance: 72 }, demo: 'wheelspin' },
  tracks: { tagline: 'Keep the grip for the final laps', benefits: 'The most durable experimental tyre package holds its pace over a long stint.', tradeoff: 'Heavier than the other tyres, so it gives away early acceleration.', watch: 'A slower launch but more consistent late-race sectors.', ratings: { grip: 90, endurance: 94 }, demo: 'wheelspin' },
  electric: { tagline: 'Power with room to breathe', benefits: 'A balanced hybrid-and-cooling package. Medium openings remove heat without a large drag penalty.', tradeoff: 'Less peak output than the attack package.', watch: 'Stable temperatures and consistent pace over eight laps.', ratings: { output: 70, cooling: 78 }, demo: 'overheat' },
  torque: { tagline: 'More power. Less thermal margin.', benefits: 'High output and compact cooling give stronger acceleration.', tradeoff: 'The compact cooling openings struggle during a long, hot stint. Extra pace comes with a repeatable overheating penalty.', watch: 'Heat warnings, cooling vapour and reduced power. With low-drag aero, heavy braking also exposes brake fade.', ratings: { output: 95, cooling: 35 }, demo: 'overheat' },
  sprint: { tagline: 'Built for a sprint. Fails over race distance.', benefits: 'A high-output package with almost closed cooling ducts gives the strongest initial acceleration.', tradeoff: 'Repeated braking overwhelms its restricted cooling. On this eight-lap course, heat escalates into brake failure and retirement.', watch: 'A fast start, then overheating, smoke, a brake fire and a stopped car. A retired car earns no race points.', ratings: { output: 100, cooling: 10 }, demo: 'fire' },
  solar: { tagline: 'Give heat somewhere to go', benefits: 'A lower-output hybrid with larger cooling outlets. Light and thermally conservative.', tradeoff: 'Less acceleration and more cooling drag than the attack package.', watch: 'A steady late-race pace with a low overheating risk.', ratings: { output: 48, cooling: 95 }, demo: 'overheat' },
  alloy: { tagline: 'A stable all-round platform', benefits: 'Balanced wing loading gives predictable cornering and straight-line performance.', tradeoff: 'Neither the fastest straight-line package nor the strongest cornering package.', watch: 'A settled car through the technical sector.', ratings: { cornering: 75, straight: 70 }, demo: 'understeer' },
  carbon: { tagline: 'Carry speed through the corners', benefits: 'A larger wing package and light structure help the car stay planted through the technical sector.', tradeoff: 'More aerodynamic drag slows the car on the straight. It also uses more of your budget.', watch: 'Tighter cornering lines and fewer handling incidents.', ratings: { cornering: 95, straight: 48 }, demo: 'understeer' },
  scout: { tagline: 'Win the straight. Respect the corner.', benefits: 'Small wings reduce drag and save credits.', tradeoff: 'Less aerodynamic grip. The front can run wide and the car is more exposed to a kerb strike.', watch: 'Understeer, a wide line, then sparks and a time loss if the car catches the kerb.', ratings: { cornering: 35, straight: 95 }, demo: 'understeer' },
  camera: { tagline: 'Start with what you can see', benefits: 'Three visual observations help you identify the mystery surface.', tradeoff: 'No temperature or subsurface measurements. It still provides enough evidence to solve the round.', watch: 'The first scan locks your sensor. Sensors do not prevent mechanical failures.', ratings: null },
  thermal: { tagline: 'Read heat and moisture', benefits: 'Three observations reveal temperature and moisture patterns.', tradeoff: 'Costs more than the camera. Temperature alone cannot identify a surface.', watch: 'Combine all three clues before making your prediction. It does not cool the car.', ratings: null },
  radar: { tagline: 'Look below the surface', benefits: 'Three observations describe the structure under the top layer.', tradeoff: 'The most expensive sensor. It offers a different route to the same answer, not an automatic racing advantage.', watch: 'Use the evidence before testing. It does not steer the car for you.', ratings: null },
};

export const INCIDENTS = {
  wheelspin: { title: 'Wheelspin', label: 'TRACTION LOSS', cause: 'The tyres cannot transfer all of the available force into this loose surface.', remedy: 'Try a tyre with more loose-surface grip.', effect: 'dust', loss: 1.8, phase: .47 },
  understeer: { title: 'Running wide', label: 'UNDERSTEER', cause: 'The front tyres do not have enough grip to follow the requested cornering line.', remedy: 'Use a more stable aero package, or improve grip.', effect: 'slide', loss: 2.5, phase: .78 },
  overheat: { title: 'Power unit overheating', label: 'TEMPERATURE HIGH', cause: 'The high-output package generates more heat than its compact cooling can remove.', remedy: 'Trade some output for a package with more cooling margin.', effect: 'steam', loss: 3.2, phase: .22 },
  brakefade: { title: 'Braking performance lost', label: 'BRAKE FADE', cause: 'Repeated braking and restricted cooling reduce braking performance.', remedy: 'Use the balanced cooling package and a more stable aero setup.', effect: 'brake', loss: 2.8, phase: .76 },
  contact: { title: 'Kerb strike', label: 'CONTACT', cause: 'An unsettled low-downforce car runs wide and strikes the raised outside kerb.', remedy: 'Add cornering stability. Contact depends on the line and the obstacle, not simply the car being fast.', effect: 'sparks', loss: 4.2, phase: .82 },
  fire: { title: 'Blocked brake duct', label: 'BRAKE FIRE', cause: 'Restricted brake airflow cannot remove repeated-braking heat. Smoke builds into a brake fire and the car must stop.', remedy: 'Use a package with enough brake cooling for the full race distance. Heat must have somewhere to go.', effect: 'fire', loss: 8, phase: .72 },
};

export function engineeringStats(build) {
  return { cornering: ENGINEERING[build.body].ratings.cornering, cooling: ENGINEERING[build.power].ratings.cooling, endurance: ENGINEERING[build.wheels].ratings.endurance };
}
export function setupRisks(build) {
  const risks = [];
  if (build.wheels === 'road') risks.push({ type: 'wheelspin', text: 'Loose-surface grip', detail: 'Expect a slide in the mystery sector and more wear late in the stint.' });
  if (build.body === 'scout') risks.push({ type: 'understeer', text: 'Runs wide in corners', detail: 'Low downforce exposes the car to understeer and a kerb strike.' });
  if (build.power === 'sprint') risks.push({type:'fire',text:'Cooling cannot last this race',detail:'The sprint package overheats, develops a brake fire and retires on lap 5. Choose balanced cooling to finish.'});
  if (build.power === 'torque') risks.push({ type: 'overheat', text: 'Limited cooling margin', detail: 'The attack package loses power when the long stint builds heat.' });
  if (build.power === 'torque' && build.body === 'scout') risks.push({ type: 'brakefade', text: 'Braking heat', detail: 'High straight-line pace plus compact cooling exposes brake fade.' });
  return risks;
}

// Events are attached to lap distance. Boosting changes when a car reaches them,
// but never moves a corner incident onto an unrelated section of track.
export function buildIncidents(build) {
  const events = [];
  const add = (type, lap, loss) => events.push({ ...INCIDENTS[type], type, lap, loss: loss ?? INCIDENTS[type].loss, distance: lap - 1 + INCIDENTS[type].phase });
  if (build.wheels === 'road') { add('wheelspin', 1); add('wheelspin', 6, 2.4); }
  if (build.body === 'scout') { add('understeer', 2); add('contact', 5); }
  if (build.power === 'sprint') { add('overheat',2); add('brakefade',3); add('fire',5,9); }
  if (build.power === 'torque') { add('overheat', 4); add('overheat', 7); }
  if (build.power === 'torque' && build.body === 'scout') add('brakefade', 3);
  return events.sort((a, b) => a.distance - b.distance);
}
