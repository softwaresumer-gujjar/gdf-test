'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Product = { id: string; name: string; category: string; stock_count: number; in_stock: boolean; price_pkr: number; image_url: string | null; };

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const low  = products.filter(p => p.stock_count > 0 && p.stock_count <= 10);
  const out  = products.filter(p => p.stock_count === 0);
  const fine = products.filter(p => p.stock_count > 10);

  async function saveStock(id: string) {
    const val = editing[id]; if (val === undefined) return;
    setSaving(id);
    const sb = createClient();
    await sb.from('products').update({ stock_count: val, in_stock: val > 0 }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_count: val, in_stock: val > 0 } : p));
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSaving(null);
  }

  function stockBadge(count: number) {
    if (count === 0) return <span className="badge badge--out">Out of Stock</span>;
    if (count <= 10) return <span className="badge badge--low">Low Stock</span>;
    return <span className="badge badge--active">In Stock</span>;
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Inventory</h1><p className="page-header__sub">Manage stock levels</p></div>
      </div>

      <div className="card-grid card-grid--3" style={{ marginBottom: 24 }}>
        <div className="card metric-card"><p className="metric-card__label">Total Products</p><p className="metric-card__value">{products.length}</p></div>
        <div className="card metric-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <p className="metric-card__label">Low Stock</p><p className="metric-card__value">{low.length}</p>
        </div>
        <div className="card metric-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <p className="metric-card__label">Out of Stock</p><p className="metric-card__value">{out.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Update Stock</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🥛</span>}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category ?? 'Milk'}</td>
                  <td style={{ fontWeight: 600 }}>PKR {p.price_pkr.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: p.stock_count === 0 ? 'var(--danger)' : p.stock_count <= 10 ? 'var(--warning)' : 'var(--text)' }}>
                    {p.stock_count}
                  </td>
                  <td>{stockBadge(p.stock_count)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="number" min={0} value={editing[p.id] ?? p.stock_count}
                        onChange={e => setEditing(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                        style={{ width: 70, padding: '4px 8px', fontSize: 13 }} />
                      {editing[p.id] !== undefined && editing[p.id] !== p.stock_count && (
                        <button className="button button--sm" onClick={() => void saveStock(p.id)} disabled={saving === p.id}>
                          {saving === p.id ? '…' : 'Save'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No products.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
