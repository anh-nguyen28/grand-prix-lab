import '@fontsource-variable/dm-sans';
import '@fontsource-variable/space-grotesk';
import './styles.css';
import './f1.css';
import './engineering.css';
import './garage.css';
import './broadcast.css';
import './layout.css';
import './showroom.css';
import { LIVERY_ACCENTS, LIVERY_FINISHES, LIVERY_HELMETS, LIVERY_PAINTS, LIVERY_PATTERNS, PARTS, PLAYER_TEAMS, RACE_LAPS, RACE_PLAYBACK_MS, carNumber, cleanLivery } from '../shared/content.js';
import { updateRaceBroadcast, renderBroadcastTools, resetRaceBroadcast } from './ui/race-ui.js';
import { renderEngineering, animateSpecs, partDetailsDialog, incidentLabDialog, partAvailability } from './ui/engineering-ui.js';
import { createAssemblyInteraction } from './ui/assembly.js';
import { createIncidentDemo, incidentImpact } from '../shared/race.js';
import { INCIDENTS, incidentFixes } from '../shared/engineering.js';
import { createLocalSession } from './adapters/local-session.js';
import { createWorkshop } from './scene/workshop.js';
import { createShowroom } from './scene/showroom.js';
import { renderShowroomShell, renderShowroomPanel } from './ui/showroom.js';
import { loadTeamLogo, teamLogo } from './ui/team-logo.js';
import { renderShell, renderParts, renderIntel, renderActions, renderSteps } from './ui/render.js';
import { briefingDialog, helpDialog, predictionWarningDialog, profileDialog, roundConceptDialog, seasonDialog } from './ui/dialogs.js';
import { icon } from './ui/icons.js';
import { sendPlayerMessage } from './ui/race-chat.js';
import { storyChapters } from '../shared/story.js';

