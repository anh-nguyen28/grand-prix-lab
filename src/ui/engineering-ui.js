import { BUDGET, PARTS, SLOT_LABELS } from '../../shared/content.js';
import { ENGINEERING, INCIDENTS, engineeringStats, setupRisks } from '../../shared/engineering.js';
import { buildStats } from '../../shared/simulation.js';
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
export function renderPartShelf(state, category, busy) {
  return Object.values(PARTS).filter(part=>part.slot===category).map(part=>{
    const selected=state.build[category]===part.id, reason=partAvailability(state,part.id,busy);
    return `<article class="shelf-part ${selected?'is-fitted':''}" data-part-id="${part.id}"><button class="part-object" data-action="pick-part" data-id="${part.id}" aria-label="Pick up ${part.name}" aria-pressed="false" ${reason?'disabled':''}>${partArt(part.id)}<span class="part-pedestal"></span><span class="part-fitted">${selected?`${icon('check')} FITTED`:reason||'DRAG TO CAR'}</span></button><div class="shelf-caption"><strong>${part.name}</strong><span>${part.cost}<small> CR</small></span></div><p>${ENGINEERING[part.id].tagline}</p><button class="part-details" data-action="part-details" data-id="${part.id}">More details ${icon('arrow')}<span class="sr-only"> about ${part.name}</span></button></article>`;
  }).join('');
}
export function renderEngineering(state) {
  const stats=engineeringStats(state.build), risks=setupRisks(state.build);
  return `<div class="engineering-header"><span class="eyebrow">HOW YOUR CAR WILL RACE</span><button data-action="incident-lab">Preview failures ${icon('arrow')}</button></div><p class="build-purpose">These are the strengths and risks of your fitted parts. They affect your speed, turning and chance of finishing.</p><div class="engineering-meters">${Object.entries(stats).map(([label,value])=>`<div><span>${label==='endurance'?'Tyre life':label==='cooling'?'Cooling margin':'Cornering'}</span><strong>${value>=75?'Strong':value>=55?'Balanced':'Limited'}</strong><i><b style="width:${value}%;--meter:${value<50?'#ffab75':'#7bd8be'}"></b></i></div>`).join('')}</div><div class="setup-risks">${risks.length?risks.map(risk=>`<button data-action="incident-info" data-type="${risk.type}">${icon('info')}<span><strong>${risk.text}</strong><small>${risk.detail}</small></span>${icon('chevron')}</button>`).join(''):'<span class="clean-setup">✓ This build can finish without a major handling or cooling problem</span>'}</div>`;
}
function frame(content) {return `<div class="dialog-content engineering-dialog"><button class="dialog-close icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button>${content}</div>`;}
export function partDetailsDialog(state,id,busy=false) {
  const part=PARTS[id], info=ENGINEERING[id], fitted=state.build[part.slot]===id, installed=PARTS[state.build[part.slot]], reason=partAvailability(state,id,busy), delta=part.cost-installed.cost;
  return frame(`<div class="part-detail-hero">${partArt(id)}<span>${SLOT_LABELS[part.slot]} / ${part.cost} CR</span></div><span class="eyebrow">THE ENGINEERING CHOICE</span><h2 id="dialog-title">${part.name}</h2><p class="dialog-lead">${info.tagline}</p><div class="detail-facts"><div><span>WHAT YOU GAIN</span><p>${info.benefits}</p></div><div><span>THE COMPROMISE</span><p>${info.tradeoff}</p></div><div><span>WHAT YOU WILL SEE</span><p>${info.watch}</p></div></div>${info.ratings?`<div class="detail-ratings">${Object.entries(info.ratings).map(([key,value])=>`<div><span>${key}</span><i><b style="width:${value}%"></b></i><strong>${value}/100</strong></div>`).join('')}</div><p class="detail-note">Relative prototype ratings, not real-world specifications.</p>`:''}<div class="fit-summary"><span>Replacing ${installed.name}</span><strong>${delta>0?'+':''}${delta} credits</strong></div><div class="dialog-buttons"><button class="button primary" data-action="fit-part" data-id="${id}" ${reason||fitted?'disabled':''}>${fitted?'Already fitted':reason||'Fit to car'} ${icon('check')}</button>${info.demo?`<button class="button light" data-action="incident-demo" data-type="${info.demo}" ${busy?'disabled':''}>See the effect on track ${icon('play')}</button>`:''}</div>`);
}
export function incidentLabDialog(type=null,busy=false) {
  if(type){const item=INCIDENTS[type];return frame(`<span class="eyebrow">ENGINEERING LAB / ${type==='fire'?'ISOLATED FAULT':'HANDLING & RELIABILITY'}</span><h2 id="dialog-title">${item.title}</h2><p class="dialog-lead">${item.cause}</p><div class="detail-facts"><div><span>HOW TO RESPOND</span><p>${item.remedy}</p></div><div><span>IN THIS PROTOTYPE</span><p>${type==='fire'?'The uncooled sprint package also reaches this failure during a full race. The lab lets you inspect it without risking points.':'Exposed setups encounter repeatable incidents during the race. You see the line change, the effect and the time cost together.'}</p></div></div><div class="dialog-buttons"><button class="button primary" data-action="incident-demo" data-type="${type}" ${busy?'disabled':''}>Watch the 18-second demo ${icon('play')}</button><button class="button light" data-action="incident-lab">All scenarios</button></div><p class="detail-note">Demonstrations use a controlled car and do not change your setup, tests or score.</p>`);}
  return frame(`<span class="eyebrow">ENGINEERING LAB</span><h2 id="dialog-title">See cause and effect.</h2><p class="dialog-lead">Inspect a handling problem or mechanical fault from outside the car.</p><div class="incident-options">${Object.entries(INCIDENTS).map(([id,item])=>`<button data-action="incident-info" data-type="${id}"><span>${{wheelspin:'↗',understeer:'↪',overheat:'♨',brakefade:'!',contact:'✳',fire:'♨'}[id]}</span><div><strong>${item.title}</strong><small>${id==='fire'?'Cooling failure · can end a race':'Visible race consequence'}</small></div>${icon('chevron')}</button>`).join('')}</div>`);
}
