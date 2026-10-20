import { config } from './config';
import { createMemoryAdapter, createPostgresAdapter, createSqliteAdapter, type SqlAdapter } from './sql';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  highlights      TEXT,
  price_paise     INTEGER NOT NULL DEFAULT 0,
  mrp_paise       INTEGER,
  category        TEXT,
  exam            TEXT DEFAULT 'NIFT',
  course          TEXT,
  year            TEXT,
  pages           INTEGER,
  language        TEXT DEFAULT 'English',
  file_name       TEXT,
  file_path       TEXT,
  file_size       INTEGER DEFAULT 0,
  file_url        TEXT,
  preview_file    TEXT,
  cover_path      TEXT,
  cover_url       TEXT,
  tags            TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  is_featured     INTEGER NOT NULL DEFAULT 0,
  is_bundle       INTEGER NOT NULL DEFAULT 0,
  bundle_ids      TEXT,
  bestseller      INTEGER NOT NULL DEFAULT 0,
  new_arrival     INTEGER NOT NULL DEFAULT 1,
  rating          REAL DEFAULT 4.8,
  rating_count    INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TEXT,
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

CREATE TABLE IF NOT EXISTS orders (
  id                     TEXT PRIMARY KEY,
  order_number           TEXT NOT NULL UNIQUE,
  email                  TEXT NOT NULL,
  name                   TEXT,
  phone                  TEXT,
  status                 TEXT NOT NULL DEFAULT 'created',
  payment_status         TEXT NOT NULL DEFAULT 'unpaid',
  subtotal_paise         INTEGER NOT NULL DEFAULT 0,
  discount_paise         INTEGER NOT NULL DEFAULT 0,
  total_paise            INTEGER NOT NULL DEFAULT 0,
  currency               TEXT DEFAULT 'INR',
  coupon_code            TEXT,
  razorpay_order_id      TEXT,
  razorpay_payment_id    TEXT,
  razorpay_signature     TEXT,
  download_token         TEXT,
  notes                  TEXT,
  ip                     TEXT,
  user_agent             TEXT,
  created_at             TEXT,
  paid_at                TEXT,
  last_download_at       TEXT,
  download_count         INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders (download_token);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay ON orders (razorpay_order_id);

CREATE TABLE IF NOT EXISTS order_items (
  id             TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL,
  product_id     TEXT NOT NULL,
  product_title  TEXT,
  product_slug   TEXT,
  unit_paise     INTEGER NOT NULL DEFAULT 0,
  total_paise    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items (order_id);

CREATE TABLE IF NOT EXISTS coupons (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL DEFAULT 'percent',
  value         INTEGER NOT NULL DEFAULT 0,
  max_off_paise INTEGER,
  min_subtotal_paise INTEGER DEFAULT 0,
  usage_limit   INTEGER,
  used_count    INTEGER DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,
  expires_at    TEXT,
  created_at    TEXT
);

CREATE TABLE IF NOT EXISTS media (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL DEFAULT 'pdf',
  filename   TEXT NOT NULL,
  path       TEXT,
  url        TEXT,
  size       INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  order_id   TEXT,
  product_id TEXT,
  message    TEXT,
  created_at TEXT
);
`;

let adapter: SqlAdapter | null = null;
let chosen = '';

function pickBackend(): { kind: 'sqlite' | 'postgres' | 'memory'; target: string } {
  const url = config.storage.databaseUrl || '';
  // Explicit opt-in to the in-memory engine (useful for demos, CI and hosts
  // with no disk). Anything not persisted is reported loudly by dbInfo().
  if (/^memory:/i.test(url)) return { kind: 'memory', target: 'in-memory (DATABASE_URL=memory:)' };
  if (/^postgres(ql)?:\/\//i.test(url)) {
    try {
      require.resolve('pg');
      return { kind: 'postgres', target: url.replace(/:[^:@/]+@/, ':****@') };
    } catch {
      console.warn('[db] DATABASE_URL is Postgres but the "pg" package is not installed. Falling back to memory.');
      return { kind: 'memory', target: 'in-memory' };
    }
  }
  try {
    require.resolve('better-sqlite3');
    const file = url.replace(/^file:/, '');
    return { kind: 'sqlite', target: file };
  } catch {
    return { kind: 'memory', target: 'in-memory (better-sqlite3 unavailable)' };
  }
}

export function db(): SqlAdapter {
  if (adapter) return adapter;
  const backend = pickBackend();
  try {
    if (backend.kind === 'sqlite') adapter = createSqliteAdapter(backend.target);
    else if (backend.kind === 'postgres') adapter = createPostgresAdapter(config.storage.databaseUrl);
    else adapter = createMemoryAdapter();
  } catch (err) {
    console.error('[db] failed to open', backend.kind, '-', (err as Error).message);
    console.error('[db] falling back to in-memory storage (data will NOT persist).');
    adapter = createMemoryAdapter();
    backend.kind = 'memory';
  }
  chosen = `${backend.kind} (${backend.target})`;
  migrate(adapter);
  console.log(`[db] ready — ${chosen}${adapter.persistent ? '' : '  ⚠ NOT PERSISTENT'}`);
  return adapter;
}

function migrate(a: SqlAdapter) {
  for (const statement of SCHEMA.split(/;\s*\n/)) {
    const sql = statement.trim();
    if (!sql) continue;
    try {
      a.exec(`${sql};`);
    } catch (err) {
      // Some engines dislike multi-statement exec; run one by one.
      try {
        a.run(sql);
      } catch (inner) {
        console.warn('[db] schema statement skipped:', (inner as Error).message);
      }
    }
  }
}

export function dbInfo() {
  db();
  return { backend: chosen, adapter: adapter!, persistent: adapter!.persistent };
}

/** Dev/demo helper: is the store empty? */
export function isStoreEmpty(): boolean {
  const a = db();
  return Number(a.scalar('SELECT COUNT(*) AS n FROM products') ?? 0) === 0;
}
