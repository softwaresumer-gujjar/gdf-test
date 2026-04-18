'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ── Sales Line Chart ────────────────────────────────────── */
export function SalesLineChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8C8C9E' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8C8C9E' }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #EAECF0', fontSize: 12 }}
          formatter={(v, name) => [
            name === 'revenue' ? `PKR ${Number(v).toLocaleString()}` : v,
            name === 'revenue' ? 'Revenue' : 'Orders'
          ]}
        />
        <Line type="monotone" dataKey="revenue" stroke="#00C9A7" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="orders"  stroke="#F59E0B" strokeWidth={2}   dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Revenue Bar Chart ───────────────────────────────────── */
export function RevenueBarChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C8C9E' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8C8C9E' }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #EAECF0', fontSize: 12 }}
          formatter={(v: number) => [`PKR ${v.toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="revenue" fill="#00C9A7" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Order Status Donut ──────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', paid: '#00C9A7', dispatched: '#3B82F6',
  delivered: '#10B981', cancelled: '#EF4444',
};

export function OrderDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
          paddingAngle={3} dataKey="value">
          {data.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94A3B8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #EAECF0', fontSize: 12 }}
          formatter={(v: number, name: string) => [v, name]}
        />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ fontSize: 12, color: '#8C8C9E', textTransform: 'capitalize' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Sales Target Radial ─────────────────────────────────── */
export function SalesTargetGauge({ pct }: { pct: number }) {
  const r = 60; const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#F0F0F5" strokeWidth="14" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="#00C9A7" strokeWidth="14"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 80 80)" />
        <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1C1D22">{Math.round(pct * 100)}%</text>
        <text x="80" y="96" textAnchor="middle" fontSize="11" fill="#8C8C9E">of target</text>
      </svg>
    </div>
  );
}
