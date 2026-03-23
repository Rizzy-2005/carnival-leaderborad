import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { fetchLeaderboard } from '../services/api'
import SearchBar from '../components/SearchBar'
import { Trophy, Medal } from 'lucide-react'
import couponImage from '../assets/final.png'
import Loader from '../components/Loader'

export default function Leaderboard() {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
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
    } finally {
      setLoading(false)
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
    <div className="bg-leaderboard min-h-screen p-4 md:p-8 text-white relative selection:bg-pink-500 selection:text-white">
      <div className="max-w-4xl mx-auto relative z-10">

        <div className="flex justify-center w-full mb-8 lg:mb-10 animate-fade-in pt-2">
          <img
            src={couponImage}
            alt="Leaderboard Event Coupon"
            className="w-full max-w-[150px] sm:max-w-[200px] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] hover:scale-[1.05] transition-transform duration-300 pointer-events-none"
            draggable="false"
          />
        </div>

        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 md:gap-4 p-6 bg-[rgba(20,10,35,0.4)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] pb-2">Carnival Leaderboard</h1>
            <div className="flex items-center justify-center md:justify-start mt-1 font-semibold tracking-widest text-xs sm:text-sm uppercase text-[#00ffaa]">
              <span className="live-dot shadow-[0_0_8px_#00ffaa]"></span> LIVE RANKINGS
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary whitespace-nowrap px-8 py-3.5 text-sm tracking-widest font-bold shadow-[0_4px_15px_rgba(255,0,127,0.3)] w-full sm:w-auto border border-[#ff007f] hover:-translate-y-1 transition-all"
            >
              JOIN NOW
            </button>
            <div className="w-full sm:w-72 shadow-lg rounded-xl">
              <SearchBar onSearch={setSearchTerm} />
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4 pb-10">
          {loading ? (
            <div className="py-8">
              <Loader />
            </div>
          ) : (
            filteredStudents.map((student, index) => {
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
            })
          )}
          {!loading && filteredStudents.length === 0 && (
            <div className="text-center py-12 text-[var(--muted)] font-bold text-lg">
              No players found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
