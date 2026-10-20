'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addToCart, isInCart, removeFromCart, type CartLine } from '@/lib/cart';

/**
 * Add-to-cart / Buy-now button.
 * `goToCheckout` sends the student straight to the payment page (the fastest
 * path on mobile), otherwise the item is added and the cart count updates.
 */
export default function AddToCartButton({
  product,
  goToCheckout = true,
  label,
  className = 'btn-primary w-full',
  size = 'md',
}: {
  product: CartLine;
  goToCheckout?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const inCart = typeof window !== 'undefined' ? isInCart(product.id) : false;

  function handleAdd() {
    if (busy) return;
    setBusy(true);
    if (inCart && added) {
      removeFromCart(product.id);
      setAdded(false);
      setBusy(false);
      return;
    }
    addToCart(product);
    setAdded(true);
    window.spTrack?.('add_to_cart', {
      items: [{ item_id: product.slug, item_name: product.title, price: product.price_paise / 100 }],
    });
    if (goToCheckout) {
      router.push('/checkout');
      return;
    }
    setBusy(false);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={busy}
      className={`${className} ${size === 'sm' ? 'btn-sm' : ''} ${added && !goToCheckout ? '!bg-mint-600 !text-white' : ''}`}
      aria-live="polite"
    >
      {busy ? (
        <>
          <Spinner /> Opening checkout…
        </>
      ) : added && !goToCheckout ? (
        <>
          <Check /> Added — view cart
        </>
      ) : inCart ? (
        <>
          <CartGlyph /> {goToCheckout ? 'Checkout' : 'Added to cart'}
        </>
      ) : (
        <>
          <CartGlyph /> {label || (goToCheckout ? 'Buy & download now' : 'Add to cart')}
        </>
      )}
    </button>
  );
}

export function RemoveFromCartButton({ id, className = '' }: { id: string; className?: string }) {
  const [gone, setGone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        removeFromCart(id);
        setGone(true);
      }}
      className={`inline-flex items-center gap-1 text-[12px] font-bold text-ink-400 hover:text-red-600 ${className}`}
      aria-label="Remove from cart"
    >
      {gone ? 'Removed' : 'Remove'}
    </button>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CartGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
