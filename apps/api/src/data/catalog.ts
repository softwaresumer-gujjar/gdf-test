import type { Product } from '@packages/types';

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Fresh Cow Milk 1L',
    slug: 'fresh-cow-milk-1l',
    description: 'Daily fresh milk delivered chilled.',
    pricePkr: 320,
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200',
    inStock: true
  },
  {
    id: 'p2',
    name: 'Chocolate Flavored Milk 250ml',
    slug: 'chocolate-flavored-milk-250ml',
    description: 'Rich chocolate milk for quick energy.',
    pricePkr: 180,
    imageUrl: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=1200',
    inStock: true
  },
  {
    id: 'p3',
    name: 'Greek Yogurt 500g',
    slug: 'greek-yogurt-500g',
    description: 'Creamy high-protein yogurt.',
    pricePkr: 650,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1200',
    inStock: true
  }
];
