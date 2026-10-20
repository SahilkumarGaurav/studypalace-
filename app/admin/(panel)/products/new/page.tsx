import { listProducts } from '@/lib/repo';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  const all = listProducts({ activeOnly: false, limit: 1000 });
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Add a product</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
          Upload the PDF, set a price, write what is inside. The moment you save it appears on the shop page, its
          category page and <code>sitemap.xml</code>.
        </p>
      </header>
      <ProductForm allProducts={all as never} />
    </div>
  );
}
