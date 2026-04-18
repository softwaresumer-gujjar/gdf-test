'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type OrderItem = { id: string; product_name: string; quantity: number; unit_price_pkr: number; };
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
    const matchSearch = o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search);
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
    <div>
      <div className="page-header">
        <div><h1>Orders</h1><p className="page-header__sub">{orders.length} total orders</p></div>
      </div>

      {/* Filters */}
      <div className="toolbar">
        <div className="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search by email or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-buttons">
          {['all', ...STATUSES].map(s => (
            <button type="button" key={s}
              className={`button button--sm filter-btn ${filter === s ? '' : 'button--secondary'}`}
              onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Location</th><th>Status</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <span className="orders-table__id" onClick={() => setSelected(o)}>
                      {o.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>{o.customer_email}</td>
                  <td className="orders-table__muted">{o.location_id ?? '—'}</td>
                  <td><span className={`badge badge--${o.status}`}>{o.status}</span></td>
                  <td className="orders-table__amount">PKR {(o.total_pkr ?? 0).toLocaleString()}</td>
                  <td className="orders-table__date">{new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <select
                      aria-label="Update order status"
                      className="orders-table__select"
                      value={o.status}
                      disabled={updating === o.id}
                      onChange={e => void updateStatus(o.id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="orders-table__empty">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Order #{selected.id.slice(0, 8)}</h2>
              <button type="button" aria-label="Close" className="modal__close" onClick={() => setSelected(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="order-detail-grid">
              {([
                ['Customer', selected.customer_email, false],
                ['Location', selected.location_id ?? '—', false],
                ['Status', selected.status, true],
                ['Total', `PKR ${(selected.total_pkr ?? 0).toLocaleString()}`, false],
                ['Date', new Date(selected.created_at).toLocaleString('en-PK'), false],
              ] as [string, string, boolean][]).map(([k, v, capitalize]) => (
                <div key={k} className="order-detail-row">
                  <span className="order-detail-key">{k}</span>
                  <span className={`order-detail-val${capitalize ? ' order-detail-val--capitalize' : ''}`}>{v}</span>
                </div>
              ))}
            </div>
            {selected.order_items?.length > 0 && (
              <>
                <p className="order-items-title">Items</p>
                {selected.order_items.map(item => (
                  <div key={item.id} className="order-item-row">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span className="order-item-price">PKR {(item.unit_price_pkr * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </>
            )}
            <div className="modal__footer">
              <label className="modal__footer-label">
                <span className="modal__footer-label-text">Update status:</span>
                <select
                  aria-label="Update order status"
                  className="orders-table__select"
                  value={selected.status}
                  onChange={e => void updateStatus(selected.id, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
