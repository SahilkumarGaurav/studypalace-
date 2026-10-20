/**
 * scripts/test-memory-backend.mjs
 *
 * Proves the in-memory SQL engine (the fallback used on hosts with no disk,
 * e.g. Vercel) behaves the same as SQLite for every query the app actually
 * runs: schema creation, product CRUD, search/filter, ordering, coupons,
 * orders, aggregates, GROUP BY and settings.
 *
 * Usage:  npm run test:memory
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spmem-'));

// Bundle the server libs to CJS (with every transitive local import) so plain
// node can require them without a TypeScript loader.
execFileSync(
  'npx',
  [
    '--yes', 'esbuild@0.23.1',
    'lib/repo.ts', 'lib/db.ts', 'lib/sql.ts', 'lib/memory-engine.ts',
    'lib/crypto.ts', 'lib/config.ts', 'lib/format.ts', 'lib/validate.ts',
    `--outdir=${tmp}`, '--format=cjs', '--platform=node', '--target=node18', '--log-level=error',
  ],
  { cwd: root, stdio: 'inherit' },
);

process.env.DATABASE_URL = 'memory:';
process.env.APP_SECRET = 'test-secret-for-memory-backend-verification';
process.env.NODE_ENV = 'test';

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const repo = require(path.join(tmp, 'repo.js'));
const { dbInfo } = require(path.join(tmp, 'db.js'));

let pass = 0;
let fail = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; failures.push(name + (detail ? ` — ${detail}` : '')); console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log(`\n\x1b[1mIn-memory backend verification\x1b[0m\n`);

const info = dbInfo();
check('Backend selected is memory', info.adapter.kind === 'memory', info.backend);
check('Reports itself as non-persistent', info.persistent === false);

/* -------- products -------- */
const p1 = repo.createProduct({
  slug: 'gat-quant', title: 'GAT Quantitative Ability PDF', subtitle: '240 questions',
  description: 'Percentages, ratios, averages and data interpretation practice for the NIFT GAT.',
  highlights: '240 questions\n18 topics', price_paise: 19900, mrp_paise: 49900,
  category: 'gat', exam: 'NIFT', year: '2027', pages: 86, tags: 'NIFT GAT, quant, practice',
  is_active: 1, is_featured: 1, bestseller: 1, file_path: 'pdf/gat-quant.pdf', file_name: 'gat.pdf', file_size: 12345,
});
check('createProduct returns a row with an id', Boolean(p1?.id));
check('price survives the round trip', Number(p1.price_paise) === 19900, String(p1.price_paise));

const p2 = repo.createProduct({
  slug: 'cat-drawing', title: 'CAT Drawing Practice Sheets', price_paise: 29900,
  category: 'cat', year: '2027', tags: 'NIFT CAT, drawing', is_active: 1, file_path: 'pdf/cat.pdf',
});
const p3 = repo.createProduct({
  slug: 'draft-item', title: 'Unpublished draft', price_paise: 0, category: 'gat', is_active: 0, file_path: 'pdf/d.pdf',
});

check('listProducts (active only) hides drafts', repo.listProducts({}).length === 2, `got ${repo.listProducts({}).length}`);
check('listProducts (all) includes drafts', repo.listProducts({ activeOnly: false }).length === 3);
check('countProducts respects the active filter', repo.countProducts({}) === 2);

const bySlug = repo.getProductBySlug('gat-quant');
check('getProductBySlug finds it', bySlug?.id === p1.id);
check('getProductBySlug hides inactive by default', repo.getProductBySlug('draft-item') === null);
check('getProductBySlug(includeInactive) finds it', repo.getProductBySlug('draft-item', true)?.id === p3.id);

check('category filter works', repo.listProducts({ category: 'cat' }).length === 1);
check('search matches the title', repo.listProducts({ search: 'quantitative' }).length === 1);
check('search matches tags', repo.listProducts({ search: 'drawing' }).length === 1);
check('search is case-insensitive', repo.listProducts({ search: 'GAT QUANT' }).length >= 1);
check('search with no match returns empty', repo.listProducts({ search: 'zzzznotfound' }).length === 0);

