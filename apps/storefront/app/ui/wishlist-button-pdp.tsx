'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export function WishlistButtonPDP({ productId }: { productId: string }) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    try {
      const w: string[] = JSON.parse(localStorage.getItem('gdf_wishlist') ?? '[]');
      setWishlisted(w.includes(productId));
    } catch { /* ignore */ }
  }, [productId]);

  function toggle() {
    try {
      const w: string[] = JSON.parse(localStorage.getItem('gdf_wishlist') ?? '[]');
      const next = w.includes(productId) ? w.filter((id) => id !== productId) : [...w, productId];
      localStorage.setItem('gdf_wishlist', JSON.stringify(next));
      setWishlisted(!wishlisted);
      window.dispatchEvent(new Event('gdf-wishlist-update'));
    } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={toggle}
      className={`h-12 w-12 rounded-lg border flex items-center justify-center transition-colors ${
        wishlisted
          ? 'border-rose-300 bg-rose-50 text-rose-500'
          : 'border-border bg-card text-muted-foreground hover:text-rose-500 hover:border-rose-300'
      }`}
    >
      <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
    </button>
  );
}
