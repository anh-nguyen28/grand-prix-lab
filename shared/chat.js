// Live race chat. Pure rules shared by the local prototype and a future server, which must enforce them too.
export const CHAT_MAX_LENGTH = 80;
export const CHAT_COOLDOWN_MS = 2000;
export const CHAT_HISTORY = 40;
export const QUICK_REACTIONS = ['🔥', '👏', '😮', '🏁', 'GG'];

// A short starter list for a classroom. Replace with the organisation's own list before a live event.
const BLOCKED = ['damn', 'hell', 'stupid', 'idiot', 'loser', 'shut up', 'hate'];
const blockedPattern = new RegExp(`\\b(${BLOCKED.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(' ', '\\s+')).join('|')})\\b`, 'gi');

// Returns clean text, or null when there is nothing worth sending.
export function sanitizeMessage(text) {
  const clean = String(text ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LENGTH);
  if (!clean) return null;
  return clean.replace(blockedPattern, match => '•'.repeat(match.length));
}

export function canSend(lastSentAt, now) {
  return lastSentAt === null || now - lastSentAt >= CHAT_COOLDOWN_MS;
}

function pick(lines, seed) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return lines[(hash >>> 0) % lines.length];
}

// Rival chatter is tied to something that really happened, and often to the part that caused it.
const LINES = {
  wheelspin: ['Wrong tyres for that surface. Lesson learned 😅', 'Should have listened to the warnings…', 'Zero grip out there!'],
  understeer: ['The front just would not turn 😬', 'Low downforce, wide line. Noted.', 'Missed the apex by a mile'],
  overheat: ['Temps through the roof 🥵', 'Power unit is cooking. Too greedy?', 'Losing power… cooling was the weak spot'],
  brakefade: ['Brakes are fading!', 'Pedal is going long into the corner'],
  contact: ['Hit the kerb 💥', 'Sparks everywhere, sorry!'],
  crash: ['That one hurt. Wrong car for this corner 😵', 'Went off. The setup was not ready for that', 'Big crash, big lesson'],
  aquaplane: ['Aquaplaning! No grip at all 🌊', 'Should have fitted wet tyres', 'Floating on the straight…'],
  coldslide: ['Tyres are not warm yet 🥶', 'No grip in the cold', 'Cold tyres, cold lap'],
  tyreshred: ['The grit is eating my tyres', 'Soft tyres were a mistake here', 'Tyres are shredded'],
  bumpbreak: ['The bumps are shaking the car apart', 'Stiff chassis was a mistake', 'Parts are rattling loose'],
  fire: ['FIRE?! That sprint package was a trap 🔥', 'Car is done. Cooling matters, everyone!'],
  overtakeWinner: ['See you! 👋', 'Clean move 😎', 'ERS timing paid off', 'Got you on the straight!'],
  overtakeLoser: ['Nooo, not on the straight', 'I will get you back', 'Fair move, well driven'],
  fastest: ['Purple lap! 💜', 'That lap felt fast', 'Setup is working now'],
  final: ['Last lap, everything left!', 'Bring it home 🏁', 'Final lap. Do not crash now'],
  reply: ['Good luck out there! 👍', 'Race you to the line!', 'See you at the finish 🏁', 'Nice one!', 'Focus! The gap is tiny 😅'],
};

export function rivalLine(kind, driverId, seed) {
  const lines = LINES[kind];
  return lines ? pick(lines, `${kind}:${driverId}:${seed}`) : null;
}
