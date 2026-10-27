import test from 'node:test';
import assert from 'node:assert/strict';
import { BUDGET, DEFAULT_BUILD, DEMO_TEAMS, PARTS } from '../shared/content.js';
import { addPlayerBoost, createRace, finishRace } from '../shared/race.js';
import { buildStats } from '../shared/simulation.js';

// Balance targets for Dune Valley. Retune part pace, prices or rivals if one fails.
const RETIRED = 99;
const NEW = new Set(['hard', 'inter', 'wet', 'sprung', 'titanium', 'monocoque']);
const LEGACY_BUDGET = 82; // the old 75 plus the 8-credit default chassis, until Task 7 retunes the budget
const options = slot => Object.values(PARTS).filter(part => part.slot === slot && !NEW.has(part.id)).map(part => part.id);
function finish(build, boosts) {
  let race = createRace([{ id: 'you', name: 'Balance', build }, ...DEMO_TEAMS], build);
  for (let i = 0; i < boosts; i++) { const result = addPlayerBoost(race, 30 + i * 60); if (result.ok) race = result.race; }
  const you = finishRace(race).find(car => car.id === 'you');
  return you.retired ? RETIRED : you.place;
}
const builds = options('wheels').flatMap(wheels => options('power').flatMap(power => options('body').map(body => ({ wheels, power, body, chassis: 'stiff', sensor: 'camera' }))));
const affordable = builds.filter(build => buildStats(build).cost <= LEGACY_BUDGET);
const results = affordable.map(build => ({ build, cost: buildStats(build).cost, plain: finish(build, 0), ers: finish(build, 3) }));

test('the budget rules out the all-premium car', () => {
  const premium = { wheels: 'tracks', power: 'torque', body: 'carbon', chassis: 'stiff', sensor: 'camera' };
  assert.ok(buildStats(premium).cost > LEGACY_BUDGET);
  assert.ok(affordable.length < builds.length);
  assert.ok(DEMO_TEAMS.every(team => buildStats(team.build).cost <= BUDGET));
});

test('several different cars can win, and winning needs the race as well as the build', () => {
  const winners = results.filter(result => result.ers === 1);
  assert.ok(winners.length >= 4, `only ${winners.length} winning builds`);
  for (const slot of ['wheels', 'power', 'body']) assert.ok(new Set(winners.map(result => result.build[slot])).size >= 2, `every winner shares the same ${slot}`);
  assert.ok(results.some(result => result.plain <= 3), 'the best builds should reach the podium without ERS');
});

test('about half of all builds score points, and the starting car must be improved', () => {
  const scoring = results.filter(result => result.ers <= 10).length / results.length;
  assert.ok(scoring >= .35 && scoring <= .6, `${Math.round(scoring * 100)}% of builds score points`);
  assert.ok(finish(DEFAULT_BUILD, 3) > 10, 'the starting car should not score points');
});

test('every part except the sprint package can reach the top five, and price does not buy the win', () => {
  for (const id of Object.keys(PARTS).filter(id => PARTS[id].slot !== 'sensor' && id !== 'sprint' && !NEW.has(id) && id !== 'stiff'))
    assert.ok(results.some(result => Object.values(result.build).includes(id) && result.ers <= 5), `${id} never reaches the top five`);
  const priciest = Math.max(...results.map(result => result.cost));
  assert.ok(results.some(result => result.cost < priciest && result.ers === 1));
  assert.ok(results.filter(result => result.build.power === 'sprint').every(result => result.ers === RETIRED));
});
