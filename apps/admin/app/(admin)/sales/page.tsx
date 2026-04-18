export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
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

  // Monthly (12 months)
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const revenue = paid.filter(o => {
      const od = new Date(o.created_at);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
    return { month: d.toLocaleDateString('en-PK', { month: 'short' }), revenue };
  });

  // Revenue by location
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

  return (
    <div>
      <div className="page-header">
        <div><h1>Sales</h1><p className="page-header__sub">Revenue reports</p></div>
      </div>

      <div className="card-grid card-grid--4" style={{ marginBottom: 24 }}>
        {[
          { label: 'This Month', value: `PKR ${thisMonthRev.toLocaleString()}` },
          { label: 'Last Month', value: `PKR ${lastMonthRev.toLocaleString()}` },
          { label: 'MoM Growth', value: growth === '—' ? '—' : `${growth}%` },
          { label: 'All-Time Revenue', value: `PKR ${paid.reduce((s, o) => s + (o.total_pkr ?? 0), 0).toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="card metric-card">
            <p className="metric-card__label">{label}</p>
            <p className="metric-card__value" style={{ fontSize: 20 }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '20px 20px 12px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Monthly Revenue (12 months)</h3>
        <RevenueBarChart data={monthly} />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Revenue by Location</h3>
        {Object.keys(byLocation).length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No data.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(byLocation).sort((a, b) => b[1] - a[1]).map(([loc, rev]) => {
              const max = Math.max(...Object.values(byLocation));
              return (
                <div key={loc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{loc}</span>
                    <span style={{ fontWeight: 700 }}>PKR {rev.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(rev / max) * 100}%`, background: 'var(--green)', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
