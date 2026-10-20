/**
 * repo.ts — every database read/write in the app goes through this file.
 * Keeping it in one place means switching storage backends never touches the UI.
 */
import { db } from './db';
import { orderNumber, token, uuid } from './crypto';
import { formatDate, formatDateTime, inr, timeAgo } from './format';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  highlights?: string | null;
  price_paise: number;
  mrp_paise?: number | null;
  category?: string | null;
  exam?: string | null;
  course?: string | null;
  year?: string | null;
  pages?: number | null;
  language?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  file_url?: string | null;
  preview_file?: string | null;
  cover_path?: string | null;
  cover_url?: string | null;
  tags?: string | null;
  is_active: number;
  is_featured: number;
  is_bundle: number;
  bundle_ids?: string | null;
  bestseller: number;
  new_arrival: number;
  rating: number;
  rating_count: number;
  downloads_count: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title?: string | null;
  product_slug?: string | null;
  unit_paise: number;
  total_paise: number;
  created_at?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  status: string;
  payment_status: string;
  subtotal_paise: number;
  discount_paise: number;
  total_paise: number;
  currency: string;
  coupon_code?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  download_token?: string | null;
  notes?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
  paid_at?: string | null;
  last_download_at?: string | null;
  download_count: number;
}

export interface Coupon {
  id: string;
  code: string;
  kind: 'percent' | 'flat';
  value: number;
  max_off_paise?: number | null;
  min_subtotal_paise: number;
  usage_limit?: number | null;
  used_count: number;
  active: number;
  expires_at?: string | null;
  created_at: string;
}

export interface MediaItem {
  id: string;
  kind: string;
  filename: string;
  path?: string | null;
  url?: string | null;
  size: number;
  created_at: string;
}

