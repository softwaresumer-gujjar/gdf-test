'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@packages/types';
import { Package, Heart, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../lib/cart-context';

const CATEGORIES = ['All', 'Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Lassi', 'Other'];
const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc',label: 'Price: High → Low' },
  { value: 'newest',    label: 'Newest' },
  { value: 'name',      label: 'Name A–Z' },
];

/* ── Wishlist hook ─────────────────────────────────────────────── */
function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  useEffect(() => {
    try { setWishlist(JSON.parse(localStorage.getItem('gdf_wishlist') ?? '[]')); } catch { /* ignore */ }
  }, []);

  function toggle(productId: string) {
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem('gdf_wishlist', JSON.stringify(next));
      window.dispatchEvent(new Event('gdf-wishlist-update'));
      return next;
    });
  }
  return { wishlist, toggle };
}

/* ── Recently Viewed hook ──────────────────────────────────────── */
function useRecentlyViewed(products: Product[]) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem('gdf_recently_viewed') ?? '[]')); } catch { /* ignore */ }
  }, []);
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];
}

/* ── Main component ─────────────────────────────────────────────── */
export function ShopClient({ products, userEmail: _userEmail }: { products: Product[]; userEmail: string | null }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('default');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const maxProductPrice = useMemo(() => Math.max(...products.map((p) => p.pricePkr), 1000), [products]);
  const [maxPrice, setMaxPrice] = useState(maxProductPrice);

  useEffect(() => { setMaxPrice(maxProductPrice); }, [maxProductPrice]);

  // Listen for category-select events from CategoryGrid
  useEffect(() => {
    function onCatSelect(e: Event) {
      setCategory((e as CustomEvent<string>).detail);
    }
    window.addEventListener('gdf-category-select', onCatSelect);
    return () => window.removeEventListener('gdf-category-select', onCatSelect);
  }, []);

  const { wishlist, toggle: toggleWishlist } = useWishlist();
  const recentlyViewed = useRecentlyViewed(products);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = category === 'All' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchPrice = p.pricePkr <= maxPrice;
      return matchCat && matchSearch && matchPrice;
    });

    if (sort === 'price-asc')  list = [...list].sort((a, b) => a.pricePkr - b.pricePkr);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.pricePkr - a.pricePkr);
    if (sort === 'newest')     list = [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    if (sort === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, category, search, maxPrice, sort]);

  return (
    <div className="py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">All Products</h2>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            title="Sort products"
            className="h-8 px-2 rounded-lg border border-border bg-card text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button type="button" title="Grid view" onClick={() => setView('grid')}
              className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}>
              <LayoutGrid size={14} />
            </button>
            <button type="button" title="List view" onClick={() => setView('list')}
              className={`p-1.5 transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}>
              <List size={14} />
            </button>
          </div>

          {/* Filter toggle (mobile) */}
          <button type="button" title="Toggle filters" onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent transition-colors">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-card border border-border rounded-lg px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 py-2.5 min-w-max">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* ── Filter sidebar ─────────────────────────────────────── */}
        <aside className={`w-52 shrink-0 flex-col gap-4 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          {/* Search */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Search</p>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Price */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Price Range</p>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-2">
              <span>PKR 0</span>
              <span className="font-semibold text-primary">PKR {maxPrice.toLocaleString()}</span>
            </div>
            <input type="range" min={0} max={maxProductPrice} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              title="Maximum price"
              className="w-full h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer" />
          </div>

          {/* Category */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Category</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={category === cat}
                    onChange={() => setCategory(category === cat ? 'All' : cat)}
                    className="rounded accent-primary w-3.5 h-3.5" />
                  <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <a href="https://wa.me/923113111111" target="_blank" rel="noopener noreferrer"
            className="block w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 px-3 rounded-lg text-center transition-colors">
            📱 Order on WhatsApp
          </a>
        </aside>

        {/* ── Product area ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-lg flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Package size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No products found</p>
              <button type="button"
                onClick={() => { setCategory('All'); setSearch(''); setMaxPrice(maxProductPrice); }}
                className="mt-4 text-xs text-primary underline">Clear filters</button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product}
                  wishlisted={wishlist.includes(product.id)}
                  onWishlist={() => toggleWishlist(product.id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((product) => (
                <ProductListRow key={product.id} product={product}
                  wishlisted={wishlist.includes(product.id)}
                  onWishlist={() => toggleWishlist(product.id)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-10">
          <h3 className="font-bold text-base mb-4">Recently Viewed</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {recentlyViewed.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}
                className="shrink-0 w-36 bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                <div className="h-28 bg-muted flex items-center justify-center overflow-hidden">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    : <span className="text-3xl">🥛</span>}
                </div>
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold truncate">{product.name}</p>
                  <p className="text-[11px] font-bold text-primary mt-0.5">PKR {product.pricePkr.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Product Card (grid) ────────────────────────────────────────── */
function ProductCard({ product, wishlisted, onWishlist }: { product: Product; wishlisted: boolean; onWishlist: () => void }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className={`group bg-card border rounded-lg overflow-hidden transition-all duration-200 ${
      product.inStock
        ? 'border-border hover:shadow-md hover:border-primary/30'
        : 'border-destructive/30 opacity-80'
    }`}>
      <Link href={`/products/${product.id}`}>
        <div className="relative bg-muted h-40 flex items-center justify-center overflow-hidden">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-300 ${product.inStock ? 'group-hover:scale-105' : 'grayscale-[30%]'}`} />
            : <span className="text-5xl select-none">🥛</span>}
          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground text-[11px] font-black px-3 py-1 rounded-full tracking-wide uppercase shadow">
                Out of Stock
              </span>
            </div>
          )}
          {product.inStock && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">Fresh</span>
            </div>
          )}
          {product.featured && product.inStock && (
            <div className="absolute top-2 right-2">
              <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Best</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[13px] font-semibold text-foreground truncate">{product.name}</p>
          {product.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{product.description}</p>
          )}
          <p className={`font-bold text-sm mt-2 ${product.inStock ? 'text-primary' : 'text-muted-foreground'}`}>
            PKR {product.pricePkr.toLocaleString()}
          </p>
        </div>
      </Link>
      <div className="px-3 pb-3 flex items-center gap-2">
        {product.inStock ? (
          <button type="button" onClick={handleAdd}
            className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${
              added ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
            }`}>
            {added ? '✓ Added' : '+ Cart'}
          </button>
        ) : (
          <span className="flex-1 text-[11px] font-bold text-destructive text-center py-1.5 bg-destructive/10 rounded-md border border-destructive/20">
            Out of Stock
          </span>
        )}
        <button type="button" title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} onClick={onWishlist}
          className={`w-8 h-8 rounded-md border flex items-center justify-center transition-colors ${
            wishlisted ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-border bg-card text-muted-foreground hover:text-rose-500 hover:border-rose-300'
          }`}>
          <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}

