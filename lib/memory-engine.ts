/**
 * memory-engine.ts — a miniature in-process SQL engine.
 *
 * It exists for one reason: to let StudyPalace boot and work end-to-end on
 * hosts that have no writable disk and no database (Vercel's free tier, for
 * example). Data lives in RAM for the lifetime of the process, so it is great
 * for demoing, testing and evaluating the app — not for real sales.
 *
 * Supported subset (exactly what lib/repo.ts uses):
 *   CREATE TABLE [IF NOT EXISTS] name (col TYPE [PRIMARY KEY] [AUTOINCREMENT], ...)
 *   CREATE INDEX ...            (accepted and ignored)
 *   INSERT INTO t (cols) VALUES (?) [ON CONFLICT DO NOTHING]
 *   SELECT exprs FROM t [WHERE ...] [GROUP BY c] [ORDER BY c [ASC|DESC]] [LIMIT n [OFFSET m]]
 *   UPDATE t SET c = ? [, ...] [WHERE ...]
 *   DELETE FROM t [WHERE ...]
 *   WHERE: AND / OR / = != <> < > <= >= / LIKE / IN (...) / IS NULL / IS NOT NULL
 *   Aggregates: COUNT(*), COUNT(c), MIN(c), MAX(c), SUM(c)
 *   SELECT functions: LOWER(c)
 */

export type Row = Record<string, unknown>;

interface Table {
  name: string;
  columns: string[];
  pk: string | null;
  autoincrement: string | null;
  rows: Row[];
  seq: number;
}

/* ------------------------------------------------------------------ */
/* Value helpers                                                       */
/* ------------------------------------------------------------------ */

class LikeRegExp {
  static build(pattern: string): RegExp {
    let out = '^';
    for (const ch of pattern) {
      if (ch === '%') out += '[\\s\\S]*';
      else if (ch === '_') out += '[\\s\\S]';
      else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(`${out}$`, 'i');
  }
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : 1;
  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an < bn ? -1 : 1;
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (a === b) return true;
  if (typeof a === 'number' || typeof b === 'number') {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an === bn;
    return false;
  }
  return String(a) === String(b);
}

/* ------------------------------------------------------------------ */
/* AST                                                                 */
/* ------------------------------------------------------------------ */

type Operand =
  | { kind: 'param'; index: number }
  | { kind: 'literal'; value: unknown }
  | { kind: 'column'; name: string; table?: string }
  | { kind: 'func'; name: string; args: Operand[] }
  | { kind: 'binop'; op: '||' | '+' | '-' | '*' | '/'; left: Operand; right: Operand };

type Condition =
  | { op: 'and'; left: Condition; right: Condition }
  | { op: 'or'; left: Condition; right: Condition }
  | { op: 'cmp'; cmp: '=' | '!=' | '<' | '>' | '<=' | '>='; left: Operand; right: Operand }
  | { op: 'like'; left: Operand; pattern: Operand; negate: boolean }
  | { op: 'in'; left: Operand; values: Operand[]; negate: boolean }
  | { op: 'null'; left: Operand; negate: boolean }
  | { op: 'true' };

interface SelectStmt {
  type: 'select';
  table: string;
  distinct: boolean;
  columns: { expr: Operand | { kind: 'star' } | { kind: 'agg'; fn: string; arg: Operand | { kind: 'star' } }; alias?: string }[];
  where: Condition | null;
  groupBy: string[];
  orderBy: { name: string; dir: 'asc' | 'desc' }[];
  limit: number | null;
  offset: number;
}

interface InsertStmt {
  type: 'insert';
  table: string;
  columns: string[];
  values: Operand[][];
  onConflictDoNothing: boolean;
}

interface UpdateStmt {
  type: 'update';
  table: string;
  sets: { name: string; value: Operand }[];
  where: Condition | null;
}

interface DeleteStmt {
  type: 'delete';
  table: string;
  where: Condition | null;
}

type Stmt = SelectStmt | InsertStmt | UpdateStmt | DeleteStmt | { type: 'noop' };

/* ------------------------------------------------------------------ */
/* Tokenizer                                                           */
/* ------------------------------------------------------------------ */

type Tok =
  | { t: 'word'; v: string }
  | { t: 'str'; v: string }
  | { t: 'num'; v: number }
  | { t: 'param' }
  | { t: 'op'; v: string }
  | { t: 'punct'; v: string };

const MULTI_OPS = ['<=', '>=', '!=', '<>', '||'];
const SINGLE_OPS = ['=', '<', '>'];

function tokenize(sql: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    // line comment
    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }
    // block comment
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === "'") {
      let out = '';
      i++;
      while (i < sql.length) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            out += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        }
        out += sql[i++];
      }
      toks.push({ t: 'str', v: out });
      continue;
    }
    if (ch === '"') {
      let out = '';
      i++;
      while (i < sql.length && sql[i] !== '"') out += sql[i++];
      i++;
      toks.push({ t: 'word', v: out });
      continue;
    }
    if (ch === '`') {
      let out = '';
      i++;
      while (i < sql.length && sql[i] !== '`') out += sql[i++];
      i++;
      toks.push({ t: 'word', v: out });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let out = '';
      while (i < sql.length && /[0-9.]/.test(sql[i])) out += sql[i++];
      toks.push({ t: 'num', v: Number(out) });
      continue;
    }
    if (ch === '?') {
      toks.push({ t: 'param' });
      i++;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let out = '';
      while (i < sql.length && /[A-Za-z0-9_.]/.test(sql[i])) out += sql[i++];
      toks.push({ t: 'word', v: out });
      continue;
    }
    const multi = MULTI_OPS.find((o) => sql.startsWith(o, i));
    if (multi) {
      toks.push({ t: 'op', v: multi === '<>' ? '!=' : multi });
      i += multi.length;
      continue;
    }
    if (SINGLE_OPS.includes(ch)) {
      toks.push({ t: 'op', v: ch });
      i++;
      continue;
    }
    if ('+-/*%'.includes(ch)) {
      toks.push({ t: 'op', v: ch });
      i++;
      continue;
    }
    if ('(),.'.includes(ch)) {
      toks.push({ t: 'punct', v: ch });
      i++;
      continue;
    }
    throw new Error(`memory-engine: unexpected character "${ch}" at ${i} in: ${sql.slice(0, 120)}`);
  }
  return toks;
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */

