/**
 * cover.ts — auto-generated book covers.
 *
 * If you never upload a cover image the store would look broken and empty, so
 * every product gets a deterministic gradient "book" cover with its title on
 * it. Colours are chosen from the slug, so a product always gets the same
 * cover across the site (cards, product page, Open Graph image).
 */

export type Palette = [string, string, string];

export const PALETTES: Palette[] = [
  ['#7916ff', '#4b05ad', '#171129'],
  ['#171129', '#6b04fd', '#f98d0a'],
  ['#02a086', '#06c6a3', '#4b05ad'],
  ['#f98d0a', '#faae24', '#7916ff'],
  ['#3f3359', '#4b3c6c', '#06c6a3'],
  ['#6b04fd', '#2c0076', '#843dff'],
  ['#dd6102', '#b74006', '#171129'],
];

export function paletteFor(seed: string, palettes: Palette[] = PALETTES): Palette {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wrap text into lines that fit `maxChars`. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current.length) current = w;
    else if ((current + ' ' + w).length <= maxChars) current += ' ' + w;
    else {
      lines.push(current);
      current = w;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/…$/, '')}…`;
  }
  return lines.slice(0, maxLines);
}

export function generateCoverSvg(input: {
  title: string;
  subtitle?: string;
  palette: Palette;
  width?: number;
  height?: number;
  og?: boolean;
}): string {
  const width = input.width ?? 600;
  const height = input.height ?? 800;
  const [c1, c2, c3] = input.palette;
  const og = Boolean(input.og);

  const pad = og ? 70 : 48;
  const titleSize = og ? 62 : 46;
  const subSize = og ? 26 : 22;
  const maxChars = og ? 26 : 20;
  const maxLines = og ? 3 : 5;

  const lines = wrap(input.title, maxChars, maxLines);
  const subLines = wrap(input.subtitle || 'StudyPalace • NIFT preparation', og ? 60 : 34, 2);

  const lineEls = lines
    .map(
      (l, i) =>
        `<text x="${pad}" y="${og ? 300 + i * (titleSize + 12) : 300 + i * (titleSize + 10)}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff" letter-spacing="-1">${escapeXml(l)}</text>`,
    )
    .join('');

  const subY = (og ? 300 : 300) + lines.length * (titleSize + (og ? 12 : 10)) + 26;
  const subEls = subLines
    .map(
      (l, i) =>
        `<text x="${pad}" y="${subY + i * (subSize + 8)}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,.78)">${escapeXml(l)}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(input.title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="12%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="#ffffff" fill-opacity=".13"/>
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#dots)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>

  <!-- spine -->
  <rect x="0" y="0" width="${og ? 16 : 14}" height="${height}" fill="#000000" fill-opacity=".22"/>

  <!-- top badge -->
  <g transform="translate(${pad}, ${og ? 80 : 64})">
    <rect x="0" y="0" rx="999" ry="999" width="${og ? 300 : 250}" height="${og ? 44 : 36}" fill="#ffffff" fill-opacity=".16"/>
    <text x="${og ? 22 : 18}" y="${og ? 30 : 25}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="${og ? 20 : 15}" font-weight="800" letter-spacing="2.5" fill="#ffffff">
      ${escapeXml(og ? 'STUDYPALACE • NIFT PDF' : 'STUDYPALACE • PDF')}
    </text>
  </g>

  ${lineEls}
  ${subEls}

  <!-- bottom bar -->
  <g transform="translate(${pad}, ${height - (og ? 110 : 90)})">
    <rect x="0" y="0" rx="14" ry="14" width="${og ? 260 : 210}" height="${og ? 52 : 42}" fill="#fbc94d"/>
    <text x="${og ? 24 : 20}" y="${og ? 35 : 28}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="${og ? 22 : 17}" font-weight="800" fill="#171129">
      INSTANT DOWNLOAD
    </text>
  </g>
</svg>`;
}
