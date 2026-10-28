import { BUDGET, PARTS, SLOT_LABELS, SLOTS } from '../../shared/content.js';
import { ENGINEERING, INCIDENTS, setupRisks, specSheet } from '../../shared/engineering.js';
import { buildStats } from '../../shared/simulation.js';
import { trackById } from '../../shared/tracks.js';
import { changedSlots } from '../../shared/game.js';
import { escapeHtml as e, icon } from './icons.js';
import { partArt } from './part-art.js';

export function partAvailability(state, id, busy = false) {
  const part = PARTS[id], next = {...state.build,[part.slot]:id};
  if(busy || !['practice','adjust'].includes(state.phase)) return 'Build locked';
  if(part.slot==='sensor' && state.sensorLocked) return 'Sensor locked';
  if(buildStats(next).cost>BUDGET) return 'Over budget';
  if(state.phase==='adjust'&&changedSlots(state,next).length>2) return 'Two slots changed';
  return null;
}
export function renderPartShelf(state, category, busy, suggested = new Set()) {
  return Object.values(PARTS).filter(part=>part.slot===category).map(part=>{
    const selected=state.build[category]===part.id, reason=partAvailability(state,part.id,busy);
    return `<article class="shelf-part ${selected?'is-fitted':''} ${suggested.has(part.id)&&!selected?'is-suggested':''}" data-part-id="${part.id}"><button class="part-object" data-action="pick-part" data-id="${part.id}" aria-label="Pick up ${part.name}" aria-pressed="false" ${reason?'disabled':''}>${partArt(part.id)}<span class="part-pedestal"></span><span class="part-fitted">${selected?`${icon('check')} FITTED`:reason||(suggested.has(part.id)?'FIXES THE RISK':'DRAG TO CAR')}</span></button><div class="shelf-caption"><strong>${part.name}</strong><span>${part.cost}<small> CR</small></span></div><p>${ENGINEERING[part.id].tagline}</p><button class="part-details" data-action="part-details" data-id="${part.id}">More details ${icon('arrow')}<span class="sr-only"> about ${part.name}</span></button></article>`;
  }).join('');
}
// Stat bars start at the previous value and slide to the new one, with the change shown beside them.
let shownSpecs = null;
const tone = value => value >= 70 ? 'good' : value >= 40 ? 'average' : 'low';
const verdict = value => value >= 70 ? 'Strong' : value >= 40 ? 'Average' : 'Weak';
export function renderEngineering(state) {
  const tested=state.qualifying||state.runs.at(-1), risks=tested?setupRisks(tested.build,trackById(tested.trackId)):[], stats=buildStats(state.build), specs=specSheet(state.build), previous=shownSpecs;
  shownSpecs=Object.fromEntries(specs.map(spec=>[spec.id,spec.value]));
  return `<div class="engineering-header"><span class="eyebrow">CAR STATS</span><button data-action="incident-lab">Preview failures ${icon('arrow')}</button></div><h2 class="stats-title">How your car will race</h2><div class="spec-sheet">${specs.map(spec=>{
    const before=previous?.[spec.id]??spec.value, delta=spec.value-before;
    return `<div class="spec tone-${tone(spec.value)}"><span>${spec.label}</span><strong>${delta?`<em class="spec-delta ${delta>0?'up':'down'}">${delta>0?'+':'−'}${Math.abs(delta)}</em>`:''}${verdict(spec.value)} <small>${spec.value}</small></strong><i><b class="tone-${tone(before)}" style="width:${before}%" data-target="${spec.value}" data-tone="${tone(spec.value)}"></b></i></div>`;
  }).join('')}</div>${tested?`<div class="setup-risks">${risks.length?risks.map(risk=>`<button data-action="incident-info" data-type="${risk.type}">${icon('info')}<span><strong>${risk.text}</strong><small>${risk.detail}</small></span>${icon('chevron')}</button>`).join(''):'<span class="clean-setup">✓ No major handling or cooling risk. Speed is another question.</span>'}</div>`:''}<div class="fitted-parts"><span class="eyebrow">FITTED PARTS</span>${SLOTS.map(slot=>`<div><span>${SLOT_LABELS[slot]}</span><strong>${PARTS[state.build[slot]].name}</strong><em>${PARTS[state.build[slot]].cost} cr</em></div>`).join('')}<div class="fitted-total"><span>Total</span><em>${stats.cost} / ${BUDGET} cr</em></div></div>`;
}
// Called after the panel is in the page, so the bars animate from their old width and colour.
export function animateSpecs(container) {
  container.offsetWidth;
  requestAnimationFrame(() => container.querySelectorAll('.spec-sheet b[data-target]').forEach(bar => { bar.style.width = `${bar.dataset.target}%`; bar.className = `tone-${bar.dataset.tone}`; }));
}
function frame(content) {return `<div class="dialog-content engineering-dialog"><button class="dialog-close icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button>${content}</div>`;}
export function partDetailsDialog(state,id,busy=false) {
  const part=PARTS[id], info=ENGINEERING[id], fitted=state.build[part.slot]===id, installed=PARTS[state.build[part.slot]], reason=partAvailability(state,id,busy), delta=part.cost-installed.cost;
  return frame(`<div class="part-detail-hero">${partArt(id)}<span>${SLOT_LABELS[part.slot]} / ${part.cost} CR</span></div><span class="eyebrow">THE ENGINEERING CHOICE</span><h2 id="dialog-title">${part.name}</h2><p class="dialog-lead">${info.tagline}</p><div class="detail-facts"><div><span>WHAT YOU GAIN</span><p>${info.benefits}</p></div><div><span>THE COMPROMISE</span><p>${info.tradeoff}</p></div><div><span>WHAT YOU WILL SEE</span><p>${info.watch}</p></div></div>${info.ratings?`<div class="detail-ratings">${Object.entries(info.ratings).map(([key,value])=>`<div><span>${key}</span><i><b style="width:${value}%"></b></i><strong>${value}/100</strong></div>`).join('')}</div><p class="detail-note">Relative prototype ratings, not real-world specifications.</p>`:''}<div class="fit-summary"><span>Replacing ${installed.name}</span><strong>${delta>0?'+':''}${delta} credits</strong></div><div class="dialog-buttons"><button class="button primary" data-action="fit-part" data-id="${id}" ${reason||fitted?'disabled':''}>${fitted?'Already fitted':reason||'Fit to car'} ${icon('check')}</button>${info.demo?`<button class="button light" data-action="incident-demo" data-type="${info.demo}" ${busy?'disabled':''}>See the effect on track ${icon('play')}</button>`:''}</div>`);
}
export function incidentLabDialog(type=null,busy=false) {
  if(type){const item=INCIDENTS[type];return frame(`<span class="eyebrow">ENGINEERING LAB / ${type==='fire'?'ISOLATED FAULT':'HANDLING & RELIABILITY'}</span><h2 id="dialog-title">${item.title}</h2><p class="dialog-lead">${item.cause}</p><div class="detail-facts"><div><span>HOW TO RESPOND</span><p>${item.remedy}</p></div><div><span>IN THIS PROTOTYPE</span><p>${type==='fire'?'The uncooled sprint package also reaches this failure during a full race. Press Test car to see it on your lap.':'Exposed setups meet this in the race. Press Test car to watch it happen on your lap, with the time it costs.'}</p></div></div><div class="dialog-buttons"><button class="button light" data-action="incident-lab">All scenarios</button></div>`);}
  return frame(`<span class="eyebrow">ENGINEERING LAB</span><h2 id="dialog-title">See cause and effect.</h2><p class="dialog-lead">Inspect a handling problem or mechanical fault from outside the car.</p><div class="incident-options">${Object.entries(INCIDENTS).map(([id,item])=>`<button data-action="incident-info" data-type="${id}"><span>${{wheelspin:'↗',understeer:'↪',overheat:'♨',brakefade:'!',contact:'✳',fire:'♨',crash:'✖',aquaplane:'≈',coldslide:'❄',tyreshred:'◌',bumpbreak:'⚡'}[id]}</span><div><strong>${item.title}</strong><small>${id==='fire'?'Cooling failure · can end a race':'Visible race consequence'}</small></div>${icon('chevron')}</button>`).join('')}</div>`);
}