const app = document.querySelector('#app');
app.innerHTML = renderShell() + renderShowroomShell();
const session = createLocalSession();
const ui = { category: 'wheels', viewChapter: null, currentChapter: null, suggested: new Set(), guess: null, view: 'rover', busy: false, scanning: false, runLabel: '', raceTelemetry: null, armedPart: null, demo: null, paused: false, playbackSpeed: 1, livery: null, team: null, driverName: '', firstVisit: true };
const scene = createWorkshop(document.querySelector('#scene'));
const dialog = document.querySelector('#dialog');
let toastTimer, finishRun = null, runToken = 0, scanToken = 0, liveRace = null;
function showToast(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
}
function dispatch(command) {
  const result = session.dispatch(command); if (!result.ok) showToast(result.message); return result;
}
function openDialog(markup) { dialog.innerHTML = markup; if (!dialog.open) dialog.showModal(); }
function closeDialog() { dialog.close(); }
function setView(view) {
  ui.view = view; scene.setView(view);
  document.querySelectorAll('[data-action="view"]').forEach(button => { const selected = button.dataset.view === view; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); button.disabled = ui.busy; });
  document.querySelector('#scene-hint').innerHTML = `${icon('eye')} ${view === 'rover' ? 'DRAG TO LOOK AROUND' : 'DUNE VALLEY CIRCUIT / BROADCAST VIEW'}`;
}
function render() {
  const state = session.getSnapshot();
  liveRace = state.race;
  const focused = document.activeElement;
  const focusKey = focused?.dataset?.action ? { action: focused.dataset.action, id: focused.dataset.id, category: focused.dataset.category, tab: focused.dataset.tab, terrain: focused.dataset.terrain } : null;
  if(state.phase!=='race'||!document.querySelector('#live-standings'))document.querySelector('#parts-panel').innerHTML = renderParts(state, ui);
  // Rebuild the stats only when the car changes, so the bars get to finish their animation.
  const statsKey = JSON.stringify(state.build);
  if (statsKey !== ui.statsKey) { ui.statsKey = statsKey; const panel = document.querySelector('#engineering-panel'); panel.innerHTML = renderEngineering(state); animateSpecs(panel); }
  // When the story moves to a new chapter, show it; the player can still click back to earlier ones.
  const current = storyChapters(state).find(chapter => chapter.status === 'current')?.id ?? null;
  if (current !== ui.currentChapter) { ui.currentChapter = current; ui.viewChapter = null; }
  // The live chat keeps its messages and half-typed input across re-renders.
  if (state.phase !== 'race' || !document.querySelector('#race-chat')) document.querySelector('#intel-panel').innerHTML = renderIntel(state, ui);
  document.querySelector('#action-bar').innerHTML = renderActions(state, ui);
  document.querySelector('#steps').innerHTML = renderSteps(state);
  document.querySelector('#profile-label').textContent = state.profile.name;
  const copy = ui.demo ? ['THE INCIDENT LAB', INCIDENTS[ui.demo].title, 'A controlled demonstration. Your setup, tests and score are unchanged.'] : state.phase === 'results'
    ? ['THE REVEAL', 'Every run teaches you something.', 'The finish line is only half the story. Here’s what your car discovered.']
    : state.phase === 'adjust'
      ? ['THE FINAL TUNE-UP', 'A little feedback. A better build.', 'Your qualifying run is in. Change up to two slots, then make it count.']
      : state.phase === 'race'
        ? ['THE GRAND PRIX', 'Let your build do the talking.', 'Eight laps. A full grid. Watch your engineering come alive.']
        : ['THE PADDOCK', 'Your race starts in the garage.', 'Read the circuit. Dial in your setup. Earn your place on the grid.'];
  ['eyebrow', 'heading', 'subheading'].forEach((id, i) => { document.getElementById(id).textContent = copy[i]; });
  document.querySelector('#rover-title').innerHTML = `CAR ${carNumber(state.profile.livery)} · ${state.profile.team.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').toUpperCase()} <span>/ ${state.phase === 'practice' ? 'PERFORMANCE LAB' : state.phase === 'adjust' ? 'THE FINAL TUNE-UP' : 'DUNE VALLEY'}</span>`;
  document.querySelector('.workspace').classList.toggle('show-results', state.phase === 'results');
  document.querySelector('.workspace').classList.toggle('race-mode', state.phase === 'race' || !!ui.demo);
  document.body.classList.toggle('race-active', state.phase === 'race' || !!ui.demo);
  document.querySelector('.workspace').classList.toggle('demo-mode', !!ui.demo);
  scene.setAssembly(state, ui.armedPart);
  scene.setBuild(state.build, { ...state.profile.livery, team: state.profile.team });
  // A team logo file may load after the first paint; redraw once it arrives.
  if (state.profile.team.id !== ui.logoTeam) { ui.logoTeam = state.profile.team.id; loadTeamLogo(ui.logoTeam).then(image => { if (image && ui.logoTeam === state.profile.team.id) { ui.statsKey = null; render(); } }); }
  scene.setKnowledge?.(state.runs.length > 0 || state.phase !== 'practice');
  if (state.phase === 'race' && ui.raceTelemetry) updateRaceBroadcast(state.race, ui.raceTelemetry);
  if (focusKey && !dialog.open) {
    const candidates = [...document.querySelectorAll(`[data-action="${focusKey.action}"]`)];
    candidates.find(el => ['id', 'category', 'tab', 'terrain'].every(key => !focusKey[key] || el.dataset[key] === focusKey[key]))?.focus({ preventScroll: true });
  }
}
session.subscribe(render);
render();
setView('rover');

// The parts box scrolls as a whole; once the player scrolls, its header compacts to give the parts more room.
const partsPanel = document.querySelector('#parts-panel');
function compactShelf() {
  const scrolled = partsPanel.scrollHeight > partsPanel.clientHeight + 1 ? partsPanel.scrollTop : -partsPanel.getBoundingClientRect().top;
  if (scrolled > 24) partsPanel.classList.add('compact'); else if (scrolled < 4) partsPanel.classList.remove('compact');
}
partsPanel.addEventListener('scroll', compactShelf, { passive: true });
addEventListener('scroll', compactShelf, { passive: true });

