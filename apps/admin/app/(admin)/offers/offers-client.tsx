'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

type Offer = {
  id: string; title: string; description: string | null;
  discount_percentage: number; code: string | null; active: boolean;
  stock_limit: number | null; used_count: number; expires_at: string | null; created_at: string;
};

const EMPTY = { title: '', description: '', discount_percentage: 10, code: '', active: true, stock_limit: '', expires_at: '' };

export default function OffersClient({ initialOffers }: { initialOffers: Offer[] }) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() { setForm(EMPTY); setEditId(null); setError(null); setModal('add'); }
  function openEdit(o: Offer) {
    setForm({ title: o.title, description: o.description ?? '', discount_percentage: o.discount_percentage,
      code: o.code ?? '', active: o.active, stock_limit: o.stock_limit?.toString() ?? '', expires_at: o.expires_at?.slice(0, 10) ?? '' });
    setEditId(o.id); setError(null); setModal('edit');
  }

  async function save() {
    if (!form.title || !form.discount_percentage) { setError('Title and discount are required.'); return; }
    setSaving(true); setError(null);
    const sb = createClient();
    const payload = {
      title: form.title, description: form.description || null,
      discount_percentage: Number(form.discount_percentage),
      code: form.code || null, active: form.active,
      stock_limit: form.stock_limit ? Number(form.stock_limit) : null,
      expires_at: form.expires_at || null,
    };
    if (modal === 'add') {
      const { data, error: e } = await sb.from('offers').insert([payload]).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setOffers(prev => [data as Offer, ...prev]);
    } else {
      const { data, error: e } = await sb.from('offers').update(payload).eq('id', editId!).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setOffers(prev => prev.map(o => o.id === editId ? data as Offer : o));
    }
    setSaving(false); setModal(null);
  }

  async function toggleActive(id: string, current: boolean) {
    const sb = createClient();
    await sb.from('offers').update({ active: !current }).eq('id', id);
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !current } : o));
  }

  async function del(id: string) {
    if (!confirm('Delete this offer?')) return;
    const sb = createClient();
    await sb.from('offers').delete().eq('id', id);
    setOffers(prev => prev.filter(o => o.id !== id));
  }

  const f = <K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{offers.length} offers</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} />New Offer</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Offers', value: offers.length },
          { label: 'Active', value: offers.filter(o => o.active).length },
          { label: 'Total Used', value: offers.reduce((s, o) => s + o.used_count, 0) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {offers.map(o => (
          <Card key={o.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-[15px]">{o.title}</p>
                  {o.description && <p className="text-xs text-muted-foreground mt-0.5">{o.description}</p>}
                </div>
                <Badge variant={o.active ? 'active' : 'inactive'}>{o.active ? 'Active' : 'Off'}</Badge>
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-bold">{o.discount_percentage}% OFF</span>
                {o.code && <span className="bg-muted px-2.5 py-1 rounded-full text-xs font-mono font-bold">{o.code}</span>}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Used: {o.used_count}{o.stock_limit ? ` / ${o.stock_limit}` : ''}
                {o.expires_at && ` · Expires ${new Date(o.expires_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(o)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => void toggleActive(o.id, o.active)}>
                  {o.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => void del(o.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {offers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Tag size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No offers yet. Create your first discount!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === 'add' ? 'New Offer' : 'Edit Offer'}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-1.5"><Label>Title</Label><Input value={form.title} onChange={e => f('title', e.target.value)} /></div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <textarea title="Description" placeholder="Optional description…"
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description} onChange={e => f('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Discount %</Label><Input type="number" min={1} max={100} value={form.discount_percentage} onChange={e => f('discount_percentage', Number(e.target.value))} /></div>
              <div className="grid gap-1.5"><Label>Coupon Code</Label><Input placeholder="e.g. SAVE20" value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Stock Limit</Label><Input type="number" placeholder="Unlimited" value={form.stock_limit} onChange={e => f('stock_limit', e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Expires At</Label><Input type="date" value={form.expires_at} onChange={e => f('expires_at', e.target.value)} /></div>
            </div>
            <label className={cn('flex items-center gap-2 cursor-pointer text-sm font-medium')}>
              <input type="checkbox" checked={form.active} onChange={e => f('active', e.target.checked)} className="rounded" />
              Active
            </label>
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
