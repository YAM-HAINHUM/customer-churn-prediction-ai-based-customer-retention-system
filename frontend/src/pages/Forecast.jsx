/**
 * Forecast — churn trend forecasting and model comparison center.
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, Target, Activity, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import { formatPct } from '../utils/format'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0F1828', border: '1px solid rgba(30,111,255,0.2)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
      {label && <p style={{ color: 'rgba(123,143,175,0.7)', marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#60A5FA', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? (p.value < 1 ? formatPct(p.value) : p.value.toFixed(1)) : p.value}
        </p>
      ))}
    </div>
  )
}

const MODEL_COLORS = ['#1E6FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function Forecast() {
  const { showToast } = useToast()
  const [forecast, setForecast] = useState(null)
  const [models, setModels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState(30)

  const load = async () => {
    setLoading(true)
    try {
      const [fc, mc] = await Promise.all([
        predictionsAPI.getForecast(periods),
        predictionsAPI.compareModels(),
      ])
      setForecast(fc)
      setModels(mc)
    } catch {
      showToast('Failed to load forecast data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [periods])

  if (loading) return <LoadingSpinner message="Generating forecast…" />

  const fc = forecast || {}
  const allResults = models?.all_results || []

  // Build radar data for model comparison
  const radarData = allResults.length > 0 ? [
    { metric: 'Accuracy',  ...Object.fromEntries(allResults.map(r => [r.model?.split(' ')[0], (r.accuracy || 0) * 100])) },
    { metric: 'Precision', ...Object.fromEntries(allResults.map(r => [r.model?.split(' ')[0], (r.precision || 0) * 100])) },
    { metric: 'Recall',    ...Object.fromEntries(allResults.map(r => [r.model?.split(' ')[0], (r.recall || 0) * 100])) },
    { metric: 'F1',        ...Object.fromEntries(allResults.map(r => [r.model?.split(' ')[0], (r.f1_score || 0) * 100])) },
    { metric: 'ROC-AUC',   ...Object.fromEntries(allResults.map(r => [r.model?.split(' ')[0], (r.roc_auc || 0) * 100])) },
  ] : []

  const trendColor = fc.trend === 'increasing' ? '#EF4444' : fc.trend === 'decreasing' ? '#10B981' : '#F59E0B'
  const trendIcon = fc.trend === 'increasing' ? '📈' : fc.trend === 'decreasing' ? '📉' : '➡️'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(30,111,255,0.12), rgba(0,198,255,0.06))',
          border: '1px solid rgba(30,111,255,0.2)', borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <TrendingUp size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forecasting & Model Center</span>
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Churn Forecast & Model Comparison
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Future churn projections and ML model performance benchmarks
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={periods}
            onChange={e => setPeriods(Number(e.target.value))}
            style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none' }}
          >
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <button onClick={load} className="btn-secondary" style={{ padding: '0.5rem 0.875rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Forecast KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Trend Direction', value: `${trendIcon} ${fc.trend || '—'}`, color: trendColor },
          { label: 'Current Avg Rate', value: fc.avg_current_rate ? formatPct(fc.avg_current_rate) : '—', color: '#1E6FFF' },
          { label: `Next ${periods}d Avg`, value: fc.next_30_day_avg ? formatPct(fc.next_30_day_avg) : '—', color: '#F59E0B' },
          { label: 'Forecast Points', value: fc.forecast?.length || 0, color: '#10B981' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.375rem', fontWeight: 700, color: kpi.color, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem' }}>{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Forecast chart */}
      {fc.forecast?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <TrendingUp size={16} />
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Churn Rate Forecast</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Projected churn rate for next {periods} days</p>
            </div>
          </div>
          <div style={{ width: '100%', minHeight: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={fc.forecast} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={trendColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={d => d.slice(5)} interval={Math.floor(fc.forecast.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="projected_churn_rate" stroke={trendColor} fill="url(#fcGrad)" strokeWidth={2} name="Projected Churn Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Model comparison */}
      {allResults.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Bar chart */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>ROC-AUC Comparison</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Model performance by ROC-AUC score</p>
              </div>
            </div>
            <div style={{ width: '100%', minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={allResults} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="model" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} tickFormatter={m => m.split(' ')[0]} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} domain={[0.5, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="roc_auc" name="ROC-AUC" radius={[4, 4, 0, 0]}>
                    {allResults.map((_, i) => <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Metrics table */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
            className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Target size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Model Metrics</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Best model: {models?.best_model}</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    {['Model', 'Acc', 'Prec', 'Recall', 'F1', 'AUC'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.625rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allResults.map((r, i) => {
                    const isBest = r.model === models?.best_model
                    return (
                      <tr key={r.model} style={{ background: isBest ? 'rgba(30,111,255,0.05)' : 'transparent' }}>
                        <td style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--color-border-subtle)', color: isBest ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: isBest ? 600 : 400, fontSize: '0.75rem' }}>
                          {isBest ? '★ ' : ''}{r.model?.split(' ')[0]}
                        </td>
                        {[r.accuracy, r.precision, r.recall, r.f1_score, r.roc_auc].map((v, j) => (
                          <td key={j} style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--color-border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isBest ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                            {v ? `${(v * 100).toFixed(1)}%` : '—'}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
