export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RevenueBarChart, SalesLineChart, OrderDonut } from '../../ui/charts';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function AnalyticsPage() {
  const sb = adminClient();
  const { data: orders } = await sb.from('orders').select('id,status,total_pkr,created_at').order('created_at');
  const safeOrders = orders ?? [];

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.toLocaleDateString('en-PK', { month: 'short' });
    const revenue = safeOrders.filter(o => {
      const od = new Date(o.created_at);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status !== 'cancelled';
    }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
    return { month, revenue };
  });

  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (13 - i));
    const date = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const dayOrders = safeOrders.filter(o => {
      const od = new Date(o.created_at);
      return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    });
    return {
      date,
      revenue: dayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_pkr ?? 0), 0),
      orders: dayOrders.length,
    };
  });

  const statusMap: Record<string, number> = {};
  safeOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
  const donutData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const totalRevenue = safeOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const avgOrderValue = safeOrders.length ? Math.round(totalRevenue / safeOrders.length) : 0;
  const conversionRate = safeOrders.length ? ((safeOrders.filter(o => o.status !== 'cancelled').length / safeOrders.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}` },
          { label: 'Avg. Order Value', value: `PKR ${avgOrderValue.toLocaleString()}` },
          { label: 'Conversion Rate', value: `${conversionRate}%` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 pb-3">
            <p className="text-sm font-bold mb-4">Monthly Revenue</p>
            <RevenueBarChart data={monthlyData} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 pb-3">
            <p className="text-sm font-bold mb-4">Daily Sales (14 days)</p>
            <SalesLineChart data={dailyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-bold mb-4">Order Status Breakdown</p>
            {donutData.length > 0
              ? <OrderDonut data={donutData} />
              : <p className="text-sm text-muted-foreground py-5">No orders yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-bold mb-4">Status Summary</p>
            <div className="flex flex-col gap-3">
              {Object.entries(statusMap).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant={status as 'pending' | 'paid' | 'dispatched' | 'delivered' | 'cancelled'}>{status}</Badge>
                  <span className="font-bold text-sm">{count}</span>
                </div>
              ))}
              {donutData.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
