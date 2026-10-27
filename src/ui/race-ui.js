import { BOOST_COOLDOWN, RACE_LAPS, driverCode } from '../../shared/content.js';
import { fastestLap, findBattles, incidentImpact } from '../../shared/race.js';
import { CONDITIONS } from '../../shared/conditions.js';
import { trackById, trackZone } from '../../shared/tracks.js';
import { escapeHtml as e, icon } from './icons.js';
import { chatControl, chatIncident, chatRival, resetRaceChat, tickRaceChat } from './race-chat.js';

// Short tags keep the 20-row tower readable.
const TAG = { wheelspin: 'SPIN', understeer: 'WIDE', overheat: 'HOT', brakefade: 'BRAKES', contact: 'KERB', fire: 'FIRE' };

// Broadcast state for one race. Reset before every race.
let seen = new Set(), lightsOut = false, yourCall = null, lastPositions = new Map(), callouts = [], callout = null, announced = new Set(), bestLap = null, banner = null, impact = null, finalLap = false;
export function resetRaceBroadcast() {
  resetRaceChat(); seen = new Set(); lightsOut = false; yourCall = null; lastPositions = new Map(); callouts = []; callout = null; announced = new Set(); bestLap = null; banner = null; impact = null; finalLap = false;
}

export function renderTimingTower(race) {
  return `<div class="tower-header"><span class="live-tag">${icon('flag')} LIVE TIMING</span><h2>${trackById(race.trackId).title.toUpperCase()} <span>GRAND PRIX</span></h2><div class="tower-meta"><span>${RACE_LAPS} LAPS</span><span>~2½ MIN</span><span>${race.field.length} CARS</span></div></div><div class="tower-columns"><span>POS / DRIVER</span><span>GAP</span></div><div id="live-standings" style="--rows:${race.field.length}">${race.field.map(entry => `<div style="--rank:${entry.grid - 1}" data-position="${entry.grid}" class="timing-row ${entry.id === 'you' ? 'is-you' : ''}" data-driver-row="${entry.id}"><strong class="live-position">${entry.grid}</strong><i style="background:${entry.color}"></i><div class="timing-name"><strong><span class="code">${driverCode(entry)}</span>${e(entry.name)}${entry.id === 'you' ? '<em>YOU</em>' : ''}</strong><small></small></div><span class="live-gap">GRID</span><span class="position-change"></span></div>`).join('')}</div><div class="race-engineer"><div class="eyebrow">${icon('sound')} RACE ENGINEER</div><p id="race-radio">Grid is set. Watch the lights.</p></div><div class="car-condition"><div><span>COOLING LOAD</span><strong id="heat-value">—</strong><i><b id="heat-meter"></b></i></div><div><span>TYRE LIFE</span><strong id="tyre-value">—</strong><i><b id="tyre-meter"></b></i></div></div>`;
}
export function renderRaceActions(race) {
  return `<div class="action-context"><div class="energy-cells">${[0, 1, 2].map(i => `<i class="${i < race.charges ? 'charged' : ''}"></i>`).join('')}</div><div><strong>ERS <span id="ers-charges">${race.charges}/3</span></strong><span id="ers-hint">Three bursts. Choose your moment.</span></div></div><div class="action-buttons"><button class="button light" data-action="skip-run">Skip to finish ${icon('arrow')}</button><button class="button primary ers-button" data-action="boost" disabled>${icon('bolt')} <span class="ers-label">Deploy ERS</span><kbd>SPACE</kbd></button></div>`;
}
export function renderBroadcastTools(demo = false) {
  return `<div class="race-cameras" role="group" aria-label="Spectator camera">${demo ? '' : '<button data-action="race-camera" data-camera="director" class="selected" aria-pressed="true">TV director</button>'}<button data-action="race-camera" data-camera="overview" aria-pressed="false">Circuit</button><button data-action="race-camera" data-camera="you" class="${demo ? 'selected' : ''}" aria-pressed="${demo}">Follow me</button></div><div class="playback-controls"><button data-action="pause-race" aria-label="Pause race" aria-pressed="false">Ⅱ</button><button data-action="race-speed" aria-label="Change playback speed">1×</button></div>`;
}