/* ── Product List Row ────────────────────────────────────────────── */
function ProductListRow({ product, wishlisted, onWishlist }: { product: Product; wishlisted: boolean; onWishlist: () => void }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className={`group bg-card border rounded-lg overflow-hidden transition-all flex ${
      product.inStock ? 'border-border hover:shadow-md hover:border-primary/30' : 'border-destructive/30 opacity-80'
    }`}>
      <Link href={`/products/${product.id}`} className="flex items-center gap-4 flex-1 p-4">
        <div className="relative w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover ${!product.inStock ? 'grayscale-[30%]' : ''}`} />
            : <span className="text-2xl">🥛</span>}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
              <span className="text-white text-[8px] font-black text-center leading-tight px-1">OUT OF<br/>STOCK</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-semibold text-foreground truncate">{product.name}</p>
            {product.featured && product.inStock && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Best</span>}
            {!product.inStock && <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-full border border-destructive/20">Out of Stock</span>}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{product.category}</p>
          {product.description && <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">{product.description}</p>}
        </div>
        <p className={`font-bold text-sm shrink-0 mr-4 ${product.inStock ? 'text-primary' : 'text-muted-foreground'}`}>
          PKR {product.pricePkr.toLocaleString()}
        </p>
      </Link>
      <div className="flex flex-col gap-2 justify-center pr-4">
        {product.inStock ? (
          <button type="button" onClick={handleAdd}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all ${
              added ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}>
            {added ? '✓' : '+ Cart'}
          </button>
        ) : (
          <span className="text-[10px] font-bold text-destructive px-2 py-1 bg-destructive/10 rounded-md border border-destructive/20 text-center">Sold Out</span>
        )}
        <button type="button" title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} onClick={onWishlist}
          className={`w-8 h-8 rounded-md border flex items-center justify-center transition-colors mx-auto ${
            wishlisted ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-border text-muted-foreground hover:text-rose-500'
          }`}>
          <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
