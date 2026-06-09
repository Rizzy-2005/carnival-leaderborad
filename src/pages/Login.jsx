import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loginStudent } from '../services/api'
import Loader from '../components/Loader'

export default function Login() {
  const [phone, setPhone]             = useState('')
  const [username, setUsername]       = useState('')
  const [college, setCollege]         = useState('')
  const [isRegistering, setIsRegistering] = useState(true)
  const [error, setError]             = useState('')
  const [message, setMessage]         = useState('')
  const [loading, setLoading]         = useState(false)
  const { loginStudentSession }       = useAuth()
  const navigate                      = useNavigate()

  /* ── Auth logic (unchanged) ────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const student = await loginStudent(
        phone,
        isRegistering ? username : null,
        isRegistering ? college  : null,
      )

      if (isRegistering && !student.isNewRecord) {
        setMessage('Account already exists with this phone number. Logging you in...')
        setTimeout(() => {
          loginStudentSession(student)
          navigate('/dashboard')
        }, 2000)
        return
      }

      loginStudentSession(student)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'USER_NOT_FOUND' || err.code === 'PGRST116') {
        if (!isRegistering) {
          setIsRegistering(true)
          setError('User not found. Please register.')
        } else {
          setError('Registration failed')
        }
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegistering((v) => !v)
    setError('')
    setMessage('')
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Floating bg orbs */}
      <div className="float-orb" style={{ width: 460, height: 460, top: '-18%', right: '-14%',  background: 'radial-gradient(circle, hsl(264,82%,55%), transparent)' }} />
      <div className="float-orb" style={{ width: 340, height: 340, bottom: '-8%', left: '-8%',  background: 'radial-gradient(circle, hsl(318,100%,60%), transparent)' }} />
      <div className="float-orb" style={{ width: 240, height: 240, bottom: '25%', right: '8%', background: 'radial-gradient(circle, hsl(38,96%,54%), transparent)', opacity: 0.18 }} />

      {loading && <Loader fullScreen />}

      <form
        onSubmit={handleLogin}
        className="glass-card animate-float-in"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, hsl(318,100%,62%), hsl(38,96%,54%), hsl(264,82%,58%))', borderRadius: '24px 24px 0 0' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          <div style={{ fontSize: '2.75rem', marginBottom: '0.65rem', lineHeight: 1 }}>🎟️</div>
          <h2
            className="shimmer-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '2rem',
              letterSpacing: '-0.02em',
              marginBottom: '0.4rem',
            }}
          >
            Player Portal
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            {isRegistering
              ? 'Create your account and join the carnival fun!'
              : 'Welcome back, carnival champion! 🎉'}
          </p>
        </div>

        {/* Error / success banners */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '12px',
            color: 'var(--red)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(20,184,166,0.1)',
            border: '1px solid rgba(20,184,166,0.3)',
            borderRadius: '12px',
            color: 'var(--green)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {message}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <input
            id="login-phone"
            type="tel"
            placeholder="📱  Phone Number"
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          {isRegistering && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input
                id="login-username"
                type="text"
                placeholder="🎭  Username"
                className="input-field"
                style={{ textTransform: 'uppercase' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                id="login-college"
                type="text"
                placeholder="🏫  College"
                className="input-field"
                style={{ textTransform: 'uppercase' }}
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', fontSize: '1rem', padding: '1rem', marginTop: '0.15rem' }}
        >
          {loading
            ? '⏳ Processing...'
            : isRegistering
            ? '🚀 Register & Play'
            : '🎉 Let\'s Go!'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>or</span>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Toggle mode */}
        <button
          id="login-toggle"
          type="button"
          onClick={toggleMode}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '9999px',
            padding: '0.8rem',
            color: 'var(--muted)',
            fontSize: '0.83rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            letterSpacing: '0.03em',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          {isRegistering
            ? '👤  Already have an account? Login'
            : '✨  New player? Register here'}
        </button>
      </form>
    </div>
  )
}
