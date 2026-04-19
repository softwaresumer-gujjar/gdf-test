import { notFound } from 'next/navigation';
import type { Product } from '@packages/types';
import { Header } from '../../ui/header';
import { Footer } from '../../ui/footer';
import { TrackView } from '../../ui/track-view';
import { AddToCartPDP } from '../../ui/add-to-cart-pdp';
import { WishlistButtonPDP } from '../../ui/wishlist-button-pdp';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch { return null; }
}

async function getAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${apiUrl}/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as Product[];
  } catch { return []; }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, allProducts] = await Promise.all([getProduct(id), getAllProducts()]);

  if (!product) notFound();

  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header products={allProducts} userEmail={null} />
      <TrackView productId={product.id} />

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/#catalog" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight size={12} />
          {product.category && (
            <>
              <span>{product.category}</span>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* PDP layout */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="bg-card border border-border rounded-lg overflow-hidden aspect-square flex items-center justify-center">
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              : <span className="text-8xl select-none">🥛</span>}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <span className="bg-accent text-accent-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  {product.category}
                </span>
              )}
              {product.featured && (
                <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  ⭐ Featured
                </span>
              )}
              {product.inStock
                ? <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full">✓ In Stock</span>
                : <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2.5 py-1 rounded-full">Out of Stock</span>}
            </div>

            {/* Name & Price */}
            <div>
              <h1 className="text-2xl font-black tracking-tight">{product.name}</h1>
              <p className="text-3xl font-black text-primary mt-2">PKR {product.pricePkr.toLocaleString()}</p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Actions */}
            <div className="flex gap-3">
              <AddToCartPDP product={product} />
              <WishlistButtonPDP productId={product.id} />
            </div>

            {/* Trust indicators */}
            <div className="bg-muted rounded-lg p-4 grid gap-2">
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground"><span>🚚</span> Daily delivery — fresh to your door</p>
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground"><span>🥛</span> 100% pure, no preservatives</p>
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground"><span>📱</span> Questions? WhatsApp +92 311 3111111</p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-bold tracking-tight mb-4">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="h-36 bg-muted flex items-center justify-center overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <span className="text-4xl">🥛</span>}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.category}</p>
                    <p className="font-bold text-primary text-sm mt-1.5">PKR {p.pricePkr.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
