import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchStudentScores, fetchLeaderboard, getStudentDetails } from '../services/api'
import QRDisplay from '../components/QRDisplay'
import { LogOut } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function Dashboard() {
  const { student, logoutStudent } = useAuth()
  const navigate = useNavigate()
  const [scores, setScores] = useState([])
  const [rank, setRank] = useState('-')
  const [currentPoints, setCurrentPoints] = useState(student?.total_points || 0)

  useEffect(() => {
    if (!student) return
    loadData()

    const channel = supabase.channel(`student_${student.student_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `student_id=eq.${student.student_id}` }, () => {
        loadData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students', filter: `student_id=eq.${student.student_id}` }, (payload) => {
        setCurrentPoints(payload.new.total_points)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [student])

  const loadData = async () => {
    try {
      const [scoresData, leaderboard] = await Promise.all([
        fetchStudentScores(student.student_id),
        fetchLeaderboard()
      ])
      setScores(scoresData)
      
      const r = leaderboard.findIndex(s => s.student_id === student.student_id) + 1
      setRank(r > 0 ? r : '-')
      
      const details = await getStudentDetails(student.student_id)
      setCurrentPoints(details.total_points)
    } catch (err) {
      console.error("Failed to load dashboard data", err)
    }
  }

  const handleLogout = () => {
    logoutStudent()
    navigate('/')
  }

  if (!student) return null

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <header className="flex justify-between items-center bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide mb-1">Hi, {student.username}</h1>
          <p className="text-[var(--accent)] text-sm tracking-widest uppercase font-bold">{student.college}</p>
        </div>
        <button onClick={handleLogout} className="text-[var(--muted)] hover:text-white transition-colors bg-[rgba(255,255,255,0.05)] p-3 rounded-full hover:bg-[rgba(255,255,255,0.1)]">
          <LogOut size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card flex flex-col items-center justify-center text-center pb-8 border-[var(--primary-base)] border-2 shadow-[0_0_30px_rgba(255,0,127,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[var(--primary-base)] opacity-10 blur-[100px] pointer-events-none"></div>
          <h2 className="text-lg font-bold mb-6 text-[var(--accent)] tracking-widest drop-shadow-md">YOUR PLAYER PASS</h2>
          <div className="bg-white p-2 rounded-[24px]">
            <QRDisplay studentId={student.student_id} />
          </div>
          <p className="mt-6 text-sm text-[var(--muted)] font-bold tracking-widest">SHOW TO ADMIN FOR POINTS</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card text-center py-10 flex-1 flex flex-col justify-center border-t-4 border-t-[var(--green)]">
            <div className="text-sm text-[var(--muted)] tracking-widest mb-2 font-bold uppercase">Total Points</div>
            <div className="text-7xl font-bold text-white drop-shadow-lg">{currentPoints}</div>
          </div>
          
          <div className="card text-center py-10 flex-1 flex flex-col justify-center border-t-4 border-t-[var(--primary-base)]">
            <div className="text-sm text-[var(--muted)] tracking-widest mb-2 font-bold uppercase">Current Rank</div>
            <div className="text-5xl font-bold gradient-text drop-shadow-lg">#{rank}</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h3 className="text-xl font-bold mb-6 tracking-wide pb-4 border-b border-[var(--border)]">GAME HISTORY</h3>
        {scores.length === 0 ? (
          <p className="text-[var(--muted)] py-8 text-center font-bold tracking-widest">NO GAMES PLAYED YET</p>
        ) : (
          <div className="flex flex-col gap-4">
            {scores.map(s => (
              <div key={s.score_id} className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-4 last:border-0 last:pb-0 group hover:bg-[rgba(255,255,255,0.02)] p-2 rounded-lg transition-colors">
                <div className="flex flex-col">
                  <div className="font-bold text-lg text-white tracking-wide">{s.games?.game_name || 'Unknown Game'}</div>
                  <div className="text-xs text-[var(--muted)] font-bold tracking-widest">{new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-2xl font-bold text-[var(--green)] drop-shadow-md">+{s.points}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
