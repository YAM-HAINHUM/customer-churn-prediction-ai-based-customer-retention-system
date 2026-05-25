/**
 * Axios client with JWT interceptors.
 * Automatically attaches Bearer token and handles 401 redirects.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

/** Attach JWT token to every request */
client.interceptors.request.use(config => {
  const token = localStorage.getItem('churn_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // For FormData, remove Content-Type so browser sets multipart + boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    delete config.headers.post?.['Content-Type']
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

/** Handle 401 — clear token and redirect to login */
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('churn_token')
      localStorage.removeItem('churn_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

/**
 * Upload a file using native fetch (bypasses axios header defaults entirely).
 * Returns parsed JSON response or Blob.
 */
export async function uploadFile(path, formData, asBlob = false) {
  const token = localStorage.getItem('churn_token')
  // Use absolute URL so fetch goes through Vite proxy correctly
  const base = import.meta.env.VITE_API_URL || '/api'
  const url = `${base}${path}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      // NO Content-Type — browser sets multipart/form-data + boundary automatically
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      detail = json.detail || JSON.stringify(json)
    } catch {}
    const err = new Error(detail)
    err.response = { status: res.status, data: { detail } }
    throw err
  }

  return asBlob ? res.blob() : res.json()
}

export default client
