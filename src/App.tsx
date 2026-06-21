import { useEffect, useRef, useState } from 'react';
import { createUniverse } from './three/universe';

const PANELS = [
  {
    align: 'center',
    kicker: 'A hundred thousand points of light',
    title: <h1>FLOWLY</h1>,
    lead: 'A living cloud of 120,000 luminous particles. Scroll, and watch the cosmos rearrange itself before your eyes.',
  },
  {
    align: 'left',
    kicker: 'Form follows motion',
    title: <h2>Matter remembers every shape it has ever been.</h2>,
    lead: 'A spiral galaxy collapses into a single word — the same particles, flowing between forms, never breaking.',
  },
  {
    align: 'right',
    kicker: 'Whole worlds, one breath apart',
    title: <h2>A perfect sphere, woven from drifting dust.</h2>,
    lead: 'Curl-noise turbulence keeps every point alive — breathing, shimmering, refusing to sit still.',
  },
  {
    align: 'left',
    kicker: 'It can become anything',
    title: <h2>Even a real 3D object, rebuilt entirely from light.</h2>,
    lead: 'This shape is sampled from an actual glTF model — 120,000 particles snapping onto its surface in real time.',
  },
  {
    align: 'right',
    kicker: 'The code of everything',
    title: <h2>Then it spirals into the helix of life itself.</h2>,
    lead: 'Two intertwined strands, rendered on the GPU and bathed in real-time bloom.',
  },
  {
    align: 'center',
    kicker: 'Then it lets go',
    title: <h2>And scatters back into the infinite.</h2>,
    lead: 'You just watched physics put on a show. Imagine what it could do for your story.',
    cta: true,
  },
] as const;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const universe = createUniverse(canvasRef.current, {
      modelUrl: `${import.meta.env.BASE_URL}models/helmet.glb`,
      onReady: () => setLoaded(true),
    });
    return () => universe.dispose();
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      const center = vh / 2;
      revealRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const dist = Math.abs(elCenter - center);
        const o = Math.max(0, 1 - dist / (vh * 0.55));
        el.style.opacity = String(o * o);
        el.style.transform = `translateY(${(1 - o) * 30}px)`;
      });

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      const active = Math.round(progress * (PANELS.length - 1));
      dotRefs.current.forEach((d, i) => d?.classList.toggle('on', i === active));
      if (hintRef.current) hintRef.current.style.opacity = window.scrollY > 80 ? '0' : '1';
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <div id="loader" className={loaded ? 'gone' : ''}>
        <div className="ring" />
        <div className="txt">Igniting the universe</div>
      </div>

      <canvas id="scene" ref={canvasRef} />
      <div id="vignette" />
      <div id="grain" />

      <header id="topbar">
        <div className="brand">FLOWLY</div>
        <div className="meta">EST. ∞ · A PARTICLE UNIVERSE</div>
      </header>

      <nav id="rail" aria-hidden="true">
        {PANELS.map((_, i) => (
          <span key={i} className="dot" ref={(el) => { dotRefs.current[i] = el; }} />
        ))}
      </nav>

      <main id="scroll">
        {PANELS.map((p, i) => (
          <section key={i} className={`panel ${p.align}`}>
            <div className="reveal" ref={(el) => { revealRefs.current[i] = el; }}>
              <div className="kicker">{p.kicker}</div>
              {p.title}
              <p className="lead">{p.lead}</p>
              {'cta' in p && p.cta && (
                <div>
                  <a className="cta" href="#" onClick={(e) => e.preventDefault()}>
                    Begin your universe
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </section>
        ))}
      </main>

      <div id="hint" ref={hintRef}>
        <span>Scroll</span>
        <span className="line" />
      </div>

      <footer id="credit">
        Model: “Battle Damaged Sci-fi Helmet” by ctxr · CC-BY 4.0 · Built with Three.js
      </footer>
    </>
  );
}
