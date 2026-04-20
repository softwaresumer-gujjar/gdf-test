import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Product } from '@packages/types';
import { Header } from './ui/header';
import { Footer } from './ui/footer';
import { PromoStrip } from './ui/promo-strip';
import { CategoryGrid } from './ui/category-grid';
import { ProductSection } from './ui/featured-products';
import { ShopClient } from './ui/shop-client';
import { createClient } from './lib/supabase/server';

const PRODUCT_SELECT = 'id, name, slug, description, price_pkr, image_url, in_stock, category, stock_count, featured, visible, created_at';

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function mapRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? '',
    pricePkr: row.price_pkr as number,
    imageUrl: (row.image_url as string) ?? '',
    inStock: row.in_stock as boolean,
    category: (row.category as string) ?? 'Milk',
    stockCount: (row.stock_count as number) ?? 0,
    featured: (row.featured as boolean) ?? false,
    visible: (row.visible as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

async function getVisibleProducts(): Promise<Product[]> {
  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('in_stock', true)
      .eq('visible', true)
      .order('created_at', { ascending: false });
    if (error || !data?.length) return [];
    return data.map(mapRow);
  } catch {
    return [];
  }
}

/** Returns productIds sorted by total quantity sold, descending */
async function getBestsellerIds(): Promise<string[]> {
  try {
    const sb = adminClient();
    const { data } = await sb
      .from('order_items')
      .select('product_id, quantity');
    if (!data?.length) return [];

    const totals: Record<string, number> = {};
    for (const row of data) {
      if (!row.product_id) continue;
      totals[row.product_id as string] = (totals[row.product_id as string] ?? 0) + (row.quantity as number);
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);
  } catch {
    return [];
  }
}

interface Offer { id: string; title: string; code: string | null; discount_percentage: number; }

async function getActiveOffers(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Offer[]> {
  try {
    const { data } = await supabase
      .from('offers')
      .select('id, title, code, discount_percentage')
      .eq('active', true)
      .limit(5);
    return (data as Offer[]) ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: { user } }, products, bestsellerIds, activeOffers] = await Promise.all([
    supabase.auth.getUser(),
    getVisibleProducts(),
    getBestsellerIds(),
    getActiveOffers(supabase),
  ]);

  const featured = products.filter((p) => p.featured);

  // New Arrivals: visible products sorted by created_at DESC
  const newArrivals = [...products]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 8);

  // Bestsellers: rank by actual units sold from order_items; fall back to stock heuristic
  const bestsellers = bestsellerIds.length > 0
    ? bestsellerIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean)
        .slice(0, 8) as Product[]
    : [...products].sort((a, b) => (b.stockCount ?? 0) - (a.stockCount ?? 0)).slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Header products={products} userEmail={user?.email ?? null} />
      <PromoStrip offers={activeOffers} />

      <div className="max-w-screen-xl mx-auto px-4">
        <CategoryGrid />

        {/* Full catalog — All Products */}
        <section id="catalog">
          <ShopClient products={products} userEmail={user?.email ?? null} />
        </section>

        {featured.length > 0 && (
          <ProductSection
            title="Our Best"
            subtitle="Handpicked favourites from Gujjar Dairy"
            products={featured}
            viewAllHref="#catalog"
          />
        )}

        {newArrivals.length > 0 && (
          <ProductSection
            title="New Arrivals"
            subtitle="Latest additions to our dairy range"
            products={newArrivals}
            viewAllHref="#catalog"
          />
        )}

        {bestsellers.length > 0 && (
          <ProductSection
            title="Bestsellers"
            subtitle="Top sellers based on customer orders"
            products={bestsellers}
            viewAllHref="#catalog"
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
