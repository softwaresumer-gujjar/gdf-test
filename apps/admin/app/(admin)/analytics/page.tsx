export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { RevenueBarChart, SalesLineChart, OrderDonut } from '../../ui/charts';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export default async function AnalyticsPage() {
  const sb = adminClient();
  const { data: orders } = await sb.from('orders').select('id,status,total_pkr,created_at').order('created_at');
  const safeOrders = orders ?? [];

  // Monthly revenue (last 6 months)
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

  // Daily (last 14 days)
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

  // Status breakdown
  const statusMap: Record<string, number> = {};
  safeOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
  const donutData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const totalRevenue = safeOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const avgOrderValue = safeOrders.length ? Math.round(totalRevenue / safeOrders.length) : 0;
  const conversionRate = safeOrders.length ? ((safeOrders.filter(o => o.status !== 'cancelled').length / safeOrders.length) * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="page-header">
        <div><h1>Analytics</h1><p className="page-header__sub">Performance overview</p></div>
      </div>

      <div className="card-grid card-grid--3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}` },
          { label: 'Avg. Order Value', value: `PKR ${avgOrderValue.toLocaleString()}` },
          { label: 'Conversion Rate', value: `${conversionRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="card metric-card">
            <p className="metric-card__label">{label}</p>
            <p className="metric-card__value">{value}</p>
          </div>
        ))}
      </div>

      <div className="card-grid card-grid--2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: '20px 20px 12px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Monthly Revenue</h3>
          <RevenueBarChart data={monthlyData} />
        </div>
        <div className="card" style={{ padding: '20px 20px 12px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Daily Sales (14 days)</h3>
          <SalesLineChart data={dailyData} />
        </div>
      </div>

      <div className="card-grid card-grid--2">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Order Status Breakdown</h3>
          {donutData.length > 0 ? <OrderDonut data={donutData} />
            : <p style={{ color: 'var(--muted)', padding: '20px 0' }}>No orders yet.</p>}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Status Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge badge--${status}`}>{status}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))}
            {donutData.length === 0 && <p style={{ color: 'var(--muted)' }}>No data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
