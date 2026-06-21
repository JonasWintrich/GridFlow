import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { createParticles } from './particles';
import { galaxy, sphere, helix, starfield, textToPoints, modelToPoints } from './shapes';

export interface UniverseHandle {
  dispose: () => void;
}

interface Options {
  onReady?: () => void;
  onProgress?: (progress: number, index: number) => void;
  modelUrl?: string;
}

const smootherstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function createUniverse(canvas: HTMLCanvasElement, opts: Options = {}): UniverseHandle {
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const COUNT = isMobile ? 45000 : 120000;
  const noBloom = new URLSearchParams(window.location.search).has('nobloom');

  // --- renderer ---
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x03030a, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  // --- scene + camera ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03030a, 0.0019);
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 78);

  // --- shapes (procedural ready immediately; model swapped in once loaded) ---
  const shapes: Float32Array[] = [
    galaxy(COUNT),          // 0
    textToPoints('FLOWLY', COUNT, 30), // 1
    sphere(COUNT, 24),      // 2
    sphere(COUNT, 22),      // 3 -> replaced by model
    helix(COUNT),           // 4
    starfield(COUNT, 95),   // 5
  ];
  const N = shapes.length;

  // Per-shape camera framing.
  const camZ = [82, 60, 58, 64, 74, 94];
  const tiltX = [0.85, 0.0, 0.22, 0.0, 0.0, 0.35];

  const group = new THREE.Group();
  scene.add(group);
  const particles = createParticles(COUNT, shapes[0]);
  particles.uniforms.uPixelRatio.value = dpr;
  group.add(particles.points);

  // --- post-processing (bloom) ---
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    isMobile ? 0.4 : 0.55, // strength
    0.5, // radius
    0.28, // threshold — only the brightest cores bloom, keeping space deep-black
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // --- interaction state ---
  const mouseNDC = new THREE.Vector2(0, 0);
  const mouseWorld = new THREE.Vector3(9999, 9999, 0);
  const mouseWorldTarget = new THREE.Vector3(0, 0, 0);
  let hasMouse = false;

  let targetIndex = 0; // 0..N-1 driven by scroll
  let currentIndex = 0; // eased
  let lastSeg = -1;

  // --- handlers ---
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    targetIndex = progress * (N - 1);
    opts.onProgress?.(progress, Math.round(targetIndex));
  };

  const onPointerMove = (e: PointerEvent) => {
    hasMouse = true;
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(window.innerWidth, window.innerHeight);
    particles.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', onResize);
  onScroll();

  // --- render loop ---
  const timer = new THREE.Timer();
  let raf = 0;
  let firstFrame = true;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    // ease morph index toward scroll target
    currentIndex += (targetIndex - currentIndex) * Math.min(1, dt * 4.5);
    const seg = Math.min(N - 2, Math.max(0, Math.floor(currentIndex)));
    const local = Math.min(1, Math.max(0, currentIndex - seg));
    const eased = smootherstep(local);

    if (seg !== lastSeg) {
      particles.setTargets(shapes[seg], shapes[seg + 1]);
      lastSeg = seg;
    }
    particles.uniforms.uProgress.value = eased;
    particles.uniforms.uTime.value = t;

    // final dispersal burst near the very end of the page
    particles.uniforms.uScatter.value = smootherstep((currentIndex - (N - 1.6)) / 0.6) * 7;

    // camera framing interpolated along the journey
    const z = lerp(camZ[seg], camZ[seg + 1], eased);
    const tx = lerp(tiltX[seg], tiltX[seg + 1], eased);

    // mouse parallax + world-space cursor for repulsion
    if (hasMouse) {
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * z;
      const halfW = halfH * camera.aspect;
      mouseWorldTarget.set(mouseNDC.x * halfW, mouseNDC.y * halfH, 0);
    }
    mouseWorld.lerp(mouseWorldTarget, 0.08);
    particles.uniforms.uMouse.value.copy(mouseWorld);

    camera.position.x += (mouseNDC.x * 6 - camera.position.x) * 0.04;
    camera.position.y += (mouseNDC.y * 4 - camera.position.y) * 0.04;
    camera.position.z += (z - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);

    // gentle sway so forms stay legible but alive
    group.rotation.y = Math.sin(t * 0.13) * 0.28 + mouseNDC.x * 0.12;
    group.rotation.x += (tx + Math.sin(t * 0.1) * 0.06 - group.rotation.x) * 0.05;

    if (noBloom) renderer.render(scene, camera);
    else composer.render();

    // Reveal as soon as the (procedural) universe paints its first frame —
    // the galaxy is ready instantly; the model streams in behind the scenes.
    if (firstFrame) {
      firstFrame = false;
      opts.onReady?.();
    }
  };
  tick();

  // --- load the open-source model and swap it into slot 3 once it's ready ---
  if (opts.modelUrl) {
    modelToPoints(opts.modelUrl, COUNT, 44, new THREE.Euler(0, -0.6, 0))
      .then((pts) => {
        shapes[3] = pts;
        // if the viewer is already at/near that segment, refresh the live buffers
        if (lastSeg === 2 || lastSeg === 3) {
          particles.setTargets(shapes[lastSeg], shapes[lastSeg + 1]);
        }
      })
      .catch((err) => {
        console.warn('[Flowly] model load failed, keeping procedural fallback:', err);
      });
  }

  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      particles.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
