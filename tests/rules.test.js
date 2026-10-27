import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, changedSlots, transition } from '../shared/game.js';
import { BUDGET, DEMO_TEAMS, PARTS, DEFAULT_BUILD } from '../shared/content.js';
import { buildStats, rankField, simulate } from '../shared/simulation.js';

function act(state, command) { const result = transition(state, command); assert.equal(result.ok, true, result.message); return result.state; }
function qualify(state) { return act(act(state, { type: 'QUALIFY' }), { type: 'FINISH_QUALIFY' }); }

test('a complete round gives explainable points and cannot score twice', () => {
  let state = act(createGame(), { type: 'PREDICT', terrain: 'abrasive' });
  state = act(state, { type: 'SET_PART', id: 'offroad' });
  state = act(state, { type: 'PRACTICE' });
  state = qualify(state);
  state = act(state, { type: 'SET_PART', id: 'torque' });
  state = act(state, { type: 'RACE' });
  assert.equal(transition(state, { type: 'SET_PART', id: 'road' }).ok, false);
  state = act(state, { type: 'REVEAL' });
  assert.equal(state.score.prediction, 3);
  assert.equal(state.score.total, state.score.race + 3);
  assert.equal(state.field.length, DEMO_TEAMS.length + 1);
  assert.equal(transition(state, { type: 'REVEAL' }).ok, false);
});

test('parts refund their cost and every accepted build is complete and within budget', () => {
  let state = createGame();
  for (let i = 0; i < 5; i++) for (const part of Object.values(PARTS)) {
    const result = transition(state, { type: 'SET_PART', id: part.id });
    if (result.ok) { state = result.state; assert.ok(buildStats(state.build).cost <= BUDGET); assert.equal(Object.keys(state.build).length, 5); }
  }
  state = createGame();
  state = act(state, { type: 'SET_PART', id: 'tracks' });
  state = act(state, { type: 'SET_PART', id: 'carbon' });
  assert.equal(buildStats(state.build).cost, 82);
  const blocked = transition(state, { type: 'SET_PART', id: 'monocoque' });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, new RegExp(`${BUDGET} credits`));
  assert.equal(transition(state, { type: 'SET_PART', id: 'torque' }).ok, true);
  state = act(state, { type: 'SET_PART', id: 'road' });
  assert.equal(buildStats(state.build).cost, 68);
});

test('a new round can start from the previous car, but never from an invalid one', () => {
  const kept = { wheels: 'offroad', power: 'electric', body: 'carbon', chassis: 'stiff', sensor: 'thermal' };
  assert.deepEqual(createGame(undefined, kept).build, kept);
  assert.deepEqual(createGame(undefined, { ...kept, chassis: 'monocoque', sensor: 'radar' }).build, DEFAULT_BUILD);
  assert.deepEqual(createGame(undefined, { ...kept, power: 'radar' }).build, DEFAULT_BUILD);
  assert.equal(createGame(undefined, kept).runs.length, 0);
});

test('predictions lock before feedback and cannot be changed afterwards', () => {
  let state = act(createGame(), { type: 'PREDICT', terrain: 'dry' });
  assert.equal(transition(state, { type: 'PREDICT', terrain: 'abrasive' }).ok, false);
  state = act(createGame(), { type: 'PRACTICE' });
  assert.equal(state.prediction, null);
  assert.equal(transition(state, { type: 'PREDICT', terrain: 'abrasive' }).ok, false);
  assert.equal(transition(qualify(createGame()), { type: 'PREDICT', terrain: 'abrasive' }).ok, false);
});

test('two practice attempts are shared by a garage in either profile mode', () => {
  for (const mode of ['solo', 'team']) {
    let state = createGame({ name: 'Test garage', mode });
    state = act(act(state, { type: 'PRACTICE' }), { type: 'PRACTICE' });
    assert.equal(transition(state, { type: 'PRACTICE' }).ok, false);
    assert.equal(state.runs.length, 2);
    assert.equal(transition(qualify(state), { type: 'PRACTICE' }).ok, false);
  }
});

