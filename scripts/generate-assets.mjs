/**
 * scripts/generate-assets.mjs
 *
 * Builds the static brand assets from app/icon.svg:
 *   public/icon-192.png, public/icon-512.png, public/apple-icon.png,
 *   public/og.png (1200x630 social share card), public/favicon.ico
 *
 * Run:  npm run assets
 * Safe to re-run at any time.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const iconSvg = fs.readFileSync(path.join(root, 'app', 'icon.svg'));

const sizes = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-icon.png', size: 180 },
];

for (const s of sizes) {
  await sharp(iconSvg, { density: 384 })
    .resize(s.size, s.size)
    .png()
    .toFile(path.join(publicDir, s.file));
  console.log(`✓ public/${s.file}`);
}

// 32x32 favicon (browsers still ask for it)
await sharp(iconSvg, { density: 384 }).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48.png'));
console.log('✓ public/favicon-48.png');

/* ---------------- Open Graph share card ---------------- */
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7916ff"/>
      <stop offset="55%" stop-color="#4b05ad"/>
      <stop offset="100%" stop-color="#171129"/>
    </linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.8" fill="#ffffff" fill-opacity=".12"/>
    </pattern>
    <radialGradient id="glow" cx="82%" cy="10%" r="70%">
      <stop offset="0%" stop-color="#fbc94d" stop-opacity=".35"/>
      <stop offset="100%" stop-color="#fbc94d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g transform="translate(72,84)">
    <rect width="60" height="60" rx="18" fill="#ffffff" fill-opacity=".14"/>
    <g transform="translate(10,14) scale(0.625)">
      <path d="M32 14 12 24l20 10 16-8v12h4V24L32 14Z" fill="#ffffff"/>
      <path d="M20 30.5V40c0 3.3 5.4 6 12 6s12-2.7 12-6v-9.5l-12 6-12-6Z" fill="#fbc94d"/>
    </g>
    <text x="78" y="42" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff" letter-spacing="-0.5">StudyPalace</text>
  </g>

  <text x="72" y="290" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff" letter-spacing="-2">NIFT 2027 preparation</text>
  <text x="72" y="374" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="76" font-weight="800" fill="#fbc94d" letter-spacing="-2">PDFs. Instant download.</text>

  <text x="72" y="436" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="28" font-weight="600" fill="#ffffff" fill-opacity=".82">GAT question banks • CAT drawing practice • Situation Test</text>
  <text x="72" y="474" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="28" font-weight="600" fill="#ffffff" fill-opacity=".82">model-making guides • previous year papers • current affairs</text>

  <g transform="translate(72,516)">
    <rect width="330" height="58" rx="29" fill="#fbc94d"/>
    <text x="30" y="38" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="24" font-weight="800" fill="#171129">Pay with UPI → get PDF</text>
  </g>
  <g transform="translate(424,516)">
    <rect width="290" height="58" rx="29" fill="#ffffff" fill-opacity=".14"/>
    <text x="30" y="38" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Secure • Razorpay</text>
  </g>
</svg>`;

await sharp(Buffer.from(og)).resize(1200, 630).png().toFile(path.join(publicDir, 'og.png'));
console.log('✓ public/og.png');

console.log('\nAssets generated in ./public');
