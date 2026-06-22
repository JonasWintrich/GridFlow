import * as THREE from 'three';
import { snoise } from './glsl';

export interface ParticleSystem {
  points: THREE.Points;
  uniforms: {
    uTime: { value: number };
    uProgress: { value: number };
    uMouse: { value: THREE.Vector3 };
    uSize: { value: number };
    uPixelRatio: { value: number };
    uScatter: { value: number };
    uDrift: { value: number };
  };
  setTargets: (from: Float32Array, to: Float32Array) => void;
  dispose: () => void;
}

// Default deep-space palette: cyan -> violet -> magenta, with rare warm-white cores.
const DEFAULT_PALETTE = ['#22d3ee', '#38bdf8', '#8b5cf6', '#a855f7', '#e879f9', '#f0abfc'];

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform vec3  uMouse;
uniform float uSize;
uniform float uPixelRatio;
uniform float uScatter;
uniform float uDrift;

attribute vec3  aTargetFrom;
attribute vec3  aTargetTo;
attribute float aScale;
attribute vec3  aColor;
attribute vec3  aScatterDir;

varying vec3  vColor;
varying float vTwinkle;

${snoise}

void main() {
  vec3 pos = mix(aTargetFrom, aTargetTo, uProgress);

  // Organic, ever-moving drift (cheap pseudo-curl from 3 offset noise samples).
  float t = uTime * 0.08;
  vec3 q = pos * 0.045;
  float nx = snoise(q + vec3(0.0,  0.0,  t));
  float ny = snoise(q + vec3(31.4, 12.7, t));
  float nz = snoise(q + vec3(7.2,  91.3, t));
  pos += vec3(nx, ny, nz) * uDrift;

  // A subtle global "scatter" used at the very end of the journey.
  pos += aScatterDir * uScatter;

  // Cursor repulsion in screen-plane space.
  vec2 toMouse = pos.xy - uMouse.xy;
  float d = length(toMouse);
  float force = smoothstep(18.0, 0.0, d) * 8.0;
  pos.xy += normalize(toMouse + vec2(0.0001)) * force;

  vColor = aColor;
  vTwinkle = 0.65 + 0.35 * sin(uTime * 1.6 + aScale * 42.0);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * aScale * uPixelRatio * (60.0 / -mvPosition.z);
}
`;

const fragmentShader = /* glsl */ `
varying vec3  vColor;
varying float vTwinkle;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 2.0);
  // hot inner core so bloom catches the centers
  float core = smoothstep(0.13, 0.0, d) * 0.45;
  vec3 col = vColor + core;
  gl_FragColor = vec4(col, a * vTwinkle);
}
`;

export function createParticles(
  count: number,
  initial: Float32Array,
  palette: string[] = DEFAULT_PALETTE,
): ParticleSystem {
  const PALETTE = palette.map((hex) => new THREE.Color(hex));
  const geometry = new THREE.BufferGeometry();

  const aTargetFrom = new THREE.BufferAttribute(initial.slice(), 3);
  const aTargetTo = new THREE.BufferAttribute(initial.slice(), 3);
  aTargetFrom.setUsage(THREE.DynamicDrawUsage);
  aTargetTo.setUsage(THREE.DynamicDrawUsage);

  const scales = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // mostly small dust, a few bright giants
    scales[i] = Math.random() < 0.06 ? 1.6 + Math.random() * 1.8 : 0.5 + Math.random() * 0.7;

    const a = PALETTE[(Math.random() * PALETTE.length) | 0];
    const b = PALETTE[(Math.random() * PALETTE.length) | 0];
    c.copy(a).lerp(b, Math.random());
    if (Math.random() < 0.05) c.lerp(new THREE.Color('#ffffff'), 0.7); // rare white giants
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    // a random outward direction for the final dispersal
    const dx = Math.random() * 2 - 1;
    const dy = Math.random() * 2 - 1;
    const dz = Math.random() * 2 - 1;
    const len = Math.hypot(dx, dy, dz) || 1;
    scatter[i * 3 + 0] = (dx / len) * (0.4 + Math.random() * 0.6);
    scatter[i * 3 + 1] = (dy / len) * (0.4 + Math.random() * 0.6);
    scatter[i * 3 + 2] = (dz / len) * (0.4 + Math.random() * 0.6);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(initial.slice(), 3));
  geometry.setAttribute('aTargetFrom', aTargetFrom);
  geometry.setAttribute('aTargetTo', aTargetTo);
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aScatterDir', new THREE.BufferAttribute(scatter, 3));

  const uniforms: ParticleSystem['uniforms'] = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uMouse: { value: new THREE.Vector3(9999, 9999, 0) },
    uSize: { value: 3.2 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uScatter: { value: 0 },
    uDrift: { value: 1.7 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // particles drift outside their original bounds

  const setTargets = (from: Float32Array, to: Float32Array) => {
    (aTargetFrom.array as Float32Array).set(from);
    (aTargetTo.array as Float32Array).set(to);
    aTargetFrom.needsUpdate = true;
    aTargetTo.needsUpdate = true;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return { points, uniforms, setTargets, dispose };
}
