import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, ShieldCheck, Bell, Palette, UserCog } from 'lucide-react'

const TABS = [
  { id: 'general',       icon: <UserCog    size={16} />, label: 'General'       },
  { id: 'theme',         icon: <Palette    size={16} />, label: 'Appearance'    },
  { id: 'notifications', icon: <Bell       size={16} />, label: 'Notifications' },
  { id: 'security',      icon: <ShieldCheck size={16} />, label: 'Security'    },
]

export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>

      {/* ── Tab Bar ── */}
      <div className="card" style={{ padding: '0.375rem', display: 'flex', gap: '0.25rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.5625rem 0.75rem', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
              fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--color-text-secondary)',
              boxShadow: activeTab === tab.id ? '0 2px 12px rgba(30,111,255,0.35)' : 'none',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {activeTab === 'general' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCog size={18} style={{ color: 'var(--color-primary)' }} /> Account Information
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Display Name</label>
              <input className="form-input" value={user?.name || ''} disabled />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={user?.email || ''} disabled />
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
            Profile editing available on the Profile page.
          </p>
        </div>
      )}

      {/* ── Appearance ── */}
      {activeTab === 'theme' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <p className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={18} style={{ color: 'var(--color-primary)' }} /> Appearance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Light Mode', dark: false, icon: <Sun size={22} color="#F59E0B" />, bg: '#FFFFFF', border: '#E2E8F0' },
              { label: 'Dark Mode',  dark: true,  icon: <Moon size={22} color="var(--color-primary)" />, bg: 'var(--color-bg-surface)', border: 'var(--color-border)' },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => { if (isDark !== opt.dark) toggleTheme() }}
                style={{
                  padding: '1.25rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  border: `2px solid ${isDark === opt.dark ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isDark === opt.dark ? 'rgba(30,111,255,0.08)' : 'var(--color-bg-surface)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                  boxShadow: isDark === opt.dark ? '0 0 0 3px rgba(30,111,255,0.15)' : 'none',
                }}
              >
                <div style={{
                  width: 56, height: 40, borderRadius: 8, background: opt.bg,
                  border: `1px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {opt.icon}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isDark === opt.dark ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {opt.label}
                </span>
                {isDark === opt.dark && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{
            marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            fontSize: '0.8125rem', color: 'var(--color-text-muted)',
          }}>
            💡 Theme persists across sessions and applies to all pages.
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} style={{ color: 'var(--color-primary)' }} /> Notifications
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Email alerts for high-risk predictions', defaultChecked: true },
              { label: 'Weekly churn analytics report',          defaultChecked: false },
              { label: 'Model performance updates',              defaultChecked: true  },
            ].map(item => (
              <label key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', cursor: 'pointer',
                background: 'var(--color-bg-surface)',
              }}>
                <input type="checkbox" defaultChecked={item.defaultChecked} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Security ── */}
      {activeTab === 'security' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <p className="section-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} /> Security
          </p>
          <div style={{
            padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
            background: 'var(--color-success-bg)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <ShieldCheck size={18} color="var(--color-success)" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)' }}>Account Secured</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>JWT HS256 · bcrypt hashing · Data isolation</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" style={{ flex: 1 }}>Change Password</button>
            <button className="btn-danger" style={{ flex: 1 }}>Delete Account</button>
          </div>
        </div>
      )}

      {/* ── Sign Out ── */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Sign Out</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>You will be redirected to the landing page</div>
        </div>
        <button className="btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

    </div>
  )
}
