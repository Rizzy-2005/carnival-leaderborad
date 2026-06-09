import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { fetchLeaderboard } from '../services/api'
import SearchBar from '../components/SearchBar'
import couponImage from '../assets/final1.png'
import Loader from '../components/Loader'

/* ─── Helpers ───────────────────────────────────────────────── */
const getAvatar = (seed) =>
  `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(String(seed))}`

const CONFETTI_COLORS = [
  '#f5a623', '#f43f5e', '#7c3aed',
  '#14b8a6', '#ffffff', '#ff33a8',
  '#fbbf24', '#22d3ee',
]

/* ─── Confetti Burst ────────────────────────────────────────── */
function ConfettiParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle    = (i / 18) * 360
    const dist     = 38 + Math.random() * 42
    const rad      = (angle * Math.PI) / 180
    return {
      id:    i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      tx:    Math.cos(rad) * dist,
      ty:    -Math.abs(Math.sin(rad) * dist) - 18,
      delay: i * 0.038,
    }
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            background: p.color,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Podium Card ───────────────────────────────────────────── */
const PODIUM_CONFIG = {
  1: {
    podBorder:   '#f5a623',
    podGlow:     'rgba(245,166,35,0.45)',
    platformH:   96,
    platformBg:  'linear-gradient(180deg, rgba(245,166,35,0.2) 0%, rgba(245,166,35,0.04) 100%)',
    crown:       '👑',
    cardClass:   'rank-1-card',
    animDelay:   '0.08s',
  },
  2: {
    podBorder:   '#c0c0c0',
    podGlow:     'rgba(192,192,192,0.28)',
    platformH:   64,
    platformBg:  'linear-gradient(180deg, rgba(192,192,192,0.14) 0%, rgba(192,192,192,0.03) 100%)',
    crown:       '🥈',
    cardClass:   '',
    animDelay:   '0.22s',
  },
  3: {
    podBorder:   '#cd7f32',
    podGlow:     'rgba(205,127,50,0.28)',
    platformH:   44,
    platformBg:  'linear-gradient(180deg, rgba(205,127,50,0.14) 0%, rgba(205,127,50,0.03) 100%)',
    crown:       '🥉',
    cardClass:   '',
    animDelay:   '0.36s',
  },
}

function PodiumCard({ student, rank }) {
  const [cheering, setCheering] = useState(false)
  const c = PODIUM_CONFIG[rank]

  const handleCheer = () => {
    if (cheering) return
    setCheering(true)
    setTimeout(() => setCheering(false), 1200)
  }

  return (
    <div
      className={`podium-card ${c.cardClass}`}
      style={{
        '--pod-border': c.podBorder,
        '--pod-glow':   c.podGlow,
        animationDelay: c.animDelay,
      }}
    >
      {/* Crown */}
      <div className="podium-crown">{c.crown}</div>

      {/* Avatar with confetti origin */}
      <div className="podium-avatar-wrap">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={getAvatar(student.student_id)}
            alt={student.username}
            className="podium-avatar"
          />
          {cheering && <ConfettiParticles />}
        </div>
      </div>

      {/* Info */}
      <div className="podium-name">{student.username}</div>
      <div className="podium-college">{student.college}</div>
      <div className="podium-score">
        {student.total_points}
        <span className="pts-label">pts</span>
      </div>

      {/* Cheer */}
      <button
        className={`cheer-btn ${cheering ? 'cheering' : ''}`}
        onClick={handleCheer}
        aria-label={`Cheer for ${student.username}`}
      >
        🎉 Cheer
      </button>

      {/* Podium platform */}
      <div
        className="podium-platform"
        style={{ height: `${c.platformH}px`, background: c.platformBg }}
      >
        <span>#{rank}</span>
      </div>
    </div>
  )
}

