import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDF Admin',
  description: 'Admin panel for GDF — manage products, orders, and media.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
