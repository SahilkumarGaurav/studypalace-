# StudyPalace 🎓

A complete, production-ready **digital storefront for selling NIFT preparation PDFs and eBooks**.

Students find you on Google → buy with Razorpay (UPI / card / netbanking) → **download the PDF instantly from the website** → and can re-download it forever from *My Downloads*. You manage everything from a private admin panel that only you can reach.

Built with **Next.js 15 (App Router) + TypeScript + Tailwind + SQLite + Razorpay**.

---

## ✨ What's included

### Storefront (mobile-first)
| Page | Purpose |
|---|---|
| `/` | Home — hero, search, categories, bestsellers, bundle CTA, how-it-works, reviews, FAQ |
| `/shop` | All products with search, category chips, sort and max-price filter |
| `/c/[category]` | GAT, CAT, Situation Test, Previous Year Papers, Current Affairs, Bundles |
| `/p/[slug]` | Product page — cover, price, what's inside, FAQ, related items, sticky mobile buy bar |
| `/checkout` | Email + coupon + Razorpay payment |
| `/order/[number]` | Payment confirmation with the download buttons |
| `/my-downloads` | Lifetime re-download using order number **or** email |
| `/guides` + 6 long-form guides | Free SEO content that ranks and funnels into the shop |
| `/refund-policy`, `/terms`, `/privacy`, `/contact` | Legal + support |

### Admin panel (`/admin` — owner only)
- **Dashboard** — revenue, units sold, 7-day chart, best sellers, activity log, alerts
- **Products** — upload a PDF, set price/MRP, write the copy, toggle live/featured/bestseller, build bundles, edit SEO fields, delete
- **Orders** — search, inspect, see payment ids and download counts, mark paid / refunded, add notes
- **Coupons** — percent or flat, min cart value, usage limit, expiry, one-click presets
- **Files** — media library, upload progress, storage health
- **Settings** — a live pass/fail checklist of everything that must be right before you take money

### SEO (this is the growth engine)
- Server-rendered HTML on every page
- `sitemap.xml` regenerated on each request → **new products reach Google automatically**
- `robots.txt` (blocks `/admin`, `/api`, `/checkout`, `/order`, `/my-downloads`)
- JSON-LD: `Organization`, `WebSite` + SearchAction, `Product` + `Offer` (price, availability, **`MerchantReturnNotSupported`**), `AggregateRating`, `FAQPage`, `BreadcrumbList`, `Article`, `ItemList`
- Canonical URLs, Open Graph + Twitter cards, `og.png` share image, `manifest.webmanifest` (installable PWA)
- Keyword-targeted URLs students actually type: `/nift-gat-syllabus-pdf`, `/nift-cat-drawing-practice-pdf`, `/nift-situation-test-material`, `/nift-exam-pattern-marks-weightage`, `/nift-current-affairs-fashion-gk-pdf`, `/nift-previous-year-question-papers`
- Deleted products are served with `<meta name="robots" content="noindex">` so Google drops them

### Security
- `/admin` guarded by **middleware** (runs before rendering), a signed expiring session cookie, and per-route checks on every admin API
- Password compared with **bcrypt**; login rate-limited (8 attempts → 15-minute lockout)
- PDFs stored **outside `public/`** — there is no guessable URL. The only way to get a file is `/api/download/<token>?product=<id>` with a **paid** order that actually contains that product
- Razorpay signature verified **server-side** (`order_id|payment_id`), plus a webhook as a backup
- Prices are always re-read from the database — a tampered browser can never pay less
- No card data ever touches this server

---

## 🚀 Quick start (5 minutes)

```bash
npm install
npm run make-sample          # creates two real test PDFs in scripts/sample/
cp .env.example .env.local
npm run secret               # prints an APP_SECRET + ADMIN_PASSWORD → paste into .env.local
npm run dev                  # http://localhost:3000
```

