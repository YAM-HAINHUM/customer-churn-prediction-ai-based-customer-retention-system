/** KPI stat card with icon, value, label, and optional trend indicator */
export default function StatCard({ icon, label, value, sub, trend, color = 'var(--color-primary)' }) {
  const isPositive = trend > 0
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Icon + trend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
            background: isPositive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)',
          }}>
            {isPositive ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className="stat-number" style={{ marginBottom: '0.25rem' }}>{value}</div>

      {/* Label */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {label}
      </div>

      {/* Sub text */}
      {sub && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