export interface SettingsRow {
  key: string;
  value?: string | null;
  updated_at?: string | null;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export const nowIso = () => new Date().toISOString();

// Money + date formatting live in lib/format.ts so that client components can
// use them without dragging the database into the browser bundle. Re-exported
// here for convenience of server-side callers.
export { formatDate, formatDateTime, inr, inr as money, timeAgo };

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Normalise a raw row (SQLite returns ints, Postgres may return strings). */
function mapProduct(r: Record<string, unknown> | null): Product | null {
  if (!r) return null;
  return {
    ...(r as unknown as Product),
    price_paise: num(r.price_paise),
    mrp_paise: r.mrp_paise === null || r.mrp_paise === undefined ? null : num(r.mrp_paise),
    pages: r.pages === null || r.pages === undefined ? null : num(r.pages),
    file_size: num(r.file_size),
    is_active: num(r.is_active, 1),
    is_featured: num(r.is_featured),
    is_bundle: num(r.is_bundle),
    bestseller: num(r.bestseller),
    new_arrival: num(r.new_arrival),
    rating: num(r.rating, 4.8),
    rating_count: num(r.rating_count),
    downloads_count: num(r.downloads_count),
    sort_order: num(r.sort_order),
  };
}

function mapOrder(r: Record<string, unknown> | null): Order | null {
  if (!r) return null;
  return {
    ...(r as unknown as Order),
    subtotal_paise: num(r.subtotal_paise),
    discount_paise: num(r.discount_paise),
    total_paise: num(r.total_paise),
    download_count: num(r.download_count),
  };
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export const PRODUCT_COLUMNS = `id, slug, title, subtitle, description, highlights, price_paise, mrp_paise,
  category, exam, course, year, pages, language, file_name, file_path, file_size, file_url, preview_file,
  cover_path, cover_url, tags, is_active, is_featured, is_bundle, bundle_ids, bestseller, new_arrival,
  rating, rating_count, downloads_count, seo_title, seo_description, seo_keywords, sort_order, created_at, updated_at`;

export interface ProductQuery {
  activeOnly?: boolean;
  category?: string;
  exam?: string;
  search?: string;
  tag?: string;
  featured?: boolean;
  bestseller?: boolean;
  ids?: string[];
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'manual' | 'title';
}

export function listProducts(q: ProductQuery = {}): Product[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (q.activeOnly !== false) where.push('is_active = ?'), params.push(1);
  if (q.category) where.push('LOWER(category) = LOWER(?)'), params.push(q.category);
  if (q.exam) where.push('LOWER(exam) = LOWER(?)'), params.push(q.exam);
  if (q.featured) where.push('is_featured = ?'), params.push(1);
  if (q.bestseller) where.push('bestseller = ?'), params.push(1);
  if (q.tag) where.push("(',' || LOWER(tags) || ',') LIKE ?"), params.push(`%,${q.tag.toLowerCase()},%`);
  if (q.ids?.length) {
    where.push(`id IN (${q.ids.map(() => '?').join(',')})`);
    params.push(...q.ids);
  }
  if (q.search) {
    where.push('(LOWER(title) LIKE ? OR LOWER(COALESCE(subtitle,"")) LIKE ? OR LOWER(COALESCE(description,"")) LIKE ? OR LOWER(COALESCE(tags,"")) LIKE ? OR LOWER(COALESCE(category,"")) LIKE ?)');
    const like = `%${q.search.toLowerCase()}%`;
    params.push(like, like, like, like, like);
  }

  const order =
    q.sort === 'price_asc'
      ? 'price_paise ASC'
      : q.sort === 'price_desc'
        ? 'price_paise DESC'
        : q.sort === 'popular'
          ? 'downloads_count DESC, rating_count DESC'
          : q.sort === 'title'
            ? 'title ASC'
            : q.sort === 'manual'
              ? 'sort_order ASC, created_at DESC'
              : 'created_at DESC';

  let sql = `SELECT ${PRODUCT_COLUMNS} FROM products`;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` ORDER BY ${order}`;
  if (q.limit) {
    sql += ' LIMIT ?';
    params.push(q.limit);
    if (q.offset) {
      sql += ' OFFSET ?';
      params.push(q.offset);
    }
  }
  return db().all(sql, params).map((r) => mapProduct(r)!).filter(Boolean);
}

export function countProducts(q: ProductQuery = {}): number {
  const where: string[] = [];
  const params: unknown[] = [];
  if (q.activeOnly !== false) where.push('is_active = ?'), params.push(1);
  if (q.category) where.push('LOWER(category) = LOWER(?)'), params.push(q.category);
  if (q.search) {
    where.push('(LOWER(title) LIKE ? OR LOWER(COALESCE(subtitle,"")) LIKE ? OR LOWER(COALESCE(tags,"")) LIKE ?)');
    const like = `%${q.search.toLowerCase()}%`;
    params.push(like, like, like);
  }
  let sql = 'SELECT COUNT(*) AS n FROM products';
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  return num(db().scalar<number>(sql, params), 0);
}

export function getProductBySlug(slug: string, includeInactive = false): Product | null {
  const sql = includeInactive
    ? `SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = ? LIMIT 1`
    : `SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = ? AND is_active = 1 LIMIT 1`;
  return mapProduct(db().get(sql, [slug]));
}

export function getProductById(id: string): Product | null {
  return mapProduct(db().get(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ? LIMIT 1`, [id]));
}

export function slugExists(slug: string, ignoreId?: string): boolean {
  const row = ignoreId
    ? db().get('SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1', [slug, ignoreId])
    : db().get('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug]);
  return !!row;
}

export function listCategories(): { category: string; count: number }[] {
  const rows = db().all<{ category: string | null; n: number }>(
    `SELECT category, COUNT(*) AS n FROM products WHERE is_active = 1 AND category IS NOT NULL AND category != '' GROUP BY category ORDER BY n DESC`,
  );
  return rows
    .filter((r) => r.category)
    .map((r) => ({ category: String(r.category), count: num(r.n) }));
}

export function listTags(): { tag: string; count: number }[] {
  const products = listProducts({ activeOnly: true });
  const map = new Map<string, number>();
  for (const p of products) {
    for (const t of p.tags ? p.tags.split(',').map((s) => s.trim()).filter(Boolean) : []) {
      map.set(t, (map.get(t) || 0) + 1);
    }
  }
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

const PRODUCT_FIELDS = [
  'slug', 'title', 'subtitle', 'description', 'highlights', 'price_paise', 'mrp_paise', 'category', 'exam',
  'course', 'year', 'pages', 'language', 'file_name', 'file_path', 'file_size', 'file_url', 'preview_file',
  'cover_path', 'cover_url', 'tags', 'is_active', 'is_featured', 'is_bundle', 'bundle_ids', 'bestseller',
  'new_arrival', 'rating', 'rating_count', 'downloads_count', 'seo_title', 'seo_description', 'seo_keywords',
  'sort_order',
] as const;

export type ProductInput = Partial<Record<(typeof PRODUCT_FIELDS)[number], unknown>>;

export function createProduct(input: ProductInput): Product {
  const id = uuid();
  const ts = nowIso();
  const fields: string[] = ['id', 'created_at', 'updated_at'];
  const values: unknown[] = [id, ts, ts];
  for (const f of PRODUCT_FIELDS) {
    if (input[f] === undefined) continue;
    fields.push(f);
    values.push(input[f] === null ? null : input[f]);
  }
  db().run(
    `INSERT INTO products (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
    values,
  );
  return getProductById(id)!;
}

export function updateProduct(id: string, input: ProductInput): Product | null {
  const sets: string[] = ['updated_at = ?'];
  const values: unknown[] = [nowIso()];
  for (const f of PRODUCT_FIELDS) {
    if (input[f] === undefined) continue;
    sets.push(`${f} = ?`);
    values.push(input[f]);
  }
  values.push(id);
  db().run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, values);
  return getProductById(id);
}

export function deleteProduct(id: string): void {
  db().run('DELETE FROM products WHERE id = ?', [id]);
}

export function incrementDownload(productId: string): void {
  db().run('UPDATE products SET downloads_count = downloads_count + 1 WHERE id = ?', [productId]);
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const all = listProducts({ activeOnly: true, limit: 40 });
  const scored = all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.category && p.category === product.category) score += 3;
      if (p.course && p.course === product.course) score += 2;
      if (p.year && p.year === product.year) score += 1;
      const mine = new Set((product.tags || '').split(',').map((s) => s.trim().toLowerCase()));
      for (const t of (p.tags || '').split(',').map((s) => s.trim().toLowerCase())) if (mine.has(t)) score += 1;
      score += p.downloads_count / 100;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((s) => s.p);
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

const ORDER_COLUMNS = `id, order_number, email, name, phone, status, payment_status, subtotal_paise, discount_paise,
  total_paise, currency, coupon_code, razorpay_order_id, razorpay_payment_id, razorpay_signature, download_token,
  notes, ip, user_agent, created_at, paid_at, last_download_at, download_count`;

export interface CreateOrderInput {
  email: string;
  name?: string;
  phone?: string;
  items: { product_id: string; product_title: string; product_slug: string; unit_paise: number }[];
  coupon_code?: string | null;
  discount_paise?: number;
  ip?: string;
  user_agent?: string;
  notes?: string;
}

export function createOrder(input: CreateOrderInput): Order {
  const id = uuid();
  const ts = nowIso();
  const subtotal = input.items.reduce((sum, i) => sum + num(i.unit_paise), 0);
  const discount = Math.min(num(input.discount_paise), subtotal);
  const total = Math.max(0, subtotal - discount);
  const number = orderNumber();
  const downloadToken = token(18);

  db().run(
    `INSERT INTO orders (id, order_number, email, name, phone, status, payment_status, subtotal_paise,
      discount_paise, total_paise, currency, coupon_code, download_token, notes, ip, user_agent, created_at, download_count)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, number, input.email.trim().toLowerCase(), input.name || null, input.phone || null,
      'created', 'unpaid', subtotal, discount, total, 'INR', input.coupon_code || null,
      downloadToken, input.notes || null, input.ip || null, input.user_agent || null, ts, 0,
    ],
  );

  for (const item of input.items) {
    db().run(
      `INSERT INTO order_items (id, order_id, product_id, product_title, product_slug, unit_paise, total_paise, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [uuid(), id, item.product_id, item.product_title, item.product_slug, num(item.unit_paise), num(item.unit_paise), ts],
    );
  }

  const order = getOrderById(id)!;
  order.email = input.email.trim().toLowerCase();
  return order;
}

export function getOrderById(id: string): Order | null {
  return mapOrder(db().get(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ? LIMIT 1`, [id]));
}

export function getOrderByNumber(orderNumberValue: string): Order | null {
  return mapOrder(db().get(`SELECT ${ORDER_COLUMNS} FROM orders WHERE UPPER(order_number) = UPPER(?) LIMIT 1`, [orderNumberValue]));
}

export function getOrderByRazorpayOrderId(rzpOrderId: string): Order | null {
  return mapOrder(db().get(`SELECT ${ORDER_COLUMNS} FROM orders WHERE razorpay_order_id = ? LIMIT 1`, [rzpOrderId]));
}

export function getOrderByToken(downloadToken: string): Order | null {
  return mapOrder(db().get(`SELECT ${ORDER_COLUMNS} FROM orders WHERE download_token = ? LIMIT 1`, [downloadToken]));
}

export function listOrderItems(orderId: string): OrderItem[] {
  return db()
    .all('SELECT id, order_id, product_id, product_title, product_slug, unit_paise, total_paise, created_at FROM order_items WHERE order_id = ?', [orderId])
    .map((r) => ({ ...r, unit_paise: num(r.unit_paise), total_paise: num(r.total_paise) }) as OrderItem);
}

export function setRazorpayOrderId(orderId: string, rzpOrderId: string): void {
  db().run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrderId, orderId]);
}

export function markOrderPaid(orderId: string, paymentId?: string, signature?: string): Order | null {
  const existing = getOrderById(orderId);
  if (!existing) return null;
  if (existing.payment_status !== 'paid') {
    db().run(
      'UPDATE orders SET status = ?, payment_status = ?, razorpay_payment_id = COALESCE(?, razorpay_payment_id), razorpay_signature = COALESCE(?, razorpay_signature), paid_at = ? WHERE id = ?',
      ['completed', 'paid', paymentId || null, signature || null, nowIso(), orderId],
    );
    logEvent('payment.captured', orderId, undefined, `paid ${existing.total_paise} paise`);
  }
  return getOrderById(orderId);
}

export function markOrderFailed(orderId: string, message?: string): void {
  db().run("UPDATE orders SET status = ?, payment_status = ? WHERE id = ? AND payment_status != 'paid'", [
    'failed',
    'failed',
    orderId,
  ]);
  if (message) logEvent('payment.failed', orderId, undefined, message);
}

export function updateOrder(id: string, patch: Partial<Record<string, unknown>>): void {
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = ?`);
  db().run(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, [...keys.map((k) => patch[k]), id]);
}

export function noteDownload(orderId: string): void {
  db().run('UPDATE orders SET download_count = download_count + 1, last_download_at = ? WHERE id = ?', [nowIso(), orderId]);
}

export interface OrderListQuery {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function listOrders(q: OrderListQuery = {}): { rows: Order[]; total: number } {
  const where: string[] = [];
  const params: unknown[] = [];
  if (q.status && q.status !== 'all') where.push('status = ?'), params.push(q.status);
  if (q.search) {
    where.push('(LOWER(email) LIKE ? OR LOWER(COALESCE(name,"")) LIKE ? OR UPPER(COALESCE(order_number,"")) LIKE ? OR COALESCE(razorpay_payment_id,"") LIKE ?)');
    const like = `%${q.search.toLowerCase()}%`;
    params.push(like, like, q.search.toUpperCase(), like);
  }
  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const total = num(db().scalar<number>(`SELECT COUNT(*) AS n FROM orders${whereSql}`, params), 0);
  const listParams = [...params];
  let sql = `SELECT ${ORDER_COLUMNS} FROM orders${whereSql} ORDER BY created_at DESC`;
  if (q.limit) {
    sql += ' LIMIT ?';
    listParams.push(q.limit);
    if (q.offset) {
      sql += ' OFFSET ?';
      listParams.push(q.offset);
    }
  }
  return { rows: db().all(sql, listParams).map((r) => mapOrder(r)!).filter(Boolean), total };
}

export function findOrdersByEmail(email: string): Order[] {
  return db()
    .all(`SELECT ${ORDER_COLUMNS} FROM orders WHERE LOWER(email) = LOWER(?) AND payment_status = 'paid' ORDER BY created_at DESC`, [email])
    .map((r) => mapOrder(r)!)
    .filter(Boolean);
}

export function salesSummary(): {
  revenuePaise: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  unitsSold: number;
  last7Days: { date: string; revenue: number; orders: number }[];
  topProducts: { product_title: string; units: number; revenue: number }[];
} {
  const paid = db().get<{ revenue: number; orders: number }>(
    "SELECT COALESCE(SUM(total_paise),0) AS revenue, COUNT(*) AS orders FROM orders WHERE payment_status = 'paid'",
  );
  const pending = num(db().scalar<number>("SELECT COUNT(*) AS n FROM orders WHERE payment_status = 'unpaid'"), 0);
  const failed = num(db().scalar<number>("SELECT COUNT(*) AS n FROM orders WHERE payment_status = 'failed'"), 0);

  // Units sold — counted without a JOIN so every backend behaves identically.
  const paidOrderIds = db()
    .all<{ id: string }>("SELECT id FROM orders WHERE payment_status = 'paid'")
    .map((r) => r.id);
  let unitsSold = 0;
  for (const oid of paidOrderIds) unitsSold += listOrderItems(oid).length;

  const last7: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7.push({ date: key, revenue: 0, orders: 0 });
  }
  const index = new Map(last7.map((r) => [r.date, r]));
  const paidOrders = db()
    .all<{ id: string; total_paise: number; created_at: string }>("SELECT id, total_paise, created_at FROM orders WHERE payment_status = 'paid'")
    .map((r) => ({ ...r, total_paise: num(r.total_paise) }));
  for (const o of paidOrders) {
    const key = String(o.created_at || '').slice(0, 10);
    const bucket = index.get(key);
    if (bucket) {
      bucket.revenue += o.total_paise;
      bucket.orders += 1;
    }
  }

  const productStats = new Map<string, { product_title: string; units: number; revenue: number }>();
  for (const o of paidOrders) {
    for (const item of listOrderItems(o.id)) {
      const key = item.product_id;
      const entry = productStats.get(key) || {
        product_title: item.product_title || '(deleted product)',
        units: 0,
        revenue: 0,
      };
      entry.units += 1;
      entry.revenue += item.total_paise;
      productStats.set(key, entry);
    }
  }

  return {
    revenuePaise: num(paid?.revenue),
    paidOrders: num(paid?.orders),
    pendingOrders: pending,
    failedOrders: failed,
    unitsSold,
    last7Days: last7,
    topProducts: [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
  };
}

export function recentOrders(limit = 8): Order[] {
  return listOrders({ limit }).rows;
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

export function listCoupons(): Coupon[] {
  return db()
    .all('SELECT id, code, kind, value, max_off_paise, min_subtotal_paise, usage_limit, used_count, active, expires_at, created_at FROM coupons ORDER BY created_at DESC')
    .map((r) => ({
      ...(r as unknown as Coupon),
      value: num(r.value),
      min_subtotal_paise: num(r.min_subtotal_paise),
      used_count: num(r.used_count),
      active: num(r.active, 1),
    }));
}

export function getCoupon(code: string): Coupon | null {
  const row = db().get(
    'SELECT id, code, kind, value, max_off_paise, min_subtotal_paise, usage_limit, used_count, active, expires_at, created_at FROM coupons WHERE UPPER(code) = UPPER(?) LIMIT 1',
    [code.trim()],
  );
  if (!row) return null;
  return { ...(row as unknown as Coupon), value: num(row.value), used_count: num(row.used_count), active: num(row.active, 1) };
}

export function createCoupon(input: {
  code: string;
  kind: 'percent' | 'flat';
  value: number;
  max_off_paise?: number | null;
  min_subtotal_paise?: number;
  usage_limit?: number | null;
  expires_at?: string | null;
  active?: number;
}): Coupon {
  const id = uuid();
  db().run(
    `INSERT INTO coupons (id, code, kind, value, max_off_paise, min_subtotal_paise, usage_limit, used_count, active, expires_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.code.trim().toUpperCase(),
      input.kind,
      num(input.value),
      input.max_off_paise ?? null,
      num(input.min_subtotal_paise),
      input.usage_limit ?? null,
      0,
      input.active ?? 1,
      input.expires_at ?? null,
      nowIso(),
    ],
  );
  return getCoupon(input.code)!;
}

export function updateCoupon(id: string, patch: Partial<Record<string, unknown>>): void {
  const keys = Object.keys(patch);
  if (!keys.length) return;
  db().run(`UPDATE coupons SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => patch[k]), id]);
}

export function deleteCoupon(id: string): void {
  db().run('DELETE FROM coupons WHERE id = ?', [id]);
}

export function useCoupon(code: string): void {
  db().run('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(?)', [code.trim()]);
}

export interface CouponCheck {
  ok: boolean;
  reason?: string;
  discountPaise: number;
}

export function validateCoupon(code: string, subtotalPaise: number): CouponCheck {
  const coupon = getCoupon(code);
  if (!coupon) return { ok: false, reason: 'That coupon code does not exist.', discountPaise: 0 };
  if (!coupon.active) return { ok: false, reason: 'This coupon is no longer active.', discountPaise: 0 };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
    return { ok: false, reason: 'This coupon has expired.', discountPaise: 0 };
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
    return { ok: false, reason: 'This coupon has reached its usage limit.', discountPaise: 0 };
  if (subtotalPaise < num(coupon.min_subtotal_paise))
    return {
      ok: false,
      reason: `Add at least ${inr(num(coupon.min_subtotal_paise))} to your cart to use ${coupon.code}.`,
      discountPaise: 0,
    };

  let discount =
    coupon.kind === 'percent'
      ? Math.round((subtotalPaise * Math.min(num(coupon.value), 100)) / 100)
      : Math.min(num(coupon.value) * 100, subtotalPaise);
  if (coupon.max_off_paise) discount = Math.min(discount, num(coupon.max_off_paise));
  discount = Math.max(0, Math.min(discount, subtotalPaise));
  return { ok: true, discountPaise: discount };
}

/* ------------------------------------------------------------------ */
/* Media library (uploaded PDFs & covers)                              */
/* ------------------------------------------------------------------ */

export function addMedia(input: { kind: string; filename: string; path?: string; url?: string; size: number }): MediaItem {
  const id = uuid();
  db().run(
    'INSERT INTO media (id, kind, filename, path, url, size, created_at) VALUES (?,?,?,?,?,?,?)',
    [id, input.kind, input.filename, input.path || null, input.url || null, num(input.size), nowIso()],
  );
  return { id, kind: input.kind, filename: input.filename, path: input.path || null, url: input.url || null, size: num(input.size), created_at: nowIso() };
}

export function listMedia(kind?: string, limit = 200): MediaItem[] {
  const sql = kind
    ? 'SELECT id, kind, filename, path, url, size, created_at FROM media WHERE kind = ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT id, kind, filename, path, url, size, created_at FROM media ORDER BY created_at DESC LIMIT ?';
  const params = kind ? [kind, limit] : [limit];
  return db().all(sql, params).map((r) => ({ ...(r as unknown as MediaItem), size: num(r.size) }));
}

export function deleteMedia(id: string): MediaItem | null {
  const row = db().get('SELECT id, kind, filename, path, url, size, created_at FROM media WHERE id = ? LIMIT 1', [id]);
  if (!row) return null;
  db().run('DELETE FROM media WHERE id = ?', [id]);
  return row as unknown as MediaItem;
}

/* ------------------------------------------------------------------ */
/* Subscribers / settings / events                                     */
/* ------------------------------------------------------------------ */

export function addSubscriber(email: string, source?: string): boolean {
  const clean = email.trim().toLowerCase();
  if (!clean) return false;
  const existing = db().get('SELECT id FROM subscribers WHERE LOWER(email) = LOWER(?) LIMIT 1', [clean]);
  if (existing) return false;
  db().run('INSERT INTO subscribers (id, email, source, created_at) VALUES (?,?,?,?)', [uuid(), clean, source || null, nowIso()]);
  return true;
}

export function countSubscribers(): number {
  return num(db().scalar<number>('SELECT COUNT(*) AS n FROM subscribers'), 0);
}

export function listSubscribers(limit = 500): { email: string; created_at: string }[] {
  return db().all('SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT ?', [limit]) as { email: string; created_at: string }[];
}

export function getSetting(key: string): string | null {
  const row = db().get('SELECT value FROM settings WHERE key = ? LIMIT 1', [key]);
  return row && row.value !== null && row.value !== undefined ? String(row.value) : null;
}

export function setSetting(key: string, value: string): void {
  const existing = db().get('SELECT key FROM settings WHERE key = ? LIMIT 1', [key]);
  if (existing) db().run('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?', [value, nowIso(), key]);
  else db().run('INSERT INTO settings (key, value, updated_at) VALUES (?,?,?)', [key, value, nowIso()]);
}

export function allSettings(): Record<string, string> {
  const rows = db().all('SELECT key, value FROM settings');
  const out: Record<string, string> = {};
  for (const r of rows) out[String(r.key)] = r.value === null ? '' : String(r.value);
  return out;
}

export function logEvent(kind: string, orderId?: string, productId?: string, message?: string): void {
  try {
    db().run('INSERT INTO events (id, kind, order_id, product_id, message, created_at) VALUES (?,?,?,?,?,?)', [
      uuid(),
      kind,
      orderId || null,
      productId || null,
      message || null,
      nowIso(),
    ]);
  } catch {
    /* never let logging break a request */
  }
}

export function recentEvents(limit = 30): { kind: string; message: string | null; created_at: string }[] {
  return db().all('SELECT kind, message, created_at FROM events ORDER BY created_at DESC LIMIT ?', [limit]) as {
    kind: string;
    message: string | null;
    created_at: string;
  }[];
}

export function purgeAllProducts(): number {
  const n = countProducts({ activeOnly: false });
  db().run('DELETE FROM products');
  db().run('DELETE FROM media');
  return n;
}
