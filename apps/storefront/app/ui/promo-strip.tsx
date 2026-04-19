interface Offer {
  id: string;
  title: string;
  code: string | null;
  discount_percentage: number;
}

interface PromoStripProps {
  offers: Offer[];
}

export function PromoStrip({ offers }: PromoStripProps) {
  if (!offers.length) return null;

  return (
    <div className="bg-accent border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 py-2.5">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">Deals</p>
          <div className="flex gap-2 flex-nowrap">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1 shrink-0"
              >
                <span className="text-sm">🏷️</span>
                <span className="text-[12px] font-semibold text-foreground">{offer.title}</span>
                {offer.code && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">
                    {offer.code}
                  </span>
                )}
                <span className="text-[11px] font-bold text-emerald-600">{offer.discount_percentage}% off</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
