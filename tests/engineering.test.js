import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUILD, DEMO_TEAMS, PARTS } from '../shared/content.js';
import { buildIncidents, INCIDENTS, planIncidents, raceRiskForecast, sectionReport, sensorWarnings, setupRisks, specSheet } from '../shared/engineering.js';
import { BUDGET } from '../shared/content.js';
import { buildStats } from '../shared/simulation.js';
import { TRACKS, trackById } from '../shared/tracks.js';
import { addPlayerBoost, createIncidentDemo, createRace, finishRace, sampleRace } from '../shared/race.js';

const risky={...DEFAULT_BUILD,power:'torque',body:'scout'};
const grippy={...DEFAULT_BUILD,wheels:'offroad',body:'scout'};
const build = over => ({ ...DEFAULT_BUILD, ...over });
test('a build that matches the track is clean, a mismatched one gets incidents on the right sections', () => {
  const quarry = trackById('quarry');
  const stiff = buildIncidents(build({ chassis: 'stiff', body: 'floor' }), quarry);
  assert.ok(stiff.some(event => event.section === 'kerbs' || event.section === 'washboard'), 'stiff chassis should suffer on the bumps');
  const smooth = buildIncidents(build({ chassis: 'titanium', body: 'alloy', wheels: 'tracks', power: 'solar' }), quarry);
  assert.equal(smooth.filter(event => ['kerbs', 'washboard'].includes(event.section)).length, 0);
});

test('slicks aquaplane in the rain and wet tyres do not', () => {
  const mountain = trackById('mountain');
  assert.ok(buildIncidents(build({ wheels: 'road' }), mountain).some(event => event.section === 'waterfall'));
  assert.ok(!buildIncidents(build({ wheels: 'wet', body: 'carbon' }), mountain).some(event => event.section === 'waterfall'));
});

test('the sprint package escalates to a retiring fire on a hot track', () => {
  const events = buildIncidents(build({ power: 'sprint' }), trackById('dune'));
  assert.deepEqual(events.filter(event => event.section === 'heatsoak').map(event => event.type).slice(0, 3), ['overheat', 'brakefade', 'fire']);
  assert.equal(events.at(-1).type, 'fire');
});

test('a car that fails every lap gets bounded, readable incidents', () => {
  for (const track of TRACKS) {
    const worst = build({ wheels: 'wet', power: 'sprint', body: 'scout', chassis: 'stiff' });
    const { events, quiet } = planIncidents(worst, track);
    const bySection = {};
    for (const event of events) bySection[event.section] = (bySection[event.section] ?? 0) + 1;
    for (const count of Object.values(bySection)) assert.ok(count <= 4, `${track.id}: ${count} events in one section`);
    assert.equal(events.filter(event => event.type === 'crash').length <= track.sections.filter(section => section.crash).length, true);
    const total = events.reduce((sum, event) => sum + event.loss, 0) + Object.values(quiet).reduce((sum, loss) => sum + loss, 0);
    assert.ok(total < 120, `${track.id}: ${total}s lost`);
  }
});

test('risks and forecasts are per track and deterministic', () => {
  const quarry = trackById('quarry'), car = build({ chassis: 'stiff', body: 'floor' });
  assert.deepEqual(buildIncidents(car, quarry), buildIncidents(car, quarry));
  assert.ok(raceRiskForecast(car, quarry).length > 0);
  assert.ok(setupRisks(car, quarry).every(risk => risk.type && risk.text && risk.detail));
});
test('incidents happen at their track location and carry their cost into the result',()=>{
  const race=createRace([{id:'you',name:'Risk test',build:risky},...DEMO_TEAMS],risky);race.boosts=[];
  const entry=race.field.find(car=>car.id==='you');
  for(const event of entry.incidents){
    const row=sampleRace(race,entry.startDelay+(event.start+event.end)/2).find(car=>car.id==='you');
    assert.equal(row.incident.type,event.type);assert.ok(row.distance>=event.from&&row.distance<=event.to);
  }
  const baseTime=entry.result.segments.reduce((sum,sector)=>sum+sector.time,0);
  const loss=entry.incidents.reduce((sum,event)=>sum+event.loss,0);
  const result=finishRace(race).find(car=>car.id==='you');
  assert.ok(Math.abs(result.result.time-(baseTime+loss+entry.startDelay))<.002);
});
const ids=slot=>Object.values(PARTS).filter(part=>part.slot===slot&&part.id!=='sprint').map(part=>part.id);
test('every non-sprint setup combination has finite monotonic progress and finishes',()=>{
  for(const wheels of ids('wheels'))for(const power of ids('power'))for(const body of ids('body')){
    const build={wheels,power,body,chassis:'stiff',sensor:'camera'},race=createRace([{id:'you',name:'Test',build}],build);let distance=0;
    assert.ok(race.field[0].timeline.every(piece=>piece.duration>0));
    const retirement=race.field[0].retirement;
    assert.equal(race.field[0].incidents.some(event=>event.type==='fire'),!!retirement);
    for(let elapsed=0;elapsed<race.maxTime+2;elapsed+=.5){const row=sampleRace(race,elapsed)[0];assert.ok(Number.isFinite(row.distance)&&row.distance>=distance);distance=row.distance;}
    const end=sampleRace(race,race.maxTime+1)[0];
    assert.equal(retirement?end.retired:end.finished,true);
  }
});
test('all six isolated demonstrations expose their effect and leave the supplied build unchanged',()=>{
  const build={...DEFAULT_BUILD},before=structuredClone(build);
  for(const type of Object.keys(INCIDENTS)){
    const demo=createIncidentDemo(build,type,'Demo'),event=demo.field[0].incidents[0];
    const sample=sampleRace(demo,(event.start+event.end)/2)[0];
    assert.equal(sample.incident.type,type);assert.equal(demo.demo,true);assert.equal(demo.charges,0);
  }
  assert.deepEqual(build,before);
});

