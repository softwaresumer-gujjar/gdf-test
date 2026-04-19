'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@packages/types';
import { Search, ShoppingCart, Package, Heart, Phone } from 'lucide-react';

const CATEGORIES = ['All', 'Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Lassi', 'Other'];

/* ── Cart helpers ───────────────────────────────────────────── */
function getCart(): Array<{ productId: string; quantity: number }> {
  try {
    const raw = localStorage.getItem('gdf_cart');
    return raw ? (JSON.parse(raw) as Array<{ productId: string; quantity: number }>) : [];
  } catch { return []; }
}

function addToCart(productId: string) {
  const cart = getCart();
  const found = cart.find(i => i.productId === productId);
  if (found) found.quantity += 1;
  else cart.push({ productId, quantity: 1 });
  localStorage.setItem('gdf_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('gdf-cart-update'));
}

/* ── Main component ─────────────────────────────────────────── */
export function ShopClient({ products, userEmail }: { products: Product[]; userEmail: string | null }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cartCount, setCartCount] = useState(0);

  const maxProductPrice = useMemo(() => Math.max(...products.map(p => p.pricePkr), 1000), [products]);
  const [maxPrice, setMaxPrice] = useState(maxProductPrice);

  // sync maxPrice when products load
  useEffect(() => { setMaxPrice(maxProductPrice); }, [maxProductPrice]);

  // cart count from localStorage
  useEffect(() => {
    function sync() {
      setCartCount(getCart().reduce((s, i) => s + i.quantity, 0));
    }
    sync();
    window.addEventListener('gdf-cart-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('gdf-cart-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const filtered = useMemo(() =>
    products.filter(p => {
      const matchCat = category === 'All' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchPrice = p.pricePkr <= maxPrice;
      return matchCat && matchSearch && matchPrice;
    }),
    [products, category, search, maxPrice]
  );

  return (
    <div className="min-h-screen bg-brand-gradient">

      {/* ── Announcement bar ──────────────────────────────────── */}
      <div className="text-center text-white/80 text-xs py-1.5 px-4 border-b border-white/10">
        Home delivery available — WhatsApp{' '}
        <a href="https://wa.me/923113111111" target="_blank" rel="noopener noreferrer" className="underline font-bold text-white">
          +92 311 3111111
        </a>
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="px-5 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-11 w-11 rounded-xl shadow-lg" />
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search dairy products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 shadow"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <a href="tel:+923113111111"
            className="hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition-colors">
            <Phone size={15} />
            <span>+92 311 3111111</span>
          </a>

          {userEmail ? (
            <Link href="/account/orders"
              className="hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition-colors px-3 py-2 rounded-full hover:bg-white/10">
              <Package size={16} />
              <span>My Orders</span>
            </Link>
          ) : (
            <Link href="/login"
              className="text-white/80 hover:text-white text-xs font-medium transition-colors px-3 py-2 rounded-full hover:bg-white/10">
              Sign in
            </Link>
          )}

          {/* Cart */}
          <Link href="/checkout"
            className="relative flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors shadow">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Main white card ────────────────────────────────────── */}
      <div className="mx-4 mb-6 bg-white rounded-3xl overflow-hidden shadow-2xl">

        {/* Category tabs */}
        <div className="border-b border-gray-100 px-5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-3 min-w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[70vh]">

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className="w-52 shrink-0 border-r border-gray-100 p-5 hidden md:block">

            {/* Price Range */}
            <div className="mb-7">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Price Range</h3>
              <div className="flex justify-between text-[11px] text-gray-500 mb-2">
                <span>PKR 0</span>
                <span className="font-semibold text-primary">PKR {maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range" min={0} max={maxProductPrice} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                title="Maximum price filter"
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-primary cursor-pointer"
              />
            </div>

            {/* Category filter */}
            <div className="mb-7">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Category</h3>
              <div className="flex flex-col gap-2.5">
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={category === cat}
                      onChange={() => setCategory(category === cat ? 'All' : cat)}
                      className="rounded accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-[13px] text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/923113111111"
              target="_blank" rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl text-center transition-colors"
            >
              📱 Order on WhatsApp
            </a>
          </aside>

          {/* ── Product grid ────────────────────────────────────── */}
          <main className="flex-1 p-5">
            {/* Results count */}
            <p className="text-xs text-gray-400 mb-4 font-medium">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}
            </p>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                <Package size={48} className="mb-3" />
                <p className="text-sm font-medium">No products found</p>
                <button type="button" onClick={() => { setCategory('All'); setSearch(''); setMaxPrice(maxProductPrice); }}
                  className="mt-4 text-xs text-primary underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} onAdd={() => addToCart(product.id)} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="text-center pb-8 px-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer"
            className="text-white/60 hover:text-white text-xs transition-colors">Facebook</a>
          <span className="text-white/30">·</span>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"
            className="text-white/60 hover:text-white text-xs transition-colors">Instagram</a>
        </div>
        <p className="text-white/40 text-[11px]">© 2026 Gujjar Dairy Farmers — All Rights Reserved.</p>
      </footer>
    </div>
  );
}

/* ── Product card ───────────────────────────────────────────── */
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative bg-gray-50 h-44 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl select-none">🥛</span>
        )}

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          {product.inStock
            ? <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">Fresh</span>
            : <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Out of Stock</span>
          }
        </div>

        {/* Heart */}
        <button type="button" title="Add to favourites"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
          <Heart size={13} className="text-gray-400" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-[13px] font-bold text-gray-800 truncate">{product.name}</p>
        {product.description && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 mb-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-primary text-sm">PKR {product.pricePkr.toLocaleString()}</span>
          {product.inStock && (
            <button
              type="button"
              onClick={handleAdd}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${
                added
                  ? 'bg-green-500 text-white scale-95'
                  : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
              }`}
            >
              {added ? '✓ Added' : '+ Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