Then:
1. Open **http://localhost:3000/admin/login** and sign in with the email/password from `.env.local`.
2. Click **+ Add a product**, upload `scripts/sample/sample-gat-quantitative-ability.pdf`, set a price, save.
3. Open the product page, click **Buy & download instantly**, and pay.

> ⚠️ **Always wrap env values containing `#` in double quotes.** Next.js treats an unquoted `#` as the start of a comment, so `ADMIN_PASSWORD=My#Pass` silently becomes `My` and you'll be locked out. `npm run secret` generates passwords that avoid this.

---

## 🔧 Configuration (`.env.local`)

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_EMAIL` | ✅ | The only account that can reach `/admin` |
| `ADMIN_PASSWORD` | ✅ | Quote it. Defaults to `changeme123` + a loud red warning if unset |
| `APP_SECRET` | ✅ | Signs session cookies & download links → `npm run secret` |
| `RAZORPAY_KEY_ID` | ✅ | `rzp_test_…` or `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | ✅ | From Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | See below — protects against lost callbacks |
| `NEXT_PUBLIC_SITE_URL` | ✅ in production | Your real domain. Drives canonicals, sitemap and OG tags |
| `DATABASE_URL` | optional | Default `file:./data/studypalace.db`. Use `postgres://…` on serverless, `memory:` for a throwaway demo |
| `UPLOAD_DIR` | optional | Default `./uploads` |
| `MAX_UPLOAD_MB` | optional | Default `60` |
| `PUBLIC_ASSET_BASE_URL` | optional | S3/R2/Cloudinary base URL if you don't store files locally |
| `SUPPORT_EMAIL` | recommended | Shown in the footer, contact page and error messages |
| `SUPPORT_WHATSAPP` | optional | e.g. `919999999999` |
| `NEXT_PUBLIC_GA_ID` | optional | `G-XXXXXXXXXX` enables Google Analytics + purchase events |

**Razorpay webhook** (strongly recommended): Dashboard → Webhooks → add
`https://yourdomain.com/api/razorpay/webhook`, event `payment.captured` (+ `payment.failed`), and set the secret as `RAZORPAY_WEBHOOK_SECRET`. Without it, a student who closes the tab mid-payment can leave an order stuck on "unpaid" until you mark it manually from the admin panel.

---

## 💳 Testing payments

1. Use your **test** keys (`rzp_test_…`).
2. Razorpay test card: `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1111`.
   Or use the test UPI id `success@razorpay`.
3. After a successful test payment you land on the order page with working download buttons.
4. Swap in your **live** keys when you're happy. The admin **Settings** page warns you if you go live with test keys.

---

## 🌍 Deploying

### Option A — VPS / Railway / Render / Fly.io  ✅ **recommended**
This is the simplest option because it has a real disk for SQLite + your PDFs.

```bash
npm install
npm run build
NODE_ENV=production npm start        # or use pm2 / systemd
```

