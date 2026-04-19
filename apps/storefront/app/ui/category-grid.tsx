'use client';

const CATEGORIES = [
  { name: 'Milk',   emoji: '🥛' },
  { name: 'Yogurt', emoji: '🫙' },
  { name: 'Cheese', emoji: '🧀' },
  { name: 'Butter', emoji: '🧈' },
  { name: 'Cream',  emoji: '🍦' },
  { name: 'Lassi',  emoji: '🥤' },
  { name: 'Other',  emoji: '📦' },
];

export function CategoryGrid() {
  function selectCategory(cat: string) {
    localStorage.setItem('gdf_filter_category', cat);
    window.dispatchEvent(new CustomEvent('gdf-category-select', { detail: cat }));
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight">Shop by Category</h2>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => selectCategory(cat.name)}
            className="group flex flex-col items-center gap-2 bg-card border border-border rounded-lg p-3 hover:border-primary/40 hover:bg-accent transition-all"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
            <span className="text-[12px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
