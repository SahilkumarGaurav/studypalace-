import type { Product } from '@/lib/repo';
import ProductCard from './ProductCard';
import Link from 'next/link';

export default function ProductGrid({
  products,
  emptyTitle = 'No PDFs here yet',
  emptyText = 'New study material is being uploaded. Check back in a few hours, or browse the full shop.',
  href = '/shop',
  hrefLabel = 'Browse the shop',
}: {
  products: Product[];
  emptyTitle?: string;
  emptyText?: string;
  href?: string;
  hrefLabel?: string;
}) {
  if (!products.length) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-ink-200 bg-white/70 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5Z" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-lg font-extrabold text-ink-950">{emptyTitle}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-600">{emptyText}</p>
        <Link href={href} className="btn-ghost btn-sm mt-5">
          {hrefLabel} →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
