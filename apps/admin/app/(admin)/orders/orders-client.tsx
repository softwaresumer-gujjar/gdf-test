'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';

type OrderItem = { id: string; product_name: string; quantity: number; unit_price_pkr: number };
type Order = {
  id: string; customer_email: string; location_id: string | null;
  status: string; total_pkr: number | null; created_at: string;
  stripe_session_id: string | null; order_items: OrderItem[];
};

const STATUSES = ['pending', 'paid', 'dispatched', 'delivered', 'cancelled'];

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const matchSearch = o.customer_email.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    return matchStatus && matchSearch;
  });

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const sb = createClient();
    const { data } = await sb.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    }
    setUpdating(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total orders</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by email or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...STATUSES].map(s => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'}
              onClick={() => setFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-primary cursor-pointer hover:underline" onClick={() => setSelected(o)}>
                      {o.id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px]">{o.customer_email}</TableCell>
                  <TableCell className="text-muted-foreground text-[13px]">{o.location_id ?? '—'}</TableCell>
                  <TableCell><Badge variant={o.status as 'pending' | 'paid' | 'dispatched' | 'delivered' | 'cancelled'}>{o.status}</Badge></TableCell>
                  <TableCell className="font-semibold text-[13px]">PKR {(o.total_pkr ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <select title="Update order status"
                      className="h-7 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={o.status} disabled={updating === o.id}
                      onChange={e => void updateStatus(o.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{selected?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selected && (
            <>
              <div className="grid gap-0">
                {([
                  ['Customer', selected.customer_email],
                  ['Location', selected.location_id ?? '—'],
                  ['Status', selected.status],
                  ['Total', `PKR ${(selected.total_pkr ?? 0).toLocaleString()}`],
                  ['Date', new Date(selected.created_at).toLocaleString('en-PK')],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{k}</span>
                    <span className="text-sm font-semibold capitalize">{v}</span>
                  </div>
                ))}
              </div>
              {selected.order_items?.length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm font-bold">Items</p>
                  <div className="grid gap-1">
                    {selected.order_items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span className="font-semibold">PKR {(item.unit_price_pkr * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <DialogFooter className="items-center">
                <span className="text-sm text-muted-foreground mr-auto">Update status:</span>
                <select title="Update order status"
                  className="h-8 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selected.status} onChange={e => void updateStatus(selected.id, e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
