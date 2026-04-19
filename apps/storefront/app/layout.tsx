import './globals.css';
import type { Metadata } from 'next';
import { CartProvider } from './lib/cart-context';

export const metadata: Metadata = {
  title: 'Gujjar Dairy Farmers',
  description: 'Order fresh dairy products with home delivery.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