function armPart(id) {
  if(id && (ui.scanning || partAvailability(session.getSnapshot(),id,ui.busy)))return;
  ui.armedPart=id;scene.setArmedPart(id);
  document.querySelectorAll('[data-action="pick-part"]').forEach(button=>{button.classList.toggle('picked-up',button.dataset.id===id);button.setAttribute('aria-pressed',String(button.dataset.id===id));});
  const hint=document.querySelector('#scene-hint');
  if(id){setView('rover');hint.innerHTML=`${icon('box')} ${PARTS[id].name.toUpperCase()} PICKED UP · TAP ITS FITTING POINT`;}
  else if(ui.view==='rover')hint.innerHTML=`${icon('eye')} DRAG TO LOOK AROUND`;
  if(id){if(matchMedia('(max-width: 640px)').matches)document.querySelector('.scene-card').scrollIntoView({behavior:'instant',block:'center'});}
}
function fitPart(id) {
  if(ui.scanning){showToast('Let the scan finish before fitting a part.');return;}
  const result=dispatch({type:'SET_PART',id});
  if(result.ok){ui.armedPart=null;ui.suggested.clear();scene.setArmedPart(null);if(dialog.open)closeDialog();setView('rover');render();showToast(`${PARTS[id].name} fitted. Check the new specs under the car.`);}
}
createAssemblyInteraction({onPick:armPart,onFit:fitPart,getArmed:()=>ui.armedPart,canFit:id=>!ui.scanning&&!partAvailability(session.getSnapshot(),id,ui.busy)});

function beginAnimation(entries,label,next,duration=6500,demoRace=null){
  const racing=entries.length>1||!!demoRace;
  ui.busy=true;ui.runLabel=label;ui.view='course';ui.armedPart=null;ui.paused=false;ui.playbackSpeed=1;const token=++runToken;
  setView('course');render();document.querySelector('#corner-readout').hidden=!racing||!!demoRace;
  const overlay=document.querySelector('#run-overlay'),tools=document.querySelector('#broadcast-tools'),caption=document.querySelector('#demo-caption');overlay.hidden=false;
  overlay.classList.toggle('race-overlay',racing);tools.hidden=!racing;tools.innerHTML=racing?renderBroadcastTools(!!demoRace):'';
  caption.hidden=!demoRace;
  if(demoRace)caption.innerHTML=`<span>CONTROLLED SCENARIO · NO SCORE</span><strong>${INCIDENTS[ui.demo].title}</strong><p>${INCIDENTS[ui.demo].cause}</p><small id="demo-stage">Approaching the test zone…</small>`;
  const profile=session.getSnapshot().profile,badge=teamLogo(profile.team,profile.livery,'hud-logo');
  overlay.innerHTML=racing?`<div class="start-sequence"><span class="start-team">${badge}${profile.name.replaceAll('&','&amp;').replaceAll('<','&lt;')} · ${profile.team.name.replaceAll('&','&amp;').replaceAll('<','&lt;')}</span><div class="start-lights">${'<i></i>'.repeat(5)}</div><strong>HOLD YOUR BREATH.</strong></div><div class="broadcast-hud"><span class="live-tag"><span class="live-dot"></span><span id="race-chapter">STARTING GRID</span></span><div><small>RACE LAP</small><strong id="race-lap">01 / ${String(RACE_LAPS).padStart(2,'0')}</strong></div><div class="hud-you">${demoRace?'':badge}<small>YOUR POSITION</small><strong id="your-position">—</strong></div><div><small>RACE TIME</small><strong id="race-clock">0:00.0</strong></div></div><div class="run-progress"><i></i></div>`:`<div><span class="live-dot"></span><strong>${label}</strong><span id="run-progress-label">0%</span></div><div class="run-progress"><i></i></div>`;
  if(demoRace)overlay.querySelector('.start-sequence').hidden=true;
  finishRun=()=>{
    if(token!==runToken)return;runToken++;finishRun=null;ui.busy=false;overlay.hidden=true;tools.hidden=true;caption.hidden=true;document.querySelector('#corner-readout').hidden=true;document.querySelector('#incident-banner').hidden=true;document.querySelector('#race-callout').hidden=true;
    next();render();document.querySelectorAll('[data-action="view"]').forEach(button=>button.disabled=false);
  };
  scene.animateRun(entries,duration,()=>finishRun?.(),(progress,broadcast)=>{
    if(token!==runToken)return;
    overlay.querySelector('.run-progress i').style.width=`${progress*100}%`;
    const progressLabel=overlay.querySelector('#run-progress-label');if(progressLabel)progressLabel.textContent=`${Math.round(progress*100)}%`;
    if(broadcast){
      ui.raceTelemetry=broadcast;
      if(demoRace){
        const row=broadcast.rows[0],stage=document.querySelector('#demo-stage');
        if(stage)stage.textContent=row.incident?(row.incident.type==='fire'&&row.incident.progress<.25?'SMOKE · heat building at the brake':`${row.incident.label} · watch the car`):row.completedIncidents.length?'Demonstration complete. Returning to the garage…':'Approaching the test zone…';
        const pause=document.querySelector('[data-action="pause-race"]');if(pause){pause.textContent=ui.paused?'▶':'Ⅱ';pause.setAttribute('aria-label',ui.paused?'Resume race':'Pause race');}
      }else updateRaceBroadcast(liveRace,broadcast);
    }
  },racing?{getRace:()=>demoRace||liveRace,demo:!!demoRace}:{});
  if(racing&&(matchMedia('(max-width: 640px)').matches||innerHeight<1000))document.querySelector('.scene-card').scrollIntoView({behavior:'instant',block:'start'});
}
function startIncidentDemo(type){
  if(ui.busy||ui.scanning||!INCIDENTS[type])return;
  closeDialog();const state=session.getSnapshot();
  ui.demo=type;
  const demo=createIncidentDemo(state.build,type,'Test car');
  beginAnimation(demo.field,`${INCIDENTS[type].title} · engineering lab`,()=>{ui.demo=null;ui.raceTelemetry=null;setView('rover');},18000,demo);
}