/* ─── Main Leaderboard ──────────────────────────────────────── */
export default function Leaderboard() {
  const [students, setStudents]     = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading]       = useState(true)
  const [cheerMap, setCheerMap]     = useState({})
  const navigate = useNavigate()

  /* ── Realtime subscriptions (unchanged logic) ─────────────── */
  useEffect(() => {
    loadLeaderboard()

    const channel = supabase
      .channel('realtime_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        loadLeaderboard()
      })
      .subscribe()

    const channelStudents = supabase
      .channel('realtime_students')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, () => {
        loadLeaderboard()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(channelStudents)
    }
  }, [])

  const loadLeaderboard = async () => {
    try {
      const data = await fetchLeaderboard()
      setStudents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Cheer handler ────────────────────────────────────────── */
  const handleCheer = (id) => {
    if (cheerMap[id]) return
    setCheerMap((prev) => ({ ...prev, [id]: true }))
    setTimeout(
      () => setCheerMap((prev) => { const n = { ...prev }; delete n[id]; return n }),
      1200,
    )
  }

  /* ── Derived data ─────────────────────────────────────────── */
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students
    return students.filter((s) =>
      s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  // Map student_id → actual rank in full leaderboard
  const rankMap = useMemo(() => {
    const m = {}
    students.forEach((s, i) => { m[s.student_id] = i + 1 })
    return m
  }, [students])

  const showPodium    = !searchTerm && students.length > 0
  const top3          = students.slice(0, 3)
  const listStudents  = showPodium ? students.slice(3) : filteredStudents

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div
      className="bg-leaderboard min-h-screen text-white"
      style={{ selection: 'unset' }}
    >
      {/* Depth orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div
        className="max-w-4xl mx-auto px-4"
        style={{ paddingTop: '1.5rem', paddingBottom: '1rem', position: 'relative', zIndex: 1 }}
      >
        {/* ── Event Image ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          {/* Layer 1: entry animation (springy drop-in) */}
          <div className="coupon-entry-wrap">
            {/* Layer 2: continuous floating drift */}
            <div className="coupon-float-wrap">
              {/* Layer 3: cycling glow + hover scale on the image itself */}
              <img
                src={couponImage}
                alt="Carnival Event"
                className="coupon-img"
                style={{ width: 'min(175px, 42vw)', objectFit: 'contain' }}
                draggable="false"
              />
            </div>
          </div>
        </div>


        {/* ── Header ─────────────────────────────────────────── */}
        <header className="animate-float-in" style={{ marginBottom: '2rem', animationDelay: '0.1s' }}>

          {/* Title block — no card, just type on the scene */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginBottom: '1.1rem',
            paddingLeft: '0.25rem',
          }}>
            <div style={{
              borderLeft: '4px solid hsl(38,96%,54%)',
              paddingLeft: '1rem',
            }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2.4rem, 8vw, 4rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  marginBottom: '0.45rem',
                  color: 'white',
                  textShadow: '0 2px 40px rgba(255,255,255,0.12)',
                }}
              >
                Carnival
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--green)',
              }}>
                <span className="live-dot" />
                Live Rankings
              </div>
            </div>

            {/* Join button — custom style, not generic pill */}
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.22)',
                borderRadius: '14px',
                padding: '0.65rem 1.4rem',
                color: 'white',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.38)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <span style={{ fontSize: '1rem' }}>🎟️</span> Join Now
            </button>
          </div>

          {/* Search — slim frosted bar, separate from the title */}
          <div style={{
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '0.2rem 0.2rem',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <SearchBar onSearch={setSearchTerm} />
          </div>
        </header>

        {/* ── Content ────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '5rem 0' }}><Loader /></div>
        ) : (
          <>
            {/* ── Podium (top 3) ─────────────────────────────── */}
            {showPodium && top3.length > 0 && (
              <div className="podium-section" style={{ marginBottom: '2.5rem' }}>
                {/* Section label */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    🏆 &nbsp;Hall of Champions&nbsp; 🏆
                  </p>
                </div>

                <div className="podium-row">
                  {top3[1] && <PodiumCard student={top3[1]} rank={2} />}
                  {top3[0] && <PodiumCard student={top3[0]} rank={1} />}
                  {top3[2] && <PodiumCard student={top3[2]} rank={3} />}
                </div>
              </div>
            )}

            {/* ── Ranked List ────────────────────────────────── */}
            {listStudents.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                  🎠 &nbsp;{showPodium ? 'Other Competitors' : 'Search Results'}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingBottom: '3.5rem' }}>
              {listStudents.map((student) => {
                const rank       = rankMap[student.student_id]
                const isCheering = !!cheerMap[student.student_id]

                return (
                  <div
                    key={student.student_id}
                    className="rank-list-item glass-card-sm"
                  >
                    {/* Left: rank + avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div className="rank-badge">#{rank}</div>

                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={getAvatar(student.student_id)}
                          alt={student.username}
                          className="list-avatar"
                        />
                        {isCheering && <ConfettiParticles />}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: 'white',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {student.username}
                        </div>
                        <div style={{
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'var(--muted)',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {student.college}
                        </div>
                      </div>
                    </div>

                    {/* Right: score + cheer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: '1.6rem',
                          color: 'white',
                          lineHeight: 1,
                        }}>
                          {student.total_points}
                        </div>
                        <div style={{
                          fontSize: '0.58rem',
                          color: 'var(--muted)',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                        }}>
                          pts
                        </div>
                      </div>

                      <button
                        className={`cheer-btn-sm ${isCheering ? 'cheering' : ''}`}
                        onClick={() => handleCheer(student.student_id)}
                        aria-label={`Cheer for ${student.username}`}
                      >
                        🎉
                      </button>
                    </div>
                  </div>
                )
              })}

              {!loading && filteredStudents.length === 0 && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontWeight: 700, fontSize: '1.1rem' }}>
                  No players found 🎠
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
