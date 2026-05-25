import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Calendar, Edit3, Shield, Zap, BarChart3 } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const stats = [
    { label: 'Predictions Made',   value: '—',    color: 'var(--color-primary)' },
    { label: 'Churn Detected',     value: '—',    color: 'var(--color-danger)'  },
    { label: 'Avg Confidence',     value: '—',    color: 'var(--color-success)' },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>

      {/* ── Avatar + Info ── */}
      <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', fontWeight: 800, color: '#fff',
          boxShadow: '0 0 24px rgba(30,111,255,0.35)',
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={profileData.name}
                  onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                {profileData.name || 'User'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                <Mail size={14} />
                {profileData.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                <Calendar size={13} />
                Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
              </div>
            </>
          )}
        </div>

        <button
          className={editing ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setEditing(p => !p)}
          style={{ flexShrink: 0 }}
        >
          {editing ? <><Shield size={15} /> Save</> : <><Edit3 size={15} /> Edit Profile</>}
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <p className="section-title" style={{ marginBottom: '1rem' }}>Recent Activity</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
            { icon: <Zap size={16} />, text: 'High-confidence churn prediction', sub: '2 hours ago', color: 'var(--color-primary)' },
            { icon: <BarChart3 size={16} />, text: 'Analytics report viewed', sub: 'Yesterday', color: 'var(--color-accent)' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.text}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
