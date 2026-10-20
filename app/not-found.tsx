import Link from 'next/link';
import { listProducts } from '@/lib/repo';
import ProductGrid from '@/components/ProductGrid';

export default function NotFound() {
  let suggestions: ReturnType<typeof listProducts> = [];
  try {
    suggestions = listProducts({ sort: 'popular', limit: 4 });
  } catch {
    suggestions = [];
  }

  return (
    <div className="container-x py-14 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-6xl font-extrabold text-brand-200">404</p>
        <h1 className="h-display mt-3 text-3xl leading-tight sm:text-4xl">This page does not exist</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">
          The link may be old, or the product may have been renamed. Everything below still works.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/shop" className="btn-ghost">
            Browse all PDFs
          </Link>
          <Link href="/guides" className="btn-ghost">
            Free NIFT guides
          </Link>
          <Link href="/my-downloads" className="btn-ghost">
            My downloads
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[
            { href: '/nift-gat-syllabus-pdf', label: 'NIFT GAT syllabus' },
            { href: '/nift-cat-drawing-practice-pdf', label: 'CAT drawing practice' },
            { href: '/nift-situation-test-material', label: 'Situation Test guide' },
            { href: '/nift-exam-pattern-marks-weightage', label: 'Exam pattern & weightage' },
            { href: '/nift-current-affairs-fashion-gk-pdf', label: 'Current affairs & fashion GK' },
            { href: '/nift-previous-year-question-papers', label: 'Previous year papers' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="chip">
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-14">
          <h2 className="h-display text-center text-2xl">Popular right now</h2>
          <div className="mt-6">
            <ProductGrid products={suggestions} />
          </div>
        </div>
      )}
    </div>
  );
}
