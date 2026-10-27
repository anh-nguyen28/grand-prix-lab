import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, transition } from '../shared/game.js';
import { storyChapters } from '../shared/story.js';

function act(state, command) { const result = transition(state, command); assert.equal(result.ok, true, result.message); return result.state; }
const current = state => storyChapters(state).find(chapter => chapter.status === 'current')?.id;

test('the story follows the round from first look to the real world', () => {
  let state = createGame();
  assert.equal(current(state), 'data');
  assert.equal(storyChapters(state)[0].autoOpen, true);
  for (let i = 0; i < 3; i++) state = act(state, { type: 'SCAN' });
  assert.equal(current(state), 'label');
  assert.equal(storyChapters(state)[0].autoOpen, false);
  state = act(state, { type: 'PREDICT', terrain: 'sand' });
  assert.equal(current(state), 'train');
  assert.match(storyChapters(state)[2].lines[0], /Sand/);
  state = act(state, { type: 'PRACTICE' });
  assert.match(storyChapters(state)[3].lines[0], /Run 1/);
  state = act(act(state, { type: 'QUALIFY' }), { type: 'FINISH_QUALIFY' });
  assert.equal(current(state), 'exam');
  state = act(state, { type: 'RACE' });
  assert.equal(current(state), 'race');
  state = act(state, { type: 'REVEAL' });
  assert.ok(storyChapters(state).every(chapter => chapter.status === 'done'));
});

test('future chapters stay locked and the lesson is not named before the race', () => {
  const chapters = storyChapters(createGame());
  assert.ok(chapters.slice(2).every(chapter => chapter.status === 'locked' && chapter.lines.length === 0));
  let state = createGame();
  for (const command of [{ type: 'SCAN' }, { type: 'PRACTICE' }, { type: 'QUALIFY' }, { type: 'FINISH_QUALIFY' }]) state = act(state, command);
  assert.ok(storyChapters(state).every(chapter => chapter.lines.every(line => !/classif/i.test(line))));
});

test('skipping the label is acknowledged without blocking the story', () => {
  const state = act(createGame(), { type: 'PRACTICE' });
  assert.equal(current(state), 'train');
  assert.match(storyChapters(state)[2].lines[0], /without a label/);
});
