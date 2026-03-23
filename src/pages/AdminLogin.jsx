import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loginAdmin } from '../services/api'
import { Shield } from 'lucide-react'
import Loader from '../components/Loader'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginAdminSession } = useAuth()
  const navigate = useNavigate()

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {loading && <Loader fullScreen />}
      <form onSubmit={handleLogin} className="card w-full max-w-md flex flex-col gap-6 p-8 border-[var(--primary-base)] border border-opacity-30 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--primary-base)] opacity-10 blur-[80px] rounded-full point-events-none"></div>
        
        <div className="text-center mb-2 flex flex-col items-center">
          <Shield className="text-[var(--primary-base)] mb-4" size={48} />
          <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">Admin Portal</h2>
          <p className="text-[var(--muted)] text-sm tracking-widest uppercase">Authorized Personnel Only</p>
        </div>

        {error && <div className="p-3 bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] rounded-lg text-sm text-center font-bold tracking-wide">{error}</div>}

        <div className="flex flex-col gap-4 relative z-10">
          <input 
            type="text" 
            placeholder="Username" 
            className="input-field text-lg py-3 bg-[rgba(23,23,31,0.8)]" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field text-lg py-3 bg-[rgba(23,23,31,0.8)]" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full mt-4 text-lg py-3 tracking-widest relative z-10 border border-[var(--primary-base)] bg-[rgba(167,139,250,0.15)] hover:bg-[rgba(167,139,250,0.3)] transition-colors">
          {loading ? 'AUTHENTICATING...' : 'ACCESS PORTAL'}
        </button>
      </form>
    </div>
  )
}
