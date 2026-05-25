/** Centered loading spinner with optional message */
export default function LoadingSpinner({ message = 'Loading...', size = 40, fullScreen = false }) {
  const wrapper = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '1rem',
    ...(fullScreen ? { minHeight: '100vh' } : { padding: '3rem' }),
  }
  return (
    <div style={wrapper}>
      <svg
        width={size} height={size} viewBox="0 0 40 40"
        style={{ animation: 'spin 0.85s linear infinite' }}
      >
        <circle
          cx="20" cy="20" r="16"
          fill="none" stroke="var(--color-border)" strokeWidth="3"
        />
        <circle
          cx="20" cy="20" r="16"
          fill="none"
          stroke="url(#spinGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 40"
        />
        <defs>
          <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
      </svg>
      {message && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{message}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
