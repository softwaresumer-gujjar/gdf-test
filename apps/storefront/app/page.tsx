import Link from 'next/link';
import type { LocationOption, Product } from '@packages/types';
import { AddToCartButton } from './ui/add-to-cart-button';
import { fallbackLocations, fallbackProducts } from './lib/fallback-data';
import { createClient } from './lib/supabase/server';

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
      <div className="top-announcement">
        If you want home delivery service WhatsApp at{' '}
        <a href="https://wa.me/923110068226" target="_blank" rel="noreferrer">+92 311 0068226</a>
      </div>

      <header className="brand-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="brand-title">Pure Dairy Farmers</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="tel:+923110068226" className="button secondary">+92 311 0068226</a>
            {userEmail ? (
              <>
                <Link href="/account/orders" className="button secondary">My Orders</Link>
                <Link href="/checkout" className="button">Cart / Checkout</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="button secondary">Sign in</Link>
                <Link href="/checkout" className="button">Cart / Checkout</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container center">
          <h1>DO YOU WANT TO GET PURE MILK?</h1>
          <p>IF YES! COME TO US...</p>
          <div style={{ marginTop: 18 }}>
            <a className="button" href="tel:+923110068226">LEARN MORE</a>
          </div>
        </div>
      </section>

      <section className="container center">
        <h2 className="section-title">Our Core Products</h2>
        <div className="three-col" style={{ marginTop: 10 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0 }}>Fresh Milk</h3>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0 }}>Yogurt</h3>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0 }}>Lassi</h3>
          </div>
        </div>
      </section>

      <section className="container" style={{ display: 'grid', gap: 12 }}>
        <h2 className="section-title">Select your order type</h2>
        <div className="card" style={{ padding: 16 }}>
          <strong>DELIVERY</strong>
        </div>

        <h2 className="section-title">Please select your location</h2>
        <div className="card" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {locations.map((location) => (
            <span key={location.id} className="pill">
              {location.city} - {location.area}
            </span>
          ))}
        </div>
      </section>

      <section className="container" style={{ display: 'grid', gap: 14 }}>
        <h2 className="section-title">Featured products</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {products.map((product) => (
            <article className="card" key={product.id} style={{ padding: 14 }}>
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10 }} />
              <h3 style={{ marginBottom: 8 }}>{product.name}</h3>
              <p className="muted" style={{ marginTop: 0 }}>{product.description}</p>
              <strong>PKR {product.pricePkr}</strong>
              <div style={{ marginTop: 12 }}>
                <AddToCartButton product={product} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="brand-header" style={{ marginTop: 30 }}>
        <div className="container center" style={{ paddingTop: 26, paddingBottom: 26 }}>
          <h3 style={{ margin: 0, color: '#1f5a35' }}>SOCIAL</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
            {' • '}
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>Copyright © 2026 Pure Dairy Farmers - All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}
