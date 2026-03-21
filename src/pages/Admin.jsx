import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getStudentDetails, fetchActiveGames, addScoreAPI, undoScoreAPI } from '../services/api'
import QRScanner from '../components/QRScanner'
import PointsInput from '../components/PointsInput'
import { LogOut, ScanLine, ArrowLeft, Trophy, RotateCcw } from 'lucide-react'

export default function Admin() {
  const { admin, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState('')
  
  const [state, setState] = useState('IDLE') // IDLE, SCANNING, STUDENT_LOADED, LOADING, SUCCESS
  const [student, setStudent] = useState(null)
  const [points, setPoints] = useState(0)
  const [lastScoreId, setLastScoreId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      const activeGames = await fetchActiveGames()
      setGames(activeGames)
      if (activeGames.length > 0) {
        setSelectedGame(activeGames[0].game_id)
      }
    } catch (err) {
      console.error("Failed to load games", err)
    }
  }

  const handleScan = async (data) => {
    if (!data || !data.startsWith('student:')) {
      setError('Invalid QR Format. Must be a student pass.')
      return
    }
    const studentId = data.replace('student:', '')
    
    setState('LOADING')
    try {
      const studentData = await getStudentDetails(studentId)
      setStudent(studentData)
      setState('STUDENT_LOADED')
      setPoints(0)
      setLastScoreId(null)
      setError('')
      // play success beep implicitly or explicitly via Audio API
    } catch (err) {
      setError('Invalid or unknown student QR')
      setState('SCANNING')
    }
  }

  const handleAddPoints = async () => {
    if (!selectedGame || points <= 0 || !student) return
    setState('LOADING')
    setError('')
    try {
      const result = await addScoreAPI({
        student_id: student.student_id,
        game_id: selectedGame,
        points: Number(points),
        admin_id: admin.admin_id
      })
      setLastScoreId(result.score_id)
      setState('SUCCESS')
    } catch (err) {
      setError(err.message)
      setState('STUDENT_LOADED')
    }
  }

  const handleUndo = async () => {
    if (!lastScoreId) return
    setState('LOADING')
    try {
      await undoScoreAPI({ score_id: lastScoreId, admin_id: admin.admin_id })
      setLastScoreId(null)
      setError('')
      setState('IDLE')
      setStudent(null)
    } catch (err) {
      setError('Undo failed: ' + err.message)
      setState('SUCCESS')
    }
  }

  const resetScanner = () => {
    setState('SCANNING')
    setStudent(null)
    setPoints(0)
    setLastScoreId(null)
    setError('')
  }

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin-login')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-xl mx-auto flex flex-col">
      <header className="flex justify-between items-center mb-8 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-widest">POINT STATION</h1>
          <p className="text-xs text-[var(--accent)] tracking-widest uppercase mt-1 font-bold">ADMIN: {admin?.username}</p>
        </div>
        <button onClick={handleLogout} className="text-[var(--muted)] hover:text-[var(--red)] transition-colors p-2 bg-[rgba(255,255,255,0.05)] rounded-full">
          <LogOut size={20} />
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] rounded-xl text-sm text-center font-bold tracking-wide shadow-lg">
          {error}
        </div>
      )}

      {state === 'IDLE' && (
        <div className="flex-1 flex flex-col items-center justify-center py-6 animate-fade-in">
          <div className="card w-full flex flex-col items-center gap-8 py-16 border-[var(--primary-base)] border-2 relative overflow-hidden shadow-[0_0_40px_rgba(167,139,250,0.15)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--primary-base)] opacity-10 blur-[80px]"></div>
            <ScanLine size={80} className="text-[var(--primary-base)] relative z-10" />
            <div className="text-center relative z-10">
              <h2 className="text-2xl font-bold tracking-widest text-white mb-2">READY</h2>
              <p className="text-[var(--muted)] font-bold tracking-widest text-sm uppercase">Tap below to assign points</p>
            </div>
            <button onClick={() => setState('SCANNING')} className="btn-primary w-full max-w-xs text-xl py-5 shadow-[0_0_20px_rgba(167,139,250,0.4)] tracking-widest relative z-10 font-bold border border-[var(--primary-base)] bg-[rgba(167,139,250,0.2)] hover:bg-[rgba(167,139,250,0.4)]">
              SCAN QR
            </button>
          </div>
        </div>
      )}

      {state === 'SCANNING' && (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in">
          <button onClick={() => {setState('IDLE'); setError('')}} className="flex items-center gap-2 text-[var(--muted)] hover:text-white font-bold tracking-widest text-sm uppercase self-start bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)]">
            <ArrowLeft size={16} /> Cancel
          </button>
          <div className="card p-4 flex flex-col items-center border-[var(--primary-base)] border border-opacity-30 relative overflow-hidden text-center shadow-[0_0_30px_rgba(167,139,250,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary-base)] to-transparent animate-pulse"></div>
            <ScanLine size={32} className="text-[var(--primary-base)] mb-4 mt-2" />
            <p className="text-white font-bold tracking-widest text-lg mb-4">POSITION QR IN FRAME</p>
            <QRScanner tracking={true} onScan={handleScan} />
          </div>
        </div>
      )}

      {state === 'LOADING' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="card p-12 text-center border-[var(--primary-base)] border border-opacity-30">
            <div className="w-16 h-16 border-4 border-[var(--primary-base)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <div className="text-xl font-bold text-white tracking-widest animate-pulse">PROCESSING...</div>
          </div>
        </div>
      )}

      {state === 'STUDENT_LOADED' && student && (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in">
          <button onClick={resetScanner} className="flex items-center gap-2 text-[var(--muted)] hover:text-white font-bold tracking-widest text-sm uppercase self-start bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)]">
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className="card border-[var(--green)] border-2 bg-[rgba(74,222,128,0.05)] shadow-[0_0_20px_rgba(74,222,128,0.1)]">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-bold text-white tracking-wide">{student.username}</h2>
              <Trophy className="text-[var(--green)]" size={28} />
            </div>
            <p className="text-[var(--green)] text-xs font-bold tracking-widest uppercase opacity-80">{student.college}</p>
          </div>

          <div className="card flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[var(--muted)] font-bold tracking-widest uppercase ml-1">Select Game / Activity</label>
              <select 
                required 
                className="input-field text-xl py-4 font-bold tracking-widest bg-[rgba(23,23,31,0.95)] border-[var(--border)] appearance-none cursor-pointer"
                value={selectedGame} 
                onChange={e => setSelectedGame(e.target.value)}
              >
                <option value="">SELECT GAME...</option>
                {games.map(g => <option key={g.game_id} value={g.game_id}>{g.game_name.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-[var(--muted)] font-bold tracking-widest uppercase ml-1">Assign Points</label>
              <PointsInput value={points} onChange={setPoints} />
            </div>
          </div>

          <button 
            onClick={handleAddPoints} 
            disabled={points <= 0 || !selectedGame}
            className={`btn-primary w-full text-xl py-5 mt-4 tracking-widest font-bold border-2 ${points > 0 && selectedGame ? 'border-[var(--primary-base)] shadow-[0_0_20px_rgba(167,139,250,0.5)] bg-gradient-to-r from-[var(--primary-base)] to-[var(--accent)] text-white' : 'opacity-50 cursor-not-allowed bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'}`}
          >
            CONFIRM +{points} PTS
          </button>
        </div>
      )}

      {state === 'SUCCESS' && (
        <div className="flex-1 flex flex-col items-center justify-center py-6 gap-6 animate-fade-in">
          <div className="card w-full flex flex-col items-center gap-6 py-12 border-[var(--green)] border-2 shadow-[0_0_40px_rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--green)] opacity-10 blur-[80px]"></div>
            <div className="w-24 h-24 bg-[rgba(74,222,128,0.15)] rounded-full flex items-center justify-center mb-2 border border-[rgba(74,222,128,0.5)]">
              <Trophy size={48} className="text-[var(--green)] drop-shadow-lg" />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white tracking-widest mb-2">SUCCESS</h2>
              <p className="text-2xl text-[var(--green)] font-bold tracking-widest drop-shadow-md">+{points} PTS ASSIGNED</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full mt-4">
            <button onClick={resetScanner} className="btn-primary w-full text-xl py-5 tracking-widest font-bold shadow-[0_0_20px_rgba(167,139,250,0.4)]">
              SCAN NEXT STUDENT
            </button>
            <button onClick={handleUndo} className="btn-secondary w-full text-lg py-4 tracking-widest font-bold flex items-center justify-center gap-3 border-2 border-[var(--red)] text-[var(--red)] hover:bg-[rgba(248,113,113,0.1)] bg-[var(--surface)]">
              <RotateCcw size={20} /> UNDO LAST ACTION
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
