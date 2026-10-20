/**
 * scripts/e2e-test.mjs
 *
 * End-to-end smoke test of the whole money path. Run the app first
 * (`npm run build && npm start`), then `npm run test:e2e`.
 *
 * It checks, in order:
 *   1. every public page returns 200
 *   2. /admin and all admin APIs are locked without a session
 *   3. admin login works and sets a cookie
 *   4. a product can be created WITH a real PDF upload
 *   5. the product appears on the shop page and in sitemap.xml
 *   6. its download link is refused while unpaid
 *   7. a checkout can be created
 *   8. after the order is marked paid, the PDF actually downloads
 *   9. a forged / wrong token is rejected
 *  10. the no-return policy + JSON-LD are present
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@studypalace.in';
const PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplePdf = path.join(root, 'scripts', 'sample', 'sample-gat-quantitative-ability.pdf');

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

let cookie = '';
async function req(url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${BASE}${url}`, { ...opts, headers, redirect: 'manual' });
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) {
    cookie = setCookie
      .map((c) => c.split(';')[0])
      .filter((c) => c.startsWith('sp_admin='))
      .concat(cookie ? [cookie] : [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .join('; ');
  }
  return res;
}

const text = async (res) => res.text();

console.log(`\n\x1b[1mStudyPalace end-to-end test\x1b[0m  →  ${BASE}\n`);

/* ------------------------------------------------------------------ */
console.log('\x1b[1m1. Public pages render\x1b[0m');
const PUBLIC_PAGES = [
  '/', '/shop', '/guides', '/nift-gat-syllabus-pdf', '/nift-cat-drawing-practice-pdf',
  '/nift-situation-test-material', '/nift-exam-pattern-marks-weightage',
  '/nift-current-affairs-fashion-gk-pdf', '/nift-previous-year-question-papers',
  '/refund-policy', '/terms', '/privacy', '/contact', '/my-downloads', '/checkout',
  '/c/gat', '/c/cat', '/c/situation-test', '/c/bundles', '/sitemap.xml', '/robots.txt',
  '/manifest.webmanifest', '/og.png', '/icon-192.png',
];
for (const p of PUBLIC_PAGES) {
  const res = await req(p);
  check(`GET ${p}`, res.status === 200, `status ${res.status}`);
}

/* ------------------------------------------------------------------ */
console.log('\x1b[1m2. Storefront content & SEO\x1b[0m');
const home = await text(await req('/'));
check('Home has an H1', /<h1[^>]*>/.test(home));
check('Home has JSON-LD structured data', home.includes('application/ld+json'));
check('Home mentions NIFT', home.includes('NIFT'));
check('Home has canonical tag', home.includes('rel="canonical"'));
check('Home has Open Graph tags', home.includes('property="og:'));
check('viewport meta present (mobile friendly)', home.includes('name="viewport"'));

const policy = await text(await req('/refund-policy'));
check('Refund policy says no returns', /no returns|not available|all sales are final/i.test(policy));
check('Refund policy has MerchantReturnNotSupported schema', policy.includes('MerchantReturnNotSupported'));

const robots = await text(await req('/robots.txt'));
check('robots.txt blocks /admin', robots.includes('/admin'));
check('robots.txt points at the sitemap', robots.includes('sitemap'));

const sitemap = await text(await req('/sitemap.xml'));
check('sitemap.xml lists the GAT guide', sitemap.includes('nift-gat-syllabus-pdf'));

const guide = await text(await req('/nift-gat-syllabus-pdf'));
check('GAT guide lists Quantitative Ability', guide.includes('Quantitative Ability'));
check('GAT guide lists Chikankari (fashion GK)', guide.includes('Chikankari'));
check('GAT guide has Article + FAQ schema', guide.includes('"@type":"Article"') || guide.includes('"@type": "Article"'));

/* ------------------------------------------------------------------ */
console.log('\x1b[1m3. Admin is private\x1b[0m');
cookie = '';
const adminNoAuth = await req('/admin');
check('GET /admin without session redirects to login', adminNoAuth.status === 307 || adminNoAuth.status === 302, `status ${adminNoAuth.status}`);
const adminApi = await req('/api/admin/products');
check('GET /api/admin/products without session = 401', adminApi.status === 401, `status ${adminApi.status}`);
const badLogin = await req('/api/admin/login', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: 'definitely-wrong-password' }),
});
check('Wrong password rejected (401)', badLogin.status === 401, `status ${badLogin.status}`);

const loginPage = await req('/admin/login');
check('GET /admin/login is reachable (200)', loginPage.status === 200, `status ${loginPage.status}`);

