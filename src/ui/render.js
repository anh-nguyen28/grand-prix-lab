import { BUDGET, DEMO_TEAMS, PARTS, PRACTICE_RUNS, RACE_LAPS, SLOT_LABELS, SLOTS, driverCode } from '../../shared/content.js';
import { INCIDENTS, incidentFixes, raceRiskForecast } from '../../shared/engineering.js';
import { incidentImpact } from '../../shared/race.js';
import { changedSlots } from '../../shared/game.js';
import { buildStats } from '../../shared/simulation.js';
import { METAPHOR, NARRATOR, storyChapters } from '../../shared/story.js';
import { CONDITIONS } from '../../shared/conditions.js';
import { trackById } from '../../shared/tracks.js';
import { escapeHtml as e, icon, slotIcon } from './icons.js';
import { renderTimingTower, renderRaceActions } from './race-ui.js';
import { renderPartShelf } from './engineering-ui.js';
import { renderRaceChat } from './race-chat.js';

export function renderShell() {
  return `
    <header class="site-header">
      <a class="brand" href="#" data-action="home" aria-label="AI Grand Prix home"><span class="brand-mark"><i></i><i></i><i></i><i></i><i></i></span><span>AI GRAND PRIX<span class="brand-sub">ENGINEER YOUR ADVANTAGE.</span></span></a>
      <nav class="main-nav" aria-label="Main navigation"><button class="nav-link active" data-action="workshop">Pit garage</button><button class="nav-link" data-action="tracks">Tracks <span class="tiny">03</span></button></nav>
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
          <div id="run-overlay" class="run-overlay" hidden></div><div class="corner-readout" id="corner-readout" hidden><strong id="race-zone"></strong><span id="race-advantage"></span></div><div id="broadcast-tools" class="broadcast-tools" hidden></div><div id="incident-banner" class="incident-banner" hidden></div><div id="race-callout" class="race-callout" hidden></div><div id="demo-caption" class="demo-caption" hidden></div>
          <div class="scene-bottom"><span id="scene-hint">${icon('eye')} DRAG TO LOOK AROUND</span><button class="icon-button" data-action="camera" aria-label="Reset camera">${icon('reset')}</button></div>
        </div></div>
        <aside id="engineering-panel" class="engineering-panel" aria-label="Car stats"></aside>
        <section class="intel-panel" id="intel-panel" aria-label="Field notes"></section>
      </section>
      <div id="action-bar" class="action-bar"></div>
      <footer class="app-footer"><span>Every millisecond matters. <span class="footer-divider">/</span> ADSC × AI GRAND PRIX</span><span>${RACE_LAPS} laps · ~2½ minutes · ${DEMO_TEAMS.length + 1} cars <button data-action="reset" aria-label="Restart this round">${icon('reset')} Restart</button></span></footer>
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
    ${category === 'sensor' ? `<p class="bench-tip">${icon('info')}Your first scan locks the sensor for this round.</p>` : state.phase === 'adjust' ? `<p class="bench-tip">${icon('info')}${changedSlots(state).length} of 2 slots changed. Reverting a slot frees it again.</p>` : ''}`;
}

function prediction(state, ui) {
  if (state.predictionLocked) return `<div class="prediction locked"><div>${icon('lock')}<strong>${state.prediction ? state.prediction.charAt(0).toUpperCase() + state.prediction.slice(1) : 'No prediction submitted'}</strong><span class="pill">LOCKED</span></div></div>`;
  return `<div class="prediction"><div class="eyebrow">YOUR LABEL · +3 POINTS</div><div class="guess-options" role="group" aria-label="Terrain prediction">${trackById(state.trackId).mystery.options.map(terrain => `<button class="${ui.guess === terrain ? 'selected' : ''}" aria-pressed="${ui.guess === terrain}" data-action="guess" data-terrain="${terrain}"><i class="terrain-dot ${terrain}"></i>${CONDITIONS[terrain].label}</button>`).join('')}</div><button class="button small full light" data-action="predict" ${!ui.guess || ui.busy ? 'disabled' : ''}>Lock in my label ${icon('lock')}</button><p>Choose before your first test run.</p></div>`;
}

