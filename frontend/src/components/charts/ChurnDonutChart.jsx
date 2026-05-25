/**
 * Donut chart showing churn vs not-churn ratio.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
    }}>
      <p style={{ color: d.payload.fill, fontWeight: 600 }}>{d.name}</p>
      <p style={{ color: 'var(--color-text-secondary)' }}>Count: <strong style={{ color: 'var(--color-text-primary)' }}>{d.value}</strong></p>
    </div>
  )
}

export default function ChurnDonutChart({ churnCount = 0, notChurnCount = 0 }) {
  const total = churnCount + notChurnCount
  const churnPct = total ? ((churnCount / total) * 100).toFixed(1) : 0

  const data = [
    { name: 'Churn',    value: churnCount,    fill: '#EF4444' },
    { name: 'Not Churn', value: notChurnCount, fill: '#10B981' },
  ]

  return (
    <div style={{ position: 'relative', height: 200, minHeight: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
            dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
          color: 'var(--color-danger)', letterSpacing: '-0.03em' }}>
          {churnPct}%
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: 2 }}>
          churn rate
        </div>
      </div>
    </div>
  )
}