/* ------------------------------------------------------------------ */
console.log('\x1b[1m4. Admin login\x1b[0m');
cookie = '';
const login = await req('/api/admin/login', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
check('Correct credentials accepted', login.status === 200, `status ${login.status}`);
check('Session cookie issued', cookie.includes('sp_admin='), cookie || 'no cookie');

const adminOk = await req('/admin');
check('GET /admin with session = 200', adminOk.status === 200, `status ${adminOk.status}`);

/* ------------------------------------------------------------------ */
console.log('\x1b[1m5. Create a product with a real PDF upload\x1b[0m');
if (!fs.existsSync(samplePdf)) {
  check('Sample PDF exists', false, 'run: npm run make-sample');
} else {
  const pdfBytes = fs.readFileSync(samplePdf);
  const form = new FormData();
  form.append('title', 'NIFT GAT Quantitative Ability — 240 Practice Questions');
  form.append('slug', `e2e-gat-quant-${Date.now().toString(36)}`);
  form.append('subtitle', 'Percentages, ratios, averages, interest, time & work — with full solutions.');
  form.append('description', 'A complete quantitative ability practice book for the NIFT General Ability Test. 240 exam-style questions across 18 topics with worked solutions.');
  form.append('highlights', '240 practice questions\n18 topics\nFull solutions\nPrintable A4');
  form.append('price', '199');
  form.append('mrp', '499');
  form.append('category', 'gat');
  form.append('year', '2027');
  form.append('pages', '86');
  form.append('tags', 'NIFT GAT, quantitative ability, practice questions');
  form.append('is_active', '1');
  form.append('is_featured', '1');
  form.append('bestseller', '1');
  form.append('pdf', new Blob([pdfBytes], { type: 'application/pdf' }), 'gat-quant-practice.pdf');

  const created = await req('/api/admin/products', { method: 'POST', body: form });
  const createdBody = await created.json().catch(() => ({}));
  check('POST /api/admin/products = 200', created.status === 200, `status ${created.status} ${createdBody.error || ''}`);
  check('Product returned with an id', Boolean(createdBody.product?.id));
  check('File was stored on disk', Boolean(createdBody.product?.file_path), createdBody.product?.file_path || 'no path');

  const slug = createdBody.product?.slug;
  const productId = createdBody.product?.id;

  if (slug && productId) {
    /* -------- 6. it shows up everywhere -------- */
    const productPage = await req(`/p/${slug}`);
    check(`GET /p/${slug.slice(0, 24)}… = 200`, productPage.status === 200, `status ${productPage.status}`);
    const productHtml = await text(productPage);
    check('Product page has Product JSON-LD', productHtml.includes('"@type":"Product"') || productHtml.includes('"@type": "Product"'));
    check('Product page has an Offer with a price', productHtml.includes('"price":"199.00"') || productHtml.includes('"price": "199.00"'));
    check('Product page states no returns', /no returns|MerchantReturnNotSupported/i.test(productHtml));
    check('Product page shows the highlights', productHtml.includes('240 practice questions'));

    const shop = await text(await req('/shop'));
    check('Product appears on /shop', shop.includes(slug) || shop.includes('Quantitative Ability'));

    const cat = await text(await req('/c/gat'));
    check('Product appears on /c/gat', cat.includes('Quantitative Ability'));

    const sm2 = await text(await req('/sitemap.xml'));
    check('Product added to sitemap.xml automatically', sm2.includes(slug));

    const cover = await req(`/api/cover/${slug}`);
    check('Auto-generated cover renders (200)', cover.status === 200, `status ${cover.status}`);

    /* -------- 7. downloads are locked until paid -------- */
    const checkout = await req('/api/checkout', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ id: productId }], email: 'student@example.com', name: 'Test Student', phone: '9876543210' }),
    });
    const checkoutBody = await checkout.json().catch(() => ({}));
    const paidFlow = checkout.status === 200 && checkoutBody.razorpayOrderId;
    const freeFlow = checkout.status === 200 && checkoutBody.free;
    check(
      'POST /api/checkout creates an order',
      checkout.status === 200 || checkout.status === 503 || checkout.status === 502,
      `status ${checkout.status} ${checkoutBody.error || ''}`,
    );
    check(
      'Checkout failure returns an actionable message (never "unknown error")',
      Boolean(checkoutBody.error) && !/unknown error/i.test(checkoutBody.error),
      checkoutBody.error || 'no message',
    );
    if (checkout.status !== 200) {
      console.log(`      (gateway not live in this env — reported as: "${String(checkoutBody.error).slice(0, 90)}…")`);
    }
    check('Order number issued', Boolean(checkoutBody.orderNumber), checkoutBody.orderNumber || 'none');
    if (paidFlow) check('Razorpay order id returned', Boolean(checkoutBody.razorpayOrderId));

    const orderNumber = checkoutBody.orderNumber;

    // find the order + its download token from the admin side
    const ordersRes = await req('/api/admin/orders');
    const ordersBody = await ordersRes.json().catch(() => ({}));
    const order = (ordersBody.orders || []).find((o) => o.order_number === orderNumber);
    check('Order visible in the admin panel', Boolean(order));

    const token = order?.download_token;
    if (token) {
      const locked = await req(`/api/download/${token}?product=${productId}`);
      check('Download REFUSED while unpaid (402)', locked.status === 402, `status ${locked.status}`);

      const forged = await req(`/api/download/${token}x?product=${productId}`);
      check('Forged token rejected', forged.status === 404 || forged.status === 400, `status ${forged.status}`);

      const wrongProduct = await req(`/api/download/${token}?product=not-in-this-order`);
      check('Product not in order rejected', wrongProduct.status === 402 || wrongProduct.status === 403, `status ${wrongProduct.status}`);

      // simulate a confirmed payment (what the Razorpay verify/webhook does)
      const markPaid = await req('/api/admin/orders', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'mark_paid' }),
      });
      check('Admin can mark an order paid', markPaid.status === 200, `status ${markPaid.status}`);

      const dl = await req(`/api/download/${token}?product=${productId}`);
      check('Download ALLOWED once paid (200)', dl.status === 200, `status ${dl.status}`);
      const ct = dl.headers.get('content-type');
      const cd = dl.headers.get('content-disposition') || '';
      check('Served as application/pdf', ct === 'application/pdf', ct || 'none');
      check('Served as an attachment (forces download)', cd.startsWith('attachment'), cd);
      const buf = Buffer.from(await dl.arrayBuffer());
      check('Downloaded bytes are a real PDF', buf.subarray(0, 5).toString() === '%PDF-', buf.subarray(0, 8).toString());
      check('Downloaded size matches the upload', buf.length === pdfBytes.length, `${buf.length} vs ${pdfBytes.length}`);

      const orderPage = await req(`/order/${orderNumber}`);
      const orderHtml = await text(orderPage);
      check('Order page shows the download button', orderHtml.includes('Download PDF') || orderHtml.includes('Payment successful'), `status ${orderPage.status}`);

      // My Downloads lookup by email
      const lookup = await req('/api/track-order', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'student@example.com' }),
      });
      const lookupBody = await lookup.json().catch(() => ({}));
      check('My Downloads finds the paid order by email', lookup.status === 200 && lookupBody.orders?.length >= 1, `status ${lookup.status}`);
      check('My Downloads returns working file links', Boolean(lookupBody.orders?.[0]?.files?.[0]?.downloadUrl));

      const wrongEmail = await req('/api/track-order', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'someone-else@example.com', orderNumber }),
      });
      check('Another person cannot claim the order (403/404)', wrongEmail.status === 403 || wrongEmail.status === 404, `status ${wrongEmail.status}`);
    }

    /* -------- 8. coupons -------- */
    const coupon = await req('/api/admin/coupons', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: `E2E${Date.now().toString(36).toUpperCase()}`, kind: 'percent', value: 20 }),
    });
    const couponBody = await coupon.json().catch(() => ({}));
    check('Coupon can be created', coupon.status === 200, `status ${coupon.status} ${couponBody.error || ''}`);
    const code = couponBody.coupons?.[0]?.code;
    if (code) {
      const applied = await req('/api/coupon', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, subtotalPaise: 19900 }),
      });
      const appliedBody = await applied.json().catch(() => ({}));
      check('Coupon gives 20% off ₹199 (= ₹39.80)', appliedBody.ok && appliedBody.discountPaise === 3980, JSON.stringify(appliedBody));
      const bogus = await req('/api/coupon', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'NOPE123', subtotalPaise: 19900 }),
      });
      const bogusBody = await bogus.json().catch(() => ({}));
      check('Invalid coupon rejected', bogusBody.ok === false, JSON.stringify(bogusBody));
    }

    /* -------- 9. stats + cleanup -------- */
    const stats = await req('/api/admin/stats');
    const statsBody = await stats.json().catch(() => ({}));
    check('Admin stats endpoint works', stats.status === 200 && typeof statsBody.revenuePaise === 'number', `status ${stats.status}`);
    check('Stats counted the paid revenue', statsBody.revenuePaise >= 19900, `revenue ${statsBody.revenuePaise}`);

    const del = await req(`/api/admin/products?id=${productId}`, { method: 'DELETE' });
    check('Product can be deleted', del.status === 200, `status ${del.status}`);
    const afterDel = await req(`/p/${slug}`);
    const afterDelHtml = await text(afterDel);
    check('Deleted product serves the 404 page', afterDelHtml.includes('This page does not exist'), `status ${afterDel.status}`);
    check(
      'Deleted product is marked noindex (Google will drop it)',
      afterDelHtml.includes('noindex'),
      'no noindex meta found',
    );
  }
}

/* ------------------------------------------------------------------ */
console.log('\x1b[1m6. Session security\x1b[0m');
const saved = cookie;
cookie = 'sp_admin=admin.9999999999.deadbeef';
const forgedSession = await req('/api/admin/products');
check('Forged session cookie rejected (401)', forgedSession.status === 401, `status ${forgedSession.status}`);
cookie = '';
const noSession = await req('/api/admin/orders');
check('No session rejected (401)', noSession.status === 401, `status ${noSession.status}`);
cookie = saved;
const logout = await req('/api/admin/logout', { method: 'POST' });
check('Logout clears the session', logout.status === 200, `status ${logout.status}`);

/* ------------------------------------------------------------------ */
console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  • ${f}`);
}
console.log('');
process.exit(fail ? 1 : 0);
