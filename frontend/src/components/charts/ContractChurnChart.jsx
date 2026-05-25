/**
 * Grouped bar chart: contract type vs churn/no-churn counts.
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8125rem',
    }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// Demo fallback data
const DEMO = [
  { contract: 'Month-to-month', churn: 42, retained: 58 },
  { contract: 'One year',       churn: 11, retained: 89 },
  { contract: 'Two year',       churn: 3,  retained: 97 },
]

export default function ContractChurnChart({ data = [] }) {
  const chartData = data.length
    ? data.map(d => ({
        contract: d.contract,
        Churn: d.churn,
        Retained: d.total - d.churn,
      }))
    : DEMO.map(d => ({ contract: d.contract, Churn: d.churn, Retained: d.retained }))

  return (
    <div style={{ width: '100%', minHeight: 240 }}>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="contract" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Legend
          formatter={v => <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{v}</span>}
          iconType="circle" iconSize={8}
        />
        <Bar dataKey="Churn"    fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Retained" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
    </div>
  )
}