function startRun(type, allowNoPrediction = false) {
  if (ui.busy || ui.scanning) return;
  const state = session.getSnapshot();
  if (!state.predictionLocked && !allowNoPrediction) { openDialog(predictionWarningDialog(type)); return; }
  const result = dispatch({ type: type === 'test' ? 'PRACTICE' : 'QUALIFY' });
  if (!result.ok) return;
  const updated = session.getSnapshot(), run = type === 'test' ? updated.runs.at(-1) : updated.qualifying;
  beginAnimation([{ id: 'you', name: updated.profile.name, build: updated.build, result: run, color: updated.profile.livery.paint }], type === 'test' ? `Practice run 0${updated.runs.length}` : 'Qualifying lap', () => {
    ui.viewChapter = null; // show the new report in the current chapter
    if (type === 'qualify') dispatch({ type: 'FINISH_QUALIFY' });
    setView('rover');
    showToast(type === 'test' ? 'Run complete. Your report shows what to try next.' : 'Benchmark set. You can now adjust two part slots.');
  });
}
// Replays an incident from the finished race. The race is deterministic, so the clip is exact.
function startReplay(id, distance) {
  const race = session.getSnapshot().race, car = race?.field.find(entry => entry.id === id);
  const event = car?.incidents.find(item => Math.abs(item.distance - Number(distance)) < 1e-9);
  if (ui.busy || !event) return;
  const impact = incidentImpact(race, id, event), from = Math.max(0, impact.start - 3), to = Math.min(race.maxTime, impact.end + 2);
  ui.busy = true; ui.runLabel = `Replay · ${car.name}`; const token = ++runToken; setView('course'); render();
  const caption = document.querySelector('#demo-caption'); caption.hidden = false; caption.classList.add('replay-caption');
  caption.innerHTML = `<span>REPLAY · LAP ${event.lap}</span><strong>${car.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;')} · ${event.title}</strong><p>${event.cause}</p><small>${impact.retired ? 'Race-ending failure' : `Cost ${event.loss.toFixed(1)}s · P${impact.before} → P${impact.after}`}</small>`;
  finishRun = () => { if (token !== runToken) return; runToken++; finishRun = null; ui.busy = false; caption.hidden = true; caption.classList.remove('replay-caption'); setView('rover'); render(); };
  scene.animateRun(race.field, (to - from) * 1000 * RACE_PLAYBACK_MS / race.maxTime, () => finishRun?.(), null, { getRace: () => race, replay: { from, to, focus: id } });
}
function reset(build = null) {
  if (ui.busy) return;
  scanToken++; ui.scanning = false; ui.guess = null; ui.category = 'wheels'; ui.viewChapter = null; ui.suggested.clear(); ui.raceTelemetry = null; ui.armedPart = null; ui.demo = null;
  session.reset(build); setView('rover'); closeDialog(); showToast('Fresh car, fresh possibilities. Your two practice runs are ready.');
}

