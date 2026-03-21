import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { fetchLeaderboard } from '../services/api'
import SearchBar from '../components/SearchBar'
import { Trophy, Medal } from 'lucide-react'

export default function Leaderboard() {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadLeaderboard()
    
    // Subscribe to score changes
    const channel = supabase.channel('realtime_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        loadLeaderboard()
      })
      .subscribe()

    // Listen to direct student point modifications
    const channelStudents = supabase.channel('realtime_students')
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
    }
  }

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students
    return students.filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [students, searchTerm])

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1'
    if (rank === 2) return 'rank-2'
    if (rank === 3) return 'rank-3'
    return ''
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-[#fbbf24]" size={28} />
    if (rank === 2) return <Medal className="text-[#e5e7eb]" size={28} />
    if (rank === 3) return <Medal className="text-[#d97706]" size={28} />
    return <span className="text-2xl font-bold text-[var(--muted)]">#{rank}</span>
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold gradient-text">Carnival Leaderboard</h1>
          <div className="flex items-center justify-center md:justify-start mt-2 text-[var(--muted)] font-bold tracking-widest">
            <span className="live-dot"></span> LIVE UPDATES
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary whitespace-nowrap px-8 py-3 text-sm tracking-widest font-bold shadow-[0_0_15px_rgba(167,139,250,0.3)] w-full sm:w-auto"
          >
            JOIN NOW
          </button>
          <div className="w-full sm:w-80">
            <SearchBar onSearch={setSearchTerm} />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {filteredStudents.map((student, index) => {
          const rank = index + 1
          return (
            <div 
              key={student.student_id} 
              className={`rank-item card flex items-center justify-between ${getRankClass(rank)}`}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 text-center flex justify-center">{getRankIcon(rank)}</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">{student.username}</h3>
                  <p className="text-[var(--muted)] text-sm md:text-base tracking-wider uppercase">{student.college}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl md:text-4xl font-bold text-[var(--primary-base)] drop-shadow-md">{student.total_points}</div>
                <div className="text-xs md:text-sm text-[var(--muted)] font-bold tracking-widest">PTS</div>
              </div>
            </div>
          )
        })}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)] font-bold text-lg">
            No players found.
          </div>
        )}
      </div>
    </div>
  )
}
