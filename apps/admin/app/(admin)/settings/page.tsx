'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  function Msg({ msg }: { msg: { type: 'success' | 'error'; text: string } }) {
    return msg.type === 'success'
      ? <div className="flex items-start gap-2 rounded-lg bg-primary/10 text-primary px-3 py-2.5 text-sm mb-4"><CheckCircle size={14} className="mt-0.5 shrink-0" />{msg.text}</div>
      : <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-4"><AlertCircle size={14} className="mt-0.5 shrink-0" />{msg.text}</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and store</p>
      </div>

      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.key
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card className="max-w-lg">
          <CardContent className="p-6">
            <p className="text-[15px] font-bold mb-5">Profile Information</p>
            {profileMsg && <Msg msg={profileMsg} />}
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="grid gap-1.5">
                <Label>Email Address</Label>
                <Input type="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <Button onClick={saveProfile} disabled={profileSaving} className="w-fit">
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'password' && (
        <Card className="max-w-lg">
          <CardContent className="p-6">
            <p className="text-[15px] font-bold mb-5">Change Password</p>
            {pwMsg && <Msg msg={pwMsg} />}
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Current Password</Label>
                <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
              </div>
              <div className="grid gap-1.5">
                <Label>New Password</Label>
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 6 chars)" />
              </div>
              <div className="grid gap-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"
                  onKeyDown={e => { if (e.key === 'Enter') void savePassword(); }} />
              </div>
              <Button onClick={() => void savePassword()} disabled={pwSaving} className="w-fit">
                {pwSaving ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'store' && (
        <Card className="max-w-lg">
          <CardContent className="p-6">
            <p className="text-[15px] font-bold mb-5">Store Configuration</p>
            {storeMsg && <Msg msg={storeMsg} />}
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Store Name</Label>
                <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Store name" />
              </div>
              <div className="grid gap-1.5">
                <Label>Currency</Label>
                <select title="Currency"
                  className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={storeCurrency} onChange={e => setStoreCurrency(e.target.value)}>
                  <option value="PKR">PKR – Pakistani Rupee</option>
                  <option value="USD">USD – US Dollar</option>
                  <option value="EUR">EUR – Euro</option>
                  <option value="GBP">GBP – British Pound</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Contact Email</Label>
                <Input type="email" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} placeholder="store@example.com" />
              </div>
              <div className="grid gap-1.5">
                <Label>Phone Number</Label>
                <Input value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="+92 300 0000000" />
              </div>
              <div className="grid gap-1.5">
                <Label>Store Address</Label>
                <textarea title="Store Address" placeholder="123 Main Street, Lahore, Pakistan" rows={3}
                  className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
              </div>
              <Button onClick={saveStore} disabled={storeSaving} className="w-fit">
                {storeSaving ? 'Saving…' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
