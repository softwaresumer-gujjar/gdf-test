'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@packages/types';
import { useCart } from '../lib/cart-context';

export function AddToCartPDP({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return (
      <div className="flex-1 h-12 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground font-medium">
        Out of Stock
      </div>
    );
  }

  function handle() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handle}
      className={`flex-1 h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
        added
          ? 'bg-green-500 text-white'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
      }`}
    >
      <ShoppingCart size={16} />
      {added ? '✓ Added to cart' : 'Add to Cart'}
    </button>
  );
}
