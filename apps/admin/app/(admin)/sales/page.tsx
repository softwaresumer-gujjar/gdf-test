export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { RevenueBarChart } from '../../ui/charts';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function SalesPage() {
  const sb = adminClient();
  const { data: orders } = await sb.from('orders').select('id,status,total_pkr,created_at,location_id').order('created_at');
  const safeOrders = orders ?? [];

  const now = new Date();
  const paid = safeOrders.filter(o => o.status !== 'cancelled');

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const revenue = paid.filter(o => {
      const od = new Date(o.created_at);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
    return { month: d.toLocaleDateString('en-PK', { month: 'short' }), revenue };
  });

  const byLocation: Record<string, number> = {};
  paid.forEach(o => {
    const loc = o.location_id ?? 'Unknown';
    byLocation[loc] = (byLocation[loc] ?? 0) + (o.total_pkr ?? 0);
  });

  const thisMonthRev = paid.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);

  const lastMonthRev = paid.filter(o => {
    const d = new Date(o.created_at); const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
  }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);

  const growth = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : '—';
  const allTimeRevenue = paid.reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const maxLocationRev = Math.max(...Object.values(byLocation), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Revenue reports</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'This Month', value: `PKR ${thisMonthRev.toLocaleString()}` },
          { label: 'Last Month', value: `PKR ${lastMonthRev.toLocaleString()}` },
          { label: 'MoM Growth', value: growth === '—' ? '—' : `${growth}%` },
          { label: 'All-Time Revenue', value: `PKR ${allTimeRevenue.toLocaleString()}` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-bold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 pb-3">
          <p className="text-sm font-bold mb-4">Monthly Revenue (12 months)</p>
          <RevenueBarChart data={monthly} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-bold mb-4">Revenue by Location</p>
          {Object.keys(byLocation).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(byLocation).sort((a, b) => b[1] - a[1]).map(([loc, rev]) => (
                <div key={loc}>
                  <div className="flex justify-between mb-1.5 text-[13px]">
                    <span className="font-medium">{loc}</span>
                    <span className="font-bold">PKR {rev.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(rev / maxLocationRev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
