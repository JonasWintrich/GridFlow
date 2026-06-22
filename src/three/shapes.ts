import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Every shape generator returns exactly `count * 3` floats so morphing is a clean 1:1 lerp.

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Spiral galaxy / nebula — the hero shape. */
export function galaxy(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const arms = 5;
  const radiusMax = 46;
  const spin = 1.15;
  for (let i = 0; i < count; i++) {
    const arm = i % arms;
    const t = Math.pow(Math.random(), 0.65); // denser toward the core
    const radius = t * radiusMax;
    const branch = (arm / arms) * Math.PI * 2;
    const spinAngle = radius * spin * 0.06;
    // randomness shrinks toward the core for a tight bright center
    const spread = 0.18 + t * 0.55;
    const rx = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * radius * spread;
    const ry = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * radius * spread * 0.35;
    const rz = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * radius * spread;
    const a = branch + spinAngle;
    out[i * 3 + 0] = Math.cos(a) * radius + rx;
    out[i * 3 + 1] = ry;
    out[i * 3 + 2] = Math.sin(a) * radius + rz;
  }
  return out;
}

/** Fibonacci sphere — a clean glowing globe. */
export function sphere(count: number, radius = 24): Float32Array {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = 1 + rand(-0.012, 0.012);
    out[i * 3 + 0] = Math.cos(theta) * r * radius * jitter;
    out[i * 3 + 1] = y * radius * jitter;
    out[i * 3 + 2] = Math.sin(theta) * r * radius * jitter;
  }
  return out;
}

/** Double helix along the Y axis. */
export function helix(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const height = 70;
  const radius = 10;
  const turns = 5;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const strand = i % 2;
    const angle = t * turns * Math.PI * 2 + strand * Math.PI;
    const y = (t - 0.5) * height;
    const jx = rand(-0.5, 0.5);
    const jz = rand(-0.5, 0.5);
    out[i * 3 + 0] = Math.cos(angle) * radius + jx;
    out[i * 3 + 1] = y + rand(-0.3, 0.3);
    out[i * 3 + 2] = Math.sin(angle) * radius + jz;
  }
  return out;
}

/** Dispersed deep-space starfield — the final exhale. */
export function starfield(count: number, radius = 95): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // uniform within a sphere volume (cube-root for even density)
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    out[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = r * Math.cos(phi);
  }
  return out;
}

/** Render text to an offscreen canvas, then sample filled pixels into 3D points. */
export function textToPoints(text: string, count: number, worldHeight = 30): Float32Array {
  const out = new Float32Array(count * 3);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 220;
  ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width) + 40;
  const h = Math.ceil(fontSize * 1.4);
  canvas.width = w;
  canvas.height = h;
  // re-set font after resize (resizing clears state)
  ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const data = ctx.getImageData(0, 0, w, h).data;
  const filled: number[] = [];
  // step by 1px but only keep alpha>threshold; store flat index
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 128) filled.push(x, y);
    }
  }
  const pairCount = filled.length / 2;
  const factor = worldHeight / h;
  for (let i = 0; i < count; i++) {
    const p = (Math.floor(Math.random() * pairCount)) * 2;
    const px = filled[p];
    const py = filled[p + 1];
    out[i * 3 + 0] = (px - w / 2) * factor + rand(-0.12, 0.12);
    out[i * 3 + 1] = -(py - h / 2) * factor + rand(-0.12, 0.12);
    out[i * 3 + 2] = rand(-1.6, 1.6);
  }
  return out;
}

/**
 * Rotate a point cloud in place-correspondence — point `i` maps to the same
 * surface point, just rotated. Sampling the model once and deriving each angled
 * view this way keeps the 1:1 morph clean, so the cloud reads as a rigid rotation
 * (the product physically turning) rather than a random re-shuffle.
 */
export function rotatePoints(src: Float32Array, euler: THREE.Euler): Float32Array {
  const out = new Float32Array(src.length);
  const m = new THREE.Matrix4().makeRotationFromEuler(euler);
  const e = m.elements;
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i], y = src[i + 1], z = src[i + 2];
    out[i] = e[0] * x + e[4] * y + e[8] * z;
    out[i + 1] = e[1] * x + e[5] * y + e[9] * z;
    out[i + 2] = e[2] * x + e[6] * y + e[10] * z;
  }
  return out;
}

/** Sample the surface of a loaded glTF model into a point cloud of `count` points. */
export async function modelToPoints(
  url: string,
  count: number,
  targetSize = 40,
  rotation: THREE.Euler = new THREE.Euler(0, 0, 0),
): Promise<Float32Array> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);

  // Collect every mesh, bake world transforms, keep position only.
  const geoms: THREE.BufferGeometry[] = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      const g = mesh.geometry.clone();
      g.applyMatrix4(mesh.matrixWorld);
      const pos = g.getAttribute('position');
      const plain = new THREE.BufferGeometry();
      plain.setAttribute('position', pos.clone());
      const index = g.getIndex();
      if (index) plain.setIndex(index.clone());
      geoms.push(plain);
    }
  });

  const merged = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms, false);
  if (!merged) throw new Error('No geometry found in model');

  // Orient, center and scale to the target size.
  merged.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rotation));
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = targetSize / Math.max(size.x, size.y, size.z);

  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  const out = new Float32Array(count * 3);
  const temp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(temp);
    out[i * 3 + 0] = (temp.x - center.x) * scale;
    out[i * 3 + 1] = (temp.y - center.y) * scale;
    out[i * 3 + 2] = (temp.z - center.z) * scale;
  }
  return out;
}
