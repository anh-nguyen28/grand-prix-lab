import test from 'node:test';
import assert from 'node:assert/strict';
import { BUDGET, DEFAULT_BUILD, DEMO_TEAMS, PARTS, rivalsFor } from '../shared/content.js';
import { buildStats } from '../shared/simulation.js';
import { TRACKS } from '../shared/tracks.js';
import { analyse, finish } from '../scripts/balance-report.mjs';

const reports = Object.fromEntries(TRACKS.map(track => [track.id, analyse(track)]));
const key = build => `${build.wheels}/${build.power}/${build.body}/${build.chassis}`;

test('every rival build is complete and within budget on every track', () => {
  for (const track of TRACKS) for (const team of rivalsFor(track.id)) {
    assert.ok(buildStats(team.build).cost <= BUDGET, `${track.id}/${team.id}`);
    for (const slot of ['wheels', 'power', 'body', 'chassis', 'sensor']) assert.ok(PARTS[team.build[slot]], `${track.id}/${team.id}/${slot}`);
  }
});

test('each track can be won by several different builds', () => {
  for (const track of TRACKS) {
    const report = reports[track.id];
    assert.ok(report.winners >= 4, `${track.id}: only ${report.winners} winning builds`);
    assert.ok(report.winnerTyres.length >= 2, `${track.id}: winners share one tyre`);
    assert.ok(report.winnerPower.length >= 2, `${track.id}: winners share one power unit`);
  }
});

test('no build wins every track', () => {
  const sets = TRACKS.map(track => new Set(reports[track.id].rows.filter(row => row.ers.place === 1).map(row => key(row.build))));
  const everywhere = [...sets[0]].filter(item => sets.every(set => set.has(item)));
  assert.equal(everywhere.length, 0, `build wins everywhere: ${everywhere[0]}`);
});

test('25–45% of affordable builds crash or retire, and the default car does not score', () => {
  for (const track of TRACKS) {
    const trouble = reports[track.id].trouble;
    assert.ok(trouble >= 25 && trouble <= 45, `${track.id}: ${trouble}% crash or retire`);
    assert.ok(finish(DEFAULT_BUILD, track, 3).place > 10, `${track.id}: the starting car should not score`);
  }
});

test('every part except the sprint package reaches the top five somewhere, and price does not buy the win', () => {
  for (const id of Object.keys(PARTS).filter(id => PARTS[id].slot !== 'sensor' && id !== 'sprint')) {
    assert.ok(TRACKS.some(track => reports[track.id].rows.some(row => Object.values(row.build).includes(id) && row.ers.place <= 5)), `${id} never reaches the top five`);
  }
  for (const track of TRACKS) {
    const rows = reports[track.id].rows, priciest = Math.max(...rows.map(row => row.cost));
    assert.ok(rows.some(row => row.cost < priciest && row.ers.place === 1), `${track.id}: the priciest build always wins`);
  }
  assert.ok(DEMO_TEAMS.length >= 19);
});
