import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, History, BarChart3,
  ChevronLeft, ChevronRight, LogOut, Zap, Settings, UserCircle,
  Upload, Shield, Play, Users, TrendingUp, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/app/dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard',    color: '#1E6FFF' },
  { to: '/app/predict',      icon: <BrainCircuit   size={18} />, label: 'Predict',      color: '#00C6FF' },
  { to: '/app/simulator',    icon: <Play           size={18} />, label: 'Simulator',    color: '#10B981' },
  { to: '/app/history',      icon: <History        size={18} />, label: 'History',      color: '#06B6D4' },
  { to: '/app/analytics',    icon: <BarChart3      size={18} />, label: 'Insights',     color: '#F59E0B' },
  { to: '/app/segmentation', icon: <Users          size={18} />, label: 'Segments',     color: '#8B5CF6' },
  { to: '/app/forecast',     icon: <TrendingUp     size={18} />, label: 'Forecast',     color: '#EF4444' },
  { to: '/app/upload',       icon: <Upload         size={18} />, label: 'Upload CSV',   color: '#F97316' },
  { to: '/app/chat',         icon: <MessageSquare  size={18} />, label: 'AI Assistant', color: '#A78BFA' },
]

const BOTTOM_NAV = [
  { to: '/app/admin',    icon: <Shield     size={18} />, label: 'Admin',    color: '#8B5CF6' },
  { to: '/app/profile',  icon: <UserCircle size={18} />, label: 'Profile',  color: '#64748B' },
  { to: '/app/settings', icon: <Settings   size={18} />, label: 'Settings', color: '#64748B' },
]

function NavItem({ item, collapsed }) {
  return (
    <NavLink to={item.to} title={collapsed ? item.label : undefined} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : '0.75rem',
            padding: '0.5625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: isActive ? item.color : 'var(--color-text-secondary)',
            background: isActive ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)` : 'transparent',
            border: isActive ? `1px solid ${item.color}25` : '1px solid transparent',
            boxShadow: isActive ? `0 0 12px ${item.color}15` : 'none',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'var(--color-bg-hover)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }
          }}
        >
          <span style={{ flexShrink: 0 }}>{item.icon}</span>
          {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
          {!collapsed && isActive && (
            <div style={{
              marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
              background: item.color, boxShadow: `0 0 6px ${item.color}`, flexShrink: 0,
            }} />
          )}
        </div>
      )}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }
  const W = collapsed ? 64 : 240
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside style={{
      width: W, minWidth: W, height: '100vh',
      background: 'var(--color-bg-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s ease, min-width 0.22s ease',
      position: 'sticky', top: 0, overflow: 'hidden', zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 18px' : '0 16px',
        borderBottom: '1px solid var(--color-border)',
        gap: 10, overflow: 'hidden',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(30,111,255,0.4)',
        }}>
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontWeight: 800, fontSize: '0.9375rem', letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>ChurnPredictor</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI Analytics
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.625rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {!collapsed && (
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.875rem 0.375rem' }}>
            Navigation
          </div>
        )}
        {NAV_ITEMS.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '0.375rem 0.875rem' }} />

        {!collapsed && (
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.875rem 0.375rem' }}>
            Account
          </div>
        )}
        {BOTTOM_NAV.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} />)}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.625rem 0.5rem' }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 0.875rem', marginBottom: '0.25rem',
            background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 700, color: '#fff',
            }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} title={collapsed ? 'Sign Out' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : '0.75rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '0.5rem 0.875rem',
            background: 'none', border: '1px solid transparent',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'transparent' }}
        >
          <LogOut size={17} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '0.375rem 0.875rem', marginTop: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', borderRadius: 'var(--radius-md)',
            transition: 'background 0.15s, color 0.15s', fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  )
}
