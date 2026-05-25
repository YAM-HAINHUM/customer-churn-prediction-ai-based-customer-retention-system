/**
 * Upload — CSV bulk prediction with drag-and-drop, preview, and results table.
 */
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Download, BarChart3, Zap, FileDown } from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import { formatPct, downloadBlob } from '../utils/format'

// Sample CSV content matching the required columns
const SAMPLE_CSV = `gender,senior_citizen,partner,dependents,tenure,phone_service,multiple_lines,internet_service,online_security,online_backup,device_protection,tech_support,streaming_tv,streaming_movies,contract,paperless_billing,payment_method,monthly_charges,total_charges
Male,0,Yes,No,12,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,65.5,786.0
Female,0,No,No,34,Yes,Yes,DSL,Yes,No,Yes,No,Yes,No,One year,No,Mailed check,55.9,1902.6
Male,1,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,141.4
Female,0,Yes,Yes,45,No,No phone service,DSL,Yes,Yes,No,Yes,No,No,Two year,No,Bank transfer (automatic),42.3,1902.0
`

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  downloadBlob(blob, 'sample_churn_upload.csv')
}

const RISK_COLOR = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' }
const RISK_BG    = { High: 'rgba(239,68,68,0.1)', Medium: 'rgba(245,158,11,0.1)', Low: 'rgba(16,185,129,0.1)' }

