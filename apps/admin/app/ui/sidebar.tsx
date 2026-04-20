'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutGrid, BarChart2, Package, Tag, Layers, ShoppingBag,
  TrendingUp, Users, Mail, Settings, LogOut, Menu, X,
} from 'lucide-react';

const nav = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutGrid },
  { label: 'Analytics',  href: '/analytics',  icon: BarChart2 },
  { label: 'Products',   href: '/products',   icon: Package },
  { label: 'Offers',     href: '/offers',     icon: Tag },
  { label: 'Inventory',  href: '/inventory',  icon: Layers },
  { label: 'Orders',     href: '/orders',     icon: ShoppingBag },
  { label: 'Sales',      href: '/sales',      icon: TrendingUp },
  { label: 'Customer',   href: '/customer',   icon: Users },
  { label: 'Newsletter', href: '/newsletter', icon: Mail },
  { label: 'Settings',   href: '/settings',   icon: Settings },
];

function NavItems({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <nav className="flex-1 flex flex-col gap-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => { void signOut(); }}
        className="mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
      >
        <LogOut size={17} />
        <span>Sign out</span>
      </button>
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="font-black text-[14px] tracking-tight text-foreground">Gujjar Dairy <span className="text-primary font-semibold text-[11px]">Admin</span></span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside className={cn(
        'md:hidden fixed top-0 left-0 z-50 h-full w-[240px] bg-card border-r border-border flex flex-col py-5 px-3 transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="w-9 h-9 rounded-xl shrink-0" />
            <span className="font-black text-[14px] tracking-tight text-foreground leading-tight">Gujjar Dairy<br /><span className="text-primary font-semibold text-[11px]">Admin Panel</span></span>
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-accent transition-colors" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <NavItems onNav={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-[220px] min-h-screen bg-card border-r border-border flex-col py-5 px-3 sticky top-0 shrink-0">
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="w-10 h-10 rounded-xl shrink-0" />
          <span className="font-black text-[15px] tracking-tight text-foreground leading-tight">Gujjar Dairy<br /><span className="text-primary font-semibold text-[11px]">Admin Panel</span></span>
        </div>
        <NavItems />
      </aside>
    </>
  );
}
