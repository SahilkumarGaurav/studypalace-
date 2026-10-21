import Link from 'next/link';

/**
 * GuideBody.tsx — a tiny, safe markdown-subset renderer for the SEO guides.
 *
 * Deliberately NOT a general markdown library: it parses line-by-line and only
 * emits known elements. Links are rendered through next/link (internal) or a
 * hardened <a> with rel="noopener noreferrer" (external). Inline formatting is
 * limited to **bold** and [text](url) — everything else is escaped by React,
 * so there is no HTML injection path.
 */

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'rule' };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      blocks.push({ type: 'rule' });
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h2', text: line.slice(2).trim() });
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        parts.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: parts.join(' ') });
      continue;
    }

    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
      const splitRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i].trim()));
        i++;
      }
      blocks.push({ type: 'table', head, rows });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (
        !l ||
        l.startsWith('#') ||
        l.startsWith('>') ||
        /^[-*•]\s+/.test(l) ||
        /^\d+[.)]\s+/.test(l) ||
        l.startsWith('|')
      ) {
        break;
      }
      para.push(l);
      i++;
    }
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
  }

  return blocks;
}

/** Split a string into React nodes handling **bold** and [text](href). */
function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`b${key++}`}>{token.slice(2, -2)}</strong>);
    } else {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (m) {
        const [, label, href] = m;
        if (href.startsWith('/') || href.startsWith('#')) {
          nodes.push(
            <Link key={`l${key++}`} href={href}>
              {label}
            </Link>,
          );
        } else {
          nodes.push(
            <a key={`l${key++}`} href={href} target="_blank" rel="noopener noreferrer nofollow">
              {label}
            </a>,
          );
        }
      } else {
        nodes.push(token);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function GuideBody({ markdown }: { markdown: string }) {
  const blocks = parse(markdown);
  return (
    <div className="prose-store">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case 'h2':
            return (
              <h2 key={idx} id={headingId(b.text)} className="scroll-mt-24">
                {inline(b.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} id={headingId(b.text)} className="scroll-mt-24">
                {inline(b.text)}
              </h3>
            );
          case 'p':
            return <p key={idx}>{inline(b.text)}</p>;
          case 'ul':
            return (
              <ul key={idx}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ol>
            );
          case 'quote':
            return <blockquote key={idx}>{inline(b.text)}</blockquote>;
          case 'rule':
            return <hr key={idx} className="my-8 border-ink-100" />;
          case 'table':
            return (
              <div key={idx} className="mb-5 overflow-x-auto rounded-xl border border-ink-100">
                <table>
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} scope="col">
                          {inline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>{inline(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}


/** Stable anchor id for a heading, matching the guide's table of contents. */
function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
