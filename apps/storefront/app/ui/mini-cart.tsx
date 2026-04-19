'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../lib/cart-context';

interface MiniCartProps {
  open: boolean;
  onClose: () => void;
}

export function MiniCart({ open, onClose }: MiniCartProps) {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-80 bg-card border-l border-border shadow-xl flex flex-col focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <Dialog.Title className="font-bold text-[15px]">Your Cart</Dialog.Title>
              {items.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Your cart is empty</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 text-xs text-primary underline"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-3 bg-muted rounded-lg">
                    {/* Image */}
                    <div className="w-12 h-12 rounded-md bg-card border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-xl">🥛</span>}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{item.name}</p>
                      <p className="text-[11px] text-primary font-bold mt-0.5">
                        PKR {(item.pricePkr * item.quantity).toLocaleString()}
                      </p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-[13px] font-semibold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors self-start mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-5 py-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">PKR {cartTotal.toLocaleString()}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full h-11 bg-primary text-primary-foreground text-sm font-semibold rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                Proceed to Checkout
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
