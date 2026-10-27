import * as THREE from 'three';

export function makeCarEffects(car) {
  const group=new THREE.Group();car.add(group);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,1,16,16,15);
  gradient.addColorStop(0,'rgba(255,255,255,.75)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
  const texture=new THREE.CanvasTexture(canvas),positions=new Float32Array(18*3);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const smoke=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#d8e0e4',map:texture,transparent:true,opacity:.8,size:1.6,depthWrite:false}));group.add(smoke);
  const sparkPositions=new Float32Array(12*3),sparkGeometry=new THREE.BufferGeometry();sparkGeometry.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));
  const sparks=new THREE.Points(sparkGeometry,new THREE.PointsMaterial({color:'#ffd16e',size:.13,transparent:true,opacity:1,depthWrite:false}));group.add(sparks);
  const flame=new THREE.Group();flame.position.set(-1.65,.5,0);group.add(flame);
  // Exaggerated brake flames remain readable from either spectator side.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const cone=new THREE.Mesh(new THREE.ConeGeometry(.44-i*.09,2.7-i*.45,6),new THREE.MeshBasicMaterial({color:i===0?'#ff4e13':i===1?'#ffa52a':'#ffe68f',transparent:true,opacity:.98,depthWrite:false}));
    cone.position.set(i*.06,1.1,side*(1.55+i*.04));flame.add(cone);
  }
  const brakeGlow=new THREE.Mesh(new THREE.SphereGeometry(.38,8,6),new THREE.MeshBasicMaterial({color:'#ff693d',transparent:true,opacity:.55}));brakeGlow.position.set(1.5,.53,1.2);group.add(brakeGlow);
  // A flat ring under the car marks it from any camera distance: amber before an incident, yellow during, red for fire.
  const ring=new THREE.Mesh(new THREE.RingGeometry(3.2,3.9,40),new THREE.MeshBasicMaterial({color:'#ffd23f',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.12;car.add(ring);ring.visible=false;
  group.visible=false;
  return { update(incident,elapsed,reducedMotion=false,warning=null){
    ring.visible=!!(incident||warning);
    if(ring.visible){
      ring.material.color.set(incident?.type==='fire'?'#ff3b30':incident?'#ffd23f':'#ffa53d');
      ring.material.opacity=incident?.9:.55;
      ring.scale.setScalar(reducedMotion?1:incident?1+Math.sin(elapsed*6)*.08:.85+Math.sin(elapsed*4)*.05);
    }
    group.visible=!!incident;if(!incident)return;
    const type=incident.effect,t=incident.progress;
    smoke.visible=['dust','steam','brake','fire','slide'].includes(type);
    smoke.material.color.set(type==='dust'?'#cbb18b':type==='fire'?'#626776':'#e2e9ed');
    smoke.material.opacity=type==='fire'?.85:.65;
    sparks.visible=type==='sparks';flame.visible=type==='fire'&&t>.25;brakeGlow.visible=type==='brake'||type==='fire';
    const clock=reducedMotion?t*4:elapsed;
    for(let i=0;i<18;i++){const age=(clock*.5+i/18)%1,off=i*3;positions[off]=-1.4-age*4;positions[off+1]=.45+age*(type==='dust'?1.2:5);positions[off+2]=Math.sin(i*12.3)*(.25+age*1.3);}
    geometry.attributes.position.needsUpdate=true;
    for(let i=0;i<12;i++){const age=(clock+i/12)%1,off=i*3;sparkPositions[off]=2-age*4;sparkPositions[off+1]=.2+Math.sin(age*Math.PI)*.7;sparkPositions[off+2]=(i%2?1:-1)*age*1.6;}
    sparkGeometry.attributes.position.needsUpdate=true;
    flame.scale.y=reducedMotion?1:1+Math.sin(elapsed*8)*.12;
  }};
}
