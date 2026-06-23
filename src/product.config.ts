// ─────────────────────────────────────────────────────────────────────────────
// motewave site config — the single source of truth for the whole page.
//
// motewave is a SERVICE: we build particle-powered launch pages for businesses.
// `demo` drives the particle hero (the live proof of what clients get); the rest
// drives the conventional sales page (pitch, how-it-works, pricing, CTA).
// Edit copy + paste real Stripe Payment Links into `packages[].stripeUrl` to go live.
// ─────────────────────────────────────────────────────────────────────────────

/** Which particle form a demo panel snaps the cloud into. */
export type View =
  | { kind: 'brandText'; text: string }            // particles spell the brand
  | { kind: 'model'; yaw: number; pitch?: number }  // a rotated view of the product cloud
  | { kind: 'sphere'; radius?: number }             // an abstract "field" beat
  | { kind: 'galaxy' }                              // abstract opener
  | { kind: 'helix' }                               // double-helix beat
  | { kind: 'starfield'; radius?: number };         // abstract disperse

/** A swappable hero preset — selected via `?demo=<id>`; shown in the gallery. */
export interface Demo {
  id: string;
  label: string;
  blurb: string;
  /** Optional product model; omit for a purely procedural (logo/shape) demo. */
  modelUrl?: string;
  modelSize: number;
  accent: { a: string; b: string; c: string };
  panels: Panel[];
}

export interface Panel {
  align: 'left' | 'right' | 'center';
  kicker: string;
  title: string;
  lead: string;
  view: View;
  /** Camera distance for this beat (smaller = closer). */
  camZ: number;
  /** Resting x-tilt of the particle group for this beat. */
  tiltX: number;
  /** Render the title as the big gradient <h1> instead of <h2>. */
  hero?: boolean;
}

export interface Package {
  name: string;
  price: string;
  /** What the client provides for this tier — shown prominently on the card. */
  youSend: string;
  blurb: string;
  features: string[];
  /** Stripe Payment Link URL — a plain href, no backend. '#' = not wired yet. */
  stripeUrl: string;
  /** Demo preset id (see `demos`) this tier links to as a live example. */
  exampleDemoId: string;
  featured?: boolean;
}

/** A simple legal document rendered at a hash route (#terms / #privacy / #refund). */
export interface LegalDoc {
  title: string;
  updated: string;
  sections: { h: string; p: string }[];
}

const BASE = import.meta.env.BASE_URL;
// Public contact address (mailto links, legal pages, contact-form fallback).
// Swap to hello@motewave.com once that inbox/forwarding is set up.
const CONTACT_EMAIL = 'jonas.wintrich@gmail.com';

