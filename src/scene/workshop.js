import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { box, cylinder, disposeGroup, material, batchStaticGeometry } from './geometry.js';
import { makeRaceCar } from './racecar.js';
import { makeCircuit } from './circuit.js';
import { trackById } from '../../shared/tracks.js';
import { sampleRace } from '../../shared/race.js';
import { PARTS, SLOT_LABELS, driverCode } from '../../shared/content.js';
import { makeCarEffects } from './effects.js';
import { teamLogo } from '../ui/team-logo.js';

export function createWorkshop(container) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch { container.innerHTML = '<div class="scene-fallback"><strong>Your car is ready.</strong><p>3D is unavailable in this browser. You can still set up and test your car.</p></div>'; return { setBuild() {}, setView() {}, resetCamera() {}, setAssembly() {}, setArmedPart() {}, setRaceCamera() {}, setPlayback() {}, animateRun: (_entries, _duration, done) => setTimeout(done, 800), finishAnimation() {}, dispose() {} }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  container.append(renderer.domElement); renderer.domElement.setAttribute('aria-label', 'Interactive open-wheel race car. Drag to rotate.');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#161d28'); scene.fog = new THREE.Fog('#161d28', 120, 240);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 350);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 8; controls.maxDistance = 100; controls.maxPolarAngle = Math.PI * .46; controls.minPolarAngle = .25;
  scene.add(new THREE.HemisphereLight('#e2eeff', '#30313b', 2.2));
  const sun = new THREE.DirectionalLight('#f7f6ed', 3.4); sun.position.set(8, 16, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera, { left:-28,right:28,top:28,bottom:-28 }); sun.shadow.normalBias = .025; scene.add(sun);
  const rim = new THREE.DirectionalLight('#8eaeff', 2.5); rim.position.set(-5, 5, -8); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(180,180), material('#1c2330',.85)); floor.rotation.x = -Math.PI / 2; floor.position.y = -.32; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(90,90,'#3c4554','#2c3544'); grid.position.y = -.31; scene.add(grid);
  const garage = new THREE.Group(); scene.add(garage);
  cylinder(garage,3.9,.23,[0,-.1,0],material('#090f18'),80);
  cylinder(garage,3.88,.1,[0,.07,0],material('#394453',.45,.2),80);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6,.025,8,100),new THREE.MeshBasicMaterial({color:'#e5353e'})); ring.rotation.x = Math.PI / 2; ring.position.y = .13; garage.add(ring);
  for (const z of [-4.5,4.5]) box(garage,[9,.025,.035],[0,-.27,z],material('#596372'),0);
  for (let i=0;i<4;i++) {cylinder(garage,.47,.38,[-4.5,.05+i*.38,-2.4],material('#111722'),20);if(i===3)cylinder(garage,.28,.01,[-4.5,.25+i*.38,-2.4],material('#5e6879'),16);}
  box(garage,[.8,.85,1.5],[4.5,.15,-2.6],material('#d43640'),.05);
  for(let i=0;i<4;i++)box(garage,[.025,.025,1.25],[4.91,-.1+i*.17,-2.6],material('#929eab'),.005);
  batchStaticGeometry(garage);
  // The circuit is rebuilt when the player picks another track. Cars live in `runners`, which moves with it.
  let circuit = null, trackId = null, landmarkLabels = [];
  const runners = new THREE.Group();
  const labelLayer = document.createElement('div'); labelLayer.className = 'car-name-layer'; labelLayer.setAttribute('aria-label','Driver names above race cars'); container.append(labelLayer);
  const connectorLayer = document.createElementNS('http://www.w3.org/2000/svg','svg'); connectorLayer.classList.add('name-connectors'); labelLayer.append(connectorLayer);
  const fittings=document.createElement('div');fittings.className='assembly-targets';container.append(fittings);
  const landmarkLayer=document.createElement('div');landmarkLayer.className='track-landmarks';container.append(landmarkLayer);
  const map=document.createElement('div');map.className='circuit-map';container.append(map);
  map.innerHTML=`<span>CIRCUIT POSITION</span><svg viewBox="-23 -17 46 34" aria-label="Circuit map"><path d=""/><g class="map-pins"></g><g class="map-cars"></g></svg>`;
  function setTrack(id){
    const track=trackById(id);if(circuit&&trackId===track.id)return;
    const visible=circuit?.group.visible??false;
    if(circuit){scene.remove(circuit.group);circuit.group.traverse(node=>{node.geometry?.dispose();});}
    trackId=track.id;circuit=makeCircuit(track);circuit.group.visible=visible;scene.add(circuit.group);circuit.group.add(runners);
    landmarkLayer.replaceChildren();
    landmarkLabels=circuit.landmarks.map(mark=>{const element=document.createElement('span');element.innerHTML=`<b>${mark.name}</b><small>${mark.label}</small>`;landmarkLayer.append(element);return {...mark,element};});
    map.querySelector('path').setAttribute('d',`M${circuit.mapPoints.map(point=>point.join(',')).join('L')}Z`);
  }
  setTrack('dune');
  const pipFrame=document.createElement('div');pipFrame.className='pip-frame';pipFrame.hidden=true;container.append(pipFrame);
  const pipCamera=new THREE.PerspectiveCamera(36,1.6,.1,350);
  const fittingLines=document.createElementNS('http://www.w3.org/2000/svg','svg');fittingLines.classList.add('fitting-lines');fittings.append(fittingLines);
  const anchors={wheels:[1.5,.8,1.2],power:[-1.4,1.2,0],body:[-2.12,1.6,0],chassis:[.3,.4,-1.0],sensor:[-.85,1.9,0]};
  const fittingButtons=Object.entries(anchors).map(([slot,anchor],i)=>{
    const button=document.createElement('button');button.className='assembly-target';button.dataset.action='fit-target';button.dataset.fitSlot=slot;
    button.innerHTML=`<b>0${i+1}</b><span><small>${SLOT_LABELS[slot]}</small><strong></strong></span><em>+</em>`;fittings.append(button);
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');fittingLines.append(line);
    const dot=document.createElement('i');dot.className='fitting-dot';fittings.append(dot);
    return {slot,anchor,button,line,dot};
  });
  let lastFrame=-100,car=null,lastBuild='',livery=null,view='rover',active=null,actors=[],disposed=false,frame,armed=null,raceCamera='overview',directorFocus='you',directorUntil=0;
  // Broadcast direction: every incident is logged, queued for the main camera, and pinned on the minimap.
  const MIN_HOLD=4,incidentLog=new Map();let directorIncident=null,pip=null,lastMain=null;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vector=new THREE.Vector3(),followTarget=new THREE.Vector3();
  function resetCamera(){
    raceCamera='overview';
    if(view==='rover'){camera.position.set(7.8,5.5,8.6);controls.target.set(0,.45,0);}
    else{const ratio=container.clientWidth/container.clientHeight,scale=Math.max(1,.88/ratio);camera.position.set(33*scale,40*scale,45*scale);controls.target.set(-1,.3,0);}
    controls.enabled=true;controls.update();renderer.shadowMap.needsUpdate=true;
  }
  // The garage frames one car, so it gets a tight, sharp shadow and no grid; the course keeps the wide setup.
  function applyViewLook(){
    const garageView=view==='rover',size=garageView?7:28,map=garageView?2048:1024;
    camera.fov=garageView?32:36;camera.updateProjectionMatrix();grid.visible=!garageView;
    Object.assign(sun.shadow.camera,{left:-size,right:size,top:size,bottom:-size});sun.shadow.camera.updateProjectionMatrix();
    if(sun.shadow.mapSize.x!==map){sun.shadow.mapSize.set(map,map);sun.shadow.map?.dispose();sun.shadow.map=null;}
    renderer.shadowMap.needsUpdate=true;
  }
  // Only a real change of view resets the camera; fitting parts keeps the player's chosen angle.
  function setView(next){const changed=next!==view;view=next;garage.visible=next==='rover';circuit.group.visible=next==='course';labelLayer.hidden=next!=='course';fittings.hidden=next!=='rover';landmarkLayer.hidden=next!=='course';map.hidden=next!=='course';if(changed){resetCamera();applyViewLook();}}
  function setBuild(build,nextLivery=null){const key=JSON.stringify([build,nextLivery]);if(key===lastBuild)return;lastBuild=key;livery=nextLivery;if(car)disposeGroup(car);car=makeRaceCar(build,livery||undefined);car.position.y=.14;garage.add(car);renderer.shadowMap.needsUpdate=true;}
  function setAssembly(state,part,category=null){
    for(const item of fittingButtons){item.button.querySelector('strong').textContent=PARTS[state.build[item.slot]].name;item.button.disabled=!['practice','adjust'].includes(state.phase)||(item.slot==='sensor'&&state.sensorLocked);item.button.classList.toggle('active',item.slot===category);item.button.setAttribute('aria-current',item.slot===category?'true':'false');}
    setArmedPart(part);
  }
  function setArmedPart(part){
    armed=part;const slot=part?PARTS[part].slot:null;
    fittings.classList.toggle('has-part',!!part);container.classList.toggle('ready-to-fit',!!part);
    if(slot)container.dataset.fitSlot=slot;else delete container.dataset.fitSlot;
    for(const item of fittingButtons){item.button.classList.toggle('matching',item.slot===slot);item.button.setAttribute('aria-label',slot===item.slot?`Fit ${PARTS[part].name} to car`:`Inspect ${SLOT_LABELS[item.slot]} fitting point`);}
  }
  function clearRunners(){while(runners.children.length)disposeGroup(runners.children[0]);labelLayer.querySelectorAll('.driver-label,.incident-pop').forEach(label=>label.remove());connectorLayer.replaceChildren();actors=[];map.querySelector('.map-cars').replaceChildren();map.querySelector('.map-pins').replaceChildren();incidentLog.clear();directorIncident=null;pip=null;pipFrame.hidden=true;directorFocus='you';directorUntil=0;}
  function animateRun(entries,duration,done,onProgress,options={}){
    clearRunners();
    actors=entries.map((entry,index)=>{
      const mesh=makeRaceCar(entry.build,entry.id==='you'&&livery?livery:entry.color,entry.id==='you'?'07':String(11+index));mesh.scale.setScalar(options.demo ? .32 : entries.length>1 ? .26 : .28);runners.add(mesh);
      const effects=makeCarEffects(mesh);
      const label=document.createElement('div');label.className=`driver-label ${entry.id==='you'?'is-you':''}`;label.dataset.driver=entry.id||'you';label.style.setProperty('--team-color',entry.color||'#ff3b38');
      const position=document.createElement('b');position.textContent=`P${entry.grid||index+1}`;
      const name=document.createElement('span');name.textContent=entry.name||'You';label.title=entry.name||'You';
      const code=document.createElement('i');code.className='code';code.textContent=driverCode(entry);label.append(position,code,name);
      if(entry.id==='you'&&livery?.team)position.insertAdjacentHTML('afterend',teamLogo(livery.team,livery,'label-logo'));
      if(entry.id==='you'){const tag=document.createElement('em');tag.textContent=options.demo&&!options.practice?'DEMO':'YOU';label.append(tag);}
      labelLayer.append(label);
      const popup=document.createElement('div');popup.className='incident-pop';popup.hidden=true;labelLayer.append(popup);
      const connector=document.createElementNS('http://www.w3.org/2000/svg','line');connector.setAttribute('stroke',entry.color||'#ff3b38');connectorLayer.append(connector);
      const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r',entry.id==='you'?1:.7);dot.setAttribute('fill',entry.color||'#ff3b38');dot.setAttribute('stroke',entry.id==='you'?'#fff':'#111');dot.setAttribute('stroke-width','.2');map.querySelector('.map-cars').append(dot);
      // Four lanes spread a large field across the track; small fields keep two.
      return {mesh,effects,entry,label,popup,popupState:null,position,connector,dot,lane:entries.length>6?[-.66,-.22,.22,.66][index%4]:(index%2?1:-1)*.47};
    });
    active={playhead:0,lastTick:performance.now(),duration:options.getRace?duration:reducedMotion?600:duration,done,onProgress,getRace:options.getRace,countdown:options.replay?0:options.getRace?(options.demo?800:6500):0,shake:0,lastUpdate:-1,paused:false,speed:1,demo:!!options.demo,replay:options.replay||null,elapsed:0};
    setView('course');
    if(options.replay)setRaceCamera(`driver:${options.replay.focus}`);else if(options.demo)setRaceCamera('you');else if(options.getRace)setRaceCamera('director');
  }
  function setPlayback({paused,speed}={}){if(!active)return;if(paused!==undefined)active.paused=paused;if(speed!==undefined)active.speed=[.5,1,1.5,2].includes(speed)?speed:1;active.lastTick=performance.now();}
  function setRaceCamera(mode){raceCamera=mode;if(mode==='overview')resetCamera();else controls.enabled=false;}
  function placeActor(actor,row,elapsed){
    const {distance,finished,retired,position,grid,incident}=row;
    const gridOffset=(.014+Math.floor((grid-1)/2)*(actors.length>6?.011:.021))*Math.max(0,1-elapsed/3);
    const t=finished ? .015+(position-1)*.018 : ((distance-gridOffset)%1+1)%1;
    const point=circuit.curve.getPointAt(Math.max(0,Math.min(.999999,t))),tangent=circuit.curve.getTangentAt(Math.max(0,Math.min(.999999,t)));
    const sway=incident?Math.sin(incident.progress*Math.PI):0;
    // Every problem is visible on the car: it slides, hops and shudders while the incident lasts, and a crash spins it.
    const SLIDES=['understeer','brakefade','contact','aquaplane','coldslide','crash','tyreshred'];
    const severity=incident?(incident.type==='crash'?1:incident.type==='fire'?0:.55):0;
    // The shake runs on its own real-time clock: tied to race time it aliased into random jitter at 30 fps and 2×.
    // It swells and fades with the incident instead of switching on at full strength.
    const shudder=incident&&!reducedMotion&&incident.type!=='fire'?Math.sin((active?.shake??0)*.025+actor.lane*9)*sway:0;
    // The car is ~0.82 wide; keep its outer wheel inside the barrier at 1.70.
    const parkingLane=(actor.entry.id==='you'?1:-1)*1.25;
    const pullAside=incident?.type==='fire'&&!active?.demo?Math.min(1,incident.progress):0;
    const lane=retired?parkingLane:THREE.MathUtils.lerp(actor.lane,parkingLane,pullAside);
    const lateral=lane+(incident&&SLIDES.includes(incident.type)?sway*(incident.type==='crash'?1.2:1.05):0)+shudder*.1*severity;
    actor.mesh.position.set(point.x+tangent.z*lateral,point.y+.04+(incident?.type==='contact'?sway*.12:0)+Math.abs(shudder)*.07*severity,point.z-tangent.x*lateral);
    const yawSlide=incident?.type==='crash'?sway*1.1:incident?.type==='understeer'?sway*.28:['aquaplane','coldslide','tyreshred'].includes(incident?.type)?sway*.22:incident?.type==='wheelspin'?Math.sin(incident.progress*Math.PI*3)*.15:0;
    actor.mesh.rotation.y=-Math.atan2(tangent.z,tangent.x)+yawSlide+shudder*.09*severity;
    actor.mesh.userData.wheels.forEach(wheel=>{wheel.rotation.z=finished||retired?0:-elapsed*(incident?.type==='wheelspin'?8:4);});
    // A short pop-up names the problem and the time it costs; it lingers a few seconds after the moment passes.
    if(incident)actor.popupState={text:`${incident.title}`,loss:incident.loss,type:incident.type,until:elapsed+3};
    else if(actor.popupState&&(elapsed>actor.popupState.until||elapsed<actor.popupState.until-3.5))actor.popupState=null;
    actor.effects.update(incident,elapsed,reducedMotion,row.warning);actor.position.textContent=retired?'OUT':`P${position}`;actor.dot.setAttribute('cx',point.x);actor.dot.setAttribute('cy',point.z);actor.dot.setAttribute('opacity',retired?'.4':'1');
    actor.label.classList.toggle('boosting',!!row.boosting);actor.label.classList.toggle('has-incident',!!incident);
    actor.row=row;
  }
  function project(point){vector.copy(point);vector.project(camera);return {x:(vector.x*.5+.5)*container.clientWidth,y:(-.5*vector.y+.5)*container.clientHeight,z:vector.z};}
  function layoutFittings(){
    if(view!=='rover'||!car)return;
    const width=container.clientWidth,height=container.clientHeight;
    for(let i=0;i<fittingButtons.length;i++){
      const item=fittingButtons[i],point=project(new THREE.Vector3(...item.anchor).add(car.position));
      const spot={wheels:[16,92],power:[width-164,92],body:[16,height-96],chassis:[16,Math.round(height/2)-20],sensor:[width-164,height-96]}[item.slot],left=spot[0],top=spot[1];
      item.button.style.transform=`translate(${left}px,${top}px)`;
      item.line.setAttribute('x1',left+70);item.line.setAttribute('y1',top+24);item.line.setAttribute('x2',point.x);item.line.setAttribute('y2',point.y);
      item.line.classList.toggle('matching',armed&&PARTS[armed].slot===item.slot);
      item.dot.style.transform=`translate(${point.x-4}px,${point.y-4}px)`;
    }
  }
  function layoutLabels(){
    if(view!=='course'||!actors.length)return;
    const width=container.clientWidth,height=container.clientHeight,placed=[];
    // Keep every nameplate out of the failing car's body and visible effect.
    const protectedAreas=actors.filter(actor=>actor.row?.incident?.type==='fire').map(actor=>{
      const points=[];
      for(const dx of [-1.1,1.1])for(const dy of [0,1.25])for(const dz of [-1.1,1.1])points.push(project(actor.mesh.position.clone().add(new THREE.Vector3(dx,dy,dz))));
      const x=Math.min(...points.map(point=>point.x)),y=Math.min(...points.map(point=>point.y));
      return {x,y,w:Math.max(...points.map(point=>point.x))-x,h:Math.max(...points.map(point=>point.y))-y};
    });
    // In a big field only the cars that matter right now get a full nameplate; the rest get a code chip.
    const featured=new Set(['you',focusedActor()?.entry.id,pip?.entry.id]);
    for(const actor of actors)if(actor.row?.incident&&!actor.row.retired)featured.add(actor.entry.id);
    for(const actor of actors)actor.label.classList.toggle('compact',actors.length>8&&!featured.has(actor.entry.id));
    const positions=actors.map(actor=>{const point=actor.mesh.position.clone();point.y+=.8;return{actor,...project(point)};}).sort((a,b)=>a.y-b.y);
    for(const {actor,x,y,z} of positions){
      const visible=z>=-1&&z<=1&&x>-20&&x<width+20&&y>=0&&y<height;
      actor.label.hidden=!visible;actor.connector.style.display=visible?'':'none';if(!visible)continue;
      const w=actor.label.offsetWidth||150,h=actor.label.offsetHeight||30,idealX=x-w/2,idealY=y-h-(actor.row?.incident?.type==='fire'?55:18);
      let best=null;
      for(let row=-2;row<6;row++)for(let column=-3;column<=3;column++){
        const left=Math.max(6,Math.min(width-w-6,idealX+column*(w+8)));
        const top=Math.max(active?.demo?80:190,Math.min(height-h-45,idealY-row*(h+7)));
        const collisions=[...placed,...protectedAreas].filter(rect=>left<rect.x+rect.w+4&&left+w+4>rect.x&&top<rect.y+rect.h+4&&top+h+4>rect.y).length;
        const cost=collisions*1000000+(left-idealX)**2+3*(top-idealY)**2;
        if(!best||cost<best.cost)best={left,top,cost};
      }
      const {left,top}=best;actor.label.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;
      actor.connector.setAttribute('x1',x);actor.connector.setAttribute('y1',y);actor.connector.setAttribute('x2',left+w/2);actor.connector.setAttribute('y2',top+h);placed.push({x:left,y:top,w,h});
    }
    // Incident pop-ups sit just under the car: the problem and the seconds it costs. Yours always shows; at a pile-up
    // only three rivals' pop-ups show, stacked so none covers another.
    const popupRects=[];let rivalPopups=0;
    for(const {actor,x,y,z} of [...positions].sort((p,q)=>(q.actor.entry.id==='you')-(p.actor.entry.id==='you'))){
      const state=actor.popupState,mine=actor.entry.id==='you';
      const important=state&&(mine||['crash','fire'].includes(state.type)||actors.length<=8||featured.has(actor.entry.id));
      let show=!!important&&z>=-1&&z<=1&&x>-20&&x<width+20&&y>=0&&y<height&&(mine||actors.length<=8||rivalPopups<3);
      if(show){
        const key=`${state.type}:${state.loss}`;
        if(actor.popup.dataset.key!==key){actor.popup.dataset.key=key;actor.popup.className=`incident-pop ${['crash','fire'].includes(state.type)?'severe':''}`;actor.popup.innerHTML=`${state.text} <b>${state.type==='fire'?'OUT':`+${state.loss.toFixed(1)}s`}</b>`;}
        const pw=actor.popup.offsetWidth||140,ph=actor.popup.offsetHeight||26,left=Math.round(Math.max(6,Math.min(width-pw-6,x-pw/2)));
        let top=Math.round(Math.min(height-70,y+14)),tries=0;
        while(popupRects.some(rect=>left<rect.x+rect.w+4&&left+pw+4>rect.x&&top<rect.y+rect.h+3&&top+ph+3>rect.y)&&tries<6){top+=ph+4;tries++;}
        if(tries>=6)show=false;
        else{actor.popup.style.transform=`translate(${left}px,${top}px)`;popupRects.push({x:left,y:top,w:pw,h:ph});if(!mine)rivalPopups++;}
      }
      actor.popup.hidden=!show;
    }
  }
  function layoutLandmarks(){if(view!=='course')return;for(const mark of landmarkLabels){const point=project(mark.position);mark.element.hidden=point.z<0||point.z>1||point.x<0||point.x>container.clientWidth||point.y<120||point.y>container.clientHeight-50;mark.element.style.transform=`translate(${point.x-20}px,${point.y}px)`;}}
  const incidentKey=actor=>actor.row?.incident&&!actor.row.retired?`${actor.entry.id}:${actor.row.incident.distance}`:null;
  function trackIncidents(elapsed){
    const pins=map.querySelector('.map-pins');
    for(const actor of actors){
      const key=incidentKey(actor);
      if(key&&!incidentLog.has(key)){
        const pin=document.createElementNS('http://www.w3.org/2000/svg','circle');pin.setAttribute('r','1.1');pin.setAttribute('cx',actor.mesh.position.x);pin.setAttribute('cy',actor.mesh.position.z);
        pin.setAttribute('class',`map-pin active ${actor.row.incident.type==='fire'?'fire':''}`);pins.append(pin);
        incidentLog.set(key,{key,actor,since:elapsed,shown:false,pin,priority:actor.row.incident.type==='fire'?0:actor.entry.id==='you'?1:2});
      }
    }
    for(const item of incidentLog.values())item.pin.classList.toggle('active',incidentKey(item.actor)===item.key);
  }
  function directorPick(elapsed){
    const current=incidentLog.get(directorIncident);
    if(current&&(incidentKey(current.actor)===current.key||elapsed-current.focusAt<MIN_HOLD))return current.actor.entry.id;
    const next=[...incidentLog.values()].filter(item=>!item.shown&&elapsed-item.since<6).sort((a,b)=>a.priority-b.priority||a.since-b.since)[0];
    if(next){next.shown=true;next.focusAt=elapsed;directorIncident=next.key;return next.actor.entry.id;}
    directorIncident=null;
    // Cut to a car just before its incident, so the moment itself is on screen.
    const warned=actors.find(item=>item.entry.id==='you'&&item.row?.warning)||actors.find(item=>item.row?.warning?.type==='fire');
    if(warned)return warned.entry.id;
    if(elapsed>directorUntil){
      const sorted=[...actors].filter(item=>!item.row?.retired).sort((a,b)=>(a.row?.position||0)-(b.row?.position||0));
      const you=sorted.findIndex(item=>item.entry.id==='you');
      const battle=sorted.find((item,i)=>i>0&&(i<=2||Math.abs(i-you)<=1)&&(item.row.gap-sorted[i-1].row.gap)<1);
      directorFocus=battle?.entry.id||'you';directorUntil=elapsed+10;
    }
    return directorFocus;
  }
  function focusedActor(){
    return raceCamera==='you'?actors.find(item=>item.entry.id==='you'):raceCamera.startsWith('driver:')?actors.find(item=>item.entry.id===raceCamera.slice(7)):raceCamera==='director'?actors.find(item=>item.entry.id===directorFocus):null;
  }
  function updateCamera(){
    if(view!=='course'||!actors.length)return;
    const live=active&&!active.demo&&!active.replay;
    if(live)trackIncidents(active.elapsed);
    if(live&&raceCamera==='director')directorFocus=directorPick(active.elapsed);
    // A second incident at the same moment goes into a picture-in-picture inset.
    const main=focusedActor();
    pip=live&&raceCamera!=='overview'?[...incidentLog.values()].filter(item=>incidentKey(item.actor)===item.key&&item.actor!==main).sort((a,b)=>a.priority-b.priority)[0]?.actor||null:null;
    if(raceCamera==='overview'||!main)return;
    followTarget.copy(main.mesh.position);
    const distance=active?.demo?8:active?.replay?7:main.row?.incident?.type==='fire'?9:12;
    const offset=new THREE.Vector3(distance*.65,distance*.85,distance);
    // Like a TV director: cut to a new car instantly, then follow it smoothly.
    const cut=main!==lastMain;lastMain=main;
    camera.position.lerp(followTarget.clone().add(offset),cut?1:.13);controls.target.lerp(followTarget,cut?1:.13);camera.lookAt(controls.target);
  }
  function renderPip(){
    if(!pip||view!=='course'){pipFrame.hidden=true;return;}
    const width=container.clientWidth,height=container.clientHeight,w=Math.round(Math.min(260,width*.34)),h=Math.round(w*.62),x=width-w-16,top=Math.min(150,height*.22);
    pipCamera.aspect=w/h;pipCamera.updateProjectionMatrix();
    pipCamera.position.copy(pip.mesh.position).add(new THREE.Vector3(4,5.5,6.5));pipCamera.lookAt(pip.mesh.position);
    renderer.setScissorTest(true);renderer.setViewport(x,height-top-h,w,h);renderer.setScissor(x,height-top-h,w,h);renderer.render(scene,pipCamera);
    renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);
    pipFrame.hidden=false;pipFrame.style.cssText=`left:${x}px;top:${top}px;width:${w}px;height:${h}px`;
    const key=`${pip.entry.id}:${pip.row.incident.type}`;
    if(pipFrame.dataset.key!==key){pipFrame.dataset.key=key;pipFrame.innerHTML=`<span>ALSO ON TRACK</span><strong>${driverCode(pip.entry)} · ${pip.row.incident.title}</strong>`;}
  }
  function finishAnimation(){if(!active)return;const current=active;active=null;
    if(current.getRace&&!current.replay){const race=current.getRace(),rows=sampleRace(race,race.maxTime+1);for(const actor of actors){placeActor(actor,rows.find(item=>item.id===actor.entry.id),race.maxTime);}current.onProgress?.(1,{rows,elapsed:race.maxTime,lights:0,started:true,paused:false,speed:current.speed});}
    controls.enabled=true;current.done();
  }
  const observer=new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();});observer.observe(container);
  resetCamera();applyViewLook();
  function tick(now){
    if(disposed)return;frame=requestAnimationFrame(tick);if(active&&now-lastFrame<30)return;lastFrame=now;
    if(active){
      const current=active,delta=now-current.lastTick;current.lastTick=now;
      if(!current.paused){current.playhead+=delta*current.speed;current.shake+=delta;}
      const age=current.playhead,progress=Math.max(0,Math.min(1,(age-current.countdown)/current.duration));
      if(current.getRace){
        const race=current.getRace(),replay=current.replay,elapsed=replay?replay.from+progress*(replay.to-replay.from):progress*race.maxTime,started=!!replay||age>=current.countdown,rows=sampleRace(race,elapsed);
        current.elapsed=elapsed;
        for(const actor of actors)placeActor(actor,rows.find(item=>item.id===actor.entry.id),elapsed);
        if(now-current.lastUpdate>150){current.lastUpdate=now;renderer.shadowMap.needsUpdate=true;current.onProgress?.(progress,{rows,elapsed,started,lights:started?0:Math.min(5,Math.floor(age/1100)+1),paused:current.paused,speed:current.speed,demo:current.demo,replay:!!replay,director:{focus:raceCamera==='director'?directorFocus:null,incident:!!directorIncident,pip:pip?.entry.id||null}});}
        if(progress>=1||(!replay&&started&&rows.every(row=>row.finished||row.retired)))finishAnimation();
      }else{
        const entry=actors[0].entry;let left=progress*entry.result.time,distance=0;
        for(const segment of entry.result.segments){distance+=Math.min(1,left/segment.time)/3;left-=segment.time;if(left<=0)break;}
        placeActor(actors[0],{distance:Math.min(.99999,distance),finished:progress>=1,position:1,grid:1},age/1000);
        if(now-current.lastUpdate>100){current.lastUpdate=now;renderer.shadowMap.needsUpdate=true;current.onProgress?.(progress);}
        if(progress>=1)finishAnimation();
      }
    }
    controls.update();updateCamera();camera.updateMatrixWorld();layoutFittings();layoutLandmarks();layoutLabels();renderer.render(scene,camera);renderPip();container.dataset.ready='true';
  }
  frame=requestAnimationFrame(tick);
  return {setBuild,setView,setAssembly,setArmedPart,setPlayback,setRaceCamera,resetCamera,animateRun,finishAnimation,setTrack,dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();disposeGroup(scene);renderer.dispose();labelLayer.remove();fittings.remove();landmarkLayer.remove();map.remove();pipFrame.remove();}};
}
