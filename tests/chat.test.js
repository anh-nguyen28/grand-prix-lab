import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_COOLDOWN_MS, CHAT_MAX_LENGTH, canSend, rivalLine, sanitizeMessage } from '../shared/chat.js';

test('messages are trimmed, length-limited, filtered and never empty', () => {
  assert.equal(sanitizeMessage('  nice   move  '), 'nice move');
  assert.equal(sanitizeMessage('x'.repeat(200)).length, CHAT_MAX_LENGTH);
  assert.equal(sanitizeMessage('   '), null);
  assert.equal(sanitizeMessage(null), null);
  assert.equal(sanitizeMessage('you idiot'), 'you •••••');
  assert.equal(sanitizeMessage('Shut  up please'), '••••••• please');
  assert.equal(sanitizeMessage('hello\u0007world'), 'hello world');
  assert.equal(sanitizeMessage('shellfish'), 'shellfish');
});

test('sending is rate limited', () => {
  assert.equal(canSend(null, 0), true);
  assert.equal(canSend(1000, 1000 + CHAT_COOLDOWN_MS - 1), false);
  assert.equal(canSend(1000, 1000 + CHAT_COOLDOWN_MS), true);
});

test('rival chatter is deterministic and tied to a real event type', () => {
  assert.equal(rivalLine('wheelspin', 'sun', 1), rivalLine('wheelspin', 'sun', 1));
  assert.ok(rivalLine('fire', 'orbit', 5).length > 0);
  assert.equal(rivalLine('unknown', 'sun', 1), null);
});
