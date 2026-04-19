import Link from 'next/link';
import { Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-8">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-9 w-9 rounded-lg" />
              <span className="font-black text-[14px] tracking-tight leading-tight">
                Gujjar Dairy<br />
                <span className="text-primary font-semibold text-[11px]">Farmers</span>
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Farm fresh dairy products delivered daily to your doorstep. Pure, natural, and nutritious.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Shop</p>
            <ul className="space-y-2">
              {['Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Lassi'].map((cat) => (
                <li key={cat}>
                  <Link href={`/?category=${cat}`} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Account</p>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link href="/signup" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Create Account</Link></li>
              <li><Link href="/account/orders" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">My Orders</Link></li>
              <li><Link href="/checkout" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Checkout</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Contact</p>
            <ul className="space-y-2">
              <li>
                <a href="https://wa.me/923113111111" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  <span>📱</span> WhatsApp
                </a>
              </li>
              <li>
                <a href="tel:+923113111111"
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  <Phone size={13} /> +92 311 3111111
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer"
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">© 2026 Gujjar Dairy Farmers — All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">🔒 Secure Checkout</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">🚚 Daily Delivery</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">🥛 Farm Fresh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
