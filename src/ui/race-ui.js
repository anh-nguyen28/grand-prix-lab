import { BOOST_COOLDOWN, RACE_LAPS } from '../../shared/content.js';
import { escapeHtml as e, icon } from './icons.js';

let seen=new Set(), feed=[], lastPositions=new Map(), lastAnnouncement=-100, recentIncident=null;
export function resetRaceBroadcast(){seen=new Set();feed=[];lastPositions=new Map();lastAnnouncement=-100;recentIncident=null;}
export function renderTimingTower(race) {
  return `<div class="tower-header"><span class="live-tag">${icon('flag')} LIVE TIMING</span><h2>DUNE VALLEY <span>GRAND PRIX</span></h2><div class="tower-meta"><span>${RACE_LAPS} LAPS</span><span>~4 MIN</span><span>6 DRIVERS</span></div></div><div class="tower-columns"><span>POS / DRIVER</span><span>TO LEADER</span></div><div id="live-standings">${race.field.map(entry=>`<div style="--rank:${entry.grid-1}" data-position="${entry.grid}" class="timing-row ${entry.id==='you'?'is-you':''}" data-driver-row="${entry.id}"><strong class="live-position">${entry.grid}</strong><i style="background:${entry.color}"></i><div class="timing-name"><strong>${e(entry.name)}${entry.id==='you'?'<em>YOU</em>':''}</strong><small>${entry.build.power==='sprint'?'SPRINT PACKAGE · HEAT RISK':e(entry.team||'Your team')}</small></div><span class="live-gap">GRID</span><span class="position-change"></span></div>`).join('')}</div><div class="race-engineer"><div class="eyebrow">${icon('sound')} RACE ENGINEER</div><p id="race-radio">Grid is set. Watch the lights.</p></div><div class="car-condition"><div><span>COOLING LOAD</span><strong id="heat-value">—</strong><i><b id="heat-meter"></b></i></div><div><span>TYRE LIFE</span><strong id="tyre-value">—</strong><i><b id="tyre-meter"></b></i></div><small>Heat rises during a long stint. Worn tyres lose grip.</small></div><div class="race-feed"><span class="eyebrow">ON THE PIT WALL</span><div id="race-feed-items"><p>The opening lap is coming up.</p></div></div>`;
}
export function renderRaceActions(race) {
  return `<div class="action-context"><div class="energy-cells">${[0,1,2].map(i=>`<i class="${i<race.charges?'charged':''}"></i>`).join('')}</div><div><strong>ERS <span id="ers-charges">${race.charges}/3</span></strong><span id="ers-hint">Three bursts. Choose your moment.</span></div></div><div class="action-buttons"><button class="button light" data-action="skip-run">Skip to finish ${icon('arrow')}</button><button class="button primary ers-button" data-action="boost" disabled>${icon('bolt')} <span class="ers-label">Deploy ERS</span><kbd>SPACE</kbd></button></div>`;
}
export function renderBroadcastTools(demo=false) {
  return `<div class="race-cameras" role="group" aria-label="Spectator camera">${demo?'':'<button data-action="race-camera" data-camera="director" class="selected" aria-pressed="true">TV director</button>'}<button data-action="race-camera" data-camera="overview" aria-pressed="false">Circuit</button><button data-action="race-camera" data-camera="you" class="${demo?'selected':''}" aria-pressed="${demo}">Follow me</button></div><div class="playback-controls"><button data-action="pause-race" aria-label="Pause race" aria-pressed="false">Ⅱ</button><button data-action="race-speed" aria-label="Change playback speed">1×</button></div>`;
}
function pushFeed(text,elapsed,type='race') { feed.unshift({text,elapsed,type});feed=feed.slice(0,4); }
export function updateRaceBroadcast(race, broadcast) {
  const {rows,elapsed,started,lights,paused,speed}=broadcast, you=rows.find(row=>row.id==='you'), leader=rows[0];
  const table=document.querySelector('#live-standings');
  if(!table)return;
  for(const row of rows){
    const element=table.querySelector(`[data-driver-row="${row.id}"]`);if(!element)continue;
    element.querySelector('.live-position').textContent=row.retired?'OUT':row.position;
    const oldPosition=Number(element.dataset.position);
    if(oldPosition!==row.position){element.dataset.position=String(row.position);element.style.setProperty('--rank',row.position-1);element.classList.toggle('moving-up',row.position<oldPosition);element.classList.toggle('moving-down',row.position>oldPosition);}
    element.setAttribute('aria-label',`${row.position}. ${row.name}${row.retired?', retired':''}`);
    element.querySelector('.live-gap').textContent=!started?`P${row.grid}`:row.retired?'RETIRED':row.finished?'FINISHED':row.position===1?'LEADER':`+${row.gap.toFixed(2)}`;
    element.querySelector('.timing-name>small').textContent=row.incident?row.incident.label:row.team;
    const gained=row.grid-row.position, change=element.querySelector('.position-change');change.textContent=gained>0?`▲${gained}`:gained<0?`▼${-gained}`:'—';change.className=`position-change ${gained>0?'up':gained<0?'down':''}`;
    element.classList.toggle('deploying',row.boosting);element.classList.toggle('incident-row',!!row.incident);element.classList.toggle('retired-row',row.retired);
    for(const event of row.incidents){
      const key=`${row.id}:${event.lap}:${event.type}`;
      if(row.virtualTime>=event.start&&!seen.has(key)){
        seen.add(key);pushFeed(`${row.name} · ${event.title.toLowerCase()} · ${event.type==='fire'?'RETIRING':`+${event.loss.toFixed(1)}s`}`,elapsed,'incident');
      }
    }
    if(started&&!row.retired&&elapsed>4&&lastPositions.has(row.id)&&row.position<lastPositions.get(row.id)&&elapsed-lastAnnouncement>4){
      pushFeed(`${row.name} moves into P${row.position}.`,elapsed);lastAnnouncement=elapsed;
    }
    lastPositions.set(row.id,row.position);
  }
  const zone=document.querySelector('#race-zone');if(zone)zone.textContent=you.retired?'RETIRED':`YOU · LAP ${you.lap} · ${you.zone.name} · ${you.zone.label}`;
  const advantage=document.querySelector('#race-advantage');if(advantage)advantage.textContent=you.retired?'Cooling failure ended your race':you.incident?.type==='fire'?'Brake fire · pulling aside to retire':you.incident?`${you.incident.title} · losing time`:you.zone.kind==='straight'&&['torque','sprint'].includes(you.build.power)?'HIGH OUTPUT · gaining on the straight':you.zone.kind==='corner'&&you.build.body==='carbon'?'HIGH DOWNFORCE · holding the corner':you.zone.kind==='corner'&&you.build.body==='scout'?'LOW DOWNFORCE · less cornering grip':you.build.wheels==='tracks'&&you.lap>=5?'ENDURANCE TYRES · keeping late-race grip':'Your fitted parts determine the pace here';
  const lap=document.querySelector('#race-lap');if(lap)lap.textContent=`${String(leader.lap).padStart(2,'0')} / ${String(race.laps).padStart(2,'0')}`;
  const position=document.querySelector('#your-position');if(position)position.textContent=you.retired?'OUT':`P${you.position}`;
  const clock=document.querySelector('#race-clock');if(clock)clock.textContent=`${Math.floor(elapsed/60)}:${(elapsed%60).toFixed(1).padStart(4,'0')}`;
  const chapter=document.querySelector('#race-chapter');if(chapter)chapter.textContent=paused?'PAUSED':!started?'STARTING GRID':leader.lap===race.laps?'FINAL LAP':leader.lap<=2?'THE OPENING BATTLE':leader.lap>=6?'THE FINAL PUSH':'THE LONG GAME';
  document.querySelectorAll('.start-lights>i').forEach((light,i)=>light.classList.toggle('on',i<lights));
  const lightsElement=document.querySelector('.start-sequence');if(lightsElement)lightsElement.hidden=started;
  const uses=race.boosts.filter(boost=>boost.id==='you'),cooldown=uses.length?Math.max(0,BOOST_COOLDOWN-(elapsed-uses.at(-1).at)):0;
  const button=document.querySelector('[data-action="boost"]');
  if(button){button.disabled=!started||paused||race.charges===0||cooldown>0||you.finished||you.retired;button.querySelector('.ers-label').textContent=you.retired?'Car retired':paused?'Race paused':you.boosting?'ERS deployed':cooldown>0?'Recharging':race.charges===0?'ERS depleted':'Deploy ERS';}
  const hint=document.querySelector('#ers-hint');if(hint)hint.textContent=!started?'Wait for lights out.':you.boosting?'Power deployed. Close the gap.':cooldown>0?`Recharging · ${Math.ceil(cooldown)} race seconds`:'Three bursts. Choose your moment.';
  const radio=document.querySelector('#race-radio');
  if(radio)radio.textContent=you.retired?'Your car has retired. Its cooling could not last the race. Follow the remaining battle, then review the build.':you.incident?`${you.incident.title}. ${you.incident.remedy}`:!started?`${you.name}, you start P${you.grid}. Eight laps. Make it count.`:you.finished?'Chequered flag. Bring it home.':you.boosting?'Deploying ERS. You’ve got extra power.':leader.lap===race.laps?'Final lap. Use any energy you have left.':you.position===1?'You’re leading. Keep the pace and protect the gap.':`${rows[you.position-2].name} is ahead. The gap is ${(you.gap-rows[you.position-2].gap).toFixed(1)} seconds.`;
  const banner=document.querySelector('#incident-banner'),current=(you.incident?.type==='fire'&&!you.retired?you:null)||rows.find(row=>row.incident?.type==='fire'&&!row.retired)||(you.incident&&!you.retired?you:rows.find(row=>row.incident&&!row.retired));
  if(current)recentIncident={name:current.name,id:current.id,event:current.incident,until:elapsed+8};
  const shown=recentIncident&&elapsed<=recentIncident.until?recentIncident:null;
  if(banner){banner.hidden=!shown;if(shown){const event=shown.event;banner.dataset.incidentType=event.type;const key=JSON.stringify([shown.id,shown.name,event.type,event.lap,!!current]);if(banner.dataset.key!==key){banner.dataset.key=key;banner.innerHTML=`<span>${current?'':'RECENT · '}${e(event.label)}</span><strong>${e(shown.name)} · ${e(event.title)}</strong><p>${e(event.cause)}</p><div><small>${event.type==='fire'?'Race-ending failure · retirement':`Time cost +${event.loss.toFixed(1)}s`}</small><button data-action="follow-incident" data-driver-id="${e(shown.id)}">Follow ${e(shown.name)} ${icon('eye')}</button></div>`;}}}
  const heat=document.querySelector('#heat-value'),tyre=document.querySelector('#tyre-value');
  if(heat){heat.textContent=you.retired?'FAILED':you.heat>85?'CRITICAL':you.heat>68?'WARM':'NORMAL';document.querySelector('#heat-meter').style.width=`${you.heat}%`;heat.classList.toggle('hot',you.heat>80);}
  if(tyre){tyre.textContent=`${you.tyreLife}%`;document.querySelector('#tyre-meter').style.width=`${you.tyreLife}%`;}
  const items=document.querySelector('#race-feed-items');if(items&&feed.length)items.innerHTML=feed.slice(0,3).map(item=>`<p class="${item.type}"><time>${Math.floor(item.elapsed/60)}:${String(Math.floor(item.elapsed%60)).padStart(2,'0')}</time>${e(item.text)}</p>`).join('');
  const pause=document.querySelector('[data-action="pause-race"]');if(pause){pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Resume race':'Pause race');pause.setAttribute('aria-pressed',String(!!paused));}
  const speedButton=document.querySelector('[data-action="race-speed"]');if(speedButton)speedButton.textContent=`${speed||1}×`;
}