function RiskBadge({ level }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '0.15rem 0.5rem', borderRadius: '9999px',
      fontSize: '0.6875rem', fontWeight: 700,
      background: RISK_BG[level] || 'transparent',
      color: RISK_COLOR[level] || 'var(--color-text-muted)',
      border: `1px solid ${RISK_COLOR[level] || 'transparent'}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: RISK_COLOR[level] }} />
      {level}
    </span>
  )
}

export default function UploadPage() {
  const { showToast } = useToast()
  const inputRef = useRef(null)
  const [file,      setFile]      = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [results,   setResults]   = useState(null)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('All')

  const handleFile = (f) => {
    if (!f?.name.endsWith('.csv')) { showToast('Only CSV files are supported', 'error'); return }
    setFile(f)
    setResults(null)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setProgress(0)

    // Simulate progress
    const interval = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const data = await predictionsAPI.bulkPredict(formData)
      clearInterval(interval); setProgress(100)
      setResults(data)
      showToast(`Processed ${data.processed} rows — ${data.churn_count} churn predictions`, 'success')
    } catch (err) {
      clearInterval(interval)
      const detail = err.response?.data?.detail || err.message || 'Upload failed'
      showToast(detail, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const blob = await predictionsAPI.bulkPredictDownload(formData)
      downloadBlob(blob, 'bulk_predictions.csv')
      showToast('CSV downloaded!', 'success')
    } catch {
      showToast('Download failed', 'error')
    }
  }

  const filteredRows = (results?.results || [])
    .filter(r => filter === 'All' || r.risk_level === filter)
    .filter(r => !search || r.prediction?.toLowerCase().includes(search.toLowerCase()) || String(r.row).includes(search))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0,198,255,0.1), rgba(30,111,255,0.06))',
          border: '1px solid rgba(0,198,255,0.2)',
          borderRadius: 'var(--radius-xl)', padding: '1.5rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Upload size={16} color="var(--color-accent)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Bulk Prediction
            </span>
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            CSV Dataset Upload
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Upload a CSV file to run batch churn predictions on multiple customers at once
          </p>
        </div>
        {results && (
          <button className="btn-primary" onClick={handleDownload}>
            <Download size={15} /> Download Results
          </button>
        )}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: results ? '380px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Upload Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Drop zone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--color-accent)' : file ? 'var(--color-success)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              cursor: file ? 'default' : 'pointer',
              background: dragging ? 'rgba(0,198,255,0.05)' : file ? 'rgba(16,185,129,0.04)' : 'var(--color-bg-card)',
              transition: 'all 0.2s',
            }}
          >
            <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

            {file ? (
              <div>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', color: 'var(--color-success)',
                }}>
                  <FileText size={24} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{file.name}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResults(null); setProgress(0) }}
                  style={{
                    marginTop: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: 'var(--color-danger)', fontSize: '0.8125rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                  background: 'rgba(30,111,255,0.08)', border: '1px solid rgba(30,111,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', color: 'var(--color-primary)',
                  animation: 'float 4s ease-in-out infinite',
                }}>
                  <Upload size={24} />
                </div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                  {dragging ? 'Drop your CSV here' : 'Drag & drop or click to upload'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>CSV files only · Max 10MB</p>
              </div>
            )}
          </motion.div>

          {/* Progress bar */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card"
                style={{ padding: '1rem 1.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Processing rows…</span>
                  <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{progress}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                      boxShadow: '0 0 8px rgba(30,111,255,0.5)',
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Run button */}
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
            style={{ justifyContent: 'center', padding: '0.875rem', fontSize: '0.9375rem' }}
          >
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Running predictions…
              </>
            ) : (
              <><Zap size={17} fill="currentColor" /> Run Bulk Predictions</>
            )}
          </button>

          {/* Summary cards */}
          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Total Rows',   value: results.total_rows,    color: '#1E6FFF' },
                  { label: 'Processed',    value: results.processed,     color: '#10B981' },
                  { label: 'Churn',        value: results.churn_count,   color: '#EF4444' },
                  { label: 'Churn Rate',   value: formatPct(results.churn_rate), color: '#F59E0B' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '0.875rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.375rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Required columns hint */}
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Required CSV Columns
              </p>
              <button
                onClick={downloadSampleCSV}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.2)',
                  color: 'var(--color-accent)', fontSize: '0.6875rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <FileDown size={11} /> Sample CSV
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {['gender', 'tenure', 'contract', 'monthly_charges', 'total_charges', 'internet_service', 'payment_method', '+ 12 more'].map(col => (
                <span key={col} style={{
                  fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)',
                  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)',
                }}>{col}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Also accepts original Telco column names (e.g. MonthlyCharges, TotalCharges)
            </p>
          </div>
        </div>

        {/* ── Results Table ── */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="card"
              style={{ overflow: 'hidden' }}
            >
              {/* Table toolbar */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <BarChart3 size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>Prediction Results</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Search…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
                      padding: '0.4rem 0.75rem', fontSize: '0.8125rem', outline: 'none', width: 160,
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                  {['All', 'High', 'Medium', 'Low'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)',
                        border: `1px solid ${filter === f ? (RISK_COLOR[f] || 'var(--color-primary)') : 'var(--color-border)'}`,
                        background: filter === f ? `${RISK_COLOR[f] || 'var(--color-primary)'}15` : 'transparent',
                        color: filter === f ? (RISK_COLOR[f] || 'var(--color-primary)') : 'var(--color-text-secondary)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >{f}</button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      {['Row', 'Prediction', 'Probability', 'Risk', 'Contract', 'Monthly $', 'Tenure'].map(h => (
                        <th key={h} style={{
                          padding: '0.75rem 1rem', textAlign: 'left',
                          fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                          color: 'var(--color-text-muted)', background: 'var(--color-bg-surface)',
                          borderBottom: '1px solid var(--color-border)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr
                        key={row.row}
                        style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                          {row.row}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '0.15rem 0.5rem', borderRadius: '9999px',
                            fontSize: '0.75rem', fontWeight: 700,
                            background: row.prediction === 'Churn' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            color: row.prediction === 'Churn' ? '#EF4444' : '#10B981',
                            border: `1px solid ${row.prediction === 'Churn' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          }}>
                            {row.prediction === 'Churn' ? '↑' : '✓'} {row.prediction}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 2,
                                width: `${row.probability * 100}%`,
                                background: row.probability > 0.5 ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : 'linear-gradient(90deg, #10B981, #00C6FF)',
                              }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: row.probability > 0.5 ? '#EF4444' : '#10B981' }}>
                              {formatPct(row.probability)}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <RiskBadge level={row.risk_level} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                          {row.contract || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                          ${row.monthly_charges?.toFixed(2) || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                          {row.tenure ?? '—'} mo
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRows.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No results match your filter
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
