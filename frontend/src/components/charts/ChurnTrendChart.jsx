/**
 * Area chart showing churn vs total predictions over the last 30 days.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8125rem',
    }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function ChurnTrendChart({ data = [] }) {
  // Generate demo data if empty
  const chartData = data.length ? data : Array.from({ length: 14 }, (_, i) => ({
    date: format(new Date(Date.now() - (13 - i) * 86400000), 'MMM d'),
    total: Math.floor(Math.random() * 12 + 3),
    churn: Math.floor(Math.random() * 6 + 1),
  }))

  const formatted = chartData.map(d => ({
    ...d,
    date: d.date?.length > 6 ? format(new Date(d.date), 'MMM d') : d.date,
  }))

  return (
    <div style={{ width: '100%', minHeight: 240 }}>
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1E6FFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1E6FFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradChurn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={v => <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{v}</span>}
          iconType="circle" iconSize={8}
        />
        <Area type="monotone" dataKey="total" name="Total" stroke="#1E6FFF" strokeWidth={2}
          fill="url(#gradTotal)" dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="churn" name="Churn"  stroke="#EF4444" strokeWidth={2}
          fill="url(#gradChurn)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  )
}
