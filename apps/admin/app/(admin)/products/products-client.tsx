'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Product = {
  id: string; name: string; slug: string; description: string | null;
  price_pkr: number; image_url: string | null; video_url: string | null;
  in_stock: boolean; stock_count: number; category: string; created_at: string;
};

const EMPTY: Omit<Product, 'id' | 'created_at'> = {
  name: '', slug: '', description: '', price_pkr: 0, image_url: '',
  video_url: '', in_stock: true, stock_count: 0, category: 'Milk',
};

const CATEGORIES = ['Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Other'];

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id' | 'created_at'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm(EMPTY); setEditId(null); setError(null); setModal('add'); }
  function openEdit(p: Product) {
    setForm({ name: p.name, slug: p.slug, description: p.description ?? '', price_pkr: p.price_pkr,
      image_url: p.image_url ?? '', video_url: p.video_url ?? '', in_stock: p.in_stock,
      stock_count: p.stock_count ?? 0, category: p.category ?? 'Milk' });
    setEditId(p.id); setError(null); setModal('edit');
  }

  async function save() {
    if (!form.name || !form.slug || form.price_pkr <= 0) {
      setError('Name, slug and price are required.'); return;
    }
    setSaving(true); setError(null);
    const sb = createClient();
    if (modal === 'add') {
      const { data, error: e } = await sb.from('products').insert([{ ...form }]).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setProducts(prev => [data as Product, ...prev]);
    } else {
      const { data, error: e } = await sb.from('products').update({ ...form }).eq('id', editId!).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setProducts(prev => prev.map(p => p.id === editId ? data as Product : p));
    }
    setSaving(false); setModal(null);
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return;
    const sb = createClient();
    await sb.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Products</h1><p className="page-header__sub">{products.length} products</p></div>
        <button className="button" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🥛</span>}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td>{p.category ?? 'Milk'}</td>
                  <td style={{ fontWeight: 600 }}>PKR {p.price_pkr.toLocaleString()}</td>
                  <td>{p.stock_count ?? 0}</td>
                  <td><span className={`badge ${p.in_stock ? 'badge--active' : 'badge--inactive'}`}>{p.in_stock ? 'In Stock' : 'Out of Stock'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="button button--sm button--secondary" onClick={() => openEdit(p)}>Edit</button>
                      <button className="button button--sm button--danger" onClick={() => void del(p.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{modal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
              <button className="modal__close" onClick={() => setModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {error && <div className="auth-page__alert auth-page__alert--error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-grid">
              <div className="form-grid--2">
                <label>Name<input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
                <label>Slug<input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></label>
              </div>
              <label>Description<textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
              <div className="form-grid--2">
                <label>Price (PKR)<input type="number" value={form.price_pkr} onChange={e => setForm(f => ({ ...f, price_pkr: Number(e.target.value) }))} /></label>
                <label>Stock Count<input type="number" value={form.stock_count} onChange={e => setForm(f => ({ ...f, stock_count: Number(e.target.value) }))} /></label>
              </div>
              <div className="form-grid--2">
                <label>Category
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Status
                  <select value={form.in_stock ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, in_stock: e.target.value === 'true' }))}>
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </label>
              </div>
              <label>Image URL<input type="url" value={form.image_url ?? ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></label>
            </div>
            <div className="modal__footer">
              <button className="button button--secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="button" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
