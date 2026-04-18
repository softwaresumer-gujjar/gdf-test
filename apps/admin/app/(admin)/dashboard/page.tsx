export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { SalesLineChart, SalesTargetGauge, OrderDonut } from '../../ui/charts';
import Link from 'next/link';

const MONTHLY_TARGET = 500000; // PKR

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function DashboardPage() {
  const sb = adminClient();

  /* ── Metrics ──────────────────────────────────────── */
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
  const totalOrders  = safeOrders.length;
  const pendingDelivery = safeOrders.filter(o => ['paid','dispatched'].includes(o.status)).length;

  /* ── Sales chart data (last 14 days) ─────────────── */
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

  /* ── Order status breakdown ───────────────────────── */
  const statusMap: Record<string, number> = {};
  safeOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
  const donutData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  /* ── Sales target ─────────────────────────────────── */
  const thisMonth = safeOrders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== 'cancelled';
  }).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const targetPct = thisMonth / MONTHLY_TARGET;

  const recentOrders = safeOrders.slice(0, 6);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p className="page-header__sub">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="card-grid card-grid--4" style={{ marginBottom: 24 }}>
        <MetricCard label="Total Revenue" value={`PKR ${totalRevenue.toLocaleString()}`} badge="+12%" up />
        <MetricCard label="Total Orders"  value={String(totalOrders)}  badge="+8%"  up />
        <MetricCard label="Total Customers" value={String(totalCustomers ?? 0)} badge="+5%" up />
        <MetricCard label="Pending Delivery" value={String(pendingDelivery)} badge={pendingDelivery > 10 ? 'High' : 'Normal'} up={false} neutral />
      </div>

      {/* Charts row */}
      <div className="card-grid card-grid--2" style={{ marginBottom: 24 }}>
        {/* Sales analytic */}
        <div className="card" style={{ padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sales Analytic</h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C9A7', display: 'inline-block' }} /> Revenue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} /> Orders
              </span>
            </div>
          </div>
          <SalesLineChart data={chartData} />
        </div>

        {/* Sales target */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sales Target</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <SalesTargetGauge pct={targetPct} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>This month</p>
              <p style={{ fontWeight: 700, fontSize: 18 }}>PKR {thisMonth.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Target: PKR {MONTHLY_TARGET.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="card-grid card-grid--2">
        {/* Top selling products */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Top Selling Products</h3>
            <Link href="/products" className="button button--sm button--secondary">View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(products ?? []).map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#F5F6FA',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 20 }}>🥛</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{p.category ?? 'Milk'}</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>PKR {p.price_pkr.toLocaleString()}</p>
              </div>
            ))}
            {(products ?? []).length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No products yet.</p>}
          </div>
        </div>

        {/* Right column: order donut + recent orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current offers */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Current Offers</h3>
              <Link href="/offers" className="button button--sm button--secondary">Manage</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(offers ?? []).map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--green-light)', borderRadius: 10 }}>
                  <span style={{ fontSize: 22 }}>🏷️</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{o.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{o.code} · {o.discount_percentage}% off</p>
                  </div>
                  <span className="badge badge--active">{o.active ? 'Active' : 'Off'}</span>
                </div>
              ))}
              {(offers ?? []).length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No active offers.</p>}
            </div>
          </div>

          {/* Order status donut */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Order Status</h3>
            {donutData.length > 0
              ? <OrderDonut data={donutData} />
              : <p style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>No orders yet.</p>
            }
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Orders</h3>
          <Link href="/orders" className="button button--sm button--secondary">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: '20px 0' }}>No orders yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Location</th>
                  <th>Status</th><th>Amount</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id.slice(0, 8)}</td>
                    <td>{o.customer_email}</td>
                    <td style={{ color: 'var(--muted)' }}>{o.location_id ?? '—'}</td>
                    <td><span className={`badge badge--${o.status}`}>{o.status}</span></td>
                    <td style={{ fontWeight: 600 }}>PKR {(o.total_pkr ?? 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, badge, up, neutral }: { label: string; value: string; badge: string; up: boolean; neutral?: boolean }) {
  return (
    <div className="card metric-card">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      <span className={`metric-card__badge ${neutral ? 'metric-card__badge--neu' : up ? 'metric-card__badge--up' : 'metric-card__badge--down'}`}>
        {!neutral && (up ? '↑' : '↓')} {badge}
      </span>
    </div>
  );
}
