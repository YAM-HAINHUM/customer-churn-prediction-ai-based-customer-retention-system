/**
 * Predict — Professional form with animated probability circle and AI retention suggestions.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, RotateCcw, AlertCircle,
  Zap, Info, Lightbulb, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, DollarSign, Play,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart'
import Badge, { ConfidenceBadge } from '../components/ui/Badge'
import { formatPct } from '../utils/format'

const FIELDS = {
  customer: [
    { name: 'gender',         label: 'Gender',         type: 'select', options: ['Male', 'Female'] },
    { name: 'senior_citizen', label: 'Senior Citizen',  type: 'select', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
    { name: 'partner',        label: 'Partner',         type: 'select', options: ['Yes', 'No'] },
    { name: 'dependents',     label: 'Dependents',      type: 'select', options: ['Yes', 'No'] },
    { name: 'tenure',         label: 'Tenure (months)', type: 'number', min: 0, max: 100, placeholder: '12' },
  ],
  service: [
    { name: 'phone_service',     label: 'Phone Service',     type: 'select', options: ['Yes', 'No'] },
    { name: 'multiple_lines',    label: 'Multiple Lines',    type: 'select', options: ['Yes', 'No', 'No phone service'] },
    { name: 'internet_service',  label: 'Internet Service',  type: 'select', options: ['DSL', 'Fiber optic', 'No'] },
    { name: 'online_security',   label: 'Online Security',   type: 'select', options: ['Yes', 'No', 'No internet service'] },
    { name: 'online_backup',     label: 'Online Backup',     type: 'select', options: ['Yes', 'No', 'No internet service'] },
    { name: 'device_protection', label: 'Device Protection', type: 'select', options: ['Yes', 'No', 'No internet service'] },
    { name: 'tech_support',      label: 'Tech Support',      type: 'select', options: ['Yes', 'No', 'No internet service'] },
    { name: 'streaming_tv',      label: 'Streaming TV',      type: 'select', options: ['Yes', 'No', 'No internet service'] },
    { name: 'streaming_movies',  label: 'Streaming Movies',  type: 'select', options: ['Yes', 'No', 'No internet service'] },
  ],
  billing: [
    { name: 'contract',          label: 'Contract Type',       type: 'select', options: ['Month-to-month', 'One year', 'Two year'] },
    { name: 'paperless_billing', label: 'Paperless Billing',   type: 'select', options: ['Yes', 'No'] },
    { name: 'payment_method',    label: 'Payment Method',      type: 'select', options: ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'] },
    { name: 'monthly_charges',   label: 'Monthly Charges ($)', type: 'number', min: 0, max: 500, step: 0.01, placeholder: '65.50' },
    { name: 'total_charges',     label: 'Total Charges ($)',   type: 'number', min: 0, max: 10000, step: 0.01, placeholder: '786.00' },
  ],
}

const DEFAULT_VALS = {
  gender: 'Male', senior_citizen: 0, partner: 'No', dependents: 'No', tenure: 12,
  phone_service: 'Yes', multiple_lines: 'No', internet_service: 'Fiber optic',
  online_security: 'No', online_backup: 'No', device_protection: 'No',
  tech_support: 'No', streaming_tv: 'No', streaming_movies: 'No',
  contract: 'Month-to-month', paperless_billing: 'Yes',
  payment_method: 'Electronic check', monthly_charges: 65.5, total_charges: 786.0,
}

const SECTION_ICONS = { 'Customer Profile': '👤', 'Service Details': '📡', 'Billing & Contract': '💳' }

/* Generate AI retention suggestions based on input data */
function getRetentionSuggestions(inputData, probability) {
  const suggestions = []
  if (!inputData) return suggestions
  if (inputData.contract === 'Month-to-month')
    suggestions.push({ icon: '📋', text: 'Offer a discounted 1-year or 2-year contract to increase commitment.' })
  if (inputData.tenure < 12)
    suggestions.push({ icon: '🎁', text: 'Provide a loyalty bonus or onboarding gift for new customers.' })
  if (inputData.monthly_charges > 70)
    suggestions.push({ icon: '💰', text: 'Consider a personalized discount or bundle offer to reduce monthly cost.' })
  if (inputData.tech_support === 'No' || inputData.tech_support === 'No internet service')
    suggestions.push({ icon: '🛠️', text: 'Offer free Tech Support trial — it significantly reduces churn.' })
  if (inputData.online_security === 'No')
    suggestions.push({ icon: '🔒', text: 'Promote Online Security add-on to increase perceived value.' })
  if (inputData.payment_method === 'Electronic check')
    suggestions.push({ icon: '💳', text: 'Encourage automatic payment methods — they correlate with lower churn.' })
  if (inputData.internet_service === 'Fiber optic' && probability > 0.5)
    suggestions.push({ icon: '📶', text: 'Fiber optic customers churn more — offer speed upgrade or price lock.' })
  if (suggestions.length === 0)
    suggestions.push({ icon: '✅', text: 'Customer profile looks stable. Continue regular engagement.' })
  return suggestions.slice(0, 4)
}

