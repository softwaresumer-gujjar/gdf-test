'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@packages/types';
import { useCart } from '../lib/cart-context';

interface SectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
}

function MiniProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200 shrink-0 w-44">
      <Link href={`/products/${product.id}`}>
        <div className="relative bg-muted h-36 flex items-center justify-center overflow-hidden">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-4xl select-none">🥛</span>}
          <div className="absolute top-2 left-2">
            {product.inStock
              ? <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Fresh</span>
              : <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Out</span>}
          </div>
        </div>
        <div className="p-3">
          <p className="text-[13px] font-semibold text-foreground truncate">{product.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{product.category}</p>
          <p className="font-bold text-primary text-sm mt-1.5">PKR {product.pricePkr.toLocaleString()}</p>
        </div>
      </Link>
      {product.inStock && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleAdd}
            className={`w-full text-[11px] font-semibold py-1.5 rounded-md transition-all ${
              added ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
            }`}
          >
            {added ? '✓ Added' : '+ Cart'}
          </button>
        </div>
      )}
    </div>
  );
}

export function ProductSection({ title, subtitle, products, viewAllHref }: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [products]);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' });
  }

  if (!products.length) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll arrows */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          {viewAllHref && (
            <a href={viewAllHref} className="text-[12px] text-primary font-semibold hover:underline">
              View all →
            </a>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
      >
        {products.map((p) => (
          <MiniProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
