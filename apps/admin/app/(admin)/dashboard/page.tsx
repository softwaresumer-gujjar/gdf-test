export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { SalesLineChart, SalesTargetGauge, OrderDonut } from '../../ui/charts';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MONTHLY_TARGET = 500000;

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function DashboardPage() {
  const sb = adminClient();

  const [
    { data: orders },
    { count: totalCustomers },
    { data: products },
    { data: offers },
  ] = await Promise.all([
    sb.from('orders').select('id,status,total_pkr,created_at,customer_email,location_id').order('created_at', { ascending: false }),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    sb.from('products').select('id,name,price_pkr,image_url,in_stock,stock_count,category').eq('in_stock', true).limit(5),
    sb.from('offers').select('*').eq('active', true).limit(3),
  ]);

  const safeOrders = orders ?? [];
  const totalRevenue = safeOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const pendingDelivery = safeOrders.filter(o => ['paid', 'dispatched'].includes(o.status)).length;

  const now = new Date();
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (13 - i));
    const key = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const dayOrders = safeOrders.filter(o => {
      const od = new Date(o.created_at);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate();
    });
    return {
      date: key,
      revenue: dayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_pkr ?? 0), 0),
      orders: dayOrders.length,
    };
  });

  const statusMap: Record<string, number> = {};
  safeOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
  const donutData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const thisMonth = safeOrders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== 'cancelled';
  }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const targetPct = thisMonth / MONTHLY_TARGET;
  const recentOrders = safeOrders.slice(0, 6);

  const metrics = [
    { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}`, trend: 'up', badge: '+12%' },
    { label: 'Total Orders', value: String(safeOrders.length), trend: 'up', badge: '+8%' },
    { label: 'Total Customers', value: String(totalCustomers ?? 0), trend: 'up', badge: '+5%' },
    { label: 'Pending Delivery', value: String(pendingDelivery), trend: 'neutral', badge: pendingDelivery > 10 ? 'High' : 'Normal' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{m.label}</p>
              <p className="text-[26px] font-bold tracking-tight leading-none">{m.value}</p>
              <div className={`inline-flex items-center gap-1 mt-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                m.trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
                m.trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'
              }`}>
                {m.trend === 'up' && <TrendingUp size={10} />}
                {m.trend === 'down' && <TrendingDown size={10} />}
                {m.trend === 'neutral' && <Minus size={10} />}
                {m.badge}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Sales Analytic</CardTitle>
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Orders</span>
            </div>
          </CardHeader>
          <CardContent className="pb-4"><SalesLineChart data={chartData} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Sales Target</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <SalesTargetGauge pct={targetPct} />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">This month</p>
              <p className="font-bold text-lg">PKR {thisMonth.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Target: PKR {MONTHLY_TARGET.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Selling Products</CardTitle>
            <Button asChild variant="outline" size="sm"><Link href="/products">View all</Link></Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(products ?? []).map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <span>🥛</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.category ?? 'Milk'}</p>
                </div>
                <p className="font-bold text-[13px] shrink-0">PKR {p.price_pkr.toLocaleString()}</p>
              </div>
            ))}
            {(products ?? []).length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Current Offers</CardTitle>
              <Button asChild variant="outline" size="sm"><Link href="/offers">Manage</Link></Button>
            </CardHeader>
            <CardContent className="grid gap-2">
              {(offers ?? []).map(o => (
                <div key={o.id} className="flex items-center gap-3 bg-accent rounded-lg px-3 py-2.5">
                  <span className="text-xl">🏷️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px]">{o.title}</p>
                    <p className="text-[11px] text-muted-foreground">{o.code} · {o.discount_percentage}% off</p>
                  </div>
                  <Badge variant="active">Active</Badge>
                </div>
              ))}
              {(offers ?? []).length === 0 && <p className="text-sm text-muted-foreground">No active offers.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Order Status</CardTitle></CardHeader>
            <CardContent>
              {donutData.length > 0 ? <OrderDonut data={donutData} /> : <p className="text-sm text-muted-foreground py-5">No orders yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Recent Orders</CardTitle>
          <Button asChild variant="outline" size="sm"><Link href="/orders">View all</Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground p-5">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs text-primary">{o.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-[13px]">{o.customer_email}</TableCell>
                    <TableCell className="text-muted-foreground text-[13px]">{o.location_id ?? '—'}</TableCell>
                    <TableCell><Badge variant={o.status as 'pending' | 'paid' | 'dispatched' | 'delivered' | 'cancelled'}>{o.status}</Badge></TableCell>
                    <TableCell className="font-semibold text-[13px]">PKR {(o.total_pkr ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
