/**
 * sql.ts — a deliberately tiny "SQL adapter" layer.
 *
 * The repository code below it writes one flavour of SQL (SQLite style, `?`
 * placeholders) and the adapter translates it for whichever backend is active:
 *
 *   • better-sqlite3   -> zero-setup, perfect for local dev + any VPS
 *   • pg (Postgres)    -> needed for serverless hosts such as Vercel
 *   • memory           -> a miniature in-process SQL engine (see memory-engine.ts)
 *                         so the app still boots & is fully testable on a host
 *                         with no filesystem and no database.
 *
 * This is NOT a general-purpose SQL engine. It supports exactly the subset the
 * store uses: single-table SELECT / INSERT / UPDATE / DELETE, `?` params,
 * simple WHERE (AND/OR/=/!=/</>/<=/>=/LIKE/IN), aggregate COUNT/MIN/MAX/SUM,
 * GROUP BY, ORDER BY, LIMIT/OFFSET and `ON CONFLICT DO NOTHING`.
 */

export type Row = Record<string, unknown>;
export type Params = unknown[];

export interface SqlAdapter {
  readonly kind: 'sqlite' | 'postgres' | 'memory';
  readonly persistent: boolean;
  /** Run a statement that returns no rows. */
  run(sql: string, params?: Params): void;
  /** Run a statement that returns no rows (alias, reads nicer for DDL). */
  exec(sql: string): void;
  /** Return all matching rows. */
  all<T = Row>(sql: string, params?: Params): T[];
  /** Return the first matching row or null. */
  get<T = Row>(sql: string, params?: Params): T | null;
  /** Return the first column of the first row (handy for COUNT). */
  scalar<T = unknown>(sql: string, params?: Params): T | null;
  close?(): void;
}

/* ------------------------------------------------------------------ *
 * Placeholder rewriting: `?` -> `$1, $2 ...` for Postgres.
 * Ignores `?` that sit inside single-quoted string literals.
 * ------------------------------------------------------------------ */
export function toPostgresSql(sql: string): string {
  let out = '';
  let i = 0;
  let n = 0;
  let inString = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (inString) {
      out += ch;
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          out += "'";
          i += 2;
          continue;
        }
        inString = false;
      }
      i++;
      continue;
    }
    if (ch === "'") {
      inString = true;
      out += ch;
      i++;
      continue;
    }
    if (ch === '?') {
      n++;
      out += `$${n}`;
      i++;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * SQLite adapter
 * ------------------------------------------------------------------ */
export function createSqliteAdapter(file: string): SqlAdapter {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  if (!file.startsWith(':memory:')) {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }

  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const cache = new Map<string, ReturnType<typeof db.prepare>>();
  const prep = (sql: string) => {
    let stmt = cache.get(sql);
    if (!stmt) {
      stmt = db.prepare(sql);
      cache.set(sql, stmt);
    }
    return stmt;
  };

  return {
    kind: 'sqlite',
    persistent: !file.startsWith(':memory:'),
    run: (sql, params = []) => {
      prep(sql).run(params as never[]);
    },
    exec: (sql) => {
      db.exec(sql);
    },
    all: <T,>(sql: string, params: Params = []) => prep(sql).all(params as never[]) as T[],
    get: <T,>(sql: string, params: Params = []) => (prep(sql).get(params as never[]) as T) ?? null,
    scalar: (sql, params = []) => {
      const row = prep(sql).get(params as never[]) as Row | undefined;
      if (!row) return null;
      const values = Object.values(row);
      return (values.length ? values[0] : null) as never;
    },
    close: () => db.close(),
  };
}

/* ------------------------------------------------------------------ *
 * Postgres adapter (lazy: `pg` is only required when a postgres URL is set)
 * ------------------------------------------------------------------ */
export function createPostgresAdapter(connectionString: string): SqlAdapter {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString, max: 5 });
  const cache = new Map<string, string>();
  const rewrite = (sql: string) => {
    let out = cache.get(sql);
    if (!out) {
      out = toPostgresSql(sql);
      cache.set(sql, out);
    }
    return out;
  };
  return {
    kind: 'postgres',
    persistent: true,
    run: (sql, params = []) => {
      pool.query(rewrite(sql), params);
    },
    exec: (sql) => {
      pool.query(sql);
    },
    all: <T,>(sql: string, params: Params = []) => {
      // The repo layer is called from sync server code; `pg` is async, so the
      // postgres adapter uses a synchronous bridge via deasync-free polling.
      return syncQuery(pool, rewrite(sql), params).rows as T[];
    },
    get: <T,>(sql: string, params: Params = []) => (syncQuery(pool, rewrite(sql), params).rows[0] as T) ?? null,
    scalar: (sql, params = []) => {
      const rows = syncQuery(pool, rewrite(sql), params).rows as Row[];
      if (!rows.length) return null;
      const values = Object.values(rows[0]);
      return (values.length ? values[0] : null) as never;
    },
    close: () => pool.end(),
  };
}

/**
 * Synchronous wrapper around `pg`. Next.js route handlers are async, but our
 * repository is written synchronously (matching better-sqlite3). On Postgres we
 * block the event loop with a busy-wait on a promise — acceptable for a
 * single-admin store, and it keeps one code path for both backends.
 */
function syncQuery(pool: { query: (t: string, p: unknown[]) => Promise<{ rows: Row[] }> }, text: string, params: unknown[]) {
  let done = false;
  let result: { rows: Row[] } = { rows: [] };
  let error: unknown = null;
  pool
    .query(text, params)
    .then((r) => {
      result = r;
      done = true;
    })
    .catch((e) => {
      error = e;
      done = true;
    });
  const { execSync } = require('child_process') as typeof import('child_process');
  while (!done) {
    // Yield the loop in ~1ms slices so libuv can run the query's callbacks.
    try {
      execSync(process.platform === 'win32' ? 'ping -n 1 127.0.0.1 > nul' : 'sleep 0.001');
    } catch {
      /* ignore */
    }
  }
  if (error) throw error;
  return result;
}

/* ------------------------------------------------------------------ *
 * Memory adapter
 * ------------------------------------------------------------------ */
export function createMemoryAdapter(): SqlAdapter {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MemoryEngine } = require('./memory-engine') as typeof import('./memory-engine');
  const engine = new MemoryEngine();
  return {
    kind: 'memory',
    persistent: false,
    run: (sql, params = []) => engine.execute(sql, params),
    exec: (sql) => engine.execute(sql, []),
    all: <T,>(sql: string, params: Params = []) => engine.execute(sql, params).rows as T[],
    get: <T,>(sql: string, params: Params = []) => (engine.execute(sql, params).rows[0] as T) ?? null,
    scalar: (sql, params = []) => {
      const rows = engine.execute(sql, params).rows as Row[];
      if (!rows.length) return null;
      const values = Object.values(rows[0]);
      return (values.length ? values[0] : null) as never;
    },
  };
}
