/**
 * Retention Simulator — test retention actions and see before/after churn probability.
 */
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RotateCcw, TrendingDown, CheckCircle, AlertCircle, Play } from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import { formatPct } from '../utils/format'

const DEFAULT_CUSTOMER = {
  gender: 'Male', senior_citizen: 0, partner: 'No', dependents: 'No', tenure: 6,
  phone_service: 'Yes', multiple_lines: 'No', internet_service: 'Fiber optic',
  online_security: 'No', online_backup: 'No', device_protection: 'No',
  tech_support: 'No', streaming_tv: 'No', streaming_movies: 'No',
  contract: 'Month-to-month', paperless_billing: 'Yes',
  payment_method: 'Electronic check', monthly_charges: 79.5, total_charges: 477.0,
}

const ACTIONS = [
  { key: 'discount_10',      label: '10% Discount',         icon: '💰', color: '#10B981' },
  { key: 'discount_20',      label: '20% Discount',         icon: '💸', color: '#10B981' },
  { key: 'loyalty_reward',   label: 'Loyalty Reward',       icon: '🎁', color: '#8B5CF6' },
  { key: 'upgrade_support',  label: 'Upgrade Support',      icon: '🛠️', color: '#00C6FF' },
  { key: 'annual_contract',  label: 'Annual Contract',      icon: '📋', color: '#1E6FFF' },
  { key: 'two_year_contract',label: '2-Year Contract',      icon: '🔒', color: '#1E6FFF' },
  { key: 'bundle_offer',     label: 'Bundle Offer',         icon: '📦', color: '#F59E0B' },
]

function ProbGauge({ probability, label, color }) {
  const pct = probability * 100
  const r = 52, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
        <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="65" cy="65" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10" />
          <motion.circle
            cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1.375rem', fontWeight: 800, color, letterSpacing: '-0.03em' }}
          >
            {pct.toFixed(0)}%
          </motion.div>
          <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Churn Risk
          </div>
        </div>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</div>
    </div>
  )
}

export default function Simulator() {
  const { showToast } = useToast()
  const [selectedActions, setSelectedActions] = useState(['annual_contract'])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch } = useForm({ defaultValues: DEFAULT_CUSTOMER })

  const toggleAction = (key) => {
    setSelectedActions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const onSubmit = async (data) => {
    if (!selectedActions.length) { showToast('Select at least one retention action', 'warning'); return }
    setLoading(true)
    try {
      const payload = {
        ...data,
        senior_citizen: Number(data.senior_citizen) || 0,
        tenure: Number(data.tenure) || 0,
        monthly_charges: Number(data.monthly_charges) || 0,
        total_charges: Number(data.total_charges) || 0,
      }
      const res = await predictionsAPI.simulate(payload, selectedActions)
      setResult(res)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Simulation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const baseColor = result
    ? (result.baseline_probability >= 0.7 ? '#EF4444' : result.baseline_probability >= 0.4 ? '#F59E0B' : '#10B981')
    : '#EF4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(30,111,255,0.06))',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 2rem',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <Play size={16} color="var(--color-success)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Retention Simulator
          </span>
        </div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
          Test Retention Actions
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Simulate how different retention strategies reduce a customer's churn probability
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Customer form + action selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Action selector */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
              Select Retention Actions
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem' }}>
              {ACTIONS.map(a => {
                const active = selectedActions.includes(a.key)
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleAction(a.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${active ? a.color + '50' : 'var(--color-border)'}`,
                      background: active ? `${a.color}12` : 'var(--color-bg-surface)',
                      color: active ? a.color : 'var(--color-text-secondary)',
                      cursor: 'pointer', fontSize: '0.8125rem', fontWeight: active ? 600 : 400,
                      fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                    }}
                  >
                    <span>{a.icon}</span> {a.label}
                    {active && <CheckCircle size={12} style={{ marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick customer form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                Customer Profile
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { name: 'tenure', label: 'Tenure (mo)', type: 'number', min: 0, max: 100 },
                  { name: 'monthly_charges', label: 'Monthly $', type: 'number', min: 0, max: 500, step: 0.01 },
                  { name: 'total_charges', label: 'Total $', type: 'number', min: 0, max: 10000, step: 0.01 },
                ].map(f => (
                  <div key={f.name}>
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type="number" min={f.min} max={f.max} step={f.step || 1} {...register(f.name)} />
                  </div>
                ))}
                {[
                  { name: 'contract', label: 'Contract', options: ['Month-to-month', 'One year', 'Two year'] },
                  { name: 'internet_service', label: 'Internet', options: ['Fiber optic', 'DSL', 'No'] },
                  { name: 'payment_method', label: 'Payment', options: ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'] },
                  { name: 'tech_support', label: 'Tech Support', options: ['Yes', 'No', 'No internet service'] },
                  { name: 'online_security', label: 'Security', options: ['Yes', 'No', 'No internet service'] },
                  { name: 'gender', label: 'Gender', options: ['Male', 'Female'] },
                ].map(f => (
                  <div key={f.name}>
                    <label className="form-label">{f.label}</label>
                    <select className="form-input" {...register(f.name)}>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                {/* Hidden required fields */}
                {['partner', 'dependents', 'phone_service', 'multiple_lines', 'online_backup',
                  'device_protection', 'streaming_tv', 'streaming_movies', 'paperless_billing'].map(f => (
                  <input key={f} type="hidden" {...register(f)} />
                ))}
              </div>
              <button
                type="submit" disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '1rem', fontSize: '0.9375rem' }}
              >
                {loading
                  ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Simulating…</>
                  : <><Zap size={16} fill="currentColor" /> Run Simulation</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* Right: Results */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Before/After gauges */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem', textAlign: 'center' }}>
                    Churn Probability Comparison
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '1rem' }}>
                    <ProbGauge probability={result.baseline_probability} label="Before" color={baseColor} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingDown size={24} color="var(--color-success)" />
                      {result.best_action && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                          -{result.best_action.reduction_pct}%
                        </span>
                      )}
                    </div>
                    <ProbGauge
                      probability={result.best_action?.after_probability ?? result.baseline_probability}
                      label="Best Action"
                      color={result.best_action?.after_probability < 0.4 ? '#10B981' : '#F59E0B'}
                    />
                  </div>
                </div>

                {/* Action results */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.875rem' }}>
                    Action Impact Ranking
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.simulations.map((sim, i) => {
                      const action = ACTIONS.find(a => a.key === sim.action)
                      const barWidth = Math.min(100, (sim.reduction / result.baseline_probability) * 100)
                      return (
                        <motion.div
                          key={sim.action}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{
                            padding: '0.75rem', borderRadius: 'var(--radius-md)',
                            background: i === 0 ? 'rgba(16,185,129,0.06)' : 'var(--color-bg-surface)',
                            border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.2)' : 'var(--color-border)'}`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {action?.icon} {sim.label}
                              {i === 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700 }}>BEST</span>}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: sim.reduction > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {sim.reduction > 0 ? '-' : '+'}{Math.abs(sim.reduction_pct)}%
                            </span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                              style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, var(--color-success), #00C6FF)' }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                              {formatPct(sim.before_probability)} → {formatPct(sim.after_probability)}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', animation: 'float 4s ease-in-out infinite' }}>
                    <Play size={28} color="var(--color-success)" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Ready to Simulate</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                    Select retention actions, fill in customer details, and click <strong style={{ color: 'var(--color-success)' }}>Run Simulation</strong> to see the impact.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
