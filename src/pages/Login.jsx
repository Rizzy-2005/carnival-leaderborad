import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loginStudent } from '../services/api'
import Loader from '../components/Loader'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [college, setCollege] = useState('')
  const [isRegistering, setIsRegistering] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginStudentSession } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const student = await loginStudent(phone, isRegistering ? username : null, isRegistering ? college : null)

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {loading && <Loader fullScreen />}
      <form onSubmit={handleLogin} className="card w-full max-w-md flex flex-col gap-6 p-8">
        <div className="text-center mb-2">
          <h2 className="text-4xl font-bold gradient-text mb-2">Player Portal</h2>
          <p className="text-[var(--muted)]">{isRegistering ? 'Create your new player account' : 'Login with your phone number'}</p>
        </div>

        {error && <div className="p-3 bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] rounded-lg text-sm text-center font-bold tracking-wide">{error}</div>}
        {message && <div className="p-3 bg-[rgba(52,211,153,0.1)] text-[var(--green)] border border-[rgba(52,211,153,0.3)] rounded-lg text-sm text-center font-bold tracking-wide">{message}</div>}

        <div className="flex flex-col gap-4">
          <input
            type="tel"
            placeholder="Phone Number"
            className="input-field text-lg py-3"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />

          {isRegistering && (
            <div className="animate-fade-in flex flex-col gap-4">
              <input
                type="text"
                placeholder="Username"
                className="input-field text-lg py-3 uppercase"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="College"
                className="input-field text-lg py-3 uppercase"
                value={college}
                onChange={e => setCollege(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 text-xl py-3 drop-shadow-lg tracking-widest">
          {loading ? 'PROCESSING...' : (isRegistering ? 'REGISTER & PLAY' : 'LOGIN')}
        </button>

        <div className="my-5 w-full flex items-center justify-center gap-4">
          <div className="h-px bg-gradient-to-r from-transparent to-[var(--border)] flex-1"></div>
          <span className="text-xs text-[var(--muted)] font-bold tracking-widest uppercase drop-shadow-sm">OR</span>
          <div className="h-px bg-gradient-to-l from-transparent to-[var(--border)] flex-1"></div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setMessage('');
          }}
          className="btn-primary w-full mt-1 text-sm py-3 drop-shadow-lg tracking-widest"
        >
          {isRegistering ? 'ALREADY HAVE AN ACCOUNT? LOGIN' : 'NEW PLAYER? REGISTER HERE'}
        </button>
      </form>
    </div>
  )
}
