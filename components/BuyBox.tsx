'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { addToCart, isInCart, removeFromCart, type CartLine } from '@/lib/cart';
import type { Product } from '@/lib/repo';

/**
 * BuyBox — the money button.
 *
 * The primary action always goes to /checkout (the shortest path to a paid
 * download). If the product is already in the basket the label changes so the
 * student is never confused about being charged twice.
 */
export default function BuyBox({ product, compact = false }: { product: Product; compact?: boolean }) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);
  const [busy, setBusy] = useState(false);

  const line: CartLine = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price_paise: Number(product.price_paise),
    mrp_paise: product.mrp_paise ?? null,
    cover_url: product.cover_url,
    cover_path: product.cover_path,
    category: product.category,
  };

  useEffect(() => {
    setInCart(isInCart(product.id));
  }, [product.id]);

  function goCheckout() {
    if (busy) return;
    setBusy(true);
    addToCart(line);
    window.spTrack?.('begin_checkout', {
      value: Number(product.price_paise) / 100,
      currency: 'INR',
      items: [{ item_id: product.slug, item_name: product.title }],
    });
    router.push('/checkout');
  }

  function toggleCart() {
    if (isInCart(product.id)) {
      removeFromCart(product.id);
      setInCart(false);
    } else {
      addToCart(line);
      setInCart(true);
      window.spTrack?.('add_to_cart', {
        items: [{ item_id: product.slug, item_name: product.title, price: Number(product.price_paise) / 100 }],
      });
    }
  }

  const free = Number(product.price_paise) === 0;

  if (compact) {
    return (
      <button type="button" onClick={goCheckout} disabled={busy} className="btn-primary shrink-0 !px-6">
        {busy ? <Spinner /> : <Bolt />}
        {free ? 'Get free PDF' : 'Buy now'}
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
      <button type="button" onClick={goCheckout} disabled={busy} className="btn-primary flex-1 !py-3.5 text-[15px]">
        {busy ? (
          <>
            <Spinner /> Opening secure checkout…
          </>
        ) : (
          <>
            <Bolt /> {free ? 'Get this free PDF' : 'Buy & download instantly'}
          </>
        )}
      </button>
      <button type="button" onClick={toggleCart} className="btn-ghost shrink-0">
        <Cart />
        {inCart ? 'Remove from cart' : 'Add to cart'}
      </button>
    </div>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const Bolt = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
  </svg>
);
const Cart = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
