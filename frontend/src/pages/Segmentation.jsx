/**
 * Segmentation — customer segments, revenue impact, CLV analysis, anomaly detection.
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, AlertTriangle, TrendingUp, Target, Activity } from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import { formatNum, formatPct } from '../utils/format'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

function SegmentCard({ seg, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px ${seg.color}20` }}
      style={{
        background: 'var(--color-bg-card)', border: `1px solid ${seg.color}25`,
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${seg.color}, transparent)` }} />
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${seg.color}15, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{seg.icon}</span>
        <span style={{
          fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem',
          borderRadius: 'var(--radius-full)', background: `${seg.color}15`,
          color: seg.color, border: `1px solid ${seg.color}30`,
        }}>
          {seg.percentage}%
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: seg.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.375rem' }}>
        {formatNum(seg.count)}
      </div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{seg.label}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>{seg.insight}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Avg Churn Prob</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: seg.color }}>
          {formatPct(seg.avg_probability)}
        </span>
      </div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
      <p style={{ color: d.payload.color, fontWeight: 600 }}>{d.payload.label}</p>
      <p style={{ color: 'var(--color-text-secondary)' }}>Count: <strong style={{ color: 'var(--color-text-primary)' }}>{d.value}</strong></p>
      <p style={{ color: 'var(--color-text-secondary)' }}>Share: <strong style={{ color: 'var(--color-text-primary)' }}>{d.payload.percentage}%</strong></p>
    </div>
  )
}

export default function Segmentation() {
  const { showToast } = useToast()
  const [segments, setSegments] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [anomalies, setAnomalies] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      predictionsAPI.getSegments(),
      predictionsAPI.getRevenue(),
      predictionsAPI.getAnomalies(),
    ])
      .then(([seg, rev, anom]) => { setSegments(seg); setRevenue(rev); setAnomalies(anom) })
      .catch(() => showToast('Failed to load segmentation data', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Analyzing customer segments…" />

  const segs = segments?.segments || []
  const rev = revenue || {}
  const anom = anomalies || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(30,111,255,0.06))',
          border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 2rem',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <Users size={16} color="#8B5CF6" />
          <span style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer Intelligence</span>
        </div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
          Customer Segmentation & Revenue Impact
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          AI-powered customer grouping, lifetime value analysis, and anomaly detection
        </p>
      </motion.div>

      {/* Revenue KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Revenue at Risk', value: `$${formatNum(Math.round(rev.total_revenue_at_risk || 0))}`, color: '#EF4444', icon: <AlertTriangle size={18} /> },
          { label: 'Monthly Loss Est.', value: `$${formatNum(Math.round(rev.monthly_loss_estimate || 0))}`, color: '#F59E0B', icon: <TrendingUp size={18} /> },
          { label: 'Potential Savings', value: `$${formatNum(Math.round(rev.potential_savings || 0))}`, color: '#10B981', icon: <DollarSign size={18} /> },
          { label: 'Avg Customer Value', value: `$${formatNum(Math.round(rev.avg_customer_value || 0))}/yr`, color: '#1E6FFF', icon: <Target size={18} /> },
          { label: 'Anomalies Detected', value: formatNum(anom.anomaly_count || 0), color: '#8B5CF6', icon: <Activity size={18} /> },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: 'var(--color-bg-card)', border: `1px solid var(--color-border)`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }} />
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${kpi.color}15`, border: `1px solid ${kpi.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, marginBottom: '0.75rem' }}>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.375rem', fontWeight: 700, color: kpi.color, letterSpacing: '-0.03em' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Segment cards */}
      {segs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {segs.map((seg, i) => <SegmentCard key={seg.segment} seg={seg} delay={i * 0.08} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Make some predictions first to see customer segments.
        </div>
      )}

      {/* Pie chart + Anomalies */}
      {segs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Segment distribution pie */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Segment Distribution</p>
            <div style={{ width: '100%', minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={segs} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={85} paddingAngle={3}>
                    {segs.map((s, i) => <Cell key={i} fill={s.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              {segs.map(s => (
                <div key={s.segment} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly detection */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                <Activity size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Anomaly Detection</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Statistical outliers in prediction data</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Anomalies', value: anom.anomaly_count || 0, color: '#EF4444' },
                { label: 'Anomaly Rate', value: formatPct(anom.anomaly_rate || 0), color: '#F59E0B' },
                { label: 'Mean Prob', value: formatPct(anom.mean_probability || 0), color: '#1E6FFF' },
                { label: 'Threshold', value: formatPct(anom.threshold || 0), color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} style={{ padding: '0.75rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {anom.anomalies?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 160, overflowY: 'auto' }}>
                {anom.anomalies.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Deviation: {a.deviation}σ</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>{formatPct(a.probability)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                ✅ No anomalies detected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
