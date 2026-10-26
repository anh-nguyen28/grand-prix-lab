import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUILD, DEMO_TEAMS } from '../shared/content.js';
import { buildIncidents, INCIDENTS, setupRisks } from '../shared/engineering.js';
import { addPlayerBoost, createIncidentDemo, createRace, finishRace, sampleRace } from '../shared/race.js';

const risky={...DEFAULT_BUILD,power:'torque',body:'scout'};
test('setup warnings correspond to real, avoidable race incidents',()=>{
  const types=new Set(buildIncidents(risky).map(event=>event.type));
  for(const risk of setupRisks(risky))assert.ok(types.has(risk.type));
  assert.ok(types.has('contact'));
  assert.deepEqual(buildIncidents({...DEFAULT_BUILD,wheels:'offroad',body:'carbon'}),[]);
  assert.equal(buildIncidents({...risky,power:'electric'}).some(event=>['overheat','brakefade'].includes(event.type)),false);
  assert.equal(buildIncidents({...risky,body:'alloy'}).some(event=>['understeer','contact'].includes(event.type)),false);
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
test('all 27 non-sprint setup combinations have finite monotonic progress and finish',()=>{
  for(const wheels of ['road','offroad','tracks'])for(const power of ['electric','torque','solar'])for(const body of ['alloy','carbon','scout']){
    const build={wheels,power,body,sensor:'camera'},race=createRace([{id:'you',name:'Test',build}],build);let distance=0;
    assert.ok(race.field[0].timeline.every(piece=>piece.duration>0));
    assert.ok(race.field[0].incidents.every(event=>event.type!=='fire'));
    for(let elapsed=0;elapsed<race.maxTime+2;elapsed+=.5){const row=sampleRace(race,elapsed)[0];assert.ok(Number.isFinite(row.distance)&&row.distance>=distance);distance=row.distance;}
    assert.equal(sampleRace(race,race.maxTime+1)[0].finished,true);
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
