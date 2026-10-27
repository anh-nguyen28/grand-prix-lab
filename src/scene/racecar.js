import * as THREE from 'three';
import { box, cylinder, material, batchStaticGeometry } from './geometry.js';
import { LIVERY_FINISHES, carNumber, cleanLivery } from '../../shared/content.js';
import { drawTeamLogo } from '../ui/team-logo.js';

import { AERO_LOOKS as AERO, PALETTE, POWER_LOOKS as POWER, SENSOR_LOOKS, TYRE_LOOKS as TYRES } from '../ui/part-looks.js';

// Every part's look comes from part-looks.js, shared with the shelf illustrations.
const glow=(color,intensity=1)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.4});

// Rivals pass a team colour; the player passes their showroom livery (paint, accent, helmet, finish, pattern, number, team).
export function makeRaceCar(build,livery=PALETTE.paint,number='07'){
  const look=typeof livery==='string'?{paint:livery,accent:PALETTE.white}:cleanLivery(livery),finish=LIVERY_FINISHES[look.finish]||{roughness:.3,metalness:.25};
  if(typeof livery!=='string')number=carNumber(look);
  const team=typeof livery==='string'?null:livery.team;
  const car=new THREE.Group(),paint=material(look.paint,finish.roughness,finish.metalness),carbon=material(PALETTE.carbon,.6,.15),rubber=material('#101218'),metal=material(PALETTE.metal,.35,.65),white=material(look.accent||PALETTE.white,.32);
  const split=look.pattern==='split',podPaint=split?material(look.accent,finish.roughness,finish.metalness):paint;
  const tyre=TYRES[build.wheels]||TYRES.road,power=POWER[build.power]||POWER.electric,aero=AERO[build.body]||AERO.alloy;
  const compound=material(tyre.stripe),wheels=[];
  box(car,[4.5,.14,2],[-.05,.35,0],carbon,.03);box(car,[2.7,.42,.85],[-.5,.65,0],paint,.14);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(.17,.4,2.6,4),paint);nose.rotation.z=-Math.PI/2;nose.rotation.x=Math.PI/4;nose.position.set(1.15,.59,0);nose.castShadow=true;car.add(nose);
  box(car,[1.7,.035,.16],[1.25,.79,0],white,.01);box(car,[.55,.1,3.15],[2.52,.28,0],carbon,.025);
  for(const z of [-.9,.9]){
    // Front wing: more flaps for more downforce.
    for(let i=0;i<aero.frontFlaps;i++){const flap=box(car,[.38-i*.07,.06,1.05],[2.41-i*.13,.43+i*.09,z],i===aero.frontFlaps-1&&aero.accent?material(aero.accent):paint,.015);flap.rotation.z=-.15-i*.12;}
    box(car,[.65,.42,.08],[2.5,.43,Math.sign(z)*1.56],podPaint,.025);
    const pod=box(car,[2.15,.46,.51],[-.65,.64,Math.sign(z)*.64],podPaint,.13);pod.rotation.y=Math.sign(z)*.08;
    // Sidepod inlets: big openings cool well; tiny ones run hot.
    box(car,[.3,power.inlet,.45],[.26,.69,Math.sign(z)*.64],carbon,.03);
    if(!split)box(car,[1.45,.07,.03],[-.5,.72,Math.sign(z)*.91],white,.01);
    for(const x of [-1.65,1.5])for(const dx of [-.22,.22]){const arm=box(car,[.07,.07,1.1],[x+dx,.47,Math.sign(z)*.8],carbon,.015);arm.rotation.y=dx>0?.38:-.38;}
    if(power.extra==='batteries')for(const x of [-.35,-1.05])box(car,[.6,.2,.4],[x,.97,Math.sign(z)*.64],glow(PALETTE.battery,.9),.04);
    if(aero.floor){box(car,[3.3,.12,.06],[-.35,.32,Math.sign(z)*1.02],carbon,.02);box(car,[3.3,.03,.06],[-.35,.39,Math.sign(z)*1.02],material(PALETTE.cyan),0);}
  }
  box(car,[1.02,.2,.7],[-.18,.94,0],carbon,.18);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),material(look.helmet||'#f2d977',.3));helmet.position.set(-.25,1.16,0);car.add(helmet);
  box(car,[.1,.1,.36],[-.03,1.17,0],carbon,.035);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,8,24,Math.PI*1.65),carbon);halo.rotation.x=Math.PI/2;halo.rotation.z=-.9;halo.position.set(-.14,1.27,0);car.add(halo);
  box(car,[.05,.34,.05],[.29,1.1,0],carbon,.01);box(car,[.64,.62,.4],[-.91,1.02,0],paint,.09);box(car,[.13,.17,.25],[-.55,1.27,0],carbon,.04);
  // Engine cover: taller for high-output units, with a cooling grille or vents.
  box(car,[1.15,power.cover,.52],[-1.4,.76,0],paint,.12);
  if(look.pattern==='racing')for(const z of [-.13,.13]){box(car,[1.15,.02,.08],[-1.4,.765+power.cover/2,z],white,0);box(car,[.8,.02,.07],[.7,.81,z*.7],white,0);}
  for(let i=0;i<power.vents;i++)box(car,[.06,.03,.45],[-1.8+i*.16,.78+power.cover/2,0],carbon,.01);
  // Power units carry a coloured signature that reads from the garage camera.
  if(power.extra==='grille')for(const z of [-.62,.62])box(car,[1.1,.04,.42],[-.7,.9,z],glow(PALETTE.grille,.5),.01);
  if(power.extra==='snorkel'){const bronze=material(PALETTE.bronze,.35,.6);cylinder(car,.2,.9,[-1.25,1.5,0],bronze,16);box(car,[.5,.32,.5],[-1.12,2,0],bronze,.06);const mouth=cylinder(car,.14,.12,[-.86,2,0],carbon,16);mouth.rotation.z=Math.PI/2;}
  if(['snorkel','twinExhaust','heatStripes'].includes(power.extra)){
    for(const z of power.extra==='twinExhaust'?[-.2,.2]:[0]){const pipe=cylinder(car,.11,.6,[-2.1,.85,z],metal,12);pipe.rotation.z=Math.PI/2;const tip=cylinder(car,.1,.06,[-2.42,.85,z],glow(PALETTE.heat,1.4),12);tip.rotation.z=Math.PI/2;}
  }
  if(power.extra==='twinExhaust')for(const z of [-.64,.64])box(car,[1.2,.05,.1],[-.65,.9,z],glow(PALETTE.heat,.6),.01);
  if(power.extra==='heatStripes')for(const x of [-1.05,-1.4,-1.75])box(car,[.12,.03,.56],[x,.79+power.cover/2,0],glow(PALETTE.heat,1.2),0);
  for(const z of [-.63,.63])box(car,[.1,.75,.08],[-2.13,.92,z],carbon,.01);
  // Rear wing: width, height and number of elements follow the aero choice.
  const wingWidth=aero.width,wingMat=aero.accent?material(aero.accent):carbon;
  const main=box(car,[.64,.13,wingWidth],[-2.12,aero.height,0],paint,.025);main.rotation.z=.13;
  for(let i=1;i<aero.elements;i++){const element=box(car,[.4-i*.04,.06,wingWidth],[-2.2-i*.04,aero.height+.2*i+(aero.open?.12:0),0],i===aero.elements-1?wingMat:carbon,.015);element.rotation.z=aero.open?-.35:.25+i*.12;}
  for(const z of [-wingWidth/2,wingWidth/2])box(car,[.78,.54+aero.elements*.1,.07],[-2.12,aero.height-.04,z],aero.accent?material(aero.accent):podPaint,.02);
  if(aero.floor)for(let i=0;i<5;i++)box(car,[.5,.2,.04],[-2.35,.36,-.6+i*.3],carbon,.01);
  for(const x of [-1.65,1.5])for(const z of [-1.2,1.2]){
    const wheel=new THREE.Group();wheel.position.set(x,.53,z);car.add(wheel);wheels.push(wheel);
    const width=(x<0?.62:.51)*tyre.width,face=width/2+.01;
    const body=cylinder(wheel,.53,width,[0,0,0],rubber,24);body.rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      const rim=cylinder(wheel,.29,.025,[0,0,side*face],carbon,16);rim.rotation.x=Math.PI/2;
      const stripe=new THREE.Mesh(new THREE.TorusGeometry(.43,.022,4,24),compound);stripe.position.z=side*face;wheel.add(stripe);
      const hub=cylinder(wheel,.07,.03,[0,0,side*(face+.02)],metal,8);hub.rotation.x=Math.PI/2;
      for(let i=0;i<6;i++){const spoke=box(wheel,[.4,.035,.025],[0,0,side*(face+.01)],metal,.005);spoke.rotation.z=i*Math.PI/3;}
    }
    // Tread: grooves, raised blocks or sand paddles around the tyre.
    if(tyre.tread==='grooves')for(let i=0;i<3;i++){const groove=new THREE.Mesh(new THREE.TorusGeometry(.531,.008,4,24),material('#30343d'));groove.position.z=-width*.28+i*width*.28;wheel.add(groove);}
    if(tyre.tread==='blocks'||tyre.tread==='paddles'){
      const count=tyre.tread==='blocks'?16:8;
      for(let i=0;i<count;i++){const angle=i/count*Math.PI*2,size=tyre.tread==='blocks'?[.12,.06,width*.85]:[.07,.17,width*1.02],radius=.53+size[1]/2-.01;
        const lug=box(wheel,size,[Math.cos(angle)*radius,Math.sin(angle)*radius,0],tyre.tread==='paddles'?material('#2b2f37'):rubber,.01);lug.rotation.z=angle+Math.PI/2;}
    }
  }
  addSensor(car,build.sensor,{carbon,metal});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.font='italic 900 82px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(number,64,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const decal=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshBasicMaterial({color:'#fff',map:texture,transparent:true,depthWrite:false}));decal.rotation.x=-Math.PI/2;decal.position.set(1.45,.82,0);car.add(decal);
  if(team)addTeamLogo(car,team,look,aero);
  batchStaticGeometry(car,mesh=>!wheels.includes(mesh.parent));wheels.forEach(wheel=>batchStaticGeometry(wheel));car.userData.wheels=wheels;return car;
}

