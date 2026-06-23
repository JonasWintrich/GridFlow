import { useEffect, useRef, useState } from 'react';
import { createUniverse } from './three/universe';
import { SITE } from './product.config';
import { LegalPage, FormPage } from './Pages';

const SUBPAGES = ['terms', 'privacy', 'refund', 'intake', 'contact'] as const;
type Subpage = (typeof SUBPAGES)[number];
const readRoute = (): Subpage | null => {
  const h = window.location.hash.replace('#', '');
  return (SUBPAGES as readonly string[]).includes(h) ? (h as Subpage) : null;
};

// `?demo=<id>` re-skins the particle hero with a gallery preset; default = the
// motewave self-demo. Read once at load so the WebGL scene initializes cleanly.
const params = new URLSearchParams(window.location.search);
const ACTIVE_DEMO = SITE.demos.find((d) => d.id === params.get('demo')) ?? SITE.demo;
const ACTIVE_ID = 'id' in ACTIVE_DEMO ? ACTIVE_DEMO.id : null;
const PANELS = ACTIVE_DEMO.panels;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [route, setRoute] = useState<Subpage | null>(readRoute());

  // Hash-based sub-page routing (#terms/#privacy/#refund/#intake/#contact).
  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Brand accent → CSS custom properties (headline gradient, rail, CTAs, cards).
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--cyan', ACTIVE_DEMO.accent.a);
    root.setProperty('--violet', ACTIVE_DEMO.accent.b);
    root.setProperty('--magenta', ACTIVE_DEMO.accent.c);
  }, []);

  // Particle universe lives only on the main route; re-init when returning to it.
  useEffect(() => {
    if (route || !canvasRef.current) return;
    const universe = createUniverse(canvasRef.current, {
      demo: ACTIVE_DEMO,
      onReady: () => setLoaded(true),
    });
    return () => universe.dispose();
  }, [route]);

  useEffect(() => {
    if (route) return;
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

      // Rail dots track the active demo beat (scoped to the hero act).
      const N = PANELS.length;
      const actScroll = Math.max(1, (N - 1) * vh);
      const progress = Math.min(1, window.scrollY / actScroll);
      const active = Math.round(progress * (N - 1));
      dotRefs.current.forEach((d, i) => d?.classList.toggle('on', i === active));
      if (hintRef.current) hintRef.current.style.opacity = window.scrollY > 80 ? '0' : '1';

      // Fade the particle canvas down as the sales page scrolls in, so the copy
      // stays legible — a faint shimmer remains as ambiance.
      const fadeStart = (N - 0.5) * vh;
      const fadeEnd = N * vh;
      const f = Math.min(1, Math.max(0, (window.scrollY - fadeStart) / (fadeEnd - fadeStart)));
      if (canvasRef.current) canvasRef.current.style.opacity = String(1 - f * 0.88);
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
  }, [route]);

  // ── hash sub-pages (rendered instead of the main site) ──
  if (route === 'terms') return <LegalPage doc={SITE.legal.terms} />;
  if (route === 'privacy') return <LegalPage doc={SITE.legal.privacy} />;
  if (route === 'refund') return <LegalPage doc={SITE.legal.refund} />;
  if (route === 'intake')
    return <FormPage title="Send us your assets" lead="Thanks for your order! Upload your logo, photos, or 3D model and tell us about your brand — we’ll take it from here." src={SITE.forms.intakeUrl} fallbackNote="Email your logo, photos, or 3D model and a few notes about your brand, and we’ll get started." mailtoSubject="My motewave order — assets" />;
  if (route === 'contact')
    return <FormPage title="Let’s talk" lead="Tell us about your product and what you have in mind. We’ll reply with scope and next steps." src={SITE.forms.contactUrl} fallbackNote="Tell us about your product and we’ll reply with scope and next steps." mailtoSubject="motewave enquiry" />;

  return (
    <>
      <div id="loader" className={loaded ? 'gone' : ''}>
        <div className="ring" />
        <div className="txt">Assembling {SITE.brand}</div>
      </div>

      <canvas id="scene" ref={canvasRef} />
      <div id="vignette" />
      <div id="grain" />

      <header id="topbar">
        <div className="brand">{SITE.brand}</div>
        <a className="buy" href="#pricing">See pricing</a>
      </header>

      <nav id="rail" aria-hidden="true">
        {PANELS.map((_, i) => (
          <span key={i} className="dot" ref={(el) => { dotRefs.current[i] = el; }} />
        ))}
      </nav>

      {/* ── Zone A: the particle hero act ── */}
      <main id="scroll">
        {PANELS.map((p, i) => (
          <section key={i} className={`panel ${p.align}`}>
            <div className="reveal" ref={(el) => { revealRefs.current[i] = el; }}>
              <div className="kicker">{p.kicker}</div>
              {p.hero ? <h1>{p.title}</h1> : <h2>{p.title}</h2>}
              <p className="lead">{p.lead}</p>
            </div>
          </section>
        ))}
      </main>

      <div id="hint" ref={hintRef}>
        <span>Scroll</span>
        <span className="line" />
      </div>

      {/* ── Zone B: the conventional sales page ── */}
      <div id="sales">
        <section className="market pitch">
          <div className="kicker">{SITE.pitch.kicker}</div>
          <h2>{SITE.pitch.title}</h2>
          <p className="lead">{SITE.pitch.lead}</p>
        </section>

        <section className="market demos" id="demos">
          <div className="kicker">See what's possible</div>
          <h2>One engine. Endless launches.</h2>
          <p className="lead">Tap a demo to watch the hero at the top transform — your launch could look like any of these, built around your brand.</p>
          <div className="demo-grid">
            {SITE.demos.map((d) => (
              <a key={d.id} className={`demo-card${ACTIVE_ID === d.id ? ' active' : ''}`} href={`?demo=${d.id}`}>
                <div className="demo-swatch" style={{ background: `linear-gradient(120deg, ${d.accent.a}, ${d.accent.b}, ${d.accent.c})` }} />
                <div className="demo-meta">
                  <h3>{d.label}</h3>
                  <p>{d.blurb}</p>
                  <span className="demo-go">{ACTIVE_ID === d.id ? 'Now showing ↑' : 'Preview live →'}</span>
                </div>
              </a>
            ))}
          </div>
          {ACTIVE_ID && (
            <a className="demo-back" href={import.meta.env.BASE_URL}>← Back to the motewave demo</a>
          )}
        </section>

        <section className="market">
          <div className="features-grid">
            {SITE.features.map((f, i) => (
              <div className="feature" key={i}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="market">
          <div className="kicker">How it works</div>
          <div className="steps">
            {SITE.steps.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="market" id="pricing">
          <div className="kicker">Pricing</div>
          <h2>Pick a package.</h2>
          <div className="pricing">
            {SITE.packages.map((pkg) => (
              <div className={`tier${pkg.featured ? ' featured' : ''}`} key={pkg.name}>
                {pkg.featured && <div className="badge">Most popular</div>}
                <div className="tier-name">{pkg.name}</div>
                <div className="tier-price">{pkg.price}</div>
                <div className="tier-send"><span>You send</span>{pkg.youSend}</div>
                <p className="tier-blurb">{pkg.blurb}</p>
                <ul>
                  {pkg.features.map((feat, j) => (
                    <li key={j}>{feat}</li>
                  ))}
                </ul>
                <a className="buy-btn" href={pkg.stripeUrl}>
                  Get {pkg.name}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
                <a className="tier-example" href={`?demo=${pkg.exampleDemoId}`}>See an example →</a>
              </div>
            ))}
          </div>

          <div className="addon">
            <div className="addon-text">
              <div className="addon-eyebrow">{SITE.hostingAddon.eyebrow}</div>
              <div className="addon-head">
                <h3>{SITE.hostingAddon.name}</h3>
                <span className="addon-price">{SITE.hostingAddon.price}<em>{SITE.hostingAddon.period}</em></span>
              </div>
              <p>{SITE.hostingAddon.blurb}</p>
              <ul className="addon-features">
                {SITE.hostingAddon.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <a className="addon-btn" href={SITE.hostingAddon.stripeUrl}>Add hosting</a>
          </div>
        </section>

        <section className="market final">
          <h2>{SITE.finalCta.title}</h2>
          <p className="lead">{SITE.finalCta.lead}</p>
          <div className="final-actions">
            <a className="cta" href="#pricing">
              See packages
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a className="ghost" href="#contact">Contact us</a>
          </div>
        </section>

        <footer id="credit">
          <div className="foot-links">
            <a href="#contact">Contact</a>
            <a href="#intake">Already purchased? Send your assets →</a>
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#refund">Refunds</a>
          </div>
          <div className="foot-fine">{SITE.demo.modelAttribution} · {SITE.brand}</div>
        </footer>
      </div>
    </>
  );
}
