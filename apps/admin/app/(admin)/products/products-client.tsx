'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, AlertCircle, Eye, EyeOff } from 'lucide-react';

type Product = {
  id: string; name: string; slug: string; description: string | null;
  price_pkr: number; image_url: string | null; image_urls: string[] | null; video_url: string | null;
  in_stock: boolean; stock_count: number; category: string;
  featured: boolean; visible: boolean; created_at: string;
};

const EMPTY: Omit<Product, 'id' | 'created_at'> = {
  name: '', slug: '', description: '', price_pkr: 0, image_url: '',
  image_urls: [], video_url: '', in_stock: true, stock_count: 0, category: 'Milk',
  featured: false, visible: false,
};

const CATEGORIES = ['Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Lassi', 'Other'];

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id' | 'created_at'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const visibleCount = products.filter(p => p.visible).length;

  function openAdd() { setForm(EMPTY); setEditId(null); setError(null); setModal('add'); }
  function openEdit(p: Product) {
    setForm({
      name: p.name, slug: p.slug, description: p.description ?? '', price_pkr: p.price_pkr,
      image_url: p.image_url ?? '', image_urls: p.image_urls ?? [], video_url: p.video_url ?? '', in_stock: p.in_stock,
      stock_count: p.stock_count ?? 0, category: p.category ?? 'Milk',
      featured: p.featured ?? false, visible: p.visible ?? false,
    });
    setEditId(p.id); setError(null); setModal('edit');
  }

  async function toggleVisible(p: Product) {
    setTogglingId(p.id);
    const sb = createClient();
    const { data, error: e } = await sb
      .from('products')
      .update({ visible: !p.visible })
      .eq('id', p.id)
      .select()
      .single();
    if (!e && data) setProducts(prev => prev.map(x => x.id === p.id ? data as Product : x));
    setTogglingId(null);
  }

  async function save() {
    if (!form.name || !form.slug || form.price_pkr <= 0) { setError('Name, slug and price are required.'); return; }
    setSaving(true); setError(null);
    const sb = createClient();
    if (modal === 'add') {
      const { data, error: e } = await sb.from('products').insert([{ ...form }]).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setProducts(prev => [data as Product, ...prev]);
    } else {
      const { data, error: e } = await sb.from('products').update({ ...form }).eq('id', editId!).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setProducts(prev => prev.map(p => p.id === editId ? data as Product : p));
    }
    setSaving(false); setModal(null);
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return;
    const sb = createClient();
    await sb.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  const f = (k: keyof typeof form, v: string | number | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} products &mdash; <span className="text-primary font-semibold">{visibleCount} visible</span> on storefront
          </p>
        </div>
        <Button onClick={openAdd}><Plus size={16} />Add Product</Button>
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-border">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <span>🥛</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-[13px]">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{p.category ?? 'Milk'}</TableCell>
                  <TableCell className="font-semibold text-[13px]">PKR {p.price_pkr.toLocaleString()}</TableCell>
                  <TableCell className="text-[13px]">{p.stock_count ?? 0}</TableCell>
                  <TableCell><Badge variant={p.in_stock ? 'active' : 'inactive'}>{p.in_stock ? 'In Stock' : 'Out of Stock'}</Badge></TableCell>
                  <TableCell>{p.featured ? <span className="text-amber-500 font-bold text-sm">⭐</span> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      title={p.visible ? 'Hide from storefront' : 'Show on storefront'}
                      disabled={togglingId === p.id}
                      onClick={() => void toggleVisible(p)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                        p.visible
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {p.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      {p.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => void del(p.id)}>Del</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal === 'add' ? 'Add Product' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Slug</Label><Input value={form.slug} onChange={e => f('slug', e.target.value)} /></div>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <textarea title="Description" placeholder="Product description…"
                className="flex min-h-[72px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description ?? ''} onChange={e => f('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Price (PKR)</Label><Input type="number" value={form.price_pkr} onChange={e => f('price_pkr', Number(e.target.value))} /></div>
              <div className="grid gap-1.5"><Label>Stock Count</Label><Input type="number" value={form.stock_count} onChange={e => f('stock_count', Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <select title="Category" className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.category} onChange={e => f('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <select title="Status" className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.in_stock ? 'true' : 'false'} onChange={e => f('in_stock', e.target.value === 'true')}>
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
            </div>
            <div className="grid gap-1.5"><Label>Primary Image URL</Label><Input type="url" placeholder="https://…" value={form.image_url ?? ''} onChange={e => f('image_url', e.target.value)} /></div>
            <div className="grid gap-1.5">
              <Label>Additional Images <span className="text-[11px] text-muted-foreground font-normal">(one URL per line, shown in gallery)</span></Label>
              <textarea title="Additional image URLs" placeholder={"https://example.com/img2.jpg\nhttps://example.com/img3.jpg"}
                className="flex min-h-[72px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                value={(form.image_urls ?? []).join('\n')}
                onChange={e => setForm(prev => ({ ...prev, image_urls: e.target.value.split('\n').map(u => u.trim()).filter(Boolean) }))} />
            </div>
            <div className="flex flex-col gap-3 pt-1 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.featured ?? false} onChange={e => f('featured', e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer" />
                <span className="text-sm font-medium">⭐ Mark as Featured</span>
                <span className="text-[11px] text-muted-foreground">(shown in "Our Best")</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.visible ?? false} onChange={e => f('visible', e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer" />
                <span className="text-sm font-medium">👁 Show on storefront</span>
                <span className="text-[11px] text-muted-foreground">(visible to customers)</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
