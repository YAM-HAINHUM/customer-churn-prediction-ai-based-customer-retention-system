/**
 * AuthContext — global authentication state.
 * Stores user, JWT token (localStorage), and exposes login/logout helpers.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'churn_token'
const USER_KEY  = 'churn_user'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)

  /** Persist token + user to localStorage */
  const persist = useCallback((tokenVal, userVal) => {
    if (tokenVal) {
      localStorage.setItem(TOKEN_KEY, tokenVal)
      localStorage.setItem(USER_KEY, JSON.stringify(userVal))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
    setToken(tokenVal)
    setUser(userVal)
  }, [])

  /** Register a new user and auto-login */
  const register = useCallback(async (name, email, password) => {
    setLoading(true)
    try {
      const data = await authAPI.register({ name, email, password })
      persist(data.access_token, data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }, [persist])

  /** Login with email/password */
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await authAPI.login({ email, password })
      persist(data.access_token, data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Invalid credentials' }
    } finally {
      setLoading(false)
    }
  }, [persist])

  /** Clear auth state */
  const logout = useCallback(() => {
    persist(null, null)
  }, [persist])

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
