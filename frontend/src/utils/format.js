/**
 * Formatting utilities for dates, numbers, and prediction labels.
 */
import { format, formatDistanceToNow } from 'date-fns'

/** Format ISO date string to readable format */
export const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'MMM d, yyyy · h:mm a')
  } catch { return iso }
}

/** Relative time: "2 hours ago" */
export const timeAgo = (iso) => {
  if (!iso) return '—'
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) }
  catch { return iso }
}

/** Format probability to percentage string */
export const formatPct = (val, decimals = 1) =>
  `${(val * 100).toFixed(decimals)}%`

/** Format a number with commas */
export const formatNum = (n) => new Intl.NumberFormat().format(n)

/** Format currency */
export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

/** Get color CSS var name for confidence level */
export const getConfidenceColor = (conf) => ({
  High:   'var(--color-success)',
  Medium: 'var(--color-warning)',
  Low:    'var(--color-text-secondary)',
}[conf] || 'var(--color-text-secondary)')

/** Get color for prediction label */
export const getPredictionColor = (prediction) =>
  prediction === 'Churn' ? 'var(--color-danger)' : 'var(--color-success)'

/** Trigger CSV download from Blob */
export const downloadBlob = (blob, filename = 'export.csv') => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
