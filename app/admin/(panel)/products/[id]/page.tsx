import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, listProducts } from '@/lib/repo';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const all = listProducts({ activeOnly: false, limit: 1000 });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
              <li>
                <Link href="/admin/products" className="hover:text-brand-700">
                  Products
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="line-clamp-1 text-ink-900">{product.title}</li>
            </ol>
          </nav>
          <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Edit product</h1>
          <p className="mt-1 text-sm text-ink-600">
            {product.downloads_count} download{product.downloads_count === 1 ? '' : 's'} so far •{' '}
            {product.rating_count} review{product.rating_count === 1 ? '' : 's'} • updated{' '}
            {new Date(product.updated_at).toLocaleString('en-IN')}
          </p>
        </div>
        <Link href={`/p/${product.slug}`} target="_blank" className="btn-ghost btn-sm shrink-0">
          View live page ↗
        </Link>
      </header>

      <ProductForm product={product as never} allProducts={all as never} />
    </div>
  );
}
