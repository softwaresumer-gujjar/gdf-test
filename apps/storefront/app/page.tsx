import type { Product } from '@packages/types';
import { ShopClient } from './ui/shop-client';
import { fallbackProducts } from './lib/fallback-data';
import { createClient } from './lib/supabase/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${apiUrl}/products`, { cache: 'no-store' });
    if (!response.ok) return fallbackProducts;
    const data = (await response.json()) as Product[];
    return data.length ? data : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: { user } }, products] = await Promise.all([
    supabase.auth.getUser(),
    getProducts(),
  ]);

  return <ShopClient products={products} userEmail={user?.email ?? null} />;
}
