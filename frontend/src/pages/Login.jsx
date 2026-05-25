/**
 * Login — Glassmorphism design with animated background orbs.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle, Zap, ArrowRight, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* Floating orb background */
function GlassBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Deep gradient base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #0D1B3E 0%, #060B14 60%, #020408 100%)',
      }} />
      {/* Orb 1 — blue */}
      <div style={{
        position: 'absolute', width: 600, height: 600,
        borderRadius: '50%', top: '-15%', left: '-10%',
        background: 'radial-gradient(circle, rgba(30,111,255,0.18) 0%, transparent 70%)',
        animation: 'orb1 12s ease-in-out infinite',
        filter: 'blur(40px)',
      }} />
      {/* Orb 2 — cyan */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', bottom: '-10%', right: '-5%',
        background: 'radial-gradient(circle, rgba(0,198,255,0.14) 0%, transparent 70%)',
        animation: 'orb2 15s ease-in-out infinite',
        filter: 'blur(50px)',
      }} />
      {/* Orb 3 — purple accent */}
      <div style={{
        position: 'absolute', width: 350, height: 350,
        borderRadius: '50%', top: '40%', right: '20%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        animation: 'orb3 18s ease-in-out infinite',
        filter: 'blur(60px)',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(30,111,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,111,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [apiErr, setApiErr] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ email, password }) => {
    setApiErr('')
    const result = await login(email, password)
    if (result.success) navigate('/app/dashboard')
    else setApiErr(result.error)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', padding: '1rem',
    }}>
      <GlassBackground />

      <div style={{
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
        animation: 'slideUp 0.5s ease',
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 1.25rem',
            background: 'linear-gradient(135deg, #1E6FFF, #00C6FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(30,111,255,0.5), 0 0 64px rgba(30,111,255,0.2)',
            animation: 'float 4s ease-in-out infinite',
          }}>
            <Zap size={26} color="#fff" fill="#fff" />
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #E8EEFF 30%, #7BB3FF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(123,143,175,0.9)' }}>
            Sign in to your ChurnPredictor account
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-card" style={{ padding: '2.25rem' }}>
          {/* Error alert */}
          {apiErr && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem',
              marginBottom: '1.5rem', color: '#FCA5A5', fontSize: '0.875rem',
              animation: 'fadeIn 0.2s ease',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {apiErr}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="glass-label">Email address</label>
              <input
                className="glass-input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                style={errors.email ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                })}
              />
              {errors.email && (
                <p className="form-error" style={{ marginTop: '0.375rem' }}>
                  <AlertCircle size={12} />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="glass-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="glass-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    paddingRight: '2.75rem',
                    ...(errors.password ? { borderColor: 'rgba(239,68,68,0.5)' } : {}),
                  }}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'rgba(123,143,175,0.7)', padding: 0,
                  transition: 'color 0.15s',
                }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="form-error" style={{ marginTop: '0.375rem' }}>
                  <AlertCircle size={12} />{errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              className="btn-primary"
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.9375rem' }}
            >
              {isSubmitting ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            margin: '1.5rem 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(123,143,175,0.5)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Security note */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            fontSize: '0.75rem', color: 'rgba(123,143,175,0.6)',
          }}>
            <Shield size={12} />
            Secured with JWT + bcrypt encryption
          </div>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          fontSize: '0.9375rem', color: 'rgba(123,143,175,0.8)',
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{
            color: '#60A5FA', fontWeight: 600, textDecoration: 'none',
            transition: 'color 0.15s',
          }}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
