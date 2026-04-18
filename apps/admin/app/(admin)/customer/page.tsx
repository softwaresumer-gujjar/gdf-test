export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

type Customer = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  total_orders: number;
  total_spent_pkr: number;
  first_order_at: string | null;
  last_order_at: string | null;
  created_at: string;
};

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function CustomerPage() {
  const sb = adminClient();
  const { data: customers } = await sb
    .from('customers')
    .select('id,email,name,phone,total_orders,total_spent_pkr,first_order_at,last_order_at,created_at')
    .order('last_order_at', { ascending: false, nullsFirst: false });

  const safeCustomers: Customer[] = customers ?? [];
  const totalRevenue = safeCustomers.reduce((s, c) => s + c.total_spent_pkr, 0);
  const avgOrders = safeCustomers.length
    ? (safeCustomers.reduce((s, c) => s + c.total_orders, 0) / safeCustomers.length).toFixed(1)
    : '0';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="page-header__sub">{safeCustomers.length} customers</p>
        </div>
      </div>

      <div className="card-grid card-grid--3" style={{ marginBottom: 24 }}>
        <div className="card metric-card">
          <p className="metric-card__label">Total Customers</p>
          <p className="metric-card__value">{safeCustomers.length}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-card__label">Total Revenue</p>
          <p className="metric-card__value">PKR {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-card__label">Avg. Orders / Customer</p>
          <p className="metric-card__value">{avgOrders}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>First Order</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {safeCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">
                        {(c.name ?? c.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="customer-name">{c.name ?? '—'}</p>
                        <p className="customer-email">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{c.phone ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{c.total_orders}</td>
                  <td style={{ fontWeight: 700 }}>PKR {c.total_spent_pkr.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {c.first_order_at
                      ? new Date(c.first_order_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {c.last_order_at
                      ? new Date(c.last_order_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
              {safeCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                    No customers yet. Customers appear here after their first payment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
