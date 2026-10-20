import { listProducts } from '@/lib/repo';
import ProductManager from '@/components/admin/ProductManager';
import type { AdminProduct } from '@/components/admin/ProductManager';

export const dynamic = 'force-dynamic';

export default function AdminProductsPage() {
  // The DB row shape and the admin UI shape are identical; the cast keeps the
  // client component free of server-only imports.
  const products = listProducts({ activeOnly: false, sort: 'newest', limit: 1000 }) as unknown as AdminProduct[];
  return <ProductManager products={products} />;
}
