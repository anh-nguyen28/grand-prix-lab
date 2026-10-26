import '@fontsource-variable/dm-sans';
import '@fontsource-variable/space-grotesk';
import './styles.css';
import './f1.css';
import './engineering.css';
import { PARTS, RACE_LAPS, RACE_PLAYBACK_MS } from '../shared/content.js';
import { updateRaceBroadcast, renderBroadcastTools, resetRaceBroadcast } from './ui/race-ui.js';
import { renderEngineering, partDetailsDialog, incidentLabDialog, partAvailability } from './ui/engineering-ui.js';
import { createAssemblyInteraction } from './ui/assembly.js';
import { createIncidentDemo } from '../shared/race.js';
import { INCIDENTS } from '../shared/engineering.js';
import { createLocalSession } from './adapters/local-session.js';
import { createWorkshop } from './scene/workshop.js';
import { renderShell, renderParts, renderIntel, renderStats, renderActions, renderSteps } from './ui/render.js';
import { briefingDialog, helpDialog, predictionWarningDialog, profileDialog, roundConceptDialog, seasonDialog } from './ui/dialogs.js';
import { icon } from './ui/icons.js';

const app = document.querySelector('#app');
app.innerHTML = renderShell();
const session = createLocalSession();
const ui = { category: 'wheels', intelTab: 'clues', guess: null, view: 'rover', busy: false, scanning: false, runLabel: '', raceTelemetry: null, armedPart: null, demo: null, paused: false, playbackSpeed: 1 };
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
  document.querySelector('.scene-number').hidden = view !== 'rover';
  document.querySelector('#scene-hint').innerHTML = `${icon('eye')} ${view === 'rover' ? 'DRAG TO LOOK AROUND' : 'DUNE VALLEY CIRCUIT / BROADCAST VIEW'}`;
}
function render() {
  const state = session.getSnapshot();
  const bonusOpen = document.querySelector('.optional-puzzle')?.open;
  liveRace = state.race;
  const focused = document.activeElement;
  const focusKey = focused?.dataset?.action ? { action: focused.dataset.action, id: focused.dataset.id, category: focused.dataset.category, tab: focused.dataset.tab, terrain: focused.dataset.terrain } : null;
  if(state.phase!=='race'||!document.querySelector('#live-standings'))document.querySelector('#parts-panel').innerHTML = renderParts(state, ui);
  document.querySelector('#engineering-panel').innerHTML = renderEngineering(state);
  document.querySelector('#garage-driver-name').textContent = state.profile.name;
  document.querySelector('#intel-panel').innerHTML = renderIntel(state, ui);
  if (bonusOpen && document.querySelector('.optional-puzzle')) document.querySelector('.optional-puzzle').open = true;
  document.querySelector('#stats').innerHTML = renderStats(state);
  document.querySelector('#action-bar').innerHTML = renderActions(state, ui);
  document.querySelector('#steps').innerHTML = renderSteps(state);
  document.querySelector('#profile-label').textContent = state.profile.name;
  const copy = ui.demo ? ['THE INCIDENT LAB', INCIDENTS[ui.demo].title, 'A controlled demonstration. Your setup, tests and score are unchanged.'] : state.phase === 'results'
    ? ['THE REVEAL', 'Every run teaches you something.', 'The finish line is only half the story. Here’s what your car discovered.']
    : state.phase === 'adjust'
      ? ['THE FINAL TUNE-UP', 'A little feedback. A better build.', 'Your qualifying run is in. Change up to two slots, then make it count.']
      : state.phase === 'race'
        ? ['THE GRAND PRIX', 'Let your build do the talking.', 'Eight laps. Four minutes. Watch your engineering come alive.']
        : ['THE PADDOCK', 'Your race starts in the garage.', 'Read the circuit. Dial in your setup. Earn your place on the grid.'];
  ['eyebrow', 'heading', 'subheading'].forEach((id, i) => { document.getElementById(id).textContent = copy[i]; });
  document.querySelector('#rover-title').innerHTML = `CAR 07 <span>/ ${state.phase === 'practice' ? 'PERFORMANCE LAB' : state.phase === 'adjust' ? 'THE FINAL TUNE-UP' : 'DUNE VALLEY'}</span>`;
  document.querySelector('.workspace').classList.toggle('show-results', state.phase === 'results');
  document.querySelector('.workspace').classList.toggle('race-mode', state.phase === 'race' || !!ui.demo);
  document.body.classList.toggle('race-active', state.phase === 'race' || !!ui.demo);
  document.querySelector('.workspace').classList.toggle('demo-mode', !!ui.demo);
  document.querySelector('.driver-identity').disabled = ui.busy;
  scene.setAssembly(state, ui.armedPart);
  scene.setBuild(state.build);
  scene.setKnowledge?.(state.runs.length > 0 || state.phase !== 'practice');
  if (state.phase === 'race' && ui.raceTelemetry) updateRaceBroadcast(state.race, ui.raceTelemetry);
  if (focusKey && !dialog.open) {
    const candidates = [...document.querySelectorAll(`[data-action="${focusKey.action}"]`)];
    candidates.find(el => ['id', 'category', 'tab', 'terrain'].every(key => !focusKey[key] || el.dataset[key] === focusKey[key]))?.focus({ preventScroll: true });
  }
}
session.subscribe(render);
render();

