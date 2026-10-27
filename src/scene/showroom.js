import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cylinder, disposeGroup, material } from './geometry.js';
import { makeRaceCar } from './racecar.js';

// A spotlit turntable for choosing a livery. It only renders while the showroom is open.
export function createShowroom(container) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch { container.innerHTML = '<div class="scene-fallback"><strong>Your car is ready.</strong><p>3D is unavailable in this browser. Your colours still apply to the race.</p></div>'; return { setCar() {}, start() {}, stop() {}, dispose() {} }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  container.append(renderer.domElement); renderer.domElement.setAttribute('aria-label', 'Your car on the showroom turntable. Drag to spin it.');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0f16'); scene.fog = new THREE.Fog('#0b0f16', 14, 34);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 16; controls.maxPolarAngle = Math.PI * .47; controls.minPolarAngle = .35;
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = 1.4;
  scene.add(new THREE.HemisphereLight('#dfe9ff', '#1a1c24', 1.2));
  const key = new THREE.SpotLight('#fff6ea', 70, 30, .55, .6); key.position.set(4, 9, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.normalBias = .02; scene.add(key);
  const fill = new THREE.SpotLight('#9fbaff', 35, 30, .6, .8); fill.position.set(-6, 6, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffffff', 1.2); rim.position.set(0, 4, -8); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), material('#0f141c', .35, .55)); floor.rotation.x = -Math.PI / 2; floor.position.y = -.3; floor.receiveShadow = true; scene.add(floor);
  const stage = new THREE.Group(); scene.add(stage);
  cylinder(stage, 3.7, .26, [0, -.17, 0], material('#141a24', .4, .5), 96);
  cylinder(stage, 3.62, .04, [0, -.02, 0], material('#232c3a', .3, .6), 96);
  // The turntable's light ring takes the car's paint colour.
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#ef3038' });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.71, .03, 8, 120), ringMaterial); ring.rotation.x = Math.PI / 2; ring.position.y = -.05; stage.add(ring);
  const glow = new THREE.PointLight('#ef3038', 6, 9, 1.6); glow.position.set(0, .2, 0); stage.add(glow);
  let car = null, carKey = '', running = false, frame = 0, disposed = false;
  function setCar(build, livery) {
    const next = JSON.stringify([build, livery]); if (next === carKey) return; carKey = next;
    const rotation = car?.rotation.y ?? 0; if (car) disposeGroup(car);
    car = makeRaceCar(build, livery); car.position.y = .02; car.rotation.y = rotation; stage.add(car);
    ringMaterial.color.set(livery.paint); glow.color.set(livery.paint);
  }
  function resize() { const { width, height } = container.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.position.setLength(width / height < .9 ? 13 : 12.5); camera.updateProjectionMatrix(); }
  const observer = new ResizeObserver(resize); observer.observe(container);
  camera.position.set(7.2, 3.4, 7.2); controls.target.set(-.1, .55, 0); controls.update();
  function tick() { if (!running || disposed) return; frame = requestAnimationFrame(tick); controls.update(); renderer.render(scene, camera); container.dataset.ready = 'true'; }
  return {
    setCar,
    start() { if (running) return; running = true; resize(); frame = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(frame); },
    dispose() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); disposeGroup(scene); renderer.dispose(); },
  };
}
