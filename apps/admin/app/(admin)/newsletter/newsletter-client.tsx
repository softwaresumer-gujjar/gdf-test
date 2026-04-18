'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Subscriber = { id: string; email: string; active: boolean; subscribed_at: string; };

export default function NewsletterClient({ initialSubscribers, migrationNeeded }: { initialSubscribers: Subscriber[]; migrationNeeded: boolean }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));

  async function add() {
    if (!email) return;
    setAdding(true); setError(null);
    const sb = createClient();
    const { data, error: e } = await sb.from('newsletter_subscribers').insert([{ email }]).select().single();
    if (e) { setError(e.message); setAdding(false); return; }
    setSubscribers(prev => [data as Subscriber, ...prev]);
    setEmail(''); setAdding(false);
  }

  async function toggle(id: string, current: boolean) {
    const sb = createClient();
    await sb.from('newsletter_subscribers').update({ active: !current }).eq('id', id);
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s));
  }

  async function del(id: string) {
    if (!confirm('Remove subscriber?')) return;
    const sb = createClient();
    await sb.from('newsletter_subscribers').delete().eq('id', id);
    setSubscribers(prev => prev.filter(s => s.id !== id));
  }

  if (migrationNeeded) {
    return (
      <div>
        <div className="page-header"><h1>Newsletter</h1></div>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Database migration required</p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Run <code>supabase/migrations/002_dashboard.sql</code> in Supabase SQL Editor to enable this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Newsletter</h1><p className="page-header__sub">{subscribers.length} subscribers</p></div>
      </div>

      <div className="card-grid card-grid--3" style={{ marginBottom: 24 }}>
        <div className="card metric-card"><p className="metric-card__label">Total Subscribers</p><p className="metric-card__value">{subscribers.length}</p></div>
        <div className="card metric-card"><p className="metric-card__label">Active</p><p className="metric-card__value">{subscribers.filter(s => s.active).length}</p></div>
        <div className="card metric-card"><p className="metric-card__label">Unsubscribed</p><p className="metric-card__value">{subscribers.filter(s => !s.active).length}</p></div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add Subscriber</h3>
        {error && <div className="auth-page__alert auth-page__alert--error" style={{ marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void add(); }}
            style={{ maxWidth: 340 }} />
          <button className="button" onClick={() => void add()} disabled={adding}>{adding ? 'Adding…' : 'Add'}</button>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search subscribers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Email</th><th>Status</th><th>Subscribed</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td><span className={`badge ${s.active ? 'badge--active' : 'badge--inactive'}`}>{s.active ? 'Active' : 'Unsubscribed'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(s.subscribed_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="button button--sm button--secondary" onClick={() => void toggle(s.id, s.active)}>{s.active ? 'Unsubscribe' : 'Resubscribe'}</button>
                      <button className="button button--sm button--danger" onClick={() => void del(s.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No subscribers.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
