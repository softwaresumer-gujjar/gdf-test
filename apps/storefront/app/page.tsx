import Link from 'next/link';
import type { LocationOption, Product } from '@packages/types';
import { AddToCartButton } from './ui/add-to-cart-button';
import { fallbackLocations, fallbackProducts } from './lib/fallback-data';
import { createClient } from './lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getLocations(): Promise<LocationOption[]> {
  try {
    const response = await fetch(`${apiUrl}/locations`, { cache: 'no-store' });
    if (!response.ok) return fallbackLocations;
    const data = (await response.json()) as LocationOption[];
    return data.length ? data : fallbackLocations;
  } catch {
    return fallbackLocations;
  }
}

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
  const [{ data: { user } }, locations, products] = await Promise.all([
    supabase.auth.getUser(),
    getLocations(),
    getProducts()
  ]);
  const userEmail = user?.email ?? null;

  return (
    <main>
      {/* Announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-2 px-4 font-sans">
        Home delivery available — WhatsApp us at{' '}
        <a href="https://wa.me/923113111111" target="_blank" rel="noreferrer" className="underline font-bold">
          +92 311 3111111
        </a>
      </div>

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-10 w-10 rounded-xl" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="tel:+923113111111">+92 311 3111111</a>
            </Button>
            {userEmail ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/account/orders">My Orders</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/checkout">Cart / Checkout</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/checkout">Cart / Checkout</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">DO YOU WANT TO GET PURE MILK?</h1>
        <p className="text-lg opacity-80 mb-8">IF YES! COME TO US...</p>
        <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
          <a href="tel:+923113111111">CALL US NOW</a>
        </Button>
      </section>

      {/* Core products */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Our Core Products</h2>
        <div className="grid grid-cols-3 gap-4">
          {['Fresh Milk', 'Yogurt', 'Lassi'].map(name => (
            <Card key={name}>
              <CardContent className="p-5 text-center">
                <p className="font-bold text-primary text-lg">{name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Locations */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-bold mb-4">Delivery Locations</h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-2">
              {locations.map(location => (
                <Badge key={location.id} variant="pill">
                  {location.city} — {location.area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Products */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold mb-6">Featured Products</h2>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {products.map(product => (
            <Card key={product.id}>
              <div className="overflow-hidden rounded-t-xl">
                <img src={product.imageUrl} alt={product.name}
                  className="w-full h-44 object-cover" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-[15px] mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">PKR {product.pricePkr}</span>
                  <AddToCartButton product={product} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10 text-center">
        <h3 className="font-bold text-primary mb-2">Follow Us</h3>
        <p className="text-sm text-muted-foreground">
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Facebook</a>
          {' · '}
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
        </p>
        <p className="text-xs text-muted-foreground mt-4">Copyright © 2026 Gujjar Dairy Farmers — All Rights Reserved.</p>
      </footer>
    </main>
  );
}
