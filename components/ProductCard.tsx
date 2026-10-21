import Link from 'next/link';
import type { Product } from '@/lib/repo';
import { inr, discountPercent, categoryShort } from '@/lib/format';
import CoverImage from './CoverImage';

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const off = discountPercent(product);
  const free = Number(product.price_paise) === 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop">
      <Link href={`/p/${product.slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
          <CoverImage product={product} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/25 to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>
      </Link>

      <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {off > 0 && !free ? (
          <span className="badge bg-gold-400 text-ink-950 shadow">{off}% OFF</span>
        ) : null}
        {free ? <span className="badge bg-mint-500 text-white shadow">FREE</span> : null}
        {product.bestseller ? (
          <span className="badge bg-ink-950 text-white shadow">Bestseller</span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-600">
          <span>{categoryShort(product.category)}</span>
          {product.year ? (
            <>
              <span className="text-ink-200">•</span>
              <span className="text-ink-400">{product.year}</span>
            </>
          ) : null}
        </div>

        <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] font-extrabold leading-snug text-ink-950 sm:text-base">
          <Link href={`/p/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700">
            {product.title}
          </Link>
        </h3>

        {product.subtitle ? <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-ink-600">{product.subtitle}</p> : null}

        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink-500">
          <Stars value={Number(product.rating || 4.8)} />
          <span>{Number(product.rating || 4.8).toFixed(1)}</span>
          {product.rating_count ? <span className="text-ink-300">({product.rating_count})</span> : null}
          {product.downloads_count ? (
            <span className="ml-auto rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-bold text-ink-500">
              {product.downloads_count}+ downloads
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`font-display text-xl font-extrabold ${free ? 'text-mint-600' : 'text-ink-950'}`}>
                {free ? 'Free' : inr(Number(product.price_paise))}
              </span>
              {product.mrp_paise && Number(product.mrp_paise) > Number(product.price_paise) ? (
                <span className="text-[13px] font-semibold text-ink-400 line-through">{inr(Number(product.mrp_paise))}</span>
              ) : null}
            </div>
            <p className="text-[11px] font-semibold text-ink-400">PDF • instant download</p>
          </div>
        </div>
      </div>
      {priority ? <span className="sr-only">Featured product</span> : null}
    </article>
  );
}

export function Stars({ value, className = 'h-3.5 w-3.5' }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`${className} ${value >= i + 0.75 ? 'text-gold-400' : value >= i + 0.25 ? 'text-gold-300' : 'text-ink-200'}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2Z" />
        </svg>
      ))}
    </span>
  );
}
