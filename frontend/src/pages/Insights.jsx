/**
 * Insights — Dark analytics UI with extended charts: scatter, tenure, revenue, risk distribution.
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, BarChart3, PieChart, Activity, Zap, Target,
  Users, AlertTriangle, DollarSign, LineChart,
} from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart as RLineChart,
  Line, AreaChart, Area,
} from 'recharts'
import { predictionsAPI } from '../api/predictions'
import ChurnTrendChart from '../components/charts/ChurnTrendChart'
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart'
import ContractChurnChart from '../components/charts/ContractChurnChart'
import ChurnDonutChart from '../components/charts/ChurnDonutChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatPct, formatNum } from '../utils/format'

function GlowStat({ label, value, color, icon, sub }) {
  const glowMap = {
    '#1E6FFF': 'rgba(30,111,255,0.25)', '#EF4444': 'rgba(239,68,68,0.25)',
    '#F59E0B': 'rgba(245,158,11,0.25)', '#00C6FF': 'rgba(0,198,255,0.25)',
    '#10B981': 'rgba(16,185,129,0.25)',
  }
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${glowMap[color] || 'rgba(30,111,255,0.2)'}` }}
      style={{
        background: 'linear-gradient(145deg, rgba(15,22,35,0.9), rgba(20,30,48,0.9))',
        border: `1px solid ${color}30`, borderRadius: 'var(--radius-lg)',
        padding: '1.5rem', position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}20, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: '1rem' }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.375rem' }}>{value}</div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(200,215,240,0.7)', marginBottom: sub ? '0.25rem' : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'rgba(123,143,175,0.5)' }}>{sub}</div>}
    </motion.div>
  )
}

function DarkChartCard({ icon, title, subtitle, children, span }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="analytics-card"
      style={{ padding: '1.5rem', gridColumn: span ? `span ${span}` : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.01em' }}>{title}</p>
          {subtitle && <p style={{ fontSize: '0.75rem', color: 'rgba(123,143,175,0.7)', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0F1828', border: '1px solid rgba(30,111,255,0.2)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
      {label && <p style={{ color: 'rgba(123,143,175,0.7)', marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#60A5FA', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  )
}

/* Generate synthetic tenure analysis from daily trend */
function buildTenureData(dailyTrend) {
  if (!dailyTrend?.length) return []
  return dailyTrend.slice(-14).map((d, i) => ({
    day: i + 1,
    churnRate: d.total > 0 ? Math.round((d.churn / d.total) * 100) : 0,
    total: d.total,
  }))
}

/* Build revenue loss trend from daily trend */
function buildRevenueTrend(dailyTrend) {
  if (!dailyTrend?.length) return []
  let cumulative = 0
  return dailyTrend.slice(-14).map(d => {
    cumulative += d.churn * 350
    return { date: d.date?.slice(5) || '', daily: d.churn * 350, cumulative }
  })
}