// ERS is most useful when the car ahead is close enough to pass.
const ATTACK_GAP = .5;
function queueCallout(kind, title, detail, elapsed) { if (callouts.length < 4) callouts.push({ kind, title, detail, queued: elapsed }); }

// Overtakes, fastest laps, battles and the final lap, one TV graphic at a time.
function updateCallouts(race, rows, elapsed, started) {
  if (!started) return;
  const you = rows.find(row => row.id === 'you');
  for (const row of rows) {
    const previous = lastPositions.get(row.id);
    if (previous && row.position < previous && !row.retired && elapsed > 4) {
      const passed = rows.find(other => other.position === row.position + 1);
      if (passed && !passed.retired && (row.position <= 3 || row.id === 'you' || passed.id === 'you'))
      {
        queueCallout('overtake', 'OVERTAKE', `${driverCode(row)} passes ${driverCode(passed)} for P${row.position}`, elapsed);
        // Alternate who speaks; when you are passed, the rival who passed you always does.
        const winnerSpeaks = passed.id === 'you' || Math.round(elapsed) % 2 === 1;
        chatRival(winnerSpeaks ? row : passed, winnerSpeaks ? 'overtakeWinner' : 'overtakeLoser', Math.floor(elapsed));
      }
    }
  }
  const best = fastestLap(rows);
  if (best && (!bestLap || best.time < bestLap.time - 1e-6)) { if (bestLap) { queueCallout('fastest', 'FASTEST LAP', `${best.name} · ${best.time.toFixed(2)}s · lap ${best.lap}`, elapsed); chatControl(`💜 Fastest lap: ${best.name} · ${best.time.toFixed(2)}s`, 'purple'); chatRival(rows.find(row => row.id === best.id), 'fastest', best.lap); } bestLap = best; }
  for (const battle of findBattles(rows, .6)) {
    const key = `${battle.ahead.id}:${battle.behind.id}:${Math.floor(elapsed / 25)}`;
    if ((battle.position <= 3 || [battle.ahead.id, battle.behind.id].includes('you')) && !announced.has(key)) {
      announced.add(key); queueCallout('battle', `BATTLE FOR P${battle.ahead.position}`, `${driverCode(battle.ahead)} vs ${driverCode(battle.behind)} · ${battle.gap.toFixed(1)}s`, elapsed);
    }
  }
  if (!finalLap && rows[0].lap === race.laps) { finalLap = true; chatControl('🏁 Final lap!', 'final'); chatRival(rows.find(row => row.id !== 'you' && !row.retired), 'final', race.laps, true); queueCallout('final', 'FINAL LAP', you.retired ? 'Watch the fight for the podium.' : `You are P${you.position}. Use what ERS you have left.`, elapsed); }
  if (!callout || elapsed - callout.shown > 3.2) { callout = callouts.shift() || null; if (callout) callout.shown = elapsed; }
  const element = document.querySelector('#race-callout');
  if (!element) return;
  element.hidden = !callout;
  if (callout && element.dataset.key !== `${callout.kind}:${callout.detail}`) {
    element.dataset.key = `${callout.kind}:${callout.detail}`; element.dataset.kind = callout.kind;
    element.innerHTML = `<span>${callout.title}</span><strong>${e(callout.detail)}</strong>`;
  }
}

