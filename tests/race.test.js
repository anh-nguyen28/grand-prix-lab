import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOST_SECONDS, DEFAULT_BUILD, DEMO_TEAMS, RACE_PLAYBACK_MS, RACE_LAPS } from '../shared/content.js';
import { addPlayerBoost, createRace, effectiveTime, finishRace, sampleRace } from '../shared/race.js';
import { createGame, transition } from '../shared/game.js';

const entries = [{ id: 'you', name: 'Ada', build: DEFAULT_BUILD }, ...DEMO_TEAMS];
test('six drivers receive deterministic classification over an eight-lap race', () => {
  const race=createRace(entries,DEFAULT_BUILD);
  assert.equal(race.laps,8);assert.equal(race.field.length,6);assert.equal(RACE_PLAYBACK_MS,240000);
  assert.ok(race.field.every(car=>car.result.segments.length===24));
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
  assert.deepEqual(race.field.map(car=>car.grid),[1,2,3,4,5,6]);
  for(let i=1;i<race.field.length;i++)assert.ok(race.field[i].qualifying.time>=race.field[i-1].qualifying.time);
  const previous=new Map();
  for(let time=0;time<race.maxTime+2;time+=.75)for(const car of sampleRace(race,time)){
    assert.ok(car.distance>=(previous.get(car.id)||0)-1e-8);assert.ok(Number.isFinite(car.gap)&&car.gap>=0);previous.set(car.id,car.distance);
  }
});
