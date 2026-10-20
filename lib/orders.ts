import {
  getProductById,
  getOrderByToken,
  listOrderItems,
  type Order,
  type Product,
} from './repo';

/**
 * A single file the buyer is entitled to download.
 */
export interface Downloadable {
  product_id: string;
  slug: string;
  title: string;
  category?: string | null;
  file_name: string;
  file_path: string | null;
  file_url: string | null;
  file_size: number;
  fromBundle?: string | null;
}

/**
 * Resolve every file an order unlocks.
 *
 * Normal products map 1:1 to their PDF. A bundle expands into each product
 * listed in `bundle_ids`, so a student who buys "Complete NIFT 2027 Pack" gets
 * every file inside it without paying again.
 */
export function resolveDownloads(order: Order | null): Downloadable[] {
  if (!order || order.payment_status !== 'paid') return [];

  const items = listOrderItems(order.id);
  const out: Downloadable[] = [];
  const seen = new Set<string>();

  const push = (p: Product, fromBundle?: string | null) => {
    if (!p.file_path && !p.file_url) return;
    if (seen.has(p.id)) return;
    seen.add(p.id);
    out.push({
      product_id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      file_name: p.file_name || `${p.slug}.pdf`,
      file_path: p.file_path || null,
      file_url: p.file_url || null,
      file_size: Number(p.file_size || 0),
      fromBundle: fromBundle || null,
    });
  };

  for (const item of items) {
    const product = getProductById(item.product_id);
    if (!product) continue;
    push(product);

    if (Number(product.is_bundle) && product.bundle_ids) {
      const ids = product.bundle_ids
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const id of ids) {
        const child = getProductById(id);
        if (child) push(child, product.title);
      }
    }
  }

  return out;
}

export function findDownloadable(order: Order | null, productId: string): Downloadable | null {
  return resolveDownloads(order).find((d) => d.product_id === productId) || null;
}
