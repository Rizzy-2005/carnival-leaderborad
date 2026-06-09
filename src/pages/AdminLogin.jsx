import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loginAdmin } from '../services/api'
import { Shield } from 'lucide-react'
import Loader from '../components/Loader'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { loginAdminSession }   = useAuth()
  const navigate                = useNavigate()

  /* ── Auth logic (unchanged) ────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const admin = await loginAdmin(username, password)
      loginAdminSession(admin)
      if (admin.role === 'SUPER_ADMIN') {
        navigate('/super-admin')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
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
      {/* Moody bg orbs */}
      <div className="float-orb" style={{ width: 500, height: 500, top: '-22%', left: '-16%',  background: 'radial-gradient(circle, hsl(264,82%,40%), transparent)', opacity: 0.22 }} />
      <div className="float-orb" style={{ width: 360, height: 360, bottom: '-14%', right: '-10%', background: 'radial-gradient(circle, hsl(348,80%,40%), transparent)', opacity: 0.16 }} />

      {loading && <Loader fullScreen />}

      <form
        onSubmit={handleLogin}
        className="glass-card animate-float-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2.75rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(124,58,237,0.28)',
          boxShadow: '0 8px 60px rgba(124,58,237,0.18), 0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, hsl(264,82%,58%), hsl(318,100%,62%))', borderRadius: '24px 24px 0 0' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 76, height: 76,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(124,58,237,0.14)',
            border: '1.5px solid rgba(124,58,237,0.38)',
            borderRadius: '22px',
            marginBottom: '1.1rem',
            boxShadow: '0 0 28px rgba(124,58,237,0.25)',
          }}>
            <Shield size={38} style={{ color: 'hsl(264,82%,72%)' }} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.85rem',
            color: 'white',
            marginBottom: '0.3rem',
            letterSpacing: '-0.01em',
          }}>
            Admin Portal
          </h2>
          <p style={{
            color: 'var(--muted)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 600,
          }}>
            Authorized Personnel Only
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '12px',
            color: 'var(--red)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <input
            id="admin-username"
            type="text"
            placeholder="Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            id="admin-password"
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <button
          id="admin-submit"
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            fontSize: '1rem',
            padding: '1rem',
            marginTop: '0.15rem',
          }}
        >
          {loading ? '🔐 Authenticating...' : '🛡️ Access Portal'}
        </button>
      </form>
    </div>
  )
}
