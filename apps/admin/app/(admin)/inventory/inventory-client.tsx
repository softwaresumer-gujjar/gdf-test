'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Product = { id: string; name: string; category: string; stock_count: number; in_stock: boolean; price_pkr: number; image_url: string | null };

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const low = products.filter(p => p.stock_count > 0 && p.stock_count <= 10);
  const out = products.filter(p => p.stock_count === 0);

  async function saveStock(id: string) {
    const val = editing[id]; if (val === undefined) return;
    setSaving(id);
    const sb = createClient();
    await sb.from('products').update({ stock_count: val, in_stock: val > 0 }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_count: val, in_stock: val > 0 } : p));
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSaving(null);
  }

  const metrics = [
    { label: 'Total Products', value: products.length, accent: '' },
    { label: 'Low Stock', value: low.length, accent: 'border-l-4 border-l-amber-400' },
    { label: 'Out of Stock', value: out.length, accent: 'border-l-4 border-l-red-400' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage stock levels</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(m => (
          <Card key={m.label} className={m.accent}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{m.label}</p>
              <p className="text-2xl font-bold tracking-tight">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead>Update Stock</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <span>🥛</span>}
                      </div>
                      <span className="font-semibold text-[13px]">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{p.category ?? 'Milk'}</TableCell>
                  <TableCell className="font-semibold text-[13px]">PKR {p.price_pkr.toLocaleString()}</TableCell>
                  <TableCell className={`font-bold text-[13px] ${p.stock_count === 0 ? 'text-destructive' : p.stock_count <= 10 ? 'text-amber-600' : ''}`}>
                    {p.stock_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.stock_count === 0 ? 'out' : p.stock_count <= 10 ? 'low' : 'active'}>
                      {p.stock_count === 0 ? 'Out of Stock' : p.stock_count <= 10 ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={0} className="w-20 h-7 text-xs"
                        value={editing[p.id] ?? p.stock_count}
                        onChange={e => setEditing(prev => ({ ...prev, [p.id]: Number(e.target.value) }))} />
                      {editing[p.id] !== undefined && editing[p.id] !== p.stock_count && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => void saveStock(p.id)} disabled={saving === p.id}>
                          {saving === p.id ? '…' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No products.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
