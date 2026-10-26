import * as THREE from 'three';
import { box, cylinder, material, batchStaticGeometry } from './geometry.js';

// Original, stylized open-wheel geometry with visibly different cooling and wings.
export function makeRaceCar(build,color='#ef3038',number='07'){
  const car=new THREE.Group(),paint=material(color,.3,.25),carbon=material('#151921',.6,.15),rubber=material('#101218'),metal=material('#98a4b5',.35,.65),white=material('#f2f5fb',.32);
  const compound=material({road:'#ef4348',offroad:'#ffe168',tracks:'#ebeff6'}[build.wheels]),wheels=[];
  const hot=['torque','sprint'].includes(build.power);
  box(car,[4.5,.14,2],[-.05,.35,0],carbon,.03);box(car,[2.7,.42,.85],[-.5,.65,0],paint,.14);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(.17,.4,2.6,4),paint);nose.rotation.z=-Math.PI/2;nose.rotation.x=Math.PI/4;nose.position.set(1.15,.59,0);nose.castShadow=true;car.add(nose);
  box(car,[1.7,.035,.16],[1.25,.79,0],white,.01);box(car,[.55,.1,3.15],[2.52,.28,0],carbon,.025);
  for(const z of [-.9,.9]){
    const flap=box(car,[.38,.06,1.05],[2.41,.43,z],paint,.015);flap.rotation.z=-.15;
    box(car,[.65,.42,.08],[2.5,.43,Math.sign(z)*1.56],paint,.025);
    const pod=box(car,[2.15,.46,.51],[-.65,.64,Math.sign(z)*.64],paint,.13);pod.rotation.y=Math.sign(z)*.08;
    box(car,[.3,build.power==='sprint'?.08:hot?.17:build.power==='solar'?.4:.28,.45],[.26,.69,Math.sign(z)*.64],carbon,.03);
    box(car,[1.45,.07,.03],[-.5,.72,Math.sign(z)*.91],white,.01);
    for(const x of [-1.65,1.5])for(const dx of [-.22,.22]){const arm=box(car,[.07,.07,1.1],[x+dx,.47,Math.sign(z)*.8],carbon,.015);arm.rotation.y=dx>0?.38:-.38;}
  }
  box(car,[1.02,.2,.7],[-.18,.94,0],carbon,.18);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),material('#f2d977',.3));helmet.position.set(-.25,1.16,0);car.add(helmet);
  box(car,[.1,.1,.36],[-.03,1.17,0],carbon,.035);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,8,24,Math.PI*1.65),carbon);halo.rotation.x=Math.PI/2;halo.rotation.z=-.9;halo.position.set(-.14,1.27,0);car.add(halo);
  box(car,[.05,.34,.05],[.29,1.1,0],carbon,.01);box(car,[.64,.62,.4],[-.91,1.02,0],paint,.09);box(car,[.13,.17,.25],[-.55,1.27,0],carbon,.04);
  const engineHeight=hot?.53:build.power==='solar'?.27:.4;box(car,[1.15,engineHeight,.52],[-1.4,.76,0],paint,.12);
  const vents=build.power==='sprint'?0:build.power==='torque'?2:build.power==='solar'?7:5;
  for(let i=0;i<vents;i++)box(car,[.06,.03,.45],[-1.8+i*.16,.78+engineHeight/2,0],carbon,.01);
  for(const z of [-.63,.63])box(car,[.1,.75,.08],[-2.13,.92,z],carbon,.01);
  const wingWidth=build.body==='carbon'?2.85:build.body==='scout'?1.75:2.45;
  const wing=box(car,[.64,.13,wingWidth],[-2.12,1.35,0],paint,.025);wing.rotation.z=.13;
  box(car,[.38,.06,wingWidth],[-2.22,1.56,0],carbon,.015);for(const z of [-wingWidth/2,wingWidth/2])box(car,[.78,.54,.07],[-2.12,1.31,z],paint,.02);
  for(const x of [-1.65,1.5])for(const z of [-1.2,1.2]){
    const wheel=new THREE.Group();wheel.position.set(x,.53,z);car.add(wheel);wheels.push(wheel);
    const tyre=cylinder(wheel,.53,x<0?.62:.51,[0,0,0],rubber,24);tyre.rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      const rim=cylinder(wheel,.29,.025,[0,0,side*(x<0?.32:.265)],carbon,16);rim.rotation.x=Math.PI/2;
      const stripe=new THREE.Mesh(new THREE.TorusGeometry(.43,.018,4,24),compound);stripe.position.z=side*(x<0?.32:.265);wheel.add(stripe);
      const hub=cylinder(wheel,.07,.03,[0,0,side*(x<0?.34:.28)],metal,8);hub.rotation.x=Math.PI/2;
      for(let i=0;i<6;i++){const spoke=box(wheel,[.4,.035,.025],[0,0,side*(x<0?.335:.28)],metal,.005);spoke.rotation.z=i*Math.PI/3;}
    }
    if(build.wheels==='offroad')for(let i=0;i<3;i++){const groove=new THREE.Mesh(new THREE.TorusGeometry(.531,.008,4,24),material('#30343d'));groove.position.z=-.14+i*.14;wheel.add(groove);}
  }
  box(car,[.12,.12,.32],[-.85,1.4,0],build.sensor==='thermal'?compound:white,.025);if(build.sensor==='radar')cylinder(car,.025,.22,[-.83,1.56,0],metal,8);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.font='italic 900 82px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(number,64,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const decal=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));decal.rotation.x=-Math.PI/2;decal.position.set(1.45,.82,0);car.add(decal);
  batchStaticGeometry(car,mesh=>!wheels.includes(mesh.parent));wheels.forEach(wheel=>batchStaticGeometry(wheel));car.userData.wheels=wheels;return car;
}
