import type { Product } from '@/lib/repo';

/** The minimum a cover needs — so cart lines and products can both render one. */
export interface CoverSource {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  year?: string | null;
  pages?: number | null;
  cover_path?: string | null;
  cover_url?: string | null;
}

/**
 * Cover image for a product.
 *
 * 1. A real uploaded cover (served through /api/cover/[slug] because files
 *    stored outside public/ must not be directly reachable).
 * 2. Otherwise an auto-generated gradient "book" card with the title on it, so
 *    the store never looks empty or broken.
 */
export default function CoverImage({
  product,
  className = '',
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw',
}: {
  product: CoverSource | Product;
  className?: string;
  sizes?: string;
}) {
  const p = product as CoverSource;
  const hasFile = Boolean(p.cover_path || p.cover_url);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient(p.slug)} ${className}`}>
      {hasFile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.cover_url || `/api/cover/${encodeURIComponent(p.slug)}`}
          alt={`${p.title} — NIFT preparation PDF cover`}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : (
        <FallbackCover product={p} />
      )}
    </div>
  );
}

const PALETTES = [
  'from-brand-600 via-brand-500 to-ink-900',
  'from-ink-900 via-brand-700 to-gold-500',
  'from-mint-600 via-mint-500 to-brand-700',
  'from-gold-500 via-gold-400 to-brand-600',
  'from-ink-800 via-ink-700 to-mint-600',
  'from-brand-700 via-ink-800 to-brand-500',
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function gradient(slug: string) {
  return PALETTES[hash(slug) % PALETTES.length];
}

function FallbackCover({ product }: { product: CoverSource }) {
  const initials = (product.title || 'SP')
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="flex h-full w-full flex-col justify-between p-4 text-white">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
          {product.year || 'NIFT'} PDF
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-extrabold backdrop-blur">
          {initials}
        </span>
      </div>
      <div>
        <p className="line-clamp-3 font-display text-[15px] font-extrabold leading-snug drop-shadow-sm sm:text-base">
          {product.title}
        </p>
        {product.subtitle ? (
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-white/80">{product.subtitle}</p>
        ) : null}
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5Z" />
          </svg>
          {product.pages ? `${product.pages} pages` : 'Instant download'}
        </div>
      </div>
    </div>
  );
}
