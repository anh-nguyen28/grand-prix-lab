import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOST_SECONDS, DEFAULT_BUILD, DEMO_TEAMS, RACE_PLAYBACK_MS, RACE_LAPS } from '../shared/content.js';
import { addPlayerBoost, createPracticeLap, createRace, effectiveTime, finishRace, sampleRace } from '../shared/race.js';
import { createGame, transition } from '../shared/game.js';
import { buildIncidents } from '../shared/engineering.js';
import { DEFAULT_TRACK, TRACKS, trackById } from '../shared/tracks.js';

const entries = [{ id: 'you', name: 'Ada', build: DEFAULT_BUILD }, ...DEMO_TEAMS];
test('the full field receives a deterministic classification over an eight-lap race', () => {
  const race=createRace(entries,DEFAULT_BUILD);
  assert.equal(race.laps,8);assert.equal(race.field.length,DEMO_TEAMS.length+1);assert.ok(race.field.length>=20);assert.equal(RACE_PLAYBACK_MS,175000);
  assert.ok(race.field.every(car=>car.result.segments.length===RACE_LAPS*DEFAULT_TRACK.sections.length));
  assert.deepEqual(finishRace(race),finishRace(createRace(entries,DEFAULT_BUILD)));
  const final=sampleRace(race,race.maxTime+1);
  assert.ok(final.every(car=>car.retired||(car.finished&&car.lap===RACE_LAPS&&Math.abs(car.distance-RACE_LAPS)<1e-8)));
  assert.equal(final.find(car=>car.id==='orbit').retired,true);
  assert.deepEqual(final.map(car=>car.id),finishRace(race).map(car=>car.id));
});

test('ERS preserves current position, gains time gradually, and improves finishing time', () => {
  const race=createRace(entries,DEFAULT_BUILD),elapsed=30;
  const boosted=addPlayerBoost(race,elapsed);assert.equal(boosted.ok,true);
  assert.equal(effectiveTime(race,'you',elapsed),effectiveTime(boosted.race,'you',elapsed));
  const before=sampleRace(race,elapsed).find(car=>car.id==='you'),after=sampleRace(boosted.race,elapsed).find(car=>car.id==='you');
  assert.equal(before.distance,after.distance);
  assert.ok(effectiveTime(boosted.race,'you',elapsed+BOOST_SECONDS)>effectiveTime(race,'you',elapsed+BOOST_SECONDS));
  assert.ok(finishRace(boosted.race).find(car=>car.id==='you').result.time<finishRace(race).find(car=>car.id==='you').result.time);
});

test('ERS refuses invalid times, repeated deployments, and a fourth charge', () => {
  let race=createRace(entries,DEFAULT_BUILD);
  for(const elapsed of [-1,NaN,Infinity,race.maxTime+1])assert.equal(addPlayerBoost(race,elapsed).ok,false);
  race=addPlayerBoost(race,20).race;
  assert.equal(addPlayerBoost(race,20).ok,false);assert.equal(addPlayerBoost(race,19).ok,false);
  race=addPlayerBoost(race,50).race;race=addPlayerBoost(race,90).race;
  assert.equal(race.charges,0);assert.equal(addPlayerBoost(race,110).ok,false);
  assert.equal(transition(createGame(),{type:'BOOST',elapsed:10}).ok,false);
});

test('qualifying determines the grid and no car travels backwards through the laps', () => {
  const race=createRace(entries,DEFAULT_BUILD);
  assert.deepEqual(race.field.map(car=>car.grid),race.field.map((_,i)=>i+1));
  for(let i=1;i<race.field.length;i++)assert.ok(race.field[i].qualifying.time>=race.field[i-1].qualifying.time);
  const previous=new Map();
  for(let time=0;time<race.maxTime+2;time+=.75)for(const car of sampleRace(race,time)){
    assert.ok(car.distance>=(previous.get(car.id)||0)-1e-8);assert.ok(Number.isFinite(car.gap)&&car.gap>=0);previous.set(car.id,car.distance);
  }
});

test('every track produces a deterministic eight-lap race with the right number of segments', () => {
  for (const track of TRACKS) {
    const a = createRace(entries, DEFAULT_BUILD, track), b = createRace(entries, DEFAULT_BUILD, track);
    assert.equal(a.trackId, track.id);
    assert.deepEqual(finishRace(a), finishRace(b));
    assert.ok(a.field.every(car => car.result.segments.length === RACE_LAPS * track.sections.length), track.id);
    const final = sampleRace(a, a.maxTime + 1);
    assert.ok(final.every(car => car.retired || car.finished), track.id);
    assert.ok(track.sections.some(section => section.id === sampleRace(a, 1)[0].zone.id), track.id);
  }
});

test('a practice lap is one lap that shows the worst problem of every weak section, in track order', () => {
  const weak = { ...DEFAULT_BUILD, wheels: 'soft', body: 'scout' };
  for (const track of TRACKS) {
    const entry = { id: 'you', name: 'Solo', build: weak, color: '#ff3b38' };
    const lap = createPracticeLap(entry, track), car = lap.field[0];
    assert.equal(lap.laps, 1); assert.equal(lap.field.length, 1); assert.equal(lap.trackId, track.id);
    const forecast = buildIncidents(weak, track), shown = car.incidents;
    assert.ok(shown.length > 0, `${track.id}: a mismatched car should show problems`);
    // One event per weak section, in track order, and each is that section's worst event from the race plan.
    assert.equal(new Set(shown.map(event => event.section)).size, shown.length);
    assert.deepEqual(shown.map(event => event.section), track.sections.filter(section => shown.some(event => event.section === section.id)).map(section => section.id));
    for (const event of shown) {
      const own = forecast.filter(item => item.section === event.section);
      assert.ok(own.some(item => item.type === event.type), `${track.id}/${event.section}: ${event.type} is not in the race forecast`);
      assert.ok(own.every(item => item.loss <= event.loss || item.type === 'fire' || event.type === 'fire' || event.type === 'crash'), `${track.id}/${event.section}: not the worst`);
      assert.ok(event.raceLap >= 1 && event.raceLap <= RACE_LAPS);
      assert.ok(event.distance >= 0 && event.distance < 1);
    }
    const final = sampleRace(lap, lap.maxTime + 1)[0];
    assert.equal(final.finished, true, `${track.id}: the lap is completed even when the race would end in a fire`);
    assert.equal(car.retirement, null);
    assert.deepEqual(createPracticeLap(entry, track), lap);
  }
});

test('a clean car gets a clean practice lap and a lap time close to the sum of its sections', () => {
  const lap = createPracticeLap({ id: 'you', name: 'Solo', build: { ...DEFAULT_BUILD, wheels: 'wet', body: 'carbon', chassis: 'titanium', power: 'solar' } }, trackById('mountain'));
  assert.ok(lap.field[0].result.time > 0);
  assert.equal(lap.field[0].lapTimes.length, 1);
});
