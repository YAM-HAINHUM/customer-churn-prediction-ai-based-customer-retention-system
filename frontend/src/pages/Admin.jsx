/**
 * Admin — System-wide stats, model performance, user activity, and retrain trigger.
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Users, BarChart3, RefreshCw, Activity,
  TrendingUp, AlertTriangle, Cpu, CheckCircle, Clock,
} from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import { formatNum, formatPct } from '../utils/format'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function StatTile({ icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid var(--color-border)`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)',
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, marginBottom: '0.875rem',
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem' }}>{label}</div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
    }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        {payload[0].value} predictions
      </p>
    </div>
  )
}

export default function Admin() {
  const { showToast } = useToast()
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [retraining, setRetraining] = useState(false)

  useEffect(() => {
    predictionsAPI.adminStats()
      .then(setStats)
      .catch(() => showToast('Failed to load admin stats', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleRetrain = async () => {
    setRetraining(true)
    try {
      const res = await predictionsAPI.retrain()
      showToast(res.message || 'Retraining started!', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Retrain failed', 'error')
    } finally {
      setTimeout(() => setRetraining(false), 3000)
    }
  }

  if (loading) return <LoadingSpinner message="Loading admin panel…" />

  const s = stats || {}
  const m = s.model_info?.test_metrics || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(30,111,255,0.06))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-xl)', padding: '1.5rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Shield size={16} color="#8B5CF6" />
            <span style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Admin Panel
            </span>
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            System Overview
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Platform-wide statistics, model performance, and system controls
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleRetrain}
          disabled={retraining}
          style={{ background: retraining ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
        >
          <RefreshCw size={15} style={retraining ? { animation: 'spin 1s linear infinite' } : {}} />
          {retraining ? 'Retraining…' : 'Retrain Model'}
        </button>
      </motion.div>

      {/* ── KPI Tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatTile icon={<Users size={18} />}         label="Total Users"         value={formatNum(s.total_users ?? 0)}         color="#8B5CF6" delay={0.05} />
        <StatTile icon={<Activity size={18} />}      label="Total Predictions"   value={formatNum(s.total_predictions ?? 0)}   color="#1E6FFF" delay={0.1}  />
        <StatTile icon={<TrendingUp size={18} />}    label="Churn Predictions"   value={formatNum(s.churn_predictions ?? 0)}   color="#EF4444" delay={0.15} />
        <StatTile icon={<AlertTriangle size={18} />} label="High Risk"           value={formatNum(s.high_risk_count ?? 0)}     color="#F59E0B" delay={0.2}  />
        <StatTile icon={<Users size={18} />}         label="Active Users"        value={formatNum(s.active_users ?? 0)}        color="#10B981" delay={0.25} />
        <StatTile icon={<BarChart3 size={18} />}     label="Overall Churn Rate"  value={s.total_predictions ? formatPct(s.churn_rate) : '—'} color="#00C6FF" delay={0.3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* ── Daily Activity Chart ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <Activity size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Daily Activity</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Predictions per day (last 7 days)</p>
            </div>
          </div>
          {s.daily_activity?.length > 0 ? (
            <div style={{ width: '100%', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.daily_activity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No activity data yet
            </div>
          )}
        </motion.div>

        {/* ── Model Performance ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
              <Cpu size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Model Performance</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.model_info?.model_name || 'Active model'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Accuracy',  value: m.accuracy,  color: '#1E6FFF' },
              { label: 'Precision', value: m.precision, color: '#10B981' },
              { label: 'Recall',    value: m.recall,    color: '#F59E0B' },
              { label: 'F1 Score',  value: m.f1_score,  color: '#EF4444' },
              { label: 'ROC-AUC',   value: m.roc_auc,   color: '#8B5CF6' },
              { label: 'Features',  value: s.model_info?.feature_count, color: '#00C6FF', raw: true },
            ].map(({ label, value, color, raw }) => (
              <div key={label} style={{
                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color }}>
                  {value !== undefined ? (raw ? value : `${(value * 100).toFixed(1)}%`) : '—'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── System Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
        style={{ padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <CheckCircle size={16} />
          </div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>System Information</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Python Version', value: s.system?.python_version || '—', icon: <Cpu size={14} /> },
            { label: 'Platform',       value: s.system?.platform || '—',       icon: <Shield size={14} /> },
            { label: 'Model Type',     value: s.model_info?.model_type || '—', icon: <BarChart3 size={14} /> },
            { label: 'Feature Count',  value: s.model_info?.feature_count ? `${s.model_info.feature_count} features` : '—', icon: <Activity size={14} /> },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            }}>
              <div style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
