import { BUDGET, PARTS, rivalsFor } from '../shared/content.js';
import { addPlayerBoost, createRace, finishRace } from '../shared/race.js';
import { buildStats } from '../shared/simulation.js';
import { TRACKS } from '../shared/tracks.js';

const options = slot => Object.values(PARTS).filter(part => part.slot === slot).map(part => part.id);
const builds = options('wheels').flatMap(wheels => options('power').flatMap(power => options('body').flatMap(body => options('chassis').map(chassis => ({ wheels, power, body, chassis, sensor: 'camera' })))));
export const affordable = builds.filter(build => buildStats(build).cost <= BUDGET);

export function finish(build, track, boosts) {
  let race = createRace([{ id: 'you', name: 'Balance', build }, ...rivalsFor(track.id)], build, track);
  for (let i = 0; i < boosts; i++) { const result = addPlayerBoost(race, 30 + i * 60); if (result.ok) race = result.race; }
  const you = finishRace(race).find(car => car.id === 'you');
  return { place: you.retired ? 99 : you.place, retired: you.retired, crashed: you.incidents.some(event => event.type === 'crash') };
}
export function analyse(track) {
  const rows = affordable.map(build => ({ build, cost: buildStats(build).cost, plain: finish(build, track, 0), ers: finish(build, track, 3) }));
  const winners = rows.filter(row => row.ers.place === 1);
  return {
    track: track.id, builds: rows.length, winners: winners.length,
    winnerTyres: [...new Set(winners.map(row => row.build.wheels))], winnerPower: [...new Set(winners.map(row => row.build.power))],
    points: Math.round(rows.filter(row => row.ers.place <= 10).length / rows.length * 100),
    trouble: Math.round(rows.filter(row => row.ers.retired || row.ers.crashed).length / rows.length * 100),
    rows,
  };
}
if (process.argv[1].endsWith('balance-report.mjs')) for (const track of TRACKS) { const { rows, ...summary } = analyse(track); console.log(JSON.stringify(summary)); }
