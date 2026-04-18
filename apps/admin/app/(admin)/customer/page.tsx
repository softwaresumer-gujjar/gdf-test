export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Customer = {
  id: string; email: string; name: string | null; phone: string | null;
  total_orders: number; total_spent_pkr: number;
  first_order_at: string | null; last_order_at: string | null; created_at: string;
};

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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

  const metrics = [
    { label: 'Total Customers', value: safeCustomers.length },
    { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}` },
    { label: 'Avg. Orders / Customer', value: avgOrders },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{safeCustomers.length} customers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{m.label}</p>
              <p className="text-2xl font-bold tracking-tight">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Orders</TableHead><TableHead>Total Spent</TableHead><TableHead>First Order</TableHead><TableHead>Last Order</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {safeCustomers.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{(c.name ?? c.email)[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-[13px]">{c.name ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[13px]">{c.phone ?? '—'}</TableCell>
                  <TableCell className="font-semibold text-[13px]">{c.total_orders}</TableCell>
                  <TableCell className="font-bold text-[13px]">PKR {c.total_spent_pkr.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.first_order_at ? new Date(c.first_order_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {safeCustomers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No customers yet. Customers appear here after their first payment.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
