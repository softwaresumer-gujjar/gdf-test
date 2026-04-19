const FEATURES = [
  { emoji: '🚚', title: 'Daily Delivery',    desc: 'Fresh dairy at your doorstep every morning' },
  { emoji: '🥛', title: '100% Pure',         desc: 'Directly from our farm, no preservatives' },
  { emoji: '💳', title: 'Secure Payment',    desc: 'Safe checkout powered by Stripe' },
  { emoji: '📱', title: 'WhatsApp Support',  desc: 'Chat with us anytime on +92 311 3111111' },
];

export function TrustSection() {
  return (
    <section className="py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
            <span className="text-2xl">{f.emoji}</span>
            <p className="font-semibold text-[13px]">{f.title}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