class Parser {
  private pos = 0;
  constructor(private toks: Tok[], private params: unknown[]) {}

  private peek(offset = 0): Tok | undefined {
    return this.toks[this.pos + offset];
  }
  private next(): Tok {
    const t = this.toks[this.pos];
    if (!t) throw new Error('memory-engine: unexpected end of statement');
    this.pos++;
    return t;
  }
  private isWord(w: string, offset = 0): boolean {
    const t = this.peek(offset);
    return !!t && t.t === 'word' && t.v.toLowerCase() === w.toLowerCase();
  }
  private eatWord(w: string): boolean {
    if (this.isWord(w)) {
      this.pos++;
      return true;
    }
    return false;
  }
  private expectWord(w: string) {
    if (!this.eatWord(w)) throw new Error(`memory-engine: expected "${w}" near token ${JSON.stringify(this.peek())}`);
  }
  private isPunct(p: string, offset = 0): boolean {
    const t = this.peek(offset);
    return !!t && t.t === 'punct' && t.v === p;
  }
  private eatPunct(p: string): boolean {
    if (this.isPunct(p)) {
      this.pos++;
      return true;
    }
    return false;
  }
  private expectPunct(p: string) {
    if (!this.eatPunct(p)) throw new Error(`memory-engine: expected "${p}" near token ${JSON.stringify(this.peek())}`);
  }
  private isOp(offset = 0): boolean {
    return this.peek(offset)?.t === 'op';
  }
  private done(): boolean {
    return this.pos >= this.toks.length;
  }

  /** Resolve a `?` into the actual bound value (converted to a literal node). */
  private takeParam(): Operand {
    this.next(); // consume '?'
    const idx = this.paramCursor++;
    return { kind: 'literal', value: this.params[idx] ?? null };
  }
  private paramCursor = 0;

  private parseOperand(): Operand {
    const t = this.peek();
    if (!t) throw new Error('memory-engine: expected operand, got end of statement');
    if (t.t === 'param') return this.continueExpression(this.takeParam());
    if (t.t === 'num') {
      this.pos++;
      return this.continueExpression({ kind: 'literal', value: t.v });
    }
    if (t.t === 'str') {
      this.pos++;
      return this.continueExpression({ kind: 'literal', value: t.v });
    }
    if (t.t === 'word') {
      const upper = t.v.toUpperCase();
      if (upper === 'NULL') {
        this.pos++;
        return this.continueExpression({ kind: 'literal', value: null });
      }
      if (upper === 'TRUE') {
        this.pos++;
        return this.continueExpression({ kind: 'literal', value: 1 });
      }
      if (upper === 'FALSE') {
        this.pos++;
        return this.continueExpression({ kind: 'literal', value: 0 });
      }
      // function call? (supports several comma-separated arguments, e.g. COALESCE)
      if (this.isPunct('(', 1)) {
        this.pos++;
        this.expectPunct('(');
        const args: Operand[] = [];
        if (!this.isPunct(')')) {
          do {
            args.push(this.parseExpression());
          } while (this.eatPunct(','));
        }
        this.expectPunct(')');
        return this.continueExpression({ kind: 'func', name: upper, args });
      }
      this.pos++;
      const parts = t.v.split('.');
      const column: Operand =
        parts.length === 2 ? { kind: 'column', name: parts[1], table: parts[0] } : { kind: 'column', name: t.v };
      return this.continueExpression(column);
    }
    if ((t.t === 'punct' || t.t === 'op') && t.v === '*') {
      this.pos++;
      return { kind: 'column', name: '*' };
    }
    // Parenthesised expression, e.g. (',' || LOWER(s) || ',')
    if (t.t === 'punct' && t.v === '(') {
      this.pos++;
      const inner = this.parseExpression();
      this.expectPunct(')');
      return this.continueExpression(inner);
    }
    // Unary minus, e.g. -1 or -n
    if (t.t === 'op' && t.v === '-') {
      this.pos++;
      const operand = this.parseMultiplicative();
      return { kind: 'binop', op: '-', left: { kind: 'literal', value: 0 }, right: operand };
    }
    throw new Error(`memory-engine: cannot parse operand at ${JSON.stringify(t)}`);
  }

