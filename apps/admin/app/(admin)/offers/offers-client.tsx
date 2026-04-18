'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Offer = {
  id: string; title: string; description: string | null;
  discount_percentage: number; code: string | null; active: boolean;
  stock_limit: number | null; used_count: number; expires_at: string | null; created_at: string;
};

const EMPTY = { title: '', description: '', discount_percentage: 10, code: '', active: true, stock_limit: '', expires_at: '' };

export default function OffersClient({ initialOffers }: { initialOffers: Offer[] }) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() { setForm(EMPTY); setEditId(null); setError(null); setModal('add'); }
  function openEdit(o: Offer) {
    setForm({ title: o.title, description: o.description ?? '', discount_percentage: o.discount_percentage,
      code: o.code ?? '', active: o.active, stock_limit: o.stock_limit?.toString() ?? '', expires_at: o.expires_at?.slice(0,10) ?? '' });
    setEditId(o.id); setError(null); setModal('edit');
  }

  async function save() {
    if (!form.title || !form.discount_percentage) { setError('Title and discount are required.'); return; }
    setSaving(true); setError(null);
    const sb = createClient();
    const payload = {
      title: form.title, description: form.description || null,
      discount_percentage: Number(form.discount_percentage),
      code: form.code || null, active: form.active,
      stock_limit: form.stock_limit ? Number(form.stock_limit) : null,
      expires_at: form.expires_at || null,
    };
    if (modal === 'add') {
      const { data, error: e } = await sb.from('offers').insert([payload]).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setOffers(prev => [data as Offer, ...prev]);
    } else {
      const { data, error: e } = await sb.from('offers').update(payload).eq('id', editId!).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      setOffers(prev => prev.map(o => o.id === editId ? data as Offer : o));
    }
    setSaving(false); setModal(null);
  }

  async function toggleActive(id: string, current: boolean) {
    const sb = createClient();
    await sb.from('offers').update({ active: !current }).eq('id', id);
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !current } : o));
  }

  async function del(id: string) {
    if (!confirm('Delete this offer?')) return;
    const sb = createClient();
    await sb.from('offers').delete().eq('id', id);
    setOffers(prev => prev.filter(o => o.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Offers</h1><p className="page-header__sub">{offers.length} offers</p></div>
        <button className="button" onClick={openAdd}>+ New Offer</button>
      </div>

      <div className="card-grid card-grid--3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Offers', value: offers.length },
          { label: 'Active', value: offers.filter(o => o.active).length },
          { label: 'Total Used', value: offers.reduce((s, o) => s + o.used_count, 0) },
        ].map(({ label, value }) => (
          <div key={label} className="card metric-card">
            <p className="metric-card__label">{label}</p>
            <p className="metric-card__value">{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', grid: 'auto / repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {offers.map(o => (
          <div key={o.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{o.title}</p>
                {o.description && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{o.description}</p>}
              </div>
              <span className={`badge ${o.active ? 'badge--active' : 'badge--inactive'}`}>{o.active ? 'Active' : 'Off'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                {o.discount_percentage}% OFF
              </span>
              {o.code && <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>{o.code}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
              Used: {o.used_count}{o.stock_limit ? ` / ${o.stock_limit}` : ''}
              {o.expires_at && ` · Expires ${new Date(o.expires_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="button button--sm button--secondary" onClick={() => openEdit(o)}>Edit</button>
              <button className="button button--sm button--secondary" onClick={() => void toggleActive(o.id, o.active)}>
                {o.active ? 'Deactivate' : 'Activate'}
              </button>
              <button className="button button--sm button--danger" onClick={() => void del(o.id)}>Delete</button>
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state__icon">🏷️</div>
            <p>No offers yet. Create your first discount!</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{modal === 'add' ? 'New Offer' : 'Edit Offer'}</h2>
              <button className="modal__close" onClick={() => setModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {error && <div className="auth-page__alert auth-page__alert--error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-grid">
              <label>Title<input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></label>
              <label>Description<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
              <div className="form-grid--2">
                <label>Discount %<input type="number" min={1} max={100} value={form.discount_percentage} onChange={e => setForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))} /></label>
                <label>Coupon Code<input type="text" placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} /></label>
              </div>
              <div className="form-grid--2">
                <label>Stock Limit<input type="number" placeholder="Unlimited" value={form.stock_limit} onChange={e => setForm(f => ({ ...f, stock_limit: e.target.value }))} /></label>
                <label>Expires At<input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></label>
              </div>
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 10, display: 'flex' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 'auto' }} />
                Active
              </label>
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
