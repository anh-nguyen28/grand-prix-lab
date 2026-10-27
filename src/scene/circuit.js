import * as THREE from 'three';
import { box, cylinder, material, batchStaticGeometry } from './geometry.js';
import { DEFAULT_TRACK } from '../../shared/tracks.js';

// Each section's tarmac is tinted by its condition. The mystery section stays neutral until the answer is revealed.
export const CONDITION_TINT = { dry: '#3a4350', abrasive: '#6d5a45', damp: '#2f4658', cold: '#4a5d70', bumpy: '#5a4a3a', hot: '#7a4a3a', rain: '#243a52' };
const HIDDEN_TINT = '#4b5260';


function ribbon(curve, width, mat, from = 0, to = 1, height = 0) {
  const vertices = [], indices = [], count = 180;
  for (let i = 0; i <= count; i++) {
    const at = (((from + i / count * (to - from)) % 1) + 1) % 1, point = curve.getPointAt(at), tangent = curve.getTangentAt(at); // wraps, so a section at the start line can have a braking zone before it
    for (const side of [-1, 1]) vertices.push(point.x + tangent.z * width * .5 * side, point.y + height, point.z - tangent.x * width * .5 * side);
    if (i < count) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat); mesh.receiveShadow = true; return mesh;
}

export function makeCircuit(track = DEFAULT_TRACK) {
  const group = new THREE.Group();
  box(group, [44, .65, 33], [-1, -.1, 0], material('#2d3540'), .2);
  box(group, [43.9, .12, 32.9], [-1, .26, 0], material('#345548'), .15);
  const curve=new THREE.CatmullRomCurve3(track.points.map(point=>new THREE.Vector3(...point)),true,'catmullrom',.32);
  group.add(ribbon(curve, 3.4, material('#397e6b'), 0, 1, -.01));
  const mysteryMaterial = material(HIDDEN_TINT), mysteryTint = CONDITION_TINT[track.sections.find(section => section.id === track.mystery.section).condition];
  for (const section of track.sections) group.add(ribbon(curve, 2.35, section.id === track.mystery.section ? mysteryMaterial : material(CONDITION_TINT[section.condition]), section.from, section.to, .01));
  // A pale edge along wet sections shows where the water is.
  for (const section of track.sections.filter(item => ['damp', 'rain'].includes(item.condition))) group.add(ribbon(curve, 2.7, material('#7fb2d6'), section.from, section.to, .005));
  for (let i = 0; i < 240; i++) {
    const point = curve.getPointAt(i / 240), tangent = curve.getTangentAt(i / 240), angle = Math.atan2(tangent.x, tangent.z);
    for (const side of [-1, 1]) {
      const curb = box(group, [.2, .055, .43], [point.x + tangent.z * 1.25 * side, point.y + .02, point.z - tangent.x * 1.25 * side], material(i % 2 ? '#e7eaf0' : '#df3e43'), 0); curb.rotation.y = angle;
      if (i % 2 === 0) { const barrier = box(group, [.16, .25, .75], [point.x + tangent.z * 1.78 * side, point.y + .1, point.z - tangent.x * 1.78 * side], material('#b2b9bb'), 0); barrier.rotation.y = angle; }
    }
  }
  const start = curve.getPointAt(.01), tangent = curve.getTangentAt(.01), startAngle = Math.atan2(tangent.x, tangent.z);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 10; col++) {
    const z = -.99 + col * .22, x = row * .2;
    const tile = box(group, [.22, .025, .2], [start.x + tangent.z * z + tangent.x * x, .42, start.z - tangent.x * z + tangent.z * x], material((row + col) % 2 ? '#fafbff' : '#10141c'), 0); tile.rotation.y = startAngle;
  }
  box(group, [11, .04, 1.2], [-2, .36, 11.3], material('#404957'), 0);
  box(group, [9.5, 1.2, 1.5], [-2, .92, 12.65], material('#c1c8cc'), .04);
  box(group, [10, .16, 1.85], [-2, 1.58, 12.6], material('#172233'), .025);
  for (let i = 0; i < 6; i++) {
    box(group, [1.25, .74, .06], [-5.8 + i * 1.5, .78, 11.88], material('#283446'), 0);
    box(group, [1.25, .13, .08], [-5.8 + i * 1.5, 1.24, 11.86], material(['#ef3038','#36ddab','#639aff','#ffd34e','#be8aff','#ff953d'][i]), 0);
  }
  for (const [x, z, rotation] of [[1, -14.5, 0], [-21, 5, Math.PI / 2]]) {
    const stand = new THREE.Group(); group.add(stand); stand.position.set(x, .3, z); stand.rotation.y = rotation;
    for (let row = 0; row < 4; row++) {
      box(stand, [6, .22 + row * .17, .5], [0, .11 + row * .085, -.7 + row * .45], material('#657889'), 0);
      for (let seat = 0; seat < 15; seat++) box(stand, [.24, .1, .22], [-2.7 + seat * .38, .29 + row * .17, -.7 + row * .45], material((seat + row) % 3 ? '#dde3e6' : '#e04a49'), .015);
    }
  }
  for (const [x,z] of [[-21,-13],[19,-12],[20,11]]) {
    cylinder(group, .06, 3.8, [x, 2.2, z], material('#687382'), 8);
    box(group, [.65, .17, .25], [x, 4.1, z], material('#dbe8f0'), .03);
  }
  group.add(ribbon(curve,.06,material('#b3c28e'),0,1,.03));
  for(const zone of track.sections.filter(zone=>zone.kind==='corner')) group.add(ribbon(curve,2.35,material('#835b4a'),zone.from-.012,zone.from,.025));
  for(let i=0;i<14;i++){
    const t=.035+i*.068,point=curve.getPointAt(t),tangent=curve.getTangentAt(t);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([.32,0,0,-.2,0,-.16,-.2,0,.16],3));geometry.computeVertexNormals();
    const arrow=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#e7ecda',side:THREE.DoubleSide}));arrow.position.copy(point);arrow.position.y+=.04;arrow.rotation.y=-Math.atan2(tangent.z,tangent.x);group.add(arrow);
  }
  const landmarks=track.landmarks.map(mark=>{const point=curve.getPointAt(mark.at),tangent=curve.getTangentAt(mark.at);return {...mark,position:new THREE.Vector3(point.x+tangent.z*2.3,.6,point.z-tangent.x*2.3)};});
  const mapPoints=curve.getSpacedPoints(100).map(point=>[point.x,point.z]);
  batchStaticGeometry(group);
  return { group, curve, landmarks, mapPoints, setKnowledge(revealed) { mysteryMaterial.color.set(revealed ? mysteryTint : HIDDEN_TINT); } };
}
