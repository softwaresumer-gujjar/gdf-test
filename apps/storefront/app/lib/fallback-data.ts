import type { LocationOption, Product } from '@packages/types';

export const fallbackLocations: LocationOption[] = [
  { id: 'karachi-dha', city: 'Karachi', area: 'DHA', active: true },
  { id: 'karachi-clifton', city: 'Karachi', area: 'Clifton', active: true },
  { id: 'karachi-gulshan', city: 'Karachi', area: 'Gulshan', active: true }
];

export const fallbackProducts: Product[] = [
  {
    id: 'p1',
    name: 'Daily Fresh Milk 1L',
    slug: 'daily-fresh-milk-1l',
    description: 'Pasteurized full-cream milk for daily use.',
    pricePkr: 320,
    imageUrl: 'https://picsum.photos/seed/milkman-milk/800/500',
    inStock: true
  },
  {
    id: 'p2',
    name: 'Chocolate Milk 250ml',
    slug: 'chocolate-milk-250ml',
    description: 'Sweet and chilled flavored milk bottle.',
    pricePkr: 180,
    imageUrl: 'https://picsum.photos/seed/milkman-choco/800/500',
    inStock: true
  },
  {
    id: 'p3',
    name: 'Greek Yogurt 500g',
    slug: 'greek-yogurt-500g',
    description: 'Creamy yogurt tub for breakfast and smoothies.',
    pricePkr: 650,
    imageUrl: 'https://picsum.photos/seed/milkman-yogurt/800/500',
    inStock: true
  }
];