// The lower-third: the incident the director is showing, then its impact once the car recovers.
function updateBanner(race, rows, elapsed, director) {
  const element = document.querySelector('#incident-banner');
  if (!element) return;
  const focus = director?.incident ? rows.find(row => row.id === director.focus && row.incident) : null;
  const you = rows.find(row => row.id === 'you');
  const fire = rows.find(row => row.incident?.type === 'fire' && !row.retired);
  const current = fire || focus || (you.incident && !you.retired ? you : null) || (!director?.focus ? rows.find(row => row.incident && !row.retired) : null);
  if (current) {
    const event = race.field.find(car => car.id === current.id).incidents.find(item => item.distance === current.incident.distance && item.type === current.incident.type);
    if (!banner || banner.id !== current.id || banner.event !== event) banner = { id: current.id, row: current, event };
    impact = null;
  } else if (banner) {
    // The car has recovered. Show what the incident cost before clearing it.
    const { id, event } = banner; banner = null;
    impact = { ...incidentImpact(race, id, event), id, event, name: rows.find(row => row.id === id).name, until: elapsed + 5 };
  }
  if (impact && elapsed > impact.until) impact = null;
  element.hidden = !banner && !impact;
  if (banner) {
    const { row, event } = banner, key = `live:${row.id}:${event.type}:${event.lap}`;
    element.dataset.incidentType = event.type; element.dataset.mode = 'live';
    if (element.dataset.key !== key) {
      element.dataset.key = key;
      element.innerHTML = `<span class="flag ${event.type === 'fire' ? 'red' : 'yellow'}">${event.type === 'fire' ? 'RED ALERT' : 'YELLOW FLAG'} · ${e(trackZone(trackById(race.trackId), event.distance).name)}</span><strong><b>${driverCode(row)}</b> ${e(row.name)} · ${e(event.title)}</strong><div><small>${event.type === 'fire' ? 'Race-ending failure · retirement' : `Time cost +${event.loss.toFixed(1)}s`}</small><button data-action="follow-incident" data-driver-id="${e(row.id)}">Follow ${e(row.name)} ${icon('eye')}</button></div>`;
    }
  } else if (impact) {
    const key = `impact:${impact.id}:${impact.event.type}:${impact.event.lap}`;
    element.dataset.incidentType = impact.event.type; element.dataset.mode = 'impact';
    if (element.dataset.key !== key) {
      element.dataset.key = key;
      const places = impact.after - impact.before, passed = impact.passedBy.map(name => name.split(' ').at(-1));
      element.innerHTML = `<span class="flag green">IMPACT · LAP ${impact.event.lap}</span><strong><b>${driverCode({ id: impact.id, name: impact.name })}</b> ${e(impact.name)} · ${impact.retired ? 'OUT OF THE RACE' : `P${impact.before} → P${impact.after}`}</strong><div><small>${impact.retired ? 'Brake fire · zero race points' : places > 0 ? `${e(impact.event.title)} cost ${impact.loss.toFixed(1)}s. Passed by ${e(passed.slice(0, 3).join(', '))}${passed.length > 3 ? ` +${passed.length - 3}` : ''}.` : `${e(impact.event.title)} cost ${impact.loss.toFixed(1)}s, but held position.`}</small><button data-action="follow-incident" data-driver-id="${e(impact.id)}">Follow ${e(impact.name)} ${icon('eye')}</button></div>`;
    }
  }
}

