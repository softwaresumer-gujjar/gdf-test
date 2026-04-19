'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@packages/types';

export interface CartItem {
  productId: string;
  name: string;
  pricePkr: number;
  imageUrl: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'gdf_cart_v2';

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from old format if exists
      const legacy = localStorage.getItem('gdf_cart');
      if (legacy) {
        const old = JSON.parse(legacy) as Array<{ productId: string; quantity: number }>;
        // Can't fully migrate without product details — just clear old key
        localStorage.removeItem('gdf_cart');
        return old.map((i) => ({ productId: i.productId, name: '...', pricePkr: 0, imageUrl: '', quantity: i.quantity }));
      }
      return [];
    }
    return JSON.parse(raw) as CartItem[];
  } catch { return []; }
}

function writeCart(items: CartItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(readCart());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function addToCart(product: Product) {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === product.id);
      const next = found
        ? prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { productId: product.id, name: product.name, pricePkr: product.pricePkr, imageUrl: product.imageUrl, quantity: 1 }];
      writeCart(next);
      return next;
    });
  }

  function removeFromCart(productId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      writeCart(next);
      return next;
    });
  }

  function updateQuantity(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return; }
    setItems((prev) => {
      const next = prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i);
      writeCart(next);
      return next;
    });
  }

  function clearCart() {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + i.pricePkr * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