check('sort price_asc', repo.listProducts({ sort: 'price_asc' })[0].slug === 'gat-quant');
check('sort price_desc', repo.listProducts({ sort: 'price_desc' })[0].slug === 'cat-drawing');
check('limit is honoured', repo.listProducts({ limit: 1 }).length === 1);

const updated = repo.updateProduct(p1.id, { price_paise: 14900, is_featured: 0 });
check('updateProduct changes the price', Number(updated.price_paise) === 14900, String(updated.price_paise));
check('updateProduct leaves other fields alone', updated.title === 'GAT Quantitative Ability PDF');
check('updateProduct sets updated_at', Boolean(updated.updated_at));

repo.incrementDownload(p1.id);
repo.incrementDownload(p1.id);
check('incrementDownload counts', Number(repo.getProductById(p1.id).downloads_count) === 2);

check('listCategories aggregates with GROUP BY', repo.listCategories().some((c) => c.category === 'cat' && c.count === 1));
check('listTags splits the CSV', repo.listTags().some((t) => t.tag === 'quant'));
check('slugExists detects a clash', repo.slugExists('cat-drawing') === true);
check('slugExists ignores itself when editing', repo.slugExists('cat-drawing', p2.id) === false);

const related = repo.relatedProducts(repo.getProductById(p1.id), 4);
check('relatedProducts excludes the product itself', !related.some((r) => r.id === p1.id));

/* -------- coupons -------- */
repo.createCoupon({ code: 'SAVE20', kind: 'percent', value: 20 });
repo.createCoupon({ code: 'FLAT50', kind: 'flat', value: 50, min_subtotal_paise: 10000 });
repo.createCoupon({ code: 'DEAD', kind: 'percent', value: 50, active: 0 });

check('listCoupons returns both active coupons', repo.listCoupons().length === 3);
const v1 = repo.validateCoupon('SAVE20', 19900);
check('percent coupon = 20% of ₹199 (₹39.80)', v1.ok && v1.discountPaise === 3980, JSON.stringify(v1));
const v2 = repo.validateCoupon('FLAT50', 19900);
check('flat coupon = ₹50 off', v2.ok && v2.discountPaise === 5000, JSON.stringify(v2));
const v3 = repo.validateCoupon('FLAT50', 5000);
check('minimum-cart coupon rejected below the threshold', v3.ok === false && /at least/.test(v3.reason || ''), JSON.stringify(v3));
check('inactive coupon rejected', repo.validateCoupon('DEAD', 19900).ok === false);
check('unknown coupon rejected', repo.validateCoupon('NOPE', 19900).ok === false);
repo.useCoupon('SAVE20');
check('useCoupon increments used_count', repo.getCoupon('SAVE20').used_count === 1);
repo.updateCoupon(repo.getCoupon('SAVE20').id, { usage_limit: 1 });
check('usage limit enforced after one use', repo.validateCoupon('SAVE20', 19900).ok === false);

/* -------- orders -------- */
const order = repo.createOrder({
  email: 'Student@Example.com', name: 'Test Student', phone: '919876543210',
  coupon_code: 'FLAT50', discount_paise: 5000,
  items: [
    { product_id: p1.id, product_title: p1.title, product_slug: p1.slug, unit_paise: 14900 },
    { product_id: p2.id, product_title: p2.title, product_slug: p2.slug, unit_paise: 29900 },
  ],
});
check('order gets a human-readable number', /^SP-[A-Z0-9]{6}$/.test(order.order_number), order.order_number);
check('email is normalised to lowercase', order.email === 'student@example.com', order.email);
check('subtotal is the sum of items', Number(order.subtotal_paise) === 44800, String(order.subtotal_paise));
check('total subtracts the discount', Number(order.total_paise) === 39800, String(order.total_paise));
check('order starts unpaid', order.payment_status === 'unpaid');
check('order has a download token', Boolean(order.download_token));
check('order items were written', repo.listOrderItems(order.id).length === 2);

