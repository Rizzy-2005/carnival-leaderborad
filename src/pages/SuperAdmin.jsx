import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  fetchAdmins, addAdmin, deleteAdmin,
  fetchGames, addGame, toggleGameStatus,
  fetchLogs, editScoreAPI
} from '../services/api'
import { LogOut, ShieldAlert, Gamepad2, ScrollText, Edit3, Trash2 } from 'lucide-react'

export default function SuperAdmin() {
  const { admin, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('admins')

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin-login')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col">
      <header className="flex justify-between items-center mb-8 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-md">
        <div className="flex items-center gap-4">
          <ShieldAlert size={36} className="text-[var(--primary-base)] drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-widest">SUPER COMMAND</h1>
            <p className="text-xs text-[var(--accent)] tracking-widest uppercase mt-1 font-bold">ROOT IDENT: {admin?.username}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[var(--muted)] hover:text-[var(--red)] transition-colors p-3 bg-[rgba(255,255,255,0.05)] rounded-full hover:bg-[rgba(248,113,113,0.1)]">
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="flex text-sm md:text-base md:flex-col gap-2 md:w-64 shrink-0 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          <button
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold tracking-widest transition-all whitespace-nowrap ${activeTab === 'admins' ? 'bg-[var(--primary-base)] text-white shadow-[0_0_20px_rgba(167,139,250,0.4)] border border-transparent' : 'bg-[var(--surface)] text-[var(--muted)] hover:text-white border border-[var(--border)]'}`}
            onClick={() => setActiveTab('admins')}
          >
            <ShieldAlert size={20} /> ADMINS
          </button>
          <button
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold tracking-widest transition-all whitespace-nowrap ${activeTab === 'games' ? 'bg-[var(--primary-base)] text-white shadow-[0_0_20px_rgba(167,139,250,0.4)] border border-transparent' : 'bg-[var(--surface)] text-[var(--muted)] hover:text-white border border-[var(--border)]'}`}
            onClick={() => setActiveTab('games')}
          >
            <Gamepad2 size={20} /> GAMES
          </button>
          <button
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold tracking-widest transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-[var(--primary-base)] text-white shadow-[0_0_20px_rgba(167,139,250,0.4)] border border-transparent' : 'bg-[var(--surface)] text-[var(--muted)] hover:text-white border border-[var(--border)]'}`}
            onClick={() => setActiveTab('logs')}
          >
            <ScrollText size={20} /> LOGS & EDIT
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 card p-0 overflow-hidden border-[var(--primary-base)] border border-opacity-30 min-h-[500px] shadow-[0_0_30px_rgba(167,139,250,0.05)]">
          {activeTab === 'admins' && <AdminsTab adminId={admin?.admin_id} />}
          {activeTab === 'games' && <GamesTab adminId={admin?.admin_id} />}
          {activeTab === 'logs' && <LogsTab adminId={admin.admin_id} />}
        </div>
      </div>
    </div>
  )
}

