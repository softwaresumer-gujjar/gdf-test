'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutGrid, BarChart2, Package, Tag, Layers, ShoppingBag,
  TrendingUp, Users, Mail, Settings, LogOut,
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-[220px] min-h-screen bg-card border-r border-border flex flex-col py-5 px-3 sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="w-10 h-10 rounded-xl shrink-0" />
        <span className="font-black text-[15px] tracking-tight text-foreground leading-tight">Gujjar Dairy<br/><span className="text-primary font-semibold text-[11px]">Admin Panel</span></span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
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

      {/* Sign out */}
      <button
        type="button"
        onClick={() => { void signOut(); }}
        className="mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
      >
        <LogOut size={17} />
        <span>Sign out</span>
      </button>
    </aside>
  );
}