Environment variables go in `.env.local` (or your host's dashboard). Point your domain at the server and put it behind HTTPS (Caddy or nginx + certbot).

**Back up two folders:** `data/` (orders, products) and `uploads/` (the PDFs you sell).

### Option B — Vercel ⚠️ read this first
Vercel's serverless filesystem is **read-only** and has **no SQLite**. That means:
- ❌ you cannot upload PDFs from the admin panel
- ❌ products/orders would be lost on every cold start (the app falls back to an in-memory database and warns you loudly)

To run on Vercel you must supply both pieces externally — no code changes needed:
1. **Database:** add Neon/Supabase Postgres and set `DATABASE_URL=postgres://…` (the `pg` driver is already installed and the app switches automatically).
2. **Files:** store PDFs in S3 / Cloudflare R2 / Cloudinary, then either set `PUBLIC_ASSET_BASE_URL` and use relative paths, or paste each file's direct URL into the product form's *"link a file stored elsewhere"* field.

Then set every variable in **Vercel → Project → Settings → Environment Variables** and redeploy.

> For a one-person store selling PDFs, **Option A on a ₹300–500/month VPS is easier, cheaper and keeps your files in one place.**

---

## 📦 Adding a product (what to write for SEO)

1. **Title** — lead with the phrase a student types: `NIFT GAT Quantitative Ability — 240 Practice Questions (2027)`.
2. **Subtitle** — one line of specifics.
3. **Highlights** — one per line; becomes the ticked bullet list.
4. **Description** — 150+ words. This is indexed by Google. Mention the topics, the exam year, the format and who it's for.
5. **Tags** — comma separated; power the on-site search and related products.
6. **Advanced → SEO title / meta description** — what Google shows. 60 and 155 characters.
7. **MRP higher than price** — automatically shows a `% OFF` badge.
8. **Bundle** — tick "This is a bundle" and select the products inside; buying it unlocks every file in it.

If you don't upload a cover image, the store generates a branded gradient cover with the title on it — so nothing ever looks broken.

---

## ✅ Tests

```bash
npm run test:memory   # 71 checks on the SQL/data layer
npm run test:e2e      # 85 checks over HTTP against a running server
npm run test          # both
npm run typecheck     # strict TypeScript
```

The e2e suite covers: every public page, admin auth, session forgery, PDF upload, product → shop → category → sitemap propagation, order creation, **download refused while unpaid**, forged tokens, product-not-in-order, download after payment, byte-for-byte file integrity, My Downloads lookup, cross-user access denial, coupons, sales stats and deletion.

```bash
BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:e2e
```

---

## 🗂 Project structure

```
app/
  page.tsx                     home (SEO + conversion)
  shop/  c/[slug]/  p/[slug]/  storefront
  checkout/  order/[n]/  my-downloads/
  guides/ + 6 keyword pages    free SEO content
  refund-policy/ terms/ privacy/ contact/
  admin/(panel)/               dashboard, products, orders, coupons, media, settings
  admin/(public)/login/        the only unauthenticated admin route
  api/
    checkout                   creates the order + Razorpay order
    razorpay/verify            verifies the signature, unlocks downloads
    razorpay/webhook           backup confirmation
    download/[token]           the ONLY way a PDF leaves the server
    cover/[slug]               cover images (+ generated fallback)
    admin/{login,logout,products,orders,coupons,media,stats}
    coupon, subscribe, track-order
  sitemap.ts  robots.ts  manifest.ts  not-found.tsx  error.tsx
components/                    UI (client + server)
lib/
  config.ts                    every env var in one place
  db.ts  sql.ts  memory-engine.ts   storage: SQLite / Postgres / in-memory
  repo.ts                      all queries
  orders.ts                    expands bundles into downloadable files
  files.ts                     safe upload/resolve/stream (no path traversal)
  razorpay.ts  crypto.ts  edge-crypto.ts  auth.ts
  format.ts                    pure helpers (client-safe)
  seo.ts                       server-only JSON-LD builders
  content.ts                   the six SEO guides
scripts/                       assets, sample PDFs, secret generator, tests
middleware.ts                  the real /admin guard
```

---

## 🔒 Policies baked in

- **No returns, no refunds** — stated in the announcement bar, on every product page, as a required checkbox at checkout, on a dedicated `/refund-policy` page, in the footer, and as `MerchantReturnNotSupported` structured data so Google shows it in the listing.
- Narrow exceptions are documented (payment captured but not delivered, corrupt/wrong file within 24h, duplicate charge, legally compelled reversal).
- Single-student licence; sharing/resale revokes access.

---

## 🗺 After you launch

1. **Google Search Console** → submit `https://yourdomain.com/sitemap.xml`.
2. **Razorpay** → switch to live keys, add the webhook, complete KYC so settlements work.
3. Set `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy (canonicals depend on it).
4. Do one real ₹1 purchase end-to-end and download the file on your phone.
5. Back up `data/` and `uploads/` on a schedule.
6. Add `NEXT_PUBLIC_GA_ID` if you want purchase funnels in Analytics.
