import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={18} color="var(--color-success)" />,
  error:   <XCircle    size={18} color="var(--color-danger)"  />,
  warning: <AlertCircle size={18} color="var(--color-warning)" />,
  info:    <Info        size={18} color="var(--color-accent)"  />,
}

const BORDER_COLORS = {
  success: 'rgba(16,185,129,0.35)',
  error:   'rgba(239,68,68,0.35)',
  warning: 'rgba(245,158,11,0.35)',
  info:    'rgba(0,198,255,0.35)',
}

export default function Toast({ message, type = 'info', onClose }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${BORDER_COLORS[type] || BORDER_COLORS.info}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        minWidth: '280px',
        maxWidth: '400px',
        animation: 'slideIn 0.2s ease',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[type]}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', flex: 1, lineHeight: 1.5 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', padding: '0 0 0 0.25rem', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
