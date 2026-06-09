import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchStudentScores, fetchLeaderboard, getStudentDetails } from '../services/api'
import QRDisplay from '../components/QRDisplay'
import { LogOut } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const getAvatar = (seed) =>
  `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(String(seed))}`

export default function Dashboard() {
  const { student, logoutStudent } = useAuth()
  const navigate                   = useNavigate()
  const [scores, setScores]        = useState([])
  const [rank, setRank]            = useState('-')
  const [currentPoints, setCurrentPoints] = useState(student?.total_points || 0)

  /* ── Realtime + data load (unchanged logic) ─────────────────── */
  useEffect(() => {
    if (!student) return
    loadData()

    const channel = supabase
      .channel(`student_${student.student_id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'scores',
        filter: `student_id=eq.${student.student_id}`,
      }, () => { loadData() })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'students',
        filter: `student_id=eq.${student.student_id}`,
      }, (payload) => { setCurrentPoints(payload.new.total_points) })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [student])

  const loadData = async () => {
    try {
      const [scoresData, leaderboard] = await Promise.all([
        fetchStudentScores(student.student_id),
        fetchLeaderboard(),
      ])
      setScores(scoresData)
      const r = leaderboard.findIndex((s) => s.student_id === student.student_id) + 1
      setRank(r > 0 ? r : '-')
      const details = await getStudentDetails(student.student_id)
      setCurrentPoints(details.total_points)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    }
  }

  const handleLogout = () => {
    logoutStudent()
    navigate('/')
  }

  if (!student) return null

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '1.5rem 1rem',
        maxWidth: '56rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        position: 'relative',
      }}
    >
      {/* Background orbs */}
      <div className="float-orb" style={{ width: 480, height: 480, top: '-20%', right: '-16%',  background: 'radial-gradient(circle, hsl(264,82%,55%), transparent)' }} />
      <div className="float-orb" style={{ width: 380, height: 380, bottom: '-12%', left: '-12%', background: 'radial-gradient(circle, hsl(318,100%,60%), transparent)' }} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="glass-card animate-float-in"
        style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <img
            src={getAvatar(student.student_id)}
            alt="Your avatar"
            style={{
              width: 54, height: 54,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '0.2rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Hi, {student.username} 👋
            </h1>
            <p style={{
              color: 'var(--accent)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {student.college}
            </p>
          </div>
        </div>

        <button
          id="dashboard-logout"
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '0.65rem',
            color: 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--muted)' }}
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* QR Card */}
        <div
          className="glass-card"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1.5px solid rgba(245,166,35,0.28)',
            boxShadow: '0 0 48px rgba(245,166,35,0.1), 0 8px 32px rgba(0,0,0,0.55)',
          }}
        >
          {/* Gold top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, hsl(318,100%,62%), hsl(38,96%,54%), hsl(172,76%,45%))' }} />
          {/* Subtle bg glow */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(245,166,35,0.07), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1.5rem',
          }}>
            🎫 Your Player Pass
          </div>

          <div style={{ background: 'white', padding: '0.625rem', borderRadius: '16px', boxShadow: '0 6px 24px rgba(0,0,0,0.6)' }}>
            <QRDisplay studentId={student.student_id} />
          </div>

          <p style={{ marginTop: '1.1rem', fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Show to admin for points
          </p>
        </div>

        {/* Stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Total Points */}
          <div
            className="glass-card"
            style={{
              padding: '2rem',
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '1.5px solid rgba(20,184,166,0.28)',
              boxShadow: '0 0 40px rgba(20,184,166,0.08)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, hsl(172,76%,45%), hsl(160,100%,56%))' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 60%, rgba(20,184,166,0.06), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.6rem' }}>
              Total Points
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 8vw, 4.5rem)',
              color: 'white',
              lineHeight: 1,
              textShadow: '0 0 40px rgba(20,184,166,0.55)',
            }}>
              {currentPoints}
            </div>
          </div>

          {/* Current Rank */}
          <div
            className="glass-card"
            style={{
              padding: '2rem',
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '1.5px solid rgba(124,58,237,0.28)',
              boxShadow: '0 0 40px rgba(124,58,237,0.08)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, hsl(264,82%,58%), hsl(318,100%,62%))' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 60%, rgba(124,58,237,0.06), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.6rem' }}>
              Current Rank
            </div>
            <div
              className="shimmer-text"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
                lineHeight: 1,
              }}
            >
              #{rank}
            </div>
          </div>
        </div>
      </div>

      {/* ── Game History ─────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--accent)',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          🎮 Game History
        </h3>

        {scores.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0', fontWeight: 600, letterSpacing: '0.05em' }}>
            No games played yet — go win some points! 🎠
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {scores.map((s) => (
              <div
                key={s.score_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.18s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: 'white',
                    fontSize: '0.95rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.games?.game_name || 'Unknown Game'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em', marginTop: '0.1rem' }}>
                    {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '1.45rem',
                  color: 'var(--green)',
                  flexShrink: 0,
                  marginLeft: '1rem',
                }}>
                  +{s.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
