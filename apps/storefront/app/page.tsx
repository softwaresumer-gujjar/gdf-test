import type { Product } from '@packages/types';
import { Header } from './ui/header';
import { Footer } from './ui/footer';
import { HeroSection } from './ui/hero-section';
import { PromoStrip } from './ui/promo-strip';
import { CategoryGrid } from './ui/category-grid';
import { ProductSection } from './ui/featured-products';
import { TrustSection } from './ui/trust-section';
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

interface Offer {
  id: string;
  title: string;
  code: string | null;
  discount_percentage: number;
}

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
  const [{ data: { user } }, products, activeOffers] = await Promise.all([
    supabase.auth.getUser(),
    getProducts(),
    getActiveOffers(supabase),
  ]);

  const featured = products.filter((p) => p.featured);
  const newArrivals = [...products]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 8);
  const bestsellers = [...products]
    .sort((a, b) => (a.stockCount ?? 0) - (b.stockCount ?? 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Header products={products} userEmail={user?.email ?? null} />
      <HeroSection />
      <PromoStrip offers={activeOffers} />

      <div className="max-w-screen-xl mx-auto px-4">
        <CategoryGrid />

        {featured.length > 0 && (
          <ProductSection
            title="Our Best"
            subtitle="Handpicked favourites from Gujjar Dairy"
            products={featured}
            viewAllHref="#catalog"
          />
        )}

        <ProductSection
          title="New Arrivals"
          subtitle="Fresh additions to our dairy range"
          products={newArrivals}
          viewAllHref="#catalog"
        />

        {bestsellers.length > 0 && (
          <ProductSection
            title="Bestsellers"
            subtitle="Most popular with our customers"
            products={bestsellers}
            viewAllHref="#catalog"
          />
        )}

        <TrustSection />

        {/* Full catalog */}
        <section id="catalog">
          <ShopClient products={products} userEmail={user?.email ?? null} />
        </section>
      </div>

      <Footer />
    </div>
  );
}
