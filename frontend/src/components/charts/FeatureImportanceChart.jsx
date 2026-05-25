/**
 * Horizontal bar chart for feature importance scores.
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
    }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>{payload[0]?.payload?.feature}</p>
      <p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
        Score: {payload[0]?.value?.toFixed(1)}
      </p>
    </div>
  )
}

// Color gradient from accent → primary based on rank
const GRADIENT_COLORS = [
  '#00C6FF', '#0EA5E9', '#1E6FFF', '#3B5EFA', '#5A4CF0',
  '#6D3FE8', '#7E34DC', '#8B29CF', '#9320C0', '#9917B0',
]

export default function FeatureImportanceChart({ data = {} }) {
  const chartData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([feature, value]) => ({ feature, value }))

  if (!chartData.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 240, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No feature data available
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: Math.max(240, chartData.length * 32) }}>
    <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 32)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false} tickLine={false} domain={[0, 100]} />
        <YAxis type="category" dataKey="feature"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          width={140} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  )
}