function sensorReadings(state, ui) {
  return `<div class="sensor-label">${icon('scan')}<span>${PARTS[state.build.sensor].name}</span><small>${state.clues.length}/3</small></div><div class="clue-list">${[0, 1, 2].map(i => `<div class="clue ${state.clues[i] ? 'revealed' : ''}"><span class="clue-number">${state.clues[i] ? icon('check') : `0${i + 1}`}</span><div><strong>Reading ${String(i + 1).padStart(2, '0')}</strong><p>${state.clues[i] || 'Waiting for a closer look…'}</p></div></div>`).join('')}</div>${state.phase === 'practice' && state.clues.length < 3 ? `<button class="button small full scan-button" data-action="scan" ${ui.busy || ui.scanning ? 'disabled' : ''}>${icon(ui.scanning ? 'clock' : 'scan')}${ui.scanning ? 'Reading the surface…' : 'Scan mystery section'}</button>` : ''}`;
}

function chapterBody(chapter, state, ui) {
  switch (chapter.id) {
    case 'meet': return `<ol class="round-steps">${['Scan the mystery section', 'Label its condition', 'Build and test your car', 'Qualify, then fix what you learned', 'Race 19 rivals'].map(step => `<li>${step}</li>`).join('')}</ol>`;
    case 'data': return sensorReadings(state, ui);
    // The readings stay in view while the player decides on a label.
    case 'label': return sensorReadings(state, ui) + (state.phase === 'practice' || state.prediction ? prediction(state, ui) : '');
    case 'train': return state.runs.length ? renderRunReport(state.runs.at(-1), state.runs.at(-2), `PRACTICE RUN 0${state.runs.length}`) + renderRisks(state) : `<ul class="track-tests">${trackById(state.trackId).sections.map(section => `<li><strong>${e(section.name)}</strong><span>${CONDITIONS[section.condition].label}: ${e(section.suggestion)}</span></li>`).join('')}</ul>`;
    case 'exam': return state.qualifying ? renderRunReport(state.qualifying, state.runs.at(-1), 'QUALIFYING REPORT') + renderRisks(state) : '';
  }
  return '';
}

// A short test lap cannot show late-race problems, so the report forecasts them from the fitted parts.
function renderRisks(state) {
  const risks = raceRiskForecast(state.build);
  if (!risks.length) return `<div class="race-risks clean"><span class="eyebrow">RACE RISKS FOUND</span><p>${icon('check')} None. This car should run clean for eight laps. Now it is about pace.</p></div>`;
  return `<div class="race-risks"><span class="eyebrow">RACE RISKS FOUND · ${risks.length}</span>${risks.map(risk => `<div class="risk"><div><strong>${risk.title}</strong><small>${risk.retirement ? `Retires on lap ${risk.laps.at(-1)}` : `Lap ${risk.laps.join(' & ')} · costs ${risk.loss.toFixed(1)}s`}</small></div><button class="button small light" data-action="incident-demo" data-type="${risk.type}">${icon('play')} Watch</button><button class="button small primary" data-action="fix-risk" data-type="${risk.type}" ${['practice', 'adjust'].includes(state.phase) ? '' : 'disabled'}>Fix it</button></div>`).join('')}</div>`;
}

const raeSays = lines => `<div class="rae-line"><span class="rae-avatar" aria-hidden="true">${NARRATOR.name[0]}</span><div>${lines.map(line => `<p>${e(line)}</p>`).join('')}</div></div>`;

// Field notes span the page: chapter tabs, then the story, what to do now, and the AI glossary side by side.
export function renderIntel(state, ui) {
  if (state.phase === 'results') return renderLesson(state);
  if (state.phase === 'race') return renderRaceChat(state.race.field.length);
  const chapters = storyChapters(state), current = chapters.find(chapter => chapter.status === 'current') || chapters.at(-1);
  const shown = chapters.find(chapter => chapter.id === ui.viewChapter && chapter.status !== 'locked') || current;
  const tabs = chapters.map(chapter => `<button role="tab" class="chapter-chip is-${chapter.status} ${chapter === shown ? 'selected' : ''}" data-action="view-chapter" data-chapter="${chapter.id}" aria-selected="${chapter === shown}" ${chapter.status === 'locked' ? 'disabled' : ''}><span class="chapter-number">${chapter.status === 'done' ? icon('check') : chapter.status === 'locked' ? icon('lock') : String(chapter.number).padStart(2, '0')}</span><span>${chapter.title}</span></button>`).join('');
  const header = `<div class="notes-header"><div><span class="eyebrow">FIELD NOTES · ${NARRATOR.name.toUpperCase()}, ${NARRATOR.role.toUpperCase()}</span><h2>Teaching your car</h2></div><div class="chapter-strip" role="tablist" aria-label="Chapters">${tabs}</div></div>`;
  const story = ui.busy ? raeSays([`${ui.runLabel}. Your car is on its own now. Watch the sections that suit it least: where does it lose time?`])
    : (chapters[0].autoOpen && shown.id !== 'meet' ? raeSays(chapters[0].lines) : '') + raeSays(shown.lines);
  const glossary = `<aside class="notes-glossary"><span class="eyebrow">THE AI BEHIND THE RACE</span><dl class="metaphor">${METAPHOR.map(([game, ai, chapter]) => `<div class="${chapter === shown.id ? 'active' : ''}"><dt>${game}</dt><dd>${ai}</dd></div>`).join('')}</dl></aside>`;
  return `${header}<div class="notes-body" data-chapter="${shown.id}"><div class="notes-story"><span class="eyebrow">CHAPTER ${String(shown.number).padStart(2, '0')}</span><h3>${shown.title}</h3>${story}</div><div class="notes-activity">${ui.busy ? '' : chapterBody(shown, state, ui)}</div>${glossary}</div>`;
}