export function updateRaceBroadcast(race, broadcast) {
  const { rows, elapsed, started, lights, paused, speed, director } = broadcast, you = rows.find(row => row.id === 'you'), leader = rows[0];
  const table = document.querySelector('#live-standings');
  if (!table) return;
  tickRaceChat(elapsed, rows);
  if (started && !lightsOut) { lightsOut = true; chatControl(`🟢 Lights out! ${rows.length} cars away.`, 'green'); }
  updateCallouts(race, rows, elapsed, started);
  for (const row of rows) {
    const element = table.querySelector(`[data-driver-row="${row.id}"]`); if (!element) continue;
    element.querySelector('.live-position').textContent = row.retired ? 'OUT' : row.position;
    const oldPosition = Number(element.dataset.position);
    if (oldPosition !== row.position) { element.dataset.position = String(row.position); element.style.setProperty('--rank', row.position - 1); element.classList.toggle('moving-up', row.position < oldPosition); element.classList.toggle('moving-down', row.position > oldPosition); }
    element.setAttribute('aria-label', `${row.position}. ${row.name}${row.retired ? ', retired' : ''}`);
    element.querySelector('.live-gap').textContent = !started ? `P${row.grid}` : row.retired ? 'RETIRED' : row.finished ? 'FINISHED' : row.position === 1 ? 'LEADER' : `+${row.gap.toFixed(2)}`;
    element.querySelector('.timing-name>small').textContent = row.retired ? 'OUT' : row.incident ? TAG[row.incident.type] : row.warning ? `⚠ ${TAG[row.warning.type]}` : row.completedIncidents.length ? `×${row.completedIncidents.length}` : '';
    const gained = row.grid - row.position, change = element.querySelector('.position-change'); change.textContent = gained > 0 ? `▲${gained}` : gained < 0 ? `▼${-gained}` : '—'; change.className = `position-change ${gained > 0 ? 'up' : gained < 0 ? 'down' : ''}`;
    element.classList.toggle('deploying', row.boosting); element.classList.toggle('incident-row', !!row.incident); element.classList.toggle('warning-row', !row.incident && !!row.warning); element.classList.toggle('retired-row', row.retired); element.classList.toggle('scarred', !row.incident && row.completedIncidents.length > 0);
    for (const event of row.incidents) {
      const key = `${row.id}:${event.lap}:${event.type}`;
      if (row.virtualTime >= event.start && !seen.has(key)) { seen.add(key); chatIncident(event, driverCode(row)); chatRival(row, event.type, event.lap, event.type === 'fire'); }
    }
    // Your position changes are summarised at most every five race seconds.
    if (row.id === 'you' && started && !row.retired) {
      if (!yourCall) yourCall = { position: row.grid, at: elapsed };
      if (row.position !== yourCall.position && elapsed - yourCall.at >= 5) {
        const gained = row.position < yourCall.position;
        chatControl(`You ${gained ? 'move up to' : 'drop to'} P${row.position} (${gained ? '+' : '−'}${Math.abs(row.position - yourCall.position)})`, gained ? 'gain' : 'loss');
        yourCall = { position: row.position, at: elapsed };
      }
    }
    lastPositions.set(row.id, row.position);
  }
  updateBanner(race, rows, elapsed, director);

  const ahead = rows.find(row => row.position === you.position - 1), behind = rows.find(row => row.position === you.position + 1 && !row.retired);
  const gapAhead = ahead && !you.retired && !you.finished ? you.gap - ahead.gap : null, gapBehind = behind && !you.retired && !you.finished ? behind.gap - you.gap : null;
  const uses = race.boosts.filter(boost => boost.id === 'you'), cooldown = uses.length ? Math.max(0, BOOST_COOLDOWN - (elapsed - uses.at(-1).at)) : 0;
  const ersReady = started && !paused && race.charges > 0 && cooldown === 0 && !you.finished && !you.retired;
  const attack = ersReady && gapAhead !== null && gapAhead < ATTACK_GAP;
  const zone = document.querySelector('#race-zone'); if (zone) zone.textContent = you.retired ? 'RETIRED' : `YOU · P${you.position} · LAP ${you.lap} · ${you.zone.name} · ${CONDITIONS[you.zone.condition].label.toUpperCase()}`;
  const gaps = document.querySelector('#race-advantage');
  if (gaps) {
    gaps.textContent = you.retired ? 'Cooling failure ended your race' : you.finished ? 'Chequered flag' : `${ahead ? `${driverCode(ahead)} ahead ${gapAhead.toFixed(1)}s` : 'Leading the race'}${behind ? ` · ${driverCode(behind)} behind ${gapBehind.toFixed(1)}s` : ''}${attack ? ' · ATTACK: deploy ERS' : ''}`;
    gaps.classList.toggle('attack', attack);
  }
  const lap = document.querySelector('#race-lap'); if (lap) lap.textContent = `${String(leader.lap).padStart(2, '0')} / ${String(race.laps).padStart(2, '0')}`;
  const position = document.querySelector('#your-position'); if (position) position.textContent = you.retired ? 'OUT' : `P${you.position}`;
  const raceClock = document.querySelector('#race-clock'); if (raceClock) raceClock.textContent = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toFixed(1).padStart(4, '0')}`;
  const chapter = document.querySelector('#race-chapter'); if (chapter) chapter.textContent = paused ? 'PAUSED' : !started ? 'STARTING GRID' : leader.finished ? 'CHEQUERED FLAG' : leader.lap === race.laps ? 'FINAL LAP' : leader.lap <= 2 ? 'THE OPENING BATTLE' : leader.lap >= 6 ? 'THE FINAL PUSH' : 'THE LONG GAME';
  document.querySelectorAll('.start-lights>i').forEach((light, i) => light.classList.toggle('on', i < lights));
  const lightsElement = document.querySelector('.start-sequence'); if (lightsElement) lightsElement.hidden = started;
  const button = document.querySelector('[data-action="boost"]');
  if (button) { button.disabled = !ersReady; button.classList.toggle('attack', attack); button.querySelector('.ers-label').textContent = you.retired ? 'Car retired' : paused ? 'Race paused' : you.boosting ? 'ERS deployed' : cooldown > 0 ? 'Recharging' : race.charges === 0 ? 'ERS depleted' : attack ? 'Attack now' : 'Deploy ERS'; }
  const hint = document.querySelector('#ers-hint'); if (hint) hint.textContent = !started ? 'Wait for lights out.' : you.boosting ? 'Power deployed. Close the gap.' : cooldown > 0 ? `Recharging · ${Math.ceil(cooldown)} race seconds` : attack ? `Within a second of ${ahead.name}. Attack!` : 'Three bursts. Best used within half a second of the car ahead.';
  const radio = document.querySelector('#race-radio');
  if (radio) radio.textContent = you.retired ? 'Your car has retired. Its cooling could not last the race. Follow the remaining battle, then review the build.'
    : you.incident ? `${you.incident.title}. ${you.incident.remedy}`
    : you.warning ? you.warning.warning
    : !started ? `${you.name}, you start P${you.grid} of ${rows.length}. Eight laps. Make it count.`
    : you.finished ? 'Chequered flag. Bring it home.'
    : you.boosting ? 'Deploying ERS. You’ve got extra power.'
    : attack ? `${ahead.name} is ${gapAhead.toFixed(1)} seconds ahead. Deploy ERS and attack.`
    : leader.lap === race.laps ? 'Final lap. Use any energy you have left.'
    : you.position === 1 ? 'You’re leading. Keep the pace and protect the gap.'
    : `${ahead.name} is ahead. The gap is ${gapAhead.toFixed(1)} seconds.`;
  const heat = document.querySelector('#heat-value'), tyre = document.querySelector('#tyre-value');
  if (heat) { heat.textContent = you.retired ? 'FAILED' : you.heat > 85 ? 'CRITICAL' : you.heat > 68 ? 'WARM' : 'NORMAL'; document.querySelector('#heat-meter').style.width = `${you.heat}%`; heat.classList.toggle('hot', you.heat > 80); }
  if (tyre) { tyre.textContent = `${you.tyreLife}%`; document.querySelector('#tyre-meter').style.width = `${you.tyreLife}%`; }
  const pause = document.querySelector('[data-action="pause-race"]'); if (pause) { pause.textContent = paused ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label', paused ? 'Resume race' : 'Pause race'); pause.setAttribute('aria-pressed', String(!!paused)); }
  const speedButton = document.querySelector('[data-action="race-speed"]'); if (speedButton) speedButton.textContent = `${speed || 1}×`;
}
