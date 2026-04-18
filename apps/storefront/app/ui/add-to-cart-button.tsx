'use client';

import { useRouter } from 'next/navigation';
import type { Product } from '@packages/types';
import { Button } from '@/components/ui/button';

type Props = {
  product: Product;
};

export function AddToCartButton({ product }: Props) {
  const router = useRouter();

  return (
    <Button size="sm" onClick={() => {
      const existingRaw = window.localStorage.getItem('gdf_cart');
      const existing = existingRaw ? JSON.parse(existingRaw) as Array<{ productId: string; quantity: number }> : [];

      const found = existing.find((i) => i.productId === product.id);
      if (found) {
        found.quantity += 1;
      } else {
        existing.push({ productId: product.id, quantity: 1 });
      }

      window.localStorage.setItem('gdf_cart', JSON.stringify(existing));
      router.push('/checkout');
    }}>
      Add to cart
    </Button>
  );
}
