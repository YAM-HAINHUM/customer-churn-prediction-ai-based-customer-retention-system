/**
 * Authentication API endpoints.
 */
import client from './client'

export const authAPI = {
  /** POST /auth/register */
  register: (data) => client.post('/auth/register', data).then(r => r.data),

  /** POST /auth/login */
  login: (data) => client.post('/auth/login', data).then(r => r.data),

  /** GET /auth/me */
  me: () => client.get('/auth/me').then(r => r.data),
}
