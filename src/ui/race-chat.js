import { CHAT_HISTORY, CHAT_MAX_LENGTH, QUICK_REACTIONS, canSend, rivalLine, sanitizeMessage } from '../../shared/chat.js';
import { driverCode } from '../../shared/content.js';
import { escapeHtml as e } from './icons.js';

// Local stand-in for a chat channel. A multiplayer build sends player messages to the server,
// which applies the same shared rules and broadcasts them to every screen.
let messages = [], lastSentAt = null, lastRivalAt = -100, clock = 0, sent = 0, pendingReply = null;
export function resetRaceChat() { messages = []; lastSentAt = null; lastRivalAt = -100; clock = 0; sent = 0; pendingReply = null; }

const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function add(message) { messages.push({ ...message, at: clock }); messages = messages.slice(-CHAT_HISTORY); paint(); }

export function renderRaceChat(drivers) {
  return `<div class="race-chat" id="race-chat"><div class="chat-header"><span class="live-dot"></span><strong>Live chat</strong><small>${drivers} drivers</small></div><div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="Race chat"></div><div class="chat-reactions" role="group" aria-label="Quick reactions">${QUICK_REACTIONS.map(reaction => `<button type="button" data-action="chat-react" data-text="${reaction}">${reaction}</button>`).join('')}</div><form class="chat-form" id="chat-form"><input id="chat-input" maxlength="${CHAT_MAX_LENGTH}" placeholder="Say something to the grid…" autocomplete="off" aria-label="Chat message"><button type="submit">Send</button></form><small class="chat-note">Be kind. One message every 2 seconds.</small></div>`;
}

function paint() {
  const list = document.querySelector('#chat-messages');
  if (!list) return;
  const pinned = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  list.innerHTML = messages.map(message => message.kind === 'control'
    ? `<p class="chat-msg control ${message.tone || ''}"><time>${time(message.at)}</time><span>${e(message.text)}</span></p>`
    : `<p class="chat-msg ${message.kind}"><time>${time(message.at)}</time><b style="--driver:${message.color}">${e(message.code)}</b><span>${e(message.text)}</span></p>`).join('');
  if (pinned) list.scrollTop = list.scrollHeight;
}

// Race control: what happened, from the stewards' point of view.
export function chatControl(text, tone = '') { add({ kind: 'control', text, tone }); }

// Incidents of the same kind within two race seconds share one line, so a first-lap pile-up stays readable.
export function chatIncident(event, code) {
  const fire = event.type === 'fire', recent = messages.findLast(message => message.group === event.type && clock - message.at <= 2);
  if (recent && !fire) { recent.codes.push(code); recent.text = `🟡 ${event.title} · ${recent.codes.join(', ')}`; paint(); return; }
  add({ kind: 'control', group: event.type, codes: [code], tone: fire ? 'red' : 'yellow', text: fire ? `🔴 ${code} · ${event.title} · retiring` : `🟡 ${event.title} · ${code} · +${event.loss.toFixed(1)}s` });
}

// Rival drivers react to real events, at most one line every few race seconds so the chat stays readable.
export function chatRival(driver, kind, seed, force = false) {
  if (!driver || driver.id === 'you' || (!force && clock - lastRivalAt < 3)) return;
  const text = rivalLine(kind, driver.id, seed);
  if (!text) return;
  lastRivalAt = clock;
  add({ kind: 'rival', code: driverCode(driver), color: driver.color, text });
}

// Returns an error message for the player, or null when the message was posted.
export function sendPlayerMessage(text, player, now = performance.now()) {
  if (!canSend(lastSentAt, now)) return 'Wait a moment before sending again.';
  const clean = sanitizeMessage(text);
  if (!clean) return 'Type a message first.';
  lastSentAt = now; sent++;
  add({ kind: 'you', code: 'YOU', color: player.color || '#ff3b38', text: clean });
  pendingReply = { at: clock + 1.5, seed: sent };
  return null;
}

// Called with every broadcast frame: keeps the clock and lets a nearby rival answer the player.
export function tickRaceChat(elapsed, rows) {
  clock = elapsed;
  if (pendingReply && elapsed >= pendingReply.at) {
    const you = rows.find(row => row.id === 'you');
    const neighbour = rows.find(row => !row.retired && row.position === you.position - 1) || rows.find(row => !row.retired && row.id !== 'you');
    chatRival(neighbour, 'reply', pendingReply.seed, true); pendingReply = null;
  }
}
