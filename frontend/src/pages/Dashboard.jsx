/**
 * Dashboard — Animated KPI cards, revenue loss, real-time counters, model info.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BrainCircuit, Users, AlertTriangle, TrendingUp, ArrowRight,
  Activity, BarChart3, Clock, Zap, DollarSign, Upload, Shield,
} from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import ChurnTrendChart from '../components/charts/ChurnTrendChart'
import ChurnDonutChart from '../components/charts/ChurnDonutChart'
import ContractChurnChart from '../components/charts/ContractChurnChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatPct, formatNum } from '../utils/format'
import { useAuth } from '../context/AuthContext'

/* Animated counter hook */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (!target) { setCount(0); return }
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return count
}

/* Animated KPI card */
function KpiCard({ icon, label, value, sub, color, prefix = '', suffix = '', delay = 0, raw }) {
  const animated = useCountUp(raw ?? 0)
  const display = raw !== undefined
    ? `${prefix}${formatNum(animated)}${suffix}`
    : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px ${color}25` }}
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid var(--color-border)`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '1.875rem', fontWeight: 700,
        color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem',
      }}>
        {display}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
    </motion.div>
  )
}

function ModelInfoCard({ info }) {
  if (!info || info.error) return null
  const m = info.test_metrics || {}
  const metrics = [
    { label: 'Accuracy',  value: m.accuracy  ? `${(m.accuracy  * 100).toFixed(1)}%` : '—' },
    { label: 'Precision', value: m.precision ? `${(m.precision * 100).toFixed(1)}%` : '—' },
    { label: 'Recall',    value: m.recall    ? `${(m.recall    * 100).toFixed(1)}%` : '—' },
    { label: 'F1 Score',  value: m.f1_score  ? `${(m.f1_score  * 100).toFixed(1)}%` : '—' },
    { label: 'ROC-AUC',   value: m.roc_auc   ? `${(m.roc_auc   * 100).toFixed(1)}%` : '—' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="card"
      style={{ padding: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <p className="section-title">Active ML Model</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
            {info.model_name} · {info.feature_count} features
          </p>
        </div>
        <span style={{
          fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)',
          border: '1px solid rgba(16,185,129,0.25)',
        }}>Production</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
        {metrics.map(({ label, value }) => (
          <div key={label} style={{
            textAlign: 'center', padding: '0.75rem 0.5rem',
            background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              {value}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      {(info.all_results?.length > 0) && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
            All Models Evaluated
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {info.all_results.map(r => (
              <div key={r.model} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: r.model === info.model_name ? 'rgba(30,111,255,0.06)' : 'transparent',
                border: `1px solid ${r.model === info.model_name ? 'rgba(30,111,255,0.2)' : 'transparent'}`,
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: '0.8125rem', color: r.model === info.model_name ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: r.model === info.model_name ? 600 : 400 }}>
                  {r.model === info.model_name ? '★ ' : ''}{r.model}
                </span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[['AUC', r.roc_auc], ['F1', r.f1_score], ['Acc', r.accuracy]].map(([k, v]) => (
                    <span key={k} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-text-muted)', marginRight: 3 }}>{k}</span>
                      {v ? (v * 100).toFixed(1) + '%' : '—'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [insights,  setInsights]  = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([predictionsAPI.getInsights(), predictionsAPI.modelInfo()])
      .then(([ins, info]) => { setInsights(ins); setModelInfo(info) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard…" />

  const i = insights || {}
  // Revenue loss: avg $350 per churned customer (telecom industry estimate)
  const revenueLoss = (i.churn_count ?? 0) * 350

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, rgba(30,111,255,0.12) 0%, rgba(0,198,255,0.06) 100%)',
          border: '1px solid rgba(30,111,255,0.18)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,111,255,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-success)',
              boxShadow: '0 0 8px var(--color-success)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Dashboard
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
            Good day, {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
            Here's your churn prediction overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => navigate('/app/upload')}>
            <Upload size={15} /> Bulk Upload
          </button>
          <button className="btn-secondary" onClick={() => navigate('/app/analytics')}>
            <BarChart3 size={15} /> Analytics
          </button>
          <button className="btn-primary" onClick={() => navigate('/app/predict')}>
            <BrainCircuit size={15} /> New Prediction <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard icon={<Users size={20} />}         label="Total Predictions"    raw={i.total_predictions ?? 0}  sub="All time"                color="#1E6FFF" delay={0.05} />
        <KpiCard icon={<TrendingUp size={20} />}    label="Churn Rate"           value={i.total_predictions ? formatPct(i.churn_rate) : '—'} sub={`${i.churn_count ?? 0} churned`} color="#EF4444" delay={0.1} />
        <KpiCard icon={<AlertTriangle size={20} />} label="High Risk Customers"  raw={i.high_risk_count ?? 0}    sub="Probability ≥ 70%"       color="#F59E0B" delay={0.15} />
        <KpiCard icon={<Zap size={20} />}           label="Predictions Today"    raw={i.predictions_today ?? 0}  sub="Since midnight UTC"      color="#00C6FF" delay={0.2} />
        <KpiCard icon={<Activity size={20} />}      label="Avg Churn Probability" value={i.avg_probability ? formatPct(i.avg_probability) : '—'} sub="Mean across all" color="#10B981" delay={0.25} />
        <KpiCard icon={<DollarSign size={20} />}    label="Est. Revenue at Risk"  raw={revenueLoss} prefix="$" sub="@ $350/churned customer"  color="#8B5CF6" delay={0.3} />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="card"
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p className="section-title">Churn Trend</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 3 }}>Daily predictions over last 30 days</p>
            </div>
            <div style={{
              padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)',
              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-primary)',
            }}>30 days</div>
          </div>
          <ChurnTrendChart data={i.daily_trend} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="card"
          style={{ padding: '1.5rem' }}
        >
          <p className="section-title" style={{ marginBottom: '0.375rem' }}>Distribution</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Churn vs retained</p>
          <ChurnDonutChart churnCount={i.churn_count} notChurnCount={i.not_churn_count} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.875rem' }}>
            {[['Churn', '#EF4444', i.churn_count ?? 0], ['Retained', '#10B981', i.not_churn_count ?? 0]].map(([label, color, count]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {label} ({count})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Model Info ── */}
      <ModelInfoCard info={modelInfo} />

      {/* ── Contract Chart + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="card"
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p className="section-title">Contract vs Churn Rate</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 3 }}>Churn vs retained by contract type</p>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/app/analytics')} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
              Full Analytics →
            </button>
          </div>
          <ContractChurnChart data={i.contract_distribution} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="card"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <p className="section-title" style={{ marginBottom: '0.25rem' }}>Quick Actions</p>
          {[
            { label: 'New Prediction',   icon: <BrainCircuit size={16} />, path: '/app/predict',   color: '#1E6FFF' },
            { label: 'Bulk Upload CSV',  icon: <Upload size={16} />,       path: '/app/upload',    color: '#00C6FF' },
            { label: 'View Analytics',   icon: <BarChart3 size={16} />,    path: '/app/analytics', color: '#F59E0B' },
            { label: 'Prediction History', icon: <Clock size={16} />,      path: '/app/history',   color: '#10B981' },
            { label: 'Admin Panel',      icon: <Shield size={16} />,       path: '/app/admin',     color: '#8B5CF6' },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                background: `${a.color}0D`, border: `1px solid ${a.color}25`,
                color: a.color, cursor: 'pointer', fontWeight: 500,
                fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
                transition: 'background 0.15s, transform 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${a.color}1A`; e.currentTarget.style.transform = 'translateX(3px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = `${a.color}0D`; e.currentTarget.style.transform = 'translateX(0)' }}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </motion.div>
      </div>

    </div>
  )
}