export default function Insights() {
  const [insights, setInsights] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    predictionsAPI.getInsights()
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading insights…" />

  const i = insights || {}
  const tenureData  = buildTenureData(i.daily_trend)
  const revenueData = buildRevenueTrend(i.daily_trend)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0A0F1E, #0F1828)',
          border: '1px solid rgba(30,111,255,0.12)',
          borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(30,111,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <Zap size={16} color="var(--color-accent)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analytics Overview</span>
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#E8EEFF', letterSpacing: '-0.03em' }}>Insights & Analytics</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(123,143,175,0.8)', marginTop: '0.25rem' }}>Deep dive into your churn prediction data</p>
        </div>
        <div style={{
          display: 'flex', gap: '1.5rem', position: 'relative',
          padding: '0.875rem 1.5rem',
          background: 'rgba(30,111,255,0.06)', border: '1px solid rgba(30,111,255,0.12)',
          borderRadius: 'var(--radius-lg)',
        }}>
          {[
            { label: 'Total',   value: formatNum(i.total_predictions ?? 0), color: '#60A5FA' },
            { label: 'Churned', value: formatNum(i.churn_count ?? 0),        color: '#F87171' },
            { label: 'Rate',    value: i.total_predictions ? formatPct(i.churn_rate) : '—', color: '#FBBF24' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(123,143,175,0.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Glow Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <GlowStat label="Total Analyzed"   value={formatNum(i.total_predictions ?? 0)}                          color="#1E6FFF" icon={<Users size={18} />}         sub="All predictions" />
        <GlowStat label="Churned"          value={formatNum(i.churn_count ?? 0)}                                color="#EF4444" icon={<TrendingUp size={18} />}     sub="Churn predictions" />
        <GlowStat label="Churn Rate"       value={i.total_predictions ? formatPct(i.churn_rate) : '—'}          color="#F59E0B" icon={<Target size={18} />}         sub="Overall rate" />
        <GlowStat label="Avg Probability"  value={i.avg_probability ? formatPct(i.avg_probability) : '—'}       color="#00C6FF" icon={<Activity size={18} />}       sub="Mean churn prob" />
        <GlowStat label="High Risk"        value={formatNum(i.high_risk_count ?? 0)}                            color="#10B981" icon={<AlertTriangle size={18} />}  sub="Prob ≥ 70%" />
        <GlowStat label="Revenue at Risk"  value={`$${formatNum((i.churn_count ?? 0) * 350)}`}                  color="#8B5CF6" icon={<DollarSign size={18} />}     sub="@ $350/customer" />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <DarkChartCard icon={<TrendingUp size={16} />} title="Churn Trend" subtitle="Daily predictions over last 30 days">
          <ChurnTrendChart data={i.daily_trend} />
        </DarkChartCard>

        <DarkChartCard icon={<PieChart size={16} />} title="Churn Distribution" subtitle="Overall churn vs retained ratio">
          <ChurnDonutChart churnCount={i.churn_count} notChurnCount={i.not_churn_count} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.875rem' }}>
            {[['Churn', '#EF4444', i.churn_count ?? 0], ['Retained', '#10B981', i.not_churn_count ?? 0]].map(([label, color, count]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(123,143,175,0.8)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {label} ({count})
              </div>
            ))}
          </div>
        </DarkChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <DarkChartCard icon={<BarChart3 size={16} />} title="Contract vs Churn" subtitle="Churn rate by contract type">
          <ContractChurnChart data={i.contract_distribution} />
        </DarkChartCard>

        <DarkChartCard icon={<Activity size={16} />} title="Feature Impact Analysis" subtitle="Top 10 most influential prediction factors">
          <FeatureImportanceChart data={i.feature_importance} />
        </DarkChartCard>
      </div>

      {/* ── Tenure Analysis ── */}
      {tenureData.length > 0 && (
        <DarkChartCard icon={<LineChart size={16} />} title="Churn Rate Trend" subtitle="Daily churn rate % over last 14 days">
          <div style={{ width: '100%', minHeight: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <RLineChart data={tenureData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,111,255,0.08)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(123,143,175,0.6)' }} tickFormatter={d => `Day ${d}`} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(123,143,175,0.6)' }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="churnRate" stroke="#00C6FF" strokeWidth={2} dot={{ fill: '#00C6FF', r: 3 }} name="Churn Rate %" />
            </RLineChart>
          </ResponsiveContainer>
          </div>
        </DarkChartCard>
      )}

      {/* ── Revenue Loss Trend ── */}
      {revenueData.length > 0 && (
        <DarkChartCard icon={<DollarSign size={16} />} title="Revenue Loss Trend" subtitle="Estimated daily & cumulative revenue at risk ($350/churned customer)">
          <div style={{ width: '100%', minHeight: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,111,255,0.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(123,143,175,0.6)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(123,143,175,0.6)' }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="cumulative" stroke="#8B5CF6" fill="url(#revGrad)" strokeWidth={2} name="Cumulative Loss $" />
              <Line type="monotone" dataKey="daily" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Daily Loss $" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </DarkChartCard>
      )}

      {/* ── Confidence Distribution ── */}
      {(i.confidence_distribution?.length > 0) && (
        <DarkChartCard icon={<Target size={16} />} title="Confidence Distribution" subtitle="Breakdown of prediction confidence levels">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {i.confidence_distribution.map(d => {
              const pct = i.total_predictions ? (d.count / i.total_predictions) * 100 : 0
              const colorMap = { High: '#10B981', Medium: '#F59E0B', Low: '#EF4444' }
              const color = colorMap[d.confidence] || '#7B8FAF'
              return (
                <div key={d.confidence} style={{
                  padding: '1.25rem', background: `linear-gradient(145deg, ${color}08, ${color}04)`,
                  border: `1px solid ${color}20`, borderRadius: 'var(--radius-md)',
                  textAlign: 'center', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color, letterSpacing: '-0.04em', marginBottom: '0.375rem' }}>{d.count}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(200,215,240,0.8)', marginBottom: '0.25rem' }}>{d.confidence} Confidence</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(123,143,175,0.5)' }}>{pct.toFixed(1)}% of total</div>
                  <div style={{ marginTop: '0.875rem', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </DarkChartCard>
      )}

    </div>
  )
}