// The team badge (or logo file) sits on both sidepod flanks and on top of the rear wing.
function addTeamLogo(car,team,look,aero){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;let disposed=false;texture.addEventListener('dispose',()=>{disposed=true;});
  drawTeamLogo(canvas,team,look,()=>{if(!disposed)texture.needsUpdate=true;});
  const logo=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.45,polygonOffset:true,polygonOffsetFactor:-2});
  for(const side of [-1,1]){const flank=new THREE.Mesh(new THREE.PlaneGeometry(.58,.29),logo);flank.position.set(-.85,.56,side*.915);flank.rotation.y=side*.08+(side<0?Math.PI:0);car.add(flank);}
  const width=Math.min(aero.width*.55,.84),wing=new THREE.Mesh(new THREE.PlaneGeometry(width,width/2).rotateX(-Math.PI/2).rotateY(-Math.PI/2),logo);
  wing.position.set(-2.12,aero.height+.072,0);wing.rotation.z=.13;car.add(wing);
}

// Each sensor has its own pod on a mast above the roll hoop, large enough to read from the garage camera.
function addSensor(car,sensor,{carbon,metal}){
  cylinder(car,.04,.5,[-.85,1.55,0],metal,8);
  const y=1.9,look=SENSOR_LOOKS[sensor]||SENSOR_LOOKS.camera;
  if(sensor==='camera'){box(car,[.4,.26,.32],[-.85,y,0],carbon,.06);const lens=cylinder(car,.12,.12,[-.6,y,0],glow(look.lens,.7),20);lens.rotation.z=Math.PI/2;}
  else if(sensor==='thermal'){box(car,[.42,.32,.38],[-.85,y,0],material(look.body,.4),.06);const lens=cylinder(car,.13,.08,[-.6,y,0],glow(look.lens,.8),20);lens.rotation.z=Math.PI/2;for(const z of [-.12,0,.12])box(car,[.3,.04,.04],[-.88,y+.2,z],carbon,0);}
  else if(sensor==='radar'){const dish=cylinder(car,.42,.06,[-.85,y+.05,0],material(look.body,.3,.4),28);dish.rotation.z=.55;const feed=cylinder(car,.04,.3,[-.7,y+.2,0],metal,8);feed.rotation.z=.55;}
  else if(sensor==='lidar'){cylinder(car,.22,.24,[-.85,y,0],carbon,24);cylinder(car,.225,.07,[-.85,y+.02,0],glow(look.ring,1),24);const dome=new THREE.Mesh(new THREE.SphereGeometry(.22,20,10,0,Math.PI*2,0,Math.PI/2),material(look.body,.15,.5));dome.position.set(-.85,y+.12,0);car.add(dome);}
}
