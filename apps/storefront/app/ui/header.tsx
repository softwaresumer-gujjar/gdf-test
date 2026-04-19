'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Package, Heart, X } from 'lucide-react';
import type { Product } from '@packages/types';
import { useCart } from '../lib/cart-context';
import { MiniCart } from './mini-cart';

interface HeaderProps {
  products: Product[];
  userEmail: string | null;
}

export function Header({ products, userEmail }: HeaderProps) {
  const { cartCount } = useCart();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Wishlist count
  const [wishlistCount, setWishlistCount] = useState(0);
  useEffect(() => {
    function sync() {
      try {
        const w = JSON.parse(localStorage.getItem('gdf_wishlist') ?? '[]') as string[];
        setWishlistCount(w.length);
      } catch { /* ignore */ }
    }
    sync();
    window.addEventListener('gdf-wishlist-update', sync);
    return () => window.removeEventListener('gdf-wishlist-update', sync);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const suggestions = search.trim().length >= 2
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5)
    : [];

  function onSuggestionClick(product: Product) {
    setSearch('');
    setSearchOpen(false);
    router.push(`/products/${product.id}`);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (suggestions.length === 1) {
      onSuggestionClick(suggestions[0]);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        {/* Announcement bar */}
        <div className="text-center text-muted-foreground text-xs py-1.5 px-4 border-b border-border/50 bg-accent/40">
          Home delivery available — WhatsApp{' '}
          <a href="https://wa.me/923113111111" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-primary">
            +92 311 3111111
          </a>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-9 w-9 rounded-lg" />
            <span className="font-black text-[15px] tracking-tight leading-tight hidden sm:block">
              Gujjar Dairy<br />
              <span className="text-primary font-semibold text-[11px]">Fresh Dairy Store</span>
            </span>
          </Link>

          {/* Search with autocomplete */}
          <div className="flex-1 max-w-lg relative" ref={searchRef}>
            <form onSubmit={onSearchSubmit}>
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search dairy products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); } }}
                className="w-full h-9 pl-10 pr-9 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchOpen(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Autocomplete dropdown */}
            {searchOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSuggestionClick(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-sm">🥛</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.category}</p>
                    </div>
                    <p className="text-[13px] font-bold text-primary shrink-0">PKR {p.pricePkr.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {/* Wishlist */}
            <Link href="/#catalog"
              className="relative hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors px-2.5 py-2 rounded-lg hover:bg-accent">
              <Heart size={16} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* My Orders / Sign in */}
            {userEmail ? (
              <Link href="/account/orders"
                className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors px-2.5 py-2 rounded-lg hover:bg-accent">
                <Package size={15} />
                <span>Orders</span>
              </Link>
            ) : (
              <Link href="/login"
                className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors px-2.5 py-2 rounded-lg hover:bg-accent">
                Sign in
              </Link>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MiniCart open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
