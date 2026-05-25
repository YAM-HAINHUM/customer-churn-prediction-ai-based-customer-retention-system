/**
 * All API endpoints — predictions, history, analytics, chat, admin.
 */
import client, { uploadFile } from './client'

export const predictionsAPI = {
  // ── Core Prediction ──────────────────────────────────────────────────────
  predict: (customerData) =>
    client.post('/predict', { customer_data: customerData }).then(r => r.data),

  modelStatus: () => client.get('/predict/status').then(r => r.data),
  modelInfo:   () => client.get('/predict/model/info').then(r => r.data),

  // ── History ──────────────────────────────────────────────────────────────
  getHistory: (page = 1, pageSize = 10) =>
    client.get('/history', { params: { page, page_size: pageSize } }).then(r => r.data),
  deleteRecord: (id) => client.delete(`/history/${id}`).then(r => r.data),
  exportCSV:    () => client.get('/history/export/csv', { responseType: 'blob' }).then(r => r.data),
  getInsights:  () => client.get('/history/insights/summary').then(r => r.data),

  // ── Upload ───────────────────────────────────────────────────────────────
  bulkPredict:         (formData) => uploadFile('/upload/predict', formData, false),
  bulkPredictDownload: (formData) => uploadFile('/upload/predict/download', formData, true),

  // ── Admin ────────────────────────────────────────────────────────────────
  adminStats: () => client.get('/admin/stats').then(r => r.data),
  retrain:    () => client.post('/admin/retrain').then(r => r.data),

  // ── Advanced Analytics ───────────────────────────────────────────────────
  simulate:        (customerData, actions) =>
    client.post('/analytics/simulate', { customer_data: customerData, actions }).then(r => r.data),
  simulatorActions: () => client.get('/analytics/simulator/actions').then(r => r.data),
  explainPrediction: (customerData, probability) =>
    client.post('/analytics/explain', { customer_data: customerData, probability }).then(r => r.data),
  getSegments:     () => client.get('/analytics/segments').then(r => r.data),
  getForecast:     (periods = 30) =>
    client.get('/analytics/forecast', { params: { periods } }).then(r => r.data),
  calculateCLV:    (customerData, probability) =>
    client.post('/analytics/clv', { customer_data: customerData, probability }).then(r => r.data),
  getAnomalies:    () => client.get('/analytics/anomalies').then(r => r.data),
  getRevenue:      () => client.get('/analytics/revenue').then(r => r.data),
  compareModels:   () => client.get('/analytics/models/compare').then(r => r.data),
  analyzeSentiment: (text) =>
    client.post('/analytics/sentiment', { text }).then(r => r.data),

  // ── Chat ─────────────────────────────────────────────────────────────────
  chat: (message, history = []) =>
    client.post('/chat/message', { message, history }).then(r => r.data),
}