  /**
   * Full expression parse, lowest binding precedence first:
   *   `||` (concat)  ->  `+` / `-`  ->  `*` / `/`  ->  primary
   */
  private parseExpression(): Operand {
    return this.parseConcat();
  }

  /**
   * Continue parsing an expression when the left-hand operand has ALREADY been
   * consumed by the caller. Every level must accept that seed value, otherwise
   * `n * 3` parses as just `n` and the rest of the expression is silently
   * dropped — which is exactly the bug that made `SET n = n + 1` a no-op.
   */
  private continueExpression(left: Operand): Operand {
    return this.parseConcat(left);
  }

  private parseConcat(left?: Operand): Operand {
    let node = this.parseAdditive(left);
    while (this.isOpValue('||')) {
      this.pos++;
      node = { kind: 'binop', op: '||', left: node, right: this.parseAdditive() };
    }
    return node;
  }

  private parseAdditive(left?: Operand): Operand {
    let node = left === undefined ? this.parseMultiplicative() : this.parseMultiplicative(left);
    for (;;) {
      const t = this.peek();
      if (t && t.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.pos++;
        node = { kind: 'binop', op: t.v as '+' | '-', left: node, right: this.parseMultiplicative() };
        continue;
      }
      return node;
    }
  }

  private parseMultiplicative(left?: Operand): Operand {
    let node = left === undefined ? this.parsePrimaryOperand() : left;
    for (;;) {
      const t = this.peek();
      if (t && t.t === 'op' && (t.v === '*' || t.v === '/')) {
        this.pos++;
        node = { kind: 'binop', op: t.v as '*' | '/', left: node, right: this.parsePrimaryOperand() };
        continue;
      }
      return node;
    }
  }