// The showroom edits a draft livery; it is applied when the player drives to the garage.
const showroom = document.querySelector('#showroom'), showroomForm = document.querySelector('#showroom-form');
let showroomScene = null;
const pick = list => list[Math.floor(Math.random() * list.length)];
function renderShowroom(focus = null) {
  showroomForm.innerHTML = renderShowroomPanel(session.getSnapshot(), ui.livery, ui.driverName, ui.firstVisit, ui.team);
  if (focus) showroomForm.querySelector(focus)?.focus({ preventScroll: true });
}
function previewLivery() {
  const number = carNumber(ui.livery);
  showroomScene?.setCar(session.getSnapshot().build, { ...ui.livery, team: ui.team });
  document.querySelector('#showroom-number').textContent = number; document.querySelector('#showroom-watermark').textContent = number;
  document.querySelector('#showroom-driver').textContent = ui.driverName.trim() || 'Your car';
  const teamName = ui.team.id === 'custom' ? ui.team.name.trim() || 'Your own team' : ui.team.name;
  document.querySelector('#showroom-team-label').innerHTML = `${teamLogo({ ...ui.team, name: teamName }, ui.livery, 'plate-logo')}<span>${teamName.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</span>`;
  showroom.style.setProperty('--livery-paint', ui.livery.paint); showroom.style.setProperty('--livery-accent', ui.livery.accent);
  const preview = showroomForm.querySelector('.number-preview'); if (preview) preview.textContent = number;
}
function updateLivery(patch, focus) { ui.livery = cleanLivery({ ...ui.livery, ...patch }); previewLivery(); if (focus !== false) renderShowroom(focus); }
function openShowroom() {
  if (ui.busy) return;
  const state = session.getSnapshot();
  ui.livery = { ...state.profile.livery }; ui.team = { ...state.profile.team }; ui.driverName = state.profile.name === 'You' ? '' : state.profile.name;
  closeDialog(); renderShowroom(); showroom.hidden = false;
  document.querySelectorAll('.site-header, .app-main').forEach(element => { element.inert = true; });
  showroomScene ??= createShowroom(document.querySelector('#showroom-scene'));
  showroomScene.start(); previewLivery();
  // Show any team logo files the workshop has added.
  Promise.all(Object.keys(PLAYER_TEAMS).map(loadTeamLogo)).then(images => { if (images.some(Boolean) && !showroom.hidden) { renderShowroom(); previewLivery(); } });
  showroomForm.querySelector('button.primary')?.focus({ preventScroll: true });
}
function closeShowroom(apply) {
  if (showroom.hidden) return;
  if (apply) {
    const state = session.getSnapshot(), name = ui.driverName.trim();
    if (!dispatch({ type: 'SET_TEAM', team: ui.team }).ok) { showroomForm.querySelector('#showroom-team')?.focus(); return; }
    dispatch({ type: 'SET_LIVERY', livery: ui.livery });
    if (name && name !== state.profile.name && state.phase === 'practice') dispatch({ type: 'SET_PROFILE', name, mode: state.profile.mode });
  }
  showroom.hidden = true; showroomScene?.stop(); showroomForm.replaceChildren();
  document.querySelectorAll('.site-header, .app-main').forEach(element => { element.inert = false; });
  if (apply) showToast(ui.firstVisit ? `Car ${carNumber(ui.livery)} is in the garage. Now give it the right parts.` : 'Fresh livery fitted. It will show on track.');
  ui.firstVisit = false; document.querySelector('[data-action="showroom"]')?.focus({ preventScroll: true });
}
showroomForm.addEventListener('input', event => {
  const target = event.target;
  if (target.id === 'showroom-name') { ui.driverName = target.value; previewLivery(); }
  else if (target.id === 'showroom-team') { ui.team.name = target.value; previewLivery(); }
  else if (target.id === 'showroom-number-input') { const number = Number(target.value); if (number >= 1 && number <= 99) updateLivery({ number }, false); }
  // Keep the native colour picker open while dragging: preview now, redraw the panel on change.
  else if (target.dataset.liveryKey) { target.parentElement.style.setProperty('--swatch', target.value); updateLivery({ [target.dataset.liveryKey]: target.value }, false); }
});
showroomForm.addEventListener('change', event => { if (event.target.dataset.liveryKey) renderShowroom(`[data-livery-key="${event.target.dataset.liveryKey}"]`); });
showroom.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); closeShowroom(false); } });

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const { action } = button.dataset;
  if (action === 'home') event.preventDefault();
  if (ui.busy && !['skip-run', 'boost', 'help', 'camera', 'close-dialog', 'race-camera', 'follow-incident', 'pause-race', 'race-speed', 'part-details', 'incident-lab', 'incident-info', 'chat-react', 'view-chapter'].includes(action)) { showToast('Let this run finish, or skip its animation.'); return; }
  switch (action) {
    case 'home': case 'briefing': openDialog(briefingDialog()); break;
    case 'workshop': closeDialog(); document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
    case 'help': openDialog(helpDialog()); break;
    case 'season': openDialog(seasonDialog()); break;
    case 'season-round': if (button.dataset.round === '01') { closeDialog(); if (session.getSnapshot().phase === 'results') reset(); } else openDialog(roundConceptDialog(button.dataset.round)); break;
    case 'profile': openDialog(profileDialog(session.getSnapshot())); break;
    case 'showroom': openShowroom(); break;
    case 'livery': updateLivery({ [button.dataset.key]: button.dataset.value }, `[data-key="${button.dataset.key}"][data-value="${button.dataset.value}"]`); break;
    case 'team': {
      const id = button.dataset.team;
      if (id === 'custom') { ui.team = { id, name: ui.team.id === 'custom' ? ui.team.name : '' }; previewLivery(); renderShowroom('#showroom-team'); }
      else { ui.team = { id, name: PLAYER_TEAMS[id].name }; updateLivery(PLAYER_TEAMS[id].livery, `[data-action="team"][data-team="${id}"]`); }
      break;
    }
    case 'livery-number': updateLivery({ number: (ui.livery.number + Number(button.dataset.step) + 98) % 99 + 1 }, `[data-action="livery-number"][data-step="${button.dataset.step}"]`); break;
    case 'livery-random': updateLivery({ paint: pick(LIVERY_PAINTS).color, accent: pick(LIVERY_ACCENTS).color, helmet: pick(LIVERY_HELMETS).color, finish: pick(Object.keys(LIVERY_FINISHES)), pattern: pick(Object.keys(LIVERY_PATTERNS)), number: 1 + Math.floor(Math.random() * 99) }, '[data-action="livery-random"]'); break;
    case 'close-dialog': closeDialog(); break;
    case 'category': ui.category = button.dataset.category; render(); break;
    case 'pick-part': armPart(button.dataset.id); break;
    case 'fit-part': fitPart(button.dataset.id); break;
    case 'fit-target': if(ui.armedPart && PARTS[ui.armedPart].slot===button.dataset.fitSlot)fitPart(ui.armedPart);else{ui.category=button.dataset.fitSlot;render();} break;
    case 'part-details': openDialog(partDetailsDialog(session.getSnapshot(),button.dataset.id,ui.busy)); break;
    case 'incident-lab': openDialog(incidentLabDialog(null,ui.busy)); break;
    case 'incident-info': openDialog(incidentLabDialog(button.dataset.type,ui.busy)); break;
    case 'incident-demo': startIncidentDemo(button.dataset.type); break;
    case 'part': if (ui.scanning) { showToast('Let the scan finish before changing parts.'); break; } if (dispatch({ type: 'SET_PART', id: button.dataset.id }).ok) { setView('rover'); } break;
    case 'guess': ui.guess = button.dataset.terrain; render(); break;
    case 'predict': if (dispatch({ type: 'PREDICT', terrain: ui.guess }).ok) showToast('Prediction locked. The answer comes after the race.'); break;
    case 'scan': {
      if (ui.scanning) break;
      ui.scanning = true; const token = ++scanToken; render();
      await new Promise(resolve => setTimeout(resolve, 900));
      if (token !== scanToken) break;
      ui.scanning = false; dispatch({ type: 'SCAN' }); break;
    }
    case 'open-chapter': ui.viewChapter = button.dataset.chapter; render(); document.querySelector('#intel-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
    case 'view-chapter': ui.viewChapter = button.dataset.chapter; render(); break;
    case 'view': setView(button.dataset.view); break;
    case 'camera': scene.resetCamera(); break;
    case 'test': case 'qualify': startRun(action); break;
    case 'run-without-guess': closeDialog(); startRun(button.dataset.next, true); break;
    case 'return-prediction': closeDialog(); ui.viewChapter = null; render(); document.querySelector('#intel-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelector('[data-action="guess"], [data-action="scan"]')?.focus({ preventScroll: true }); break;
    case 'race': {
      if (ui.scanning || !dispatch({ type: 'RACE' }).ok) break;
      const state = session.getSnapshot();
      resetRaceBroadcast();
      beginAnimation(state.race.field, 'Dune Valley · Eight-lap Grand Prix', () => { dispatch({ type: 'REVEAL' }); showToast('Chequered flag! Final classification and your AI discovery are ready.'); }, RACE_PLAYBACK_MS);
      break;
    }
    case 'race-camera': scene.setRaceCamera(button.dataset.camera);document.querySelectorAll('[data-action="race-camera"]').forEach(item=>{item.classList.toggle('selected',item===button);item.setAttribute('aria-pressed',String(item===button));}); break;
    case 'follow-incident': scene.setRaceCamera(`driver:${button.dataset.driverId}`);document.querySelectorAll('[data-action="race-camera"]').forEach(item=>{item.classList.remove('selected');item.setAttribute('aria-pressed','false');});break;
    case 'pause-race': ui.paused=!ui.paused;scene.setPlayback({paused:ui.paused}); break;
    case 'race-speed': ui.playbackSpeed=ui.playbackSpeed===1?2:1;scene.setPlayback({speed:ui.playbackSpeed});button.textContent=`${ui.playbackSpeed}×`; break;
    case 'boost': if (ui.raceTelemetry?.started && !ui.paused) dispatch({ type: 'BOOST', elapsed: ui.raceTelemetry.elapsed }); break;
    case 'skip-run': scene.finishAnimation(); break;
    case 'chat-react': { const error = sendPlayerMessage(button.dataset.text, { color: session.getSnapshot().profile.livery.paint }); if (error) showToast(error); break; }
    case 'reset': reset(); break;
    case 'rebuild': reset(session.getSnapshot().build); showToast('Same car, fresh round. Apply what the race taught you.'); break;
    case 'replay': startReplay(button.dataset.driverId, button.dataset.distance); break;
    case 'fix-risk': {
      const fixes = incidentFixes(session.getSnapshot().build, button.dataset.type);
      if (!fixes.length) { showToast('No single affordable swap removes this risk. Try changing two parts.'); break; }
      ui.category = fixes[0].slot; ui.suggested = new Set(fixes.map(fix => fix.id)); render();
      document.querySelector('.parts-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`Highlighted: ${fixes.map(fix => fix.name).join(' or ')}. Each one removes this risk.`); break;
    }
  }
});
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.repeat || dialog.open || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
  if (session.getSnapshot().phase === 'race') { event.preventDefault(); document.querySelector('[data-action="boost"]')?.click(); }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'chat-form') {
    event.preventDefault(); const input = event.target.querySelector('#chat-input');
    const error = sendPlayerMessage(input.value, { color: session.getSnapshot().profile.livery.paint });
    if (error) showToast(error); else input.value = '';
    return;
  }
  if (event.target.id === 'showroom-form') { event.preventDefault(); closeShowroom(true); return; }
  if (event.target.id !== 'profile-form') return;
  event.preventDefault(); const form = new FormData(event.target);
  if (session.getSnapshot().phase !== 'practice') session.reset();
  if (dispatch({ type: 'SET_PROFILE', name: form.get('name'), mode: form.get('mode') }).ok) { closeDialog(); showToast('Welcome to your garage. Let’s see what you can build.'); }
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ui.busy){ui.paused=true;scene.setPlayback({paused:true});}});
window.addEventListener('beforeunload', () => { scene.dispose(); showroomScene?.dispose(); }, { once: true });
// Every session opens in the showroom, so players pick their colours before the garage.
openShowroom();
