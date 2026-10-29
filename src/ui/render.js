import { BUDGET, DEMO_TEAMS, PARTS, PRACTICE_RUNS, RACE_LAPS, SLOT_LABELS, SLOTS, driverCode } from '../../shared/content.js';
import { INCIDENTS, incidentFixes, latestTest, raceRiskForecast, sensorWarnings } from '../../shared/engineering.js';
import { incidentImpact } from '../../shared/race.js';
import { changedSlots } from '../../shared/game.js';
import { buildStats } from '../../shared/simulation.js';
import { CONDITIONS } from '../../shared/conditions.js';
import { trackById } from '../../shared/tracks.js';
import { renderSectionForecast } from './track-ui.js';
import { escapeHtml as e, icon, slotIcon } from './icons.js';
import { renderTimingTower, renderRaceActions } from './race-ui.js';
import { renderPartShelf } from './engineering-ui.js';
import { renderRaceChat } from './race-chat.js';
import { teamLogo } from './team-logo.js';

export function renderShell() {
  return `
    <header class="site-header">
      <a class="brand" href="#" data-action="home" aria-label="AI Grand Prix home"><span class="brand-mark"><i></i><i></i><i></i><i></i><i></i></span><span>AI GRAND PRIX<span class="brand-sub">ENGINEER YOUR ADVANTAGE.</span></span></a>
      <nav class="main-nav" aria-label="Main navigation"><button class="nav-link active" data-action="workshop">Pit garage</button><button class="nav-link" data-action="showroom">Showroom</button><button class="nav-link" data-action="tracks">Tracks <span class="tiny">03</span></button></nav>
      <div class="header-right"><span class="preview-label"><span></span>PLAYABLE PROTOTYPE</span><button class="profile-button" data-action="profile" aria-label="Set up your garage">${icon('user')}<span id="profile-label">Your garage</span>${icon('chevron')}</button></div>
    </header>
    <main class="app-main">
      <div class="round-bar"><button class="round-location" data-action="briefing"><span class="location-icon" id="round-icon">${icon('sun')}</span><span><small id="round-number">GRAND PRIX 01 / 03</small><strong><span id="round-title">Dune Valley</span> ${icon('chevron')}</strong></span></button><div id="steps" class="steps" aria-label="Round progress"></div><button class="help-link" data-action="help">${icon('help')} How to play</button></div>
      <section class="page-heading"><div><div class="eyebrow" id="eyebrow">THE PADDOCK</div><h1 id="heading">Your race starts in the garage.</h1><p id="subheading">Read the terrain. Find your combination. Learn with every run.</p></div></section>
      <section class="workspace" aria-label="Race car garage">
        <aside class="parts-panel" id="parts-panel" aria-label="Parts bench"></aside>
        <div class="scene-column"><div class="scene-card">
          <div id="scene" class="scene"></div>
          <div class="scene-top"><div class="rover-label"><span class="status-dot"></span><span id="rover-title">CAR 07 <span>/ PERFORMANCE LAB</span></span></div><div class="view-switch" aria-label="Preview view"><button data-action="view" data-view="rover" class="selected" aria-pressed="true">${icon('box')} Garage</button><button data-action="view" data-view="course" aria-pressed="false">${icon('route')} Circuit</button></div></div>
          <div id="run-overlay" class="run-overlay" hidden></div><div class="corner-readout" id="corner-readout" hidden><strong id="race-zone"></strong><span id="race-advantage"></span></div><div id="broadcast-tools" class="broadcast-tools" hidden></div><div id="incident-banner" class="incident-banner" hidden></div><div id="incident-card" class="incident-card" role="status" hidden></div><div id="incident-page" class="incident-page" role="dialog" aria-labelledby="incident-page-title" hidden></div><div id="race-callout" class="race-callout" hidden></div><div id="demo-caption" class="demo-caption" hidden></div>
          <div class="scene-bottom"><span id="scene-hint">${icon('eye')} DRAG TO LOOK AROUND</span><button class="icon-button" data-action="camera" aria-label="Reset camera">${icon('reset')}</button></div>
        </div></div>
        <aside id="engineering-panel" class="engineering-panel" aria-label="Car stats"></aside>
        <section class="intel-panel" id="intel-panel" aria-label="Run reports"></section>
      </section>
      <div id="action-bar" class="action-bar"></div>
      <footer class="app-footer"><span>Every millisecond matters. <span class="footer-divider">/</span> ADSC × AI GRAND PRIX</span><span>${RACE_LAPS} laps · ~3 minutes · ${DEMO_TEAMS.length + 1} cars <button data-action="reset" aria-label="Restart this round">${icon('reset')} Restart</button></span></footer>
    </main>
    <dialog id="dialog" aria-labelledby="dialog-title"></dialog>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

export function renderSteps(state) {
  const active = state.phase === 'practice' ? 1 : ['qualifying', 'adjust'].includes(state.phase) ? 2 : 3;
  return ['Briefing', 'Build & test', 'Qualifying', 'Race & reveal'].map((label, i) => `<div class="step ${i === active ? 'current' : i < active ? 'complete' : ''}" ${i === active ? 'aria-current="step"' : ''}><span>${i < active ? icon('check') : `0${i + 1}`}</span>${label}</div>${i < 3 ? '<span class="step-line"></span>' : ''}`).join('');
}

export function renderParts(state, ui) {
  if (state.phase === 'race') return renderTimingTower(state.race);
  if (state.phase === 'results') return renderResults(state);
  const stats = buildStats(state.build), left = BUDGET - stats.cost;
  const category = ui.category;
  return `<div class="shelf-head"><div class="panel-title"><h2>Parts shelf</h2><span class="small-mono">0${SLOTS.length} SLOTS</span></div>
    <div class="budget"><div><span>Build budget</span><em class="budget-short">Budget</em><strong>${stats.cost}<span> / ${BUDGET}</span></strong></div><div class="budget-track"><i style="width:${Math.min(100, stats.cost / BUDGET * 100)}%"></i></div><small>${left} credits left</small></div>
    <div class="part-tabs" role="tablist" aria-label="Part category">${SLOTS.map(slot => `<button role="tab" aria-selected="${category === slot}" class="${category === slot ? 'selected' : ''}" data-action="category" data-category="${slot}">${icon(slotIcon[slot])}<span>${SLOT_LABELS[slot]}</span></button>`).join('')}</div></div>
    <div class="parts-shelf" role="tabpanel" aria-label="${SLOT_LABELS[category]} options">${renderPartShelf(state,category,ui.busy,ui.suggested)}</div>
    ${category === 'sensor' ? `<p class="bench-tip">${icon('info')}Your first test locks the sensor in for this round. A better sensor warns about more kinds of trouble.</p>` : state.phase === 'adjust' ? `<p class="bench-tip">${icon('info')}${changedSlots(state).length} of 2 slots changed. Reverting a slot frees it again.</p>` : ''}`;
}

// One card per run (two tests, then qualifying), each showing its delta against the run before it.
function renderLapCards(state) {
  const slots = [0, 1].map(i => ({ label: `Test ${i + 1}`, run: state.runs[i], replay: i }));
  slots.push({ label: 'Qualifying', run: state.qualifying, replay: null });
  const last = slots.findLastIndex(slot => slot.run);
  return `<div class="lap-cards">${slots.map(({ label, run, replay }, i) => {
    if (!run) return `<div class="lap-card is-empty"><span class="eyebrow">${label}</span><strong>--</strong></div>`;
    const before = slots.slice(0, i).findLast(slot => slot.run)?.run, delta = before ? before.time - run.time : null;
    const change = delta === null ? '' : `<span class="${delta >= 0 ? 'positive' : 'negative'}">${delta >= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(2)}s</span>`;
    return `<div class="lap-card ${i === last ? 'run-time' : ''}"><span class="eyebrow">${label}</span><strong>${run.time.toFixed(2)}<small>s</small></strong>${change}${replay === null ? '' : `<button class="lap-replay" data-action="watch-run" data-run="${replay}" aria-label="Watch ${label} again">${icon('play')}</button>`}</div>`;
  }).join('')}</div>`;
}

// A short test lap cannot show late-race problems, so the report forecasts them from the fitted parts.
function renderRisks(state) {
  const { seen: risks, hidden } = sensorWarnings(state.build.sensor, raceRiskForecast(latestTest(state).build, trackById(state.trackId)));
  const blind = hidden ? `<p class="risks-blind">${icon('info')} ${hidden} more your sensor cannot read.</p>` : '';
  if (!risks.length) return `<div class="race-risks clean"><span class="eyebrow">WARNINGS</span><p>${icon('check')} ${hidden ? 'None your sensor can read.' : 'None. Clean car.'}</p>${blind}</div>`;
  return `<div class="race-risks"><span class="eyebrow">WARNINGS · ${risks.length}</span>${risks.map(risk => `<div class="risk"><div><strong>${risk.title}</strong><small>${risk.retirement ? `Retires on lap ${risk.laps.at(-1)}` : `Lap ${risk.laps.join(' & ')} · costs ${risk.loss.toFixed(1)}s`}</small></div><button class="button small primary" data-action="fix-risk" data-type="${risk.type}" ${['practice', 'adjust'].includes(state.phase) ? '' : 'disabled'}>Fix it</button></div>`).join('')}${blind}</div>`;
}

// Panel under the garage: lap times for every run, then the latest run report with its warnings.
export function renderIntel(state, ui) {
  if (state.phase === 'results') return '';
  if (state.phase === 'race') return renderRaceChat(state.race.field.length);
  if (ui.busy) return '';
  if (!latestTest(state)) return `<div class="notes-body"><p class="notes-empty">${icon('info')} Test your car to see lap times and warnings.</p></div>`;
  return `${renderLapCards(state)}<div class="notes-body">${renderRisks(state)}${renderSectionForecast(state)}</div>`;
}

export function renderActions(state, ui) {
  if (state.phase === 'race' && ui.busy) return renderRaceActions(state.race);
  if (ui.busy) return `<div class="action-context">${icon('route')}<div><strong>${ui.runLabel}</strong><span>Your build is locked while your car is on track.</span></div></div><button class="button dark" data-action="skip-run">Skip animation ${icon('arrow')}</button>`;
  if (state.phase === 'results') return `<div class="action-context">${icon('trophy')}<div><strong>A little wiser. Ready for the next one.</strong><span>Your round: ${state.score.total} points · race finish + optional bonus</span></div></div><div class="action-buttons"><button class="button light" data-action="reset">${icon('reset')} Start fresh</button><button class="button primary" data-action="rebuild">${icon('box')} Rebuild from this car</button></div>`;
  if (state.phase === 'adjust') return `<div class="action-context"><span class="attempt-pips">${[0, 1].map(i => `<i class="${i < changedSlots(state).length ? 'used' : ''}"></i>`).join('')}</span><div><strong>${2 - changedSlots(state).length} slot changes available</strong><span>Revert any changed slot to free it again. Budget stays at ${BUDGET}.</span></div></div><div class="action-buttons"><button class="button light" data-action="open-chapter" data-chapter="exam">See qualifying report</button><button class="button primary" data-action="race">Lock build & race ${icon('flag')}</button></div>`;
  const left = PRACTICE_RUNS - state.runs.length;
  return `<div class="action-context"><span class="attempt-pips">${[0, 1].map(i => `<i class="${i >= left ? 'used' : ''}"></i>`).join('')}</span><div><strong>${left} practice run${left === 1 ? '' : 's'} left</strong><span>${state.runs.length ? 'Change one thing, test again.' : 'Fit your parts, check the specs, then test your car.'}</span></div></div><div class="action-buttons"><button class="button light" data-action="qualify">Ready to qualify ${icon('arrow')}</button><button class="button primary" data-action="test" ${left === 0 ? 'disabled' : ''}>${icon('play')} Test car <span>${left}/2</span></button></div>`;
}

// Every incident in the race, with what it cost. Pure data, cached because impacts re-sample the race.
let reelCache = { key: null, items: [] };
function incidentReel(race) {
  const key = race.field.map(car => `${car.id}:${car.result.time}`).join() + race.boosts.length;
  if (reelCache.key !== key) reelCache = { key, items: race.field.flatMap(car => car.incidents.map(event => ({ car, event, impact: incidentImpact(race, car.id, event) }))) };
  return reelCache.items;
}
const replayButton = item => `<button class="button small light" data-action="replay" data-driver-id="${e(item.car.id)}" data-distance="${item.event.distance}">${icon('play')} Replay</button>`;

function renderResults(state) {
  const you = state.field.find(entry => entry.id === 'you'), reel = incidentReel(state.race);
  const mine = reel.filter(item => item.car.id === 'you');
  // One dramatic example of each problem the player did not have, so the field teaches too.
  const others = [...new Map(reel.filter(item => item.car.id !== 'you' && !mine.some(own => own.event.type === item.event.type))
    .sort((a, b) => (b.impact.retired - a.impact.retired) || (b.impact.after - b.impact.before) - (a.impact.after - a.impact.before))
    .map(item => [item.event.type, item])).values()].slice(0, 3);
  const finisher = place => state.field.find(entry => entry.place === place && !entry.retired);
  return `<div class="eyebrow">CHEQUERED FLAG / ${RACE_LAPS} LAPS</div><div class="finish-place"><span>${you.retired?'OUT':String(you.place).padStart(2, '0')}</span><div><strong>${you.retired?'Retired':`P${you.place} of ${state.field.length}`}</strong><p>${you.retired?'Brake fire · did not finish':`${you.result.time.toFixed(2)} seconds`} · ${e(state.profile.team.name)}</p></div>${teamLogo(state.profile.team, state.profile.livery, 'result-logo')}</div>
    <div class="podium">${[2, 1, 3].map(place => finisher(place)).map((entry, i) => entry ? `<div class="step-${[2, 1, 3][i]} ${entry.id === 'you' ? 'is-you' : ''}"><i style="background:${entry.color}"></i><strong>${driverCode(entry)}</strong><span>P${[2, 1, 3][i]}</span></div>` : '').join('')}</div>
    <div class="score-breakdown"><div><span>Race finish</span><strong>+${state.score.race}</strong></div><div class="score-total"><span>Round points</span><strong>${state.score.total}<small> PTS</small></strong></div></div>
    <div class="race-debrief"><span class="eyebrow">YOUR INCIDENT REEL</span>${mine.length ? mine.map(item => { const fixes = incidentFixes(state.build, item.event.type, trackById(state.trackId)).slice(0, 2); return `<div class="reel-item"><div><strong>Lap ${item.event.lap} · ${item.event.title}</strong><span>${item.impact.retired ? 'RETIRED' : `+${item.event.loss.toFixed(1)}s · P${item.impact.before} → P${item.impact.after}`}</span></div><p>${fixes.length ? `Next time: ${fixes.map(fix => `${fix.name} (${fix.cost > 0 ? '+' : ''}${fix.cost} cr)`).join(' or ')}.` : item.event.remedy}</p>${replayButton(item)}</div>`; }).join('') : '<p>A clean race. Your setup avoided every handling and cooling incident.</p>'}</div>
    ${others.length ? `<div class="race-debrief field-reel"><span class="eyebrow">LEARN FROM THE FIELD</span>${others.map(item => `<div class="reel-item"><div><strong>${e(item.car.name)} · ${item.event.title}</strong><span>${item.impact.retired ? 'RETIRED' : `P${item.impact.before} → P${item.impact.after}`}</span></div><p>${item.event.cause}</p>${replayButton(item)}</div>`).join('')}</div>` : ''}
    <details class="full-classification"><summary>Full classification · ${state.field.length} cars</summary><div class="standings">${state.field.map(entry => `<div class="${entry.id === 'you' ? 'is-you' : ''}"><span>${entry.place}</span><i style="background:${entry.color}"></i><strong>${e(entry.name)}${entry.id === 'you' ? '<small> YOU</small>' : ''}<em class="standing-team">${e(entry.team)}</em></strong><span>${entry.retired?'RETIRED':`${entry.result.time.toFixed(2)}s`}</span></div>`).join('')}</div></details>`;
}
