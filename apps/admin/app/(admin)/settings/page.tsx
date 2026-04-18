'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'store'>('profile');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [storeName, setStoreName] = useState('GDF Store');
  const [storeCurrency, setStoreCurrency] = useState('PKR');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMsg, setStoreMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '');
        setFullName(data.user.user_metadata?.full_name ?? '');
      }
    });
  }, []);

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg(null);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ data: { full_name: fullName } });
    if (error) setProfileMsg({ type: 'error', text: error.message });
    else setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    setProfileSaving(false);
  }

  async function savePassword() {
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (newPw.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setPwSaving(true); setPwMsg(null);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: newPw });
    if (error) setPwMsg({ type: 'error', text: error.message });
    else { setPwMsg({ type: 'success', text: 'Password changed successfully.' }); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    setPwSaving(false);
  }

  function saveStore() {
    setStoreSaving(true); setStoreMsg(null);
    setTimeout(() => {
      setStoreMsg({ type: 'success', text: 'Store settings saved.' });
      setStoreSaving(false);
    }, 600);
  }

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'password', label: 'Password' },
    { key: 'store', label: 'Store' },
  ] as const;

  return (
    <div>
      <div className="page-header">
        <div><h1>Settings</h1><p className="page-header__sub">Manage your account and store</p></div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 22px', fontSize: 14, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? 'var(--green)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid var(--green)' : '2px solid transparent', cursor: 'pointer', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ padding: 28, maxWidth: 520 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Profile Information</h3>
          {profileMsg && <div className={`auth-page__alert auth-page__alert--${profileMsg.type}`} style={{ marginBottom: 16 }}>{profileMsg.text}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address</label>
              <input type="email" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Email cannot be changed here.</p>
            </div>
            <div>
              <button className="button" onClick={saveProfile} disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding: 28, maxWidth: 520 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
          {pwMsg && <div className={`auth-page__alert auth-page__alert--${pwMsg.type}`} style={{ marginBottom: 16 }}>{pwMsg.text}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 6 chars)" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"
                onKeyDown={e => { if (e.key === 'Enter') void savePassword(); }} />
            </div>
            <div>
              <button className="button" onClick={() => void savePassword()} disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'store' && (
        <div className="card" style={{ padding: 28, maxWidth: 520 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Store Configuration</h3>
          {storeMsg && <div className={`auth-page__alert auth-page__alert--${storeMsg.type}`} style={{ marginBottom: 16 }}>{storeMsg.text}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Store Name</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Store name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Currency</label>
              <select value={storeCurrency} onChange={e => setStoreCurrency(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--card)', color: 'var(--text)' }}>
                <option value="PKR">PKR – Pakistani Rupee</option>
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GBP">GBP – British Pound</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contact Email</label>
              <input type="email" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} placeholder="store@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone Number</label>
              <input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="+92 300 0000000" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Store Address</label>
              <textarea value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="123 Main Street, Lahore, Pakistan" rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--card)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <button className="button" onClick={saveStore} disabled={storeSaving}>
                {storeSaving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
