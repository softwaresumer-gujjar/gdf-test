import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export function PageHeader({ backHref = '/', backLabel = 'Back to shop', title }: PageHeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.svg" alt="Gujjar Dairy Farmers" className="h-9 w-9 rounded-lg" />
          <span className="font-black text-[15px] tracking-tight leading-tight hidden sm:block">
            Gujjar Dairy<br />
            <span className="text-primary font-semibold text-[11px]">Fresh Dairy Store</span>
          </span>
        </Link>
        {title && <h1 className="font-bold text-base ml-2 text-foreground">{title}</h1>}
        <Link href={backHref}
          className="ml-auto flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
          <ArrowLeft size={15} />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
