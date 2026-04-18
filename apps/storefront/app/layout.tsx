import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Milkman Storefront',
  description: 'Order fresh dairy with delivery flow.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
