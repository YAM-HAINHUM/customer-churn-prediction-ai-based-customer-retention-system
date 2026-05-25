import { useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Cpu } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const TITLES = {
  '/app/dashboard': { title: 'Dashboard',           sub: 'Overview & KPIs' },
  '/app/predict':   { title: 'New Prediction',       sub: 'AI-powered churn analysis' },
  '/app/history':   { title: 'Prediction History',   sub: 'All past predictions' },
  '/app/analytics': { title: 'Insights & Analytics', sub: 'Data visualization' },
  '/app/settings':  { title: 'Settings',             sub: 'Preferences & account' },
  '/app/profile':   { title: 'Profile',              sub: 'Your account details' },
}

export default function Header({ modelReady }) {
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = TITLES[pathname] || { title: 'ChurnPredictor', sub: '' }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header style={{
      height: 56,
      background: 'var(--color-bg-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', gap: '1rem',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Left: Title */}
      <div>
        <h1 style={{
          fontSize: '0.9375rem', fontWeight: 700,
          color: 'var(--color-text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          {page.title}
        </h1>
        {page.sub && (
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
            {page.sub}
          </p>
        )}
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Model status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.3rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: modelReady ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          border: `1px solid ${modelReady ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: modelReady ? 'var(--color-success)' : 'var(--color-danger)',
            boxShadow: modelReady ? '0 0 6px var(--color-success)' : '0 0 6px var(--color-danger)',
            animation: modelReady ? 'pulse 2s ease-in-out infinite' : 'none',
          }} />
          <Cpu size={11} color={modelReady ? 'var(--color-success)' : 'var(--color-danger)'} />
          <span style={{
            fontSize: '0.6875rem', fontWeight: 700,
            color: modelReady ? 'var(--color-success)' : 'var(--color-danger)',
            letterSpacing: '0.02em',
          }}>
            {modelReady ? 'Model Ready' : 'Model Offline'}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 34, height: 34, borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg-card)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

        {/* User avatar — click to go to profile */}
        <button
          onClick={() => navigate('/app/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6875rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em',
            flexShrink: 0, boxShadow: '0 0 10px rgba(30,111,255,0.3)',
          }}>
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
              {user?.email?.split('@')[0] || ''}
            </span>
          </div>
        </button>
      </div>
    </header>
  )
}