function renderRunReport(result, previous, label) {
  const improvement = previous ? previous.time - result.time : null;
  return `<div class="run-report"><span class="eyebrow">${label}</span><div class="run-time"><strong>${result.time.toFixed(2)}<small>s</small></strong>${improvement !== null ? `<span class="${improvement >= 0 ? 'positive' : 'negative'}">${improvement >= 0 ? '↓' : '↑'} ${Math.abs(improvement).toFixed(2)}s ${improvement >= 0 ? 'quicker' : 'slower'}</span>` : '<span>Your first benchmark</span>'}</div><div class="telemetry">${result.segments.map(segment => `<div><span class="telemetry-number ${segment.good ? 'good' : ''}">${segment.good ? icon('check') : '!'}</span><div><h3>${segment.name}<small>${segment.time.toFixed(1)}s</small></h3><p>${segment.problem}</p>${!segment.good ? `<span class="suggestion">${segment.suggestion}</span>` : ''}</div></div>`).join('')}</div></div>`;
}

export function renderActions(state, ui) {
  if (state.phase === 'race' && ui.busy) return renderRaceActions(state.race);
  if (ui.busy) return `<div class="action-context">${icon('route')}<div><strong>${ui.runLabel}</strong><span>Your build is locked while your car is on track.</span></div></div><button class="button dark" data-action="skip-run">Skip animation ${icon('arrow')}</button>`;
  if (state.phase === 'results') return `<div class="action-context">${icon('trophy')}<div><strong>A little wiser. Ready for the next one.</strong><span>Your round: ${state.score.total} points · race finish + optional bonus</span></div></div><div class="action-buttons"><button class="button light" data-action="reset">${icon('reset')} Start fresh</button><button class="button primary" data-action="rebuild">${icon('box')} Rebuild from this car</button></div>`;
  if (state.phase === 'adjust') return `<div class="action-context"><span class="attempt-pips">${[0, 1].map(i => `<i class="${i < changedSlots(state).length ? 'used' : ''}"></i>`).join('')}</span><div><strong>${2 - changedSlots(state).length} slot changes available</strong><span>Revert any changed slot to free it again. Budget stays at ${BUDGET}.</span></div></div><div class="action-buttons"><button class="button light" data-action="open-chapter" data-chapter="exam">See qualifying report</button><button class="button primary" data-action="race">Lock build & race ${icon('flag')}</button></div>`;
  const left = PRACTICE_RUNS - state.runs.length;
  return `<div class="action-context"><span class="attempt-pips">${[0, 1].map(i => `<i class="${i >= left ? 'used' : ''}"></i>`).join('')}</span><div><strong>${left} practice run${left === 1 ? '' : 's'} left</strong><span>${state.predictionLocked ? 'Change one thing. Test again. That is how your car learns.' : 'Fit your parts, check the specs, then test your car.'}</span></div></div><div class="action-buttons"><button class="button light" data-action="qualify">Ready to qualify ${icon('arrow')}</button><button class="button primary" data-action="test" ${left === 0 ? 'disabled' : ''}>${icon('play')} Test car <span>${left}/2</span></button></div>`;
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
  return `<div class="eyebrow">CHEQUERED FLAG / ${RACE_LAPS} LAPS</div><div class="finish-place"><span>${you.retired?'OUT':String(you.place).padStart(2, '0')}</span><div><strong>${you.retired?'Retired':`P${you.place} of ${state.field.length}`}</strong><p>${you.retired?'Brake fire · did not finish':`${you.result.time.toFixed(2)} seconds`}</p></div></div>
    <div class="podium">${[2, 1, 3].map(place => finisher(place)).map((entry, i) => entry ? `<div class="step-${[2, 1, 3][i]} ${entry.id === 'you' ? 'is-you' : ''}"><i style="background:${entry.color}"></i><strong>${driverCode(entry)}</strong><span>P${[2, 1, 3][i]}</span></div>` : '').join('')}</div>
    <div class="score-breakdown"><div><span>Race finish</span><strong>+${state.score.race}</strong></div><div><span>Surface label bonus</span><strong>+${state.score.prediction}</strong></div><div class="score-total"><span>Round points</span><strong>${state.score.total}<small> PTS</small></strong></div></div>
    <div class="race-debrief"><span class="eyebrow">YOUR INCIDENT REEL</span>${mine.length ? mine.map(item => { const fixes = incidentFixes(state.build, item.event.type).slice(0, 2); return `<div class="reel-item"><div><strong>Lap ${item.event.lap} · ${item.event.title}</strong><span>${item.impact.retired ? 'RETIRED' : `+${item.event.loss.toFixed(1)}s · P${item.impact.before} → P${item.impact.after}`}</span></div><p>${fixes.length ? `Next time: ${fixes.map(fix => `${fix.name} (${fix.cost > 0 ? '+' : ''}${fix.cost} cr)`).join(' or ')}.` : item.event.remedy}</p>${replayButton(item)}</div>`; }).join('') : '<p>A clean race. Your setup avoided every handling and cooling incident.</p>'}</div>
    ${others.length ? `<div class="race-debrief field-reel"><span class="eyebrow">LEARN FROM THE FIELD</span>${others.map(item => `<div class="reel-item"><div><strong>${e(item.car.name)} · ${item.event.title}</strong><span>${item.impact.retired ? 'RETIRED' : `P${item.impact.before} → P${item.impact.after}`}</span></div><p>${item.event.cause}</p>${replayButton(item)}</div>`).join('')}</div>` : ''}
    <details class="full-classification"><summary>Full classification · ${state.field.length} cars</summary><div class="standings">${state.field.map(entry => `<div class="${entry.id === 'you' ? 'is-you' : ''}"><span>${entry.place}</span><i style="background:${entry.color}"></i><strong>${e(entry.name)}${entry.id === 'you' ? '<small> YOU</small>' : ''}</strong><span>${entry.retired?'RETIRED':`${entry.result.time.toFixed(2)}s`}</span></div>`).join('')}</div></details>`;
}
function renderLesson(state) {
  const track = trackById(state.trackId), mysteryName = track.sections.find(section => section.id === track.mystery.section).name.toLowerCase();
  return `<div class="lesson-layout"><div><div class="lesson-tag">${icon('bolt')} FIELD NOTES · EPILOGUE</div><div class="lesson-illustration"><span>DATA</span><i>→</i><span>?</span><i>→</i><span>${CONDITIONS[trackById(state.trackId).mystery.target].label.toUpperCase()}</span></div><h2 class="lesson-title">You just made a<br><em>classification.</em></h2><p class="lesson-body">You took three readings, looked for a pattern and put an unknown condition into a category. That is exactly what an AI classifier does with its input data.</p></div>
    <div><div class="answer-card">${icon(state.prediction === track.mystery.target ? 'check' : 'eye')}<div><strong>The ${e(mysteryName)} was ${CONDITIONS[track.mystery.target].label.toLowerCase()}.</strong><p>${state.prediction === track.mystery.target ? 'You read the evidence correctly. +3 points.' : state.prediction ? `Your guess was ${e(CONDITIONS[state.prediction].label.toLowerCase())}. The three readings pointed to ${CONDITIONS[track.mystery.target].label.toLowerCase()} conditions.` : 'The three readings pointed to it.'}</p></div></div><ol class="story-recap"><li><strong>Data</strong><span>Your sensor readings</span></li><li><strong>Label</strong><span>${state.prediction ? `You said ${e(CONDITIONS[state.prediction].label.toLowerCase())}` : 'You skipped the label'}</span></li><li><strong>Training</strong><span>${state.runs.length} practice run${state.runs.length === 1 ? '' : 's'}</span></li><li><strong>Validation</strong><span>Your qualifying lap</span></li><li><strong>Real world</strong><span>${state.field.find(car => car.id === 'you').retired ? 'Retired' : `P${state.score.place} of ${state.field.length}`}</span></li></ol></div>
    <div><p class="rae-signoff">“Your car only knew what you taught it. Next round, we teach it something harder.” · ${NARRATOR.name}</p><div class="reflection"><span class="eyebrow">TAKE IT OFF THE TRACK</span><h3>Which clue changed your mind?</h3><p>Think of a spam filter: which signals help it decide whether an email belongs in your inbox?</p></div><button class="button light small full" data-action="briefing">Revisit the challenge ${icon('arrow')}</button></div></div>`;
}
