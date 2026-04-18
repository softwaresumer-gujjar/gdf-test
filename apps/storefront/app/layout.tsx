import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pure Dairy Farmers',
  description: 'Order fresh dairy products with home delivery.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">{children}</body>
    </html>
  );
}