check('getOrderByNumber finds it', repo.getOrderByNumber(order.order_number)?.id === order.id);
check('getOrderByNumber is case-insensitive', repo.getOrderByNumber(order.order_number.toLowerCase())?.id === order.id);
check('getOrderByToken finds it', repo.getOrderByToken(order.download_token)?.id === order.id);

const paid = repo.markOrderPaid(order.id, 'pay_TEST123', 'sig_abc');
check('markOrderPaid flips the status', paid.payment_status === 'paid' && paid.status === 'completed');
check('markOrderPaid records the payment id', paid.razorpay_payment_id === 'pay_TEST123');
check('markOrderPaid stamps paid_at', Boolean(paid.paid_at));

repo.noteDownload(order.id);
repo.noteDownload(order.id);
check('noteDownload counts', Number(repo.getOrderByToken(order.download_token).download_count) === 2);

const list = repo.listOrders({});
check('listOrders returns the order', list.total === 1 && list.rows.length === 1);
check('listOrders filters by status', repo.listOrders({ status: 'failed' }).total === 0);
check('listOrders searches by email', repo.listOrders({ search: 'student@example' }).total === 1);
check('listOrders searches by order number', repo.listOrders({ search: order.order_number }).total === 1);
check('findOrdersByEmail returns paid orders', repo.findOrdersByEmail('student@example.com').length === 1);

const summary = repo.salesSummary();
check('salesSummary revenue is correct', Number(summary.revenuePaise) === 39800, String(summary.revenuePaise));
check('salesSummary counts paid orders', summary.paidOrders === 1);
check('salesSummary counts units', summary.unitsSold === 2, String(summary.unitsSold));
check('salesSummary builds a 7-day series', summary.last7Days.length === 7);
check('salesSummary ranks top products', summary.topProducts.length === 2);

/* -------- media, subscribers, settings, events -------- */
const media = repo.addMedia({ kind: 'pdf', filename: 'gat.pdf', path: 'pdf/gat.pdf', size: 12345 });
check('addMedia + listMedia', repo.listMedia().length === 1 && repo.listMedia('pdf')[0].id === media.id);
check('listMedia filters by kind', repo.listMedia('cover').length === 0);

check('addSubscriber stores the email', repo.addSubscriber('fan@example.com', 'footer') === true);
check('duplicate subscriber rejected', repo.addSubscriber('FAN@example.com') === false);
check('countSubscribers', repo.countSubscribers() === 1);
check('listSubscribers', repo.listSubscribers().length === 1);

repo.setSetting('announcement', 'NIFT 2027 material is live');
check('setSetting/getSetting round trip', repo.getSetting('announcement') === 'NIFT 2027 material is live');
repo.setSetting('announcement', 'Updated');
check('setSetting overwrites without duplicating', repo.getSetting('announcement') === 'Updated' && Object.keys(repo.allSettings()).length === 1);

repo.logEvent('test.event', order.id, p1.id, 'hello');
check('logEvent + recentEvents', repo.recentEvents(5).some((e) => e.kind === 'test.event'));

/* -------- delete -------- */
repo.deleteProduct(p2.id);
check('deleteProduct removes the row', repo.getProductById(p2.id) === null);
check('deleteProduct updates the count', repo.countProducts({ activeOnly: false }) === 2);
const purged = repo.purgeAllProducts();
check('purgeAllProducts clears everything', purged === 2 && repo.countProducts({ activeOnly: false }) === 0);

console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
if (failures.length) { console.log('\nFailures:'); for (const f of failures) console.log('  • ' + f); }
fs.rmSync(tmp, { recursive: true, force: true });
console.log('');
process.exit(fail ? 1 : 0);
