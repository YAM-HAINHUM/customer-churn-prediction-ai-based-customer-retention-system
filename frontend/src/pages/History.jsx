/**
 * History — Light-themed data-grid UI with search, sort, pagination, and CSV export.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Download, Trash2, ChevronUp, ChevronDown, Search,
  RefreshCw, Clock, FileText, Filter,
} from 'lucide-react'
import { predictionsAPI } from '../api/predictions'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import Badge, { ConfidenceBadge } from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatDate, formatPct, downloadBlob } from '../utils/format'

const PAGE_SIZES = [10, 20, 50]

/* Light-mode badge overrides */
function LightBadge({ prediction }) {
  const isChurn = prediction === 'Churn'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '9999px',
      fontSize: '0.75rem', fontWeight: 700,
      background: isChurn ? '#FEF2F2' : '#F0FDF4',
      color: isChurn ? '#DC2626' : '#16A34A',
      border: `1px solid ${isChurn ? '#FECACA' : '#BBF7D0'}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isChurn ? '#DC2626' : '#16A34A',
      }} />
      {prediction}
    </span>
  )
}

function LightConfidenceBadge({ confidence }) {
  const map = {
    High:   { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    Medium: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    Low:    { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  }
  const s = map[confidence] || map.Medium
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.2rem 0.65rem', borderRadius: '9999px',
      fontSize: '0.75rem', fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {confidence}
    </span>
  )
}

export default function History() {
  const { showToast } = useToast()
  const { isDark } = useTheme()
  const [data,       setData]       = useState({ items: [], total: 0, total_pages: 1 })
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(10)
  const [loading,    setLoading]    = useState(true)
  const [exportBusy, setExportBusy] = useState(false)
  const [sortKey,    setSortKey]    = useState('created_at')
  const [sortDir,    setSortDir]    = useState('desc')
  const [search,     setSearch]     = useState('')
  const [deleting,   setDeleting]   = useState(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await predictionsAPI.getHistory(page, pageSize)
      setData(res)
    } catch {
      showToast('Failed to load history', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this prediction record?')) return
    setDeleting(id)
    try {
      await predictionsAPI.deleteRecord(id)
      showToast('Record deleted', 'success')
      fetchHistory()
    } catch {
      showToast('Failed to delete record', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = async () => {
    setExportBusy(true)
    try {
      const blob = await predictionsAPI.exportCSV()
      downloadBlob(blob, 'churn_prediction_history.csv')
      showToast('CSV downloaded!', 'success')
    } catch {
      showToast('Export failed', 'error')
    } finally {
      setExportBusy(false)
    }
  }

  const rows = [...(data.items || [])]
    .filter(r => !search
      || r.prediction?.toLowerCase().includes(search.toLowerCase())
      || r.confidence?.toLowerCase().includes(search.toLowerCase())
      || r.input_data?.contract?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  const SortIcon = ({ k }) =>
    sortKey !== k
      ? <ChevronUp size={12} style={{ opacity: 0.3 }} />
      : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />

  /* Adaptive styles based on theme */
  const containerBg = isDark ? 'transparent' : '#F0F5FF'
  const cardBg      = isDark ? 'var(--color-bg-card)' : '#FFFFFF'
  const cardBorder  = isDark ? 'var(--color-border)' : '#E2E8F4'
  const thBg        = isDark ? 'var(--color-bg-surface)' : '#F1F5FB'
  const thColor     = isDark ? 'var(--color-text-muted)' : '#64748B'
  const tdBorder    = isDark ? 'var(--color-border-subtle)' : '#F1F5FB'
  const tdColor     = isDark ? 'var(--color-text-primary)' : '#1E293B'
  const trHover     = isDark ? 'var(--color-bg-hover)' : '#F8FAFF'
  const inputBg     = isDark ? 'var(--color-bg-surface)' : '#FFFFFF'
  const inputBorder = isDark ? 'var(--color-border)' : '#CBD5E1'
  const inputColor  = isDark ? 'var(--color-text-primary)' : '#1E293B'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>

      {/* ── Header ── */}
      <div style={{
        background: isDark ? 'var(--color-bg-card)' : '#FFFFFF',
        border: `1px solid ${cardBorder}`,
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(30,111,255,0.1)' : '#EFF6FF',
            border: `1px solid ${isDark ? 'rgba(30,111,255,0.2)' : '#BFDBFE'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)',
          }}>
            <FileText size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'var(--color-text-primary)' : '#0F172A' }}>
              Prediction History
            </h2>
            <p style={{ fontSize: '0.75rem', color: isDark ? 'var(--color-text-muted)' : '#64748B', marginTop: 2 }}>
              {data.total} total records
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: '0.75rem', top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? 'var(--color-text-muted)' : '#94A3B8',
            }} />
            <input
              placeholder="Search predictions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: inputBg, border: `1px solid ${inputBorder}`,
                borderRadius: 'var(--radius-md)', color: inputColor,
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
                outline: 'none', width: 220,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(30,111,255,0.1)' }}
              onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            style={{
              background: inputBg, border: `1px solid ${inputBorder}`,
              borderRadius: 'var(--radius-md)', color: inputColor,
              padding: '0.5rem 0.75rem', fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer',
            }}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>

          <button
            onClick={fetchHistory}
            title="Refresh"
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: inputBg, border: `1px solid ${inputBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: isDark ? 'var(--color-text-secondary)' : '#64748B',
              transition: 'background 0.15s',
            }}
          >
            <RefreshCw size={14} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          </button>

          <button
            onClick={handleExport}
            disabled={exportBusy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
              background: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4',
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.25)' : '#BBF7D0'}`,
              color: '#10B981', fontSize: '0.875rem', fontWeight: 600,
              cursor: exportBusy ? 'not-allowed' : 'pointer',
              opacity: exportBusy ? 0.6 : 1,
              transition: 'background 0.15s',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Download size={14} />
            {exportBusy ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        {loading ? (
          <LoadingSpinner message="Loading history…" />
        ) : rows.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-xl)',
              background: isDark ? 'rgba(30,111,255,0.08)' : '#EFF6FF',
              border: `1px solid ${isDark ? 'rgba(30,111,255,0.15)' : '#BFDBFE'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem', color: 'var(--color-primary)',
            }}>
              <Clock size={28} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: isDark ? 'var(--color-text-primary)' : '#0F172A', marginBottom: '0.5rem' }}>
              No predictions yet
            </p>
            <p style={{ fontSize: '0.875rem', color: isDark ? 'var(--color-text-muted)' : '#64748B' }}>
              {search ? 'No results match your search' : 'Start by making your first prediction'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {[
                    ['#', null, '48px'],
                    ['Prediction', 'prediction', null],
                    ['Probability', 'probability', null],
                    ['Confidence', 'confidence', null],
                    ['Contract', null, null],
                    ['Monthly Charges', null, null],
                    ['Tenure', null, '100px'],
                    ['Date', 'created_at', null],
                    ['', null, '60px'],
                  ].map(([label, key, width]) => (
                    <th
                      key={label}
                      onClick={key ? () => handleSort(key) : undefined}
                      style={{
                        padding: '0.875rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: thColor,
                        background: thBg,
                        borderBottom: `1px solid ${cardBorder}`,
                        cursor: key ? 'pointer' : 'default',
                        userSelect: 'none',
                        width: width || undefined,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {label} {key && <SortIcon k={key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}`, color: isDark ? 'var(--color-text-muted)' : '#94A3B8', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}` }}>
                      {isDark ? <Badge prediction={row.prediction} size="sm" /> : <LightBadge prediction={row.prediction} />}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 72, height: 5, borderRadius: 3, background: isDark ? 'var(--color-border)' : '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${row.probability * 100}%`,
                            background: row.probability > 0.5
                              ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                              : 'linear-gradient(90deg, #10B981, #00C6FF)',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: row.probability > 0.5 ? '#EF4444' : '#10B981' }}>
                          {formatPct(row.probability)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}` }}>
                      {isDark ? <ConfidenceBadge confidence={row.confidence} /> : <LightConfidenceBadge confidence={row.confidence} />}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}`, color: isDark ? 'var(--color-text-secondary)' : '#475569', fontSize: '0.8125rem' }}>
                      {row.input_data?.contract || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}`, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: tdColor }}>
                      ${row.input_data?.monthly_charges?.toFixed(2) || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}`, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: tdColor }}>
                      {row.input_data?.tenure ?? '—'} mo
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}`, fontSize: '0.8125rem', color: isDark ? 'var(--color-text-secondary)' : '#64748B', whiteSpace: 'nowrap' }}>
                      {formatDate(row.created_at)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${tdBorder}` }}>
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: 'var(--radius-md)',
                          background: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                          border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#FECACA'}`,
                          color: '#EF4444', cursor: deleting === row.id ? 'not-allowed' : 'pointer',
                          opacity: deleting === row.id ? 0.5 : 1,
                          transition: 'background 0.15s',
                          fontFamily: 'var(--font-sans)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.16)' : '#FEE2E2'}
                        onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {data.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.4375rem 0.875rem', borderRadius: 'var(--radius-md)',
              background: inputBg, border: `1px solid ${inputBorder}`,
              color: isDark ? 'var(--color-text-secondary)' : '#475569',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
              fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: data.total_pages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === data.total_pages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => (
              <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span style={{ color: isDark ? 'var(--color-text-muted)' : '#94A3B8', fontSize: '0.875rem' }}>…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 34, borderRadius: 'var(--radius-md)',
                    background: p === page ? 'var(--color-primary)' : inputBg,
                    border: `1px solid ${p === page ? 'var(--color-primary)' : inputBorder}`,
                    color: p === page ? '#fff' : (isDark ? 'var(--color-text-secondary)' : '#475569'),
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                    boxShadow: p === page ? '0 0 12px rgba(30,111,255,0.3)' : 'none',
                  }}
                >
                  {p}
                </button>
              </span>
            ))}

          <button
            onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            style={{
              padding: '0.4375rem 0.875rem', borderRadius: 'var(--radius-md)',
              background: inputBg, border: `1px solid ${inputBorder}`,
              color: isDark ? 'var(--color-text-secondary)' : '#475569',
              cursor: page === data.total_pages ? 'not-allowed' : 'pointer',
              opacity: page === data.total_pages ? 0.4 : 1,
              fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