export const SITE = {
  brand: 'motewave',
  tagline: 'Launch pages made of light.',
  contactEmail: CONTACT_EMAIL,

  // ── the particle "demo reel": motewave brand → a product assembling & turning ──
  demo: {
    modelUrl: `${BASE}models/aura-one.glb`,
    modelAttribution: '“BoomBox” by Microsoft · CC0 · Demo product',
    modelSize: 56,
    // Warm amber → rose → violet brand accent (flows through palette, headings, CTAs).
    accent: { a: '#f5b14c', b: '#fb7185', c: '#a855f7' },
    panels: [
      {
        align: 'center',
        hero: true,
        kicker: 'Particle launch pages',
        title: 'motewave',
        lead: 'We turn your product into a living cloud of 120,000 particles. Scroll to watch one take shape.',
        view: { kind: 'brandText', text: 'motewave' },
        camZ: 60,
        tiltX: 0,
      },
      {
        align: 'left',
        kicker: 'Watch',
        title: 'Your product, drawn from 120,000 points of light.',
        lead: 'A real 3D model of the product, sampled onto the surface in real time — rendered live on the GPU, not a video.',
        view: { kind: 'model', yaw: 0 },
        camZ: 56,
        tiltX: 0.14,
      },
      {
        align: 'right',
        kicker: 'It moves',
        title: 'It dissolves, turns, and re-forms — never breaking.',
        lead: 'Every scroll choreographs the cloud. The same particles flow between angles and shapes, alive with curl-noise drift and bloom.',
        view: { kind: 'model', yaw: -0.95 },
        camZ: 58,
        tiltX: 0.1,
      },
      {
        align: 'center',
        kicker: 'This is just a demo',
        title: 'Picture your product here.',
        lead: 'A speaker, a sneaker, a bottle, your logo — anything with a shape. Keep scrolling to see how it works and what it costs.',
        view: { kind: 'model', yaw: 0.55 },
        camZ: 54,
        tiltX: 0.12,
      },
    ] as Panel[],
  },

  // ── swappable demo presets (gallery cards → `?demo=<id>` re-skins the hero) ──
  // Variety to spark a prospect's imagination: different industries, shapes, palettes.
  demos: [
    {
      id: 'saas',
      label: 'App / SaaS launch',
      blurb: 'A logo that ignites out of a spiral galaxy, then resolves to a clean orb.',
      modelSize: 50,
      accent: { a: '#22d3ee', b: '#8b5cf6', c: '#e879f9' },
      panels: [
        { align: 'center', hero: true, kicker: 'App / SaaS launch', title: 'NOVA', lead: 'Your logo, igniting out of 120,000 points of light.', view: { kind: 'brandText', text: 'NOVA' }, camZ: 60, tiltX: 0 },
        { align: 'left', kicker: 'Origin', title: 'Born from a galaxy.', lead: 'Particles swirl into form, then snap to your mark.', view: { kind: 'galaxy' }, camZ: 82, tiltX: 0.85 },
        { align: 'right', kicker: 'Focus', title: 'Then resolve into a perfect whole.', lead: 'A clean, glowing sphere — the calm after the spin.', view: { kind: 'sphere', radius: 24 }, camZ: 60, tiltX: 0.2 },
      ],
    },
    {
      id: 'fashion',
      label: 'Fashion drop',
      blurb: 'A name woven from drifting dust that spirals like fabric in motion.',
      modelSize: 50,
      accent: { a: '#f5b14c', b: '#fb7185', c: '#a855f7' },
      panels: [
        { align: 'center', hero: true, kicker: 'Fashion drop', title: 'VELOUR', lead: 'A name woven from drifting dust and warm light.', view: { kind: 'brandText', text: 'VELOUR' }, camZ: 64, tiltX: 0 },
        { align: 'left', kicker: 'Texture', title: 'Woven from light itself.', lead: 'Every point shimmers and breathes, never sitting still.', view: { kind: 'sphere', radius: 24 }, camZ: 60, tiltX: 0.2 },
        { align: 'right', kicker: 'Motion', title: 'It spirals, like fabric in the wind.', lead: 'Two strands of light, intertwining.', view: { kind: 'helix' }, camZ: 74, tiltX: 0 },
      ],
    },
    {
      id: 'music',
      label: 'Music / album',
      blurb: 'Sound swelling from a galaxy, then scattering across the night sky.',
      modelSize: 50,
      accent: { a: '#e879f9', b: '#c084fc', c: '#8b5cf6' },
      panels: [
        { align: 'center', hero: true, kicker: 'Album / single', title: 'ECHO', lead: 'Sound, made visible — and scattered across the stars.', view: { kind: 'brandText', text: 'ECHO' }, camZ: 60, tiltX: 0 },
        { align: 'left', kicker: 'Swell', title: 'It builds from a galaxy of sound.', lead: 'A slow spiral, gathering energy toward the drop.', view: { kind: 'galaxy' }, camZ: 82, tiltX: 0.85 },
        { align: 'right', kicker: 'Release', title: 'Then lets go, into the infinite.', lead: 'The cloud disperses into a deep-space starfield.', view: { kind: 'starfield', radius: 95 }, camZ: 94, tiltX: 0.35 },
      ],
    },
    {
      id: 'product',
      label: 'Product reveal (3D)',
      blurb: 'Your actual product, sampled into particles and rotating in light.',
      modelUrl: `${BASE}models/aura-one.glb`,
      modelSize: 56,
      accent: { a: '#fbbf24', b: '#fb923c', c: '#f472b6' },
      panels: [
        { align: 'center', hero: true, kicker: 'Product reveal', title: 'AURA', lead: 'Your product, rebuilt entirely from light.', view: { kind: 'brandText', text: 'AURA' }, camZ: 60, tiltX: 0 },
        { align: 'left', kicker: 'Form', title: 'Sampled onto a real 3D model.', lead: '120,000 particles snap onto its surface in real time.', view: { kind: 'model', yaw: 0 }, camZ: 56, tiltX: 0.14 },
        { align: 'right', kicker: 'Turn', title: 'Dissolving and re-forming as it turns.', lead: 'The same particles flow between every angle, never breaking.', view: { kind: 'model', yaw: -0.95 }, camZ: 58, tiltX: 0.1 },
      ],
    },
  ] as Demo[],

  // ── conventional sales page (everything below the particle hero) ──
  pitch: {
    kicker: 'What motewave does',
    title: 'A launch page nobody scrolls past.',
    lead: 'That product above was 120,000 particles assembling in your browser. Yours could be next — a bespoke, scroll-driven reveal that makes your launch feel like an event.',
  },

  features: [
    {
      title: 'Your product in particles',
      body: 'Send a 3D model, product photos, or just your logo — we rebuild it as a living cloud of light that assembles as visitors scroll.',
    },
    {
      title: 'Scroll choreography',
      body: 'Every section is a beat: forms morph, the product turns, text reveals. We script the whole journey around your story.',
    },
    {
      title: 'Real-time, not video',
      body: 'Rendered live on the GPU in any modern browser — crisp at every screen size, interactive, and a fraction of a video’s weight.',
    },
    {
      title: 'Yours to keep',
      body: 'You get the full source code and deploy it free on Vercel, Netlify, or Cloudflare. No monthly fees, no lock-in — the page is yours.',
    },
  ],

  steps: [
    { n: '01', title: 'Pick a package & send your assets', body: 'Choose a tier, check out, and send your logo, photos, or 3D model plus a few notes on the vibe.' },
    { n: '02', title: 'We build your page', body: 'We sample your brand into particles, choreograph the scroll, and write the copy. You review; we revise.' },
    { n: '03', title: 'You get the code & go live', body: 'Receive the full source with a 1-click deploy guide. Host it free on Vercel, Netlify, or Cloudflare — you own it outright, no subscriptions, no lock-in.' },
  ],

  packages: [
    {
      name: 'Spark',
      price: '$49',
      youSend: 'Your logo or brand name',
      blurb: 'A one-page particle hero that assembles your brand in light.',
      features: ['One-page particle hero', 'Up to 3 scroll beats', 'Mobile-tuned', 'Full source code — deploy free anywhere', '~3-day delivery · 1 revision'],
      stripeUrl: '#', // paste your Stripe Payment Link
      exampleDemoId: 'saas',
    },
    {
      name: 'Signature',
      price: '$129',
      youSend: 'Your product photos',
      blurb: 'A multi-beat scroll reveal built around your product.',
      features: ['Multi-beat scroll reveal', 'Custom copy + your brand colors', 'Landing sections (features + CTA)', 'Full source code — deploy free anywhere', '~5-day delivery · 2 revisions'],
      stripeUrl: '#',
      exampleDemoId: 'fashion',
      featured: true,
    },
    {
      name: 'Flagship',
      price: '$299',
      youSend: 'Your 3D model (.glb / .gltf)',
      blurb: 'Your product sampled into 120,000 particles — the full reveal.',
      features: ['Full 3D product reveal, rotating', 'Complete custom microsite + copy', 'Your brand palette', 'Priority delivery', 'Full source code — deploy free anywhere', '~7-day delivery · 3 revisions'],
      stripeUrl: '#',
      exampleDemoId: 'product',
    },
  ] as Package[],

  // ── optional upsell, offered on top of any package (not baked into the tiers) ──
  hostingAddon: {
    eyebrow: 'Optional add-on',
    name: 'Done-for-you hosting',
    price: '$9',
    period: '/mo',
    blurb: 'Every package ships as code you own and can deploy free yourself. Don’t want to? Add this and we’ll host your page on a fast global CDN with your custom domain — cancel anytime, the code stays yours.',
    features: ['Hosted on a global CDN', 'Your custom domain connected', 'SSL + small tweaks handled', 'Cancel anytime'],
    stripeUrl: '#', // paste a Stripe subscription Payment Link
  },

  finalCta: {
    title: 'Ready to launch in light?',
    lead: 'Pick a package to get started, or email us with your product and we’ll scope it.',
  },

  // ── Tally forms (file-upload intake + contact). Paste your form URLs here. ──
  // Set each Stripe Payment Link's post-payment redirect to .../#intake.
  forms: {
    intakeUrl: 'https://tally.so/r/2EV5X9', // intake form WITH file upload (logo/photos/3D)
    contactUrl: 'https://tally.so/r/2EV5X9', // simple contact / scoping form
  },

  // ── Legal pages (#terms / #privacy / #refund). PLACEHOLDER copy — have a
  //    professional review before relying on it. ──
  legal: {
    terms: {
      title: 'Terms of Service',
      updated: '2026',
      sections: [
        { h: 'The service', p: 'motewave designs and builds bespoke particle-based launch web pages. Each package describes its scope, deliverables, delivery time, and number of revisions. Work begins once payment is received and you have supplied the required assets.' },
        { h: 'Payment', p: 'Package fees are one-time and charged up front via Stripe. The optional hosting add-on is a recurring monthly subscription billed via Stripe until cancelled.' },
        { h: 'Delivery & revisions', p: 'We deliver within the timeframe stated on your package, subject to receiving complete assets and timely feedback. Revisions are limited to the number stated on your tier.' },
        { h: 'Ownership', p: 'On final payment, you own the delivered source code outright and may host, modify, and reuse it freely. Third-party assets you supply remain yours; open-source components keep their original licenses.' },
        { h: 'Hosting add-on', p: 'If you subscribe to done-for-you hosting, we host your page and connect your domain. You may cancel anytime; on cancellation we provide your code so you can self-host.' },
        { h: 'Liability', p: 'The service is provided “as is.” To the maximum extent permitted by law, motewave is not liable for indirect or consequential damages. Our total liability is limited to the fees you paid.' },
        { h: 'Contact', p: `Questions about these terms: ${CONTACT_EMAIL}.` },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      updated: '2026',
      sections: [
        { h: 'What we collect', p: 'Information you submit through our forms (name, email, brand assets, project notes) and privacy-friendly, cookie-less analytics about page visits.' },
        { h: 'Processors', p: 'We use Stripe (payments), Tally (forms), and Cloudflare (hosting + Web Analytics). Your data is processed by these providers under their own privacy policies.' },
        { h: 'How we use it', p: 'Solely to deliver your project, respond to enquiries, and improve the site. We do not sell your data or share it beyond the processors above.' },
        { h: 'Cookies', p: 'We use Cloudflare Web Analytics, which does not use cookies or fingerprinting. Stripe/Tally may set cookies during checkout or form submission.' },
        { h: 'Your rights & contact', p: `Request access to or deletion of your data anytime at ${CONTACT_EMAIL}.` },
      ],
    },
    refund: {
      title: 'Refund & Cancellation',
      updated: '2026',
      sections: [
        { h: 'Custom work', p: 'Because each page is custom-built, fees become non-refundable once design work has begun. Before work starts, you may request a full refund.' },
        { h: 'Not satisfied', p: 'If the delivered page materially differs from your package scope, we will revise it within your tier’s revision limit at no charge.' },
        { h: 'Hosting subscription', p: 'The monthly hosting add-on can be cancelled anytime and stops at the end of the current billing period; the current month is not pro-rated. Your source code remains yours.' },
        { h: 'Contact', p: `Refund or cancellation requests: ${CONTACT_EMAIL}.` },
      ],
    },
  } satisfies Record<'terms' | 'privacy' | 'refund', LegalDoc>,
};