test('first scan locks the sensor and research cannot continue after qualifying', () => {
  let state = act(createGame(), { type: 'SET_PART', id: 'thermal' });
  state = act(state, { type: 'SCAN' });
  assert.match(state.clues[0], /41°C/);
  assert.equal(transition(state, { type: 'SET_PART', id: 'camera' }).ok, false);
  state = act(act(state, { type: 'SCAN' }), { type: 'SCAN' });
  assert.equal(transition(state, { type: 'SCAN' }).ok, false);
  assert.equal(transition(qualify(state), { type: 'SCAN' }).ok, false);
});

test('adjust counts changed slots, supports undo, and rejects a third slot', () => {
  let state = qualify(createGame());
  state = act(state, { type: 'SET_PART', id: 'offroad' });
  state = act(state, { type: 'SET_PART', id: 'tracks' });
  assert.equal(changedSlots(state).length, 1);
  state = act(state, { type: 'SET_PART', id: 'solar' });
  assert.equal(transition(state, { type: 'SET_PART', id: 'scout' }).ok, false);
  state = act(state, { type: 'SET_PART', id: 'road' });
  state = act(state, { type: 'SET_PART', id: 'scout' });
  assert.deepEqual(changedSlots(state), ['power', 'body']);
  assert.equal(state.qualifyingBuild.wheels, 'road');
});

test('better sand grip improves the mystery stretch and deterministic simulation stays reproducible', () => {
  const basic = simulate(DEFAULT_BUILD);
  const shredded = simulate({ ...DEFAULT_BUILD, wheels: 'soft', body: 'scout' });
  assert.ok(shredded.segments[1].time > basic.segments[1].time);
  assert.match(shredded.segments[1].suggestion, /Hard or endurance/);
  assert.deepEqual(simulate(DEFAULT_BUILD), basic);
  assert.ok(basic.segments.every(segment => Number.isFinite(segment.time) && segment.time > 0));
});

test('identical finish times share a place and inputs remain immutable', () => {
  const field = rankField([{ id: 'a', build: DEFAULT_BUILD }, { id: 'b', build: DEFAULT_BUILD }]);
  assert.deepEqual(field.map(entry => entry.place), [1, 1]);
  const state = createGame(), before = structuredClone(state);
  transition(state, { type: 'SET_PART', id: 'offroad' });
  transition(state, { type: 'RACE' });
  assert.deepEqual(state, before);
});

test('a retired player gets no finish points but keeps the earned surface bonus',()=>{
  let state=act(createGame(),{type:'PREDICT',terrain:'abrasive'});state=act(state,{type:'SET_PART',id:'sprint'});state=qualify(state);state=act(state,{type:'RACE'});state=act(state,{type:'REVEAL'});
  assert.equal(state.field.find(car=>car.id==='you').retired,true);assert.equal(state.score.race,0);assert.equal(state.score.total,3);
});

test('selecting a track resets practice and uses that track for clues, prediction and the race', () => {
  let state = act(createGame(), { type: 'SCAN' });
  state = act(state, { type: 'SELECT_TRACK', id: 'mountain' });
  assert.equal(state.trackId, 'mountain');
  assert.equal(state.clues.length, 0);
  assert.equal(state.sensorLocked, false);
  state = act(state, { type: 'SCAN' });
  assert.match(state.clues[0], /Water|water/);
  assert.equal(transition(state, { type: 'PREDICT', terrain: 'sand' }).ok, false);
  state = act(state, { type: 'PREDICT', terrain: 'rain' });
  state = act(act(state, { type: 'QUALIFY' }), { type: 'FINISH_QUALIFY' });
  state = act(state, { type: 'RACE' });
  assert.equal(state.race.trackId, 'mountain');
  state = act(state, { type: 'REVEAL' });
  assert.equal(state.score.prediction, 3);
});

test('track selection is only open in practice, and unknown tracks are rejected', () => {
  assert.equal(transition(createGame(), { type: 'SELECT_TRACK', id: 'nope' }).ok, false);
  const qualified = qualify(createGame());
  assert.equal(transition(qualified, { type: 'SELECT_TRACK', id: 'quarry' }).ok, false);
  assert.equal(createGame(undefined, null, 'nope').trackId, 'dune');
});