/* Animated SVG probability circle */
function ProbabilityCircle({ probability }) {
  const pct = probability * 100
  const color = pct >= 70 ? '#EF4444' : pct >= 40 ? '#F59E0B' : '#10B981'
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
          <motion.circle
            cx="70" cy="70" r={radius}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color, letterSpacing: '-0.03em' }}
          >
            {pct.toFixed(0)}%
          </motion.div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Churn Risk
          </div>
        </div>
      </div>
      <div style={{
        marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
        padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)',
        background: `${color}15`, color, border: `1px solid ${color}30`,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {pct >= 70 ? 'High Risk' : pct >= 40 ? 'Medium Risk' : 'Low Risk'}
      </div>
    </div>
  )
}

function FormSection({ title, fields, register, errors }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
          marginBottom: open ? '1rem' : 0, paddingBottom: open ? '0.625rem' : 0,
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{SECTION_ICONS[title]}</span>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {title}
        </h3>
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {fields.map(f => (
                <div key={f.name}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      className="form-input"
                      {...register(f.name, { required: true })}
                      style={errors[f.name] ? { borderColor: 'var(--color-danger)' } : {}}
                    >
                      {f.options.map(opt => {
                        const val = typeof opt === 'object' ? opt.value : opt
                        const lbl = typeof opt === 'object' ? opt.label : opt
                        return <option key={val} value={val}>{lbl}</option>
                      })}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      type="number"
                      placeholder={f.placeholder}
                      min={f.min} max={f.max} step={f.step || 1}
                      {...register(f.name, {
                        required: 'Required',
                        min: { value: f.min, message: `Min ${f.min}` },
                        max: { value: f.max, message: `Max ${f.max}` },
                        valueAsNumber: true,
                      })}
                      style={errors[f.name] ? { borderColor: 'var(--color-danger)' } : {}}
                    />
                  )}
                  {errors[f.name] && (
                    <p className="form-error"><AlertCircle size={12} />{errors[f.name].message || 'Required'}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Predict() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [result,    setResult]    = useState(null)
  const [xai,       setXai]       = useState(null)
  const [clv,       setClv]       = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [lastInput, setLastInput] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: DEFAULT_VALS })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        gender:            data.gender,
        senior_citizen:    Number(data.senior_citizen) || 0,
        partner:           data.partner,
        dependents:        data.dependents,
        tenure:            Number(data.tenure) || 0,
        phone_service:     data.phone_service,
        multiple_lines:    data.multiple_lines,
        internet_service:  data.internet_service,
        online_security:   data.online_security,
        online_backup:     data.online_backup,
        device_protection: data.device_protection,
        tech_support:      data.tech_support,
        streaming_tv:      data.streaming_tv,
        streaming_movies:  data.streaming_movies,
        contract:          data.contract,
        paperless_billing: data.paperless_billing,
        payment_method:    data.payment_method,
        monthly_charges:   Number(data.monthly_charges) || 0,
        total_charges:     Number(data.total_charges) || 0,
      }
      setLastInput(payload)
      const res = await predictionsAPI.predict(payload)
      setResult(res)
      // Fetch XAI explanation and CLV in parallel
      const [xaiRes, clvRes] = await Promise.allSettled([
        predictionsAPI.explainPrediction(payload, res.probability),
        predictionsAPI.calculateCLV(payload, res.probability),
      ])
      if (xaiRes.status === 'fulfilled') setXai(xaiRes.value)
      if (clvRes.status === 'fulfilled') setClv(clvRes.value)
      if (res.probability >= 0.7) showToast('⚠️ High-risk customer detected!', 'warning')
      else showToast('Prediction completed!', 'success')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(e => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(', ')
        : detail || 'Prediction failed'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => { reset(DEFAULT_VALS); setResult(null); setLastInput(null); setXai(null); setClv(null) }

  const suggestions = getRetentionSuggestions(lastInput, result?.probability)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', alignItems: 'start' }}>

      {/* ── Left: Form ── */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
              }}>
                <BrainCircuit size={16} />
              </div>
              <h2 className="section-title">Customer Information</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginLeft: '2.5rem' }}>
              Fill in customer details to predict churn probability
            </p>
          </div>
          <button className="btn-secondary" onClick={handleReset} style={{ flexShrink: 0 }}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormSection title="Customer Profile"   fields={FIELDS.customer} register={register} errors={errors} />
          <FormSection title="Service Details"    fields={FIELDS.service}  register={register} errors={errors} />
          <FormSection title="Billing & Contract" fields={FIELDS.billing}  register={register} errors={errors} />

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.9375rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
                Analyzing…
              </>
            ) : (
              <><Zap size={17} fill="currentColor" /> Predict Churn</>
            )}
          </button>
        </form>
      </div>

      {/* ── Right: Result Panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem' }}>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

              {/* Main result card */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <ProbabilityCircle probability={result.probability} />
                  <Badge prediction={result.prediction} />
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.625rem' }}>
                    {result.prediction === 'Churn'
                      ? 'This customer is likely to churn'
                      : 'This customer is likely to stay'}
                  </p>
                </div>

                {/* Confidence */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Info size={13} color="var(--color-text-muted)" />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Model Confidence</span>
                  </div>
                  <ConfidenceBadge confidence={result.confidence} />
                </div>
              </div>

              {/* Feature importance */}
              {Object.keys(result.feature_importance || {}).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card"
                  style={{ padding: '1.25rem', marginBottom: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                      background: 'rgba(30,111,255,0.1)', border: '1px solid rgba(30,111,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
                    }}>
                      <BrainCircuit size={14} />
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Top Influencing Factors
                    </p>
                  </div>
                  <FeatureImportanceChart data={result.feature_importance} />
                </motion.div>
              )}

              {/* AI Retention Suggestions */}
              {result.prediction === 'Churn' && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="card"
                  style={{ padding: '1.25rem', marginBottom: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B',
                    }}>
                      <Lightbulb size={14} />
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      AI Retention Suggestions
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {suggestions.map((s, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.08 }}
                        style={{
                          display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
                          padding: '0.625rem 0.75rem',
                          background: 'rgba(245,158,11,0.05)',
                          border: '1px solid rgba(245,158,11,0.15)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5,
                        }}
                      >
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
                        {s.text}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* XAI Explanation */}
              {xai && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                      <BrainCircuit size={14} />
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>XAI Explanation</p>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', padding: '0.625rem 0.75rem', background: 'rgba(139,92,246,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139,92,246,0.12)' }}>
                    {xai.summary}
                  </p>
                  {xai.risk_factors?.slice(0, 2).map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{f.feature}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>+{(f.impact * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  {xai.protective_factors?.slice(0, 1).map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{f.feature}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)' }}>{(f.impact * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CLV */}
              {clv && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                      <DollarSign size={14} />
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Customer Lifetime Value</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'Est. CLV', value: `$${clv.estimated_clv?.toFixed(0)}`, color: '#10B981' },
                      { label: 'Revenue at Risk', value: `$${clv.revenue_at_risk?.toFixed(0)}`, color: '#EF4444' },
                      { label: 'Monthly Value', value: `$${clv.monthly_value?.toFixed(2)}`, color: '#1E6FFF' },
                      { label: 'Priority', value: clv.priority, color: clv.priority === 'Critical' ? '#EF4444' : clv.priority === 'High' ? '#F59E0B' : '#10B981' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '0.5rem 0.625rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Simulator CTA */}
              {result.prediction === 'Churn' && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                  onClick={() => navigate('/app/simulator')}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  <Play size={15} /> Test Retention Actions
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-xl)',
                  background: 'rgba(30,111,255,0.08)', border: '1px solid rgba(30,111,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', animation: 'float 4s ease-in-out infinite',
                }}>
                  <BrainCircuit size={28} color="var(--color-primary)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '0.625rem' }}>
                  Ready to Predict
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                  Fill in the customer details and click{' '}
                  <strong style={{ color: 'var(--color-primary)' }}>Predict Churn</strong>{' '}
                  to see the AI-powered result.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  {[
                    'Contract type is a strong predictor',
                    'Tenure affects churn significantly',
                    'Internet service type matters',
                  ].map(hint => (
                    <div key={hint} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      fontSize: '0.75rem', color: 'var(--color-text-muted)',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--color-bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Zap size={11} color="var(--color-accent)" />
                      {hint}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