function AdminsTab({ adminId }) {
  const [admins, setAdmins] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [error, setError] = useState('')

  useEffect(() => { loadAdmins() }, [])

  const loadAdmins = async () => {
    try { setAdmins(await fetchAdmins()) } catch (err) { setError(err.message) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await addAdmin(username, password, role, adminId)
      setUsername(''); setPassword(''); setRole('ADMIN'); setError('')
      loadAdmins()
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin?')) return
    try {
      await deleteAdmin(id, adminId)
      loadAdmins()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Manage Admins</h2>
      {error && <div className="p-4 bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] rounded-lg text-sm mb-6 font-bold tracking-wide">{error}</div>}

      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-8 bg-[rgba(255,255,255,0.02)] p-6 rounded-xl border border-[var(--border)]">
        <input type="text" placeholder="Username" required className="input-field flex-1 bg-[rgba(23,23,31,0.8)]" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="text" placeholder="Password" required className="input-field flex-1 bg-[rgba(23,23,31,0.8)]" value={password} onChange={e => setPassword(e.target.value)} />
        <select className="input-field md:w-48 bg-[rgba(23,23,31,0.8)] uppercase tracking-widest font-bold text-sm" value={role} onChange={e => setRole(e.target.value)}>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <button type="submit" className="btn-primary whitespace-nowrap px-8 font-bold tracking-widest text-sm">+ ADD</button>
      </form>

      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 sm:pr-2 hide-scrollbar">
        {admins.map(a => (
          <div key={a.admin_id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 transition-colors hover:bg-[rgba(255,255,255,0.05)] gap-4">
            
            <div className="flex flex-col gap-1.5 pl-1">
              <span className="font-bold text-lg text-white tracking-wide">{a.username}</span>
              <span className={`w-fit text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${a.role === 'SUPER_ADMIN' ? 'bg-[rgba(255,0,127,0.1)] text-[var(--primary-base)] border-[rgba(255,0,127,0.2)]' : 'bg-[rgba(74,222,128,0.1)] text-[var(--green)] border-[rgba(74,222,128,0.2)]'}`}>
                {a.role}
              </span>
            </div>

            <div className="flex items-center self-end sm:self-auto">
              {a.role !== 'SUPER_ADMIN' && (
                <button 
                  onClick={() => handleDelete(a.admin_id)} 
                  className="text-[var(--red)] p-2 bg-[rgba(248,113,113,0.05)] hover:bg-[var(--red)] hover:text-white border border-[rgba(248,113,113,0.2)] hover:border-transparent rounded-lg transition-colors flex items-center gap-2 text-xs font-bold tracking-widest"
                >
                  <Trash2 size={16} /> REMOVE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GamesTab({ adminId }) {
  const [games, setGames] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadGames() }, [])

  const loadGames = async () => {
    try { setGames(await fetchGames()) } catch (err) { setError(err.message) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await addGame(name, adminId)
      setName(''); setError('')
      loadGames()
    } catch (err) { setError(err.message) }
  }

  const handleToggle = async (id, status) => {
    try {
      await toggleGameStatus(id, status, adminId)
      loadGames()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 tracking-wide text-white">Manage Games & Activities</h2>
      {error && <div className="p-4 bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] rounded-lg text-sm mb-6 font-bold tracking-wide">{error}</div>}

      <form onSubmit={handleAdd} className="flex gap-4 mb-8 bg-[rgba(255,255,255,0.02)] p-6 rounded-xl border border-[var(--border)]">
        <input type="text" placeholder="Game Name" required className="input-field flex-1 bg-[rgba(23,23,31,0.8)]" value={name} onChange={e => setName(e.target.value)} />
        <button type="submit" className="btn-primary px-8 font-bold tracking-widest whitespace-nowrap text-sm">+ ADD GAME</button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {games.map(g => (
          <div key={g.game_id} className="p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl flex flex-col justify-between gap-5 transition-colors hover:bg-[rgba(255,255,255,0.05)]">
            <span className="font-bold text-lg text-white tracking-wide truncate pl-1">{g.game_name}</span>

            <button
              onClick={() => handleToggle(g.game_id, g.status)}
              className={`w-full py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors border ${g.status === 'ACTIVE' ? 'border-[var(--green)] bg-[rgba(74,222,128,0.1)] text-[var(--green)] hover:bg-[rgba(74,222,128,0.15)]' : 'border-[var(--red)] bg-[rgba(248,113,113,0.1)] text-[var(--red)] hover:bg-[rgba(248,113,113,0.15)]'}`}
            >
              {g.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogsTab({ adminId }) {
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 20

  const [editingLog, setEditingLog] = useState(null)
  const [newPoints, setNewPoints] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadLogs() }, [page])

  const loadLogs = async () => {
    try {
      const { logs, count } = await fetchLogs(page, limit)
      setLogs(logs)
      setTotalCount(count)
    } catch (err) { setError(err.message) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editingLog) return
    try {
      await editScoreAPI({ score_id: editingLog.score_id, new_points: Number(newPoints), admin_id: adminId })
      setEditingLog(null)
      loadLogs()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-wide text-white">System Audit Logs</h2>
      </div>

      {error && <div className="p-4 bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)] rounded-lg text-sm mb-6 font-bold tracking-wide">{error}</div>}

      {/* Edit Modal Overlay */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <form onSubmit={handleEdit} className="card w-full max-w-sm border-[var(--primary-base)] border-2 shadow-[0_0_40px_rgba(167,139,250,0.2)]">
            <h3 className="text-xl font-bold mb-2 tracking-wide text-white">Modify Record</h3>
            <div className="text-[var(--muted)] text-sm mb-6 bg-[rgba(255,255,255,0.05)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
              <div className="mb-2"><span className="text-white font-bold tracking-widest">PLAYER:</span> {editingLog.students?.username}</div>
              <div className="mb-2"><span className="text-white font-bold tracking-widest">GAME:</span> {editingLog.games?.game_name}</div>
              <div><span className="text-white font-bold tracking-widest">OLD PTS:</span> {editingLog.action_type === 'ADD' ? editingLog.new_points : editingLog.old_points || editingLog.new_points}</div>
            </div>

            <input
              type="number" min="1" required className="input-field text-3xl py-4 font-bold text-center mb-6 border-[var(--primary-base)] bg-[rgba(0,0,0,0.5)]"
              value={newPoints} onChange={e => setNewPoints(e.target.value)}
              placeholder="0"
            />

            <div className="flex gap-4">
              <button type="button" onClick={() => setEditingLog(null)} className="btn-secondary flex-1 font-bold tracking-widest text-sm">CANCEL</button>
              <button type="submit" className="btn-primary flex-1 font-bold tracking-widest shadow-[0_0_20px_rgba(167,139,250,0.4)] text-sm border border-[var(--primary-base)]">COMMIT</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] tracking-widest uppercase text-xs">
              <th className="pb-4 font-bold">Timestamp</th>
              <th className="pb-4 font-bold">Op</th>
              <th className="pb-4 font-bold">Player</th>
              <th className="pb-4 font-bold">Game</th>
              <th className="pb-4 font-bold">Points</th>
              <th className="pb-4 font-bold">Admin</th>
              <th className="pb-4 font-bold text-right pt-1 pr-1">Modify</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.log_id} className="border-b border-[rgba(255,255,255,0.02)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="py-4 text-[var(--muted)] font-bold">{new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest ${log.action_type === 'ADD' ? 'bg-[rgba(74,222,128,0.1)] text-[var(--green)] border border-[rgba(74,222,128,0.2)]' : log.action_type === 'DELETE' ? 'bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.2)]' : 'bg-[rgba(167,139,250,0.1)] text-[var(--primary-base)] border border-[rgba(167,139,250,0.2)]'}`}>
                    {log.action_type}
                  </span>
                </td>
                <td className="py-4 font-bold text-white text-base">{log.students?.username}</td>
                <td className="py-4 text-[var(--accent)] font-bold">{log.games?.game_name}</td>
                <td className="py-4 font-bold text-[var(--green)] text-base">
                  {log.action_type === 'ADD' ? `+${log.new_points}` : log.action_type === 'DELETE' ? <span className="text-[var(--red)]">-{log.old_points}</span> : <span className="text-[var(--primary-base)]">{log.old_points} → {log.new_points}</span>}
                </td>
                <td className="py-4 text-[var(--muted)] font-bold">{log.admins?.username}</td>
                <td className="py-4 text-right pr-1">
                  {log.action_type === 'ADD' && log.score_id && (
                    <button onClick={() => { setEditingLog(log); setNewPoints(log.new_points) }} className="text-[var(--muted)] hover:text-white p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors">
                      <Edit3 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6 pt-6 border-t border-[var(--border)]">
        <button
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
          className="btn-secondary px-6 text-sm py-2 disabled:opacity-30 disabled:border-transparent disabled:text-[var(--muted)] font-bold tracking-widest"
        >
          PREV
        </button>
        <span className="text-[var(--muted)] text-sm tracking-widest font-bold">PAGE {page + 1} OF {Math.max(1, Math.ceil(totalCount / limit))}</span>
        <button
          disabled={(page + 1) * limit >= totalCount}
          onClick={() => setPage(p => p + 1)}
          className="btn-secondary px-6 text-sm py-2 disabled:opacity-30 disabled:border-transparent disabled:text-[var(--muted)] font-bold tracking-widest"
        >
          NEXT
        </button>
      </div>
    </div>
  )
}