  /** `||` is emitted as an operator token by the tokenizer. */
  /**
   * Decide whether a leading `(` opens a *value expression* rather than a
   * grouped condition. Scan to the matching `)` and look at the token after
   * it: a comparison operator, LIKE, IN or IS means the parenthesised group is
   * an operand, so the normal operand parser should handle it.
   */
  private parenOpensExpression(): boolean {
    const start = this.pos; // points at '('
    let depth = 0;
    let i = start;
    for (; i < this.toks.length; i++) {
      const t = this.toks[i];
      if (t.t === 'punct' && t.v === '(') depth++;
      else if (t.t === 'punct' && t.v === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) return false; // unbalanced -> let the condition parser report it
    const after = this.toks[i + 1];
    if (!after) return false;
    if (after.t === 'op') return true; // = != < > <= >= || + - * /
    if (after.t === 'word') {
      const w = after.v.toUpperCase();
      return w === 'LIKE' || w === 'IN' || w === 'IS' || w === 'NOT';
    }
    return false;
  }

  private isOpValue(v: string): boolean {
    const t = this.peek();
    return !!t && ((t.t === 'op' && t.v === v) || (t.t === 'punct' && t.v === v));
  }

  /** A single operand with no trailing `||` chain (used by parseConcat). */
  private parsePrimaryOperand(): Operand {
    const t = this.peek();
    if (!t) throw new Error('memory-engine: expected operand after ||');
    if (t.t === 'param') return this.takeParam();
    if (t.t === 'num') {
      this.pos++;
      return { kind: 'literal', value: t.v };
    }
    if (t.t === 'str') {
      this.pos++;
      return { kind: 'literal', value: t.v };
    }
    if (t.t === 'word') {
      const upper = t.v.toUpperCase();
      if (upper === 'NULL') {
        this.pos++;
        return { kind: 'literal', value: null };
      }
      if (this.isPunct('(', 1)) {
        this.pos++;
        this.expectPunct('(');
        const args: Operand[] = [];
        if (!this.isPunct(')')) {
          do {
            args.push(this.parseOperand());
          } while (this.eatPunct(','));
        }
        this.expectPunct(')');
        return { kind: 'func', name: upper, args };
      }
      this.pos++;
      const parts = t.v.split('.');
      return parts.length === 2
        ? { kind: 'column', name: parts[1], table: parts[0] }
        : { kind: 'column', name: t.v };
    }
    if ((t.t === 'punct' || t.t === 'op') && t.v === '*') {
      this.pos++;
      return { kind: 'column', name: '*' };
    }
    if (t.t === 'punct' && t.v === '(') {
      this.pos++;
      const inner = this.parseExpression();
      this.expectPunct(')');
      return this.continueExpression(inner);
    }
    if (t.t === 'op' && t.v === '-') {
      this.pos++;
      return { kind: 'binop', op: '-', left: { kind: 'literal', value: 0 }, right: this.parseMultiplicative() };
    }
    throw new Error(`memory-engine: cannot parse operand after || at ${JSON.stringify(t)}`);
  }

  private parseCondition(): Condition {
    return this.parseOr();
  }

  private parseOr(): Condition {
    let left = this.parseAnd();
    while (this.eatWord('OR')) {
      const right = this.parseAnd();
      left = { op: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): Condition {
    let left = this.parsePrimaryCondition();
    while (this.eatWord('AND')) {
      const right = this.parsePrimaryCondition();
      left = { op: 'and', left, right };
    }
    return left;
  }

  private parsePrimaryCondition(): Condition {
    // `(` is ambiguous: it can open a grouped condition — (a = 1 AND b = 2) —
    // or a parenthesised value expression — (',' || LOWER(s) || ',') LIKE ?.
    if (this.isPunct('(') && !this.parenOpensExpression()) {
      this.pos++;
      const inner = this.parseCondition();
      this.expectPunct(')');
      return inner;
    }
    if (this.eatWord('NOT')) {
      const inner = this.parsePrimaryCondition();
      return { op: 'and', left: { op: 'true' }, right: invert(inner) };
    }
    const left = this.parseOperand();

    if (this.isWord('IS')) {
      this.pos++;
      const negate = this.eatWord('NOT');
      this.expectWord('NULL');
      return { op: 'null', left, negate };
    }
    if (this.isWord('NOT') && this.isWord('LIKE', 1)) {
      this.pos += 2;
      return { op: 'like', left, pattern: this.parseOperand(), negate: true };
    }
    if (this.isWord('LIKE')) {
      this.pos++;
      return { op: 'like', left, pattern: this.parseOperand(), negate: false };
    }
    if (this.isWord('NOT') && this.isWord('IN', 1)) {
      this.pos += 2;
      return { op: 'in', left, values: this.parseInList(), negate: true };
    }
    if (this.isWord('IN')) {
      this.pos++;
      return { op: 'in', left, values: this.parseInList(), negate: false };
    }
    if (this.isOp()) {
      const opTok = this.next() as { t: 'op'; v: string };
      const right = this.parseOperand();
      return { op: 'cmp', cmp: opTok.v as never, left, right };
    }
    throw new Error(`memory-engine: cannot parse condition at ${JSON.stringify(this.peek())}`);
  }

  private parseInList(): Operand[] {
    this.expectPunct('(');
    const values: Operand[] = [];
    if (!this.isPunct(')')) {
      do {
        values.push(this.parseOperand());
      } while (this.eatPunct(','));
    }
    this.expectPunct(')');
    return values;
  }

  private parseWhere(): Condition | null {
    if (!this.eatWord('WHERE')) return null;
    return this.parseCondition();
  }

  private parseOrderBy(): { name: string; dir: 'asc' | 'desc' }[] {
    const out: { name: string; dir: 'asc' | 'desc' }[] = [];
    if (!this.eatWord('ORDER')) return out;
    this.expectWord('BY');
    do {
      const operand = this.parseOperand();
      let dir: 'asc' | 'desc' = 'asc';
      if (this.eatWord('DESC')) dir = 'desc';
      else this.eatWord('ASC');
      const name = operand.kind === 'column' ? operand.name : String((operand as { value?: unknown }).value ?? '');
      out.push({ name, dir });
    } while (this.eatPunct(','));
    return out;
  }

  private parseLimit(): { limit: number | null; offset: number } {
    let limit: number | null = null;
    let offset = 0;
    if (this.eatWord('LIMIT')) {
      const t = this.next();
      limit = t.t === 'num' ? t.v : t.t === 'param' ? Number(this.params[this.paramCursor++] ?? 0) : null;
      if (this.eatWord('OFFSET')) {
        const o = this.next();
        offset = o.t === 'num' ? o.v : o.t === 'param' ? Number(this.params[this.paramCursor++] ?? 0) : 0;
      }
    }
    return { limit, offset };
  }

  /* -------- statements -------- */

  parse(): Stmt {
    // DDL & utility statements we accept but do not need to model.
    if (this.isWord('CREATE') || this.isWord('PRAGMA') || this.isWord('DROP') || this.isWord('ALTER')) {
      return { type: 'noop' };
    }
    if (this.isWord('SELECT')) return this.parseSelect();
    if (this.isWord('INSERT')) return this.parseInsert();
    if (this.isWord('UPDATE')) return this.parseUpdate();
    if (this.isWord('DELETE')) return this.parseDelete();
    throw new Error(`memory-engine: unsupported statement ${JSON.stringify(this.peek())}`);
  }

  private parseSelect(): SelectStmt {
    this.expectWord('SELECT');
    const distinct = this.eatWord('DISTINCT');
    const columns: SelectStmt['columns'] = [];
    do {
      if (this.isPunct('*') || (this.peek()?.t === 'op' && (this.peek() as { v: string }).v === '*')) {
        this.pos++;
        columns.push({ expr: { kind: 'star' } });
        continue;
      }
      // aggregate?
      const t = this.peek();
      if (t && t.t === 'word' && ['COUNT', 'MIN', 'MAX', 'SUM', 'AVG'].includes(t.v.toUpperCase()) && this.isPunct('(', 1)) {
        this.pos++;
        this.expectPunct('(');
        let arg: Operand | { kind: 'star' };
        if (this.isPunct('*') || (this.peek()?.t === 'op' && (this.peek() as { v: string }).v === '*')) {
          this.pos++;
          arg = { kind: 'star' };
        } else {
          arg = this.parseOperand();
        }
        this.expectPunct(')');
        let alias: string | undefined;
        if (this.eatWord('AS')) {
          const a = this.next();
          alias = a.t === 'word' ? a.v : undefined;
        } else if (this.peek()?.t === 'word' && !this.isKeywordAhead()) {
          const a = this.next();
          alias = a.t === 'word' ? a.v : undefined;
        }
        columns.push({ expr: { kind: 'agg', fn: t.v.toUpperCase(), arg }, alias: alias || `${t.v.toLowerCase()}` });
        continue;
      }
      const expr = this.parseOperand();
      let alias: string | undefined;
      if (this.eatWord('AS')) {
        const a = this.next();
        alias = a.t === 'word' ? a.v : undefined;
      } else if (expr.kind === 'func' || this.peekAlias()) {
        const p = this.peek();
        if (p && p.t === 'word' && !this.isKeywordAhead()) {
          this.pos++;
          alias = p.v;
        }
      }
      columns.push({ expr, alias });
    } while (this.eatPunct(','));

    this.expectWord('FROM');
    const tableTok = this.next();
    const table = tableTok.t === 'word' ? tableTok.v.split('.').pop()! : '';
    // optional alias
    if (this.peek()?.t === 'word' && !this.isKeywordAhead()) this.pos++;
    else if (this.eatWord('AS')) this.pos++;

    const where = this.parseWhere();
    const groupBy: string[] = [];
    if (this.eatWord('GROUP')) {
      this.expectWord('BY');
      do {
        const o = this.parseOperand();
        groupBy.push(o.kind === 'column' ? o.name : '');
      } while (this.eatPunct(','));
    }
    if (this.eatWord('HAVING')) this.parseCondition(); // accepted, not enforced
    const orderBy = this.parseOrderBy();
    const { limit, offset } = this.parseLimit();
    return { type: 'select', table, distinct, columns, where, groupBy, orderBy, limit, offset };
  }

  private isKeywordAhead(): boolean {
    const t = this.peek();
    if (!t || t.t !== 'word') return false;
    return ['FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'OFFSET', 'AND', 'OR', 'ON', 'SET', 'VALUES', 'RETURNING', 'AS'].includes(
      t.v.toUpperCase(),
    );
  }
  private peekAlias(): boolean {
    const t = this.peek();
    return !!t && t.t === 'word' && !this.isKeywordAhead();
  }

  private parseInsert(): InsertStmt {
    this.expectWord('INSERT');
    if (this.eatWord('OR')) {
      // INSERT OR REPLACE / IGNORE
      this.pos++;
    }
    this.expectWord('INTO');
    const tableTok = this.next();
    const table = tableTok.t === 'word' ? tableTok.v : '';
    const columns: string[] = [];
    if (this.isPunct('(')) {
      this.pos++;
      do {
        const c = this.next();
        if (c.t === 'word') columns.push(c.v);
      } while (this.eatPunct(','));
      this.expectPunct(')');
    }
    this.expectWord('VALUES');
    const values: Operand[][] = [];
    do {
      this.expectPunct('(');
      const rowOps: Operand[] = [];
      if (!this.isPunct(')')) {
        do {
          rowOps.push(this.parseOperand());
        } while (this.eatPunct(','));
      }
      this.expectPunct(')');
      values.push(rowOps);
    } while (this.eatPunct(','));

    let onConflictDoNothing = false;
    while (!this.done()) {
      if (this.eatWord('ON')) {
        this.expectWord('CONFLICT');
        if (this.isPunct('(')) {
          this.pos++;
          while (!this.isPunct(')') && !this.done()) this.pos++;
          this.eatPunct(')');
        }
        this.expectWord('DO');
        if (this.eatWord('NOTHING')) onConflictDoNothing = true;
        else {
          this.expectWord('UPDATE');
          // not modelled — treat as plain insert
          while (!this.done()) this.pos++;
        }
        break;
      }
      if (this.eatWord('RETURNING')) {
        while (!this.done()) this.pos++;
        break;
      }
      this.pos++;
    }
    return { type: 'insert', table, columns, values, onConflictDoNothing };
  }

  private parseUpdate(): UpdateStmt {
    this.expectWord('UPDATE');
    const tableTok = this.next();
    const table = tableTok.t === 'word' ? tableTok.v : '';
    this.expectWord('SET');
    const sets: { name: string; value: Operand }[] = [];
    do {
      const nameTok = this.next();
      const name = nameTok.t === 'word' ? nameTok.v : '';
      const op = this.next();
      if (op.t !== 'op' || op.v !== '=') throw new Error('memory-engine: expected "=" in UPDATE SET');
      sets.push({ name, value: this.parseOperand() });
    } while (this.eatPunct(','));
    const where = this.parseWhere();
    while (!this.done()) this.pos++;
    return { type: 'update', table, sets, where };
  }

  private parseDelete(): DeleteStmt {
    this.expectWord('DELETE');
    this.expectWord('FROM');
    const tableTok = this.next();
    const table = tableTok.t === 'word' ? tableTok.v : '';
    const where = this.parseWhere();
    while (!this.done()) this.pos++;
    return { type: 'delete', table, where };
  }
}

function invert(c: Condition): Condition {
  switch (c.op) {
    case 'and':
      return { op: 'or', left: invert(c.left), right: invert(c.right) };
    case 'or':
      return { op: 'and', left: invert(c.left), right: invert(c.right) };
    case 'cmp': {
      const flipped = { '=': '!=', '!=': '=', '<': '>=', '>': '<=', '<=': '>', '>=': '<' } as const;
      return { ...c, cmp: flipped[c.cmp] };
    }
    case 'like':
      return { ...c, negate: !c.negate };
    case 'in':
      return { ...c, negate: !c.negate };
    case 'null':
      return { ...c, negate: !c.negate };
    default:
      return { op: 'true' };
  }
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export class MemoryEngine {
  private tables = new Map<string, Table>();
  private ddlDone = false;

  private ensureTable(name: string): Table {
    const key = name.toLowerCase();
    let t = this.tables.get(key);
    if (!t) {
      t = { name, columns: [], pk: null, autoincrement: null, rows: [], seq: 0 };
      this.tables.set(key, t);
    }
    return t;
  }

  /** Parse a CREATE TABLE so the memory engine knows columns + PK. */
  private parseCreateTable(sql: string) {
    const m = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(([\s\S]*)\)\s*;?\s*$/i.exec(sql.trim());
    if (!m) return;
    const t = this.ensureTable(m[1]);
    // Split top-level commas (ignore commas inside parentheses)
    const body = m[2];
    const parts: string[] = [];
    let depth = 0;
    let cur = '';
    for (const ch of body) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur);

    for (const raw of parts) {
      const part = raw.trim();
      if (!part) continue;
      const upper = part.toUpperCase();
      if (upper.startsWith('PRIMARY KEY') || upper.startsWith('FOREIGN KEY') || upper.startsWith('UNIQUE') || upper.startsWith('CHECK')) {
        const pkMatch = /PRIMARY\s+KEY\s*\(\s*[`"]?(\w+)[`"]?\s*\)/i.exec(part);
        if (pkMatch) t.pk = pkMatch[1];
        continue;
      }
      const colMatch = /^[`"]?(\w+)[`"]?/.exec(part);
      if (!colMatch) continue;
      const col = colMatch[1];
      if (!t.columns.includes(col)) t.columns.push(col);
      if (/PRIMARY\s+KEY/i.test(part)) {
        t.pk = col;
        if (/AUTOINCREMENT|AUTO_INCREMENT/i.test(part)) t.autoincrement = col;
      }
      if (/AUTOINCREMENT|AUTO_INCREMENT/i.test(part)) t.autoincrement = t.autoincrement || col;
    }
    this.ddlDone = true;
  }

  execute(sql: string, params: unknown[] = []): { rows: Row[] } {
    const trimmed = sql.trim();

    if (/^CREATE\s+TABLE/i.test(trimmed)) {
      this.parseCreateTable(trimmed);
      return { rows: [] };
    }
    if (/^(CREATE\s+(UNIQUE\s+)?INDEX|PRAGMA|DROP\s+INDEX|ANALYZE|BEGIN|COMMIT|ROLLBACK)/i.test(trimmed)) {
      return { rows: [] };
    }
    if (/^CREATE\s+TABLE/i.test(trimmed) === false && /^DROP\s+TABLE/i.test(trimmed)) {
      const m = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"]?(\w+)/i.exec(trimmed);
      if (m) this.tables.delete(m[1].toLowerCase());
      return { rows: [] };
    }

    const parser = new Parser(tokenize(trimmed.replace(/;\s*$/, '')), params);
    const stmt = parser.parse();

    switch (stmt.type) {
      case 'noop':
        return { rows: [] };
      case 'insert':
        return { rows: this.doInsert(stmt) };
      case 'update':
        return { rows: this.doUpdate(stmt) };
      case 'delete':
        return { rows: this.doDelete(stmt) };
      case 'select':
        return { rows: this.doSelect(stmt) };
      default:
        return { rows: [] };
    }
  }

  /* ------------------------------ INSERT ------------------------------ */

  private doInsert(stmt: InsertStmt): Row[] {
    const t = this.ensureTable(stmt.table);
    for (const valueOps of stmt.values) {
      const row: Row = {};
      for (const col of t.columns) row[col] = null;
      const cols = stmt.columns.length ? stmt.columns : t.columns.slice(0, valueOps.length);
      cols.forEach((col, idx) => {
        row[col] = this.evalOperand(valueOps[idx], {});
      });
      if (t.autoincrement && (row[t.autoincrement] === null || row[t.autoincrement] === undefined)) {
        t.seq += 1;
        row[t.autoincrement] = t.seq;
      } else if (t.autoincrement) {
        const v = Number(row[t.autoincrement]);
        if (Number.isFinite(v)) t.seq = Math.max(t.seq, v);
      }
      if (stmt.onConflictDoNothing && t.pk && this.existsWithPk(t, row)) continue;
      t.rows.push(row);
    }
    return [];
  }

  private existsWithPk(t: Table, row: Row): boolean {
    if (!t.pk) return false;
    return t.rows.some((r) => looseEquals(r[t.pk!], row[t.pk!]));
  }

  /* ------------------------------ UPDATE ------------------------------ */

  private doUpdate(stmt: UpdateStmt): Row[] {
    const t = this.ensureTable(stmt.table);
    for (const row of t.rows) {
      if (!stmt.where || this.evalCondition(stmt.where, row)) {
        for (const set of stmt.sets) row[set.name] = this.evalOperand(set.value, row);
      }
    }
    return [];
  }

  /* ------------------------------ DELETE ------------------------------ */

  private doDelete(stmt: DeleteStmt): Row[] {
    const t = this.ensureTable(stmt.table);
    if (!stmt.where) {
      t.rows = [];
      return [];
    }
    t.rows = t.rows.filter((row) => !this.evalCondition(stmt.where!, row));
    return [];
  }

  /* ------------------------------ SELECT ------------------------------ */

  private doSelect(stmt: SelectStmt): Row[] {
    const t = this.ensureTable(stmt.table);
    let rows = t.rows.filter((row) => !stmt.where || this.evalCondition(stmt.where, row));

    const hasAgg = stmt.columns.some((c) => c.expr && (c.expr as { kind: string }).kind === 'agg');

    if (stmt.groupBy.length || hasAgg) {
      const groups = new Map<string, Row[]>();
      if (!stmt.groupBy.length) {
        groups.set('__all__', rows);
      } else {
        for (const row of rows) {
          const key = stmt.groupBy.map((g) => String(row[g])).join('\u0000');
          const arr = groups.get(key);
          if (arr) arr.push(row);
          else groups.set(key, [row]);
        }
      }
      const out: Row[] = [];
      for (const [, groupRows] of groups) {
        const sample = groupRows[0] ?? {};
        const outRow: Row = {};
        for (const col of stmt.columns) {
          const e = col.expr as { kind: string };
          if (e.kind === 'star') {
            Object.assign(outRow, sample);
            continue;
          }
          if (e.kind === 'agg') {
            const agg = e as { kind: 'agg'; fn: string; arg: Operand | { kind: 'star' } };
            const name = col.alias || agg.fn.toLowerCase();
            outRow[name] = this.aggregate(agg.fn, agg.arg, groupRows);
            continue;
          }
          const operand = e as Operand;
          const name = col.alias || (operand.kind === 'column' ? operand.name : 'expr');
          outRow[name] = this.evalOperand(operand, sample);
        }
        out.push(outRow);
      }
      rows = out;
      if (stmt.orderBy.length) rows = this.sortRows(rows, stmt.orderBy);
      return this.applyLimit(rows, stmt);
    }

    // projection
    let projected: Row[] = rows.map((row) => {
      const outRow: Row = {};
      for (const col of stmt.columns) {
        const e = col.expr as { kind: string };
        if (e.kind === 'star') {
          Object.assign(outRow, row);
          continue;
        }
        const operand = e as Operand;
        const name = col.alias || (operand.kind === 'column' ? operand.name : 'expr');
        outRow[name] = this.evalOperand(operand, row);
      }
      return outRow;
    });

    if (stmt.distinct) {
      const seen = new Set<string>();
      projected = projected.filter((r) => {
        const key = JSON.stringify(r);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (stmt.orderBy.length) projected = this.sortRows(projected, stmt.orderBy);
    return this.applyLimit(projected, stmt);
  }

  private applyLimit(rows: Row[], stmt: SelectStmt): Row[] {
    let out = rows;
    if (stmt.offset) out = out.slice(stmt.offset);
    if (stmt.limit !== null && stmt.limit >= 0) out = out.slice(0, stmt.limit);
    return out.map((r) => ({ ...r }));
  }

  private sortRows(rows: Row[], orderBy: { name: string; dir: 'asc' | 'desc' }[]): Row[] {
    return [...rows].sort((a, b) => {
      for (const o of orderBy) {
        const c = compare(a[o.name], b[o.name]);
        if (c !== 0) return o.dir === 'desc' ? -c : c;
      }
      return 0;
    });
  }

  private aggregate(fn: string, arg: Operand | { kind: 'star' }, rows: Row[]): unknown {
    if (fn === 'COUNT') {
      if ((arg as { kind: string }).kind === 'star') return rows.length;
      return rows.filter((r) => this.evalOperand(arg as Operand, r) !== null).length;
    }
    const values = rows
      .map((r) => this.evalOperand(arg as Operand, r))
      .filter((v) => v !== null && v !== undefined);
    if (!values.length) return fn === 'SUM' ? 0 : null;
    const nums = values.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    switch (fn) {
      case 'MIN':
        return values.reduce((a, b) => (compare(a, b) <= 0 ? a : b));
      case 'MAX':
        return values.reduce((a, b) => (compare(a, b) >= 0 ? a : b));
      case 'SUM':
        return nums.reduce((a, b) => a + b, 0);
      case 'AVG':
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      default:
        return null;
    }
  }

  /* ------------------------------ evaluation ------------------------------ */

  private evalOperand(op: Operand, row: Row): unknown {
    switch (op.kind) {
      case 'literal':
        return op.value;
      case 'param':
        return op.index;
      case 'column': {
        if (op.name === '*') return row;
        if (op.name in row) return row[op.name];
        // case-insensitive fallback
        const key = Object.keys(row).find((k) => k.toLowerCase() === op.name.toLowerCase());
        return key ? row[key] : null;
      }
      case 'binop': {
        const l = this.evalOperand(op.left, row);
        const r = this.evalOperand(op.right, row);
        if (op.op === '||') {
          // SQL: NULL || 'x' is NULL, so guard against undefined columns.
          if (l === null || l === undefined || r === null || r === undefined) return null;
          return `${l}${r}`;
        }
        // Arithmetic treats NULL as 0, matching how the app uses it
        // (e.g. downloads_count = downloads_count + 1).
        const a = Number(l ?? 0);
        const b = Number(r ?? 0);
        switch (op.op) {
          case '+':
            return a + b;
          case '-':
            return a - b;
          case '*':
            return a * b;
          case '/':
            return b === 0 ? null : a / b;
          default:
            return null;
        }
      }
      case 'func': {
        const name = op.name;
        if (name === 'COALESCE' || name === 'IFNULL') {
          for (const a of op.args) {
            const v = this.evalOperand(a, row);
            if (v !== null && v !== undefined) return v;
          }
          return null;
        }
        if (name === 'NULLIF') {
          const a = this.evalOperand(op.args[0], row);
          const b = this.evalOperand(op.args[1], row);
          return looseEquals(a, b) ? null : a;
        }
        const v = this.evalOperand(op.args[0], row);
        switch (name) {
          case 'LOWER':
            return v === null || v === undefined ? null : String(v).toLowerCase();
          case 'UPPER':
            return v === null || v === undefined ? null : String(v).toUpperCase();
          case 'LENGTH':
            return v === null || v === undefined ? null : String(v).length;
          case 'ABS':
            return v === null || v === undefined ? null : Math.abs(Number(v));
          case 'TRIM':
            return v === null || v === undefined ? null : String(v).trim();
          default:
            return v;
        }
      }
    }
  }

  private evalCondition(c: Condition, row: Row): boolean {
    switch (c.op) {
      case 'true':
        return true;
      case 'and':
        return this.evalCondition(c.left, row) && this.evalCondition(c.right, row);
      case 'or':
        return this.evalCondition(c.left, row) || this.evalCondition(c.right, row);
      case 'null': {
        const v = this.evalOperand(c.left, row);
        const isNull = v === null || v === undefined;
        return c.negate ? !isNull : isNull;
      }
      case 'like': {
        const v = this.evalOperand(c.left, row);
        const p = this.evalOperand(c.pattern, row);
        if (v === null || v === undefined || p === null || p === undefined) return c.negate;
        const matched = LikeRegExp.build(String(p)).test(String(v));
        return c.negate ? !matched : matched;
      }
      case 'in': {
        const v = this.evalOperand(c.left, row);
        const values = c.values.map((o) => this.evalOperand(o, row));
        const matched = values.some((x) => looseEquals(v, x));
        return c.negate ? !matched : matched;
      }
      case 'cmp': {
        const a = this.evalOperand(c.left, row);
        const b = this.evalOperand(c.right, row);
        switch (c.cmp) {
          case '=':
            return looseEquals(a, b);
          case '!=':
            return !looseEquals(a, b);
          case '<':
            return compare(a, b) < 0;
          case '>':
            return compare(a, b) > 0;
          case '<=':
            return compare(a, b) <= 0;
          case '>=':
            return compare(a, b) >= 0;
          default:
            return false;
        }
      }
    }
  }
}
