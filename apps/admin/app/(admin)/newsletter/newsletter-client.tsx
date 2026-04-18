'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Mail, Search } from 'lucide-react';

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
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={40} className="mb-3 text-amber-500 opacity-70" />
            <p className="font-semibold mb-2">Database migration required</p>
            <p className="text-sm text-muted-foreground">Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">supabase/migrations/002_dashboard.sql</code> in Supabase SQL Editor to enable this feature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subscribers.length} subscribers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Subscribers', value: subscribers.length },
          { label: 'Active', value: subscribers.filter(s => s.active).length },
          { label: 'Unsubscribed', value: subscribers.filter(s => !s.active).length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-bold mb-3">Add Subscriber</p>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-2 max-w-sm">
            <Input type="email" placeholder="email@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void add(); }} />
            <Button onClick={() => void add()} disabled={adding}>{adding ? 'Adding…' : 'Add'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="px-4 py-3 border-b border-border">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search subscribers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Subscribed</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-[13px]">{s.email}</TableCell>
                  <TableCell><Badge variant={s.active ? 'active' : 'inactive'}>{s.active ? 'Active' : 'Unsubscribed'}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.subscribed_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => void toggle(s.id, s.active)}>
                        {s.active ? 'Unsubscribe' : 'Resubscribe'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void del(s.id)}>Remove</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Mail size={32} className="mx-auto mb-2 opacity-20" />
                    No subscribers.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