function armPart(id) {
  if(id && (ui.scanning || partAvailability(session.getSnapshot(),id,ui.busy)))return;
  ui.armedPart=id;scene.setArmedPart(id);
  document.querySelectorAll('[data-action="pick-part"]').forEach(button=>{button.classList.toggle('picked-up',button.dataset.id===id);button.setAttribute('aria-pressed',String(button.dataset.id===id));});
  const instruction=document.querySelector('#assembly-instruction');
  if(instruction)instruction.textContent=id?`${PARTS[id].name} picked up. Drop on the car or tap its highlighted fitting point.`:'Drag a part onto your car. Or tap a part, then its fitting point.';
  if(id){setView('rover');if(matchMedia('(max-width: 640px)').matches)document.querySelector('.scene-card').scrollIntoView({behavior:'instant',block:'center'});}
}
function fitPart(id) {
  if(ui.scanning){showToast('Let the scan finish before fitting a part.');return;}
  const result=dispatch({type:'SET_PART',id});
  if(result.ok){ui.armedPart=null;scene.setArmedPart(null);if(dialog.open)closeDialog();setView('rover');render();showToast(`${PARTS[id].name} fitted. “How your car will race” explains the effect below.`);}
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
  overlay.innerHTML=racing?`<div class="start-sequence"><span>YOUR DRIVER · ${session.getSnapshot().profile.name.replaceAll('&','&amp;').replaceAll('<','&lt;')}</span><div class="start-lights">${'<i></i>'.repeat(5)}</div><strong>HOLD YOUR BREATH.</strong></div><div class="broadcast-hud"><span class="live-tag"><span class="live-dot"></span><span id="race-chapter">STARTING GRID</span></span><div><small>RACE LAP</small><strong id="race-lap">01 / ${String(RACE_LAPS).padStart(2,'0')}</strong></div><div><small>YOUR POSITION</small><strong id="your-position">—</strong></div><div><small>RACE TIME</small><strong id="race-clock">0:00.0</strong></div></div><div class="run-progress"><i></i></div>`:`<div><span class="live-dot"></span><strong>${label}</strong><span id="run-progress-label">0%</span></div><div class="run-progress"><i></i></div>`;
  if(demoRace)overlay.querySelector('.start-sequence').hidden=true;
  finishRun=()=>{
    if(token!==runToken)return;runToken++;finishRun=null;ui.busy=false;overlay.hidden=true;tools.hidden=true;caption.hidden=true;document.querySelector('#corner-readout').hidden=true;document.querySelector('#incident-banner').hidden=true;
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
  beginAnimation([{ id: 'you', name: updated.profile.name, build: updated.build, result: run, color: '#ff3b38' }], type === 'test' ? `Practice run 0${updated.runs.length}` : 'Qualifying lap', () => {
    ui.intelTab = 'runs';
    if (type === 'qualify') dispatch({ type: 'FINISH_QUALIFY' });
    setView('rover');
    showToast(type === 'test' ? 'Run complete. Your report shows what to try next.' : 'Benchmark set. You can now adjust two part slots.');
  });
}
function reset() {
  if (ui.busy) return;
  scanToken++; ui.scanning = false; ui.guess = null; ui.category = 'wheels'; ui.intelTab = 'clues'; ui.raceTelemetry = null; ui.armedPart = null; ui.demo = null;
  session.reset(); setView('rover'); closeDialog(); showToast('Fresh car, fresh possibilities. Your two practice runs are ready.');
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const { action } = button.dataset;
  if (action === 'home') event.preventDefault();
  if (ui.busy && !['skip-run', 'boost', 'help', 'camera', 'close-dialog', 'race-camera', 'follow-incident', 'pause-race', 'race-speed', 'part-details', 'incident-lab', 'incident-info'].includes(action)) { showToast('Let this run finish, or skip its animation.'); return; }
  switch (action) {
    case 'home': case 'briefing': openDialog(briefingDialog()); break;
    case 'workshop': closeDialog(); document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
    case 'help': openDialog(helpDialog()); break;
    case 'season': openDialog(seasonDialog()); break;
    case 'season-round': if (button.dataset.round === '01') { closeDialog(); if (session.getSnapshot().phase === 'results') reset(); } else openDialog(roundConceptDialog(button.dataset.round)); break;
    case 'profile': openDialog(profileDialog(session.getSnapshot())); break;
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
    case 'intel-tab': ui.intelTab = button.dataset.tab; render(); break;
    case 'view': setView(button.dataset.view); break;
    case 'camera': scene.resetCamera(); break;
    case 'test': case 'qualify': startRun(action); break;
    case 'run-without-guess': closeDialog(); startRun(button.dataset.next, true); break;
    case 'return-prediction': closeDialog(); ui.intelTab = 'clues'; render(); if(document.querySelector('.optional-puzzle'))document.querySelector('.optional-puzzle').open=true; document.querySelector('.prediction')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.querySelector('[data-action="guess"]')?.focus(); break;
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
    case 'reset': reset(); break;
  }
});
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.repeat || dialog.open || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
  if (session.getSnapshot().phase === 'race') { event.preventDefault(); document.querySelector('[data-action="boost"]')?.click(); }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'profile-form') return;
  event.preventDefault(); const form = new FormData(event.target);
  if (session.getSnapshot().phase !== 'practice') session.reset();
  if (dispatch({ type: 'SET_PROFILE', name: form.get('name'), mode: form.get('mode') }).ok) { closeDialog(); showToast('Welcome to your garage. Let’s see what you can build.'); }
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ui.busy){ui.paused=true;scene.setPlayback({paused:true});}});
window.addEventListener('beforeunload', () => scene.dispose(), { once: true });
