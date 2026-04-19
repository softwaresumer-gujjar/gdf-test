export function HeroSection() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-screen-xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
        {/* Text */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold mb-4">
            <span>🥛</span> Farm Fresh • Daily Delivery • 100% Pure
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-3">
            Farm Fresh Dairy,<br />Delivered Daily
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-base max-w-md mb-6 leading-relaxed">
            Pure cow milk and premium dairy products — straight from our farm to your door. No preservatives, no additives.
          </p>
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-colors shadow-sm"
            >
              Shop Now →
            </a>
            <a
              href="https://wa.me/923113111111"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-white/25 transition-colors"
            >
              📱 Order on WhatsApp
            </a>
          </div>
          {/* Stats */}
          <div className="flex gap-6 mt-8 justify-center md:justify-start">
            <div>
              <p className="text-xl font-black">100%</p>
              <p className="text-[11px] text-primary-foreground/70">Pure & Natural</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-xl font-black">Daily</p>
              <p className="text-[11px] text-primary-foreground/70">Fresh Delivery</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-xl font-black">PKR 0</p>
              <p className="text-[11px] text-primary-foreground/70">Delivery Fee</p>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white/10 flex items-center justify-center text-8xl md:text-9xl select-none">
              🥛
            </div>
            <div className="absolute -top-3 -right-3 bg-white rounded-full px-3 py-1.5 text-xs font-black text-primary shadow-lg">
              Fresh Today
            </div>
            <div className="absolute -bottom-3 -left-3 bg-orange-400 rounded-full px-3 py-1.5 text-xs font-black text-white shadow-lg">
              Farm to Door
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
