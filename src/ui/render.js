import { BUDGET, PARTS, PRACTICE_RUNS, RACE_LAPS, SLOT_LABELS, SLOTS } from '../../shared/content.js';
import { changedSlots } from '../../shared/game.js';
import { buildStats } from '../../shared/simulation.js';
import { escapeHtml as e, icon, slotIcon } from './icons.js';
import { renderTimingTower, renderRaceActions } from './race-ui.js';
import { renderPartShelf } from './engineering-ui.js';

export function renderShell() {
  return `
    <header class="site-header">
      <a class="brand" href="#" data-action="home" aria-label="AI Grand Prix home"><span class="brand-mark"><i></i><i></i><i></i><i></i><i></i></span><span>AI GRAND PRIX<span class="brand-sub">ENGINEER YOUR ADVANTAGE.</span></span></a>
      <nav class="main-nav" aria-label="Main navigation"><button class="nav-link active" data-action="workshop">Pit garage</button><button class="nav-link" data-action="season">The season <span class="tiny">06</span></button></nav>
      <div class="header-right"><span class="preview-label"><span></span>PLAYABLE PROTOTYPE</span><button class="profile-button" data-action="profile" aria-label="Set up your garage">${icon('user')}<span id="profile-label">Your garage</span>${icon('chevron')}</button></div>
    </header>
    <main class="app-main">
      <div class="round-bar"><button class="round-location" data-action="briefing"><span class="location-icon">${icon('sun')}</span><span><small>GRAND PRIX 01 / 06</small><strong>Dune Valley ${icon('chevron')}</strong></span></button><div id="steps" class="steps" aria-label="Round progress"></div><button class="help-link" data-action="help">${icon('help')} How to play</button></div>
      <section class="page-heading"><div><div class="eyebrow" id="eyebrow">THE PADDOCK</div><h1 id="heading">Your race starts in the garage.</h1><p id="subheading">Read the terrain. Find your combination. Learn with every run.</p></div><button class="driver-identity" data-action="profile"><span class="identity-number">07</span><span><small>YOUR DRIVER</small><strong id="garage-driver-name">You</strong><em>Change name ${icon('chevron')}</em></span></button></section>
      <section class="workspace" aria-label="Race car garage">
        <aside class="parts-panel" id="parts-panel" aria-label="Parts bench"></aside>
        <div class="scene-column"><div class="scene-card">
          <div id="scene" class="scene"></div>
          <div class="scene-top"><div class="rover-label"><span class="status-dot"></span><span id="rover-title">CAR 07 <span>/ PERFORMANCE LAB</span></span></div><div class="view-switch" aria-label="Preview view"><button data-action="view" data-view="rover" class="selected" aria-pressed="true">${icon('box')} Garage</button><button data-action="view" data-view="course" aria-pressed="false">${icon('route')} Circuit</button></div></div>
          <div class="scene-number" aria-hidden="true">01<span>BUILT TO FIND THE LIMIT.</span></div>
          <div id="run-overlay" class="run-overlay" hidden></div><div class="corner-readout" id="corner-readout" hidden><strong id="race-zone"></strong><span id="race-advantage"></span></div><div id="broadcast-tools" class="broadcast-tools" hidden></div><div id="incident-banner" class="incident-banner" hidden></div><div id="demo-caption" class="demo-caption" hidden></div>
          <div class="scene-bottom"><span id="scene-hint">${icon('eye')} DRAG TO LOOK AROUND</span><button class="icon-button" data-action="camera" aria-label="Reset camera">${icon('reset')}</button></div>
        </div><div class="rover-stats" id="stats"></div><div id="engineering-panel" class="engineering-panel"></div><div class="course-strip"><span class="course-strip-title">THE CIRCUIT <small>3 SECTORS</small></span><span><i class="terrain-dot road"></i>Start / finish</span><span class="mystery-label"><i class="terrain-dot sand"></i>Mystery stretch ${icon('help')}</span><span><i class="terrain-dot rock"></i>Technical sector</span></div></div>
        <aside class="intel-panel" id="intel-panel" aria-label="Field notes and run feedback"></aside>
      </section>
      <div id="action-bar" class="action-bar"></div>
      <footer class="app-footer"><span>Every millisecond matters. <span class="footer-divider">/</span> ADSC × AI GRAND PRIX</span><span>${RACE_LAPS} laps · ~4 minutes · 6 drivers <button data-action="reset" aria-label="Restart this round">${icon('reset')} Restart</button></span></footer>
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
  const stats = buildStats(state.build), editable = ['practice', 'adjust'].includes(state.phase) && !ui.busy;
  const category = ui.category;
  return `<div class="panel-title"><h2>Parts shelf</h2><span class="small-mono">04 SLOTS</span></div>
    <div class="budget"><div><span>Build budget</span><strong>${stats.cost}<span> / ${BUDGET}</span></strong></div><div class="budget-track"><i style="width:${stats.cost}%"></i></div><small>${BUDGET - stats.cost} credits to play with · swaps refund the old part</small></div>
    <div class="part-tabs" role="tablist" aria-label="Part category">${SLOTS.map(slot => `<button role="tab" aria-selected="${category === slot}" class="${category === slot ? 'selected' : ''}" data-action="category" data-category="${slot}">${icon(slotIcon[slot])}<span>${SLOT_LABELS[slot]}</span></button>`).join('')}</div>
    <div class="assembly-instruction" id="assembly-instruction">${icon('box')} Drag a part onto your car.<br><span>Or tap a part, then its fitting point.</span></div>
    <div class="parts-shelf" role="tabpanel" aria-label="${SLOT_LABELS[category]} options">${renderPartShelf(state,category,ui.busy)}</div>
    <details class="assembly-list"><summary>YOUR CURRENT BUILD <span>4/4 fitted</span></summary>${SLOTS.map(slot => `<button data-action="category" data-category="${slot}"><span>${icon(slotIcon[slot])}${SLOT_LABELS[slot]}</span><strong>${PARTS[state.build[slot]].name}</strong>${icon('check')}</button>`).join('')}</details>
    <p class="bench-tip">${icon('info')}${category === 'sensor' ? 'Your first scan locks the sensor for this round. Each sensor offers enough evidence.' : state.phase === 'adjust' ? `${changedSlots(state).length} of 2 slots changed. Reverting a slot frees it again.` : 'Try a different combination. Every part changes how your car handles the course.'}</p>`;
}

function prediction(state, ui) {
  if (state.predictionLocked) return `<div class="prediction locked"><span class="eyebrow">OPTIONAL SURFACE BONUS</span><div>${icon('lock')}<strong>${state.prediction ? state.prediction.charAt(0).toUpperCase() + state.prediction.slice(1) : 'No prediction submitted'}</strong><span class="pill">LOCKED</span></div><p>${state.prediction ? 'The answer is revealed after the race.' : 'You can still earn all the race points.'}</p></div>`;
  return `<div class="prediction"><div class="eyebrow">OPTIONAL · +3 POINTS</div><h3>What surface is on the unmarked section?</h3><div class="guess-options" role="group" aria-label="Terrain prediction">${['road', 'sand', 'rock'].map(terrain => `<button class="${ui.guess === terrain ? 'selected' : ''}" aria-pressed="${ui.guess === terrain}" data-action="guess" data-terrain="${terrain}"><i class="terrain-dot ${terrain}"></i>${terrain[0].toUpperCase() + terrain.slice(1)}</button>`).join('')}</div><button class="button small full light" data-action="predict" ${!ui.guess || ui.busy ? 'disabled' : ''}>Submit bonus answer ${icon('lock')}</button><p>This answer awards <strong>3 bonus points</strong>; it does not change your car. Choose before your first test. Your tyres determine the actual grip.</p></div>`;
}

export function renderIntel(state, ui) {
  if (state.phase === 'results') return renderLesson(state);
  if (ui.busy) return `<div class="field-heading"><span class="eyebrow">${ui.runLabel.toUpperCase()}</span><h2>Let’s see what it can do.</h2><p>Your car is on the course. Its report will be ready at the finish line.</p></div><div class="run-takeaway">${icon('eye')}<p>Watch the mystery stretch and the climb. Where does your car lose time?</p></div>`;
  const hasRuns = state.runs.length > 0 || state.qualifying;
  const logs = ui.intelTab === 'runs' && hasRuns;
  return `<div class="intel-tabs"><button class="${!logs ? 'active' : ''}" data-action="intel-tab" data-tab="clues">Field notes</button><button class="${logs ? 'active' : ''}" data-action="intel-tab" data-tab="runs">Run log <span>${state.runs.length + (state.qualifying ? 1 : 0)}</span></button></div>${logs ? renderRunLog(state) : `<div class="track-brief"><span class="eyebrow">YOUR RACE BRIEF</span><h2>Build to finish.<br>Then build to win.</h2><p>Eight laps in the heat. Your car needs straight-line power, grip to turn, and enough cooling to last.</p><ul><li><strong>Long straight</strong><span>More output and less drag gain time.</span></li><li><strong>Hairpin + switchback</strong><span>Cornering grip keeps the car on line.</span></li><li><strong>Hot, long stint</strong><span>Cooling and durable tyres protect the finish.</span></li></ul><button class="button light small full" data-action="view" data-view="course">Inspect the circuit ${icon('route')}</button></div><details class="optional-puzzle"><summary>Optional surface puzzle <span>+3 PTS</span></summary><p class="bonus-purpose">Use three sensor clues to identify the unmarked surface. This is a separate learning bonus. You can test and race without answering.</p><div class="field-heading"><span class="eyebrow">A LITTLE RECON GOES A LONG WAY</span><h2>Read the terrain.</h2><p>One stretch is a mystery. Your sensor can help you figure it out.</p></div><div class="sensor-label">${icon('scan')}<span>${PARTS[state.build.sensor].name}</span><small>${state.clues.length}/3</small></div><div class="clue-list">${[0, 1, 2].map(i => `<div class="clue ${state.clues[i] ? 'revealed' : ''}"><span class="clue-number">${state.clues[i] ? icon('check') : `0${i + 1}`}</span><div><strong>Observation ${String(i + 1).padStart(2, '0')}</strong><p>${state.clues[i] || 'Waiting for a closer look…'}</p></div></div>`).join('')}</div><button class="button small full scan-button" data-action="scan" ${ui.busy || ui.scanning || state.clues.length === 3 || state.phase !== 'practice' ? 'disabled' : ''}>${icon(ui.scanning ? 'clock' : state.clues.length === 3 ? 'check' : 'scan')}${ui.scanning ? 'Reading the surface…' : state.clues.length === 3 ? 'All observations collected' : 'Scan mystery stretch'}</button>${prediction(state, ui)}</details>`}`;
}

function renderRunLog(state) {
  const result = state.qualifying || state.runs.at(-1);
  const previous = state.qualifying ? state.runs.at(-1) : state.runs.at(-2);
  const improvement = previous ? previous.time - result.time : null;
  return `<div class="field-heading"><span class="eyebrow">${state.qualifying ? 'QUALIFYING REPORT' : `PRACTICE RUN 0${state.runs.length}`}</span><h2>A run worth learning from.</h2></div><div class="run-time"><strong>${result.time.toFixed(2)}<small>s</small></strong>${improvement !== null ? `<span class="${improvement >= 0 ? 'positive' : 'negative'}">${improvement >= 0 ? '↓' : '↑'} ${Math.abs(improvement).toFixed(2)}s ${improvement >= 0 ? 'quicker' : 'slower'}</span>` : '<span>Your first benchmark</span>'}</div><div class="telemetry">${result.segments.map((segment, i) => `<div><span class="telemetry-number ${segment.good ? 'good' : ''}">${segment.good ? icon('check') : '!'}</span><div><h3>${segment.name}<small>${segment.time.toFixed(1)}s</small></h3><p>${segment.problem}</p>${!segment.good ? `<span class="suggestion">${segment.suggestion}</span>` : ''}</div></div>`).join('')}</div><div class="run-takeaway">${icon('bolt')}<p>${state.qualifying ? 'Your benchmark is set. Change up to two slots before the final race.' : state.runs.length === 1 ? 'Change one thing, then test again. See what actually makes a difference.' : 'Both practice runs are complete. You can keep editing before qualifying.'}</p></div>`;
}

export function renderStats(state) {
  const stats = buildStats(state.build);
  return `<div>${icon('box')}<span>WEIGHT<strong>${stats.weight}<small> kg</small></strong></span><div class="stat-bars">${bars(stats.weight, 14)}</div></div><div>${icon('bolt')}<span>POWER<strong>${stats.power}<small> units</small></strong></span><div class="stat-bars orange">${bars(stats.power, 35)}</div></div><div>${icon('wheel')}<span>LOOSE-GROUND GRIP<strong>${stats.grip < 0 ? 'Low' : stats.grip >= 4 ? 'Excellent' : 'Strong'}</strong></span><div class="stat-bars">${bars(stats.grip + 3, 7)}</div></div>`;
}
function bars(value, max) { return Array.from({ length: 7 }, (_, i) => `<i class="${i < value / max * 7 ? 'filled' : ''}"></i>`).join(''); }

export function renderActions(state, ui) {
  if (state.phase === 'race' && ui.busy) return renderRaceActions(state.race);
  if (ui.busy) return `<div class="action-context">${icon('route')}<div><strong>${ui.runLabel}</strong><span>Your build is locked while your car is on track.</span></div></div><button class="button dark" data-action="skip-run">Skip animation ${icon('arrow')}</button>`;
  if (state.phase === 'results') return `<div class="action-context">${icon('trophy')}<div><strong>A little wiser. Ready for the next one.</strong><span>Your round: ${state.score.total} points · race finish + optional bonus</span></div></div><div class="action-buttons"><button class="button light" data-action="reset">${icon('reset')} Try another build</button><button class="button primary" data-action="season">Explore the season ${icon('arrow')}</button></div>`;
  if (state.phase === 'adjust') return `<div class="action-context"><span class="attempt-pips">${[0, 1].map(i => `<i class="${i < changedSlots(state).length ? 'used' : ''}"></i>`).join('')}</span><div><strong>${2 - changedSlots(state).length} slot changes available</strong><span>Revert any changed slot to free it again. Budget stays at 100.</span></div></div><div class="action-buttons"><button class="button light" data-action="intel-tab" data-tab="runs">See qualifying report</button><button class="button primary" data-action="race">Lock build & race ${icon('flag')}</button></div>`;
  const left = PRACTICE_RUNS - state.runs.length;
  return `<div class="action-context"><span class="attempt-pips">${[0, 1].map(i => `<i class="${i >= left ? 'used' : ''}"></i>`).join('')}</span><div><strong>${left} practice run${left === 1 ? '' : 's'} left</strong><span>${state.predictionLocked ? 'Make a change. See what happens. That’s how you learn.' : 'Fit your parts. Check how they will race. Then test your car.'}</span></div></div><div class="action-buttons"><button class="button light" data-action="qualify">Ready to qualify ${icon('arrow')}</button><button class="button primary" data-action="test" ${left === 0 ? 'disabled' : ''}>${icon('play')} Test car <span>${left}/2</span></button></div>`;
}

function renderResults(state) {
  const you = state.field.find(entry => entry.id === 'you');
  return `<div class="eyebrow">CHEQUERED FLAG / ${RACE_LAPS} LAPS</div><div class="finish-place"><span>${you.retired?'OUT':String(you.place).padStart(2, '0')}</span><div><strong>${you.retired?'Retired':`${['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'][you.place]} place`}</strong><p>${you.retired?'Brake fire · did not finish':`${you.result.time.toFixed(2)} seconds`}</p></div></div><h2 class="results-heading">Every decision counts.</h2><p class="results-intro">Eight laps. Six drivers. Here’s the final classification.</p><div class="standings">${state.field.map(entry => `<div class="${entry.id === 'you' ? 'is-you' : ''}"><span>${entry.place}</span><i style="background:${entry.color}"></i><strong>${e(entry.name)}${entry.id === 'you' ? '<small> YOU</small>' : ''}</strong><span>${entry.retired?'RETIRED':`${entry.result.time.toFixed(2)}s`}</span></div>`).join('')}</div><div class="score-breakdown"><div><span>Race finish</span><strong>+${state.score.race}</strong></div><div><span>Optional surface bonus</span><strong>+${state.score.prediction}</strong></div><div class="score-total"><span>Round points</span><strong>${state.score.total}<small> PTS</small></strong></div></div><div class="race-debrief"><span class="eyebrow">YOUR ENGINEERING DEBRIEF</span>${you.incidents.length ? you.incidents.map(event=>`<div><strong>Lap ${event.lap} · ${event.title}</strong><span>${event.type==='fire'?'RETIRED':`+${event.loss.toFixed(1)}s`}</span><p>${event.remedy}</p></div>`).join('') : '<p>A clean race. Your setup avoided the elevated handling and cooling risks.</p>'}</div><p class="bench-tip">${icon('info')}Five simulated rivals. Qualifying sets the grid; setup and ERS shape the race.</p>`;
}
function renderLesson(state) {
  return `<div class="lesson-tag">${icon('bolt')} THE BIG IDEA / 01</div><div class="lesson-illustration"><span>DATA</span><i>→</i><span>?</span><i>→</i><span>SAND</span></div><h2 class="lesson-title">You just made a<br><em>classification.</em></h2><p class="lesson-body">You used clues to put an unknown surface into a category. AI classifiers do the same thing with input data.</p><div class="answer-card">${icon(state.prediction === 'sand' ? 'check' : 'eye')}<div><strong>The mystery surface was sand.</strong><p>${state.prediction === 'sand' ? 'You read the evidence correctly. +3 points.' : state.prediction ? `Your guess was ${state.prediction}. Loose grains and low moisture were the strongest clues.` : 'Loose grains and low moisture were the strongest clues.'}</p></div></div><div class="reflection"><span class="eyebrow">TAKE IT OFF THE TRACK</span><h3>Which clue changed your mind?</h3><p>Think of a spam filter: which signals help it decide whether an email belongs in your inbox?</p></div><button class="button light small full" data-action="briefing">Revisit the challenge ${icon('arrow')}</button>`;
}
