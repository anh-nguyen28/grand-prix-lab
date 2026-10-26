import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function material(color, roughness = 0.7, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
export function box(parent, size, pos, mat, radius = 0.05) {
  const mesh = new THREE.Mesh(radius ? new RoundedBoxGeometry(...size, 2, radius) : new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function cylinder(parent, radius, length, pos, mat, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), mat);
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function disposeGroup(group) {
  const materials = new Set();
  group.traverse(child => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(mat => materials.add(mat));
    else if (child.material) materials.add(child.material);
  });
  materials.forEach(mat => { mat.map?.dispose(); mat.dispose(); });
  group.removeFromParent();
}


export function batchStaticGeometry(group, include = () => true) {
  group.updateMatrixWorld(true);
  const batches = new Map(), meshes = [];
  const inverse = group.matrixWorld.clone().invert();
  group.traverse(object => { if (object.isMesh && include(object) && !object.material.map && object.material.isMeshStandardMaterial) meshes.push(object); });
  for (const mesh of meshes) {
    const key = `${mesh.material.color.getHex()}-${mesh.material.roughness}-${mesh.material.metalness}`;
    if (!batches.has(key)) batches.set(key, { material: mesh.material, geometries: [] });
    const batch = batches.get(key), geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    batch.geometries.push(geometry.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse)); mesh.geometry.dispose();
    if (batch.material !== mesh.material) mesh.material.dispose(); mesh.removeFromParent();
  }
  for (const batch of batches.values()) {
    const mesh = new THREE.Mesh(mergeGeometries(batch.geometries), batch.material);
    batch.geometries.forEach(geometry => geometry.dispose()); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  }
}

