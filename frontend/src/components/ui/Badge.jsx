/** Prediction result badge (Churn / Not Churn) with dot indicator */
export default function Badge({ prediction, size = 'md' }) {
  const isChurn = prediction === 'Churn'
  const cls = isChurn ? 'badge-churn' : 'badge-safe'
  const dot = {
    width: size === 'sm' ? 6 : 7,
    height: size === 'sm' ? 6 : 7,
    borderRadius: '50%',
    background: isChurn ? 'var(--color-danger)' : 'var(--color-success)',
    flexShrink: 0,
  }
  return (
    <span className={cls} style={size === 'sm' ? { fontSize: '0.6875rem', padding: '0.15rem 0.5rem' } : {}}>
      <span style={dot} />
      {prediction}
    </span>
  )
}

/** Confidence badge */
export function ConfidenceBadge({ confidence }) {
  const map = {
    High:   'badge-safe',
    Medium: 'badge-warning',
    Low:    'badge-churn',
  }
  return <span className={map[confidence] || 'badge-warning'}>{confidence}</span>
}