test('inadequate sprint cooling escalates into fire and a stable retirement',()=>{
  const build={...DEFAULT_BUILD,power:'sprint'},race=createRace([{id:'you',name:'Sprint',build},...DEMO_TEAMS],build),entry=race.field.find(car=>car.id==='you');
  assert.deepEqual(entry.incidents.filter(event=>['overheat','brakefade','fire'].includes(event.type)).map(event=>event.type),['overheat','brakefade','fire']);
  const during=sampleRace(race,entry.startDelay+(entry.retirement.start+entry.retirement.end)/2).find(car=>car.id==='you');assert.equal(during.incident.type,'fire');
  const after=sampleRace(race,race.maxTime+1).find(car=>car.id==='you');assert.equal(after.retired,true);assert.equal(after.finished,false);assert.equal(after.distance,entry.retirement.to);assert.equal(after.lap,5);
  assert.equal(finishRace(race).find(car=>car.id==='you').result.time,null);assert.equal(addPlayerBoost(race,entry.startDelay+entry.retirement.end+.1).ok,false);
});

test('the section report names the weak stat and single-part swaps that help', () => {
  const quarry = trackById('quarry'), car = build({ chassis: 'stiff', body: 'floor' });
  const report = sectionReport(car, quarry);
  assert.equal(report.length, quarry.sections.length);
  const kerbs = report.find(item => item.section.id === 'kerbs');
  assert.notEqual(kerbs.outcome.kind, 'clean');
  assert.equal(kerbs.weakStat, 'stability');
  assert.ok(kerbs.advice.length > 0 && kerbs.advice[0].gain > 0);
  assert.ok(kerbs.advice.every(item => buildStats({ ...car, [item.slot]: item.id }).cost <= BUDGET));
  assert.ok(report.filter(item => item.outcome.kind === 'clean').every(item => item.advice.length === 0));
});

test('the spec sheet shows wet grip and stability from the same stats', () => {
  const labels = specSheet(DEFAULT_BUILD).map(item => item.label);
  assert.deepEqual(labels, ['Top speed', 'Cornering', 'Wet grip', 'Cooling', 'Tyre life', 'Stability']);
  assert.ok(specSheet(build({ wheels: 'wet' })).find(item => item.id === 'wet').value > specSheet(build({ wheels: 'road' })).find(item => item.id === 'wet').value);
});

test('the setup risks lead with the worst outcome per section, so a fire is announced with its lap', () => {
  const risks = setupRisks(build({ power: 'sprint' }), trackById('dune'));
  const fire = risks.find(risk => risk.type === 'fire');
  assert.ok(fire, 'the sprint package should list the fire');
  assert.match(fire.detail, /retires on lap 5/);
  assert.equal(risks.filter(risk => risk.section === fire.section).length, 1);
});

test('a better sensor warns about more kinds of trouble; the radar sees all of it', () => {
  const items = ['wheelspin', 'overheat', 'bumpbreak', 'fire'].map(type => ({ type }));
  assert.deepEqual(sensorWarnings('camera', items).seen.map(item => item.type), ['wheelspin']);
  assert.deepEqual(sensorWarnings('thermal', items).seen.map(item => item.type), ['overheat', 'fire']);
  assert.equal(sensorWarnings('lidar', items).hidden, 3);
  assert.deepEqual(sensorWarnings('radar', items), { seen: items, hidden: 0 });
});
