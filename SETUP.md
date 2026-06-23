# motewave — go-live setup

Everything below is paste-in configuration. No code changes needed to launch.

## 1. Stripe — payments (4 Payment Links)

Create **Payment Links** in the Stripe dashboard (Products → Payment Links). No backend, no API keys in the site.

| Link | Type | Paste into |
|------|------|-----------|
| Spark — $49 | one-time | `SITE.packages[0].stripeUrl` in `src/product.config.ts` |
| Signature — $129 | one-time | `SITE.packages[1].stripeUrl` |
| Flagship — $299 | one-time | `SITE.packages[2].stripeUrl` |
| Hosting — $9/mo | **recurring** | `SITE.hostingAddon.stripeUrl` |

For each **one-time** link, set the **post-payment redirect** (Payment Link → After payment → Redirect) to:

```
https://motewave.com/#intake
```

So a customer pays, then lands on the asset-intake form automatically.

## 2. Tally — intake + contact forms

Create two forms at [tally.so](https://tally.so) and paste their share URLs into `SITE.forms` in `src/product.config.ts`:

- **Intake** (`forms.intakeUrl`): add a **File Upload** field for the logo/photos/3D model, plus name, email, brand notes. This is where paying customers send assets (`/#intake`).
- **Contact** (`forms.contactUrl`): name, email, message — for `/#contact` leads.

## 3. Cloudflare Web Analytics

Dashboard → Analytics → **Web Analytics** → add `motewave.com` → copy the **token** → replace `REPLACE_WITH_CLOUDFLARE_TOKEN` in `index.html`. Cookie-less, no consent banner needed.

## 4. Email — hello@motewave.com

Cloudflare → your domain → **Email → Email Routing** → forward `hello@motewave.com` to your real inbox (free). All legal pages + contact links point here.

## 5. Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command: `npm run build` · Output directory: `dist`.
4. Add your custom domain `motewave.com` (Pages → Custom domains) — DNS + SSL are automatic.

## 6. Before launch — content checklist

- [ ] Replace the 4 Stripe URLs + 2 Tally URLs above.
- [ ] Paste the Cloudflare Analytics token.
- [ ] Add a real `public/og.png` (1200×630) for social link previews.
- [ ] Review the **placeholder legal text** in `SITE.legal` (`src/product.config.ts`) — incl. the German **Impressum** (fill in your real name/address; legally required).
- [ ] Personalize the **`SITE.about`** line + LinkedIn URL.
- [ ] Swap `SITE.contactEmail` to `hello@motewave.com` once Email Routing forwards (currently your Gmail).
- [ ] (Optional) The hero loads `public/models/car.glb` (~12 MB). Swapping for a lighter `.glb` speeds first paint. Demo models (`sneaker.glb`, `camera.glb`) load only on `?demo=`.

## Where everything lives

- **All copy, prices, packages, demos, legal text, form URLs:** `src/product.config.ts`
- **Meta / social tags / analytics beacon:** `index.html`
- **Particle engine:** `src/three/`
